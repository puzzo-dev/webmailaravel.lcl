<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\SystemConfig;
use App\Models\Sender;

class CloudflareDnsService
{
    protected string $apiBaseUrl = 'https://api.cloudflare.com/client/v4';

    public function getConfig(): array
    {
        return SystemConfig::getCloudflareConfig();
    }

    public function isConfigured(): bool
    {
        $config = $this->getConfig();
        return !empty($config['api_token']) && !empty($config['zone_id']);
    }

    public function getHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->getConfig()['api_token'],
            'Content-Type' => 'application/json',
        ];
    }

    public function verifyZone(): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Cloudflare not configured'];
        }

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->get("{$this->apiBaseUrl}/zones/" . $this->getConfig()['zone_id']);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'zone' => [
                        'name' => $data['result']['name'] ?? '',
                        'status' => $data['result']['status'] ?? '',
                        'name_servers' => $data['result']['name_servers'] ?? [],
                    ],
                ];
            }
            return ['success' => false, 'error' => 'Failed to verify zone'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function createDnsRecord(string $type, string $name, string $content, int $ttl = 300, bool $proxied = false): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Cloudflare not configured'];
        }

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->post("{$this->apiBaseUrl}/zones/" . $this->getConfig()['zone_id'] . "/dns_records", [
                    'type' => $type,
                    'name' => $name,
                    'content' => $content,
                    'ttl' => $ttl,
                    'proxied' => $proxied,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'record_id' => $data['result']['id'] ?? null,
                    'name' => $name,
                    'type' => $type,
                    'content' => $content,
                ];
            }
            $error = $response->json()['errors'][0]['message'] ?? 'Unknown error';
            return ['success' => false, 'error' => $error, 'name' => $name, 'type' => $type];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'name' => $name, 'type' => $type];
        }
    }

    public function listDnsRecords(string $type = null): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Cloudflare not configured', 'records' => []];
        }

        try {
            $params = [];
            if ($type) $params['type'] = $type;

            $response = Http::withHeaders($this->getHeaders())
                ->get("{$this->apiBaseUrl}/zones/" . $this->getConfig()['zone_id'] . "/dns_records", $params);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'records' => $data['result'] ?? [],
                ];
            }
            return ['success' => false, 'error' => 'Failed to list DNS records', 'records' => []];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'records' => []];
        }
    }

    public function deleteDnsRecord(string $recordId): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Cloudflare not configured'];
        }

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->delete("{$this->apiBaseUrl}/zones/" . $this->getConfig()['zone_id'] . "/dns_records/{$recordId}");

            if ($response->successful()) {
                return ['success' => true];
            }
            return ['success' => false, 'error' => 'Failed to delete DNS record'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function generateDkimKeyPair(): array
    {
        $keyConfig = [
            'digest_alg' => 'sha256',
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ];

        $keyPair = openssl_pkey_new($keyConfig);
        if (!$keyPair) {
            throw new \RuntimeException('Failed to generate RSA key pair: ' . openssl_error_string());
        }

        openssl_pkey_export($keyPair, $privatePem);
        $publicKey = openssl_pkey_get_details($keyPair);
        $publicPem = $publicKey['key'];

        // Extract just the base64 key data without PEM headers for DNS record
        $publicKeyData = '';
        $publicLines = explode("\n", trim($publicPem));
        foreach ($publicLines as $line) {
            if (!str_starts_with($line, '-----')) {
                $publicKeyData .= trim($line);
            }
        }

        return [
            'private_key' => $privatePem,
            'public_key' => $publicKeyData,
            'selector' => 'pmta' . substr(md5(uniqid('', true)), 0, 4),
        ];
    }

    public function setupSenderDns(Sender $sender): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Cloudflare API not configured. Set the API token and zone ID in System Settings.',
            ];
        }

        $domain = $this->extractDomainFromEmail($sender->email);
        if (!$domain) {
            return ['success' => false, 'error' => 'Could not extract domain from sender email'];
        }

        $results = [];
        $allSuccess = true;

        // Generate DKIM key pair
        $dkimKeys = $this->generateDkimKeyPair();
        $selector = $dkimKeys['selector'];

        // Store DKIM private key on the sender
        $sender->dkim_private_key = $dkimKeys['private_key'];
        $sender->dkim_selector = $selector;
        $sender->save();

        // 1. SPF Record
        $spfContent = "v=spf1 include:" . config('mail.mailers.smtp.host', 'localhost') . " ~all";
        $spfResult = $this->createDnsRecord('TXT', $domain, $spfContent);
        $results['spf'] = $spfResult;
        if (!$spfResult['success']) $allSuccess = false;

        // 2. DKIM Record
        $dkimName = "{$selector}._domainkey.{$domain}";
        $dkimContent = "v=DKIM1; k=rsa; p={$dkimKeys['public_key']}";
        $dkimResult = $this->createDnsRecord('TXT', $dkimName, $dkimContent);
        $results['dkim'] = $dkimResult;
        if (!$dkimResult['success']) $allSuccess = false;

        // 3. DMARC Record
        $dmarcContent = "v=DMARC1; p=quarantine; rua=mailto:dmarc@{$domain}; pct=100; adkim=s; aspf=s";
        $dmarcResult = $this->createDnsRecord('TXT', "_dmarc.{$domain}", $dmarcContent);
        $results['dmarc'] = $dmarcResult;
        if (!$dmarcResult['success']) $allSuccess = false;

        // 4. MX Record (for bounce processing if needed)
        $mxResult = $this->createDnsRecord('MX', $domain, "10 mail.{$domain}");
        $results['mx'] = $mxResult;
        if (!$mxResult['success']) $allSuccess = false;

        return [
            'success' => $allSuccess,
            'domain' => $domain,
            'selector' => $selector,
            'records' => $results,
            'instructions' => $this->getManualInstructions($domain, $selector, $dkimKeys['public_key']),
        ];
    }

    public function checkSenderDns(Sender $sender): array
    {
        $domain = $this->extractDomainFromEmail($sender->email);
        if (!$domain) {
            return ['success' => false, 'error' => 'Could not extract domain from sender email'];
        }

        $records = $this->listDnsRecords('TXT');
        if (!$records['success']) {
            return ['success' => false, 'error' => $records['error']];
        }

        $allRecords = $records['records'];
        $status = [
            'spf' => false,
            'dkim' => false,
            'dmarc' => false,
        ];

        foreach ($allRecords as $record) {
            $name = $record['name'] ?? '';
            $content = $record['content'] ?? '';

            // Check SPF
            if ($name === $domain && str_contains($content, 'v=spf1')) {
                $status['spf'] = true;
                $status['spf_record'] = $content;
            }

            // Check DKIM
            $selector = $sender->dkim_selector ?? 'pmta';
            if ($name === "{$selector}._domainkey.{$domain}" && str_contains($content, 'v=DKIM1')) {
                $status['dkim'] = true;
                $status['dkim_record'] = $content;
            }

            // Check DMARC
            if ($name === "_dmarc.{$domain}" && str_contains($content, 'v=DMARC1')) {
                $status['dmarc'] = true;
                $status['dmarc_record'] = $content;
            }
        }

        return [
            'success' => true,
            'domain' => $domain,
            'status' => $status,
            'all_configured' => $status['spf'] && $status['dkim'] && $status['dmarc'],
        ];
    }

    public function getManualInstructions(string $domain, string $selector, string $publicKey): array
    {
        return [
            [
                'type' => 'SPF',
                'name' => $domain,
                'record_type' => 'TXT',
                'value' => "v=spf1 include:" . config('mail.mailers.smtp.host', 'localhost') . " ~all",
                'description' => 'Allows this server to send email on behalf of the domain',
            ],
            [
                'type' => 'DKIM',
                'name' => "{$selector}._domainkey.{$domain}",
                'record_type' => 'TXT',
                'value' => "v=DKIM1; k=rsa; p={$publicKey}",
                'description' => 'Enables email signing for authentication',
            ],
            [
                'type' => 'DMARC',
                'name' => "_dmarc.{$domain}",
                'record_type' => 'TXT',
                'value' => "v=DMARC1; p=quarantine; rua=mailto:dmarc@{$domain}; pct=100; adkim=s; aspf=s",
                'description' => 'Specifies how to handle emails that fail SPF/DKIM checks',
            ],
        ];
    }

    protected function extractDomainFromEmail(string $email): ?string
    {
        $parts = explode('@', $email);
        return count($parts) === 2 ? $parts[1] : null;
    }
}

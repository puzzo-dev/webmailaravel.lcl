<?php

namespace App\Services;

use App\Models\Domain;
use App\Models\BounceProcessingLog;
use App\Models\SuppressionList;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\SuppressionListTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class BounceProcessingService
{
    use LoggingTrait, ValidationTrait, SuppressionListTrait, FileProcessingTrait;

    public function __construct()
    {
    }

    /**
     * Process bounces for all domains that need it
     */
    public function processAllDomains(): array
    {
        $this->logMethodEntry(__METHOD__);

        $domains = Domain::needsBounceProcessing()->get();
        $results = [];

        foreach ($domains as $domain) {
            try {
                $result = $this->processDomainBounces($domain);
                $results[$domain->id] = $result;
            } catch (\Exception $e) {
                $this->logError('Failed to process bounces for domain', [
                    'domain_id' => $domain->id,
                    'domain_name' => $domain->name,
                    'error' => $e->getMessage()
                ]);
                
                $results[$domain->id] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'processed' => 0,
                    'suppressed' => 0
                ];
            }
        }

        $this->logMethodExit(__METHOD__, ['results' => $results]);
        return $results;
    }

    /**
     * Process bounces for a specific domain
     */
    public function processDomainBounces(Domain $domain): array
    {
        $this->logMethodEntry(__METHOD__, [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name
        ]);

        if (!$domain->isBounceProcessingConfigured()) {
            throw new \Exception('Bounce processing not properly configured for domain');
        }

        $connection = $this->createConnection($domain);
        $messages = $this->fetchBounceMessages($connection, $domain);
        $processed = 0;
        $suppressed = 0;

        foreach ($messages as $message) {
            try {
                $bounceData = $this->parseBounceMessage($message, $domain);
                
                if ($bounceData) {
                    $this->logBounceProcessing($domain, $bounceData);
                    
                    // Add to suppression list if it's a hard bounce or spam
                    if (in_array($bounceData['bounce_type'], ['hard', 'spam'])) {
                        SuppressionList::addEmail(
                            $bounceData['to_email'],
                            'bounce_processing',
                            'bounce_processing',
                            $bounceData['bounce_reason']
                        );
                        $suppressed++;
                    }
                    
                    $processed++;
                }
            } catch (\Exception $e) {
                $this->logError('Failed to process bounce message', [
                    'domain_id' => $domain->id,
                    'message_id' => $message['id'] ?? 'unknown',
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Update domain's last bounce check
        $domain->updateLastBounceCheck();

        $result = [
            'success' => true,
            'processed' => $processed,
            'suppressed' => $suppressed,
            'domain_name' => $domain->name
        ];

        $this->logInfo('Bounce processing completed', [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'processed' => $processed,
            'suppressed' => $suppressed
        ]);

        $this->logMethodExit(__METHOD__, $result);
        return $result;
    }

    /**
     * Create IMAP/POP3 connection
     */
    private function createConnection(Domain $domain): object
    {
        $protocol = strtolower($domain->bounce_protocol);
        $host = $domain->bounce_host;
        $port = $domain->bounce_port ?: ($protocol === 'imap' ? 993 : 995);
        $username = $domain->bounce_username;
        $password = Crypt::decryptString($domain->bounce_password);
        $ssl = $domain->bounce_ssl;

        $connectionString = $this->buildConnectionString($protocol, $host, $port, $ssl);
        
        $connection = $this->connectToMailbox($connectionString, $username, $password);
        
        if (!$connection) {
            throw new \Exception("Failed to connect to {$protocol} server");
        }

        return $connection;
    }

    /**
     * Build connection string
     */
    private function buildConnectionString(string $protocol, string $host, int $port, bool $ssl): string
    {
        $sslFlag = $ssl ? 'ssl' : 'tcp';
        return "{$protocol}://{$sslFlag}/{$host}:{$port}";
    }

    /**
     * Connect to mailbox
     */
    private function connectToMailbox(string $connectionString, string $username, string $password): object
    {
        $connection = imap_open($connectionString, $username, $password);
        
        if (!$connection) {
            throw new \Exception('Failed to connect to mailbox: ' . imap_last_error());
        }

        return $connection;
    }

    /**
     * Fetch bounce messages from mailbox
     */
    private function fetchBounceMessages(object $connection, Domain $domain): array
    {
        $mailbox = $domain->bounce_mailbox ?: 'INBOX';
        $messages = [];

        // Select mailbox
        if (!imap_reopen($connection, $connectionString . $mailbox)) {
            throw new \Exception('Failed to open mailbox: ' . imap_last_error());
        }

        $messageCount = imap_num_msg($connection);
        
        for ($i = 1; $i <= $messageCount; $i++) {
            $header = imap_headerinfo($connection, $i);
            $body = imap_body($connection, $i);
            
            $messages[] = [
                'id' => $i,
                'header' => $header,
                'body' => $body,
                'subject' => $header->subject ?? '',
                'from' => $header->from[0]->mailbox . '@' . $header->from[0]->host ?? '',
                'to' => $header->to[0]->mailbox . '@' . $header->to[0]->host ?? '',
                'date' => $header->date ?? ''
            ];
        }

        return $messages;
    }

    /**
     * Parse bounce message to extract bounce information
     */
    private function parseBounceMessage(array $message, Domain $domain): ?array
    {
        $subject = strtolower($message['subject']);
        $body = strtolower($message['body']);
        $rules = $domain->getBounceProcessingRules();

        // Check for bounce patterns
        $bounceType = $this->determineBounceType($subject, $body, $rules);
        
        if (!$bounceType) {
            return null;
        }

        // Extract recipient email
        $recipientEmail = $this->extractRecipientEmail($message, $body);
        
        if (!$recipientEmail) {
            return null;
        }

        // Extract bounce reason
        $bounceReason = $this->extractBounceReason($body, $rules[$bounceType . '_patterns'] ?? []);

        return [
            'message_id' => $message['id'],
            'from_email' => $message['from'],
            'to_email' => $recipientEmail,
            'bounce_type' => $bounceType,
            'bounce_reason' => $bounceReason,
            'raw_message' => $message
        ];
    }

    /**
     * Determine bounce type based on patterns
     */
    private function determineBounceType(string $subject, string $body, array $rules): ?string
    {
        $text = $subject . ' ' . $body;

        foreach ($rules as $type => $patterns) {
            foreach ($patterns as $pattern) {
                if (strpos($text, strtolower($pattern)) !== false) {
                    return str_replace('_patterns', '', $type);
                }
            }
        }

        return null;
    }

    /**
     * Extract recipient email from bounce message
     */
    private function extractRecipientEmail(array $message, string $body): ?string
    {
        // Try to extract from message headers first
        if (isset($message['to']) && $this->validateEmail($message['to'])) {
            return $message['to'];
        }

        // Try to extract from body using common patterns
        $patterns = [
            '/failed recipient:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i',
            '/original recipient:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i',
            '/to:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i',
            '/recipient:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $body, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Extract bounce reason from message body
     */
    private function extractBounceReason(string $body, array $patterns): string
    {
        foreach ($patterns as $pattern) {
            if (strpos($body, strtolower($pattern)) !== false) {
                return ucfirst($pattern);
            }
        }

        return 'Unknown bounce reason';
    }

    /**
     * Log bounce processing activity
     */
    private function logBounceProcessing(Domain $domain, array $bounceData): void
    {
        BounceProcessingLog::create([
            'domain_id' => $domain->id,
            'message_id' => $bounceData['message_id'],
            'from_email' => $bounceData['from_email'],
            'to_email' => $bounceData['to_email'],
            'bounce_reason' => $bounceData['bounce_reason'],
            'bounce_type' => $bounceData['bounce_type'],
            'status' => 'processed',
            'raw_message' => $bounceData['raw_message'],
            'processed_at' => now()
        ]);
    }

    /**
     * Test bounce processing connection
     */
    public function testConnection(Domain $domain): array
    {
        $this->logMethodEntry(__METHOD__, [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name
        ]);

        try {
            if (!$domain->isBounceProcessingConfigured()) {
                throw new \Exception('Bounce processing not properly configured');
            }

            $connection = $this->createConnection($domain);
            $messageCount = imap_num_msg($connection);
            
            imap_close($connection);

            $result = [
                'success' => true,
                'message' => 'Connection successful',
                'message_count' => $messageCount
            ];

            $this->logInfo('Bounce processing connection test successful', [
                'domain_id' => $domain->id,
                'message_count' => $messageCount
            ]);

            return $result;

        } catch (\Exception $e) {
            $this->logError('Bounce processing connection test failed', [
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get bounce processing statistics for a domain
     */
    public function getBounceStatistics(Domain $domain, int $days = 30): array
    {
        return BounceProcessingLog::getBounceStatistics($domain->id, $days);
    }
} 
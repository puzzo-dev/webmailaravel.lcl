<?php

namespace App\Services;

use App\Models\Domain;
use App\Models\BounceCredential;
use App\Models\BounceProcessingLog;
use App\Models\SuppressionList;
use App\Services\PowerMTAService;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\SuppressionListTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class BounceProcessingService
{
    use LoggingTrait, ValidationTrait, SuppressionListTrait, FileProcessingTrait;

    protected $powerMTAService;

    public function __construct(PowerMTAService $powerMTAService)
    {
        $this->powerMTAService = $powerMTAService;
    }

    /**
     * Process bounces for all domains that need it
     */
    public function processAllDomains(): array
    {
        $this->logMethodEntry(__METHOD__);

        // Get all active bounce credentials that need checking
        $credentials = BounceCredential::active()
            ->with(['domain', 'user'])
            ->get()
            ->filter(function ($credential) {
                return $credential->needsCheck();
            });

        $results = [];

        foreach ($credentials as $credential) {
            try {
                $result = $this->processCredentialBounces($credential);
                $key = $credential->domain_id ? "domain_{$credential->domain_id}" : "user_{$credential->user_id}_default";
                $results[$key] = $result;
            } catch (\Exception $e) {
                $this->logError('Failed to process bounces for credential', [
                    'credential_id' => $credential->id,
                    'domain_id' => $credential->domain_id,
                    'user_id' => $credential->user_id,
                    'error' => $e->getMessage()
                ]);
                
                $key = $credential->domain_id ? "domain_{$credential->domain_id}" : "user_{$credential->user_id}_default";
                $results[$key] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'processed' => 0,
                    'suppressed' => 0
                ];
            }
        }

        $this->logMethodExit(__METHOD__, ['results' => $results]);
        // Also process PowerMTA files for all domains
        $pmtaResults = $this->processPowerMTAFiles();
        $results['powermta_processing'] = $pmtaResults;

        return $results;
    }

    /**
     * Process bounces for a specific bounce credential
     */
    public function processCredentialBounces(BounceCredential $credential): array
    {
        $this->logMethodEntry(__METHOD__, [
            'credential_id' => $credential->id,
            'domain_id' => $credential->domain_id,
            'user_id' => $credential->user_id
        ]);

        $connection = $this->createConnectionFromCredential($credential);
        $messages = $this->fetchBounceMessages($connection, $credential);
        $processed = 0;
        $suppressed = 0;

        foreach ($messages as $message) {
            try {
                $bounceData = $this->parseBounceMessage($message, $credential);
                
                if ($bounceData) {
                    $this->logBounceProcessing($credential, $bounceData);
                    
                    // Add to suppression list if it's a hard bounce or spam
                    if (in_array($bounceData['bounce_type'], ['hard', 'spam'])) {
                        SuppressionList::addEmail(
                            $bounceData['to_email'],
                            'bounce',
                            'bounce_processing',
                            $bounceData['bounce_reason']
                        );
                        $suppressed++;
                    }
                    
                    $processed++;
                }
            } catch (\Exception $e) {
                $this->logError('Failed to process bounce message', [
                    'credential_id' => $credential->id,
                    'message_id' => $message['id'] ?? 'unknown',
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Update credential's last checked timestamp and stats
        $credential->updateLastChecked();
        $credential->incrementProcessedCount($processed);
        $credential->clearError(); // Clear any previous errors on success

        $result = [
            'success' => true,
            'processed' => $processed,
            'suppressed' => $suppressed,
            'credential_id' => $credential->id,
            'domain_name' => $credential->domain ? $credential->domain->name : 'default'
        ];

        $this->logInfo('Bounce processing completed', [
            'credential_id' => $credential->id,
            'domain_id' => $credential->domain_id,
            'user_id' => $credential->user_id,
            'processed' => $processed,
            'suppressed' => $suppressed
        ]);

        $this->logMethodExit(__METHOD__, $result);
        return $result;
    }

    /**
     * Process bounces for a specific domain (backwards compatibility)
     */
    public function processDomainBounces(Domain $domain): array
    {
        // Try to get domain-specific credential or fallback to user default
        $credential = BounceCredential::getForDomain($domain);
        
        if (!$credential) {
            // Fallback to old domain-based configuration
            return $this->processDomainBouncesLegacy($domain);
        }

        return $this->processCredentialBounces($credential);
    }

    /**
     * Create IMAP/POP3 connection from bounce credential
     */
    private function createConnectionFromCredential(BounceCredential $credential): object
    {
        $connectionString = $credential->getConnectionString();
        $mailbox = $connectionString . ($credential->settings['mailbox'] ?? 'INBOX');
        $username = $credential->username;
        $password = $credential->getDecryptedPassword();
        
        $connection = $this->connectToMailbox($mailbox, $username, $password);
        
        if (!$connection) {
            $error = "Failed to connect to {$credential->protocol} server: " . imap_last_error();
            $credential->recordError($error);
            throw new \Exception($error);
        }

        return $connection;
    }

    /**
     * Create IMAP/POP3 connection (legacy domain-based)
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

    /**
     * Process PowerMTA files for bounce detection and suppression
     */
    public function processPowerMTAFiles(): array
    {
        $this->logInfo('Starting PowerMTA file processing for bounce detection');
        
        $results = [
            'acct_files_processed' => 0,
            'diag_files_processed' => 0,
            'fbl_files_processed' => 0,
            'total_bounces_added' => 0,
            'total_complaints_added' => 0,
            'total_failures_added' => 0,
            'errors' => []
        ];

        try {
            // Process Accounting files for failed deliveries
            $acctResults = $this->processAccountingFiles();
            $results['acct_files_processed'] = $acctResults['files_processed'];
            $results['total_failures_added'] += $acctResults['emails_added'];
            
            // Process Diagnostic files for bounces
            $diagResults = $this->processDiagnosticFiles();
            $results['diag_files_processed'] = $diagResults['files_processed'];
            $results['total_bounces_added'] += $diagResults['emails_added'];
            
            // Process FBL files for complaints
            $fblResults = $this->processFBLFiles();
            $results['fbl_files_processed'] = $fblResults['files_processed'];
            $results['total_complaints_added'] += $fblResults['emails_added'];
            
            $results['errors'] = array_merge(
                $acctResults['errors'] ?? [],
                $diagResults['errors'] ?? [],
                $fblResults['errors'] ?? []
            );

            $this->logInfo('PowerMTA file processing completed', $results);
            
        } catch (\Exception $e) {
            $this->logError('PowerMTA file processing failed', ['error' => $e->getMessage()]);
            $results['errors'][] = 'General processing error: ' . $e->getMessage();
        }

        return $results;
    }

    /**
     * Process PowerMTA accounting files for failed deliveries
     */
    protected function processAccountingFiles(): array
    {
        $results = ['files_processed' => 0, 'emails_added' => 0, 'errors' => []];
        
        try {
            $csvPath = config('services.powermta.csv_path', '/var/log/powermta');
            $acctFiles = glob($csvPath . '/acct*.csv');
            
            foreach ($acctFiles as $file) {
                // Only process files from last 24 hours
                if (filemtime($file) < strtotime('-24 hours')) {
                    continue;
                }
                
                try {
                    $processed = $this->processAccountingFile($file);
                    $results['files_processed']++;
                    $results['emails_added'] += $processed;
                } catch (\Exception $e) {
                    $results['errors'][] = "Accounting file {$file}: " . $e->getMessage();
                }
            }
            
        } catch (\Exception $e) {
            $results['errors'][] = 'Accounting processing error: ' . $e->getMessage();
        }
        
        return $results;
    }

    /**
     * Process single accounting CSV file
     */
    protected function processAccountingFile(string $filePath): int
    {
        $addedCount = 0;
        
        if (($handle = fopen($filePath, 'r')) !== false) {
            $headers = fgetcsv($handle);
            
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= count($headers)) {
                    $data = array_combine($headers, $row);
                    
                    // Check for failed deliveries
                    $status = strtolower($data['status'] ?? $data['result'] ?? '');
                    $recipient = $data['recipient'] ?? $data['email'] ?? $data['to'] ?? '';
                    
                    if (!empty($recipient) && $this->validateEmail($recipient)) {
                        // Add to suppression if delivery failed
                        if (strpos($status, 'failed') !== false || 
                            strpos($status, 'bounced') !== false ||
                            strpos($status, 'rejected') !== false) {
                            
                            $this->addToSuppressionList(
                                $recipient,
                                'pmta_failure',
                                'bounce',
                                'PowerMTA delivery failure: ' . $status
                            );
                            $addedCount++;
                        }
                    }
                }
            }
            fclose($handle);
        }
        
        return $addedCount;
    }

    /**
     * Process PowerMTA diagnostic files for bounces
     */
    protected function processDiagnosticFiles(): array
    {
        $results = ['files_processed' => 0, 'emails_added' => 0, 'errors' => []];
        
        try {
            $csvPath = config('services.powermta.csv_path', '/var/log/powermta');
            $diagFiles = glob($csvPath . '/diag*.csv');
            
            foreach ($diagFiles as $file) {
                // Only process files from last 24 hours
                if (filemtime($file) < strtotime('-24 hours')) {
                    continue;
                }
                
                try {
                    $processed = $this->processDiagnosticFile($file);
                    $results['files_processed']++;
                    $results['emails_added'] += $processed;
                } catch (\Exception $e) {
                    $results['errors'][] = "Diagnostic file {$file}: " . $e->getMessage();
                }
            }
            
        } catch (\Exception $e) {
            $results['errors'][] = 'Diagnostic processing error: ' . $e->getMessage();
        }
        
        return $results;
    }

    /**
     * Process single diagnostic CSV file
     */
    protected function processDiagnosticFile(string $filePath): int
    {
        $addedCount = 0;
        
        if (($handle = fopen($filePath, 'r')) !== false) {
            $headers = fgetcsv($handle);
            
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= count($headers)) {
                    $data = array_combine($headers, $row);
                    
                    $recipient = $data['recipient'] ?? $data['email'] ?? $data['to'] ?? '';
                    $bounceType = $data['bounce_type'] ?? $data['type'] ?? '';
                    $reason = $data['reason'] ?? $data['message'] ?? $data['status'] ?? '';
                    
                    if (!empty($recipient) && $this->validateEmail($recipient)) {
                        // Add permanent bounces to suppression
                        if (strpos(strtolower($bounceType), 'hard') !== false ||
                            strpos(strtolower($reason), 'permanent') !== false ||
                            strpos(strtolower($reason), '5.') !== false) {
                            
                            $this->addToSuppressionList(
                                $recipient,
                                'pmta_bounce',
                                'bounce',
                                'PowerMTA hard bounce: ' . $reason
                            );
                            $addedCount++;
                        }
                    }
                }
            }
            fclose($handle);
        }
        
        return $addedCount;
    }

    /**
     * Process PowerMTA FBL files for complaints
     */
    protected function processFBLFiles(): array
    {
        $results = ['files_processed' => 0, 'emails_added' => 0, 'errors' => []];
        
        try {
            $csvPath = config('services.powermta.csv_path', '/var/log/powermta');
            $fblFiles = glob($csvPath . '/fbl*.csv');
            
            foreach ($fblFiles as $file) {
                // Only process files from last 24 hours
                if (filemtime($file) < strtotime('-24 hours')) {
                    continue;
                }
                
                try {
                    $processed = $this->processFBLFile($file, 'pmta_auto');
                    $results['files_processed']++;
                    $results['emails_added'] += $processed['added'];
                } catch (\Exception $e) {
                    $results['errors'][] = "FBL file {$file}: " . $e->getMessage();
                }
            }
            
        } catch (\Exception $e) {
            $results['errors'][] = 'FBL processing error: ' . $e->getMessage();
        }
        
        return $results;
    }

    /**
     * Add email to suppression list with PowerMTA context
     */
    protected function addToSuppressionList(string $email, string $source, string $type, string $reason): bool
    {
        try {
            // Check if already in suppression list
            if (SuppressionList::where('email', $email)->exists()) {
                return false;
            }
            
            SuppressionList::create([
                'email' => $email,
                'type' => $type,
                'source' => $source,
                'reason' => $reason,
                'added_at' => now(),
                'is_active' => true
            ]);
            
            $this->logInfo('Email added to suppression list from PowerMTA', [
                'email' => $email,
                'source' => $source,
                'type' => $type,
                'reason' => $reason
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            $this->logError('Failed to add email to suppression list', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
} 
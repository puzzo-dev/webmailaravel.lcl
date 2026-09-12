<?php

namespace App\Services;

use App\Models\BounceCredential;
use App\Models\BounceProcessingLog;
use App\Models\SuppressionList;
use App\Traits\FileProcessingTrait;
use App\Traits\LoggingTrait;
use App\Traits\SuppressionListTrait;
use App\Traits\ValidationTrait;
use Illuminate\Support\Facades\Log;

class BounceProcessingService
{
    use FileProcessingTrait, LoggingTrait, SuppressionListTrait, ValidationTrait;

    protected $powerMTAService;

    public function __construct(PowerMTAService $powerMTAService)
    {
        $this->powerMTAService = $powerMTAService;
    }

    /**
     * Process bounces for all credentials that need it
     */
    public function processAllBounces(): array
    {
        $this->logMethodEntry(__METHOD__);

        $credentials = BounceCredential::active()
            ->with(['user'])
            ->get()
            ->filter(function ($credential) {
                return $credential->needsCheck();
            });

        $results = [];

        foreach ($credentials as $credential) {
            try {
                $result = $this->processCredentialBounces($credential);
                $results["credential_{$credential->id}"] = $result;
            } catch (\Exception $e) {
                $this->logError('Failed to process bounces for credential', [
                    'credential_id' => $credential->id,
                    'user_id' => $credential->user_id,
                    'error' => $e->getMessage(),
                ]);

                $results["credential_{$credential->id}"] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'processed' => 0,
                    'suppressed' => 0,
                ];
            }
        }

        $this->logMethodExit(__METHOD__, ['results' => $results]);
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
            'user_id' => $credential->user_id,
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

                    if (in_array($bounceData['bounce_type'], ['hard', 'spam'])) {
                        SuppressionList::addEmail(
                            $bounceData['bounce_email'],
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
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $credential->updateLastChecked();
        $credential->incrementProcessedCount($processed);
        $credential->clearError();

        $result = [
            'success' => true,
            'processed' => $processed,
            'suppressed' => $suppressed,
            'credential_id' => $credential->id,
        ];

        $this->logInfo('Bounce processing completed', [
            'credential_id' => $credential->id,
            'user_id' => $credential->user_id,
            'processed' => $processed,
            'suppressed' => $suppressed,
        ]);

        $this->logMethodExit(__METHOD__, $result);

        return $result;
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
    private function fetchBounceMessages(object $connection, BounceCredential $credential): array
    {
        $mailbox = 'INBOX';
        $messages = [];

        $connectionString = $this->buildConnectionString(
            strtolower($credential->protocol ?: 'imap'),
            $credential->host,
            $credential->port ?: 993,
            (bool) $credential->encryption
        );

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
                'date' => $header->date ?? '',
            ];
        }

        return $messages;
    }

    /**
     * Parse bounce message to extract bounce information
     */
    private function parseBounceMessage(array $message, BounceCredential $credential): ?array
    {
        $subject = strtolower($message['subject']);
        $body = strtolower($message['body']);
        $rules = [
            'hard_bounce_patterns' => ['user not found', 'mailbox not found', 'no such user', 'does not exist', 'unknown user'],
            'soft_bounce_patterns' => ['mailbox full', 'quota exceeded', 'temporarily unavailable', 'try again later'],
            'spam_patterns' => ['spam', 'blocked', 'rejected', 'filtered'],
            'block_patterns' => ['blocked', 'rejected', 'not allowed', 'forbidden'],
        ];

        $bounceType = $this->determineBounceType($subject, $body, $rules);

        if (!$bounceType) {
            return null;
        }

        $recipientEmail = $this->extractRecipientEmail($message, $body);

        if (!$recipientEmail) {
            return null;
        }

        $bounceReason = $this->extractBounceReason($body, $rules[$bounceType . '_patterns'] ?? []);

        return [
            'message_id' => $message['id'],
            'bounce_email' => $recipientEmail,
            'bounce_type' => $bounceType,
            'bounce_reason' => $bounceReason,
            'raw_message' => json_encode($message),
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
        if (isset($message['to']) && $this->validateEmail($message['to'])) {
            return $message['to'];
        }

        $patterns = [
            '/failed recipient:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i',
            '/original recipient:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i',
            '/to:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i',
            '/recipient:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i',
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
    private function logBounceProcessing(BounceCredential $credential, array $bounceData): void
    {
        BounceProcessingLog::create([
            'bounce_credential_id' => $credential->id,
            'user_id' => $credential->user_id,
            'message_id' => $bounceData['message_id'] ?? null,
            'bounce_email' => $bounceData['bounce_email'],
            'bounce_reason' => $bounceData['bounce_reason'],
            'bounce_type' => $bounceData['bounce_type'],
            'processing_status' => 'processed',
            'raw_message' => $bounceData['raw_message'] ?? null,
            'added_to_suppression' => true,
        ]);
    }

    /**
     * Test bounce credential connection
     */
    public function testCredentialConnection(BounceCredential $credential): array
    {
        try {
            $result = $credential->testConnection();
            return $result;
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
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
            'errors' => [],
        ];

        try {
            $acctResults = $this->processAccountingFiles();
            $results['acct_files_processed'] = $acctResults['files_processed'];
            $results['total_failures_added'] += $acctResults['emails_added'];

            $diagResults = $this->processDiagnosticFiles();
            $results['diag_files_processed'] = $diagResults['files_processed'];
            $results['total_bounces_added'] += $diagResults['emails_added'];

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
        $csvData = $this->processCSVFile($filePath, true);

        foreach ($csvData as $row) {
            $status = strtolower($row['status'] ?? $row['result'] ?? '');
            $recipient = $row['recipient'] ?? $row['email'] ?? $row['to'] ?? '';

            if (!empty($recipient) && $this->validateEmail($recipient)) {
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
        $csvData = $this->processCSVFile($filePath, true);

        foreach ($csvData as $row) {
            $bounceType = strtolower($row['bounce_type'] ?? $row['type'] ?? '');
            $recipient = $row['recipient'] ?? $row['email'] ?? $row['to'] ?? '';

            if (!empty($recipient) && $this->validateEmail($recipient)) {
                if (in_array($bounceType, ['hard', 'permanent', '5.1.1', '5.1.2', '5.2.0'])) {
                    $this->addToSuppressionList(
                        $recipient,
                        'pmta_bounce',
                        'bounce',
                        'PowerMTA bounce: ' . $bounceType
                    );
                    $addedCount++;
                }
            }
        }

        return $addedCount;
    }

    /**
     * Process FBL (Feedback Loop) files for complaints
     */
    protected function processFBLFiles(): array
    {
        $results = ['files_processed' => 0, 'emails_added' => 0, 'errors' => []];

        try {
            $csvPath = config('services.powermta.csv_path', '/var/log/powermta');
            $fblFiles = glob($csvPath . '/fbl*.csv');

            foreach ($fblFiles as $file) {
                if (filemtime($file) < strtotime('-24 hours')) {
                    continue;
                }

                try {
                    $processed = $this->processFBLFile($file);
                    $results['files_processed']++;
                    $results['emails_added'] += $processed;
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
     * Process single FBL CSV file
     */
    protected function processFBLFile(string $filePath): int
    {
        $addedCount = 0;
        $csvData = $this->processCSVFile($filePath, true);

        foreach ($csvData as $row) {
            $recipient = $row['recipient'] ?? $row['email'] ?? $row['original_recipient'] ?? '';

            if (!empty($recipient) && $this->validateEmail($recipient)) {
                $this->addToSuppressionList(
                    $recipient,
                    'pmta_complaint',
                    'complaint',
                    'PowerMTA FBL complaint'
                );
                $addedCount++;
            }
        }

        return $addedCount;
    }

    /**
     * Build connection string
     */
    private function buildConnectionString(string $protocol, string $host, int $port, bool $ssl): string
    {
        $sslFlag = $ssl ? 'ssl' : 'tcp';
        return "{$protocol}://{$sslFlag}/{$host}:{$port}";
    }
}

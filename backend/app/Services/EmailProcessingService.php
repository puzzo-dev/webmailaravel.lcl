<?php

namespace App\Services;

use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\SuppressionListTrait;
use Illuminate\Support\Facades\Log;

class EmailProcessingService
{
    use LoggingTrait, ValidationTrait, SuppressionListTrait;

    /**
     * Validate email address using centralized logic
     */
    public function validateEmailAddress(string $email): bool
    {
        return $this->validateEmail($email);
    }

    /**
     * Validate multiple email addresses
     */
    public function validateEmailAddresses(array $emails): array
    {
        $valid = [];
        $invalid = [];

        foreach ($emails as $email) {
            if ($this->validateEmailAddress(trim($email))) {
                $valid[] = trim($email);
            } else {
                $invalid[] = trim($email);
            }
        }

        return [
            'valid' => $valid,
            'invalid' => $invalid,
            'valid_count' => count($valid),
            'invalid_count' => count($invalid)
        ];
    }

    /**
     * Filter emails against suppression list
     */
    public function filterSuppressedEmails(array $emails): array
    {
        $filtered = [];
        $suppressed = [];

        foreach ($emails as $email) {
            if ($this->shouldSuppressEmail($email)) {
                $suppressed[] = $email;
            } else {
                $filtered[] = $email;
            }
        }

        $this->logInfo('Emails filtered against suppression list', [
            'total_emails' => count($emails),
            'filtered_count' => count($filtered),
            'suppressed_count' => count($suppressed)
        ]);

        return [
            'filtered' => $filtered,
            'suppressed' => $suppressed,
            'filtered_count' => count($filtered),
            'suppressed_count' => count($suppressed)
        ];
    }

    /**
     * Process recipient data from uploaded file
     */
    public function processRecipientData(array $data): array
    {
        $emails = [];
        $recipientData = [];

        // Extract emails and additional data from processed file data
        if (isset($data['emails'])) {
            $emails = $data['emails'];
        } elseif (isset($data['recipients'])) {
            foreach ($data['recipients'] as $recipient) {
                if (is_array($recipient)) {
                    $emails[] = $recipient['email'] ?? '';
                    $recipientData[$recipient['email'] ?? ''] = $recipient;
                } else {
                    $emails[] = $recipient;
                }
            }
        } else {
            // Fallback: treat data as array of emails
            $emails = array_filter($data, 'strlen');
        }

        // Validate emails
        $validation = $this->validateEmailAddresses($emails);
        
        // Filter suppressed emails
        $suppression = $this->filterSuppressedEmails($validation['valid']);

        $this->logInfo('Recipient data processed', [
            'total_input' => count($emails),
            'valid_emails' => $validation['valid_count'],
            'invalid_emails' => $validation['invalid_count'],
            'final_filtered' => $suppression['filtered_count'],
            'suppressed' => $suppression['suppressed_count']
        ]);

        return [
            'emails' => $suppression['filtered'],
            'recipient_data' => $recipientData,
            'validation_summary' => $validation,
            'suppression_summary' => $suppression
        ];
    }

    /**
     * Create filtered recipient file
     */
    public function createFilteredRecipientFile(array $emails, string $campaignName): string
    {
        $filteredContent = implode("\n", $emails);
        $filteredPath = 'recipient_lists/filtered_' . $campaignName . '_' . time() . '.txt';

        $this->writeFile($filteredPath, $filteredContent, ['disk' => 'local']);

        $this->logInfo('Filtered recipient file created', [
            'path' => $filteredPath,
            'email_count' => count($emails),
            'campaign_name' => $campaignName
        ]);

        return $filteredPath;
    }
}

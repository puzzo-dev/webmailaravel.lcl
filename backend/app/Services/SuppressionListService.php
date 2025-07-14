<?php

namespace App\Services;

use App\Models\SuppressionList;
use App\Models\EmailTracking;
use App\Models\Campaign;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheServiceTrait;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SuppressionListService
{
    use LoggingTrait, ValidationTrait, CacheServiceTrait;

    /**
     * Process FBL CSV file and add to suppression list
     */
    public function processFBLFile(string $filepath, string $source = 'fbl'): array
    {
        $this->logMethodEntry(__METHOD__, ['filepath' => $filepath, 'source' => $source]);

        try {
            if (!Storage::disk('local')->exists($filepath)) {
                throw new \Exception('FBL file not found: ' . $filepath);
            }

            $content = Storage::disk('local')->get($filepath);
            $lines = array_filter(array_map('trim', explode("\n", $content)));
            
            $processed = 0;
            $added = 0;
            $skipped = 0;

            foreach ($lines as $line) {
                $processed++;
                
                // Skip header line
                if (strpos(strtolower($line), 'email') !== false || strpos(strtolower($line), 'address') !== false) {
                    continue;
                }

                // Parse CSV line
                $data = str_getcsv($line);
                if (count($data) < 1) {
                    $skipped++;
                    continue;
                }

                $email = trim($data[0]);
                
                if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $metadata = [
                        'fbl_file' => $filepath,
                        'processed_at' => now()->toISOString(),
                        'line_number' => $processed,
                        'raw_data' => $line
                    ];

                    // Add additional data if available
                    if (count($data) > 1) {
                        $metadata['reason'] = trim($data[1] ?? '');
                    }
                    if (count($data) > 2) {
                        $metadata['date'] = trim($data[2] ?? '');
                    }

                    SuppressionList::addEmail(
                        $email,
                        'fbl',
                        $source,
                        'FBL complaint from ' . $source,
                        $metadata
                    );
                    
                    $added++;
                } else {
                    $skipped++;
                }
            }

            $this->logInfo('FBL file processed', [
                'filepath' => $filepath,
                'processed' => $processed,
                'added' => $added,
                'skipped' => $skipped
            ]);

            return [
                'success' => true,
                'processed' => $processed,
                'added' => $added,
                'skipped' => $skipped,
                'filepath' => $filepath
            ];

        } catch (\Exception $e) {
            $this->logError('FBL file processing failed', [
                'filepath' => $filepath,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Handle unsubscribe request
     */
    public function handleUnsubscribe(string $emailId, string $email, array $metadata = []): array
    {
        $this->logMethodEntry(__METHOD__, ['email_id' => $emailId, 'email' => $email]);

        try {
            // Find email tracking record
            $emailTracking = EmailTracking::where('email_id', $emailId)->first();
            
            if ($emailTracking) {
                // Update email tracking
                $emailTracking->update([
                    'unsubscribed_at' => now(),
                    'ip_address' => $metadata['ip_address'] ?? null,
                    'user_agent' => $metadata['user_agent'] ?? null
                ]);

                // Add to suppression list
                SuppressionList::addEmail(
                    $email,
                    'unsubscribe',
                    'campaign_' . $emailTracking->campaign_id,
                    'User unsubscribed via email link',
                    array_merge($metadata, [
                        'campaign_id' => $emailTracking->campaign_id,
                        'email_tracking_id' => $emailTracking->id,
                        'unsubscribed_at' => now()->toISOString()
                    ])
                );

                $this->logInfo('User unsubscribed', [
                    'email' => $email,
                    'email_id' => $emailId,
                    'campaign_id' => $emailTracking->campaign_id
                ]);

                return [
                    'success' => true,
                    'message' => 'Successfully unsubscribed',
                    'campaign_id' => $emailTracking->campaign_id
                ];
            }

            // If no tracking record found, still add to suppression list
            SuppressionList::addEmail(
                $email,
                'unsubscribe',
                'manual',
                'User unsubscribed (no tracking record)',
                $metadata
            );

            return [
                'success' => true,
                'message' => 'Successfully unsubscribed',
                'note' => 'No campaign tracking record found'
            ];

        } catch (\Exception $e) {
            $this->logError('Unsubscribe failed', [
                'email' => $email,
                'email_id' => $emailId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Check if email should be suppressed during campaign sending
     */
    public function shouldSuppressEmail(string $email, int $campaignId = null): bool
    {
        $cacheKey = "suppression_check_" . md5($email);
        
        return $this->cache($cacheKey, function() use ($email) {
            return SuppressionList::isSuppressed($email);
        }, 3600); // Cache for 1 hour
    }

    /**
     * Get suppression list statistics
     */
    public function getStatistics(): array
    {
        return SuppressionList::getStatistics();
    }

    /**
     * Export suppression list
     */
    public function exportSuppressionList(string $filename = null): string
    {
        return SuppressionList::exportToFile($filename);
    }

    /**
     * Import suppression list from file
     */
    public function importSuppressionList(string $filepath, string $type = 'manual', string $source = null): array
    {
        return SuppressionList::importFromFile($filepath, $type, $source);
    }

    /**
     * Clean up old suppression entries
     */
    public function cleanupOldEntries(int $days = 365): int
    {
        return SuppressionList::cleanupOldEntries($days);
    }

    /**
     * Get suppression list for campaign sending
     */
    public function getSuppressionListForCampaign(int $campaignId): array
    {
        $cacheKey = "suppression_list_campaign_{$campaignId}";
        
        return $this->cache($cacheKey, function() {
            return SuppressionList::getAllEmails();
        }, 1800); // Cache for 30 minutes
    }

    /**
     * Remove email from suppression list (admin function)
     */
    public function removeFromSuppressionList(string $email): bool
    {
        $result = SuppressionList::removeEmail($email);
        
        if ($result) {
            $this->logInfo('Email removed from suppression list', ['email' => $email]);
        }
        
        return $result;
    }
} 
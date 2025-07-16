<?php

namespace App\Traits;

use App\Models\SuppressionList;
use App\Models\EmailTracking;
use App\Models\Campaign;
use Illuminate\Support\Facades\Storage;

trait SuppressionListTrait
{
    use LoggingTrait, CacheManagementTrait, ValidationTrait;

    /**
     * Process FBL CSV file and add to suppression list
     */
    protected function processFBLFile(string $filepath, string $source = 'fbl'): array
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
                
                if ($this->validateEmail($email)) {
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
    protected function handleUnsubscribe(string $emailId, string $email, array $metadata = []): array
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
    protected function shouldSuppressEmail(string $email, int $campaignId = null): bool
    {
        $cacheKey = "suppression_check_" . md5($email);
        
        return $this->cache($cacheKey, function() use ($email) {
            return SuppressionList::isSuppressed($email);
        }, 3600); // Cache for 1 hour
    }

    /**
     * Get suppression list statistics
     */
    protected function getSuppressionStatistics(): array
    {
        $cacheKey = 'suppression_statistics';
        
        return $this->cache($cacheKey, function() {
            $total = SuppressionList::count();
            $byType = SuppressionList::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();
            
            $bySource = SuppressionList::selectRaw('source, count(*) as count')
                ->groupBy('source')
                ->pluck('count', 'source')
                ->toArray();
            
            $recent = SuppressionList::where('created_at', '>=', now()->subDays(7))->count();
            
            return [
                'total' => $total,
                'by_type' => $byType,
                'by_source' => $bySource,
                'recent_7_days' => $recent
            ];
        }, 1800); // Cache for 30 minutes
    }

    /**
     * Export suppression list to file
     */
    protected function exportSuppressionList(string $filename = null): string
    {
        $filename = $filename ?: 'suppression_list_' . date('Y-m-d_H-i-s') . '.csv';
        $filepath = 'suppression_lists/' . $filename;
        
        $emails = SuppressionList::select('email', 'type', 'source', 'reason', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $content = "Email,Type,Source,Reason,Created At\n";
        foreach ($emails as $email) {
            $content .= "\"{$email->email}\",\"{$email->type}\",\"{$email->source}\",\"{$email->reason}\",\"{$email->created_at}\"\n";
        }
        
        Storage::disk('local')->put($filepath, $content);
        
        return $filepath;
    }

    /**
     * Import suppression list from file
     */
    protected function importSuppressionList(string $filepath, string $type = 'manual', string $source = null): array
    {
        try {
            if (!Storage::disk('local')->exists($filepath)) {
                throw new \Exception('Import file not found');
            }
            
            $content = Storage::disk('local')->get($filepath);
            $lines = array_filter(array_map('trim', explode("\n", $content)));
            
            $imported = 0;
            $skipped = 0;
            
            foreach ($lines as $line) {
                $email = trim($line);
                
                if ($this->validateEmail($email)) {
                    SuppressionList::addEmail($email, $type, $source ?: 'import', 'Imported from file');
                    $imported++;
                } else {
                    $skipped++;
                }
            }
            
            return [
                'success' => true,
                'imported' => $imported,
                'skipped' => $skipped
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Remove email from suppression list
     */
    protected function removeFromSuppressionList(string $email): bool
    {
        try {
            SuppressionList::where('email', $email)->delete();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
} 
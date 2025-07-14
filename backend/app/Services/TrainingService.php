<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Sender;
use App\Models\Domain;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class TrainingService
{
    /**
     * Analyze sender reputation and adjust training
     */
    public function analyzeSenderReputation(Sender $sender): array
    {
        try {
            $domain = $sender->domain;
            $currentReputation = $this->getCurrentReputation($sender);
            $trainingData = $this->getTrainingData($sender);
            
            $analysis = [
                'sender_id' => $sender->id,
                'domain' => $domain->domain,
                'current_reputation' => $currentReputation,
                'training_data' => $trainingData,
                'recommendations' => []
            ];

            // Analyze bounce rate
            $bounceRate = $trainingData['bounces'] / max($trainingData['sent'], 1) * 100;
            if ($bounceRate > 5) {
                $analysis['recommendations'][] = 'High bounce rate detected - consider reducing sending volume';
                $this->reduceSendingVolume($sender, 20);
            } elseif ($bounceRate < 2) {
                $analysis['recommendations'][] = 'Low bounce rate - can increase sending volume';
                $this->increaseSendingVolume($sender, 10);
            }

            // Analyze FBL complaints
            $fblRate = $trainingData['fbl_complaints'] / max($trainingData['sent'], 1) * 100;
            if ($fblRate > 0.1) {
                $analysis['recommendations'][] = 'High FBL complaint rate - review content and sending practices';
                $this->reduceSendingVolume($sender, 30);
            }

            // Analyze engagement
            $openRate = $trainingData['opens'] / max($trainingData['sent'], 1) * 100;
            if ($openRate < 10) {
                $analysis['recommendations'][] = 'Low engagement rate - review subject lines and content';
            }

            Log::info('Sender reputation analyzed', [
                'sender_id' => $sender->id,
                'domain' => $domain->domain,
                'bounce_rate' => $bounceRate,
                'fbl_rate' => $fblRate,
                'open_rate' => $openRate,
                'recommendations_count' => count($analysis['recommendations'])
            ]);

            return $analysis;

        } catch (\Exception $e) {
            Log::error('Sender reputation analysis failed', [
                'sender_id' => $sender->id,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Get current sender reputation
     */
    protected function getCurrentReputation(Sender $sender): float
    {
        $cacheKey = "sender_reputation:{$sender->id}";
        
        return Cache::remember($cacheKey, 3600, function () use ($sender) {
            $trainingData = $this->getTrainingData($sender);
            
            $bounceRate = $trainingData['bounces'] / max($trainingData['sent'], 1);
            $fblRate = $trainingData['fbl_complaints'] / max($trainingData['sent'], 1);
            $openRate = $trainingData['opens'] / max($trainingData['sent'], 1);
            
            // Calculate reputation score (0-100)
            $reputation = 100;
            $reputation -= $bounceRate * 50; // Bounces heavily impact reputation
            $reputation -= $fblRate * 100; // FBL complaints heavily impact reputation
            $reputation += $openRate * 20; // Opens slightly improve reputation
            
            return max(0, min(100, $reputation));
        });
    }

    /**
     * Get training data for sender
     */
    protected function getTrainingData(Sender $sender): array
    {
        $cacheKey = "sender_training_data:{$sender->id}";
        
        return Cache::remember($cacheKey, 1800, function () use ($sender) {
            $thirtyDaysAgo = now()->subDays(30);
            
            return [
                'sent' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('emails_sent'),
                'bounces' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('bounces'),
                'fbl_complaints' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('fbl_complaints'),
                'opens' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('opens'),
                'clicks' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('clicks'),
            ];
        });
    }

    /**
     * Reduce sending volume for sender
     */
    protected function reduceSendingVolume(Sender $sender, int $percentage): void
    {
        $currentLimit = $sender->daily_limit;
        $newLimit = max(20, $currentLimit - ($currentLimit * $percentage / 100));
        
        $sender->update(['daily_limit' => $newLimit]);
        
        Log::info('Sender sending volume reduced', [
            'sender_id' => $sender->id,
            'old_limit' => $currentLimit,
            'new_limit' => $newLimit,
            'reduction_percentage' => $percentage
        ]);
    }

    /**
     * Increase sending volume for sender
     */
    protected function increaseSendingVolume(Sender $sender, int $percentage): void
    {
        $currentLimit = $sender->daily_limit;
        $newLimit = min(1000, $currentLimit + ($currentLimit * $percentage / 100));
        
        $sender->update(['daily_limit' => $newLimit]);
        
        Log::info('Sender sending volume increased', [
            'sender_id' => $sender->id,
            'old_limit' => $currentLimit,
            'new_limit' => $newLimit,
            'increase_percentage' => $percentage
        ]);
    }

    /**
     * Train sender based on campaign results
     */
    public function trainSenderFromCampaign(Campaign $campaign): void
    {
        try {
            $sender = $campaign->sender;
            
            if (!$sender) {
                return;
            }

            $trainingData = [
                'campaign_id' => $campaign->id,
                'emails_sent' => $campaign->emails_sent,
                'bounces' => $campaign->bounces,
                'fbl_complaints' => $campaign->fbl_complaints,
                'opens' => $campaign->opens,
                'clicks' => $campaign->clicks,
            ];

            // Update sender training data
            $this->updateSenderTrainingData($sender, $trainingData);
            
            // Analyze and adjust if needed
            $this->analyzeSenderReputation($sender);
            
            Log::info('Sender trained from campaign', [
                'sender_id' => $sender->id,
                'campaign_id' => $campaign->id,
                'training_data' => $trainingData
            ]);

        } catch (\Exception $e) {
            Log::error('Sender training from campaign failed', [
                'campaign_id' => $campaign->id,
                'sender_id' => $campaign->sender_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update sender training data
     */
    protected function updateSenderTrainingData(Sender $sender, array $trainingData): void
    {
        $cacheKey = "sender_training_data:{$sender->id}";
        $existingData = Cache::get($cacheKey, [
            'sent' => 0,
            'bounces' => 0,
            'fbl_complaints' => 0,
            'opens' => 0,
            'clicks' => 0,
        ]);

        // Update with new data
        $existingData['sent'] += $trainingData['emails_sent'];
        $existingData['bounces'] += $trainingData['bounces'];
        $existingData['fbl_complaints'] += $trainingData['fbl_complaints'];
        $existingData['opens'] += $trainingData['opens'];
        $existingData['clicks'] += $trainingData['clicks'];

        Cache::put($cacheKey, $existingData, 1800);
    }

    /**
     * Get training summary for all senders
     */
    public function getTrainingSummary(): array
    {
        try {
            $senders = Sender::with('domain')->get();
            $summary = [];

            foreach ($senders as $sender) {
                $reputation = $this->getCurrentReputation($sender);
                $trainingData = $this->getTrainingData($sender);
                
                $summary[] = [
                    'sender_id' => $sender->id,
                    'domain' => $sender->domain->domain,
                    'reputation' => $reputation,
                    'daily_limit' => $sender->daily_limit,
                    'training_data' => $trainingData,
                    'status' => $reputation > 70 ? 'good' : ($reputation > 40 ? 'fair' : 'poor')
                ];
            }

            Log::info('Training summary generated', [
                'senders_count' => count($summary)
            ]);

            return $summary;

        } catch (\Exception $e) {
            Log::error('Training summary generation failed', [
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }
} 
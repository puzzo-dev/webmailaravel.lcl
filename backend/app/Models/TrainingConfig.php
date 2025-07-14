<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'user_id',
        'daily_limit',
        'warmup_days',
        'ramp_up_rate',
        'is_active',
        'last_analysis',
        'current_reputation',
        'bounce_rate',
        'fbl_rate',
        'spam_complaint_rate',
        'delivery_rate',
        'analysis_frequency',
        'min_daily_limit',
        'max_daily_limit',
        'reputation_threshold',
        'adjustment_factor',
        'last_adjustment',
        'training_status',
        'notes'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_analysis' => 'datetime',
        'last_adjustment' => 'datetime',
        'current_reputation' => 'float',
        'bounce_rate' => 'float',
        'fbl_rate' => 'float',
        'spam_complaint_rate' => 'float',
        'delivery_rate' => 'float',
        'adjustment_factor' => 'float'
    ];

    /**
     * Get the domain that owns the training config
     */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    /**
     * Get the user that owns the training config
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for active training configs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for configs that need analysis
     */
    public function scopeNeedsAnalysis($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('last_analysis')
                    ->orWhere('last_analysis', '<=', now()->subHours($this->analysis_frequency ?? 24));
            });
    }

    /**
     * Calculate reputation score based on metrics
     */
    public function calculateReputation(): float
    {
        $reputation = 100.0;

        // Deduct points for bounces
        if ($this->bounce_rate > 0) {
            $reputation -= ($this->bounce_rate * 2);
        }

        // Deduct points for FBL complaints
        if ($this->fbl_rate > 0) {
            $reputation -= ($this->fbl_rate * 10);
        }

        // Deduct points for spam complaints
        if ($this->spam_complaint_rate > 0) {
            $reputation -= ($this->spam_complaint_rate * 15);
        }

        // Bonus for good delivery rate
        if ($this->delivery_rate > 95) {
            $reputation += 5;
        }

        return max(0, min(100, $reputation));
    }

    /**
     * Adjust daily limit based on reputation
     */
    public function adjustDailyLimit(): void
    {
        $reputation = $this->calculateReputation();
        $currentLimit = $this->daily_limit;
        $adjustment = 0;

        if ($reputation >= 90) {
            // Excellent reputation - increase by 10%
            $adjustment = $currentLimit * 0.1;
        } elseif ($reputation >= 80) {
            // Good reputation - increase by 5%
            $adjustment = $currentLimit * 0.05;
        } elseif ($reputation >= 70) {
            // Average reputation - no change
            $adjustment = 0;
        } elseif ($reputation >= 60) {
            // Poor reputation - decrease by 10%
            $adjustment = -$currentLimit * 0.1;
        } else {
            // Very poor reputation - decrease by 20%
            $adjustment = -$currentLimit * 0.2;
        }

        // Apply limits
        $newLimit = max($this->min_daily_limit ?? 20, 
                       min($this->max_daily_limit ?? 10000, 
                           $currentLimit + $adjustment));

        $this->update([
            'daily_limit' => $newLimit,
            'current_reputation' => $reputation,
            'last_adjustment' => now(),
            'adjustment_factor' => $adjustment
        ]);
    }

    /**
     * Check if training is in warmup period
     */
    public function isInWarmup(): bool
    {
        return $this->created_at->addDays($this->warmup_days)->isFuture();
    }

    /**
     * Get effective daily limit considering warmup
     */
    public function getEffectiveDailyLimit(): int
    {
        if ($this->isInWarmup()) {
            $daysSinceCreation = $this->created_at->diffInDays(now());
            $warmupProgress = min(1, $daysSinceCreation / $this->warmup_days);
            return (int) ($this->daily_limit * $warmupProgress);
        }

        return $this->daily_limit;
    }

    /**
     * Update metrics from PowerMTA analysis
     */
    public function updateMetrics(array $metrics): void
    {
        $this->update([
            'bounce_rate' => $metrics['bounce_rate'] ?? $this->bounce_rate,
            'fbl_rate' => $metrics['fbl_rate'] ?? $this->fbl_rate,
            'spam_complaint_rate' => $metrics['spam_complaint_rate'] ?? $this->spam_complaint_rate,
            'delivery_rate' => $metrics['delivery_rate'] ?? $this->delivery_rate,
            'last_analysis' => now()
        ]);
    }

    /**
     * Get training status description
     */
    public function getTrainingStatusDescription(): string
    {
        return match($this->training_status) {
            'warmup' => 'Warmup Period',
            'active' => 'Active Training',
            'paused' => 'Training Paused',
            'completed' => 'Training Completed',
            default => 'Unknown Status'
        };
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sender extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'domain_id',
        'name',
        'email',
        'is_active',
        'daily_limit',
        'current_daily_sent',
        'last_reset_date',
        'reputation_score',
        'last_training_at',
        'training_data',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'daily_limit' => 'integer',
        'current_daily_sent' => 'integer',
        'last_reset_date' => 'date',
        'reputation_score' => 'decimal:2',
        'last_training_at' => 'datetime',
        'training_data' => 'array',
    ];

    // Relationships
    public function user() { return $this->belongsTo(User::class); }
    public function domain() { return $this->belongsTo(Domain::class); }

    /**
     * Check if sender can send more emails today
     */
    public function canSendToday(): bool
    {
        $this->resetDailyCountIfNeeded();
        return $this->current_daily_sent < $this->daily_limit;
    }

    /**
     * Get remaining sends for today
     */
    public function getRemainingDailySends(): int
    {
        $this->resetDailyCountIfNeeded();
        return max(0, $this->daily_limit - $this->current_daily_sent);
    }

    /**
     * Increment daily sent count
     */
    public function incrementDailySent(int $count = 1): void
    {
        $this->resetDailyCountIfNeeded();
        $this->increment('current_daily_sent', $count);
    }

    /**
     * Reset daily count if new day
     */
    public function resetDailyCountIfNeeded(): void
    {
        $today = now()->toDateString();
        
        if ($this->last_reset_date !== $today) {
            $this->update([
                'current_daily_sent' => 0,
                'last_reset_date' => $today
            ]);
        }
    }

    /**
     * Update daily limit based on reputation
     */
    public function updateDailyLimitFromReputation(): void
    {
        $newLimit = $this->calculateLimitFromReputation();
        
        if ($newLimit !== $this->daily_limit) {
            $this->update([
                'daily_limit' => $newLimit,
                'last_training_at' => now()
            ]);
        }
    }

    /**
     * Calculate limit based on reputation score
     */
    protected function calculateLimitFromReputation(): int
    {
        $reputation = $this->reputation_score;
        
        // Base limit is 10, can go up to 1000 based on reputation
        if ($reputation >= 95) return 1000;
        if ($reputation >= 90) return 500;
        if ($reputation >= 85) return 250;
        if ($reputation >= 80) return 150;
        if ($reputation >= 75) return 100;
        if ($reputation >= 70) return 75;
        if ($reputation >= 65) return 50;
        if ($reputation >= 60) return 30;
        if ($reputation >= 55) return 20;
        if ($reputation >= 50) return 15;
        
        // Below 50% reputation, reduce limits
        if ($reputation >= 40) return 10;
        if ($reputation >= 30) return 5;
        if ($reputation >= 20) return 3;
        
        return 1; // Minimum 1 email per day
    }
}

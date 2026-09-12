<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sender extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'smtp_config_id',
        'name',
        'email',
        'is_active',
        'banned_at',
        'banned_by',
        'daily_limit',
        'current_daily_sent',
        'last_reset_date',
        'reputation_score',
        'last_training_at',
        'training_data',
        'dkim_private_key',
        'dkim_selector',
        'dns_verified_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'banned_at' => 'datetime',
        'daily_limit' => 'integer',
        'current_daily_sent' => 'integer',
        'last_reset_date' => 'date',
        'reputation_score' => 'decimal:2',
        'dns_verified_at' => 'datetime',
        'last_training_at' => 'datetime',
        'training_data' => 'array',
    ];

    protected $appends = ['banned'];

    // Relationships
    public function user() { return $this->belongsTo(User::class); }
    public function smtpConfig() { return $this->belongsTo(SmtpConfig::class); }
    public function bannedBy() { return $this->belongsTo(User::class, 'banned_by'); }

    /**
     * Check if the sender is banned.
     */
    public function getBannedAttribute(): bool
    {
        return $this->banned_at !== null;
    }

    /**
     * Scope to only include senders that are not banned.
     */
    public function scopeNotBanned($query)
    {
        return $query->whereNull('banned_at');
    }

    /**
     * Ban this sender.
     */
    public function ban(User $bannedBy): void
    {
        $this->update([
            'banned_at' => now(),
            'banned_by' => $bannedBy->id,
            'is_active' => false,
        ]);
    }

    /**
     * Unban this sender.
     */
    public function unban(): void
    {
        $this->update([
            'banned_at' => null,
            'banned_by' => null,
            'is_active' => true,
        ]);
    }

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
     * Atomically increment daily sent count — only succeeds if under the limit.
     * Returns true if the increment succeeded, false if the limit was reached.
     * This prevents the race condition where multiple workers pass canSendToday() simultaneously.
     */
    public function incrementDailySent(int $count = 1): bool
    {
        $this->resetDailyCountIfNeeded();

        // Atomic conditional increment — only updates if current_daily_sent < daily_limit
        $updated = \DB::table('senders')
            ->where('id', $this->id)
            ->where('current_daily_sent', '<', $this->daily_limit)
            ->increment('current_daily_sent', $count);

        if ($updated > 0) {
            // Refresh the in-memory model to reflect the DB state
            $this->refresh();
            return true;
        }

        return false;
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

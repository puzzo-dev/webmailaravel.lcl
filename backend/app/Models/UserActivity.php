<?php

namespace App\Models;

use App\Traits\CloudflareIPTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserActivity extends Model
{
    use HasFactory, CloudflareIPTrait;

    protected $fillable = [
        'user_id',
        'activity_type',
        'activity_description',
        'entity_type',
        'entity_id',
        'ip_address',
        'user_agent',
        'metadata',
        'created_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the user that performed the activity
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for recent activities
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope for specific activity types
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('activity_type', $type);
    }

    /**
     * Get activity icon based on type
     */
    public function getActivityIconAttribute(): string
    {
        return match($this->activity_type) {
            'campaign_created' => 'HiPlus',
            'campaign_sent' => 'HiPaperAirplane',
            'campaign_completed' => 'HiCheckCircle',
            'campaign_failed' => 'HiXCircle',
            'login' => 'HiLogin',
            'logout' => 'HiLogout',
            'profile_updated' => 'HiUser',
            'subscription_created' => 'HiCreditCard',
            'subscription_updated' => 'HiRefresh',
            'domain_added' => 'HiGlobe',
            'sender_added' => 'HiMail',
            'suppression_added' => 'HiBan',
            'bounce_processed' => 'HiShieldCheck',
            default => 'HiInformationCircle'
        };
    }

    /**
     * Get activity color based on type
     */
    public function getActivityColorAttribute(): string
    {
        return match($this->activity_type) {
            'campaign_created' => 'blue',
            'campaign_sent' => 'indigo',
            'campaign_completed' => 'green',
            'campaign_failed' => 'red',
            'login' => 'green',
            'logout' => 'gray',
            'profile_updated' => 'purple',
            'subscription_created' => 'yellow',
            'subscription_updated' => 'orange',
            'domain_added' => 'teal',
            'sender_added' => 'cyan',
            'suppression_added' => 'red',
            'bounce_processed' => 'indigo',
            default => 'gray'
        };
    }

    /**
     * Log user activity
     */
    public static function logActivity(
        int $userId,
        string $activityType,
        string $description,
        ?string $entityType = null,
        ?int $entityId = null,
        array $metadata = []
    ): self {
        // Create instance to access trait methods
        $instance = new self();
        
        // Safely get real client IP
        $realIP = '127.0.0.1'; // fallback
        try {
            if (app()->has('request') && request()) {
                $realIP = $instance->getRealClientIP(request());
            }
        } catch (\Exception $e) {
            // Keep fallback IP
        }
        
        return self::create([
            'user_id' => $userId,
            'activity_type' => $activityType,
            'activity_description' => $description,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_address' => $realIP,
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata
        ]);
    }
}

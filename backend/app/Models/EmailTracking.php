<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailTracking extends Model
{
    use HasFactory;

    protected $table = 'email_tracking';

    protected $fillable = [
        'campaign_id',
        'recipient_email',
        'email_id',
        'sent_at',
        'opened_at',
        'clicked_at',
        'bounced_at',
        'complained_at',
        'ip_address',
        'user_agent',
        'country',
        'city',
        'device_type',
        'browser',
        'os'
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'opened_at' => 'datetime',
        'clicked_at' => 'datetime',
        'bounced_at' => 'datetime',
        'complained_at' => 'datetime'
    ];

    protected $appends = ['status'];

    /**
     * Get the email status based on timestamps
     */
    public function getStatusAttribute(): string
    {
        if ($this->complained_at) {
            return 'complained';
        }
        
        if ($this->bounced_at) {
            return 'bounced';
        }
        
        if ($this->clicked_at) {
            return 'clicked';
        }
        
        if ($this->opened_at) {
            return 'opened';
        }
        
        if ($this->sent_at) {
            return 'sent';
        }
        
        return 'pending';
    }

    // Relationships
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(ClickTracking::class);
    }

    /**
     * Mark email as opened
     */
    public function markAsOpened(string $ipAddress = null, string $userAgent = null): void
    {
        if (!$this->opened_at) {
            $this->update([
                'opened_at' => now(),
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent
            ]);

            // Update campaign stats
            $this->campaign->increment('opens');
            $this->updateCampaignRates();
        }
    }

    /**
     * Mark email as clicked
     */
    public function markAsClicked(string $ipAddress = null, string $userAgent = null): void
    {
        if (!$this->clicked_at) {
            $this->update([
                'clicked_at' => now(),
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent
            ]);

            // Update campaign stats
            $this->campaign->increment('clicks');
            $this->updateCampaignRates();
        }
    }

    /**
     * Mark email as bounced
     */
    public function markAsBounced(): void
    {
        if (!$this->bounced_at) {
            $this->update(['bounced_at' => now()]);

            // Update campaign stats
            $this->campaign->increment('bounces');
            $this->updateCampaignRates();
        }
    }

    /**
     * Mark email as complained
     */
    public function markAsComplained(): void
    {
        if (!$this->complained_at) {
            $this->update(['complained_at' => now()]);

            // Update campaign stats
            $this->campaign->increment('complaints');
            $this->updateCampaignRates();
        }
    }

    /**
     * Update campaign rates
     */
    private function updateCampaignRates(): void
    {
        $campaign = $this->campaign;
        $totalSent = $campaign->total_sent;

        if ($totalSent > 0) {
            $campaign->update([
                'open_rate' => round(($campaign->opens / $totalSent) * 100, 2),
                'click_rate' => round(($campaign->clicks / $totalSent) * 100, 2),
                'bounce_rate' => round(($campaign->bounces / $totalSent) * 100, 2),
                'complaint_rate' => round(($campaign->complaints / $totalSent) * 100, 2)
            ]);
        }
    }

    /**
     * Generate unique email ID
     */
    public static function generateEmailId(): string
    {
        return 'email_' . uniqid() . '_' . time();
    }
} 
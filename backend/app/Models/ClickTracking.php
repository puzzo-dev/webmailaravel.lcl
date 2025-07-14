<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClickTracking extends Model
{
    use HasFactory;

    protected $table = 'click_tracking';

    protected $fillable = [
        'email_tracking_id',
        'link_id',
        'original_url',
        'ip_address',
        'user_agent',
        'country',
        'city',
        'device_type',
        'browser',
        'os',
        'clicked_at'
    ];

    protected $casts = [
        'clicked_at' => 'datetime'
    ];

    // Relationships
    public function emailTracking(): BelongsTo
    {
        return $this->belongsTo(EmailTracking::class);
    }

    /**
     * Generate unique link ID
     */
    public static function generateLinkId(): string
    {
        return 'link_' . uniqid() . '_' . time();
    }
} 
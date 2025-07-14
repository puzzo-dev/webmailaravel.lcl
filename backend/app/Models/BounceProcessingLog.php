<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BounceProcessingLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'message_id',
        'from_email',
        'to_email',
        'bounce_reason',
        'bounce_type',
        'status',
        'error_message',
        'raw_message',
        'processed_at'
    ];

    protected $casts = [
        'raw_message' => 'array',
        'processed_at' => 'datetime'
    ];

    // Relationships
    public function domain() { return $this->belongsTo(Domain::class); }

    /**
     * Scope to filter by bounce type
     */
    public function scopeBounceType($query, $type)
    {
        return $query->where('bounce_type', $type);
    }

    /**
     * Scope to filter by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by domain
     */
    public function scopeDomain($query, $domainId)
    {
        return $query->where('domain_id', $domainId);
    }

    /**
     * Scope to filter processed bounces
     */
    public function scopeProcessed($query)
    {
        return $query->where('status', 'processed');
    }

    /**
     * Scope to filter failed bounces
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Get bounce statistics for a domain
     */
    public static function getBounceStatistics($domainId, $days = 30)
    {
        $query = self::where('domain_id', $domainId)
                    ->where('processed_at', '>=', now()->subDays($days));

        return [
            'total_bounces' => $query->count(),
            'hard_bounces' => $query->clone()->bounceType('hard')->count(),
            'soft_bounces' => $query->clone()->bounceType('soft')->count(),
            'spam_bounces' => $query->clone()->bounceType('spam')->count(),
            'block_bounces' => $query->clone()->bounceType('block')->count(),
            'processed' => $query->clone()->processed()->count(),
            'failed' => $query->clone()->failed()->count(),
            'recent_bounces' => $query->clone()
                                    ->orderBy('processed_at', 'desc')
                                    ->limit(10)
                                    ->get()
        ];
    }
} 
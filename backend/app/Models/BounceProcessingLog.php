<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BounceProcessingLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'bounce_credential_id',
        'user_id',
        'message_id',
        'bounce_email',
        'bounce_type',
        'bounce_reason',
        'raw_message',
        'parsed_data',
        'added_to_suppression',
        'processing_status',
        'processing_notes',
    ];

    protected $casts = [
        'parsed_data' => 'array',
        'added_to_suppression' => 'boolean',
    ];

    public function bounceCredential() { return $this->belongsTo(BounceCredential::class); }
    public function user() { return $this->belongsTo(User::class); }

    public function scopeBounceType($query, $type)
    {
        return $query->where('bounce_type', $type);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('processing_status', $status);
    }

    public function scopeCredential($query, $credentialId)
    {
        return $query->where('bounce_credential_id', $credentialId);
    }

    public function scopeProcessed($query)
    {
        return $query->where('processing_status', 'processed');
    }

    public function scopeFailed($query)
    {
        return $query->where('processing_status', 'failed');
    }

    public static function getBounceStatistics($credentialId, $days = 30)
    {
        $query = self::where('bounce_credential_id', $credentialId)
                    ->where('created_at', '>=', now()->subDays($days));

        return [
            'total_bounces' => $query->count(),
            'hard_bounces' => $query->clone()->bounceType('hard')->count(),
            'soft_bounces' => $query->clone()->bounceType('soft')->count(),
            'spam_bounces' => $query->clone()->bounceType('complaint')->count(),
            'block_bounces' => $query->clone()->bounceType('other')->count(),
            'processed' => $query->clone()->processed()->count(),
            'failed' => $query->clone()->failed()->count(),
            'recent_bounces' => $query->clone()
                                    ->orderBy('created_at', 'desc')
                                    ->limit(10)
                                    ->get()
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReputationHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'date',
        'reputation_score',
        'risk_level',
        'bounce_rate',
        'complaint_rate',
        'delivery_rate',
        'total_emails_sent',
        'total_bounces',
        'total_complaints',
        'fbl_data',
        'diagnostic_data'
    ];

    protected $casts = [
        'date' => 'date',
        'reputation_score' => 'decimal:2',
        'bounce_rate' => 'decimal:2',
        'complaint_rate' => 'decimal:2',
        'delivery_rate' => 'decimal:2',
        'fbl_data' => 'array',
        'diagnostic_data' => 'array'
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(Sender::class);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeRiskLevel($query, $riskLevel)
    {
        return $query->where('risk_level', $riskLevel);
    }

    public function scopeMinReputationScore($query, $score)
    {
        return $query->where('reputation_score', '>=', $score);
    }

    public static function getAverageReputationScore($senderId, $startDate, $endDate)
    {
        return self::where('sender_id', $senderId)
            ->dateRange($startDate, $endDate)
            ->avg('reputation_score');
    }

    public static function getReputationTrends($senderId, $days = 30)
    {
        $startDate = now()->subDays($days);

        return self::where('sender_id', $senderId)
            ->where('date', '>=', $startDate)
            ->orderBy('date')
            ->get(['date', 'reputation_score', 'risk_level', 'bounce_rate', 'complaint_rate']);
    }
}

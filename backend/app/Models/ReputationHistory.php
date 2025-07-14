<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReputationHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
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

    /**
     * Get the domain that owns the reputation history.
     */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    /**
     * Scope to filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope to filter by risk level
     */
    public function scopeRiskLevel($query, $riskLevel)
    {
        return $query->where('risk_level', $riskLevel);
    }

    /**
     * Scope to filter by minimum reputation score
     */
    public function scopeMinReputationScore($query, $score)
    {
        return $query->where('reputation_score', '>=', $score);
    }

    /**
     * Get the average reputation score for a domain over a date range
     */
    public static function getAverageReputationScore($domainId, $startDate, $endDate)
    {
        return self::where('domain_id', $domainId)
            ->dateRange($startDate, $endDate)
            ->avg('reputation_score');
    }

    /**
     * Get reputation trends for a domain
     */
    public static function getReputationTrends($domainId, $days = 30)
    {
        $startDate = now()->subDays($days);
        
        return self::where('domain_id', $domainId)
            ->where('date', '>=', $startDate)
            ->orderBy('date')
            ->get(['date', 'reputation_score', 'risk_level', 'bounce_rate', 'complaint_rate']);
    }
} 
 
 
 
 
 
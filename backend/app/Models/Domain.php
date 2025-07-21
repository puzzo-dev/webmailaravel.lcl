<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'is_active',
        'reputation_score',
        'risk_level',
        'bounce_rate',
        'complaint_rate',
        'delivery_rate',
        'last_reputation_check',
        'reputation_data',
        'enable_bounce_processing',
        'bounce_protocol',
        'bounce_host',
        'bounce_port',
        'bounce_username',
        'bounce_password',
        'bounce_ssl',
        'bounce_mailbox',
        'bounce_check_interval',
        'last_bounce_check',
        'bounce_processing_rules'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'reputation_score' => 'decimal:2',
        'bounce_rate' => 'decimal:2',
        'complaint_rate' => 'decimal:2',
        'delivery_rate' => 'decimal:2',
        'last_reputation_check' => 'datetime',
        'reputation_data' => 'array',
        'enable_bounce_processing' => 'boolean',
        'bounce_ssl' => 'boolean',
        'bounce_check_interval' => 'integer',
        'last_bounce_check' => 'datetime',
        'bounce_processing_rules' => 'array'
    ];

    // Relationships
    public function user() { return $this->belongsTo(User::class); }
    public function senders() { return $this->hasMany(Sender::class); }
    public function smtpConfig() { return $this->hasOne(SmtpConfig::class); }
    public function trainingConfigs() { return $this->hasMany(TrainingConfig::class); }
    public function reputationHistories() { return $this->hasMany(ReputationHistory::class); }
    public function bounceCredential() { return $this->hasOne(BounceCredential::class); }
    public function bounceCredentials() { return $this->hasMany(BounceCredential::class); }

    /**
     * Get the latest reputation history
     */
    public function latestReputation()
    {
        return $this->hasOne(ReputationHistory::class)->latestOfMany('date');
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
     * Scope to filter domains that need reputation check
     */
    public function scopeNeedsReputationCheck($query, $hours = 24)
    {
        return $query->where(function($q) use ($hours) {
            $q->whereNull('last_reputation_check')
              ->orWhere('last_reputation_check', '<=', now()->subHours($hours));
        });
    }

    /**
     * Scope to filter domains that need bounce processing
     */
    public function scopeNeedsBounceProcessing($query)
    {
        return $query->where('enable_bounce_processing', true)
                    ->where(function($q) {
                        $q->whereNull('last_bounce_check')
                          ->orWhere('last_bounce_check', '<=', now()->subSeconds($this->bounce_check_interval));
                    });
    }

    /**
     * Get bounce processing logs
     */
    public function bounceProcessingLogs()
    {
        return $this->hasMany(BounceProcessingLog::class);
    }

    /**
     * Check if bounce processing is configured
     */
    public function isBounceProcessingConfigured(): bool
    {
        return $this->enable_bounce_processing && 
               $this->bounce_protocol && 
               $this->bounce_host && 
               $this->bounce_username && 
               $this->bounce_password;
    }

    /**
     * Get bounce processing connection string
     */
    public function getBounceConnectionString(): string
    {
        $protocol = strtolower($this->bounce_protocol);
        $ssl = $this->bounce_ssl ? 'ssl' : 'tcp';
        $port = $this->bounce_port ?: ($protocol === 'imap' ? 993 : 995);
        
        return "{$protocol}://{$ssl}/{$this->bounce_host}:{$port}";
    }

    /**
     * Get default bounce processing rules
     */
    public function getDefaultBounceRules(): array
    {
        return [
            'hard_bounce_patterns' => [
                'user not found',
                'mailbox not found',
                'no such user',
                'address not found',
                'recipient not found',
                'invalid recipient',
                'does not exist',
                'unknown user',
                'user unknown'
            ],
            'soft_bounce_patterns' => [
                'mailbox full',
                'quota exceeded',
                'temporarily unavailable',
                'try again later',
                'temporary failure',
                'over quota',
                'disk full'
            ],
            'spam_patterns' => [
                'spam',
                'blocked',
                'rejected',
                'filtered',
                'quarantine'
            ],
            'block_patterns' => [
                'blocked',
                'rejected',
                'not allowed',
                'forbidden',
                'denied'
            ]
        ];
    }

    /**
     * Get bounce processing rules (custom or default)
     */
    public function getBounceProcessingRules(): array
    {
        return $this->bounce_processing_rules ?: $this->getDefaultBounceRules();
    }

    /**
     * Update last bounce check timestamp
     */
    public function updateLastBounceCheck(): void
    {
        $this->update(['last_bounce_check' => now()]);
    }
}
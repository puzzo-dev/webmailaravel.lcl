<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
        'status',
        'country',
        'city',
        'telegram_chat_id',
        'telegram_notifications_enabled',
        'telegram_verified_at',
        'two_factor_secret',
        'two_factor_enabled',
        'two_factor_enabled_at',
        'backup_codes',
        'last_password_change',
        'billing_status',
        'last_payment_at',
        'training_enabled',
        'training_mode',
        'manual_training_percentage',
        'last_manual_training_at',
    ];

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Assign a role to the user
     */
    public function assignRole(string $role): void
    {
        $this->role = $role;
        $this->save();
    }

    // Relationships
    public function campaigns() { return $this->hasMany(Campaign::class); }
    public function senders() { return $this->hasMany(Sender::class); }
    public function domains() { return $this->hasMany(Domain::class); }
    public function contents() { return $this->hasMany(Content::class); }
    public function devices() { return $this->hasMany(Device::class); }
    public function trustedDevices() { return $this->hasMany(Device::class)->where('trusted', true); }
    public function sessions() { return $this->hasMany(Session::class); }
    public function logs() { return $this->hasMany(Log::class); }
    public function subscriptions() { return $this->hasMany(Subscription::class); }
    public function activeSubscription() { return $this->hasOne(Subscription::class)->where('status', 'active'); }
    public function trainingConfigs() { return $this->hasMany(TrainingConfig::class); }
    public function createdBackups() { return $this->hasMany(Backup::class, 'created_by'); }
    public function restoredBackups() { return $this->hasMany(Backup::class, 'restored_by'); }
    public function apiKeys() { return $this->hasMany(ApiKey::class); }
    public function securityLogs() { return $this->hasMany(SecurityLog::class); }
    public function bounceCredentials() { return $this->hasMany(BounceCredential::class); }
    public function defaultBounceCredential() { return $this->hasOne(BounceCredential::class)->where('is_default', true)->whereNull('domain_id'); }

    /**
     * Get current plan limits
     */
    public function getPlanLimits(): array
    {
        $subscription = $this->activeSubscription;
        if (!$subscription || !$subscription->plan) {
            return [
                'max_domains' => 1,
                'max_senders_per_domain' => 2,
                'max_total_campaigns' => 10,
                'max_live_campaigns' => 1,
                'daily_sending_limit' => 1000,
            ];
        }

        return [
            'max_domains' => $subscription->plan->max_domains ?? 20,
            'max_senders_per_domain' => $subscription->plan->max_senders_per_domain ?? 5,
            'max_total_campaigns' => $subscription->plan->max_total_campaigns ?? 100,
            'max_live_campaigns' => $subscription->plan->max_live_campaigns ?? 10,
            'daily_sending_limit' => $subscription->plan->daily_sending_limit ?? 10000,
        ];
    }

    /**
     * Check if user can create more domains
     */
    public function canCreateDomain(): bool
    {
        $limits = $this->getPlanLimits();
        return $this->domains()->count() < $limits['max_domains'];
    }

    /**
     * Check if user can create more campaigns
     */
    public function canCreateCampaign(): bool
    {
        $limits = $this->getPlanLimits();
        return $this->campaigns()->count() < $limits['max_total_campaigns'];
    }

    /**
     * Check if user can create more live campaigns
     */
    public function canCreateLiveCampaign(): bool
    {
        $limits = $this->getPlanLimits();
        return $this->campaigns()->where('status', 'active')->count() < $limits['max_live_campaigns'];
    }

    /**
     * Check if domain can have more senders
     */
    public function canAddSenderToDomain(Domain $domain): bool
    {
        $limits = $this->getPlanLimits();
        return $domain->senders()->count() < $limits['max_senders_per_domain'];
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'backup_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'telegram_verified_at' => 'datetime',
            'telegram_notifications_enabled' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'two_factor_enabled_at' => 'datetime',
            'backup_codes' => 'array',
            'last_password_change' => 'datetime',
            'last_payment_at' => 'datetime',
            'password' => 'hashed',
            'training_enabled' => 'boolean',
            'manual_training_percentage' => 'decimal:2',
            'last_manual_training_at' => 'datetime',
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'email' => $this->email,
            'username' => $this->username,
            'role' => $this->role,
        ];
    }

    /**
     * Route notifications for the Telegram channel.
     */
    public function routeNotificationForTelegram(): ?string
    {
        return $this->telegram_notifications_enabled ? $this->telegram_chat_id : null;
    }

    /**
     * Check if user has 2FA enabled
     */
    public function has2FAEnabled(): bool
    {
        return $this->two_factor_enabled && $this->two_factor_secret;
    }

    /**
     * Check if user has active billing
     */
    public function hasActiveBilling(): bool
    {
        return $this->billing_status === 'active';
    }

    /**
     * Get security score
     */
    public function getSecurityScore(): int
    {
        $score = 0;

        // 2FA enabled
        if ($this->has2FAEnabled()) {
            $score += 30;
        }

        // Recent password change
        if ($this->last_password_change && $this->last_password_change->diffInDays(now()) < 90) {
            $score += 20;
        }

        // Active billing
        if ($this->hasActiveBilling()) {
            $score += 25;
        }

        // Strong password (basic check)
        if (strlen($this->password) > 8) {
            $score += 25;
        }

        return min($score, 100);
    }

    /**
     * Check if user has training enabled
     */
    public function hasTrainingEnabled(): bool
    {
        return $this->training_enabled ?? false;
    }

    /**
     * Check if user uses manual training mode
     */
    public function usesManualTraining(): bool
    {
        return $this->training_mode === 'manual';
    }

    /**
     * Check if user uses automatic training mode
     */
    public function usesAutomaticTraining(): bool
    {
        return $this->training_mode === 'automatic';
    }

    /**
     * Get manual training percentage (default 10%)
     */
    public function getManualTrainingPercentage(): float
    {
        return $this->manual_training_percentage ?? 10.0;
    }

    /**
     * Check if manual training is due (daily)
     */
    public function isManualTrainingDue(): bool
    {
        if (!$this->hasTrainingEnabled() || !$this->usesManualTraining()) {
            return false;
        }

        if (!$this->last_manual_training_at) {
            return true;
        }

        return $this->last_manual_training_at->diffInDays(now()) >= 1;
    }

    /**
     * Update last manual training timestamp
     */
    public function updateManualTrainingTimestamp(): void
    {
        $this->update(['last_manual_training_at' => now()]);
    }
}
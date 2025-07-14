<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

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
    ];

    // Relationships
    public function campaigns() { return $this->hasMany(Campaign::class); }
    public function senders() { return $this->hasMany(Sender::class); }
    public function domains() { return $this->hasMany(Domain::class); }
    public function contents() { return $this->hasMany(Content::class); }
    public function devices() { return $this->hasMany(Device::class); }
    public function sessions() { return $this->hasMany(Session::class); }
    public function logs() { return $this->hasMany(Log::class); }
    public function subscriptions() { return $this->hasMany(Subscription::class); }
    public function trainingConfigs() { return $this->hasMany(TrainingConfig::class); }
    public function createdBackups() { return $this->hasMany(Backup::class, 'created_by'); }
    public function restoredBackups() { return $this->hasMany(Backup::class, 'restored_by'); }
    public function apiKeys() { return $this->hasMany(ApiKey::class); }
    public function securityLogs() { return $this->hasMany(SecurityLog::class); }

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
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class BounceCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'domain_id',
        'email',
        'protocol',
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'is_default',
        'is_active',
        'settings',
        'last_checked_at',
        'processed_count',
        'last_error'
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
        'last_error' => 'array',
        'last_checked_at' => 'datetime',
        'processed_count' => 'integer',
        'port' => 'integer'
    ];

    protected $hidden = [
        'password'
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }

    /**
     * Bounce processing logs
     */
    public function bounceProcessingLogs()
    {
        return $this->hasMany(BounceProcessingLog::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForDomain($query, $domainId)
    {
        return $query->where('domain_id', $domainId);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Get user's default bounce credential
     */
    public static function getUserDefault($userId)
    {
        return static::forUser($userId)
            ->default()
            ->active()
            ->whereNull('domain_id')
            ->first();
    }

    /**
     * Get bounce credential for domain (fallback to user default)
     */
    public static function getForDomain(Domain $domain)
    {
        // First try domain-specific credential
        $domainCredential = static::forUser($domain->user_id)
            ->forDomain($domain->id)
            ->active()
            ->first();

        if ($domainCredential) {
            return $domainCredential;
        }

        // Fallback to user's default
        return static::getUserDefault($domain->user_id);
    }

    /**
     * Get decrypted password
     */
    public function getDecryptedPassword(): ?string
    {
        if (!$this->password) {
            return null;
        }

        try {
            return Crypt::decryptString($this->password);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Set encrypted password
     */
    public function setPasswordAttribute($value)
    {
        if ($value) {
            $this->attributes['password'] = Crypt::encryptString($value);
        }
    }

    /**
     * Get connection string for IMAP/POP3
     */
    public function getConnectionString(): string
    {
        $protocol = strtolower($this->protocol);
        $encryption = $this->encryption === 'ssl' ? '/ssl' : ($this->encryption === 'tls' ? '/tls' : '');
        $novalidate = '/novalidate-cert';
        
        return "{{$this->host}:{$this->port}/{$protocol}{$encryption}{$novalidate}}";
    }

    /**
     * Test connection
     */
    public function testConnection(): array
    {
        try {
            $connectionString = $this->getConnectionString();
            $mailbox = $connectionString . ($this->settings['mailbox'] ?? 'INBOX');
            
            $connection = imap_open($mailbox, $this->username, $this->getDecryptedPassword());
            
            if (!$connection) {
                return [
                    'success' => false,
                    'error' => 'Failed to connect: ' . imap_last_error()
                ];
            }

            $messageCount = imap_num_msg($connection);
            imap_close($connection);

            return [
                'success' => true,
                'message' => "Connection successful. {$messageCount} messages found.",
                'message_count' => $messageCount
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Update last checked timestamp
     */
    public function updateLastChecked()
    {
        $this->update(['last_checked_at' => now()]);
    }

    /**
     * Increment processed count
     */
    public function incrementProcessedCount($count = 1)
    {
        $this->increment('processed_count', $count);
    }

    /**
     * Record error
     */
    public function recordError(string $error, array $context = [])
    {
        $this->update([
            'last_error' => [
                'error' => $error,
                'context' => $context,
                'timestamp' => now()->toISOString()
            ]
        ]);
    }

    /**
     * Clear error
     */
    public function clearError()
    {
        $this->update(['last_error' => null]);
    }

    /**
     * Check if credential needs to be checked
     */
    public function needsCheck($intervalSeconds = 300): bool
    {
        if (!$this->last_checked_at) {
            return true;
        }

        return $this->last_checked_at->addSeconds($intervalSeconds)->isPast();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'key',
        'secret_hash',
        'permissions',
        'last_used_at',
        'expires_at'
    ];

    protected $casts = [
        'permissions' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    protected $hidden = [
        'secret_hash'
    ];

    /**
     * Get the user that owns the API key.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if API key is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if API key has permission
     */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions ?? []);
    }

    /**
     * Scope to filter active API keys
     */
    public function scopeActive($query)
    {
        return $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }
} 
 
 
 
 
 
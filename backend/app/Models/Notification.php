<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'id',
        'type',
        'notifiable_type',
        'notifiable_id',
        'data',
        'read_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Get the notifiable entity that the notification belongs to.
     */
    public function notifiable(): BelongsTo
    {
        return $this->morphTo();
    }

    /**
     * Get the title from notification data
     */
    public function getTitleAttribute(): ?string
    {
        return $this->data['title'] ?? null;
    }

    /**
     * Get the message from notification data
     */
    public function getMessageAttribute(): ?string
    {
        return $this->data['message'] ?? null;
    }

    /**
     * Get the notification type from data
     */
    public function getNotificationTypeAttribute(): string
    {
        return $this->data['type'] ?? 'info';
    }

    /**
     * Check if notification is read
     */
    public function getIsReadAttribute(): bool
    {
        return !is_null($this->read_at);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): bool
    {
        if (is_null($this->read_at)) {
            return $this->update(['read_at' => now()]);
        }
        return true;
    }
}

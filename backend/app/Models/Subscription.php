<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'plan_name',
        'status',
        'starts_at',
        'ends_at',
        'payment_id',
        'payment_method',
        'payment_reference',
        'payment_amount',
        'payment_currency',
        'payment_date',
        'payment_url',
        'invoice',
        'cancelled_at',
        'confirmation_count',
        'payment_data',
        'reminder_data',
        'manual_payment_notes',
        'admin_user_id',
        'last_extension_at',
        'last_extension_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'payment_amount' => 'decimal:2',
        'payment_date' => 'datetime',
        'cancelled_at' => 'datetime',
        'last_extension_at' => 'datetime',
        'payment_data' => 'array',
        'reminder_data' => 'array',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function adminUser()
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function lastExtensionByUser()
    {
        return $this->belongsTo(User::class, 'last_extension_by');
    }

    /**
     * Check if subscription is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->ends_at && $this->ends_at->isFuture();
    }

    /**
     * Check if subscription is expired
     */
    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->ends_at && $this->ends_at->isPast());
    }

    /**
     * Check if payment is manual
     */
    public function isManualPayment(): bool
    {
        return !empty($this->payment_method) && empty($this->payment_id);
    }

    /**
     * Get payment method display name
     */
    public function getPaymentMethodDisplayAttribute(): string
    {
        $methods = [
            'cash' => 'Cash',
            'bank_transfer' => 'Bank Transfer',
            'check' => 'Check',
            'paypal' => 'PayPal',
            'other' => 'Other'
        ];

        return $methods[$this->payment_method] ?? $this->payment_method ?? 'Unknown';
    }

    /**
     * Scope to filter active subscriptions
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where('ends_at', '>', now());
    }

    /**
     * Scope to filter manual payments
     */
    public function scopeManualPayments($query)
    {
        return $query->whereNotNull('payment_method')
                    ->whereNull('payment_id');
    }

    /**
     * Scope to filter BTCPay payments
     */
    public function scopeBTCPayPayments($query)
    {
        return $query->whereNotNull('payment_id');
    }
}

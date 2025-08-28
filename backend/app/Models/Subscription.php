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
        'status',
        'expiry',
        'payment_id',
        'payment_method',
        'payment_reference',
        'payment_amount',
        'payment_currency',
        'paid_at',
        'notes',
        'processed_by'
    ];

    protected $casts = [
        'expiry' => 'datetime',
        'paid_at' => 'datetime',
        'payment_amount' => 'decimal:2'
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

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Check if subscription is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expiry && $this->expiry->isFuture();
    }

    /**
     * Check if subscription is expired
     */
    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->expiry && $this->expiry->isPast());
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
                    ->where('expiry', '>', now());
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
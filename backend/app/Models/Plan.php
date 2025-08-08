<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'currency',
        'duration_days',
        'max_domains',
        'max_senders_per_domain',
        'max_total_campaigns',
        'max_live_campaigns',
        'daily_sending_limit',
        'features',
        'training_mode',
        'allow_manual_training',
        'is_active',
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
        'allow_manual_training' => 'boolean',
        'price' => 'decimal:2',
    ];

    // Relationships
    public function subscriptions() { return $this->hasMany(Subscription::class); }

    /**
     * Get active plans
     */
    public static function getActivePlans()
    {
        return static::where('is_active', true)->orderBy('price')->get();
    }

    /**
     * Check if plan is available for subscription
     */
    public function isAvailable(): bool
    {
        return $this->is_active;
    }
}

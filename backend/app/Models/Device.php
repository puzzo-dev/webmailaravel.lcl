<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'device_id',
        'device_name',
        'device_type',
        'ip_address',
        'last_seen',
        'trusted',
        'trusted_at',
    ];

    protected $casts = [
        'last_seen' => 'datetime',
        'trusted' => 'boolean',
        'trusted_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

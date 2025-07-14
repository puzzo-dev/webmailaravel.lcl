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
        'ip_address',
        'last_seen',
    ];

    protected $casts = [
        'last_seen' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

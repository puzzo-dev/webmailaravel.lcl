<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'last_active',
        'ip_address',
    ];

    protected $casts = [
        'last_active' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 
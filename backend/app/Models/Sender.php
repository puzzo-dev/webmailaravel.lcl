<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sender extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'domain_id',
        'name',
        'email',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function user() { return $this->belongsTo(User::class); }
    public function domain() { return $this->belongsTo(Domain::class); }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmtpConfig extends Model
{
    protected $fillable = [
        'domain_id',
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'port' => 'integer'
    ];

    public function domain() { 
        return $this->belongsTo(Domain::class); 
    }
}

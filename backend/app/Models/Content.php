<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'subject',
        'body',
        'html_body',
        'text_body',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function user() { return $this->belongsTo(User::class); }
    public function campaigns() { return $this->belongsToMany(Campaign::class, 'campaign_content', 'content_id', 'campaign_id'); }
}

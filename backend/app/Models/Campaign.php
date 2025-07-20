<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'subject',
        'status',
        'job_id',
        'sender_ids',
        'content_ids',
        'recipient_list_path',
        'sent_list_path',
        'unsubscribe_list_path',
        'unsubscribe_list_format',
        'recipient_count',
        'total_sent',
        'total_failed',
        'opens',
        'clicks',
        'bounces',
        'complaints',
        'open_rate',
        'click_rate',
        'bounce_rate',
        'complaint_rate',
        'enable_content_switching',
        'template_variables',
        'enable_template_variables',
        'enable_open_tracking',
        'enable_click_tracking',
        'enable_unsubscribe_link',
        'recipient_field_mapping',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'sender_ids' => 'array',
        'content_ids' => 'array',
        'enable_content_switching' => 'boolean',
        'template_variables' => 'array',
        'enable_template_variables' => 'boolean',
        'enable_open_tracking' => 'boolean',
        'enable_click_tracking' => 'boolean',
        'enable_unsubscribe_link' => 'boolean',
        'recipient_field_mapping' => 'array',
        'total_sent' => 'integer',
        'total_failed' => 'integer',
        'recipient_count' => 'integer',
        'opens' => 'integer',
        'clicks' => 'integer',
        'bounces' => 'integer',
        'complaints' => 'integer',
        'open_rate' => 'decimal:2',
        'click_rate' => 'decimal:2',
        'bounce_rate' => 'decimal:2',
        'complaint_rate' => 'decimal:2',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function user() 
    { 
        return $this->belongsTo(User::class); 
    }
    
    public function senders() 
    { 
        return $this->belongsToMany(Sender::class, 'campaign_sender', 'campaign_id', 'sender_id')
            ->withTimestamps();
    }
    
    public function contents() 
    { 
        return $this->belongsToMany(Content::class, 'campaign_content', 'campaign_id', 'content_id')
            ->withTimestamps();
    }

    public function emailTracking(): HasMany
    {
        return $this->hasMany(EmailTracking::class);
    }

    /**
     * Get content variations for content switching
     */
    public function getContentVariations()
    {
        return Content::whereIn('id', $this->content_ids ?? [])->get();
    }

    /**
     * Get senders for this campaign
     */
    public function getSenders()
    {
        return Sender::whereIn('id', $this->sender_ids ?? [])->get();
    }

    /**
     * Get tracking statistics
     */
    public function getTrackingStats(): array
    {
        return [
            'total_sent' => $this->total_sent,
            'opens' => $this->opens,
            'clicks' => $this->clicks,
            'bounces' => $this->bounces,
            'complaints' => $this->complaints,
            'open_rate' => $this->open_rate,
            'click_rate' => $this->click_rate,
            'bounce_rate' => $this->bounce_rate,
            'complaint_rate' => $this->complaint_rate,
        ];
    }

    /**
     * Process template variables in content
     */
    public function processTemplateVariables(string $content, array $recipientData = []): string
    {
        if (!$this->enable_template_variables) {
            return $content;
        }

        $variables = $this->template_variables ?? [];
        $mapping = $this->recipient_field_mapping ?? [];

        // Standard variables
        $standardVariables = [
            '{{username}}' => $recipientData['username'] ?? '',
            '{{email}}' => $recipientData['email'] ?? '',
            '{{firstname}}' => $recipientData['firstname'] ?? '',
            '{{lastname}}' => $recipientData['lastname'] ?? '',
            '{{fullname}}' => trim(($recipientData['firstname'] ?? '') . ' ' . ($recipientData['lastname'] ?? '')),
            '{{unsubscribelink}}' => $this->getUnsubscribeLink($recipientData['email'] ?? ''),
        ];

        // Custom variables from template_variables
        foreach ($variables as $key => $value) {
            $standardVariables['{{' . $key . '}}'] = $value;
        }

        // Mapped recipient data variables
        foreach ($mapping as $templateVar => $recipientField) {
            $standardVariables['{{' . $templateVar . '}}'] = $recipientData[$recipientField] ?? '';
        }

        return str_replace(array_keys($standardVariables), array_values($standardVariables), $content);
    }

    /**
     * Get unsubscribe link for a specific email
     */
    public function getUnsubscribeLink(string $email): string
    {
        if (!$this->enable_unsubscribe_link) {
            return '';
        }

        // Generate a unique unsubscribe token
        $token = hash('sha256', $email . $this->id . config('app.key'));
        
        return url('/api/tracking/unsubscribe/' . $token . '?email=' . urlencode($email));
    }

    /**
     * Check if tracking is enabled
     */
    public function isTrackingEnabled(): bool
    {
        return $this->enable_open_tracking || $this->enable_click_tracking;
    }

    /**
     * Get available template variables
     */
    public function getAvailableTemplateVariables(): array
    {
        $variables = [
            'username' => 'Recipient username',
            'email' => 'Recipient email address',
            'firstname' => 'Recipient first name',
            'lastname' => 'Recipient last name',
            'fullname' => 'Recipient full name',
            'unsubscribelink' => 'Unsubscribe link (if enabled)',
        ];

        // Add custom variables
        if ($this->template_variables) {
            foreach ($this->template_variables as $key => $value) {
                $variables[$key] = 'Custom variable: ' . $value;
            }
        }

        // Add mapped recipient fields
        if ($this->recipient_field_mapping) {
            foreach ($this->recipient_field_mapping as $templateVar => $recipientField) {
                $variables[$templateVar] = 'Mapped from recipient field: ' . $recipientField;
            }
        }

        return $variables;
    }
}
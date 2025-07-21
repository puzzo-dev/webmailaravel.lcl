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
        'type',
        'subject',
        'scheduled_at',
        'status',
        'job_id',
        'sender_ids',
        'single_sender_id',
        'content_ids',
        'recipient_list_path',
        'single_recipient_email',
        'bcc_recipients',
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
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $appends = [
        'email_content',
        'total_recipients', 
        'emails_sent',
        'delivered',
        'failed',
        'from_name',
        'from_email', 
        'reply_to',
        'enable_tracking',
        'recipient_file'
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

    public function singleSender()
    {
        return $this->belongsTo(Sender::class, 'single_sender_id');
    }

    // Accessor methods for frontend compatibility
    public function getEmailContentAttribute()
    {
        $variations = $this->getContentVariations();
        
        // If content switching is enabled and multiple variations exist
        if ($this->enable_content_switching && $variations->count() > 1) {
            return "Multiple content variations (" . $variations->count() . " versions)";
        }
        
        // Return first content variation or fallback
        $firstContent = $variations->first();
        return $firstContent?->html_body ?? $firstContent?->body ?? 'No content available';
    }

    public function getTotalRecipientsAttribute()
    {
        return $this->recipient_count;
    }

    public function getEmailsSentAttribute() 
    {
        return $this->total_sent;
    }

    public function getDeliveredAttribute()
    {
        return $this->total_sent - $this->total_failed - $this->bounces;
    }

    public function getFailedAttribute()
    {
        return $this->total_failed;
    }

    public function getFromNameAttribute()
    {
        $senders = $this->getSenders();
        if ($senders->count() > 1) {
            return $senders->count() . ' senders (shuffling enabled)';
        }
        $sender = $senders->first();
        return $sender?->name ?? 'Not set';
    }

    public function getFromEmailAttribute()
    {
        $senders = $this->getSenders();
        if ($senders->count() > 1) {
            return 'Multiple emails (' . $senders->count() . ' senders)';
        }
        $sender = $senders->first();
        return $sender?->email ?? 'Not set';
    }

    public function getReplyToAttribute()
    {
        $senders = $this->getSenders();
        if ($senders->count() > 1) {
            return 'Multiple reply-to addresses';
        }
        $sender = $senders->first();
        return $sender?->reply_to ?? $sender?->email ?? 'Not set';
    }

    public function getEnableTrackingAttribute()
    {
        return $this->enable_open_tracking || $this->enable_click_tracking;
    }

    public function getRecipientFileAttribute()
    {
        return basename($this->recipient_list_path ?? '');
    }



    /**
     * Get first sender for this campaign
     */
    public function getFirstSender()
    {
        return Sender::whereIn('id', $this->sender_ids ?? [])->first();
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
        if ($this->isSingleSend() && $this->single_sender_id) {
            return collect([$this->singleSender]);
        }
        
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
     * Check if this is a single send campaign
     */
    public function isSingleSend(): bool
    {
        return $this->type === 'single';
    }

    /**
     * Get recipients for single send (including BCC)
     */
    public function getSingleSendRecipients(): array
    {
        if (!$this->isSingleSend()) {
            return [];
        }

        $recipients = [$this->single_recipient_email];
        
        if ($this->bcc_recipients) {
            $bccEmails = array_filter(array_map('trim', explode(',', $this->bcc_recipients)));
            $recipients = array_merge($recipients, $bccEmails);
        }

        return array_filter($recipients);
    }

    /**
     * Get sender for single send
     */
    public function getSingleSendSender()
    {
        if (!$this->isSingleSend()) {
            return null;
        }

        return $this->singleSender;
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
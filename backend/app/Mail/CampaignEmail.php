<?php

namespace App\Mail;

use App\Models\Campaign;
use App\Models\Content;
use App\Models\Sender;
use App\Models\EmailTracking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content as MailContent;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class CampaignEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $campaign;
    public $content;
    public $sender;
    public $recipient;
    public $recipientData;
    public $emailTracking;

    /**
     * Create a new message instance.
     */
    public function __construct(Campaign $campaign, Content $content, Sender $sender, string $recipient, array $recipientData = [])
    {
        $this->campaign = $campaign;
        $this->content = $content;
        $this->sender = $sender;
        $this->recipient = $recipient;
        $this->recipientData = $recipientData;

        // Create email tracking record only if tracking is enabled
        if ($this->campaign->isTrackingEnabled()) {
            $this->emailTracking = EmailTracking::create([
                'campaign_id' => $campaign->id,
                'recipient_email' => $recipient,
                'email_id' => EmailTracking::generateEmailId(),
                'sent_at' => now()
            ]);
            
        }
    }

    /**
     * Get the message envelope.
     * 
     * Sets the sender's name as the "From" name in the email envelope.
     * This ensures that recipients see the sender's name in their email client.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->sender->email, $this->sender->name),
            to: $this->recipient,
            subject: $this->processTemplateVariables($this->content->subject)
        );
    }

    /**
     * Get the message headers.
     */
    public function headers(): Headers
    {
        $headers = [
            'X-Campaign-ID' => $this->campaign->id,
            'X-Sender-ID' => $this->sender->id,
            'Precedence' => 'bulk',
            'X-Mailer' => 'Laravel Campaign System'
        ];

        // Add tracking headers only if tracking is enabled
        if ($this->campaign->isTrackingEnabled() && $this->emailTracking) {
            $headers['X-Email-ID'] = $this->emailTracking->email_id;
        }

        // Add unsubscribe headers only if unsubscribe link is enabled
        if ($this->campaign->enable_unsubscribe_link) {
            $headers['List-Unsubscribe'] = '<' . $this->getUnsubscribeUrl() . '>';
            $headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
        }

        return new Headers(
            messageId: null,
            references: [],
            text: $headers
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): MailContent
    {
        $htmlContent = $this->processTemplateVariables($this->content->html_body);
        $textContent = $this->processTemplateVariables($this->content->text_body);

        // Add tracking only if enabled
        if ($this->campaign->isTrackingEnabled()) {
            $htmlContent = $this->addTrackingToHtml($htmlContent);
            $textContent = $this->addTrackingToText($textContent);
        }

        return new MailContent(
            htmlString: $htmlContent
        );
    }

    /**
     * Process template variables in content
     */
    private function processTemplateVariables(string $content): string
    {
        return $this->campaign->processTemplateVariables($content, $this->recipientData);
    }

    /**
     * Add tracking to HTML content
     */
    private function addTrackingToHtml(string $html): string
    {
        // Ensure HTML has proper structure
        $html = $this->ensureHtmlStructure($html);

        // Add tracking pixel only if open tracking is enabled
        if ($this->campaign->enable_open_tracking && $this->emailTracking) {
            $trackingPixel = $this->getTrackingPixel();
            // Try to insert before </body>, fallback to end of content
            if (stripos($html, '</body>') !== false) {
                $html = str_ireplace('</body>', $trackingPixel . '</body>', $html);
            } else {
                $html .= $trackingPixel;
            }
        }

        // Add click tracking to links only if click tracking is enabled
        if ($this->campaign->enable_click_tracking) {
            $html = $this->addClickTrackingToLinks($html);
        }

        // Add unsubscribe footer only if unsubscribe link is enabled
        if ($this->campaign->enable_unsubscribe_link) {
            $html = $this->addUnsubscribeFooter($html);
        }

        return $html;
    }

    /**
     * Add tracking to text content
     */
    private function addTrackingToText(string $text): string
    {
        // Add unsubscribe footer to text only if unsubscribe link is enabled
        if ($this->campaign->enable_unsubscribe_link) {
            $text .= "\n\n" . $this->getUnsubscribeFooterText();
        }
        
        return $text;
    }

    /**
     * Get tracking pixel HTML
     */
    private function getTrackingPixel(): string
    {
        if (!$this->emailTracking) {
            return '';
        }

        $trackingUrl = URL::to('/api/tracking/open/' . $this->emailTracking->email_id);
        
        return '<img src="' . $trackingUrl . '" width="1" height="1" style="display:none;" alt="" />';
    }

    /**
     * Add click tracking to links
     */
    private function addClickTrackingToLinks(string $html): string
    {
        if (!$this->emailTracking) {
            return $html;
        }

        // Find all links in the HTML
        preg_match_all('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>/i', $html, $matches);

        foreach ($matches[0] as $index => $linkTag) {
            $originalUrl = $matches[1][$index];
            
            // Skip if it's already a tracking link or unsubscribe link
            if (strpos($originalUrl, '/api/tracking/') !== false || 
                strpos($originalUrl, 'unsubscribe') !== false ||
                strpos($originalUrl, 'mailto:') !== false ||
                strpos($originalUrl, 'javascript:') !== false ||
                strpos($originalUrl, '#') === 0) {
                continue;
            }

            // Create tracking URL
            $linkId = \App\Models\ClickTracking::generateLinkId();
            
            // Create ClickTracking record
            \App\Models\ClickTracking::create([
                'email_tracking_id' => $this->emailTracking->id,
                'link_id' => $linkId,
                'original_url' => $originalUrl,
                'clicked_at' => null  // Will be set when actually clicked
            ]);
            
            $trackingUrl = URL::to('/api/tracking/click/' . $this->emailTracking->email_id . '/' . $linkId);

            // Replace the href attribute
            $newLinkTag = preg_replace(
                '/href=["\'][^"\']+["\']/i',
                'href="' . $trackingUrl . '"',
                $linkTag
            );

            $html = str_replace($linkTag, $newLinkTag, $html);
        }

        return $html;
    }

    /**
     * Add unsubscribe footer to HTML
     */
    private function addUnsubscribeFooter(string $html): string
    {
        $unsubscribeFooter = $this->getUnsubscribeFooterHtml();
        
        // Try to add before closing body tag, fallback to end of content
        if (stripos($html, '</body>') !== false) {
            $html = str_ireplace('</body>', $unsubscribeFooter . '</body>', $html);
        } else {
            $html .= $unsubscribeFooter;
        }
        
        return $html;
    }

    /**
     * Get unsubscribe URL
     */
    private function getUnsubscribeUrl(): string
    {
        if ($this->emailTracking) {
            return URL::to('/api/tracking/unsubscribe/' . $this->emailTracking->email_id);
        }

        // Fallback to campaign's unsubscribe link method
        return $this->campaign->getUnsubscribeLink($this->recipient);
    }

    /**
     * Get unsubscribe footer HTML
     */
    private function getUnsubscribeFooterHtml(): string
    {
        $unsubscribeUrl = $this->getUnsubscribeUrl();
        
        return '
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>You received this email because you are subscribed to our mailing list.</p>
            <p>
                <a href="' . $unsubscribeUrl . '" style="color: #999; text-decoration: underline;">
                    Unsubscribe from this list
                </a>
            </p>
        </div>';
    }

    /**
     * Get unsubscribe footer text
     */
    private function getUnsubscribeFooterText(): string
    {
        $unsubscribeUrl = $this->getUnsubscribeUrl();
        
        return "You received this email because you are subscribed to our mailing list.\n" .
               "To unsubscribe, visit: " . $unsubscribeUrl;
    }

    /**
     * Ensure HTML content has proper structure for tracking injection
     */
    private function ensureHtmlStructure(string $html): string
    {
        // If content doesn't have HTML structure, wrap it
        if (stripos($html, '<html') === false || stripos($html, '<body') === false) {
            $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
</head>
<body>
' . $html . '
</body>
</html>';
        }
        
        return $html;
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
} 
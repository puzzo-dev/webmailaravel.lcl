<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $testData;

    /**
     * Create a new message instance.
     */
    public function __construct(array $testData)
    {
        $this->testData = $testData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: $this->testData['from'],
            to: $this->testData['to'],
            subject: $this->testData['subject'] ?? 'Test Email',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->testData['html_body'] ?? '<h1>Test Email</h1><p>This is a test email from the campaign system.</p>',
            textString: $this->testData['text_body'] ?? 'Test Email\n\nThis is a test email from the campaign system.',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
} 
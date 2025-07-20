<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Sender;

class TestEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $sender;

    /**
     * Create a new message instance.
     */
    public function __construct(Sender $sender)
    {
        $this->sender = $sender;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from($this->sender->email, $this->sender->name)
                    ->subject('Test Email - SMTP Configuration Test')
                    ->view('emails.test-email')
                    ->text('emails.test-email-text');
    }
} 
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountDeactivated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $reason;
    protected $reactivationDate;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $reason = null, $reactivationDate = null)
    {
        $this->reason = $reason;
        $this->reactivationDate = $reactivationDate;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Account Deactivated')
            ->greeting('Hello!')
            ->line('Your account has been deactivated.');

        if ($this->reason) {
            $mail->line("Reason: {$this->reason}");
        }

        if ($this->reactivationDate) {
            $mail->line("Your account will be automatically reactivated on: {$this->reactivationDate}");
        } else {
            $mail->line('To reactivate your account, please contact our support team.');
        }

        return $mail
            ->action('Contact Support', url('/support'))
            ->line('Thank you for your understanding.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Account Deactivated',
            'message' => 'Your account has been deactivated.' . ($this->reason ? " Reason: {$this->reason}" : ''),
            'type' => 'account_deactivated',
            'reason' => $this->reason,
            'deactivated_at' => now()->toISOString(),
            'reactivation_date' => $this->reactivationDate,
        ];
    }
}

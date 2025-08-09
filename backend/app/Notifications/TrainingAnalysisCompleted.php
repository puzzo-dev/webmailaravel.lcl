<?php

namespace App\Notifications;

use App\Models\TrainingConfig;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TrainingAnalysisCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    public $trainingConfig;
    public $analysisData;

    /**
     * Create a new notification instance.
     */
    public function __construct(TrainingConfig $trainingConfig, array $analysisData = [])
    {
        $this->trainingConfig = $trainingConfig;
        $this->analysisData = $analysisData;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast', \App\Channels\TelegramChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Training Analysis Completed')
            ->line("Training analysis completed for domain '{$this->trainingConfig->domain->name}'.")
            ->line("Daily limit: {$this->trainingConfig->daily_limit} emails")
            ->line("Last analysis: " . $this->trainingConfig->last_analysis?->format('Y-m-d H:i:s'))
            ->action('View Domain', url('/domains/' . $this->trainingConfig->domain_id))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Training Analysis Completed',
            'message' => "Training analysis has been completed for domain '{$this->trainingConfig->domain->name}'. Review the results to optimize your email delivery performance.",
            'type' => 'training_analysis_completed',
            'domain_name' => $this->trainingConfig->domain->name,
            'daily_limit' => $this->trainingConfig->daily_limit,
            'last_analysis' => $this->trainingConfig->last_analysis,
            'analysis_data' => $this->analysisData,
            'completed_at' => now()->toISOString(),
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): array
    {
        return [
            'domain_name' => $this->trainingConfig->domain->name,
            'daily_limit' => $this->trainingConfig->daily_limit,
            'last_analysis' => $this->trainingConfig->last_analysis,
            'analysis_data' => $this->analysisData,
            'type' => 'training_analysis_completed',
            'message' => "Training analysis completed for domain '{$this->trainingConfig->domain->name}'",
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $domainName = $this->trainingConfig->domain->name;
        $dailyLimit = $this->trainingConfig->daily_limit;
        $lastAnalysis = $this->trainingConfig->last_analysis ? $this->trainingConfig->last_analysis->format('Y-m-d H:i:s') : 'Never';
        
        return [
            'text' => "📊 <b>Training Analysis Completed</b>\n\n" .
                     "Domain: <b>{$domainName}</b>\n" .
                     "Daily Limit: <b>{$dailyLimit}</b> emails\n" .
                     "Last Analysis: <b>{$lastAnalysis}</b>\n\n" .
                     "View domain: " . url('/domains/' . $this->trainingConfig->domain_id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}

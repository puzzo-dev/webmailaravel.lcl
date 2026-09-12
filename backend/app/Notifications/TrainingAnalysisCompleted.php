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

    public function __construct(TrainingConfig $trainingConfig, array $analysisData = [])
    {
        $this->trainingConfig = $trainingConfig;
        $this->analysisData = $analysisData;
    }

    public function via(object $notifiable): array
    {
        return [\App\Channels\TelegramChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Training Analysis Completed')
            ->line('Training analysis has been completed.')
            ->line("Daily limit: {$this->trainingConfig->daily_limit} emails")
            ->line("Last analysis: " . $this->trainingConfig->last_analysis?->format('Y-m-d H:i:s'))
            ->action('View Senders', url('/senders'))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Training Analysis Completed',
            'message' => 'Training analysis has been completed. Review the results to optimize your email delivery performance.',
            'type' => 'training_analysis_completed',
            'daily_limit' => $this->trainingConfig->daily_limit,
            'last_analysis' => $this->trainingConfig->last_analysis,
            'analysis_data' => $this->analysisData,
            'completed_at' => now()->toISOString(),
        ];
    }

    public function toBroadcast(object $notifiable): array
    {
        return [
            'daily_limit' => $this->trainingConfig->daily_limit,
            'last_analysis' => $this->trainingConfig->last_analysis,
            'analysis_data' => $this->analysisData,
            'type' => 'training_analysis_completed',
            'message' => 'Training analysis completed',
        ];
    }

    public function toTelegram(object $notifiable): array
    {
        $dailyLimit = $this->trainingConfig->daily_limit;
        $lastAnalysis = $this->trainingConfig->last_analysis ? $this->trainingConfig->last_analysis->format('Y-m-d H:i:s') : 'Never';

        return [
            'text' => "📊 <b>Training Analysis Completed</b>\n\n" .
                     "Daily Limit: <b>{$dailyLimit}</b> emails\n" .
                     "Last Analysis: <b>{$lastAnalysis}</b>\n\n" .
                     "View senders: " . url('/senders'),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}

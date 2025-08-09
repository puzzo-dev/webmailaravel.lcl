<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UnifiedTrainingService;
use App\Models\User;

class TrainingCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'training:run 
                            {type : Type of training (automatic|manual|system)}
                            {--user-id= : Run training for specific user ID}
                            {--domain= : Process specific domain}
                            {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Unified training command for automatic, manual, and system training';

    protected $trainingService;

    public function __construct(UnifiedTrainingService $trainingService)
    {
        parent::__construct();
        $this->trainingService = $trainingService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $type = $this->argument('type');
        $isDryRun = $this->option('dry-run');
        $userId = $this->option('user-id');
        $domain = $this->option('domain');

        $this->info("Starting {$type} training...");

        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        try {
            switch ($type) {
                case 'automatic':
                    return $this->runAutomaticTraining($domain, $userId, $isDryRun);
                
                case 'manual':
                    return $this->runManualTraining($userId, $domain, $isDryRun);
                
                case 'system':
                    return $this->runSystemTraining($isDryRun);
                
                default:
                    $this->error("Invalid training type: {$type}");
                    $this->line('Valid types: automatic, manual, system');
                    return 1;
            }
        } catch (\Exception $e) {
            $this->error("Training failed: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Run automatic training based on PowerMTA data and reputation scores
     */
    private function runAutomaticTraining(?string $domain, ?string $userId, bool $isDryRun): int
    {
        $this->info('Running automatic training based on PowerMTA data and reputation scores...');

        $options = [];
        if ($domain) {
            $options['domain'] = $domain;
            $this->info("Processing domain: {$domain}");
        }
        if ($userId) {
            $options['user_id'] = $userId;
            $this->info("Processing user ID: {$userId}");
        }

        if ($isDryRun) {
            $this->line('Would run automatic training with options: ' . json_encode($options));
            return 0;
        }

        $result = $this->trainingService->runAutomaticTraining($options);

        if ($result['success']) {
            $this->info('Automatic training completed successfully');
            $this->line("Processed: {$result['processed_count']} items");
            $this->line("Updated: {$result['updated_count']} items");
        } else {
            $this->error("Automatic training failed: {$result['error']}");
            return 1;
        }

        return 0;
    }

    /**
     * Run manual training to increase sender limits by percentage
     */
    private function runManualTraining(?string $userId, ?string $domain, bool $isDryRun): int
    {
        $this->info('Running manual training to increase sender limits...');

        $user = null;
        if ($userId) {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found");
                return 1;
            }
            $this->info("Processing user: {$user->name} ({$user->email})");
        }

        $options = [];
        if ($domain) {
            $options['domain'] = $domain;
            $this->info("Processing domain: {$domain}");
        }

        if ($isDryRun) {
            $this->line('Would run manual training for ' . ($user ? $user->email : 'all users'));
            return 0;
        }

        $result = $this->trainingService->runManualTraining($user, $options);

        if ($result['success']) {
            $this->info('Manual training completed successfully');
            $this->line("Processed: {$result['processed_count']} users");
            $this->line("Updated: {$result['updated_count']} senders");
        } else {
            $this->error("Manual training failed: {$result['error']}");
            return 1;
        }

        return 0;
    }

    /**
     * Run system manual training based on configuration
     */
    private function runSystemTraining(bool $isDryRun): int
    {
        $this->info('Running system manual training based on configuration...');

        if ($isDryRun) {
            $this->line('Would run system training with configured parameters');
            return 0;
        }

        $result = $this->trainingService->runSystemTraining();

        if ($result['success']) {
            $this->info('System training completed successfully');
            $this->line("Processed: {$result['processed_count']} items");
            $this->line("Updated: {$result['updated_count']} configurations");
        } else {
            $this->error("System training failed: {$result['error']}");
            return 1;
        }

        return 0;
    }
}

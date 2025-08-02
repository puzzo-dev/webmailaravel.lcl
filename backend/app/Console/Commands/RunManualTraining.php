<?php

namespace App\Console\Commands;

use App\Services\ManualTrainingService;
use Illuminate\Console\Command;

class RunManualTraining extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'training:run-manual {--user-id= : Run manual training for specific user ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run manual training to increase sender limits by percentage daily';

    protected $manualTrainingService;

    /**
     * Create a new command instance.
     */
    public function __construct(ManualTrainingService $manualTrainingService)
    {
        parent::__construct();
        $this->manualTrainingService = $manualTrainingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting manual training process...');

        try {
            $userId = $this->option('user-id');

            if ($userId) {
                // Run for specific user
                $user = \App\Models\User::findOrFail($userId);
                $results = $this->manualTrainingService->runManualTrainingForUser($user);

                $this->info("Manual training completed for user: {$user->email}");
                $this->info("Senders updated: {$results['senders_updated']}");
                $this->info("Percentage applied: {$results['percentage_applied']}%");

                if (!empty($results['errors'])) {
                    $this->warn("Errors encountered:");
                    foreach ($results['errors'] as $error) {
                        $this->error("  - {$error}");
                    }
                }
            } else {
                // Run for all eligible users
                $results = $this->manualTrainingService->runManualTrainingForAllUsers();

                $this->info("Manual training completed successfully!");
                $this->info("Users processed: {$results['users_processed']}");
                $this->info("Senders updated: {$results['senders_updated']}");

                if (!empty($results['errors'])) {
                    $this->warn("Errors encountered:");
                    foreach ($results['errors'] as $error) {
                        $this->error("  - {$error}");
                    }
                }
            }

        } catch (\Exception $e) {
            $this->error("Manual training failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}

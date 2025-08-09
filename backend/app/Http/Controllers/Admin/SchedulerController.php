<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SchedulerController extends Controller
{
    use ResponseTrait, LoggingTrait;

    /**
     * Get all scheduled tasks status
     */
    public function index(): JsonResponse
    {
        try {
            // Get schedule list
            $output = [];
            Artisan::call('schedule:list');
            $scheduleOutput = Artisan::output();
            
            return $this->successResponse([
                'schedule_list' => $scheduleOutput,
                'available_commands' => $this->getAvailableCommands(),
                'last_run' => $this->getLastScheduleRun()
            ], 'Schedule information retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get schedule information', 500);
        }
    }

    /**
     * Run the entire scheduler manually
     */
    public function runScheduler(): JsonResponse
    {
        try {
            $this->logInfo('Manual scheduler run initiated by admin', [
                'user_id' => auth()->id()
            ]);

            Artisan::call('schedule:run');
            $output = Artisan::output();

            $this->logInfo('Manual scheduler run completed', [
                'output' => $output
            ]);

            return $this->successResponse([
                'output' => $output,
                'message' => 'Scheduler executed successfully'
            ], 'Scheduler run completed');

        } catch (\Exception $e) {
            $this->logError('Manual scheduler run failed', [
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse('Failed to run scheduler: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Run specific command manually
     */
    public function runCommand(Request $request): JsonResponse
    {
        $request->validate([
            'command' => 'required|string'
        ]);

        $command = $request->input('command');
        
        // Whitelist allowed commands for security
        $allowedCommands = [
            'billing:send-renewal-reminders',
            'app:process-bounces',
            'app:process-fblfile', 
            'app:monitor-domains',
            'app:analyze-reputation-command',
            'training:run-automatic',
            'system:manual-training',
            'queue:restart',
            'queue:flush',
            'model:prune'
        ];

        if (!in_array($command, $allowedCommands)) {
            return $this->errorResponse('Command not allowed', 403);
        }

        try {
            $this->logInfo('Manual command execution initiated', [
                'command' => $command,
                'user_id' => auth()->id()
            ]);

            Artisan::call($command);
            $output = Artisan::output();

            $this->logInfo('Manual command execution completed', [
                'command' => $command,
                'output' => $output
            ]);

            return $this->successResponse([
                'command' => $command,
                'output' => $output,
                'message' => "Command '{$command}' executed successfully"
            ], 'Command executed successfully');

        } catch (\Exception $e) {
            $this->logError('Manual command execution failed', [
                'command' => $command,
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse("Failed to run command '{$command}': " . $e->getMessage(), 500);
        }
    }

    /**
     * Get queue status and stats
     */
    public function queueStatus(): JsonResponse
    {
        try {
            // Get failed jobs count
            Artisan::call('queue:failed');
            $failedJobs = Artisan::output();

            return $this->successResponse([
                'failed_jobs' => $failedJobs,
                'queue_info' => 'Queue status retrieved'
            ], 'Queue status retrieved successfully');

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get queue status', 500);
        }
    }

    /**
     * Test scheduler setup
     */
    public function testScheduler(): JsonResponse
    {
        try {
            // Test if scheduler is properly configured
            $testResults = [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'timezone' => config('app.timezone'),
                'current_time' => now()->toDateTimeString(),
                'schedule_configured' => true
            ];

            return $this->successResponse($testResults, 'Scheduler test completed');

        } catch (\Exception $e) {
            return $this->errorResponse('Scheduler test failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get available commands
     */
    private function getAvailableCommands(): array
    {
        return [
            [
                'command' => 'billing:send-renewal-reminders',
                'description' => 'Send subscription renewal reminder emails',
                'frequency' => 'Daily at 9:00 AM'
            ],
            [
                'command' => 'app:process-bounces',
                'description' => 'Process email bounces and update suppression lists',
                'frequency' => 'Every 30 minutes'
            ],
            [
                'command' => 'app:process-fblfile',
                'description' => 'Process feedback loop files',
                'frequency' => 'Hourly'
            ],
            [
                'command' => 'app:monitor-domains',
                'description' => 'Monitor domain reputation and status',
                'frequency' => 'Every 30 minutes'
            ],
            [
                'command' => 'app:analyze-reputation-command',
                'description' => 'Analyze sender reputation metrics',
                'frequency' => 'Hourly'
            ],
            [
                'command' => 'training:run-automatic',
                'description' => 'Run automatic ML training',
                'frequency' => 'Daily at 2:00 AM'
            ],
            [
                'command' => 'system:manual-training',
                'description' => 'Run manual system training',
                'frequency' => 'Every 2 days at 3:00 AM'
            ]
        ];
    }

    /**
     * Get last schedule run info
     */
    private function getLastScheduleRun(): array
    {
        return [
            'last_run' => 'Not available through API',
            'next_run' => 'Based on individual task schedules',
            'status' => 'Configure cron job: * * * * * php artisan schedule:run'
        ];
    }
}

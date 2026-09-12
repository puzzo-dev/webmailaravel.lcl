<?php

namespace App\Http\Controllers;

use App\Services\PowerMTAService;
use App\Services\PmtaMonitoringService;
use App\Services\CloudflareDnsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;
use Carbon\Carbon;

class PowerMTAController extends Controller
{
    use ResponseTrait, LoggingTrait;
    protected $powerMTAService;
    protected $unifiedTrainingService;
    protected $bounceProcessingService;
    protected $pmtaMonitoringService;
    protected $cloudflareDnsService;

    public function __construct(
        PowerMTAService $powerMTAService,
        \App\Services\UnifiedTrainingService $unifiedTrainingService,
        \App\Services\BounceProcessingService $bounceProcessingService,
        PmtaMonitoringService $pmtaMonitoringService,
        CloudflareDnsService $cloudflareDnsService
    ) {
        $this->powerMTAService = $powerMTAService;
        $this->unifiedTrainingService = $unifiedTrainingService;
        $this->bounceProcessingService = $bounceProcessingService;
        $this->pmtaMonitoringService = $pmtaMonitoringService;
        $this->cloudflareDnsService = $cloudflareDnsService;
    }

    /**
     * Get PowerMTA status and health information
     */
    public function getStatus(): JsonResponse
    {
        try {
            $status = $this->powerMTAService->getStatus();
            return $this->successResponse($status, 'PowerMTA status retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve PowerMTA status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PMTA domains (real-time from management API)
     */
    public function getDomains(): JsonResponse
    {
        try {
            $result = $this->powerMTAService->getDomains();
            return $this->successResponse($result, 'PMTA domains retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve domains: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PMTA queues (real-time from management API)
     */
    public function getQueues(): JsonResponse
    {
        try {
            $result = $this->powerMTAService->getQueues();
            return $this->successResponse($result, 'PMTA queues retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve queues: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PMTA VMTAs (real-time from management API)
     */
    public function getVmtas(): JsonResponse
    {
        try {
            $result = $this->powerMTAService->getVmtas();
            return $this->successResponse($result, 'PMTA VMTAs retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve VMTAs: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PMTA jobs (real-time from management API)
     */
    public function getJobs(): JsonResponse
    {
        try {
            $result = $this->powerMTAService->getJobs();
            return $this->successResponse($result, 'PMTA jobs retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve jobs: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PMTA log files (real-time from management API)
     */
    public function getLogFiles(Request $request): JsonResponse
    {
        try {
            $result = $this->powerMTAService->getLogFiles();
            return $this->successResponse($result, 'PMTA log files retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve log files: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PowerMTA FBL accounts
     */
    public function getFBLAccounts(): JsonResponse
    {
        try {
            $accounts = $this->powerMTAService->getFBLAccounts();
            return $this->successResponse($accounts, 'FBL accounts retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve FBL accounts: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PowerMTA diagnostic files
     */
    public function getDiagnosticFiles(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date');
            $files = $this->powerMTAService->getDiagnosticFiles($date);
            return $this->successResponse($files, 'Diagnostic files retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve diagnostic files: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PowerMTA reputation summary
     */
    public function getReputationSummary(): JsonResponse
    {
        try {
            $summary = $this->powerMTAService->analyzeSenderReputation('all');
            return $this->successResponse($summary, 'Reputation summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve reputation summary: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Analyze PowerMTA reputation for a specific sender domain
     */
    public function analyzeSenderReputation(Request $request): JsonResponse
    {
        try {
            $domain = $request->input('domain');
            if (!$domain) {
                return $this->errorResponse('Domain parameter is required', 400);
            }

            $analysis = $this->powerMTAService->analyzeSenderReputation($domain);
            return $this->successResponse($analysis, 'Sender reputation analyzed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to analyze reputation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Parse PowerMTA diagnostic file
     */
    public function parseDiagnosticFile(Request $request): JsonResponse
    {
        try {
            $filename = $request->input('filename');
            if (!$filename) {
                return $this->errorResponse('Filename parameter is required', 400);
            }

            $parsed = $this->powerMTAService->parseDiagnosticFile($filename);
            return $this->successResponse($parsed, 'Diagnostic file parsed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to parse diagnostic file: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Download PowerMTA diagnostic file
     */
    public function downloadDiagnosticFile(Request $request, $filename): JsonResponse
    {
        try {
            $fileInfo = $this->powerMTAService->getDiagnosticFiles();
            $file = collect($fileInfo['files'] ?? [])->firstWhere('name', $filename);

            if (!$file) {
                return $this->errorResponse('File not found', 404);
            }

            return $this->successResponse($file, 'File information retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to download diagnostic file: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Process bounce files from PowerMTA
     */
    public function processBounceFiles(Request $request): JsonResponse
    {
        try {
            $result = $this->bounceProcessingService->processPowerMTAFiles();
            return $this->successResponse($result, 'Bounce files processed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to process bounce files: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get training statistics
     */
    public function getTrainingStatistics(): JsonResponse
    {
        try {
            $stats = $this->powerMTAService->getTrainingStatistics();
            return $this->successResponse($stats, 'Training statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve training statistics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Run training
     */
    public function runTraining(Request $request): JsonResponse
    {
        try {
            $result = $this->unifiedTrainingService->runTraining();
            return $this->successResponse($result, 'Training completed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to run training: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get training configuration
     */
    public function getTrainingConfig(Request $request): JsonResponse
    {
        $config = $this->powerMTAService->getTrainingConfig();
        return $this->successResponse($config, 'Training configuration retrieved successfully');
    }

    /**
     * Process local PowerMTA log files from production path
     */
    public function processLocalLogFiles(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date');
            $result = $this->powerMTAService->processLocalLogFiles($date);
            return $this->successResponse($result, 'Local PowerMTA log files processed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to process local log files: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get available PowerMTA log files for a specific date
     */
    public function getAvailableLogFiles(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date');
            $result = $this->powerMTAService->getAvailableLogFiles($date);
            return $this->successResponse($result, 'Available PowerMTA log files retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get available log files: ' . $e->getMessage(), 500);
        }
    }

    // ==================== PMTA FILE MONITORING ====================

    public function getPmtaOverview(): JsonResponse
    {
        try {
            return $this->successResponse($this->pmtaMonitoringService->getSystemOverview(), 'PMTA overview retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get PMTA overview: ' . $e->getMessage(), 500);
        }
    }

    public function getDailySummary(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date') ? Carbon::parse($request->input('date')) : Carbon::now();
            return $this->successResponse($this->pmtaMonitoringService->getDailySummary($date), 'Daily summary retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get daily summary: ' . $e->getMessage(), 500);
        }
    }

    public function getDeliveryRateByCampaign(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date') ? Carbon::parse($request->input('date')) : Carbon::now();
            return $this->successResponse($this->pmtaMonitoringService->getDeliveryRateByCampaign($date), 'Delivery rate by campaign retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get delivery rate by campaign: ' . $e->getMessage(), 500);
        }
    }

    public function getDeliveryRateByUser(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date') ? Carbon::parse($request->input('date')) : Carbon::now();
            return $this->successResponse($this->pmtaMonitoringService->getDeliveryRateByUser($date), 'Delivery rate by user retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get delivery rate by user: ' . $e->getMessage(), 500);
        }
    }

    public function getSenderReputationByUser(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date') ? Carbon::parse($request->input('date')) : Carbon::now();
            return $this->successResponse($this->pmtaMonitoringService->getSenderReputationByUser($date), 'Sender reputation by user retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get sender reputation: ' . $e->getMessage(), 500);
        }
    }

    public function getSenderHealth(Request $request): JsonResponse
    {
        try {
            $sender = $request->input('sender');
            if (!$sender) return $this->errorResponse('Sender email is required', 400);
            $date = $request->input('date') ? Carbon::parse($request->input('date')) : Carbon::now();
            return $this->successResponse([
                'sender_email' => $sender,
                'date' => $date->format('Y-m-d'),
                'health_score' => $this->pmtaMonitoringService->calculateSenderHealthScore($sender, $date),
            ], 'Sender health retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get sender health: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get health + trend for ALL senders at once (for auto-loaded charts).
     */
    public function getAllSendersHealth(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date') ? Carbon::parse($request->input('date')) : Carbon::now();
            $days = min(max((int)$request->input('days', 7), 1), 90);

            $senders = \App\Models\Sender::with('smtpConfig')->get();
            $results = [];

            foreach ($senders as $sender) {
                $health = $this->pmtaMonitoringService->calculateSenderHealthScore($sender->email, $date);
                $trend = $this->pmtaMonitoringService->getSenderTrendAnalysis($sender->email, $days);

                $results[] = [
                    'id' => $sender->id,
                    'email' => $sender->email,
                    'name' => $sender->name,
                    'smtp_config' => $sender->smtpConfig ? "{$sender->smtpConfig->host}:{$sender->smtpConfig->port}" : 'N/A',
                    'banned' => $sender->banned_at !== null,
                    'health_score' => $health['health_score'] ?? 0,
                    'total_sent' => $health['total_sent'] ?? 0,
                    'delivered' => $health['delivered'] ?? 0,
                    'bounced' => $health['bounced'] ?? 0,
                    'deferred' => $health['deferred'] ?? 0,
                    'complaints' => $health['complaints'] ?? 0,
                    'delivery_rate' => $health['delivery_rate'] ?? 0,
                    'bounce_rate' => $health['bounce_rate'] ?? 0,
                    'complaint_rate' => $health['complaint_rate'] ?? 0,
                    'trend' => $trend['trend'] ?? 'no_data',
                    'trend_direction' => $trend['trend'] ?? 'no_data',
                    'daily_stats' => $trend['daily_stats'] ?? [],
                    'averages' => $trend['averages'] ?? [],
                    'recommendations' => $trend['recommendations'] ?? [],
                ];
            }

            return $this->successResponse([
                'senders' => $results,
                'date' => $date->format('Y-m-d'),
                'days' => $days,
            ], 'All senders health retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get senders health: ' . $e->getMessage(), 500);
        }
    }

    public function getSenderTrend(Request $request): JsonResponse
    {
        try {
            $sender = $request->input('sender');
            if (!$sender) return $this->errorResponse('Sender email is required', 400);
            $days = min(max((int)$request->input('days', 7), 1), 90);
            return $this->successResponse($this->pmtaMonitoringService->getSenderTrendAnalysis($sender, $days), 'Sender trend retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get sender trend: ' . $e->getMessage(), 500);
        }
    }

    public function triggerScan(): JsonResponse
    {
        try {
            return $this->successResponse($this->pmtaMonitoringService->triggerScan(), 'PMTA scan triggered');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to trigger scan: ' . $e->getMessage(), 500);
        }
    }

    // ==================== CLOUDFLARE DNS AUTOMATION ====================

    public function verifyCloudflareZone(): JsonResponse
    {
        try {
            return $this->successResponse($this->cloudflareDnsService->verifyZone(), 'Cloudflare zone verified');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to verify zone: ' . $e->getMessage(), 500);
        }
    }

    public function setupSenderDns(Request $request): JsonResponse
    {
        try {
            $senderId = $request->input('sender_id');
            $sender = \App\Models\Sender::findOrFail($senderId);
            if ($sender->user_id !== auth()->id() && !auth()->user()->hasRole('admin')) {
                return $this->errorResponse('Access denied', 403);
            }
            $result = $this->cloudflareDnsService->setupSenderDns($sender);
            return $this->successResponse($result, $result['success'] ? 'DNS records created successfully' : 'DNS setup completed with errors');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to setup DNS: ' . $e->getMessage(), 500);
        }
    }

    public function checkSenderDns(Request $request): JsonResponse
    {
        try {
            $senderId = $request->input('sender_id');
            $sender = \App\Models\Sender::findOrFail($senderId);
            if ($sender->user_id !== auth()->id() && !auth()->user()->hasRole('admin')) {
                return $this->errorResponse('Access denied', 403);
            }
            $result = $this->cloudflareDnsService->checkSenderDns($sender);
            if ($result['success'] && $result['all_configured']) {
                $sender->dns_verified_at = now();
                $sender->save();
            }
            return $this->successResponse($result, 'DNS status checked');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to check DNS: ' . $e->getMessage(), 500);
        }
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\SystemConfig;
use App\Traits\SuppressionListTrait;
use App\Traits\LoggingTrait;
use App\Traits\FileProcessingTrait;
use Carbon\Carbon;
use Exception;

class PowerMTAService
{
    use SuppressionListTrait, LoggingTrait, FileProcessingTrait;

    protected $baseUrl;
    protected $timeout;

    public function __construct()
    {
        // PMTA management API runs on HTTPS with ?format=json
        // Configured via SystemConfig: powermta_host, powermta_port
        try {
            $host = SystemConfig::getValue('powermta_host', 'localhost');
            $port = SystemConfig::getValue('powermta_port', '8060');
        } catch (\Exception $e) {
            // Database might not be available during test bootstrap
            $host = 'localhost';
            $port = '8060';
        }
        $this->baseUrl = "https://{$host}:{$port}";
        $this->timeout = 15;
    }

    /**
     * Make a GET request to the PMTA management API.
     * The API requires ?format=json query parameter.
     */
    protected function apiGet(string $endpoint, array $params = []): array
    {
        $url = $this->baseUrl . $endpoint;
        $params['format'] = 'json';
        $queryString = http_build_query($params);
        $fullUrl = "{$url}?{$queryString}";

        try {
            $response = Http::withOptions([
                'verify' => false, // PMTA uses self-signed cert
                'timeout' => $this->timeout,
            ])->get($fullUrl);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['status']) && $data['status'] === 'fail') {
                    return ['success' => false, 'error' => $data['message'] ?? 'PMTA API error'];
                }
                return ['success' => true, 'data' => $data['data'] ?? $data];
            }
            return ['success' => false, 'error' => "HTTP {$response->status()}"];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get PowerMTA status — real-time server status from management API
     */
    public function getStatus(): array
    {
        $result = $this->apiGet('/status');

        if (!$result['success']) {
            return [
                'status' => 'offline',
                'message' => $result['error'] ?? 'PowerMTA service unavailable',
                'version' => 'N/A',
                'uptime' => 'N/A',
                'active_connections' => 0,
                'average_delivery_rate' => 0,
                'messages_sent_today' => 0,
                'messages_failed_today' => 0,
                'last_restart' => null,
                'timestamp' => now()->toISOString(),
            ];
        }

        $data = $result['data'];
        $mta = $data['mta'] ?? [];
        $status = $data['status'] ?? [];
        $traffic = $status['traffic'] ?? [];
        $total = $traffic['total'] ?? [];
        $lastHr = $traffic['lastHr'] ?? [];
        $lastMin = $traffic['lastMin'] ?? [];
        $conn = $status['conn'] ?? [];
        $queue = $status['queue'] ?? [];
        $spool = $status['spool'] ?? [];

        // Calculate uptime
        $startupTime = $status['startupTime'] ?? null;
        $uptime = 'N/A';
        if ($startupTime) {
            try {
                $startup = Carbon::parse($startupTime);
                $uptime = $startup->diffForHumans(now(), ['parts' => 2]);
            } catch (\Exception $e) {
                $uptime = $startupTime;
            }
        }

        return [
            'status' => $status['status'] ?? 'unknown',
            'version' => $mta['product']['version'] ?? 'Unknown',
            'variant' => $mta['product']['variant'] ?? 'Unknown',
            'build_date' => $mta['product']['buildDate'] ?? 'N/A',
            'os' => $mta['os']['name'] ?? 'Unknown',
            'os_version' => $mta['os']['version'] ?? 'Unknown',
            'hostname' => $mta['fullHostName'] ?? 'Unknown',
            'cpu_count' => $mta['cpu']['count'] ?? 0,
            'ram' => $mta['ram']['real'] ?? 0,
            'uptime' => $uptime,
            'startup_time' => $startupTime,
            'active_connections' => ($conn['smtpIn']['cur'] ?? 0) + ($conn['smtpOut']['cur'] ?? 0),
            'max_connections' => ($conn['smtpIn']['max'] ?? 0) + ($conn['smtpOut']['max'] ?? 0),
            'top_connections' => ($conn['smtpIn']['top'] ?? 0) + ($conn['smtpOut']['top'] ?? 0),
            'messages_sent_today' => $total['out']['msg'] ?? 0,
            'messages_received_today' => $total['in']['msg'] ?? 0,
            'messages_failed_today' => 0, // Not directly available from status API
            'kb_sent_today' => $total['out']['kb'] ?? 0,
            'kb_received_today' => $total['in']['kb'] ?? 0,
            'bounce_processed' => $total['bounceProcessed'] ?? 0,
            'fbl_processed' => $total['feedbackLoopProcessed'] ?? 0,
            'last_hr_sent' => $lastHr['out']['msg'] ?? 0,
            'last_hr_received' => $lastHr['in']['msg'] ?? 0,
            'last_min_sent' => $lastMin['out']['msg'] ?? 0,
            'last_min_received' => $lastMin['in']['msg'] ?? 0,
            'queue_smtp_rcp' => $queue['smtp']['rcp'] ?? 0,
            'queue_smtp_dom' => $queue['smtp']['dom'] ?? 0,
            'queue_smtp_kb' => $queue['smtp']['kb'] ?? 0,
            'spool_init_pct' => $spool['initPct'] ?? 0,
            'spool_files_in_use' => $spool['files']['inUse'] ?? 0,
            'spool_files_total' => $spool['files']['total'] ?? 0,
            'spool_total_rcp' => $spool['totalRcp'] ?? 0,
            'spool_max_rcp' => $spool['maxRcp'] ?? 0,
            'timestamp' => $status['timeNow'] ?? now()->toISOString(),
        ];
    }

    /**
     * Get top domains from PMTA management API
     */
    public function getDomains(): array
    {
        $result = $this->apiGet('/domains');
        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error'], 'domains' => []];
        }
        return [
            'success' => true,
            'domains' => $result['data']['domains'] ?? [],
            'total_rcp' => $result['data']['totalRcp'] ?? 0,
            'total_domains' => $result['data']['totalDomainsWithRcp'] ?? 0,
        ];
    }

    /**
     * Get queue information from PMTA management API
     */
    public function getQueues(): array
    {
        $result = $this->apiGet('/queues');
        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error'], 'queues' => []];
        }
        return [
            'success' => true,
            'queues' => $result['data']['queues'] ?? [],
            'total_rcp' => $result['data']['totalRcp'] ?? 0,
        ];
    }

    /**
     * Get VMTA information from PMTA management API
     */
    public function getVmtas(): array
    {
        $result = $this->apiGet('/vmtas');
        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error'], 'vmtas' => []];
        }
        return [
            'success' => true,
            'vmtas' => $result['data']['vmtas'] ?? [],
            'total_rcp' => $result['data']['totalRcp'] ?? 0,
            'total_vmtas' => $result['data']['totalVmtasWithRcp'] ?? 0,
        ];
    }

    /**
     * Get job information from PMTA management API
     */
    public function getJobs(): array
    {
        $result = $this->apiGet('/jobs');
        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error'], 'jobs' => []];
        }
        return [
            'success' => true,
            'jobs' => $result['data']['jobs'] ?? [],
            'total_jobs' => $result['data']['totalJobsWithRcp'] ?? 0,
            'total_rcp' => $result['data']['totalRcp'] ?? 0,
        ];
    }

    /**
     * Get log file information from PMTA management API
     */
    public function getLogFiles(): array
    {
        $result = $this->apiGet('/logs');
        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error'], 'files' => []];
        }
        return [
            'success' => true,
            'files' => $result['data']['log']['files'] ?? [],
        ];
    }

    /**
     * Get FBL (Feedback Loop) account data — uses file-based monitoring
     */
    public function getFBLAccounts(): array
    {
        $pmtaService = app(PmtaMonitoringService::class);
        if (!$pmtaService->isEnabled()) {
            return ['success' => false, 'error' => 'PMTA file monitoring not enabled', 'accounts' => []];
        }

        $date = Carbon::now();
        $files = $pmtaService->scanFilesForDate($date, 'fbl');
        $totalComplaints = 0;
        $accounts = [];

        foreach ($files as $filePath) {
            $records = $pmtaService->parseFblFile($filePath);
            foreach ($records as $record) {
                $totalComplaints++;
                $sender = $record['sender'] ?? 'unknown';
                if (!isset($accounts[$sender])) {
                    $accounts[$sender] = [
                        'sender' => $sender,
                        'complaints' => 0,
                        'feedback_types' => [],
                    ];
                }
                $accounts[$sender]['complaints']++;
                $feedbackType = $record['feedback_type'] ?? 'unknown';
                if (!isset($accounts[$sender]['feedback_types'][$feedbackType])) {
                    $accounts[$sender]['feedback_types'][$feedbackType] = 0;
                }
                $accounts[$sender]['feedback_types'][$feedbackType]++;
            }
        }

        return [
            'success' => true,
            'accounts' => array_values($accounts),
            'total_complaints' => $totalComplaints,
            'date' => $date->format('Y-m-d'),
        ];
    }

    /**
     * Get diagnostic files — uses file-based monitoring
     */
    public function getDiagnosticFiles(?string $date = null): array
    {
        $pmtaService = app(PmtaMonitoringService::class);
        if (!$pmtaService->isEnabled()) {
            return ['success' => false, 'error' => 'PMTA file monitoring not enabled', 'files' => []];
        }

        $carbonDate = $date ? Carbon::parse($date) : Carbon::now();
        $files = $pmtaService->scanFilesForDate($carbonDate, 'diag');

        return [
            'success' => true,
            'files' => array_map(function ($file) {
                return [
                    'name' => basename($file),
                    'size' => is_file($file) ? filesize($file) : 0,
                    'readable' => is_readable($file),
                ];
            }, $files),
            'date' => $carbonDate->format('Y-m-d'),
        ];
    }

    /**
     * Parse a diagnostic file — uses file-based monitoring
     */
    public function parseDiagnosticFile(string $filename, ?string $date = null): array
    {
        $pmtaService = app(PmtaMonitoringService::class);
        if (!$pmtaService->isEnabled()) {
            return ['success' => false, 'error' => 'PMTA file monitoring not enabled', 'records' => []];
        }

        $carbonDate = $date ? Carbon::parse($date) : Carbon::now();
        $files = $pmtaService->scanFilesForDate($carbonDate, 'diag');

        foreach ($files as $file) {
            if (basename($file) === $filename) {
                $records = $pmtaService->parseDiagnosticFile($file);
                return ['success' => true, 'records' => $records, 'count' => count($records)];
            }
        }

        return ['success' => false, 'error' => 'File not found', 'records' => []];
    }

    /**
     * Download a diagnostic file
     */
    public function downloadDiagnosticFile(string $filename, ?string $date = null): array
    {
        $pmtaService = app(PmtaMonitoringService::class);
        if (!$pmtaService->isEnabled()) {
            return ['success' => false, 'error' => 'PMTA file monitoring not enabled'];
        }

        $carbonDate = $date ? Carbon::parse($date) : Carbon::now();
        $files = $pmtaService->scanFilesForDate($carbonDate, 'diag');

        foreach ($files as $file) {
            if (basename($file) === $filename) {
                $content = @file_get_contents($file);
                if ($content !== false) {
                    return ['success' => true, 'content' => $content, 'filename' => $filename];
                }
            }
        }

        return ['success' => false, 'error' => 'File not found or not readable'];
    }

    /**
     * Analyze sender reputation — uses file-based monitoring for historical data
     */
    public function analyzeSenderReputation(string $senderEmail, ?string $date = null): array
    {
        $pmtaService = app(PmtaMonitoringService::class);
        if (!$pmtaService->isEnabled()) {
            return [
                'success' => false,
                'error' => 'PMTA file monitoring not enabled. Enable in Admin → System Settings → PMTA Monitoring.',
                'sender_email' => $senderEmail,
            ];
        }

        $carbonDate = $date ? Carbon::parse($date) : Carbon::now();
        $healthScore = $pmtaService->calculateSenderHealthScore($senderEmail, $carbonDate);

        return [
            'success' => true,
            'sender_email' => $senderEmail,
            'date' => $carbonDate->format('Y-m-d'),
            'reputation_metrics' => $healthScore,
        ];
    }

    /**
     * Get reputation summary — combines management API data with file-based monitoring
     */
    public function getReputationSummary(): array
    {
        $domains = $this->getDomains();
        $queues = $this->getQueues();
        $vmtas = $this->getVmtas();

        // Aggregate domain errors
        $totalErrors = 0;
        $blockedDomains = [];
        if ($domains['success']) {
            foreach ($domains['domains'] as $domain) {
                if (!empty($domain['errors'])) {
                    $totalErrors += count($domain['errors']);
                    $blockedDomains[] = [
                        'name' => $domain['name'],
                        'rcp' => $domain['rcp'] ?? 0,
                        'error_count' => count($domain['errors']),
                        'last_error' => $domain['errors'][0]['text'] ?? '',
                        'last_error_time' => $domain['errors'][0]['time'] ?? '',
                    ];
                }
            }
        }

        return [
            'success' => true,
            'total_domains' => $domains['total_domains'] ?? 0,
            'total_rcp' => $domains['total_rcp'] ?? 0,
            'total_vmtas' => $vmtas['total_vmtas'] ?? 0,
            'total_errors' => $totalErrors,
            'blocked_domains' => $blockedDomains,
            'queues' => $queues['queues'] ?? [],
            'vmtas' => $vmtas['vmtas'] ?? [],
        ];
    }

    /**
     * Process bounce files — uses file-based monitoring
     */
    public function processBounceFiles(?string $date = null): array
    {
        $pmtaService = app(PmtaMonitoringService::class);
        if (!$pmtaService->isEnabled()) {
            return ['success' => false, 'error' => 'PMTA file monitoring not enabled'];
        }

        $carbonDate = $date ? Carbon::parse($date) : Carbon::now();
        $files = $pmtaService->scanFilesForDate($carbonDate, 'acct');
        $totalProcessed = 0;
        $totalBounces = 0;

        foreach ($files as $filePath) {
            $records = $pmtaService->parseAccountingFile($filePath);
            foreach ($records as $record) {
                $totalProcessed++;
                $dsnAction = strtolower($record['action'] ?? '');
                $dsnStatus = strtolower($record['status'] ?? '');
                if ($dsnAction === 'failed' || str_starts_with($dsnStatus, '5.')) {
                    $totalBounces++;
                    // Add to suppression list if hard bounce
                    if ($record['recipient'] && $dsnAction === 'failed') {
                        $this->addToSuppressionList(
                            $record['recipient'],
                            'bounce',
                            $record['diagnostic'] ?? 'Bounce from PMTA'
                        );
                    }
                }
            }
        }

        return [
            'success' => true,
            'date' => $carbonDate->format('Y-m-d'),
            'files_processed' => count($files),
            'total_records' => $totalProcessed,
            'total_bounces' => $totalBounces,
        ];
    }

    /**
     * Get training statistics (legacy, kept for compatibility)
     */
    public function getTrainingStatistics(): array
    {
        return ['success' => false, 'error' => 'Training statistics not available via PMTA management API'];
    }

    /**
     * Run training (legacy, kept for compatibility)
     */
    public function runTraining(): array
    {
        return ['success' => false, 'error' => 'Training not available via PMTA management API'];
    }

    /**
     * Get training config (legacy, kept for compatibility)
     */
    public function getTrainingConfig(): array
    {
        return ['success' => false, 'error' => 'Training config not available via PMTA management API'];
    }

    /**
     * Process local log files — uses file-based monitoring
     */
    public function processLocalLogFiles(?string $date = null): array
    {
        $pmtaService = app(PmtaMonitoringService::class);
        if (!$pmtaService->isEnabled()) {
            return ['success' => false, 'error' => 'PMTA file monitoring not enabled'];
        }

        $carbonDate = $date ? Carbon::parse($date) : Carbon::now();
        $summary = $pmtaService->getDailySummary($carbonDate);
        return ['success' => true, 'summary' => $summary];
    }

    /**
     * Get available log files — uses PMTA management API /logs endpoint
     */
    public function getAvailableLogFiles(?string $date = null): array
    {
        $result = $this->getLogFiles();
        return $result;
    }

    /**
     * Get configuration (admin only, requires localhost access)
     */
    public function getConfiguration(): array
    {
        $result = $this->apiGet('/config');
        if (!$result['success']) {
            return [
                'success' => false,
                'error' => $result['error'] ?? 'Config endpoint requires admin access from localhost',
            ];
        }
        return ['success' => true, 'config' => $result['data']];
    }

    /**
     * Update configuration (admin only, requires localhost access)
     */
    public function updateConfiguration(array $config): array
    {
        return ['success' => false, 'error' => 'Configuration updates require admin access from localhost'];
    }
}

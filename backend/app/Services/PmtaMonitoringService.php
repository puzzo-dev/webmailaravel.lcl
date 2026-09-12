<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\SystemConfig;
use App\Models\Sender;
use App\Models\Campaign;
use App\Models\User;

class PmtaMonitoringService
{
    protected array $config;

    public function __construct()
    {
        $this->config = SystemConfig::getPmtaMonitoringConfig();
    }

    public function isEnabled(): bool
    {
        return $this->config['enabled'];
    }

    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Get this project's unique identifier.
     * Used to distinguish this project's PMTA traffic from other projects
     * (e.g. EmailMarketingSaaS) that share the same PMTA engine and use the
     * same X-User-ID / X-Campaign-ID / X-Sender-ID / X-SMTP-Config-ID headers.
     *
     * Without X-Project-ID, user_id=2 in this project's database would be
     * indistinguishable from user_id=2 in EmailMarketingSaaS's database.
     */
    protected function getProjectId(): string
    {
        try {
            return SystemConfig::get('pmta_project_id', config('app.pmta_project_id', 'webmailaravel'));
        } catch (\Exception $e) {
            return config('app.pmta_project_id', 'webmailaravel');
        }
    }

    /**
     * Get valid IDs from this project's database.
     * Used as a secondary filter when X-Project-ID is not available in the
     * PMTA accounting records (e.g. before PMTA config is updated to record
     * header_X-Project-ID).
     */
    protected function getProjectScope(): array
    {
        try {
            return [
                'user_ids' => User::pluck('id')->map(fn($id) => (string)$id)->toArray(),
                'campaign_ids' => Campaign::pluck('id')->map(fn($id) => (string)$id)->toArray(),
                'sender_ids' => Sender::pluck('id')->map(fn($id) => (string)$id)->toArray(),
            ];
        } catch (\Exception $e) {
            return ['user_ids' => [], 'campaign_ids' => [], 'sender_ids' => []];
        }
    }

    /**
     * Check if an accounting record belongs to this project.
     *
     * Primary filter: X-Project-ID header must match this project's identifier.
     * This is the reliable method — it distinguishes this project from
     * EmailMarketingSaaS even when both have user_id=2.
     *
     * Fallback filter: If X-Project-ID is absent (PMTA config not yet updated
     * to record header_X-Project-ID), fall back to checking if X-User-ID
     * matches a user in this project's database. This is less reliable because
     * user IDs can collide between projects.
     */
    protected function belongsToProject(array $record): bool
    {
        $projectId = $this->getProjectId();
        $recordProjectId = (string)($record['project_id'] ?? '');

        // Primary filter: X-Project-ID matches
        if ($recordProjectId !== '' && $recordProjectId !== 'unknown') {
            return $recordProjectId === $projectId;
        }

        // Fallback: X-Project-ID not in the CSV (PMTA config not yet updated).
        // Use X-User-ID matching against this project's database.
        $scope = $this->getProjectScope();
        $userId = (string)($record['user_id'] ?? '');

        if (empty($scope['user_ids'])) {
            return $userId !== '' && $userId !== 'unknown';
        }

        return in_array($userId, $scope['user_ids'], true);
    }

    /**
     * File type prefix mapping — PMTA names files as {prefix}-YYYY-MM-DD-NNNN.csv
     * Active files are in the base directory; archived files are in the subdirectory.
     */
    protected const FILE_TYPE_PREFIXES = [
        'acct' => 'acct',
        'fbl' => 'fbl',
        'diag' => 'diag',
        'bounce' => 'bounce',
        'logs' => 'log',
    ];

    public function getFilePath(string $fileType): string
    {
        $basePath = $this->config['files_path'];
        $subdir = $this->config["{$fileType}_path"] ?? $fileType;
        if (empty($subdir)) {
            return rtrim($basePath, '/');
        }
        return rtrim($basePath, '/') . '/' . ltrim($subdir, '/');
    }

    /**
     * Scan for PMTA files matching a specific date.
     *
     * PMTA writes active files to the base directory (e.g. /root/pmta/logs/acct-2026-09-12-0001.csv)
     * and moves them to a subdirectory when move-interval triggers (e.g. pmta-acct/acct-2026-09-12-0000.csv).
     * This method scans BOTH locations so we catch the active file being written
     * as well as archived files that have already been rolled.
     */
    public function scanFilesForDate(Carbon $date, string $fileType = 'logs'): array
    {
        if (!$this->isEnabled()) {
            return [];
        }

        $basePath = rtrim($this->config['files_path'], '/');
        $subdirPath = $this->getFilePath($fileType);
        $prefix = self::FILE_TYPE_PREFIXES[$fileType] ?? $fileType;

        $dateStr = $date->format('Ymd');
        $dateStrDash = $date->format('Y-m-d');

        $patterns = [
            "{$prefix}-{$dateStr}-*",
            "{$prefix}-{$dateStrDash}-*",
        ];

        $files = [];

        // 1. Scan the base directory for active files (being written now, not yet moved)
        if (is_dir($basePath)) {
            foreach ($patterns as $pattern) {
                $found = glob($basePath . '/' . $pattern);
                if ($found) {
                    $files = array_merge($files, $found);
                }
            }
        }

        // 2. Scan the subdirectory for archived files (already moved by move-interval)
        if (is_dir($subdirPath) && $subdirPath !== $basePath) {
            foreach ($patterns as $pattern) {
                $found = glob($subdirPath . '/' . $pattern);
                if ($found) {
                    $files = array_merge($files, $found);
                }
            }
        }

        return array_values(array_unique($files));
    }

    public function getSystemOverview(): array
    {
        $overview = [
            'enabled' => $this->isEnabled(),
            'config' => $this->config,
            'paths_status' => [],
            'recent_files' => [],
        ];

        if (!$this->isEnabled()) {
            return $overview;
        }

        $fileTypes = ['acct', 'fbl', 'diag', 'bounce', 'logs'];
        foreach ($fileTypes as $fileType) {
            $path = $this->getFilePath($fileType);
            $overview['paths_status'][$fileType] = [
                'path' => $path,
                'exists' => is_dir($path),
                'readable' => is_dir($path) && is_readable($path),
            ];

            $overview['recent_files'][$fileType] = [];
            for ($i = 0; $i < 3; $i++) {
                $checkDate = Carbon::now()->subDays($i);
                $files = $this->scanFilesForDate($checkDate, $fileType);
                foreach ($files as $file) {
                    $overview['recent_files'][$fileType][] = [
                        'file' => basename($file),
                        'date' => $checkDate->format('Y-m-d'),
                        'size' => is_file($file) ? filesize($file) : 0,
                    ];
                }
            }
        }

        return $overview;
    }

    public function parseAccountingFile(string $filePath): array
    {
        $records = [];
        if (!is_file($filePath) || !is_readable($filePath)) {
            return $records;
        }

        $content = $this->readFileContent($filePath);
        if (!$content) {
            return $records;
        }

        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        if (count($lines) < 2) {
            return $records;
        }

        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            $row = str_getcsv($line, ',', '"', '\\');
            if (count($row) < count($headers)) continue;

            $data = array_combine($headers, $row);
            $record = [
                'timestamp' => $data['timeLogged'] ?? '',
                'sender' => $data['orig'] ?? '',
                'recipient' => $data['rcpt'] ?? '',
                'status' => $data['dsnStatus'] ?? '',
                'action' => $data['dsnAction'] ?? '',
                'diagnostic' => $data['dsnDiag'] ?? '',
                'vmta' => $data['vmta'] ?? '',
                'job_id' => $data['jobId'] ?? '',
                'env_id' => $data['envId'] ?? '',
                'bounce_category' => $data['bounceCat'] ?? '',
                'delivery_size' => (int)($data['dlvSize'] ?? 0),
                'user_id' => $data['header_X-User-ID'] ?? $data['X-User-ID'] ?? 'unknown',
                'campaign_id' => $data['header_X-Campaign-ID'] ?? $data['X-Campaign-ID'] ?? 'unknown',
                'sender_id' => $data['header_X-Sender-ID'] ?? $data['X-Sender-ID'] ?? 'unknown',
                'smtp_config_id' => $data['header_X-SMTP-Config-ID'] ?? $data['X-SMTP-Config-ID'] ?? 'unknown',
                'project_id' => $data['header_X-Project-ID'] ?? $data['X-Project-ID'] ?? 'unknown',
            ];

            // Only include records from this project (filter by X-User-ID)
            if ($this->belongsToProject($record)) {
                $records[] = $record;
            }
        }

        return $records;
    }

    public function parseFblFile(string $filePath): array
    {
        $records = [];
        if (!is_file($filePath) || !is_readable($filePath)) {
            return $records;
        }

        $content = $this->readFileContent($filePath);
        if (!$content) {
            return $records;
        }

        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        if (count($lines) < 2) {
            return $records;
        }

        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            $row = str_getcsv($line, ',', '"', '\\');
            if (count($row) < count($headers)) continue;

            $data = array_combine($headers, $row);
            $record = [
                'timestamp' => $data['timeLogged'] ?? '',
                'sender' => $data['orig'] ?? '',
                'recipient' => $data['rcpt'] ?? '',
                'feedback_type' => $data['feedbackType'] ?? '',
                'user_id' => $data['header_X-User-ID'] ?? $data['X-User-ID'] ?? 'unknown',
                'project_id' => $data['header_X-Project-ID'] ?? $data['X-Project-ID'] ?? 'unknown',
                'subject' => $data['header_subject'] ?? '',
            ];

            // Only include records from this project
            if ($this->belongsToProject($record)) {
                $records[] = $record;
            }
        }

        return $records;
    }

    /**
     * Parse PMTA bounce file.
     * Bounce files have columns: type,timeLogged,orig,rcpt,bounceCat,dsnStatus,dsnAction,dsnDiag,dsnMta,vmta,jobId,
     * header_X-User-ID,header_X-Campaign-ID,header_X-SMTP-Config-ID,header_X-Sender-ID,header_X-Project-ID
     */
    public function parseBounceFile(string $filePath): array
    {
        $records = [];
        if (!is_file($filePath) || !is_readable($filePath)) {
            return $records;
        }

        $content = $this->readFileContent($filePath);
        if (!$content) {
            return $records;
        }

        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        if (count($lines) < 2) {
            return $records;
        }

        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            $row = str_getcsv($line, ',', '"', '\\');
            if (count($row) < count($headers)) continue;

            $data = array_combine($headers, $row);
            $record = [
                'timestamp' => $data['timeLogged'] ?? '',
                'sender' => $data['orig'] ?? '',
                'recipient' => $data['rcpt'] ?? '',
                'bounce_category' => $data['bounceCat'] ?? '',
                'status' => $data['dsnStatus'] ?? '',
                'action' => $data['dsnAction'] ?? '',
                'diagnostic' => $data['dsnDiag'] ?? '',
                'vmta' => $data['vmta'] ?? '',
                'job_id' => $data['jobId'] ?? '',
                'user_id' => $data['header_X-User-ID'] ?? $data['X-User-ID'] ?? 'unknown',
                'campaign_id' => $data['header_X-Campaign-ID'] ?? $data['X-Campaign-ID'] ?? 'unknown',
                'sender_id' => $data['header_X-Sender-ID'] ?? $data['X-Sender-ID'] ?? 'unknown',
                'smtp_config_id' => $data['header_X-SMTP-Config-ID'] ?? $data['X-SMTP-Config-ID'] ?? 'unknown',
                'project_id' => $data['header_X-Project-ID'] ?? $data['X-Project-ID'] ?? 'unknown',
            ];

            if ($this->belongsToProject($record)) {
                $records[] = $record;
            }
        }

        return $records;
    }

    public function parseDiagnosticFile(string $filePath): array
    {
        $records = [];
        if (!is_file($filePath) || !is_readable($filePath)) {
            return $records;
        }

        $content = $this->readFileContent($filePath);
        if (!$content) {
            return $records;
        }

        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        if (count($lines) < 2) {
            return $records;
        }

        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            $row = str_getcsv($line, ',', '"', '\\');
            if (count($row) < count($headers)) continue;

            $data = array_combine($headers, $row);
            $record = [
                'timestamp' => $data['timeLogged'] ?? '',
                'sender' => $data['orig'] ?? '',
                'recipient' => $data['rcpt'] ?? '',
                'status' => $data['dsnStatus'] ?? '',
                'diagnostic' => $data['dsnDiag'] ?? '',
                'type' => $data['type'] ?? 'transient',
                'user_id' => $data['header_X-User-ID'] ?? $data['X-User-ID'] ?? 'unknown',
                'project_id' => $data['header_X-Project-ID'] ?? $data['X-Project-ID'] ?? 'unknown',
            ];

            // Only include records from this project
            if ($this->belongsToProject($record)) {
                $records[] = $record;
            }
        }

        return $records;
    }

    public function calculateSenderHealthScore(string $senderEmail, Carbon $date): array
    {
        $stats = [
            'total_sent' => 0,
            'delivered' => 0,
            'bounced' => 0,
            'deferred' => 0,
            'complaints' => 0,
            'spam_blocks' => 0,
            'reputation_issues' => 0,
            'delivery_rate' => 0.0,
            'bounce_rate' => 0.0,
            'complaint_rate' => 0.0,
            'spam_block_rate' => 0.0,
            'health_score' => 0.0,
        ];

        if (!$this->isEnabled()) {
            return $stats;
        }

        try {
            // Process accounting files
            $acctFiles = $this->scanFilesForDate($date, 'acct');
            foreach ($acctFiles as $filePath) {
                $records = $this->parseAccountingFile($filePath);
                foreach ($records as $record) {
                    if (strtolower($record['sender']) !== strtolower($senderEmail)) continue;
                    $stats['total_sent']++;

                    $dsnAction = strtolower($record['action']);
                    $dsnStatus = strtolower($record['status']);

                    if ($dsnAction === 'delivered' || str_starts_with($dsnStatus, '2.')) {
                        $stats['delivered']++;
                    } elseif ($dsnAction === 'failed' || str_starts_with($dsnStatus, '5.')) {
                        $stats['bounced']++;
                    } elseif ($dsnAction === 'delayed' || str_starts_with($dsnStatus, '4.')) {
                        $stats['deferred']++;
                    }
                }
            }

            // Process FBL files for complaints
            $fblFiles = $this->scanFilesForDate($date, 'fbl');
            foreach ($fblFiles as $filePath) {
                $complaints = $this->parseFblFile($filePath);
                foreach ($complaints as $complaint) {
                    if (strtolower($complaint['sender']) === strtolower($senderEmail)) {
                        $stats['complaints']++;
                    }
                }
            }

            // Process diagnostic files
            $diagFiles = $this->scanFilesForDate($date, 'diag');
            foreach ($diagFiles as $filePath) {
                $diagnostics = $this->parseDiagnosticFile($filePath);
                foreach ($diagnostics as $diagnostic) {
                    if (strtolower($diagnostic['sender']) !== strtolower($senderEmail)) continue;
                    if ($diagnostic['type'] === 'spam_block') {
                        $stats['spam_blocks']++;
                    } elseif ($diagnostic['type'] === 'reputation_issue') {
                        $stats['reputation_issues']++;
                    }
                }
            }

            // Calculate rates
            if ($stats['total_sent'] > 0) {
                $stats['delivery_rate'] = ($stats['delivered'] / $stats['total_sent']) * 100;
                $stats['bounce_rate'] = ($stats['bounced'] / $stats['total_sent']) * 100;
                $stats['complaint_rate'] = ($stats['complaints'] / $stats['total_sent']) * 100;
                $stats['spam_block_rate'] = ($stats['spam_blocks'] / $stats['total_sent']) * 100;

                // Health score calculation
                $healthScore = $stats['delivery_rate'];
                if ($stats['bounce_rate'] > 5) {
                    $healthScore -= ($stats['bounce_rate'] - 5) * 2;
                }
                if ($stats['complaint_rate'] > 0.1) {
                    $healthScore -= ($stats['complaint_rate'] - 0.1) * 50;
                }
                if ($stats['spam_block_rate'] > 1) {
                    $healthScore -= ($stats['spam_block_rate'] - 1) * 10;
                }
                if ($stats['reputation_issues'] > 0) {
                    $healthScore -= $stats['reputation_issues'] * 5;
                }
                $stats['health_score'] = max(0, min(100, $healthScore));
            }

            return $stats;
        } catch (\Exception $e) {
            Log::error("PMTA health score calculation failed for {$senderEmail}: " . $e->getMessage());
            return array_merge($stats, ['error' => $e->getMessage()]);
        }
    }

    public function getSenderTrendAnalysis(string $senderEmail, int $days = 7): array
    {
        $dailyStats = [];
        $endDate = Carbon::now();

        for ($i = 0; $i < $days; $i++) {
            $date = (clone $endDate)->subDays($i);
            $score = $this->calculateSenderHealthScore($senderEmail, $date);
            $dailyStats[] = [
                'date' => $date->format('Y-m-d'),
                'health_score' => round($score['health_score'], 2),
                'delivery_rate' => round($score['delivery_rate'], 2),
                'bounce_rate' => round($score['bounce_rate'], 2),
                'complaint_rate' => round($score['complaint_rate'], 4),
                'total_sent' => $score['total_sent'],
            ];
        }

        $dailyStats = array_reverse($dailyStats);

        // Calculate averages
        $validDays = array_filter($dailyStats, fn($d) => $d['total_sent'] > 0);
        $avgHealth = count($validDays) > 0 ? array_sum(array_column($validDays, 'health_score')) / count($validDays) : 0;
        $avgDelivery = count($validDays) > 0 ? array_sum(array_column($validDays, 'delivery_rate')) / count($validDays) : 0;
        $avgBounce = count($validDays) > 0 ? array_sum(array_column($validDays, 'bounce_rate')) / count($validDays) : 0;
        $avgComplaint = count($validDays) > 0 ? array_sum(array_column($validDays, 'complaint_rate')) / count($validDays) : 0;

        // Determine trend
        $trend = 'insufficient_data';
        if (count($validDays) >= 3) {
            $firstHalf = array_slice($validDays, 0, floor(count($validDays) / 2));
            $secondHalf = array_slice($validDays, floor(count($validDays) / 2));
            $firstAvg = array_sum(array_column($firstHalf, 'health_score')) / count($firstHalf);
            $secondAvg = array_sum(array_column($secondHalf, 'health_score')) / count($secondHalf);
            $diff = $secondAvg - $firstAvg;
            if ($diff > 2) $trend = 'improving';
            elseif ($diff < -2) $trend = 'declining';
            else $trend = 'stable';
        }

        return [
            'sender_email' => $senderEmail,
            'days' => $days,
            'daily_stats' => $dailyStats,
            'averages' => [
                'health_score' => round($avgHealth, 2),
                'delivery_rate' => round($avgDelivery, 2),
                'bounce_rate' => round($avgBounce, 2),
                'complaint_rate' => round($avgComplaint, 4),
            ],
            'trend' => $trend,
            'recommendations' => $this->generateRecommendations($avgHealth, $avgBounce, $avgComplaint),
        ];
    }

    public function getDailySummary(Carbon $date): array
    {
        $summary = [
            'date' => $date->format('Y-m-d'),
            'total_sent' => 0,
            'delivered' => 0,
            'bounced' => 0,
            'deferred' => 0,
            'complaints' => 0,
            'users' => [],
            'campaigns' => [],
            'senders' => [],
            'delivery_rate' => 0,
            'bounce_rate' => 0,
            'complaint_rate' => 0,
        ];

        if (!$this->isEnabled()) {
            return $summary;
        }

        try {
            // Process accounting files
            $acctFiles = $this->scanFilesForDate($date, 'acct');
            foreach ($acctFiles as $filePath) {
                $records = $this->parseAccountingFile($filePath);
                foreach ($records as $record) {
                    $summary['total_sent']++;

                    $userId = $record['user_id'];
                    $campaignId = $record['campaign_id'];
                    $senderId = $record['sender_id'];

                    // Track by user
                    if (!isset($summary['users'][$userId])) {
                        $summary['users'][$userId] = ['sent' => 0, 'delivered' => 0, 'bounced' => 0];
                    }
                    $summary['users'][$userId]['sent']++;

                    // Track by campaign
                    if (!isset($summary['campaigns'][$campaignId])) {
                        $summary['campaigns'][$campaignId] = ['sent' => 0, 'delivered' => 0, 'bounced' => 0];
                    }
                    $summary['campaigns'][$campaignId]['sent']++;

                    // Track by sender
                    if (!isset($summary['senders'][$senderId])) {
                        $summary['senders'][$senderId] = ['sent' => 0, 'delivered' => 0, 'bounced' => 0];
                    }
                    $summary['senders'][$senderId]['sent']++;

                    $dsnAction = strtolower($record['action']);
                    $dsnStatus = strtolower($record['status']);

                    if ($dsnAction === 'delivered' || str_starts_with($dsnStatus, '2.')) {
                        $summary['delivered']++;
                        $summary['users'][$userId]['delivered']++;
                        $summary['campaigns'][$campaignId]['delivered']++;
                        $summary['senders'][$senderId]['delivered']++;
                    } elseif ($dsnAction === 'failed' || str_starts_with($dsnStatus, '5.')) {
                        $summary['bounced']++;
                        $summary['users'][$userId]['bounced']++;
                        $summary['campaigns'][$campaignId]['bounced']++;
                        $summary['senders'][$senderId]['bounced']++;
                    } elseif ($dsnAction === 'delayed' || str_starts_with($dsnStatus, '4.')) {
                        $summary['deferred']++;
                    }
                }
            }

            // Process FBL files
            $fblFiles = $this->scanFilesForDate($date, 'fbl');
            foreach ($fblFiles as $filePath) {
                $complaints = $this->parseFblFile($filePath);
                $summary['complaints'] += count($complaints);
            }

            // Process bounce files for detailed bounce breakdown
            $bounceFiles = $this->scanFilesForDate($date, 'bounce');
            $bounceCategories = [];
            foreach ($bounceFiles as $filePath) {
                $bounces = $this->parseBounceFile($filePath);
                foreach ($bounces as $bounce) {
                    $cat = $bounce['bounce_category'] ?: 'unknown';
                    $bounceCategories[$cat] = ($bounceCategories[$cat] ?? 0) + 1;
                }
            }
            $summary['bounce_categories'] = $bounceCategories;

            // Calculate rates
            if ($summary['total_sent'] > 0) {
                $summary['delivery_rate'] = round(($summary['delivered'] / $summary['total_sent']) * 100, 2);
                $summary['bounce_rate'] = round(($summary['bounced'] / $summary['total_sent']) * 100, 2);
                $summary['complaint_rate'] = round(($summary['complaints'] / $summary['total_sent']) * 100, 4);
            }

            return $summary;
        } catch (\Exception $e) {
            Log::error("PMTA daily summary failed: " . $e->getMessage());
            return array_merge($summary, ['error' => $e->getMessage()]);
        }
    }

    public function getDeliveryRateByCampaign(Carbon $date): array
    {
        $campaigns = [];

        if (!$this->isEnabled()) {
            return ['date' => $date->format('Y-m-d'), 'campaigns' => [], 'total_campaigns' => 0];
        }

        $acctFiles = $this->scanFilesForDate($date, 'acct');
        foreach ($acctFiles as $filePath) {
            $records = $this->parseAccountingFile($filePath);
            foreach ($records as $record) {
                $campaignId = $record['campaign_id'];
                if (!$campaignId || $campaignId === 'unknown') continue;

                if (!isset($campaigns[$campaignId])) {
                    $campaigns[$campaignId] = [
                        'campaign_id' => $campaignId,
                        'campaign_name' => null,
                        'total_sent' => 0,
                        'delivered' => 0,
                        'bounced' => 0,
                        'deferred' => 0,
                        'delivery_rate' => 0.0,
                        'bounce_rate' => 0.0,
                    ];
                }

                $campaigns[$campaignId]['total_sent']++;
                $dsnAction = strtolower($record['action']);
                $dsnStatus = strtolower($record['status']);

                if ($dsnAction === 'delivered' || str_starts_with($dsnStatus, '2.')) {
                    $campaigns[$campaignId]['delivered']++;
                } elseif ($dsnAction === 'failed' || str_starts_with($dsnStatus, '5.')) {
                    $campaigns[$campaignId]['bounced']++;
                } elseif ($dsnAction === 'delayed' || str_starts_with($dsnStatus, '4.')) {
                    $campaigns[$campaignId]['deferred']++;
                }
            }
        }

        // Lookup campaign names and calculate rates
        $campaignList = [];
        foreach ($campaigns as $id => $stats) {
            if ($stats['total_sent'] > 0) {
                $stats['delivery_rate'] = round(($stats['delivered'] / $stats['total_sent']) * 100, 2);
                $stats['bounce_rate'] = round(($stats['bounced'] / $stats['total_sent']) * 100, 2);
            }
            // Try to get campaign name
            $campaign = Campaign::find($id);
            if ($campaign) {
                $stats['campaign_name'] = $campaign->name;
            }
            $campaignList[] = $stats;
        }

        usort($campaignList, fn($a, $b) => $a['delivery_rate'] <=> $b['delivery_rate']);

        return [
            'date' => $date->format('Y-m-d'),
            'campaigns' => $campaignList,
            'total_campaigns' => count($campaignList),
        ];
    }

    public function getDeliveryRateByUser(Carbon $date): array
    {
        $users = [];

        if (!$this->isEnabled()) {
            return ['date' => $date->format('Y-m-d'), 'users' => [], 'total_users' => 0, 'avg_delivery_rate' => 0];
        }

        $acctFiles = $this->scanFilesForDate($date, 'acct');
        foreach ($acctFiles as $filePath) {
            $records = $this->parseAccountingFile($filePath);
            foreach ($records as $record) {
                $userId = $record['user_id'];
                if (!$userId || $userId === 'unknown') continue;

                if (!isset($users[$userId])) {
                    $users[$userId] = [
                        'user_id' => $userId,
                        'username' => null,
                        'total_sent' => 0,
                        'delivered' => 0,
                        'bounced' => 0,
                        'deferred' => 0,
                        'unique_campaigns' => 0,
                        'unique_senders' => 0,
                        'delivery_rate' => 0.0,
                        'bounce_rate' => 0.0,
                        '_campaigns' => [],
                        '_senders' => [],
                    ];
                }

                $users[$userId]['total_sent']++;
                $users[$userId]['_campaigns'][$record['campaign_id']] = true;
                $users[$userId]['_senders'][$record['sender_id']] = true;

                $dsnAction = strtolower($record['action']);
                $dsnStatus = strtolower($record['status']);

                if ($dsnAction === 'delivered' || str_starts_with($dsnStatus, '2.')) {
                    $users[$userId]['delivered']++;
                } elseif ($dsnAction === 'failed' || str_starts_with($dsnStatus, '5.')) {
                    $users[$userId]['bounced']++;
                } elseif ($dsnAction === 'delayed' || str_starts_with($dsnStatus, '4.')) {
                    $users[$userId]['deferred']++;
                }
            }
        }

        $userList = [];
        foreach ($users as $id => $stats) {
            if ($stats['total_sent'] > 0) {
                $stats['delivery_rate'] = round(($stats['delivered'] / $stats['total_sent']) * 100, 2);
                $stats['bounce_rate'] = round(($stats['bounced'] / $stats['total_sent']) * 100, 2);
            }
            $stats['unique_campaigns'] = count($stats['_campaigns']);
            $stats['unique_senders'] = count($stats['_senders']);
            unset($stats['_campaigns'], $stats['_senders']);

            // Lookup username
            $user = User::find($id);
            if ($user) {
                $stats['username'] = $user->name ?? $user->email;
            }
            $userList[] = $stats;
        }

        usort($userList, fn($a, $b) => $a['delivery_rate'] <=> $b['delivery_rate']);

        $avgRate = count($userList) > 0 ? array_sum(array_column($userList, 'delivery_rate')) / count($userList) : 0;

        return [
            'date' => $date->format('Y-m-d'),
            'users' => $userList,
            'total_users' => count($userList),
            'avg_delivery_rate' => round($avgRate, 2),
        ];
    }

    public function getSenderReputationByUser(Carbon $date): array
    {
        $userSenders = [];

        if (!$this->isEnabled()) {
            return ['date' => $date->format('Y-m-d'), 'users' => []];
        }

        // Process accounting files
        $acctFiles = $this->scanFilesForDate($date, 'acct');
        foreach ($acctFiles as $filePath) {
            $records = $this->parseAccountingFile($filePath);
            foreach ($records as $record) {
                $userId = $record['user_id'];
                $senderEmail = $record['sender'];
                if (!$userId || !$senderEmail || $userId === 'unknown') continue;

                if (!isset($userSenders[$userId])) {
                    $userSenders[$userId] = [];
                }
                if (!isset($userSenders[$userId][$senderEmail])) {
                    $userSenders[$userId][$senderEmail] = [
                        'sender_email' => $senderEmail,
                        'total_sent' => 0,
                        'delivered' => 0,
                        'bounced' => 0,
                        'deferred' => 0,
                        'complaints' => 0,
                        'delivery_rate' => 0.0,
                        'bounce_rate' => 0.0,
                        'complaint_rate' => 0.0,
                        'health_score' => 0.0,
                    ];
                }

                $userSenders[$userId][$senderEmail]['total_sent']++;
                $dsnAction = strtolower($record['action']);
                $dsnStatus = strtolower($record['status']);

                if ($dsnAction === 'delivered' || str_starts_with($dsnStatus, '2.')) {
                    $userSenders[$userId][$senderEmail]['delivered']++;
                } elseif ($dsnAction === 'failed' || str_starts_with($dsnStatus, '5.')) {
                    $userSenders[$userId][$senderEmail]['bounced']++;
                } elseif ($dsnAction === 'delayed' || str_starts_with($dsnStatus, '4.')) {
                    $userSenders[$userId][$senderEmail]['deferred']++;
                }
            }
        }

        // Process FBL files for complaints
        $fblFiles = $this->scanFilesForDate($date, 'fbl');
        foreach ($fblFiles as $filePath) {
            $complaints = $this->parseFblFile($filePath);
            foreach ($complaints as $complaint) {
                $userId = $complaint['user_id'];
                $senderEmail = $complaint['sender'];
                if (!$userId || !$senderEmail || $userId === 'unknown') continue;
                if (!isset($userSenders[$userId][$senderEmail])) continue;
                $userSenders[$userId][$senderEmail]['complaints']++;
            }
        }

        // Calculate rates and health scores
        $result = [];
        foreach ($userSenders as $userId => $senders) {
            $senderList = [];
            foreach ($senders as $email => $stats) {
                if ($stats['total_sent'] > 0) {
                    $stats['delivery_rate'] = round(($stats['delivered'] / $stats['total_sent']) * 100, 2);
                    $stats['bounce_rate'] = round(($stats['bounced'] / $stats['total_sent']) * 100, 2);
                    $stats['complaint_rate'] = round(($stats['complaints'] / $stats['total_sent']) * 100, 4);

                    $healthScore = $stats['delivery_rate'];
                    if ($stats['bounce_rate'] > 5) $healthScore -= ($stats['bounce_rate'] - 5) * 2;
                    if ($stats['complaint_rate'] > 0.1) $healthScore -= ($stats['complaint_rate'] - 0.1) * 50;
                    $stats['health_score'] = max(0, min(100, $healthScore));
                }
                $senderList[] = $stats;
            }
            usort($senderList, fn($a, $b) => $a['health_score'] <=> $b['health_score']);
            $result[] = [
                'user_id' => $userId,
                'username' => User::find($userId)?->name ?? 'Unknown',
                'senders' => $senderList,
            ];
        }

        return ['date' => $date->format('Y-m-d'), 'users' => $result];
    }

    public function triggerScan(): array
    {
        if (!$this->isEnabled()) {
            return ['success' => false, 'error' => 'PMTA integration is not enabled'];
        }

        $today = Carbon::now();
        $scanResults = [];
        $totalFiles = 0;
        $fileTypes = ['acct', 'fbl', 'diag', 'bounce', 'logs'];

        foreach ($fileTypes as $fileType) {
            $files = $this->scanFilesForDate($today, $fileType);
            $scanResults[$fileType] = [
                'files_found' => count($files),
                'files' => array_map('basename', $files),
            ];
            $totalFiles += count($files);
        }

        return [
            'success' => true,
            'message' => "Scan completed. Found {$totalFiles} files for {$today->format('Y-m-d')}",
            'scan_date' => $today->format('Y-m-d'),
            'results' => $scanResults,
        ];
    }

    protected function generateRecommendations(float $healthScore, float $bounceRate, float $complaintRate): array
    {
        $recs = [];

        if ($healthScore >= 90) {
            $recs[] = 'Excellent sender health. Maintain current sending practices.';
        } elseif ($healthScore >= 75) {
            $recs[] = 'Good sender health. Monitor bounce rates closely.';
        } elseif ($healthScore >= 60) {
            $recs[] = 'Fair sender health. Consider reducing sending volume and cleaning recipient lists.';
        } elseif ($healthScore >= 40) {
            $recs[] = 'Poor sender health. Pause sending and investigate bounce/complaint sources.';
        } else {
            $recs[] = 'Critical sender health. Stop sending immediately and review all practices.';
        }

        if ($bounceRate > 10) {
            $recs[] = "Critical: Bounce rate ({$bounceRate}%) is very high. Clean your recipient list immediately.";
        } elseif ($bounceRate > 5) {
            $recs[] = "Warning: Bounce rate ({$bounceRate}%) is above acceptable threshold (5%).";
        }

        if ($complaintRate > 0.5) {
            $recs[] = "Critical: Complaint rate ({$complaintRate}%) is very high. Review content relevance.";
        } elseif ($complaintRate > 0.1) {
            $recs[] = "Warning: Complaint rate ({$complaintRate}%) is above threshold (0.1%).";
        }

        return $recs;
    }

    protected function readFileContent(string $filePath): ?string
    {
        if (str_ends_with($filePath, '.gz')) {
            $content = @file_get_contents('compress.zlib://' . $filePath);
            return $content ?: null;
        }
        return @file_get_contents($filePath) ?: null;
    }
}

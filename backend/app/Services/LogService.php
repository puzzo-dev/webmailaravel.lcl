<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class LogService
{
    /**
     * Get list of available log files.
     */
    public function getLogFilesList(): array
    {
        $logPath = storage_path('logs');

        if (!is_dir($logPath)) {
            return [];
        }

        $files = File::files($logPath);

        return collect($files)
            ->map(fn ($file) => $file->getFilename())
            ->filter(fn ($filename) => str_ends_with($filename, '.log'))
            ->values()
            ->toArray();
    }

    /**
     * Check if a log file name is valid and exists.
     */
    public function fileExists(string $filename): bool
    {
        return in_array($filename, $this->getLogFilesList(), true);
    }

    /**
     * Parse a log file and extract structured entries.
     */
    public function parseLogFile(string $filename, int $limit = 100): array
    {
        $logPath = storage_path("logs/{$filename}");

        if (!File::exists($logPath)) {
            return [];
        }

        $content = File::get($logPath);
        $lines = explode("\n", $content);
        $logs = [];
        $currentLog = null;
        $logIndex = 0;

        foreach ($lines as $line) {
            if (empty(trim($line))) {
                continue;
            }

            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.+)$/', $line, $matches)) {
                if ($currentLog) {
                    $logs[$logIndex] = $currentLog;
                    $logIndex++;

                    if ($logIndex >= $limit) {
                        break;
                    }
                }

                $currentLog = [
                    'id' => $logIndex,
                    'timestamp' => $matches[1],
                    'level' => strtoupper($matches[2]),
                    'channel' => $matches[3],
                    'message' => $matches[4],
                    'context' => [],
                ];
            } else {
                if ($currentLog) {
                    $currentLog['context'][] = $line;
                }
            }
        }

        if ($currentLog && $logIndex < $limit) {
            $logs[$logIndex] = $currentLog;
        }

        return array_reverse($logs); // Most recent first
    }

    /**
     * Clear a single log file. Returns false if file not found.
     */
    public function clearLogFile(string $filename): bool
    {
        $filename = basename($filename);

        if (!preg_match('/^[a-zA-Z0-9._-]+\.log$/', $filename)) {
            return false;
        }

        $logPath = storage_path("logs/{$filename}");

        if (!File::exists($logPath)) {
            return false;
        }

        File::put($logPath, '');

        return true;
    }

    /**
     * Clear all log files. Returns ['cleared' => int, 'total' => int].
     */
    public function clearAllLogs(): array
    {
        $logFiles = $this->getLogFilesList();
        $clearedCount = 0;

        foreach ($logFiles as $file) {
            $logPath = storage_path("logs/{$file}");

            if (File::exists($logPath)) {
                File::put($logPath, '');
                $clearedCount++;
            }
        }

        return [
            'cleared' => $clearedCount,
            'total' => count($logFiles),
        ];
    }

    /**
     * Get metadata for a log file. Returns null if not found.
     */
    public function getLogFileDetails(string $filename): ?array
    {
        $filename = basename($filename);

        if (!preg_match('/^[a-zA-Z0-9._-]+\.log$/', $filename)) {
            return null;
        }

        $logPath = storage_path("logs/{$filename}");

        if (!File::exists($logPath)) {
            return null;
        }

        return [
            'filename' => $filename,
            'size' => File::size($logPath),
            'last_modified' => File::lastModified($logPath),
        ];
    }
}

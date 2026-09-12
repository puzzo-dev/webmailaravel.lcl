<?php

namespace App\Http\Controllers;

use App\Services\LogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LogController extends Controller
{
    public function __construct(
        protected LogService $logService
    ) {}

    /**
     * Display a listing of log entries.
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $selectedFile = $request->get('file', 'laravel.log');

            if (!$this->logService->fileExists($selectedFile)) {
                return $this->errorResponse('Invalid log file', 400);
            }

            $logs = $this->logService->parseLogFile($selectedFile, (int) $request->get('limit', 100));

            return [
                'files' => $this->logService->getLogFilesList(),
                'current_file' => $selectedFile,
                'logs' => $logs,
            ];
        }, 'view_logs');
    }

    /**
     * Display the specified log entry.
     */
    public function show(Request $request, $logId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $logId) {
            $selectedFile = $request->get('file', 'laravel.log');

            if (!$this->logService->fileExists($selectedFile)) {
                return $this->errorResponse('Invalid log file', 400);
            }

            $logs = $this->logService->parseLogFile($selectedFile, 1000);
            $logEntry = $logs[$logId] ?? null;

            if (!$logEntry) {
                return $this->errorResponse('Log entry not found', 404);
            }

            return $logEntry;
        }, 'view_log_entry');
    }

    /**
     * Remove (clear) the specified log file.
     */
    public function destroy(Request $request, $logId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $selectedFile = $request->get('file', 'laravel.log');

            if (!$this->logService->fileExists($selectedFile)) {
                return $this->errorResponse('Invalid log file', 400);
            }

            if (!$this->logService->clearLogFile($selectedFile)) {
                return $this->errorResponse('Log file not found', 404);
            }

            return ['message' => 'Log file cleared successfully'];
        }, 'clear_log');
    }

    /**
     * Clear all log files.
     */
    public function clear(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            $clearedCount = $this->logService->clearAllLogs();

            return [
                'files_cleared' => $clearedCount['cleared'],
                'total_files' => $clearedCount['total'],
            ];
        }, 'clear_all_logs');
    }

    /**
     * Get available log files (admin only).
     */
    public function getLogFiles(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            return ['files' => $this->logService->getLogFilesList()];
        }, 'list_log_files');
    }

    /**
     * Download log file metadata (admin only).
     */
    public function download(Request $request, $filename): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($filename) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $details = $this->logService->getLogFileDetails($filename);

            if ($details === null) {
                return $this->errorResponse('Log file not found', 404);
            }

            return $details;
        }, 'download_log_file');
    }

    /**
     * Clear specific log file (admin only).
     */
    public function clearLogFile(Request $request, $filename): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($filename) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            if (!$this->logService->clearLogFile($filename)) {
                return $this->errorResponse('Log file not found', 404);
            }

            return ['message' => 'Log file cleared successfully'];
        }, 'clear_log_file');
    }
}

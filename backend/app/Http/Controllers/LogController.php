<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\FileProcessingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class LogController extends Controller
{
    use FileProcessingTrait;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $logFiles = $this->getLogFilesList();
            $selectedFile = $request->get('file', 'laravel.log');
            
            if (!in_array($selectedFile, $logFiles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid log file'
                ], 400);
            }

            $logs = $this->parseLogFile($selectedFile, $request->get('limit', 100));
            
            Log::info('Logs viewed', [
                'user_id' => auth()->id(),
                'file' => $selectedFile,
                'count' => count($logs)
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'files' => $logFiles,
                    'current_file' => $selectedFile,
                    'logs' => $logs
                ],
                'message' => 'Logs retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Logs view failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve logs'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, $logId): JsonResponse
    {
        try {
            $logFiles = $this->getLogFilesList();
            $selectedFile = $request->get('file', 'laravel.log');
            
            if (!in_array($selectedFile, $logFiles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid log file'
                ], 400);
            }

            $logs = $this->parseLogFile($selectedFile, 1000);
            $logEntry = $logs[$logId] ?? null;
            
            if (!$logEntry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log entry not found'
                ], 404);
            }

            Log::info('Log entry viewed', [
                'user_id' => auth()->id(),
                'file' => $selectedFile,
                'log_id' => $logId
            ]);

            return response()->json([
                'success' => true,
                'data' => $logEntry,
                'message' => 'Log entry retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Log entry view failed', [
                'user_id' => auth()->id(),
                'log_id' => $logId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve log entry'
            ], 500);
        }
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Request $request, $logId): JsonResponse
    {
        try {
            $logFiles = $this->getLogFilesList();
            $selectedFile = $request->get('file', 'laravel.log');
            
            if (!in_array($selectedFile, $logFiles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid log file'
                ], 400);
            }

            // For log files, we can't delete individual entries
            // Instead, we'll clear the entire file
            $logPath = storage_path("logs/{$selectedFile}");
            
            if (File::exists($logPath)) {
                File::put($logPath, '');
                
                Log::info('Log file cleared', [
                    'user_id' => auth()->id(),
                    'file' => $selectedFile
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Log file cleared successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Log file not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Log file clear failed', [
                'user_id' => auth()->id(),
                'file' => $selectedFile ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear log file'
            ], 500);
        }
    }

    /**
     * Clear all logs
     */
    public function clear(Request $request): JsonResponse
    {
        try {
            $logFiles = $this->getLogFilesList();
            $clearedCount = 0;
            
            foreach ($logFiles as $file) {
                $logPath = storage_path("logs/{$file}");
                
                if (File::exists($logPath)) {
                    File::put($logPath, '');
                    $clearedCount++;
                }
            }
            
            Log::info('All log files cleared', [
                'user_id' => auth()->id(),
                'files_cleared' => $clearedCount
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'files_cleared' => $clearedCount,
                    'total_files' => count($logFiles)
                ],
                'message' => 'All log files cleared successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Log files clear failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear log files'
            ], 500);
        }
    }

    /**
     * Get available log files (admin only)
     */
    public function getLogFiles(): JsonResponse
    {
        try {
            if (!auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin access required'
                ], 403);
            }

            $logFiles = $this->getLogFilesList();
            
            Log::info('Log files listed', [
                'user_id' => auth()->id(),
                'files_count' => count($logFiles)
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'files' => $logFiles
                ],
                'message' => 'Log files retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Log files list failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve log files'
            ], 500);
        }
    }

    /**
     * Download log file (admin only)
     */
    public function download(Request $request, $filename): JsonResponse
    {
        try {
            if (!auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin access required'
                ], 403);
            }

            $logPath = storage_path("logs/{$filename}");
            
            if (!File::exists($logPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log file not found'
                ], 404);
            }

            Log::info('Log file downloaded', [
                'user_id' => auth()->id(),
                'filename' => $filename
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $filename,
                    'size' => File::size($logPath),
                    'last_modified' => File::lastModified($logPath)
                ],
                'message' => 'Log file details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Log file download failed', [
                'user_id' => auth()->id(),
                'filename' => $filename ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve log file'
            ], 500);
        }
    }

    /**
     * Clear specific log file (admin only)
     */
    public function clearLogFile(Request $request, $filename): JsonResponse
    {
        try {
            if (!auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin access required'
                ], 403);
            }

            $logPath = storage_path("logs/{$filename}");
            
            if (!File::exists($logPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log file not found'
                ], 404);
            }

            File::put($logPath, '');
            
            Log::info('Log file cleared', [
                'user_id' => auth()->id(),
                'filename' => $filename
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log file cleared successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Log file clear failed', [
                'user_id' => auth()->id(),
                'filename' => $filename ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear log file'
            ], 500);
        }
    }

    /**
     * Get available log files
     */
    protected function getLogFilesList(): array
    {
        $logPath = storage_path('logs');
        $files = File::files($logPath);
        
        return collect($files)
            ->map(function ($file) {
                return $file->getFilename();
            })
            ->filter(function ($filename) {
                return str_ends_with($filename, '.log');
            })
            ->values()
            ->toArray();
    }

    /**
     * Parse log file and extract entries
     */
    protected function parseLogFile(string $filename, int $limit = 100): array
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

            // Check if this is a new log entry (starts with timestamp)
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.+)$/', $line, $matches)) {
                // Save previous log entry if exists
                if ($currentLog) {
                    $logs[$logIndex] = $currentLog;
                    $logIndex++;
                    
                    if ($logIndex >= $limit) {
                        break;
                    }
                }

                // Start new log entry
                $currentLog = [
                    'id' => $logIndex,
                    'timestamp' => $matches[1],
                    'level' => strtoupper($matches[2]),
                    'channel' => $matches[3],
                    'message' => $matches[4],
                    'context' => []
                ];
            } else {
                // This is part of the context (JSON data)
                if ($currentLog) {
                    $currentLog['context'][] = $line;
                }
            }
        }

        // Add the last log entry
        if ($currentLog && $logIndex < $limit) {
            $logs[$logIndex] = $currentLog;
        }

        return array_reverse($logs); // Most recent first
    }
} 
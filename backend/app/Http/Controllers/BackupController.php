<?php

namespace App\Http\Controllers;

use App\Models\Backup;
use App\Services\BackupService;
use App\Traits\FileProcessingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BackupController extends Controller
{
    use FileProcessingTrait;
    
    protected BackupService $backupService;

    public function __construct(BackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    /**
     * Create a backup
     */
    public function create(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();
            
            // Check if user has admin permission
            if (!$user || !$user->hasRole('admin')) {
                return $this->errorResponse('Access denied - admin privileges required', 403);
            }
            
            $description = $request->input('description');
            
            \Log::info('Backup creation initiated', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'description' => $description
            ]);
            
            $backup = $this->backupService->createBackup($user, $description);
            
            if ($backup) {
                \Log::info('Backup created successfully via API', [
                    'backup_id' => $backup->id,
                    'backup_name' => $backup->name,
                    'user_id' => $user->id
                ]);
                return $this->successResponse($backup, 'Backup created successfully');
            } else {
                \Log::error('Backup creation failed via API', [
                    'user_id' => $user->id,
                    'description' => $description
                ]);
                return $this->errorResponse('Failed to create backup', 500);
            }
        }, 'backup_creation');
    }

    /**
     * Restore from backup
     */
    public function restore(Backup $backup): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($backup) {
            $user = auth()->user();
            
            // Check if user has permission to restore backups
            if (!$user->hasRole('admin')) {
                return $this->errorResponse('Access denied - admin privileges required', 403);
            }
            
            // Validate backup status
            if ($backup->status === 'failed') {
                return $this->errorResponse('Cannot restore from a failed backup', 400);
            }
            
            if ($backup->status === 'restoring') {
                return $this->errorResponse('Backup restore is already in progress', 409);
            }
            
            if (!$backup->fileExists()) {
                return $this->errorResponse('Backup file no longer exists', 404);
            }
            
            \Log::info('Backup restore initiated by user', [
                'backup_id' => $backup->id,
                'backup_name' => $backup->name,
                'user_id' => $user->id,
                'user_name' => $user->name
            ]);
            
            $success = $this->backupService->restoreBackup($backup, $user);
            
            if ($success) {
                return $this->successResponse([
                    'backup_id' => $backup->id,
                    'backup_name' => $backup->name,
                    'restored_at' => now(),
                    'restored_by' => $user->name
                ], 'Backup restored successfully');
            } else {
                return $this->errorResponse('Failed to restore backup - check logs for details', 500);
            }
        }, 'backup_restore');
    }

    /**
     * List available backups
     */
    public function index(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            $backups = Backup::with('createdBy')->orderBy('created_at', 'desc')->get();
            return $this->successResponse($backups, 'Backups retrieved successfully');
        }, 'backup_listing');
    }

    /**
     * Show individual backup details
     */
    public function show(Backup $backup): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($backup) {
            $backup->load('createdBy');
            return $this->successResponse($backup, 'Backup details retrieved successfully');
        }, 'backup_show');
    }

    /**
     * Get backup statistics
     */
    public function getStatistics(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            $stats = $this->backupService->getBackupStats();
            return $this->successResponse($stats, 'Backup statistics retrieved successfully');
        }, 'backup_statistics');
    }

    /**
     * Download backup
     */
    public function download(Backup $backup)
    {
        try {
            // Check if user has permission to download backups
            if (!auth()->user()->hasRole('admin')) {
                return $this->errorResponse('Access denied', 403);
            }

            $filePath = $this->backupService->downloadBackup($backup);
            
            if (!$filePath || !file_exists($filePath)) {
                return $this->errorResponse('Backup file not found', 404);
            }

            // Verify file is readable
            if (!is_readable($filePath)) {
                return $this->errorResponse('Backup file is not readable', 403);
            }

            // Get file info
            $fileSize = filesize($filePath);
            $mimeType = mime_content_type($filePath) ?: 'application/zip';
            
            // Generate safe filename for download
            $downloadName = $backup->filename ?: basename($filePath);
            
            // Return file download response with proper headers
            return response()->download($filePath, $downloadName, [
                'Content-Type' => $mimeType,
                'Content-Length' => $fileSize,
                'Content-Disposition' => 'attachment; filename="' . $downloadName . '"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Backup download failed', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('Failed to download backup: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete backup
     */
    public function destroy(Backup $backup): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($backup) {
            $success = $this->backupService->deleteBackup($backup);
            
            if ($success) {
                return $this->successResponse(null, 'Backup deleted successfully');
            } else {
                return $this->errorResponse('Failed to delete backup', 400);
            }
        }, 'backup_deletion');
    }
} 
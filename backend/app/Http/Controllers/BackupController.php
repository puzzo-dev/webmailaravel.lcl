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
            $description = $request->input('description');
            
            $backup = $this->backupService->createBackup($user, $description);
            
            if ($backup) {
                return $this->successResponse($backup, 'Backup created successfully');
            } else {
                return $this->errorResponse('Failed to create backup', 400);
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
            
            $success = $this->backupService->restoreBackup($backup, $user);
            
            if ($success) {
                return $this->successResponse(null, 'Backup restored successfully');
            } else {
                return $this->errorResponse('Failed to restore backup', 400);
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
    public function download(Backup $backup): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($backup) {
            $filePath = $this->backupService->downloadBackup($backup);
            
            if ($filePath && file_exists($filePath)) {
                return response()->download($filePath, $backup->filename);
            } else {
                return $this->errorResponse('Backup file not found', 400);
            }
        }, 'backup_download');
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
<?php

namespace App\Http\Controllers;

use App\Services\BackupService;
use App\Traits\FileResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BackupController extends Controller
{
    use FileResponseTrait;
    
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
        return $this->backupRestore(
            function () {
                return $this->backupService->createBackup();
            },
            'backup_creation'
        );
    }

    /**
     * Restore from backup
     */
    public function restore(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            ['backup_file' => 'required|string'],
            function () use ($request) {
                $backupFile = $request->input('validated_data')['backup_file'];
                return $this->backupService->restoreBackup($backupFile);
            },
            'backup_restore'
        );
    }

    /**
     * List available backups
     */
    public function list(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            $backups = $this->backupService->listBackups();
            return $this->successResponse($backups, 'Backups retrieved successfully');
        }, 'backup_listing');
    }

    /**
     * Download backup
     */
    public function download(string $filename): JsonResponse
    {
        return $this->downloadFile(
            storage_path("app/backups/{$filename}"),
            $filename,
            'backup_download'
        );
    }

    /**
     * Delete backup
     */
    public function delete(string $filename): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($filename) {
            $result = $this->backupService->deleteBackup($filename);
            
            if ($result['success']) {
                return $this->successResponse(null, 'Backup deleted successfully');
            } else {
                return $this->badRequestResponse('Failed to delete backup: ' . $result['error']);
            }
        }, 'backup_deletion');
    }
} 
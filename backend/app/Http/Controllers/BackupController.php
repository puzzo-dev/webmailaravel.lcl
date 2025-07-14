<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;

class BackupController extends Controller
{
    /**
     * List all backups
     */
    public function index(): JsonResponse
    {
        try {
            $backups = Backup::orderBy('created_at', 'desc')->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $backups,
                'message' => 'Backups retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve backups'
            ], 500);
        }
    }

    /**
     * Create a new backup
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'description' => 'nullable|string|max:255'
            ]);

            // Generate backup filename
            $filename = 'backup_' . now()->format('Y-m-d_H-i-s') . '.sql';
            $backupPath = storage_path('app/backups/' . $filename);

            // Create backups directory if it doesn't exist
            if (!file_exists(dirname($backupPath))) {
                mkdir(dirname($backupPath), 0755, true);
            }

            // Run PostgreSQL backup command
            $command = sprintf(
                'pg_dump -h %s -U %s -d %s > %s',
                config('database.connections.pgsql.host'),
                config('database.connections.pgsql.username'),
                config('database.connections.pgsql.database'),
                $backupPath
            );

            $output = shell_exec($command . ' 2>&1');

            if (!file_exists($backupPath)) {
                throw new \Exception('Backup creation failed: ' . $output);
            }

            // Create backup record
            $backup = Backup::create([
                'path' => $backupPath,
                'filename' => $filename,
                'size' => filesize($backupPath),
                'description' => $request->description,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $backup,
                'message' => 'Backup created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download backup file
     */
    public function download(string $id): JsonResponse
    {
        try {
            $backup = Backup::findOrFail($id);

            if (!file_exists($backup->path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            return response()->download($backup->path, $backup->filename);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download backup'
            ], 500);
        }
    }

    /**
     * Restore backup
     */
    public function restore(string $id): JsonResponse
    {
        try {
            $backup = Backup::findOrFail($id);

            if (!file_exists($backup->path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            // Run PostgreSQL restore command
            $command = sprintf(
                'psql -h %s -U %s -d %s < %s',
                config('database.connections.pgsql.host'),
                config('database.connections.pgsql.username'),
                config('database.connections.pgsql.database'),
                $backup->path
            );

            $output = shell_exec($command . ' 2>&1');

            // Update backup record
            $backup->update([
                'restored_at' => now(),
                'restored_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Backup restored successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete backup
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $backup = Backup::findOrFail($id);

            // Delete file if it exists
            if (file_exists($backup->path)) {
                unlink($backup->path);
            }

            $backup->delete();

            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete backup'
            ], 500);
        }
    }

    /**
     * Get backup statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_backups' => Backup::count(),
                'total_size' => Backup::sum('size'),
                'latest_backup' => Backup::latest()->first(),
                'backups_this_month' => Backup::whereMonth('created_at', now()->month)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Backup statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve backup statistics'
            ], 500);
        }
    }
} 
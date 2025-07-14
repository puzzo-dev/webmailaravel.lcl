<?php

namespace App\Services;

use App\Models\Backup;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class BackupService
{
    /**
     * Create a new database backup
     */
    public function createBackup(User $user, string $description = null): ?Backup
    {
        try {
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $backupPath = 'backups/' . $filename;
            $fullPath = storage_path('app/' . $backupPath);

            // Ensure backup directory exists
            if (!file_exists(dirname($fullPath))) {
                mkdir(dirname($fullPath), 0755, true);
            }

            // Create PostgreSQL backup
            $this->createPostgreSQLBackup($fullPath);

            // Get file size
            $fileSize = file_exists($fullPath) ? filesize($fullPath) : 0;

            // Create backup record
            $backup = Backup::create([
                'path' => $backupPath,
                'filename' => $filename,
                'size' => $fileSize,
                'description' => $description,
                'created_by' => $user->id,
            ]);

            Log::info('Database backup created', [
                'backup_id' => $backup->id,
                'filename' => $filename,
                'size' => $fileSize,
                'created_by' => $user->id
            ]);

            return $backup;

        } catch (\Exception $e) {
            Log::error('Backup creation failed', [
                'error' => $e->getMessage(),
                'created_by' => $user->id
            ]);

            return null;
        }
    }

    /**
     * Create PostgreSQL backup using pg_dump
     */
    private function createPostgreSQLBackup(string $filePath): void
    {
        $database = config('database.connections.pgsql.database');
        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');
        $username = config('database.connections.pgsql.username');
        $password = config('database.connections.pgsql.password');

        // Set password environment variable
        putenv("PGPASSWORD={$password}");

        // Create pg_dump command
        $command = "pg_dump -h {$host} -p {$port} -U {$username} -d {$database} -f {$filePath}";

        // Execute backup command
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception('PostgreSQL backup failed: ' . implode("\n", $output));
        }
    }

    /**
     * Restore database from backup
     */
    public function restoreBackup(Backup $backup, User $user): bool
    {
        try {
            $fullPath = storage_path('app/' . $backup->path);

            if (!file_exists($fullPath)) {
                throw new \Exception('Backup file not found');
            }

            // Restore PostgreSQL backup
            $this->restorePostgreSQLBackup($fullPath);

            // Update backup record
            $backup->update([
                'restored_at' => now(),
                'restored_by' => $user->id,
            ]);

            Log::info('Database backup restored', [
                'backup_id' => $backup->id,
                'restored_by' => $user->id
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Backup restoration failed', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage(),
                'restored_by' => $user->id
            ]);

            return false;
        }
    }

    /**
     * Restore PostgreSQL backup using psql
     */
    private function restorePostgreSQLBackup(string $filePath): void
    {
        $database = config('database.connections.pgsql.database');
        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');
        $username = config('database.connections.pgsql.username');
        $password = config('database.connections.pgsql.password');

        // Set password environment variable
        putenv("PGPASSWORD={$password}");

        // Create psql command
        $command = "psql -h {$host} -p {$port} -U {$username} -d {$database} -f {$filePath}";

        // Execute restore command
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception('PostgreSQL restore failed: ' . implode("\n", $output));
        }
    }

    /**
     * Download backup file
     */
    public function downloadBackup(Backup $backup): ?string
    {
        try {
            $fullPath = storage_path('app/' . $backup->path);

            if (!file_exists($fullPath)) {
                return null;
            }

            return $fullPath;

        } catch (\Exception $e) {
            Log::error('Backup download failed', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Delete backup
     */
    public function deleteBackup(Backup $backup): bool
    {
        try {
            $fullPath = storage_path('app/' . $backup->path);

            // Delete file if exists
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            // Delete backup record
            $backup->delete();

            Log::info('Backup deleted', [
                'backup_id' => $backup->id,
                'filename' => $backup->filename
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Backup deletion failed', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Get backup statistics
     */
    public function getBackupStats(): array
    {
        $totalBackups = Backup::count();
        $totalSize = Backup::sum('size');
        $recentBackups = Backup::where('created_at', '>', now()->subDays(7))->count();

        return [
            'total_backups' => $totalBackups,
            'total_size' => $totalSize,
            'recent_backups' => $recentBackups,
            'average_size' => $totalBackups > 0 ? $totalSize / $totalBackups : 0,
        ];
    }

    /**
     * Clean up old backups (older than 30 days)
     */
    public function cleanupOldBackups(): int
    {
        $cutoff = now()->subDays(30);
        $oldBackups = Backup::where('created_at', '<', $cutoff)->get();
        
        $deletedCount = 0;
        
        foreach ($oldBackups as $backup) {
            if ($this->deleteBackup($backup)) {
                $deletedCount++;
            }
        }

        Log::info('Old backups cleaned up', ['count' => $deletedCount]);
        
        return $deletedCount;
    }
} 
 
 
 
 
 
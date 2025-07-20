<?php

namespace App\Services;

use App\Models\Backup;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Traits\LoggingTrait;
use App\Traits\FileProcessingTrait;
use App\Traits\ValidationTrait;

class BackupService
{
    use LoggingTrait, FileProcessingTrait, ValidationTrait;

    /**
     * Create a new database backup
     */
    public function createBackup(User $user, string $description = null): ?Backup
    {
        try {
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sqlite';
            $backupPath = 'backups/' . $filename;

            // Create SQLite backup by copying the database file
            $this->createSQLiteBackup($backupPath);

            // Get file size using Storage facade
            $fileSize = Storage::disk('local')->size($backupPath);

            // Create backup record
            $backup = Backup::create([
                'path' => $backupPath,
                'filename' => $filename,
                'size' => $fileSize,
                'description' => $description,
                'created_by' => $user->id,
                'status' => 'completed', // Set status to completed
                'type' => 'database', // Set type to database
            ]);

            $this->logInfo('Database backup created', [
                'backup_id' => $backup->id,
                'filename' => $filename,
                'size' => $fileSize,
                'created_by' => $user->id
            ]);

            return $backup;

        } catch (\Exception $e) {
            $this->logError('Backup creation failed', [
                'error' => $e->getMessage(),
                'created_by' => $user->id
            ]);

            return null;
        }
    }

    /**
     * Create SQLite backup by copying the database file
     */
    private function createSQLiteBackup(string $backupPath): void
    {
        $databasePath = database_path('database.sqlite');
        
        if (!file_exists($databasePath)) {
            throw new \Exception('SQLite database file not found: ' . $databasePath);
        }

        // Copy SQLite database file to backup location
        $backupContent = file_get_contents($databasePath);
        
        if ($backupContent === false) {
            throw new \Exception('Failed to read SQLite database file');
        }

        // Store backup using Laravel Storage
        Storage::disk('local')->put($backupPath, $backupContent);
    }

    /**
     * Restore database from backup
     */
    public function restoreBackup(Backup $backup, User $user): bool
    {
        try {
            if (!Storage::disk('local')->exists($backup->path)) {
                throw new \Exception('Backup file not found');
            }

            // Get backup content and restore SQLite database
            $backupContent = Storage::disk('local')->get($backup->path);
            $this->restoreSQLiteBackup($backupContent);

            // Update backup record
            $backup->update([
                'restored_at' => now(),
                'restored_by' => $user->id,
            ]);

            $this->logInfo('Database backup restored', [
                'backup_id' => $backup->id,
                'restored_by' => $user->id
            ]);

            return true;

        } catch (\Exception $e) {
            $this->logError('Backup restoration failed', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage(),
                'restored_by' => $user->id
            ]);

            return false;
        }
    }

    /**
     * Restore SQLite backup by replacing the database file
     */
    private function restoreSQLiteBackup(string $backupContent): void
    {
        $databasePath = database_path('database.sqlite');
        
        if (!$databasePath) {
            throw new \Exception('SQLite database path not configured');
        }

        // Create backup of current database before restoration
        $currentBackupPath = $databasePath . '.restore_backup_' . time();
        if (file_exists($databasePath)) {
            copy($databasePath, $currentBackupPath);
        }

        try {
            // Write backup content to database file
            $result = file_put_contents($databasePath, $backupContent);
            
            if ($result === false) {
                throw new \Exception('Failed to write backup to database file');
            }

            // Verify database integrity
            if (!$this->verifySQLiteDatabase($databasePath)) {
                throw new \Exception('Restored database failed integrity check');
            }

            // Remove temporary backup on success
            if (file_exists($currentBackupPath)) {
                unlink($currentBackupPath);
            }

        } catch (\Exception $e) {
            // Restore original database on failure
            if (file_exists($currentBackupPath)) {
                copy($currentBackupPath, $databasePath);
                unlink($currentBackupPath);
            }
            throw $e;
        }
    }

    /**
     * Verify SQLite database integrity
     */
    private function verifySQLiteDatabase(string $databasePath): bool
    {
        try {
            $pdo = new \PDO("sqlite:{$databasePath}");
            $result = $pdo->query("PRAGMA integrity_check");
            
            if ($result) {
                $row = $result->fetch(\PDO::FETCH_ASSOC);
                return isset($row['integrity_check']) && $row['integrity_check'] === 'ok';
            }
            
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Download backup file
     */
    public function downloadBackup(Backup $backup): ?string
    {
        try {
            if (!Storage::disk('local')->exists($backup->path)) {
                return null;
            }

            return Storage::disk('local')->path($backup->path);

        } catch (\Exception $e) {
            $this->logError('Backup download failed', [
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
            // Delete file using Storage facade
            if (Storage::disk('local')->exists($backup->path)) {
                Storage::disk('local')->delete($backup->path);
            }

            // Delete backup record
            $backup->delete();

            $this->logInfo('Backup deleted', [
                'backup_id' => $backup->id,
                'filename' => $backup->filename
            ]);

            return true;

        } catch (\Exception $e) {
            $this->logError('Backup deletion failed', [
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

        $this->logInfo('Old backups cleaned up', ['count' => $deletedCount]);
        
        return $deletedCount;
    }
} 
 
 
 
 
 
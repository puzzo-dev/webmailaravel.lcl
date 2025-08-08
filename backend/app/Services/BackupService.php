<?php

namespace App\Services;

use App\Models\Backup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use ZipArchive;

class BackupService
{
    private string $backupDisk = 'local';
    private string $backupPath = 'backups';

    /**
     * Create a backup (called by BackupController)
     */
    public function createBackup($user, $description = null): ?Backup
    {
        try {
            $result = $this->createFullBackup();
            
            if ($result['success']) {
                // Create backup record in the database using the Backup model
                $backup = Backup::create([
                    'name' => $result['backup_name'],
                    'filename' => basename($result['file_path']),
                    'path' => $result['file_path'],
                    'size' => $result['size'],
                    'type' => 'full',
                    'status' => 'completed',
                    'description' => $description,
                    'created_by' => $user->id,
                ]);
                
                return $backup;
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error('Backup creation failed in createBackup method', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create a full system backup
     */
    public function createFullBackup(): array
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $backupName = "full_backup_{$timestamp}";
            $backupDir = "{$this->backupPath}/{$backupName}";
            
            // Create backup directory
            $fullBackupDir = storage_path("app/{$backupDir}");
            if (!is_dir($fullBackupDir)) {
                mkdir($fullBackupDir, 0755, true);
            }
            
            // Backup database
            $dbBackupPath = $this->backupDatabase($backupDir);
            
            // Backup files
            $filesBackupPath = $this->backupFiles($backupDir);
            
            // Create zip archive
            $zipPath = $this->createZipArchive($backupDir, $backupName);
            
            // Verify zip was created successfully before cleanup
            $zipFullPath = storage_path("app/{$zipPath}");
            if (!file_exists($zipFullPath) || filesize($zipFullPath) === 0) {
                throw new \Exception('Zip archive creation failed or resulted in empty file');
            }
            
            // Clean up temporary files only after successful zip creation
            $fullBackupDir = storage_path("app/{$backupDir}");
            if (is_dir($fullBackupDir)) {
                $this->deleteDirectory($fullBackupDir);
            }
            
            // Get the file size directly
            $zipFullPath = storage_path("app/{$zipPath}");
            $fileSize = file_exists($zipFullPath) ? filesize($zipFullPath) : 0;
            
            Log::info('Full backup created successfully', [
                'backup_name' => $backupName,
                'size' => $fileSize,
                'path' => $zipPath
            ]);
            
            return [
                'success' => true,
                'backup_name' => $backupName,
                'file_path' => $zipPath,
                'size' => $fileSize,
                'created_at' => now()->toISOString(),
            ];
            
        } catch (\Exception $e) {
            Log::error('Backup creation failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Backup database
     */
    private function backupDatabase(string $backupDir): string
    {
        $dbConfig = config('database.connections.' . config('database.default'));
        $connection = config('database.default');
        $filename = 'database_' . now()->format('Y-m-d_H-i-s');
        
        if ($connection === 'sqlite') {
            // For SQLite, just copy the database file
            $filename .= '.sqlite';
            $filePath = "{$backupDir}/{$filename}";
            
            // Convert relative path to absolute path
            $sourcePath = $dbConfig['database'];
            if (!str_starts_with($sourcePath, '/')) {
                $sourcePath = base_path($sourcePath);
            }
            $destinationPath = storage_path("app/{$filePath}");
            
            if (!file_exists($sourcePath)) {
                throw new \Exception("SQLite database file not found at: {$sourcePath}");
            }
            
            if (!copy($sourcePath, $destinationPath)) {
                throw new \Exception('SQLite database backup failed');
            }
        } else {
            // For MySQL and other databases, use dump command
            $filename .= '.sql';
            $filePath = "{$backupDir}/{$filename}";
            
            $command = sprintf(
                'mysqldump --host=%s --user=%s --password=%s %s > %s',
                $dbConfig['host'],
                $dbConfig['username'],
                $dbConfig['password'],
                $dbConfig['database'],
                storage_path("app/{$filePath}")
            );
            
            exec($command, $output, $returnCode);
            
            if ($returnCode !== 0) {
                throw new \Exception('Database backup failed');
            }
        }
        
        return $filePath;
    }
    
    /**
     * Backup important files
     */
    private function backupFiles(string $backupDir): string
    {
        $filesToBackup = [
            '.env',
            'storage/logs',
            'storage/app/public',
            'public/uploads'
        ];
        
        $filesBackupDir = "{$backupDir}/files";
        $fullFilesBackupDir = storage_path("app/{$filesBackupDir}");
        if (!is_dir($fullFilesBackupDir)) {
            mkdir($fullFilesBackupDir, 0755, true);
        }
        
        foreach ($filesToBackup as $file) {
            $sourcePath = base_path($file);
            if (file_exists($sourcePath)) {
                $destinationPath = "{$filesBackupDir}/" . basename($file);
                
                if (is_dir($sourcePath)) {
                    $this->copyDirectory($sourcePath, storage_path("app/{$destinationPath}"));
                } else {
                    copy($sourcePath, storage_path("app/{$destinationPath}"));
                }
            }
        }
        
        return $filesBackupDir;
    }
    
    /**
     * Create zip archive from backup directory
     */
    private function createZipArchive(string $backupDir, string $backupName): string
    {
        $zipPath = "{$this->backupPath}/{$backupName}.zip";
        $zipFullPath = storage_path("app/{$zipPath}");
        $sourceDir = storage_path("app/{$backupDir}");
        
        // Ensure source directory exists
        if (!is_dir($sourceDir)) {
            throw new \Exception("Source backup directory does not exist: {$sourceDir}");
        }
        
        $zip = new ZipArchive();
        $result = $zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        
        if ($result !== TRUE) {
            throw new \Exception("Cannot create zip archive: {$zipFullPath}. Error code: {$result}");
        }
        
        Log::info('Creating zip archive', [
            'source_dir' => $sourceDir,
            'zip_path' => $zipFullPath
        ]);
        
        // Add files to zip archive
        $filesAdded = $this->addDirectoryToZip($zip, $sourceDir, '');
        
        // Close the zip archive
        $closeResult = $zip->close();
        if (!$closeResult) {
            throw new \Exception('Failed to close zip archive properly');
        }
        
        Log::info('Zip archive created successfully', [
            'zip_path' => $zipFullPath,
            'files_added' => $filesAdded,
            'file_size' => file_exists($zipFullPath) ? filesize($zipFullPath) : 0
        ]);
        
        return $zipPath;
    }
    
    /**
     * Copy directory recursively
     */
    private function copyDirectory(string $source, string $destination): void
    {
        if (!is_dir($destination)) {
            mkdir($destination, 0755, true);
        }
        
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $item) {
            if ($item->isDir()) {
                mkdir($destination . DIRECTORY_SEPARATOR . $iterator->getSubPathName(), 0755, true);
            } else {
                copy($item, $destination . DIRECTORY_SEPARATOR . $iterator->getSubPathName());
            }
        }
    }
    
    /**
     * Record backup in database
     */
    private function recordBackup(string $name, string $path): array
    {
        $fullPath = storage_path("app/{$path}");
        $fileSize = file_exists($fullPath) ? filesize($fullPath) : 0;
        
        $id = DB::table('system_backups')->insertGetId([
            'name' => $name,
            'file_path' => $path,
            'size' => $fileSize,
            'status' => 'completed',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        return [
            'id' => $id,
            'name' => $name,
            'path' => $path,
            'size' => $fileSize,
            'status' => 'completed'
        ];
    }
    
    /**
     * Get all backups
     */
    public function getAllBackups(): array
    {
        $backups = DB::table('system_backups')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($backup) {
                $backup->size_formatted = $this->formatBytes($backup->size);
                $backup->age = Carbon::parse($backup->created_at)->diffForHumans();
                return $backup;
            })
            ->toArray();
            
        return $backups;
    }
    
    /**
     * Get latest backup info
     */
    public function getLatestBackup(): ?object
    {
        return DB::table('system_backups')
            ->orderBy('created_at', 'desc')
            ->first();
    }
    
    /**
     * Delete backup (legacy method for backward compatibility)
     */
    public function deleteBackupById(int $backupId): bool
    {
        $backup = DB::table('system_backups')->find($backupId);
        if (!$backup) {
            return false;
        }
        
        // Delete file
        if (Storage::disk($this->backupDisk)->exists($backup->file_path)) {
            Storage::disk($this->backupDisk)->delete($backup->file_path);
        }
        
        // Delete database record
        DB::table('system_backups')->where('id', $backupId)->delete();
        
        return true;
    }

    /**
     * Delete backup (called by BackupController with Backup model)
     */
    public function deleteBackup(Backup $backup): bool
    {
        try {
            // Delete the physical file
            $fullPath = storage_path('app/' . $backup->path);
            if ($backup->path && file_exists($fullPath)) {
                unlink($fullPath);
            }
            
            // Delete the database record
            $backup->delete();
            
            Log::info('Backup deleted successfully', [
                'backup_id' => $backup->id,
                'backup_name' => $backup->name
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete backup', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Restore from backup (called by BackupController)
     */
    public function restoreBackup(Backup $backup, $user): bool
    {
        try {
            // Check if backup file exists using direct file path
            $fullPath = storage_path('app/' . $backup->path);
            if (!$backup->path || !file_exists($fullPath)) {
                Log::error('Backup file not found for restore', ['backup_id' => $backup->id, 'path' => $fullPath]);
                return false;
            }

            // Verify file integrity
            if (!is_readable($fullPath)) {
                Log::error('Backup file is not readable for restore', ['backup_id' => $backup->id, 'path' => $fullPath]);
                return false;
            }

            // Check if backup is already being restored
            if ($backup->status === 'restoring') {
                Log::warning('Backup restore already in progress', ['backup_id' => $backup->id]);
                return false;
            }
            
            Log::info('Starting backup restore', [
                'backup_id' => $backup->id,
                'backup_name' => $backup->name,
                'user_id' => $user->id,
                'backup_size' => $backup->size
            ]);
            
            // Update backup status to indicate restore in progress
            $backup->update([
                'status' => 'restoring',
                'restored_by' => $user->id,
                'restored_at' => now()
            ]);
            
            // Create restore directory
            $extractPath = storage_path("app/temp/restore_{$backup->id}_" . time());
            if (!file_exists($extractPath)) {
                mkdir($extractPath, 0755, true);
            }
            
            // Extract and restore the backup with error handling
            try {
                $this->extractBackup($backup->path, $extractPath);
                
                // Verify extraction was successful
                if (!is_dir($extractPath) || empty(scandir($extractPath))) {
                    throw new \Exception('Backup extraction failed or resulted in empty directory');
                }
                
                // Restore database (most critical)
                $this->restoreDatabase($extractPath);
                
                // Restore files (less critical, log errors but don't fail)
                try {
                    $this->restoreFiles($extractPath);
                } catch (\Exception $e) {
                    Log::warning('File restoration encountered errors but database was restored', [
                        'backup_id' => $backup->id,
                        'error' => $e->getMessage()
                    ]);
                }
                
            } finally {
                // Always clean up temporary files
                try {
                    $this->cleanupTemporaryFiles($extractPath);
                } catch (\Exception $e) {
                    Log::warning('Failed to cleanup temporary restore files', [
                        'backup_id' => $backup->id,
                        'extract_path' => $extractPath,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            // Update backup status to completed
            $backup->update(['status' => 'completed']);
            
            Log::info('Backup restored successfully', [
                'backup_id' => $backup->id,
                'user_id' => $user->id,
                'restore_time' => now()
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Backup restore failed', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Update backup status to indicate failure
            try {
                $backup->update(['status' => 'failed']);
            } catch (\Exception $updateError) {
                Log::error('Failed to update backup status after restore failure', [
                    'backup_id' => $backup->id,
                    'update_error' => $updateError->getMessage()
                ]);
            }
            
            return false;
        }
    }

    /**
     * Download backup (called by BackupController)
     */
    public function downloadBackup(Backup $backup): ?string
    {
        try {
            $fullPath = storage_path('app/' . $backup->path);
            if (!$backup->path || !file_exists($fullPath)) {
                Log::error('Backup file not found for download', ['backup_id' => $backup->id, 'path' => $fullPath]);
                return null;
            }
            
            // Return the full path to the backup file
            
            Log::info('Backup download initiated', [
                'backup_id' => $backup->id,
                'backup_name' => $backup->name
            ]);
            
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
     * Clean old backups (keep only last 10)
     */
    public function cleanOldBackups(): int
    {
        $oldBackups = DB::table('system_backups')
            ->orderBy('created_at', 'desc')
            ->skip(10)
            ->take(1000)
            ->get();
            
        $deletedCount = 0;
        foreach ($oldBackups as $backup) {
            if ($this->deleteBackupById($backup->id)) {
                $deletedCount++;
            }
        }
        
        return $deletedCount;
    }
    
    /**
     * Get backup statistics
     */
    public function getBackupStats(): array
    {
        try {
            // Get backup statistics from database
            $totalBackups = DB::table('backups')->count();
            $totalSize = DB::table('backups')->sum('size') ?: 0;
            $lastBackup = DB::table('backups')
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Calculate storage usage
            $storageUsed = $this->calculateStorageUsage();
            
            // Get backup frequency and retention settings
            $backupFrequency = config('backup.frequency', 'daily');
            $retentionDays = config('backup.retention_days', 30);
            
            return [
                'total_backups' => $totalBackups,
                'total_size' => $totalSize,
                'total_size_formatted' => $this->formatBytes($totalSize),
                'storage_used' => $storageUsed,
                'storage_used_formatted' => $this->formatBytes($storageUsed),
                'last_backup' => $lastBackup ? [
                    'id' => $lastBackup->id,
                    'name' => $lastBackup->name,
                    'created_at' => $lastBackup->created_at,
                    'size' => $lastBackup->size,
                    'size_formatted' => $this->formatBytes($lastBackup->size)
                ] : null,
                'backup_frequency' => $backupFrequency,
                'retention_days' => $retentionDays,
                'oldest_backup' => DB::table('backups')
                    ->orderBy('created_at', 'asc')
                    ->first()?->created_at,
                'average_backup_size' => $totalBackups > 0 ? round($totalSize / $totalBackups) : 0,
                'average_backup_size_formatted' => $totalBackups > 0 ? 
                    $this->formatBytes(round($totalSize / $totalBackups)) : '0 B',
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to get backup statistics: ' . $e->getMessage());
            
            // Return default stats on error
            return [
                'total_backups' => 0,
                'total_size' => 0,
                'total_size_formatted' => '0 B',
                'storage_used' => 0,
                'storage_used_formatted' => '0 B',
                'last_backup' => null,
                'backup_frequency' => 'daily',
                'retention_days' => 30,
                'oldest_backup' => null,
                'average_backup_size' => 0,
                'average_backup_size_formatted' => '0 B',
            ];
        }
    }
    
    /**
     * Calculate total storage usage for backups
     */
    private function calculateStorageUsage(): int
    {
        try {
            $totalSize = 0;
            $backupFiles = Storage::disk($this->backupDisk)->files($this->backupPath);
            
            foreach ($backupFiles as $file) {
                if (Storage::disk($this->backupDisk)->exists($file)) {
                    $totalSize += Storage::disk($this->backupDisk)->size($file);
                }
            }
            
            return $totalSize;
        } catch (\Exception $e) {
            \Log::warning('Failed to calculate storage usage: ' . $e->getMessage());
            return 0;
        }
    }

    /**
    * Format bytes to human readable format
    */
    private function formatBytes(int $bytes): string
    {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);

    $bytes /= pow(1024, $pow);

    return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Extract backup archive for restore
     */
    private function extractBackup(string $backupPath, string $extractPath): void
    {
        // Create extraction directory
        if (!file_exists($extractPath)) {
            mkdir($extractPath, 0755, true);
        }

        $zip = new ZipArchive;
        $fullBackupPath = storage_path('app/' . $backupPath);
        
        if ($zip->open($fullBackupPath) === TRUE) {
            $zip->extractTo($extractPath);
            $zip->close();
        } else {
            throw new \Exception('Failed to extract backup archive');
        }
    }

    /**
     * Restore database from backup
     */
    private function restoreDatabase(string $extractPath): void
    {
        $dbConfig = config('database.connections.' . config('database.default'));
        $connection = config('database.default');
        
        Log::info('Starting database restore', [
            'connection' => $connection,
            'extract_path' => $extractPath
        ]);
        
        if ($connection === 'sqlite') {
            // For SQLite, look for .sqlite files
            $sqliteFiles = glob($extractPath . '/database_*.sqlite');
            
            if (empty($sqliteFiles)) {
                throw new \Exception('No SQLite database backup file found in ' . $extractPath);
            }
            
            $backupFile = $sqliteFiles[0];
            $currentDbPath = $dbConfig['database'];
            
            // Verify backup file exists and is readable
            if (!file_exists($backupFile) || !is_readable($backupFile)) {
                throw new \Exception('SQLite backup file is not accessible: ' . $backupFile);
            }
            
            // Verify current database path is writable
            if (!is_writable(dirname($currentDbPath))) {
                throw new \Exception('Database directory is not writable: ' . dirname($currentDbPath));
            }
            
            // Create backup of current database
            $backupCurrentDb = $currentDbPath . '.backup.' . now()->format('Y-m-d_H-i-s');
            if (file_exists($currentDbPath)) {
                if (!copy($currentDbPath, $backupCurrentDb)) {
                    throw new \Exception('Failed to create backup of current database');
                }
                Log::info('Current database backed up', ['backup_path' => $backupCurrentDb]);
            }
            
            // Replace current database with backup
            if (!copy($backupFile, $currentDbPath)) {
                // Restore original if copy failed
                if (file_exists($backupCurrentDb)) {
                    copy($backupCurrentDb, $currentDbPath);
                }
                throw new \Exception('SQLite database restore failed - original database restored');
            }
            
            // Verify the restored database is valid
            try {
                DB::connection($connection)->getPdo();
                Log::info('SQLite database restore completed successfully');
            } catch (\Exception $e) {
                // Restore original if new database is invalid
                if (file_exists($backupCurrentDb)) {
                    copy($backupCurrentDb, $currentDbPath);
                }
                throw new \Exception('Restored SQLite database is invalid - original database restored: ' . $e->getMessage());
            }
            
        } else {
            // For MySQL and other databases, look for .sql files
            $sqlFiles = glob($extractPath . '/database_*.sql');
            
            if (empty($sqlFiles)) {
                throw new \Exception('No SQL database backup file found in ' . $extractPath);
            }

            $sqlFile = $sqlFiles[0]; // Take the first SQL file
            
            // Verify SQL file exists and is readable
            if (!file_exists($sqlFile) || !is_readable($sqlFile)) {
                throw new \Exception('SQL backup file is not accessible: ' . $sqlFile);
            }
            
            Log::info('Restoring MySQL database', ['sql_file' => $sqlFile]);
            
            // Test database connection first
            try {
                DB::connection($connection)->getPdo();
            } catch (\Exception $e) {
                throw new \Exception('Cannot connect to database for restore: ' . $e->getMessage());
            }
            
            // Use Laravel's DB facade for more secure restore
            try {
                $sqlContent = file_get_contents($sqlFile);
                if (empty($sqlContent)) {
                    throw new \Exception('SQL backup file is empty or unreadable');
                }
                
                // Execute SQL statements
                DB::connection($connection)->unprepared($sqlContent);
                
                Log::info('MySQL database restore completed successfully');
                
            } catch (\Exception $e) {
                throw new \Exception('MySQL database restore failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Restore files from backup
     */
    private function restoreFiles(string $extractPath): void
    {
        $filesDir = $extractPath . '/files';
        
        if (!is_dir($filesDir)) {
            Log::warning('No files directory found in backup');
            return;
        }

        // Copy files back to their original locations
        $this->copyDirectory($filesDir, storage_path('app'));
    }

    /**
     * Clean up temporary files after restore
     */
    private function cleanupTemporaryFiles(string $extractPath): void
    {
        if (is_dir($extractPath)) {
            $this->deleteDirectory($extractPath);
        }
    }

    /**
     * Recursively delete directory
     */
    private function deleteDirectory(string $dir): void
    {
        if (is_dir($dir)) {
            $objects = scandir($dir);
            foreach ($objects as $object) {
                if ($object != "." && $object != "..") {
                    if (is_dir($dir . DIRECTORY_SEPARATOR . $object) && !is_link($dir . "/" . $object)) {
                        $this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $object);
                    } else {
                        unlink($dir . DIRECTORY_SEPARATOR . $object);
                    }
                }
            }
            rmdir($dir);
        }
    }

    /**
     * Add directory contents to zip archive recursively
     */
    private function addDirectoryToZip(ZipArchive $zip, string $sourcePath, string $relativePath): int
    {
        if (!is_dir($sourcePath)) {
            return 0;
        }

        $filesAdded = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($sourcePath, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            $filePath = $file->getRealPath();
            $relativeName = $relativePath . substr($filePath, strlen($sourcePath) + 1);

            if ($file->isDir()) {
                $result = $zip->addEmptyDir($relativeName);
                if ($result) {
                    $filesAdded++;
                }
            } else {
                if (is_readable($filePath)) {
                    $result = $zip->addFile($filePath, $relativeName);
                    if ($result) {
                        $filesAdded++;
                    } else {
                        Log::warning('Failed to add file to zip', [
                            'file_path' => $filePath,
                            'relative_name' => $relativeName
                        ]);
                    }
                } else {
                    Log::warning('File not readable, skipping', [
                        'file_path' => $filePath
                    ]);
                }
            }
        }

        return $filesAdded;
    }
}

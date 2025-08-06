<?php

namespace App\Services;

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
     * Create a full system backup
     */
    public function createFullBackup(): array
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $backupName = "full_backup_{$timestamp}";
            $backupDir = "{$this->backupPath}/{$backupName}";
            
            // Create backup directory
            Storage::disk($this->backupDisk)->makeDirectory($backupDir);
            
            // Backup database
            $dbBackupPath = $this->backupDatabase($backupDir);
            
            // Backup files
            $filesBackupPath = $this->backupFiles($backupDir);
            
            // Create zip archive
            $zipPath = $this->createZipArchive($backupDir, $backupName);
            
            // Clean up temporary files
            Storage::disk($this->backupDisk)->deleteDirectory($backupDir);
            
            // Record backup in database
            $backupRecord = $this->recordBackup($backupName, $zipPath);
            
            Log::info('Full backup created successfully', [
                'backup_name' => $backupName,
                'size' => Storage::disk($this->backupDisk)->size($zipPath),
                'path' => $zipPath
            ]);
            
            return [
                'success' => true,
                'backup_name' => $backupName,
                'file_path' => $zipPath,
                'size' => Storage::disk($this->backupDisk)->size($zipPath),
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
        $filename = 'database_' . now()->format('Y-m-d_H-i-s') . '.sql';
        $filePath = "{$backupDir}/{$filename}";
        
        // Generate mysqldump command
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
        Storage::disk($this->backupDisk)->makeDirectory($filesBackupDir);
        
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
        
        $zip = new ZipArchive();
        if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
            throw new \Exception('Cannot create zip archive');
        }
        
        $files = Storage::disk($this->backupDisk)->allFiles($backupDir);
        foreach ($files as $file) {
            $zip->addFile(storage_path("app/{$file}"), str_replace("{$backupDir}/", '', $file));
        }
        
        $zip->close();
        
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
        return DB::table('system_backups')->insertGetId([
            'name' => $name,
            'file_path' => $path,
            'size' => Storage::disk($this->backupDisk)->size($path),
            'status' => 'completed',
            'created_at' => now(),
            'updated_at' => now()
        ]);
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
     * Delete backup
     */
    public function deleteBackup(int $backupId): bool
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
            if ($this->deleteBackup($backup->id)) {
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
}

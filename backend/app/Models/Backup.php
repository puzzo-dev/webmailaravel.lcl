<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Backup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'filename',
        'path',
        'size',
        'type',
        'status',
        'compression',
        'encryption',
        'checksum',
        'created_by',
        'description',
        'notes',
        'expires_at'
    ];

    protected $casts = [
        'size' => 'integer',
        'expires_at' => 'datetime'
    ];

    /**
     * Get the user who created the backup
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for active backups
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for expired backups
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now());
    }

    /**
     * Scope for backups by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get file size in human readable format
     */
    public function getHumanSizeAttribute(): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $size = $this->size;
        $unit = 0;

        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return round($size, 2) . ' ' . $units[$unit];
    }

    /**
     * Check if backup file exists
     */
    public function fileExists(): bool
    {
        if (!$this->path) {
            return false;
        }
        
        $fullPath = storage_path('app/' . $this->path);
        return file_exists($fullPath) && is_readable($fullPath);
    }

    /**
     * Get backup file URL for download
     */
    public function getDownloadUrl(): string
    {
        return route('admin.backups.download', $this->id);
    }

    /**
     * Get backup file path
     */
    public function getFilePath(): string
    {
        return storage_path('app/' . $this->path);
    }

    /**
     * Check if backup is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if backup can be restored
     */
    public function canBeRestored(): bool
    {
        return $this->status === 'completed' && $this->fileExists();
    }

    /**
     * Get backup status description
     */
    public function getStatusDescription(): string
    {
        return match($this->status) {
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'failed' => 'Failed',
            'cancelled' => 'Cancelled',
            default => 'Unknown'
        };
    }

    /**
     * Get backup type description
     */
    public function getTypeDescription(): string
    {
        return match($this->type) {
            'database' => 'Database Backup',
            'files' => 'File Backup',
            'full' => 'Full System Backup',
            'incremental' => 'Incremental Backup',
            default => 'Unknown Type'
        };
    }

    /**
     * Calculate backup size
     */
    public function calculateSize(): int
    {
        if ($this->fileExists()) {
            $fullPath = storage_path('app/' . $this->path);
            return filesize($fullPath);
        }
        return 0;
    }

    /**
     * Generate checksum for backup file
     */
    public function generateChecksum(): string
    {
        if ($this->fileExists()) {
            return hash_file('sha256', $this->getFilePath());
        }
        return '';
    }

    /**
     * Verify backup integrity
     */
    public function verifyIntegrity(): bool
    {
        if (!$this->fileExists()) {
            return false;
        }

        $currentChecksum = $this->generateChecksum();
        return $currentChecksum === $this->checksum;
    }

    /**
     * Mark backup as completed
     */
    public function markCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'size' => $this->calculateSize(),
            'checksum' => $this->generateChecksum()
        ]);
    }

    /**
     * Mark backup as failed
     */
    public function markFailed(string $error = null): void
    {
        $this->update([
            'status' => 'failed',
            'notes' => $error
        ]);
    }

    /**
     * Delete backup file and record
     */
    public function deleteBackup(): bool
    {
        if ($this->fileExists()) {
            $fullPath = storage_path('app/' . $this->path);
            unlink($fullPath);
        }

        return $this->delete();
    }

    /**
     * Get backup age in days
     */
    public function getAgeInDays(): int
    {
        return $this->created_at->diffInDays(now());
    }

    /**
     * Check if backup should be cleaned up
     */
    public function shouldBeCleanedUp(): bool
    {
        // Clean up if expired or older than 30 days
        return $this->isExpired() || $this->getAgeInDays() > 30;
    }

    /**
     * Get backup metadata
     */
    public function getMetadata(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'status' => $this->status,
            'size' => $this->human_size,
            'created_at' => $this->created_at->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'age_days' => $this->getAgeInDays(),
            'file_exists' => $this->fileExists(),
            'can_restore' => $this->canBeRestored(),
            'integrity_verified' => $this->verifyIntegrity()
        ];
    }
}
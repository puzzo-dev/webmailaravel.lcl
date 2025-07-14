<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SuppressionList extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'type',
        'source',
        'reason',
        'metadata',
        'suppressed_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'suppressed_at' => 'datetime'
    ];

    /**
     * Check if email is suppressed
     */
    public static function isSuppressed(string $email): bool
    {
        return static::where('email', strtolower(trim($email)))->exists();
    }

    /**
     * Add email to suppression list
     */
    public static function addEmail(string $email, string $type = 'unsubscribe', string $source = null, string $reason = null, array $metadata = []): self
    {
        return static::updateOrCreate(
            ['email' => strtolower(trim($email))],
            [
                'type' => $type,
                'source' => $source,
                'reason' => $reason,
                'metadata' => $metadata,
                'suppressed_at' => now()
            ]
        );
    }

    /**
     * Remove email from suppression list
     */
    public static function removeEmail(string $email): bool
    {
        return static::where('email', strtolower(trim($email)))->delete() > 0;
    }

    /**
     * Get all suppressed emails as array
     */
    public static function getAllEmails(): array
    {
        return static::pluck('email')->toArray();
    }

    /**
     * Export suppression list to file
     */
    public static function exportToFile(string $filename = null): string
    {
        $filename = $filename ?: 'suppression_list_' . date('Y-m-d_H-i-s') . '.txt';
        $filepath = 'suppression_lists/' . $filename;

        $emails = static::orderBy('email')->pluck('email')->toArray();
        $content = implode("\n", $emails);

        Storage::disk('local')->put($filepath, $content);

        return $filepath;
    }

    /**
     * Import suppression list from file
     */
    public static function importFromFile(string $filepath, string $type = 'manual', string $source = null): array
    {
        if (!Storage::disk('local')->exists($filepath)) {
            throw new \Exception('File not found: ' . $filepath);
        }

        $content = Storage::disk('local')->get($filepath);
        $emails = array_filter(array_map('trim', explode("\n", $content)));
        
        $imported = 0;
        $skipped = 0;

        foreach ($emails as $email) {
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                static::addEmail($email, $type, $source, 'Imported from file: ' . $filepath);
                $imported++;
            } else {
                $skipped++;
            }
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($emails)
        ];
    }

    /**
     * Get suppression statistics
     */
    public static function getStatistics(): array
    {
        $total = static::count();
        $byType = static::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $recent = static::where('suppressed_at', '>=', now()->subDays(30))->count();

        return [
            'total' => $total,
            'by_type' => $byType,
            'recent_30_days' => $recent,
            'types' => [
                'unsubscribe' => $byType['unsubscribe'] ?? 0,
                'fbl' => $byType['fbl'] ?? 0,
                'bounce' => $byType['bounce'] ?? 0,
                'complaint' => $byType['complaint'] ?? 0,
                'manual' => $byType['manual'] ?? 0
            ]
        ];
    }

    /**
     * Clean up old suppression entries (optional)
     */
    public static function cleanupOldEntries(int $days = 365): int
    {
        return static::where('suppressed_at', '<', now()->subDays($days))->delete();
    }
} 
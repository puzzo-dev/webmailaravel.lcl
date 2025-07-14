<?php

namespace App\Services;

use App\Traits\HttpClientTrait;
use App\Traits\LoggingTrait;
use App\Traits\CacheServiceTrait;
use App\Traits\ValidationTrait;
use App\Models\SystemConfig;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class FileUploadService
{
    use HttpClientTrait, LoggingTrait, CacheServiceTrait, ValidationTrait;

    protected $systemConfig;

    public function __construct()
    {
        $this->systemConfig = app(\App\Models\SystemConfig::class);
    }

    /**
     * Upload recipient list file
     */
    public function uploadRecipientList(UploadedFile $file, string $campaignName): array
    {
        $this->logMethodEntry(__METHOD__, [
            'filename' => $file->getClientOriginalName(),
            'campaign_name' => $campaignName
        ]);

        try {
            // Validate file
            $validation = $this->validateRecipientListFile($file);
            if (!$validation['success']) {
                return $validation;
            }

            // Generate safe filename
            $safeCampaignName = $this->sanitizeString($campaignName);
            $extension = $file->getClientOriginalExtension();
            $filename = 'recipients_' . $safeCampaignName . '_' . time() . '.' . $extension;

            // Store file
            $path = $file->storeAs('uploads/recipients', $filename, 'local');

            // Process and validate recipients
            $recipients = $this->processRecipientList($path);
            
            if (!$recipients['success']) {
                // Delete invalid file
                Storage::disk('local')->delete($path);
                return $recipients;
            }

            $this->logInfo('Recipient list uploaded successfully', [
                'filename' => $filename,
                'path' => $path,
                'recipient_count' => $recipients['count'],
                'campaign_name' => $campaignName
            ]);

            return [
                'success' => true,
                'filename' => $filename,
                'path' => $path,
                'recipient_count' => $recipients['count'],
                'valid_emails' => $recipients['valid_emails'],
                'invalid_emails' => $recipients['invalid_emails']
            ];

        } catch (\Exception $e) {
            $this->logError('Recipient list upload failed', [
                'filename' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to upload recipient list: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validate recipient list file
     */
    protected function validateRecipientListFile(UploadedFile $file): array
    {
        $uploadConfig = $this->systemConfig::getUploadConfig();
        
        // Check file size
        if ($file->getSize() > $uploadConfig['max_file_size']) {
            return [
                'success' => false,
                'error' => 'File size exceeds maximum allowed size of ' . $this->formatBytes($uploadConfig['max_file_size'])
            ];
        }

        // Check file extension
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['txt', 'csv', 'xls', 'xlsx'];
        
        if (!in_array($extension, $allowedExtensions)) {
            return [
                'success' => false,
                'error' => 'File type not allowed. Allowed types: ' . implode(', ', $allowedExtensions)
            ];
        }

        // Check file content type
        $allowedMimes = [
            'txt' => 'text/plain',
            'csv' => ['text/csv', 'text/plain', 'application/csv'],
            'xls' => ['application/vnd.ms-excel', 'application/excel'],
            'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
        ];

        $fileMimeType = $file->getMimeType();
        $allowedMimeTypes = $allowedMimes[$extension] ?? [];
        
        if (is_array($allowedMimeTypes)) {
            if (!in_array($fileMimeType, $allowedMimeTypes)) {
                return [
                    'success' => false,
                    'error' => 'Invalid file content type for ' . $extension . ' file'
                ];
            }
        } else {
            if ($fileMimeType !== $allowedMimeTypes) {
                return [
                    'success' => false,
                    'error' => 'Invalid file content type'
                ];
            }
        }

        return ['success' => true];
    }

    /**
     * Process recipient list file
     */
    protected function processRecipientList(string $filePath): array
    {
        try {
            $fullPath = Storage::disk('local')->path($filePath);
            
            if (!File::exists($fullPath)) {
                return [
                    'success' => false,
                    'error' => 'File not found'
                ];
            }

            $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
            
            switch ($extension) {
                case 'txt':
                case 'csv':
                    return $this->processTextFile($fullPath);
                case 'xls':
                case 'xlsx':
                    return $this->processExcelFile($fullPath);
                default:
                    return [
                        'success' => false,
                        'error' => 'Unsupported file format'
                    ];
            }

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to process recipient list: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process text file (TXT, CSV)
     */
    protected function processTextFile(string $filePath): array
    {
        $emails = [];
        $validEmails = [];
        $invalidEmails = [];
        $recipientData = [];

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            return [
                'success' => false,
                'error' => 'Unable to read file'
            ];
        }

        $lineNumber = 0;
        $headers = null;
        
        while (($line = fgets($handle)) !== false) {
            $lineNumber++;
            $line = trim($line);

            // Skip empty lines and comments
            if (empty($line) || strpos($line, '#') === 0) {
                continue;
            }

            // Parse CSV if it's a CSV file
            if (pathinfo($filePath, PATHINFO_EXTENSION) === 'csv') {
                $data = str_getcsv($line);
                
                // First line might be headers
                if ($lineNumber === 1) {
                    $headers = $data;
                    continue;
                }

                // Extract email and additional data
                $email = $data[0] ?? '';
                $additionalData = [];
                
                if ($headers) {
                    for ($i = 1; $i < count($data); $i++) {
                        if (isset($headers[$i])) {
                            $additionalData[$headers[$i]] = $data[$i] ?? '';
                        }
                    }
                }
            } else {
                // Simple text file - just email addresses
                $email = $line;
                $additionalData = [];
            }

            $emails[] = $email;

            // Validate email
            if ($this->validateEmail($email)) {
                $validEmails[] = strtolower($email);
                $recipientData[strtolower($email)] = $additionalData;
            } else {
                $invalidEmails[] = [
                    'email' => $email,
                    'line' => $lineNumber
                ];
            }
        }

        fclose($handle);

        // Remove duplicates
        $validEmails = array_unique($validEmails);

        // Check minimum valid emails
        if (count($validEmails) < 1) {
            return [
                'success' => false,
                'error' => 'No valid email addresses found in file'
            ];
        }

        return [
            'success' => true,
            'count' => count($validEmails),
            'valid_emails' => $validEmails,
            'invalid_emails' => $invalidEmails,
            'recipient_data' => $recipientData,
            'headers' => $headers,
            'total_lines' => $lineNumber
        ];
    }

    /**
     * Process Excel file (XLS, XLSX)
     */
    protected function processExcelFile(string $filePath): array
    {
        try {
            // Check if PhpSpreadsheet is available
            if (!class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
                return [
                    'success' => false,
                    'error' => 'Excel processing requires PhpSpreadsheet library. Please install: composer require phpoffice/phpspreadsheet'
                ];
            }

            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $highestRow = $worksheet->getHighestRow();
            $highestColumn = $worksheet->getHighestColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

            $emails = [];
            $validEmails = [];
            $invalidEmails = [];
            $recipientData = [];
            $headers = [];

            // Get headers from first row
            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $headers[$col] = $worksheet->getCellByColumnAndRow($col, 1)->getValue();
            }

            // Process data rows
            for ($row = 2; $row <= $highestRow; $row++) {
                $email = $worksheet->getCellByColumnAndRow(1, $row)->getValue();
                $email = trim($email);

                // Skip empty rows
                if (empty($email)) {
                    continue;
                }

                $additionalData = [];
                
                // Extract additional data
                for ($col = 2; $col <= $highestColumnIndex; $col++) {
                    $value = $worksheet->getCellByColumnAndRow($col, $row)->getValue();
                    if (isset($headers[$col]) && !empty($value)) {
                        $additionalData[$headers[$col]] = $value;
                    }
                }

                $emails[] = $email;

                // Validate email
                if ($this->validateEmail($email)) {
                    $validEmails[] = strtolower($email);
                    $recipientData[strtolower($email)] = $additionalData;
                } else {
                    $invalidEmails[] = [
                        'email' => $email,
                        'line' => $row
                    ];
                }
            }

            // Remove duplicates
            $validEmails = array_unique($validEmails);

            // Check minimum valid emails
            if (count($validEmails) < 1) {
                return [
                    'success' => false,
                    'error' => 'No valid email addresses found in file'
                ];
            }

            return [
                'success' => true,
                'count' => count($validEmails),
                'valid_emails' => $validEmails,
                'invalid_emails' => $invalidEmails,
                'recipient_data' => $recipientData,
                'headers' => $headers,
                'total_rows' => $highestRow
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to process Excel file: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Count recipients in a file
     */
    public function countRecipients(string $filePath): int
    {
        try {
            $fullPath = Storage::disk('local')->path($filePath);
            
            if (!File::exists($fullPath)) {
                return 0;
            }

            $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
            
            switch ($extension) {
                case 'txt':
                case 'csv':
                    return $this->countTextFileRecipients($fullPath);
                case 'xls':
                case 'xlsx':
                    return $this->countExcelFileRecipients($fullPath);
                default:
                    return 0;
            }

        } catch (\Exception $e) {
            $this->logError('Failed to count recipients', [
                'file_path' => $filePath,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Create sent list file
     */
    public function createSentList(string $campaignName, array $sentEmails): array
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_name' => $campaignName,
            'sent_count' => count($sentEmails)
        ]);

        try {
            $safeCampaignName = $this->sanitizeString($campaignName);
            $filename = 'sent_' . $safeCampaignName . '_' . time() . '.txt';
            $path = 'uploads/sent/' . $filename;

            // Create sent list content
            $content = implode("\n", $sentEmails);

            // Store file
            Storage::disk('local')->put($path, $content);

            $this->logInfo('Sent list created', [
                'filename' => $filename,
                'path' => $path,
                'sent_count' => count($sentEmails)
            ]);

            return [
                'success' => true,
                'filename' => $filename,
                'path' => $path,
                'sent_count' => count($sentEmails)
            ];

        } catch (\Exception $e) {
            $this->logError('Failed to create sent list', [
                'campaign_name' => $campaignName,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to create sent list: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Upload PowerMTA log files
     */
    public function uploadPowerMTALogs(array $files): array
    {
        $this->logMethodEntry(__METHOD__, [
            'file_count' => count($files)
        ]);

        $results = [
            'uploaded' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($files as $file) {
            try {
                $result = $this->uploadPowerMTALog($file);
                
                if ($result['success']) {
                    $results['uploaded']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = $result['error'];
                }

            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = $e->getMessage();
            }
        }

        $this->logInfo('PowerMTA logs upload completed', $results);

        return $results;
    }

    /**
     * Upload single PowerMTA log file
     */
    protected function uploadPowerMTALog(UploadedFile $file): array
    {
        $uploadConfig = $this->systemConfig::getUploadConfig();
        
        // Validate file
        if ($file->getSize() > $uploadConfig['max_file_size']) {
            return [
                'success' => false,
                'error' => 'File size exceeds maximum allowed size'
            ];
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['txt', 'csv', 'log'];
        
        if (!in_array($extension, $allowedExtensions)) {
            return [
                'success' => false,
                'error' => 'Invalid file type for PowerMTA logs'
            ];
        }

        // Generate filename
        $filename = 'powermta_' . time() . '_' . Str::random(8) . '.' . $extension;
        $path = 'powermta_logs/' . $filename;

        // Store file
        $file->storeAs('powermta_logs', $filename, 'local');

        return [
            'success' => true,
            'filename' => $filename,
            'path' => $path
        ];
    }

    /**
     * Create backup file
     */
    public function createBackupFile(string $backupType, array $data): array
    {
        $this->logMethodEntry(__METHOD__, [
            'backup_type' => $backupType
        ]);

        try {
            $filename = 'backup_' . $backupType . '_' . time() . '.json';
            $path = 'backups/' . $filename;

            // Create backup content
            $content = json_encode($data, JSON_PRETTY_PRINT);

            // Store file
            Storage::disk('local')->put($path, $content);

            $this->logInfo('Backup file created', [
                'filename' => $filename,
                'path' => $path,
                'backup_type' => $backupType
            ]);

            return [
                'success' => true,
                'filename' => $filename,
                'path' => $path,
                'size' => Storage::disk('local')->size($path)
            ];

        } catch (\Exception $e) {
            $this->logError('Failed to create backup file', [
                'backup_type' => $backupType,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to create backup file: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete file
     */
    public function deleteFile(string $path): array
    {
        try {
            if (Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
                
                $this->logInfo('File deleted', ['path' => $path]);
                
                return [
                    'success' => true,
                    'message' => 'File deleted successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'File not found'
                ];
            }

        } catch (\Exception $e) {
            $this->logError('Failed to delete file', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to delete file: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get file info
     */
    public function getFileInfo(string $path): array
    {
        try {
            if (!Storage::disk('local')->exists($path)) {
                return [
                    'success' => false,
                    'error' => 'File not found'
                ];
            }

            $size = Storage::disk('local')->size($path);
            $lastModified = Storage::disk('local')->lastModified($path);

            return [
                'success' => true,
                'path' => $path,
                'size' => $size,
                'size_human' => $this->formatBytes($size),
                'last_modified' => date('Y-m-d H:i:s', $lastModified),
                'exists' => true
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to get file info: ' . $e->getMessage()
            ];
        }
    }

    /**
     * List files in directory
     */
    public function listFiles(string $directory, string $pattern = '*'): array
    {
        try {
            $files = Storage::disk('local')->files($directory);
            $fileList = [];

            foreach ($files as $file) {
                if (fnmatch($pattern, basename($file))) {
                    $fileInfo = $this->getFileInfo($file);
                    if ($fileInfo['success']) {
                        $fileList[] = $fileInfo;
                    }
                }
            }

            return [
                'success' => true,
                'files' => $fileList,
                'count' => count($fileList)
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to list files: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Clean up old files
     */
    public function cleanupOldFiles(string $directory, int $daysOld = 30): array
    {
        $this->logMethodEntry(__METHOD__, [
            'directory' => $directory,
            'days_old' => $daysOld
        ]);

        try {
            $files = Storage::disk('local')->files($directory);
            $cutoffTime = now()->subDays($daysOld)->timestamp;
            $deletedCount = 0;

            foreach ($files as $file) {
                $lastModified = Storage::disk('local')->lastModified($file);
                
                if ($lastModified < $cutoffTime) {
                    Storage::disk('local')->delete($file);
                    $deletedCount++;
                }
            }

            $this->logInfo('Old files cleaned up', [
                'directory' => $directory,
                'deleted_count' => $deletedCount
            ]);

            return [
                'success' => true,
                'deleted_count' => $deletedCount,
                'message' => "Deleted {$deletedCount} old files"
            ];

        } catch (\Exception $e) {
            $this->logError('Failed to cleanup old files', [
                'directory' => $directory,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to cleanup old files: ' . $e->getMessage()
            ];
        }
    }
} 
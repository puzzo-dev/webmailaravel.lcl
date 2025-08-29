<?php

namespace App\Traits;

use App\Constants\FileConstants;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Response;
use Illuminate\Http\StreamedResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;

trait FileProcessingTrait
{
    use LoggingTrait;

    /**
     * Upload file with standardized processing
     */
    protected function uploadFile(UploadedFile $file, string $directory, array $options = []): array
    {
        $options = array_merge([
            'disk' => FileConstants::DEFAULT_DISK,
            'visibility' => FileConstants::DEFAULT_VISIBILITY,
            'max_size' => FileConstants::MAX_FILE_SIZE_KB,
            'allowed_extensions' => FileConstants::ALLOWED_EXTENSIONS,
            'generate_unique_name' => FileConstants::GENERATE_UNIQUE_NAME,
            'preserve_original_name' => FileConstants::PRESERVE_ORIGINAL_NAME
        ], $options);

        try {
            // Validate file
            $this->validateFile($file, $options);

            // Generate filename
            $filename = $this->generateFilename($file, $options);

            // Store file
            $path = $this->storeFile($file, $directory, $filename, $options);

            // Process file based on type
            $processedData = $this->processFileByType($file, $path, $options);

            $this->logInfo('File uploaded successfully', [
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'processed_data' => $processedData
            ]);

            return [
                'success' => true,
                'path' => $path,
                'filename' => $filename,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'processed_data' => $processedData
            ];

        } catch (\Exception $e) {
            $this->logError('File upload failed', [
                'original_name' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate uploaded file using ValidationTrait
     */
    protected function validateFile(UploadedFile $file, array $options): void
    {
        // Use ValidationTrait method if available
        if (method_exists($this, 'validateFileUpload')) {
            $result = $this->validateFileUpload($file, $options['allowed_extensions'], $options['max_size']);
            
            // Debug logging
            \Log::debug('File validation result', [
                'file_name' => $file->getClientOriginalName(),
                'result' => $result,
                'is_valid' => $result['is_valid'] ?? 'not_set'
            ]);
            
            if (!$result['is_valid']) {
                // Handle errors properly - errors array structure is ['file' => ['error messages']]
                $errors = $result['errors'] ?? [];
                
                \Log::debug('File validation errors detail', [
                    'errors_structure' => $errors,
                    'errors_keys' => array_keys($errors)
                ]);
                
                if (isset($errors['file']) && is_array($errors['file'])) {
                    $errorMessages = $errors['file'];
                } else {
                    // Fallback: get all error messages if structure is different
                    $errorMessages = [];
                    foreach ($errors as $field => $fieldErrors) {
                        if (is_array($fieldErrors)) {
                            $errorMessages = array_merge($errorMessages, $fieldErrors);
                        }
                    }
                }
                
                $errorMessage = !empty($errorMessages) ? implode(', ', $errorMessages) : 'File validation failed';
                
                \Log::debug('Final validation error message', [
                    'error_message' => $errorMessage,
                    'error_messages_array' => $errorMessages
                ]);
                
                throw new \Exception('File validation failed: ' . $errorMessage);
            }
        } else {
            // Fallback validation
            if (!$file->isValid()) {
                throw new \Exception('Invalid file upload');
            }

            if ($file->getSize() > ($options['max_size'] * 1024)) {
                throw new \Exception('File size exceeds maximum allowed size');
            }

            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, $options['allowed_extensions'])) {
                throw new \Exception('File type not allowed');
            }
        }
    }

    /**
     * Generate unique filename
     */
    protected function generateFilename(UploadedFile $file, array $options): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if ($options['generate_unique_name']) {
            return Str::uuid() . '.' . $extension;
        }
        
        if ($options['preserve_original_name']) {
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            return $originalName . '_' . time() . '.' . $extension;
        }
        
        return 'file_' . time() . '.' . $extension;
    }

    /**
     * Store file on disk
     */
    protected function storeFile(UploadedFile $file, string $directory, string $filename, array $options): string
    {
        $disk = Storage::disk($options['disk']);
        
        $path = $directory . '/' . $filename;
        
        $disk->putFileAs($directory, $file, $filename, [
            'visibility' => $options['visibility']
        ]);
        
        return $path;
    }

    /**
     * Process file based on its type
     */
    protected function processFileByType(UploadedFile $file, string $path, array $options): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        switch ($extension) {
            case 'csv':
                return $this->processCSVFile($path, $options);
            case 'xlsx':
            case 'xls':
                return $this->processExcelFile($path, $options);
            case 'txt':
                return $this->processTextFile($path, $options);
            default:
                return ['type' => 'unknown', 'processed' => false];
        }
    }

    /**
     * Process CSV file
     */
    protected function processCSVFile(string $path, array $options): array
    {
        try {
            $disk = Storage::disk($options['disk'] ?? 'local');
            $content = $disk->get($path);
            
            $lines = explode("\n", $content);
            $headers = str_getcsv(array_shift($lines));
            
            $data = [];
            foreach ($lines as $line) {
                if (trim($line)) {
                    $row = str_getcsv($line);
                    if (count($row) === count($headers)) {
                        $data[] = array_combine($headers, $row);
                    }
                }
            }
            
            return [
                'type' => 'csv',
                'processed' => true,
                'rows' => count($data),
                'headers' => $headers,
                'sample_data' => array_slice($data, 0, FileConstants::CSV_SAMPLE_ROWS)
            ];
            
        } catch (\Exception $e) {
            return [
                'type' => 'csv',
                'processed' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process Excel file
     */
    protected function processExcelFile(string $path, array $options): array
    {
        try {
            // This would require a library like PhpSpreadsheet
            // For now, return basic info
            return [
                'type' => 'excel',
                'processed' => true,
                'message' => 'Excel file uploaded successfully'
            ];
            
        } catch (\Exception $e) {
            return [
                'type' => 'excel',
                'processed' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process text file
     */
    protected function processTextFile(string $path, array $options): array
    {
        try {
            $disk = Storage::disk($options['disk'] ?? 'local');
            $content = $disk->get($path);
            
            $lines = explode("\n", $content);
            $lines = array_filter($lines, 'trim');
            
            return [
                'type' => 'text',
                'processed' => true,
                'lines' => count($lines),
                'sample_data' => array_slice($lines, 0, FileConstants::TEXT_SAMPLE_LINES)
            ];
            
        } catch (\Exception $e) {
            return [
                'type' => 'text',
                'processed' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete file with error handling
     */
    protected function deleteFile(string $path, string $disk = 'local'): bool
    {
        try {
            $storage = Storage::disk($disk);
            
            if ($storage->exists($path)) {
                $storage->delete($path);
                $this->logInfo('File deleted', ['path' => $path]);
                return true;
            }
            
            return false;
            
        } catch (\Exception $e) {
            $this->logError('File deletion failed', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get file information
     */
    protected function getFileInfo(string $path, string $disk = 'local'): array
    {
        try {
            $storage = Storage::disk($disk);
            
            if (!$storage->exists($path)) {
                return ['exists' => false];
            }
            
            return [
                'exists' => true,
                'size' => $storage->size($path),
                'last_modified' => Carbon::createFromTimestamp($storage->lastModified($path)),
                'mime_type' => $storage->mimeType($path),
                'visibility' => $storage->getVisibility($path)
            ];
            
        } catch (\Exception $e) {
            return [
                'exists' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Move file to different location
     */
    protected function moveFile(string $fromPath, string $toPath, string $disk = 'local'): bool
    {
        try {
            $storage = Storage::disk($disk);
            
            if ($storage->exists($fromPath)) {
                $storage->move($fromPath, $toPath);
                $this->logInfo('File moved', [
                    'from' => $fromPath,
                    'to' => $toPath
                ]);
                return true;
            }
            
            return false;
            
        } catch (\Exception $e) {
            $this->logError('File move failed', [
                'from' => $fromPath,
                'to' => $toPath,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Copy file to different location
     */
    protected function copyFile(string $fromPath, string $toPath, string $disk = 'local'): bool
    {
        try {
            $storage = Storage::disk($disk);
            
            if ($storage->exists($fromPath)) {
                $storage->copy($fromPath, $toPath);
                $this->logInfo('File copied', [
                    'from' => $fromPath,
                    'to' => $toPath
                ]);
                return true;
            }
            
            return false;
            
        } catch (\Exception $e) {
            $this->logError('File copy failed', [
                'from' => $fromPath,
                'to' => $toPath,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }



    protected function downloadFile(string $filePath, string $fileName = null, array $headers = []): Response
    {
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($filePath);
        
        $defaultHeaders = [
            'Content-Type' => mime_content_type($filePath),
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Content-Length' => filesize($filePath),
            'Cache-Control' => 'no-cache, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ];

        return response()->download($filePath, $fileName, array_merge($defaultHeaders, $headers));
    }

    /**
     * Stream a large file download
     */
    protected function streamFile(string $filePath, string $fileName = null): StreamedResponse
    {
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($filePath);
        
        return response()->stream(function () use ($filePath) {
            $handle = fopen($filePath, 'rb');
            
            while (!feof($handle)) {
                echo fread($handle, 8192);
                ob_flush();
                flush();
            }
            
            fclose($handle);
        }, 200, [
            'Content-Type' => mime_content_type($filePath),
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Content-Length' => filesize($filePath),
            'Cache-Control' => 'no-cache, must-revalidate'
        ]);
    }

    /**
     * Download file from storage disk
     */
    protected function downloadStorageFile(string $disk, string $path, string $fileName = null): Response
    {
        if (!Storage::disk($disk)->exists($path)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($path);
        
        return Storage::disk($disk)->download($path, $fileName);
    }

    /**
     * View file in browser (inline)
     */
    protected function viewFile(string $filePath, string $fileName = null): Response
    {
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($filePath);
        
        return response()->file($filePath, [
            'Content-Type' => mime_content_type($filePath),
            'Content-Disposition' => 'inline; filename="' . $fileName . '"'
        ]);
    }

    /**
     * Read file content
     */
    protected function readFile(string $path, array $options = []): string
    {
        $options = array_merge([
            'disk' => 'local'
        ], $options);

        $disk = Storage::disk($options['disk']);
        
        if (!$disk->exists($path)) {
            throw new \Exception('File not found: ' . $path);
        }
        
        return $disk->get($path);
    }

    /**
     * Write content to file
     */
    protected function writeFile(string $path, string $content, array $options = []): bool
    {
        $options = array_merge([
            'disk' => 'local',
            'visibility' => 'private'
        ], $options);

        $disk = Storage::disk($options['disk']);
        
        return $disk->put($path, $content, [
            'visibility' => $options['visibility']
        ]);
    }

    /**
     * Check if file exists
     */
    protected function fileExists(string $path, array $options = []): bool
    {
        $options = array_merge([
            'disk' => 'local'
        ], $options);

        $disk = Storage::disk($options['disk']);
        
        return $disk->exists($path);
    }
} 
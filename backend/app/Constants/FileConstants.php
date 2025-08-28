<?php

namespace App\Constants;

class FileConstants
{
    /**
     * File size limits in kilobytes
     */
    public const MAX_FILE_SIZE_KB = 10240; // 10MB
    public const MAX_FILE_SIZE_BYTES = self::MAX_FILE_SIZE_KB * 1024;

    /**
     * Default allowed file extensions
     */
    public const ALLOWED_EXTENSIONS = ['txt', 'csv', 'xlsx', 'xls'];
    
    /**
     * Default allowed MIME types for uploads
     */
    public const ALLOWED_MIME_TYPES = [
        'text/plain',
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    /**
     * File storage defaults
     */
    public const DEFAULT_DISK = 'local';
    public const DEFAULT_VISIBILITY = 'private';

    /**
     * File processing options
     */
    public const GENERATE_UNIQUE_NAME = true;
    public const PRESERVE_ORIGINAL_NAME = false;

    /**
     * CSV processing constants
     */
    public const CSV_SAMPLE_ROWS = 5;
    public const TEXT_SAMPLE_LINES = 10;
}

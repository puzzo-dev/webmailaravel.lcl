<?php

return [
    /*
    |--------------------------------------------------------------------------
    | File Upload Constants
    |--------------------------------------------------------------------------
    */
    'file_upload' => [
        'max_size_mb' => 10,
        'max_size_kb' => 10240,
        'allowed_extensions' => [
            'documents' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
            'recipients' => ['txt', 'csv', 'xlsx', 'xls'],
            'images' => ['jpg', 'jpeg', 'png', 'gif'],
            'archives' => ['zip', 'rar']
        ],
        'timeout_seconds' => 300,
    ],

    /*
    |--------------------------------------------------------------------------
    | Campaign Processing Constants
    |--------------------------------------------------------------------------
    */
    'campaign' => [
        'batch_size_default' => 200,
        'batch_size_sync' => 50,
        'retry_delays' => [30, 60, 120],
        'max_tries' => 3,
        'queue_timeout' => 60,
        'job_timeout' => 300,
    ],

    /*
    |--------------------------------------------------------------------------
    | URL Constants
    |--------------------------------------------------------------------------
    */
    'urls' => [
        'frontend_dev' => 'http://localhost:3000',
        'frontend_vite' => 'http://localhost:3001',
        'backend_dev' => 'http://localhost:8001',
        'api_base' => '/api',
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Configuration
    |--------------------------------------------------------------------------
    */
    'queues' => [
        'emails' => 'emails',
        'campaigns' => 'campaigns', 
        'bounces' => 'bounces',
        'default' => 'default',
    ],
];

<?php

return [
    /*
    |--------------------------------------------------------------------------
    | PowerMTA File Paths
    |--------------------------------------------------------------------------
    |
    | Configure the paths to PowerMTA log files for analysis
    |
    */
    
    'accounting_path' => env('POWERMTA_ACCT_PATH', '/var/log/pmta/acct-*.csv'),
    'fbl_path' => env('POWERMTA_FBL_PATH', '/var/log/pmta/fbl-*.csv'),
    'diag_path' => env('POWERMTA_DIAG_PATH', '/var/log/pmta/diag-*.csv'),
    'config_path' => env('POWERMTA_CONFIG_PATH', '/etc/pmta/config'),

    /*
    |--------------------------------------------------------------------------
    | Training Configuration
    |--------------------------------------------------------------------------
    |
    | Single training configuration applied to all domains
    |
    */
    
    'training' => [
        'initial_rate' => 100,
        'increase_factor' => 2,
        'max_bounce_rate' => 5.0,
        'max_complaint_rate' => 0.1,
        'early_stage' => 5000,
        'mid_stage' => 20000,
        'provider_limits' => [
            'gmail' => 2000,
            'yahoo' => 1000,
            'microsoft' => 500,
            'outlook' => 500,
            'hotmail' => 500,
            'other' => 1000
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Analysis Settings
    |--------------------------------------------------------------------------
    |
    | Settings for PowerMTA log analysis
    |
    */
    
    'analysis' => [
        'default_hours' => 24,
        'max_hours' => 168, // 7 days
        'cache_duration' => 300, // 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Health Scoring
    |--------------------------------------------------------------------------
    |
    | Configuration for domain health scoring
    |
    */
    
    'health_scoring' => [
        'excellent_threshold' => 85,
        'good_threshold' => 70,
        'fair_threshold' => 50,
        'delivery_rate_weight' => 2,
        'bounce_rate_weight' => 3,
        'complaint_rate_weight' => 10,
        'fbl_weight' => 2,
        'diag_weight' => 0.5,
    ],
];

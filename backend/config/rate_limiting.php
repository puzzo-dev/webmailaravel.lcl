<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the rate limiting configuration for different
    | parts of the application.
    |
    */

    'api' => [
        'max_attempts' => env('RATE_LIMIT_API_MAX_ATTEMPTS', 60),
        'decay_minutes' => env('RATE_LIMIT_API_DECAY_MINUTES', 1),
    ],

    'auth' => [
        'max_attempts' => env('RATE_LIMIT_AUTH_MAX_ATTEMPTS', 5),
        'decay_minutes' => env('RATE_LIMIT_AUTH_DECAY_MINUTES', 15),
    ],

    'campaign' => [
        'max_attempts' => env('RATE_LIMIT_CAMPAIGN_MAX_ATTEMPTS', 10),
        'decay_minutes' => env('RATE_LIMIT_CAMPAIGN_DECAY_MINUTES', 60),
    ],

    'email' => [
        'max_attempts' => env('RATE_LIMIT_EMAIL_MAX_ATTEMPTS', 1000),
        'decay_minutes' => env('RATE_LIMIT_EMAIL_DECAY_MINUTES', 60),
    ],

    'webhook' => [
        'max_attempts' => env('RATE_LIMIT_WEBHOOK_MAX_ATTEMPTS', 100),
        'decay_minutes' => env('RATE_LIMIT_WEBHOOK_DECAY_MINUTES', 1),
    ],

    'upload' => [
        'max_attempts' => env('RATE_LIMIT_UPLOAD_MAX_ATTEMPTS', 20),
        'decay_minutes' => env('RATE_LIMIT_UPLOAD_DECAY_MINUTES', 60),
    ],
]; 
 
 
 
 
 
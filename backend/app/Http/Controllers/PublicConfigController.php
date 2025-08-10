<?php

namespace App\Http\Controllers;

use App\Models\SystemConfig;
use App\Traits\ResponseTrait;

class PublicConfigController extends Controller
{
    use ResponseTrait;

    /**
     * Get public configuration that doesn't require authentication
     * This includes basic app information visible to all users
     */
    public function getPublicConfig()
    {
        return $this->executeWithErrorHandling(function () {
            $config = [
                'app' => [
                    'name' => SystemConfig::get('APP_NAME', env('APP_NAME', 'WebMail Laravel')),
                    'url' => SystemConfig::get('APP_URL', env('APP_URL', request()->getSchemeAndHttpHost())),
                    'version' => '1.0.0',
                    'description' => 'Professional email campaign management platform',
                ],
                'features' => [
                    'registration_enabled' => SystemConfig::get('REGISTRATION_ENABLED', env('REGISTRATION_ENABLED', true)),
                    'demo_mode' => SystemConfig::get('DEMO_MODE', env('DEMO_MODE', false)),
                ],
                'branding' => [
                    'logo_url' => SystemConfig::get('LOGO_URL', null),
                    'favicon_url' => SystemConfig::get('FAVICON_URL', null),
                    'primary_color' => SystemConfig::get('PRIMARY_COLOR', '#3B82F6'),
                ],
                'webmail' => [
                    'enabled' => SystemConfig::get('WEBMAIL_ENABLED', false),
                    'url' => SystemConfig::get('WEBMAIL_URL', null),
                ],
            ];

            return $this->successResponse($config, 'Public configuration retrieved successfully');
        }, 'get_public_config');
    }
}

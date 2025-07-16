<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EmailTracking;
use App\Models\ClickTracking;
use App\Traits\GeoIPTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    use GeoIPTrait;

    /**
     * Track email open
     */
    public function trackOpen(Request $request, string $emailId): JsonResponse
    {
        try {
            $emailTracking = EmailTracking::where('email_id', $emailId)->first();

            if (!$emailTracking) {
                Log::warning('Email tracking not found', ['email_id' => $emailId]);
                return response()->json(['error' => 'Email not found'], 404);
            }

            // Get IP and user agent
            $ipAddress = $request->ip();
            $userAgent = $request->userAgent();

            // Get geo location
            $geoData = $this->getLocation($ipAddress);

            // Mark as opened
            $emailTracking->markAsOpened($ipAddress, $userAgent);

            // Update geo data if available
            if ($geoData['success']) {
                $emailTracking->update([
                    'country' => $geoData['country'] ?? null,
                    'city' => $geoData['city'] ?? null,
                    'device_type' => $this->getDeviceType($userAgent),
                    'browser' => $this->getBrowser($userAgent),
                    'os' => $this->getOS($userAgent)
                ]);
            }

            Log::info('Email opened tracked', [
                'email_id' => $emailId,
                'campaign_id' => $emailTracking->campaign_id,
                'ip_address' => $ipAddress
            ]);

            // Return a 1x1 transparent pixel
            return response()->make(
                base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
                200,
                [
                    'Content-Type' => 'image/gif',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0'
                ]
            );

        } catch (\Exception $e) {
            Log::error('Email open tracking failed', [
                'email_id' => $emailId,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Tracking failed'], 500);
        }
    }

    /**
     * Track email click
     */
    public function trackClick(Request $request, string $emailId, string $linkId): JsonResponse
    {
        try {
            $emailTracking = EmailTracking::where('email_id', $emailId)->first();

            if (!$emailTracking) {
                Log::warning('Email tracking not found for click', ['email_id' => $emailId]);
                return response()->json(['error' => 'Email not found'], 404);
            }

            // Get IP and user agent
            $ipAddress = $request->ip();
            $userAgent = $request->userAgent();

            // Get geo location
            $geoData = $this->getLocation($ipAddress);

            // Mark email as clicked
            $emailTracking->markAsClicked($ipAddress, $userAgent);

            // Create click tracking record
            ClickTracking::create([
                'email_tracking_id' => $emailTracking->id,
                'link_id' => $linkId,
                'original_url' => $request->get('url', ''),
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'country' => $geoData['success'] ? ($geoData['country'] ?? null) : null,
                'city' => $geoData['success'] ? ($geoData['city'] ?? null) : null,
                'device_type' => $this->getDeviceType($userAgent),
                'browser' => $this->getBrowser($userAgent),
                'os' => $this->getOS($userAgent),
                'clicked_at' => now()
            ]);

            Log::info('Email click tracked', [
                'email_id' => $emailId,
                'link_id' => $linkId,
                'campaign_id' => $emailTracking->campaign_id,
                'ip_address' => $ipAddress
            ]);

            // Redirect to original URL
            $originalUrl = $request->get('url', '');
            if ($originalUrl) {
                return redirect($originalUrl);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Email click tracking failed', [
                'email_id' => $emailId,
                'link_id' => $linkId,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Tracking failed'], 500);
        }
    }

    /**
     * Handle unsubscribe
     */
    public function unsubscribe(Request $request, string $emailId): JsonResponse
    {
        try {
            $emailTracking = EmailTracking::where('email_id', $emailId)->first();

            if (!$emailTracking) {
                return response()->json(['error' => 'Email not found'], 404);
            }

            $email = $emailTracking->recipient_email;
            $campaignId = $emailTracking->campaign_id;
            $metadata = [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'unsubscribed_at' => now()->toISOString()
            ];

            // Process unsubscribe through suppression list service
            $suppressionService = app(\App\Services\SuppressionListService::class);
            $result = $suppressionService->handleUnsubscribe($emailId, $email, $metadata);

            // Append to per-campaign unsubscribe file (for user info only)
            $unsubscribeService = app(\App\Services\UnsubscribeExportService::class);
            $unsubscribeService->appendToUnsubscribeList($campaignId, $email, $metadata);

            if ($result['success']) {
                Log::info('User unsubscribed', [
                    'email_id' => $emailId,
                    'recipient_email' => $emailTracking->recipient_email,
                    'campaign_id' => $emailTracking->campaign_id,
                    'ip' => $request->ip()
                ]);

                // Return a simple HTML page
                $html = '
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Unsubscribed</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .container { max-width: 500px; margin: 0 auto; }
                        .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                        .message { color: #666; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success">✓ Successfully Unsubscribed</div>
                        <div class="message">
                            You have been successfully unsubscribed from our mailing list.<br>
                            You will no longer receive emails from this sender.
                        </div>
                    </div>
                </body>
                </html>';

                return response($html, 200, ['Content-Type' => 'text/html']);
            }

            return response()->json(['error' => 'Failed to unsubscribe'], 500);

        } catch (\Exception $e) {
            Log::error('Unsubscribe failed', [
                'email_id' => $emailId,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Failed to unsubscribe'], 500);
        }
    }

    /**
     * Get device type from user agent
     */
    private function getDeviceType(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);
        
        if (strpos($userAgent, 'mobile') !== false) {
            return 'mobile';
        } elseif (strpos($userAgent, 'tablet') !== false) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    /**
     * Get browser from user agent
     */
    private function getBrowser(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);
        
        if (strpos($userAgent, 'chrome') !== false) {
            return 'Chrome';
        } elseif (strpos($userAgent, 'firefox') !== false) {
            return 'Firefox';
        } elseif (strpos($userAgent, 'safari') !== false) {
            return 'Safari';
        } elseif (strpos($userAgent, 'edge') !== false) {
            return 'Edge';
        } elseif (strpos($userAgent, 'opera') !== false) {
            return 'Opera';
        } else {
            return 'Other';
        }
    }

    /**
     * Get OS from user agent
     */
    private function getOS(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);
        
        if (strpos($userAgent, 'windows') !== false) {
            return 'Windows';
        } elseif (strpos($userAgent, 'mac') !== false) {
            return 'macOS';
        } elseif (strpos($userAgent, 'linux') !== false) {
            return 'Linux';
        } elseif (strpos($userAgent, 'android') !== false) {
            return 'Android';
        } elseif (strpos($userAgent, 'ios') !== false) {
            return 'iOS';
        } else {
            return 'Other';
        }
    }
} 
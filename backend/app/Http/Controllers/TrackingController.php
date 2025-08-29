<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EmailTracking;
use App\Models\ClickTracking;
use App\Traits\GeoIPTrait;
use App\Traits\SuppressionListTrait;
use App\Traits\CloudflareIPTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    use GeoIPTrait, SuppressionListTrait, CloudflareIPTrait;

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

            // Get real client IP (handles Cloudflare and other proxies)
            $ipAddress = $this->getRealClientIP($request);
            $userAgent = $request->userAgent();

            // Log IP detection details for debugging
            if (config('app.debug')) {
                $this->logIPDetection($request);
            }

            // Get geo location using real IP
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

            // Find the click tracking record
            $clickTracking = ClickTracking::where('email_tracking_id', $emailTracking->id)
                ->where('link_id', $linkId)
                ->first();

            if (!$clickTracking) {
                Log::warning('Click tracking record not found', [
                    'email_id' => $emailId,
                    'link_id' => $linkId
                ]);
                return response()->json(['error' => 'Link not found'], 404);
            }

            // Get real client IP (handles Cloudflare and other proxies)
            $ipAddress = $this->getRealClientIP($request);
            $userAgent = $request->userAgent();

            // Log IP detection details for debugging
            if (config('app.debug')) {
                $this->logIPDetection($request);
            }

            // Get geo location using real IP
            $geoData = $this->getLocation($ipAddress);

            // Mark email as clicked
            $emailTracking->markAsClicked($ipAddress, $userAgent);

            // Update click tracking record with click details
            $clickTracking->update([
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
                'original_url' => $clickTracking->original_url,
                'ip_address' => $ipAddress
            ]);

            // Redirect to original URL
            if ($clickTracking->original_url) {
                return redirect($clickTracking->original_url);
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
            
            // Get real client IP for unsubscribe tracking
            $realIP = $this->getRealClientIP($request);
            
            $metadata = [
                'ip_address' => $realIP,
                'user_agent' => $request->userAgent(),
                'unsubscribed_at' => now()->toISOString()
            ];

            // Process unsubscribe through suppression list trait
            $result = $this->handleUnsubscribe($emailId, $email, $metadata);

            // Append to per-campaign unsubscribe file (for user info only)
            $unsubscribeService = app(\App\Services\UnsubscribeExportService::class);
            $unsubscribeService->appendToUnsubscribeList($campaignId, $email, $metadata);

            if ($result['success']) {
                Log::info('User unsubscribed', [
                    'email_id' => $emailId,
                    'recipient_email' => $emailTracking->recipient_email,
                    'campaign_id' => $emailTracking->campaign_id,
                    'ip' => $realIP
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

    /**
     * Frontend-friendly unsubscribe endpoint
     */
    public function unsubscribeFromFrontend(Request $request, string $token): JsonResponse
    {
        try {
            // Decode the token to get email and campaign info
            $data = $this->decodeUnsubscribeToken($token);
            
            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired unsubscribe link'
                ], 400);
            }

            $email = $data['email'];
            $campaignId = $data['campaign_id'];

            // Get real client IP for unsubscribe tracking
            $realIP = $this->getRealClientIP($request);
            
            $metadata = [
                'ip_address' => $realIP,
                'user_agent' => $request->userAgent(),
                'unsubscribed_at' => now()->toISOString(),
                'method' => 'frontend'
            ];

            // Check if already unsubscribed
            $existingSuppression = \App\Models\SuppressionList::where('email', $email)
                ->where('reason', 'unsubscribe')
                ->first();

            if ($existingSuppression) {
                return response()->json([
                    'success' => true,
                    'already_unsubscribed' => true,
                    'email' => $email,
                    'message' => 'Email is already unsubscribed'
                ]);
            }

            // Process unsubscribe through suppression list trait
            $result = $this->handleUnsubscribe(null, $email, $metadata);

            // Append to per-campaign unsubscribe file (for user info only)
            $unsubscribeService = app(\App\Services\UnsubscribeExportService::class);
            $unsubscribeService->appendToUnsubscribeList($campaignId, $email, $metadata);

            if ($result['success']) {
                Log::info('User unsubscribed via frontend', [
                    'email' => $email,
                    'campaign_id' => $campaignId,
                    'ip' => $realIP,
                    'token' => $token
                ]);

                return response()->json([
                    'success' => true,
                    'email' => $email,
                    'message' => 'Successfully unsubscribed from mailing list'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to process unsubscribe request'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Frontend unsubscribe failed', [
                'token' => $token,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process unsubscribe request'
            ], 500);
        }
    }

    /**
     * Frontend-friendly resubscribe endpoint
     */
    public function resubscribeFromFrontend(Request $request, string $token): JsonResponse
    {
        try {
            // Decode the token to get email info
            $data = $this->decodeUnsubscribeToken($token);
            
            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired resubscribe link'
                ], 400);
            }

            $email = $data['email'];

            // Remove from suppression list
            $removed = \App\Models\SuppressionList::where('email', $email)
                ->where('reason', 'unsubscribe')
                ->delete();

            if ($removed > 0) {
                Log::info('User resubscribed via frontend', [
                    'email' => $email,
                    'token' => $token
                ]);

                return response()->json([
                    'success' => true,
                    'email' => $email,
                    'message' => 'Successfully resubscribed to mailing list'
                ]);
            }

            return response()->json([
                'success' => true,
                'email' => $email,
                'message' => 'Email was not unsubscribed'
            ]);

        } catch (\Exception $e) {
            Log::error('Frontend resubscribe failed', [
                'token' => $token,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process resubscribe request'
            ], 500);
        }
    }

    /**
     * Decode unsubscribe token
     */
    private function decodeUnsubscribeToken(string $token): ?array
    {
        try {
            // The token should contain email and campaign_id encoded
            // For now, we'll reverse engineer from the Campaign model method
            // This is a simplified approach - in production you might want to use JWT or signed URLs
            
            // Try to find a campaign that would generate this token
            $campaigns = \App\Models\Campaign::where('enable_unsubscribe_link', true)->get();
            
            foreach ($campaigns as $campaign) {
                // Try different emails to see if we can match the token
                // This is not efficient but works for our current token generation method
                $emailTrackings = \App\Models\EmailTracking::where('campaign_id', $campaign->id)->get();
                
                foreach ($emailTrackings as $tracking) {
                    $expectedToken = hash('sha256', $tracking->recipient_email . $campaign->id . config('app.key'));
                    if ($expectedToken === $token) {
                        return [
                            'email' => $tracking->recipient_email,
                            'campaign_id' => $campaign->id
                        ];
                    }
                }
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error('Failed to decode unsubscribe token', [
                'token' => $token,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
} 
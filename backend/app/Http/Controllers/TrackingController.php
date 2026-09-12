<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EmailTracking;
use App\Models\ClickTracking;
use App\Services\UserAgentParser;
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

            // Parse user agent using the shared UserAgentParser service
            $uaInfo = UserAgentParser::parse($userAgent);

            // Mark as opened
            $emailTracking->markAsOpened($ipAddress, $userAgent);

            // Update geo data if available
            if ($geoData['success']) {
                $emailTracking->update([
                    'country' => $geoData['country'] ?? null,
                    'city' => $geoData['city'] ?? null,
                    'device_type' => $uaInfo['device'],
                    'browser' => $uaInfo['browser'],
                    'os' => $uaInfo['os']
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

            // Parse user agent using the shared UserAgentParser service
            $uaInfo = UserAgentParser::parse($userAgent);

            // Mark email as clicked
            $emailTracking->markAsClicked($ipAddress, $userAgent);

            // Update click tracking record with click details
            $clickTracking->update([
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'country' => $geoData['success'] ? ($geoData['country'] ?? null) : null,
                'city' => $geoData['success'] ? ($geoData['city'] ?? null) : null,
                'device_type' => $uaInfo['device'],
                'browser' => $uaInfo['browser'],
                'os' => $uaInfo['os'],
                'clicked_at' => now()
            ]);

            Log::info('Email click tracked', [
                'email_id' => $emailId,
                'link_id' => $linkId,
                'campaign_id' => $emailTracking->campaign_id,
                'original_url' => $clickTracking->original_url,
                'ip_address' => $ipAddress
            ]);

            // Redirect to original URL (validate to prevent open redirect)
            if ($clickTracking->original_url) {
                $url = $clickTracking->original_url;
                if (filter_var($url, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $url)) {
                    return redirect($url);
                }
                Log::warning('Blocked invalid redirect URL in click tracking', [
                    'email_id' => $emailId,
                    'link_id' => $linkId,
                    'url' => $url,
                ]);
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
     * Decode unsubscribe token — O(1) database lookup
     */
    private function decodeUnsubscribeToken(string $token): ?array
    {
        try {
            // Direct lookup by stored unsubscribe_token
            $tracking = \App\Models\EmailTracking::where('unsubscribe_token', $token)->first();

            if ($tracking) {
                return [
                    'email' => $tracking->recipient_email,
                    'campaign_id' => $tracking->campaign_id,
                ];
            }

            // Fallback: legacy tokens (pre-migration) — compute from email_tracking + app.key
            // Only used for tokens generated before the unsubscribe_token column existed
            $tracking = \App\Models\EmailTracking::whereRaw(
                'SHA2(CONCAT(recipient_email, campaign_id, ?), 256) = ?',
                [config('app.key'), $token]
            )->first();

            if ($tracking) {
                // Backfill the token for future O(1) lookups
                $tracking->update(['unsubscribe_token' => $token]);
                return [
                    'email' => $tracking->recipient_email,
                    'campaign_id' => $tracking->campaign_id,
                ];
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to decode unsubscribe token', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
} 
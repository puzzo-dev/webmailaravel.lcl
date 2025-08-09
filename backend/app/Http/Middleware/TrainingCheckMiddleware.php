<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\UnifiedTrainingService;
use Illuminate\Support\Facades\Log;

class TrainingCheckMiddleware
{
    protected $unifiedTrainingService;

    public function __construct(
        UnifiedTrainingService $unifiedTrainingService
    ) {
        $this->unifiedTrainingService = $unifiedTrainingService;
    }

    /**
     * Handle an incoming request and run training checks before campaign execution.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        // Only run training checks for campaign-related actions
        if (!$this->isCampaignAction($request)) {
            return $next($request);
        }

        Log::info('Training middleware: Checking training requirements', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        try {
            // Get system-wide training configuration
            $trainingConfig = \App\Models\SystemConfig::getTrainingConfig();
            $defaultMode = $trainingConfig['default_mode'] ?? 'manual';
            $allowUserOverride = $trainingConfig['allow_user_override'] ?? true;
            
            // Determine which training mode to use
            $trainingMode = $defaultMode;
            if ($allowUserOverride && $user->hasTrainingEnabled()) {
                // User can override system default if allowed
                $trainingMode = $user->training_mode ?? $defaultMode;
            }
            
            Log::info('Training middleware: Using training mode', [
                'user_id' => $user->id,
                'system_default_mode' => $defaultMode,
                'allow_user_override' => $allowUserOverride,
                'final_training_mode' => $trainingMode
            ]);
            
            if ($trainingMode === 'manual') {
                // Run manual training if due
                if ($user->isManualTrainingDue()) {
                    Log::info('Training middleware: Running manual training for user', [
                        'user_id' => $user->id
                    ]);
                    
                    $result = $this->unifiedTrainingService->runManualTrainingForUser($user);
                    
                    Log::info('Training middleware: Manual training completed', [
                        'user_id' => $user->id,
                        'senders_updated' => $result['senders_updated'],
                        'success' => $result['success']
                    ]);
                }
                
            } elseif ($trainingMode === 'automatic') {
                // Run automatic training for user's domains if needed
                // Note: This is a simplified check - in production you might want more sophisticated timing
                $userDomains = $user->domains()->get();
                
                foreach ($userDomains as $domain) {
                    // Check if domain training is due (you can customize this logic)
                    $lastTraining = $domain->trainingConfigs()
                        ->where('user_id', $user->id)
                        ->latest('last_analysis')
                        ->first();
                        
                    if (!$lastTraining || $lastTraining->last_analysis < now()->subHours(24)) {
                        Log::info('Training middleware: Running automatic training for domain', [
                            'user_id' => $user->id,
                            'domain_id' => $domain->id
                        ]);
                        
                        // Run automatic training for this specific domain
                        $this->unifiedTrainingService->runTraining(null, $domain->id);
                    }
                }
            }
            
        } catch (\Exception $e) {
            // Log error but don't block the request
            Log::error('Training middleware: Error during training check', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return $next($request);
    }

    /**
     * Check if the current request is a campaign-related action
     */
    private function isCampaignAction(Request $request): bool
    {
        $route = $request->route();
        
        if (!$route) {
            return false;
        }

        $routeName = $route->getName();
        $uri = $request->getRequestUri();

        // Check for campaign execution routes
        $campaignRoutes = [
            'campaigns.start',
            'campaigns.resume',
            'campaigns.send',
            'campaigns.process'
        ];

        if (in_array($routeName, $campaignRoutes)) {
            return true;
        }

        // Check for campaign-related URIs
        $campaignUris = [
            '/api/campaigns/start',
            '/api/campaigns/resume',
            '/api/campaigns/send',
            '/api/campaigns/process'
        ];

        foreach ($campaignUris as $campaignUri) {
            if (str_contains($uri, $campaignUri)) {
                return true;
            }
        }

        // Check for POST requests to campaign endpoints
        if ($request->isMethod('POST') && str_contains($uri, '/api/campaigns/')) {
            $segments = explode('/', trim($uri, '/'));
            // Check if it's a campaign action (not just creation/update)
            if (count($segments) >= 4 && in_array(end($segments), ['start', 'resume', 'send', 'process'])) {
                return true;
            }
        }

        return false;
    }
}

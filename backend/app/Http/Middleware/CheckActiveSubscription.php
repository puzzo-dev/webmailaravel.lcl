<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('api')->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        
        // Admin users bypass subscription checks
        if ($user->hasRole('admin')) {
            return $next($request);
        }
        
        // Check if user has an active subscription
        $activeSubscription = $user->activeSubscription;
        
        if (!$activeSubscription || !$activeSubscription->isActive()) {
            return response()->json([
                'message' => 'Active subscription required for this feature',
                'error' => 'subscription_required',
                'subscription_status' => $activeSubscription ? $activeSubscription->status : 'none'
            ], 403);
        }
        
        return $next($request);
    }
} 
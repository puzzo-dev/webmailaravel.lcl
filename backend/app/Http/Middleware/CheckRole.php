<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role = null): Response
    {
        // If no role is specified, just pass through (for public routes)
        if ($role === null) {
            return $next($request);
        }

        // Only check authentication when a role is specified
        if (!Auth::guard('api')->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = Auth::guard('api')->user();
        
        // Check if user has the required role
        if ($user->role !== $role) {
            return response()->json(['message' => 'Unauthorized. Insufficient permissions.'], 403);
        }

        return $next($request);
    }
} 
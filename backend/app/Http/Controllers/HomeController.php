<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        // If request expects JSON (API call), return JSON response
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Email Campaign Management System API',
                'version' => '1.0.0',
                'status' => 'active',
                'endpoints' => [
                    'auth' => '/api/auth',
                    'campaigns' => '/api/campaigns',
                    'analytics' => '/api/analytics',
                    'documentation' => '/api/documentation'
                ]
            ]);
        }
        
        // For web requests, return the view
        return view('home');
    }
} 
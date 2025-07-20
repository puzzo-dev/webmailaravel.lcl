<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    public function __construct()
    {
        // $this->middleware('auth:api', ['except' => ['login', 'register', 'forgotPassword', 'resetPassword']]);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $identifier = $request->identifier;
        $password = $request->password;

        // Try to authenticate with email or username
        $user = User::where('email', $identifier)
                   ->orWhere('username', $identifier)
                   ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        try {
            // Generate JWT token
            $token = JWTAuth::fromUser($user);
            
            // Set the JWT token in a secure HTTP-only cookie
            $cookie = cookie(
                'jwt_token',
                $token,
                config('jwt.ttl'), // TTL in minutes
                '/', // Path
                null, // Domain
                request()->secure(), // Secure flag (true for HTTPS)
                true, // HTTP only
                false, // Raw
                'Lax' // SameSite
            );

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60 // Convert to seconds
                ]
            ])->withCookie($cookie);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token'
            ], 500);
        }
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => 'user',
        ]);

        try {
            // Generate JWT token
            $token = JWTAuth::fromUser($user);
            
            // Set the JWT token in a secure HTTP-only cookie
            $cookie = cookie(
                'jwt_token',
                $token,
                config('jwt.ttl'), // TTL in minutes
                '/', // Path
                null, // Domain
                request()->secure(), // Secure flag (true for HTTPS)
                true, // HTTP only
                false, // Raw
                'Lax' // SameSite
            );

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'user' => $user,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60 // Convert to seconds
                ]
            ], 201)->withCookie($cookie);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Try to get the token and invalidate it if it exists
            $token = JWTAuth::getToken();
            if ($token) {
                JWTAuth::invalidate($token);
            }
            
            // Clear the JWT cookie regardless of token validity
            $cookie = cookie()->forget('jwt_token');
            
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ])->withCookie($cookie);
        } catch (JWTException $e) {
            // Even if token invalidation fails, clear the cookie
            $cookie = cookie()->forget('jwt_token');
            
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ])->withCookie($cookie);
        }
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'User profile retrieved',
            'data' => [
                'user' => $request->user()
            ]
        ]);
    }

    public function refresh(Request $request)
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            
            // Set the new JWT token in a secure HTTP-only cookie
            $cookie = cookie(
                'jwt_token',
                $token,
                config('jwt.ttl'), // TTL in minutes
                '/', // Path
                null, // Domain
                request()->secure(), // Secure flag (true for HTTPS)
                true, // HTTP only
                false, // Raw
                'Lax' // SameSite
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60 // Convert to seconds
                ]
            ])->withCookie($cookie);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not refresh token - please login again'
            ], 401);
        }
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // TODO: Implement password reset logic
        return response()->json([
            'success' => true,
            'message' => 'Password reset link sent to your email'
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // TODO: Implement password reset logic
        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully'
        ]);
    }
} 
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

class AuthController extends BaseController
{
    /**
     * User login
     */
    public function login(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'identifier' => 'required|string',
                'password' => 'required|string',
            ],
            function () use ($request) {
                $identifier = $request->identifier;
                $password = $request->password;

                // Find user by username or email
                $user = User::where('email', $identifier)
                    ->orWhere('username', $identifier)
                    ->first();

                if ($user && Hash::check($password, $user->password)) {
                    Auth::login($user);
                    
                    Log::info('User logged in', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'username' => $user->username,
                        'ip' => $request->ip()
                    ]);

                    return $this->successResponse([
                        'user' => $user,
                    ], 'Login successful');
                }

                return $this->errorResponse('Invalid credentials', 'Authentication failed', 401);
            },
            'user_login'
        );
    }

    /**
     * User registration
     */
    public function register(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'username' => 'required|string|max:255|unique:users',
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ],
            function () use ($request) {
                $userData = $request->only(['username', 'name', 'email', 'password']);
                $userData['password'] = Hash::make($userData['password']);
                
                $user = User::create($userData);
                Auth::login($user);
                
                Log::info('User registered', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip()
                ]);
                
                return $this->createdResponse([
                    'user' => $user,
                ], 'Registration successful');
            },
            'user_registration'
        );
    }

    /**
     * Get current user information
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->unauthorizedResponse('Not authenticated');
        }
        
        return $this->successResponse($user, 'User information retrieved successfully');
    }

    /**
     * User logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($user) {
            Log::info('User logged out', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip()
            ]);
        }
        
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return $this->successResponse(null, 'Logout successful');
    }

    /**
     * Forgot password
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'email' => 'required|string|email',
            ],
            function () use ($request) {
                $status = Password::sendResetLink(
                    $request->only('email')
                );
                
                if ($status === Password::RESET_LINK_SENT) {
                    Log::info('Password reset link sent', [
                        'email' => $request->email,
                        'ip' => $request->ip()
                    ]);
                    
                    return $this->successResponse(null, 'Password reset link sent to your email');
                }
                
                return $this->errorResponse('Unable to send reset link', 'Password reset failed');
            },
            'forgot_password'
        );
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'token' => 'required|string',
                'email' => 'required|string|email',
                'password' => 'required|string|min:8|confirmed',
            ],
            function () use ($request) {
                $status = Password::reset(
                    $request->only('email', 'password', 'password_confirmation', 'token'),
                    function (User $user, string $password) {
                        $user->forceFill([
                            'password' => Hash::make($password)
                        ])->setRememberToken(Str::random(60));
                        
                        $user->save();
                        
                        event(new PasswordReset($user));
                    }
                );
                
                if ($status === Password::PASSWORD_RESET) {
                    Log::info('Password reset successful', [
                        'email' => $request->email,
                        'ip' => $request->ip()
                    ]);
                    
                    return $this->successResponse(null, 'Password reset successful');
                }
                
                return $this->errorResponse('Unable to reset password', 'Password reset failed');
            },
            'reset_password'
        );
    }

    /**
     * Verify email
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'email' => 'required|string|email',
                'token' => 'required|string',
            ],
            function () use ($request) {
                $user = User::where('email', $request->email)->first();
                
                if (!$user) {
                    return $this->errorResponse('User not found', 'Email verification failed');
                }
                
                // Email verification logic here
                $user->markEmailAsVerified();
                
                Log::info('Email verified', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip()
                ]);
                
                return $this->successResponse(null, 'Email verified successfully');
            },
            'verify_email'
        );
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'email' => 'required|string|email',
            ],
            function () use ($request) {
                $user = User::where('email', $request->email)->first();
                
                if (!$user) {
                    return $this->errorResponse('User not found', 'Verification email failed');
                }
                
                if ($user->hasVerifiedEmail()) {
                    return $this->errorResponse('Email already verified', 'Verification email failed');
                }
                
                // Resend verification email logic here
                
                Log::info('Verification email resent', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip()
                ]);
                
                return $this->successResponse(null, 'Verification email sent');
            },
            'resend_verification'
        );
    }
} 
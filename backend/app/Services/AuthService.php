<?php

namespace App\Services;

use App\Models\User;
use App\Models\PasswordReset;
use App\Models\EmailVerificationToken;
use App\Notifications\PasswordResetRequested;
use App\Notifications\PasswordResetCompleted;
use App\Notifications\EmailVerificationRequested;
use App\Notifications\EmailVerified;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;

class AuthService
{
    /**
     * Request password reset
     */
    public function requestPasswordReset(string $email, Request $request): array
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        // Invalidate any existing password reset tokens for this email
        PasswordReset::where('email', $email)
            ->where('used', false)
            ->update(['used' => true, 'used_at' => now()]);

        // Create new password reset token
        $token = Str::random(64);
        $deviceInfo = UserAgentParser::parse($request->header('User-Agent'));
        
        $passwordReset = PasswordReset::create([
            'email' => $email,
            'token' => $token,
            'expires_at' => now()->addHours(1), // 1 hour expiry
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ]);

        // Prepare reset data for notification
        $resetData = [
            'ip' => $request->ip(),
            'device' => $deviceInfo['combined'],
            'browser' => $deviceInfo['browser'],
            'os' => $deviceInfo['os'],
            'time' => now()->format('Y-m-d H:i:s')
        ];

        // Send notification
        $user->notify(new PasswordResetRequested($passwordReset, $resetData));

        return [
            'success' => true,
            'message' => 'Password reset link sent to your email',
            'data' => [
                'expires_in' => 60, // minutes
                'email' => $email
            ]
        ];
    }

    /**
     * Reset password using token
     */
    public function resetPassword(string $token, string $email, string $password, Request $request): array
    {
        $passwordReset = PasswordReset::where('token', $token)
            ->where('email', $email)
            ->valid()
            ->first();

        if (!$passwordReset) {
            return [
                'success' => false,
                'message' => 'Invalid or expired reset token'
            ];
        }

        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        // Update password
        $user->password = Hash::make($password);
        $user->save();

        // Mark token as used
        $passwordReset->markAsUsed();

        // Prepare reset completion data
        $deviceInfo = UserAgentParser::parse($request->header('User-Agent'));
        $resetData = [
            'ip' => $request->ip(),
            'device' => $deviceInfo['combined'],
            'browser' => $deviceInfo['browser'],
            'os' => $deviceInfo['os'],
            'time' => now()->format('Y-m-d H:i:s')
        ];

        // Send completion notification
        $user->notify(new PasswordResetCompleted($resetData));

        // Optionally, invalidate all user sessions here
        // This would require implementing session management

        return [
            'success' => true,
            'message' => 'Password reset successfully'
        ];
    }

    /**
     * Send email verification
     */
    public function sendEmailVerification(User $user, Request $request): array
    {
        // Check if email is already verified
        if ($user->hasVerifiedEmail()) {
            return [
                'success' => false,
                'message' => 'Email is already verified'
            ];
        }

        // Invalidate any existing verification tokens for this user
        EmailVerificationToken::forUser($user->id)
            ->where('used', false)
            ->update(['used' => true, 'used_at' => now()]);

        // Create new verification token
        $token = Str::random(64);
        $deviceInfo = UserAgentParser::parse($request->header('User-Agent'));
        
        $verificationToken = EmailVerificationToken::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'token' => $token,
            'expires_at' => now()->addHours(24), // 24 hours expiry
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ]);

        // Prepare verification data for notification
        $verificationData = [
            'ip' => $request->ip(),
            'device' => $deviceInfo['combined'],
            'browser' => $deviceInfo['browser'],
            'os' => $deviceInfo['os'],
            'time' => now()->format('Y-m-d H:i:s')
        ];

        // Send notification
        $user->notify(new EmailVerificationRequested($verificationToken, $verificationData));

        return [
            'success' => true,
            'message' => 'Verification email sent',
            'data' => [
                'expires_in' => 1440, // minutes (24 hours)
                'email' => $user->email
            ]
        ];
    }

    /**
     * Verify email using token
     */
    public function verifyEmail(string $token, string $email, Request $request): array
    {
        $verificationToken = EmailVerificationToken::where('token', $token)
            ->where('email', $email)
            ->valid()
            ->first();

        if (!$verificationToken) {
            return [
                'success' => false,
                'message' => 'Invalid or expired verification token'
            ];
        }

        $user = $verificationToken->user;
        
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        // Check if already verified
        if ($user->hasVerifiedEmail()) {
            return [
                'success' => false,
                'message' => 'Email is already verified'
            ];
        }

        // Mark email as verified
        $user->markEmailAsVerified();

        // Mark token as used
        $verificationToken->markAsUsed();

        // Prepare verification completion data
        $deviceInfo = UserAgentParser::parse($request->header('User-Agent'));
        $verificationData = [
            'ip' => $request->ip(),
            'device' => $deviceInfo['combined'],
            'browser' => $deviceInfo['browser'],
            'os' => $deviceInfo['os'],
            'time' => now()->format('Y-m-d H:i:s')
        ];

        // Send completion notification
        $user->notify(new EmailVerified($verificationData));

        return [
            'success' => true,
            'message' => 'Email verified successfully',
            'data' => [
                'user' => $user->fresh()
            ]
        ];
    }

    /**
     * Resend email verification
     */
    public function resendEmailVerification(User $user, Request $request): array
    {
        // Check if email is already verified
        if ($user->hasVerifiedEmail()) {
            return [
                'success' => false,
                'message' => 'Email is already verified'
            ];
        }

        // Check rate limiting (optional)
        $recentToken = EmailVerificationToken::forUser($user->id)
            ->where('created_at', '>', now()->subMinutes(5))
            ->first();

        if ($recentToken) {
            return [
                'success' => false,
                'message' => 'Please wait before requesting another verification email'
            ];
        }

        return $this->sendEmailVerification($user, $request);
    }
}

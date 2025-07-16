<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        $notificationTypes = [
            [
                'type' => 'App\Notifications\CampaignSent',
                'data' => [
                    'title' => 'Campaign Sent Successfully',
                    'message' => 'Your newsletter campaign "Summer Sale 2024" has been sent to 1,234 recipients',
                    'type' => 'success',
                    'campaign_id' => 1,
                ],
            ],
            [
                'type' => 'App\Notifications\DomainReputationAlert',
                'data' => [
                    'title' => 'Domain Reputation Alert',
                    'message' => 'Domain "example.com" reputation dropped to 85%. Consider reviewing your sending practices.',
                    'type' => 'warning',
                    'domain' => 'example.com',
                    'reputation' => 85,
                ],
            ],
            [
                'type' => 'App\Notifications\FeatureAnnouncement',
                'data' => [
                    'title' => 'New Feature Available',
                    'message' => 'Sender rotation is now available for better deliverability. Check it out in your settings.',
                    'type' => 'info',
                    'feature' => 'sender_rotation',
                ],
            ],
            [
                'type' => 'App\Notifications\BounceAlert',
                'data' => [
                    'title' => 'High Bounce Rate Detected',
                    'message' => 'Campaign "Weekly Newsletter" has a bounce rate of 12%. This may affect your sender reputation.',
                    'type' => 'warning',
                    'campaign_id' => 2,
                    'bounce_rate' => 12,
                ],
            ],
            [
                'type' => 'App\Notifications\PaymentSuccessful',
                'data' => [
                    'title' => 'Payment Successful',
                    'message' => 'Your subscription has been renewed successfully. Thank you for your continued trust.',
                    'type' => 'success',
                    'amount' => 29.99,
                    'currency' => 'USD',
                ],
            ],
            [
                'type' => 'App\Notifications\SecurityAlert',
                'data' => [
                    'title' => 'New Login Detected',
                    'message' => 'A new login was detected from a different device. If this wasn\'t you, please secure your account.',
                    'type' => 'warning',
                    'ip_address' => '192.168.1.100',
                    'location' => 'New York, US',
                ],
            ],
        ];

        foreach ($users as $user) {
            // Create 3-5 notifications per user
            $numNotifications = rand(3, 5);
            
            for ($i = 0; $i < $numNotifications; $i++) {
                $notificationType = $notificationTypes[array_rand($notificationTypes)];
                
                // Some notifications should be read, others unread
                $readAt = rand(0, 100) < 60 ? now()->subMinutes(rand(1, 1440)) : null;
                
                DB::table('notifications')->insert([
                    'id' => Str::uuid(),
                    'type' => $notificationType['type'],
                    'notifiable_type' => User::class,
                    'notifiable_id' => $user->id,
                    'data' => json_encode($notificationType['data']),
                    'read_at' => $readAt,
                    'created_at' => now()->subMinutes(rand(1, 10080)), // Random time in last week
                    'updated_at' => now()->subMinutes(rand(1, 10080)),
                ]);
            }
        }
    }
}

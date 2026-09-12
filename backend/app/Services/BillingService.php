<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Traits\BillingTrait;
use Illuminate\Http\Request;

class BillingService
{
    use BillingTrait;

    /**
     * Calculate conversion rate (active subscriptions / total users).
     */
    private function calculateConversionRate(): float
    {
        $totalUsers = User::count();
        $activeSubscriptions = Subscription::where('status', 'active')->count();

        if ($totalUsers === 0) {
            return 0.0;
        }

        return round(($activeSubscriptions / $totalUsers) * 100, 1);
    }

    /**
     * Get billing statistics for admin dashboard.
     */
    public function getBillingStats(): array
    {
        $stats = [
            'active_subscriptions' => 0,
            'pending_payments' => 0,
            'expiring_soon' => 0,
            'monthly_revenue' => 0.00,
            'last_month_revenue' => 0.00,
            'total_revenue' => 0.00,
            'conversion_rate' => 0.0,
        ];

        try {
            $stats['active_subscriptions'] = Subscription::where('status', 'active')->count();
        } catch (\Exception $e) {
            \Log::warning('Failed to get active subscriptions count: ' . $e->getMessage());
        }

        try {
            $stats['pending_payments'] = Subscription::where('status', 'pending')->count();
        } catch (\Exception $e) {
            \Log::warning('Failed to get pending payments count: ' . $e->getMessage());
        }

        try {
            $stats['expiring_soon'] = Subscription::where('status', 'active')
                ->where('ends_at', '<=', now()->addDays(7))
                ->count();
        } catch (\Exception $e) {
            \Log::warning('Failed to get expiring subscriptions count: ' . $e->getMessage());
        }

        try {
            $stats['monthly_revenue'] = (float) Subscription::where('status', 'active')
                ->where('payment_date', '>=', now()->startOfMonth())
                ->sum('payment_amount') ?: 0.00;
        } catch (\Exception $e) {
            \Log::warning('Failed to calculate monthly revenue: ' . $e->getMessage());
        }

        try {
            $stats['last_month_revenue'] = (float) Subscription::where('status', 'active')
                ->where('payment_date', '>=', now()->subMonth()->startOfMonth())
                ->where('payment_date', '<', now()->startOfMonth())
                ->sum('payment_amount') ?: 0.00;
        } catch (\Exception $e) {
            \Log::warning('Failed to calculate last month revenue: ' . $e->getMessage());
        }

        try {
            $stats['total_revenue'] = (float) Subscription::where('status', 'active')
                ->sum('payment_amount') ?: 0.00;
        } catch (\Exception $e) {
            \Log::warning('Failed to calculate total revenue: ' . $e->getMessage());
        }

        try {
            $stats['conversion_rate'] = $this->calculateConversionRate();
        } catch (\Exception $e) {
            \Log::warning('Failed to calculate conversion rate: ' . $e->getMessage());
        }

        return $stats;
    }

    /**
     * Create a new plan with validated data only.
     */
    public function createPlan(array $validatedData): Plan
    {
        return Plan::create($validatedData);
    }

    /**
     * Update a plan with validated data only.
     */
    public function updatePlan(Plan $plan, array $validatedData): Plan
    {
        $plan->update($validatedData);
        return $plan->fresh();
    }

    /**
     * Delete a plan if it has no active subscriptions.
     */
    public function deletePlan(Plan $plan): bool
    {
        $activeSubscriptions = Subscription::where('plan_id', $plan->id)
            ->where('status', 'active')
            ->count();

        if ($activeSubscriptions > 0) {
            throw new \InvalidArgumentException('Cannot delete plan with active subscriptions');
        }

        $plan->delete();
        return true;
    }

    /**
     * Get or create default plans.
     */
    public function getOrCreateDefaultPlans(): \Illuminate\Database\Eloquent\Collection
    {
        $plans = Plan::where('is_active', true)->orderBy('price')->get();

        if ($plans->isEmpty()) {
            $defaultPlans = [
                [
                    'name' => 'Starter',
                    'description' => 'Perfect for small businesses and individuals',
                    'price' => 19.99,
                    'currency' => 'USD',
                    'duration_days' => 30,
                    'max_senders' => 2,
                    
                    'max_total_campaigns' => 10,
                    'max_live_campaigns' => 1,
                    'daily_sending_limit' => 1000,
                    'features' => ['Basic Analytics', 'Email Support', 'Standard Templates', 'Basic Reporting'],
                    'is_active' => true,
                ],
                [
                    'name' => 'Professional',
                    'description' => 'Ideal for growing businesses and marketing teams',
                    'price' => 49.99,
                    'currency' => 'USD',
                    'duration_days' => 30,
                    'max_senders' => 10,
                    
                    'max_total_campaigns' => 50,
                    'max_live_campaigns' => 3,
                    'daily_sending_limit' => 5000,
                    'features' => ['Advanced Analytics', 'Priority Support', 'Custom Domains', 'API Access', 'Advanced Reporting', 'A/B Testing'],
                    'is_active' => true,
                ],
                [
                    'name' => 'Enterprise',
                    'description' => 'For large organizations with high-volume needs',
                    'price' => 99.99,
                    'currency' => 'USD',
                    'duration_days' => 30,
                    'max_senders' => 50,
                    
                    'max_total_campaigns' => 200,
                    'max_live_campaigns' => 10,
                    'daily_sending_limit' => 25000,
                    'features' => ['Advanced Analytics', 'Dedicated Support', 'Custom Domains', 'API Access', 'White-label Options', 'Advanced Reporting', 'A/B Testing', 'Custom Integrations'],
                    'is_active' => true,
                ],
            ];

            foreach ($defaultPlans as $planData) {
                Plan::create($planData);
            }

            $plans = Plan::where('is_active', true)->orderBy('price')->get();
        }

        return $plans;
    }
}

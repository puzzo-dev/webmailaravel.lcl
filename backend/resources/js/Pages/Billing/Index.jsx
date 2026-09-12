import { useState, useEffect } from 'react';
import { HiCreditCard, HiCheck, HiDownload, HiClock } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import StatusBadge from '../../Components/StatusBadge';
import EmptyState from '../../Components/EmptyState';
import { useApi, useApiAction } from '../../hooks/useApi';

export default function BillingIndex({ auth }) {
    const [tab, setTab] = useState('subscription');
    const { data: billingData, loading } = useApi('/api/billing/subscription');
    const { data: historyData, loading: historyLoading } = useApi('/api/billing/history');
    const { data: plansData, loading: plansLoading } = useApi('/api/billing/plans');
    const { execute, loading: actionLoading } = useApiAction();

    const subscription = billingData?.data || billingData || {};
    const history = historyData?.data || historyData || [];
    const plans = plansData?.data || plansData || [];

    const currentPlanName = subscription?.plan?.name;

    const tabs = [
        { key: 'subscription', label: 'Subscription' },
        { key: 'history', label: 'Payment History' },
        { key: 'plans', label: 'Plans' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your subscription and payment history</p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {tab === 'subscription' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : subscription && subscription.plan ? (
                        <Card title="Current Subscription">
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <HiCreditCard className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{subscription.plan.name || 'Current Plan'}</p>
                                            <p className="text-sm text-gray-500">${subscription.plan.price || 0}/{subscription.plan.billing_period || 'month'}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={subscription.status || 'active'} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <p className="font-medium text-gray-900 capitalize">{subscription.status || 'Active'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Renewal Date</p>
                                        <p className="font-medium text-gray-900">{subscription.renews_at ? new Date(subscription.renews_at).toLocaleDateString() : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Max Senders</p>
                                        <p className="font-medium text-gray-900">{subscription.plan.max_senders || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Daily Sending Limit</p>
                                        <p className="font-medium text-gray-900">{(subscription.plan.daily_sending_limit || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <Button variant="secondary" onClick={() => setTab('plans')}>Change Plan</Button>
                                    {subscription.status === 'active' && (
                                        <Button variant="danger" onClick={async () => {
                                            if (confirm('Cancel your subscription?')) {
                                                try { await execute('post', '/api/billing/cancel'); window.location.reload(); } catch (e) { alert(e.message); }
                                            }
                                        }}>Cancel Subscription</Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <EmptyState
                                icon={HiCreditCard}
                                title="No active subscription"
                                description="Choose a plan to start sending campaigns."
                                action={<Button onClick={() => setTab('plans')}>View Plans</Button>}
                            />
                        </Card>
                    )}
                </div>
            )}

            {tab === 'history' && (
                <Card title="Payment History">
                    <div className="p-5">
                        {historyLoading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /></div>
                        ) : history.length === 0 ? (
                            <EmptyState icon={HiClock} title="No payments yet" description="Your payment history will appear here." />
                        ) : (
                            <div className="space-y-3">
                                {history.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <HiCheck className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">${payment.amount || 0}</p>
                                                <p className="text-xs text-gray-400">{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StatusBadge status={payment.status || 'completed'} />
                                            {payment.invoice_url && (
                                                <Button size="sm" variant="ghost" href={payment.invoice_url}><HiDownload className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {tab === 'plans' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plansLoading ? (
                        <div className="col-span-3 flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : plans.length === 0 ? (
                        <div className="col-span-3"><EmptyState icon={HiCreditCard} title="No plans available" description="Plans will appear here once configured by an admin." /></div>
                    ) : plans.map((plan) => {
                        const features = [
                            `${plan.max_senders || 0} Senders`,
                            `${(plan.daily_sending_limit || 0).toLocaleString()} emails/day`,
                            `${plan.max_total_campaigns || 0} total campaigns`,
                            `${plan.max_live_campaigns || 0} live campaigns`,
                        ];
                        const isCurrent = currentPlanName === plan.name;
                        return (
                            <Card key={plan.id || plan.name} className={`p-6 ${isCurrent ? 'ring-2 ring-indigo-600' : ''}`}>
                                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                <p className="text-3xl font-bold text-gray-900 mt-2">${plan.price}<span className="text-sm font-normal text-gray-500">/{plan.duration_days === 30 ? 'mo' : `${plan.duration_days}d`}</span></p>
                                <ul className="mt-4 space-y-2">
                                    {features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                                            <HiCheck className="h-4 w-4 text-green-500" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                {isCurrent ? (
                                    <Button className="w-full mt-6" variant="secondary" disabled>
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Button className="w-full mt-6" variant={plan.name === 'Professional' ? 'primary' : 'secondary'} onClick={async () => {
                                        try { await execute('post', '/api/billing/subscribe', { plan_id: plan.id }); window.location.reload(); } catch (e) { alert(e.message); }
                                    }} disabled={actionLoading}>
                                        Subscribe to {plan.name}
                                    </Button>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

BillingIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

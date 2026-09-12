import { useState } from 'react';
import { HiCreditCard, HiUsers, HiCurrencyDollar, HiChartBar, HiPlus, HiPencil, HiTrash, HiCheck } from 'react-icons/hi';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import StatusBadge from '../../../Components/StatusBadge';
import MetricCard from '../../../Components/MetricCard';
import Modal from '../../../Components/Modal';
import EmptyState from '../../../Components/EmptyState';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminBilling({ auth }) {
    const [tab, setTab] = useState('overview');
    const { data: statsData, loading: statsLoading } = useApi('/api/admin/billing/stats');
    const { data: subsData, loading: subsLoading } = useApi('/api/admin/billing/subscriptions');
    const { data: plansData, loading: plansLoading, refetch: refetchPlans } = useApi('/api/admin/billing/plans');
    const { execute, loading: actionLoading } = useApiAction();
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
        name: '', description: '', price: '', currency: 'USD', duration_days: 30,
        max_senders: 1, max_total_campaigns: 10, max_live_campaigns: 1, daily_sending_limit: 1000,
        features: [], is_active: true,
    });
    const [featureInput, setFeatureInput] = useState('');

    const stats = statsData?.data || statsData || {};
    const subscriptions = subsData?.data?.data || subsData?.data || [];
    const plans = plansData?.data || plansData || [];

    const openCreatePlan = () => {
        setEditingPlan(null);
        setPlanForm({
            name: '', description: '', price: '', currency: 'USD', duration_days: 30,
            max_senders: 1, max_total_campaigns: 10, max_live_campaigns: 1, daily_sending_limit: 1000,
            features: [], is_active: true,
        });
        setFeatureInput('');
        setShowPlanModal(true);
    };

    const openEditPlan = (plan) => {
        setEditingPlan(plan);
        setPlanForm({
            name: plan.name || '',
            description: plan.description || '',
            price: plan.price || '',
            currency: plan.currency || 'USD',
            duration_days: plan.duration_days || 30,
            max_senders: plan.max_senders || 1,
            max_total_campaigns: plan.max_total_campaigns || 10,
            max_live_campaigns: plan.max_live_campaigns || 1,
            daily_sending_limit: plan.daily_sending_limit || 1000,
            features: plan.features || [],
            is_active: plan.is_active ?? true,
        });
        setFeatureInput('');
        setShowPlanModal(true);
    };

    const handlePlanSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...planForm, price: parseFloat(planForm.price) };
            if (editingPlan) {
                await execute('put', `/api/admin/billing/plans/${editingPlan.id}`, payload);
            } else {
                await execute('post', '/api/admin/billing/plans', payload);
            }
            setShowPlanModal(false);
            refetchPlans();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeletePlan = async (plan) => {
        if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
        try {
            await execute('delete', `/api/admin/billing/plans/${plan.id}`);
            refetchPlans();
        } catch (err) {
            alert(err.message);
        }
    };

    const addFeature = () => {
        if (featureInput.trim() && !planForm.features.includes(featureInput.trim())) {
            setPlanForm({ ...planForm, features: [...planForm.features, featureInput.trim()] });
            setFeatureInput('');
        }
    };

    const removeFeature = (idx) => {
        setPlanForm({ ...planForm, features: planForm.features.filter((_, i) => i !== idx) });
    };

    const tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'plans', label: 'Plans' },
        { key: 'subscriptions', label: 'Subscriptions' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Billing Administration</h1>
                <p className="text-sm text-gray-500 mt-1">Manage plans, subscriptions, and billing</p>
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

            {tab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard icon={HiCurrencyDollar} label="Total Revenue" value={`$${(stats.total_revenue || 0).toLocaleString()}`} color="green" />
                        <MetricCard icon={HiUsers} label="Active Subscriptions" value={(stats.active_subscriptions || 0).toLocaleString()} color="indigo" />
                        <MetricCard icon={HiCreditCard} label="Monthly Recurring" value={`$${(stats.mrr || 0).toLocaleString()}`} color="blue" />
                        <MetricCard icon={HiChartBar} label="Total Transactions" value={(stats.total_transactions || 0).toLocaleString()} color="purple" />
                    </div>

                    <Card title="Active Subscriptions">
                        <div className="p-5">
                            {subsLoading ? (
                                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                            ) : subscriptions.length === 0 ? (
                                <EmptyState icon={HiCreditCard} title="No subscriptions" description="Active subscriptions will appear here." />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renews</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {subscriptions.map((s) => (
                                                <tr key={s.id} className="hover:bg-gray-50">
                                                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.user?.name || s.user?.email || '—'}</td>
                                                    <td className="px-5 py-3 text-sm text-gray-700">{s.plan?.name || '—'}</td>
                                                    <td className="px-5 py-3"><StatusBadge status={s.status || 'active'} /></td>
                                                    <td className="px-5 py-3 text-sm text-gray-700">${s.plan?.price || 0}</td>
                                                    <td className="px-5 py-3 text-sm text-gray-500">{s.renews_at ? new Date(s.renews_at).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Card>
                </>
            )}

            {tab === 'plans' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Billing Plans</h2>
                        <Button onClick={openCreatePlan}>
                            <HiPlus className="h-4 w-4" /> Create Plan
                        </Button>
                    </div>

                    {plansLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : plans.length === 0 ? (
                        <Card><EmptyState icon={HiCreditCard} title="No plans" description="Create a plan to start billing users." action={<Button onClick={openCreatePlan}><HiPlus className="h-4 w-4" /> Create Plan</Button>} /></Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <Card key={plan.id} className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">${plan.price}<span className="text-sm font-normal text-gray-500">/{plan.duration_days}d</span></p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openEditPlan(plan)} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded"><HiPencil className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeletePlan(plan)} className="p-1.5 text-gray-500 hover:text-red-600 rounded"><HiTrash className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                    {plan.description && <p className="text-sm text-gray-500 mt-2">{plan.description}</p>}
                                    <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                                        <div><span className="text-gray-400">Senders:</span> <span className="font-medium text-gray-900">{plan.max_senders}</span></div>
                                        <div><span className="text-gray-400">Daily limit:</span> <span className="font-medium text-gray-900">{(plan.daily_sending_limit || 0).toLocaleString()}</span></div>
                                        <div><span className="text-gray-400">Campaigns:</span> <span className="font-medium text-gray-900">{plan.max_total_campaigns}</span></div>
                                        <div><span className="text-gray-400">Live:</span> <span className="font-medium text-gray-900">{plan.max_live_campaigns}</span></div>
                                    </div>
                                    {plan.features && plan.features.length > 0 && (
                                        <ul className="mt-4 space-y-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                                    <HiCheck className="h-3 w-3 text-green-500" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                        <StatusBadge status={plan.is_active ? 'active' : 'inactive'} label={plan.is_active ? 'Active' : 'Inactive'} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'subscriptions' && (
                <Card title="All Subscriptions">
                    <div className="p-5">
                        {subsLoading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                        ) : subscriptions.length === 0 ? (
                            <EmptyState icon={HiCreditCard} title="No subscriptions" description="Active subscriptions will appear here." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renews</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {subscriptions.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.user?.name || s.user?.email || '—'}</td>
                                                <td className="px-5 py-3 text-sm text-gray-700">{s.plan?.name || '—'}</td>
                                                <td className="px-5 py-3"><StatusBadge status={s.status || 'active'} /></td>
                                                <td className="px-5 py-3 text-sm text-gray-700">${s.plan?.price || 0}</td>
                                                <td className="px-5 py-3 text-sm text-gray-500">{s.renews_at ? new Date(s.renews_at).toLocaleDateString() : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Modal show={showPlanModal} onClose={() => setShowPlanModal(false)} title={editingPlan ? 'Edit Plan' : 'Create Plan'}>
                <form onSubmit={handlePlanSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                        <input type="text" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                            <input type="number" step="0.01" min="0" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                            <input type="text" maxLength={3} value={planForm.currency} onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days) *</label>
                            <input type="number" min="1" value={planForm.duration_days} onChange={(e) => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Senders *</label>
                            <input type="number" min="1" value={planForm.max_senders} onChange={(e) => setPlanForm({ ...planForm, max_senders: parseInt(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Campaigns *</label>
                            <input type="number" min="1" value={planForm.max_total_campaigns} onChange={(e) => setPlanForm({ ...planForm, max_total_campaigns: parseInt(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Live Campaigns *</label>
                            <input type="number" min="1" value={planForm.max_live_campaigns} onChange={(e) => setPlanForm({ ...planForm, max_live_campaigns: parseInt(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Sending Limit *</label>
                            <input type="number" min="1" value={planForm.daily_sending_limit} onChange={(e) => setPlanForm({ ...planForm, daily_sending_limit: parseInt(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-7">
                                <input type="checkbox" checked={planForm.is_active} onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                Active
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                                placeholder="Add a feature..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                            <Button type="button" variant="secondary" onClick={addFeature}>Add</Button>
                        </div>
                        {planForm.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {planForm.features.map((f, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                        {f}
                                        <button type="button" onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-600">&times;</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setShowPlanModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={actionLoading}>{editingPlan ? 'Update Plan' : 'Create Plan'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

AdminBilling.layout = (page) => <AppLayout>{page}</AppLayout>;

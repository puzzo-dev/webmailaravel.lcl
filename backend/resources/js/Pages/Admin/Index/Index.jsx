import { useState, useEffect } from 'react';
import { HiUsers, HiMail, HiEye, HiCursorClick, HiServer, HiDatabase, HiClock, HiCog } from 'react-icons/hi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import MetricCard from '../../../Components/MetricCard';
import StatusBadge from '../../../Components/StatusBadge';
import EmptyState from '../../../Components/EmptyState';
import { useApi } from '../../../hooks/useApi';

export default function AdminDashboard({ auth }) {
    const { data: dashboardData, loading } = useApi('/api/admin/dashboard');
    const { data: systemStatus } = useApi('/api/admin/system-status');

    const stats = dashboardData?.data?.stats || dashboardData?.stats || {};
    const recentUsers = dashboardData?.data?.recent_users || dashboardData?.recent_users || [];
    const recentCampaigns = dashboardData?.data?.recent_campaigns || dashboardData?.recent_campaigns || [];
    const status = systemStatus?.data || systemStatus || {};

    const statCards = [
        { icon: HiUsers, label: 'Total Users', value: (stats.total_users || 0).toLocaleString(), color: 'indigo' },
        { icon: HiMail, label: 'Total Campaigns', value: (stats.total_campaigns || 0).toLocaleString(), color: 'blue' },
        { icon: HiEye, label: 'Total Opens', value: (stats.total_opens || 0).toLocaleString(), color: 'green' },
        { icon: HiCursorClick, label: 'Total Clicks', value: (stats.total_clicks || 0).toLocaleString(), color: 'purple' },
    ];

    const systemChecks = [
        { key: 'database', label: 'Database', icon: HiDatabase, data: status.database },
        { key: 'cache', label: 'Cache', icon: HiServer, data: status.cache },
        { key: 'queue', label: 'Queue', icon: HiClock, data: status.queue },
        { key: 'storage', label: 'Storage', icon: HiCog, data: status.storage },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">System overview and administration</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <MetricCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Recent Users">
                    <div className="p-5">
                        {recentUsers.length === 0 ? (
                            <EmptyState icon={HiUsers} title="No users yet" description="New users will appear here." />
                        ) : (
                            <div className="space-y-3">
                                {recentUsers.slice(0, 5).map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
                                                {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={user.role || 'user'} />
                                            <span className="text-xs text-gray-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Recent Campaigns">
                    <div className="p-5">
                        {recentCampaigns.length === 0 ? (
                            <EmptyState icon={HiMail} title="No campaigns yet" description="Recent campaigns will appear here." />
                        ) : (
                            <div className="space-y-3">
                                {recentCampaigns.slice(0, 5).map((campaign) => (
                                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                                            <p className="text-xs text-gray-400">{campaign.total_sent || 0} sent</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={campaign.status} />
                                            <span className="text-xs text-gray-400">{campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <Card title="System Status">
                <div className="p-5">
                    {loading && !status.database ? (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {systemChecks.map((check) => {
                                const Icon = check.icon;
                                const checkData = check.data || {};
                                const isOk = checkData.status === 'connected' || checkData.status === 'ok' || checkData.status === 'healthy';
                                return (
                                    <div key={check.key} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">{check.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${isOk ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-sm text-gray-600">{checkData.message || checkData.status || 'Unknown'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

AdminDashboard.layout = (page) => <AppLayout>{page}</AppLayout>;

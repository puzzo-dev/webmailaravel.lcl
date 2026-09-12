import { useState, useEffect } from 'react';
import { HiMail, HiEye, HiCursorClick, HiExclamationCircle, HiChartBar } from 'react-icons/hi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import MetricCard from '../../Components/MetricCard';
import EmptyState from '../../Components/EmptyState';
import { useApi } from '../../hooks/useApi';

export default function AnalyticsIndex({ auth }) {
    const [timeRange, setTimeRange] = useState('30d');
    const { data: analyticsData, loading } = useApi(`/api/analytics?timeRange=${timeRange}`);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    const data = analyticsData?.data || analyticsData || {};
    const summary = data.summary || {};
    const trending = data.trending || [];
    const dashboard = data.dashboard || {};

    const stats = [
        { icon: HiMail, label: 'Total Campaigns', value: (summary.total_campaigns || 0).toLocaleString(), color: 'indigo' },
        { icon: HiMail, label: 'Emails Sent', value: (summary.total_emails_sent || 0).toLocaleString(), color: 'blue' },
        { icon: HiEye, label: 'Total Opens', value: (summary.total_opens || 0).toLocaleString(), color: 'green' },
        { icon: HiCursorClick, label: 'Total Clicks', value: (summary.total_clicks || 0).toLocaleString(), color: 'purple' },
    ];

    // Format trending data for charts
    const chartData = trending.map((t) => ({
        date: t.date || t.label,
        sent: t.sent || t.emails_sent || 0,
        opens: t.opens || 0,
        clicks: t.clicks || 0,
    }));

    const deviceData = dashboard.device_breakdown || [];
    const deviceColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Track your email performance and engagement</p>
                </div>
                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500">
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <MetricCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Email Performance Trends" className="lg:col-span-2">
                    <div className="p-5">
                        {chartData.length === 0 ? (
                            <EmptyState icon={HiChartBar} title="No data available" description="Send campaigns to see performance trends." />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="opensGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="sent" stroke="#6366f1" fill="url(#sentGrad)" name="Sent" />
                                    <Area type="monotone" dataKey="opens" stroke="#10b981" fill="url(#opensGrad)" name="Opens" />
                                    <Area type="monotone" dataKey="clicks" stroke="#f59e0b" fill="url(#clicksGrad)" name="Clicks" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card title="Device Breakdown">
                    <div className="p-5">
                        {deviceData.length === 0 ? (
                            <EmptyState icon={HiChartBar} title="No data" description="Device data will appear here." />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {deviceData.map((_, i) => (
                                            <Cell key={i} fill={deviceColors[i % deviceColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            <Card title="Top Campaigns">
                <div className="p-5">
                    {(dashboard.top_campaigns || []).length === 0 ? (
                        <EmptyState icon={HiMail} title="No campaigns yet" description="Your best performing campaigns will appear here." />
                    ) : (
                        <div className="space-y-3">
                            {(dashboard.top_campaigns || []).map((campaign, i) => (
                                <div key={campaign.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-400">#{i + 1}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{campaign.name}</p>
                                            <p className="text-xs text-gray-400">{(campaign.total_sent || 0).toLocaleString()} sent</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">{campaign.opens || 0}</p>
                                            <p className="text-xs text-gray-400">Opens</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">{campaign.clicks || 0}</p>
                                            <p className="text-xs text-gray-400">Clicks</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">{campaign.open_rate ? campaign.open_rate.toFixed(1) : 0}%</p>
                                            <p className="text-xs text-gray-400">Open Rate</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

AnalyticsIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

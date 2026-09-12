import { Link } from '@inertiajs/react';
import {
    HiPaperAirplane, HiCheckCircle, HiClock, HiX, HiPlus,
    HiTrendingUp, HiTrendingDown, HiMail, HiEye, HiCursorClick,
    HiChartBar, HiExclamation, HiRefresh, HiInbox,
} from 'react-icons/hi';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, sublabel, trend, color }) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-700 border-blue-200',
        green: 'from-green-500 to-green-600 bg-green-50 text-green-700 border-green-200',
        purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-700 border-purple-200',
        red: 'from-red-500 to-red-600 bg-red-50 text-red-700 border-red-200',
    };
    const [gradient, bg] = colorClasses[color].split(' bg-');
    const [bgColor, textColor, borderColor] = bg.split(' ');

    return (
        <div className={`flex-1 min-w-[200px] ${bgColor} ${borderColor} border rounded-lg p-4`}>
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div className={`h-12 w-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
                <div className="ml-4">
                    <p className={`text-sm font-medium ${textColor}`}>{label}</p>
                    <p className={`text-3xl font-bold ${textColor.replace('700', '900')}`}>{value}</p>
                    {sublabel && (
                        <div className="flex items-center mt-1">
                            {trend === 'up' ? (
                                <HiTrendingUp className="h-3 w-3 mr-1" />
                            ) : trend === 'down' ? (
                                <HiTrendingDown className="h-3 w-3 mr-1" />
                            ) : null}
                            <span className="text-xs font-medium">{sublabel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ auth, stats, charts }) {
    const user = auth?.user;
    const s = stats || {};
    const c = charts || {};

    // Performance chart data
    const performanceData = (c.campaign_performance || []).length > 0
        ? c.campaign_performance.map(item => ({
            name: item.date,
            sent: item.sent || 0,
            delivered: item.delivered || 0,
            opened: item.opened || 0,
            clicked: item.clicked || 0,
        }))
        : Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return { name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), sent: 0, delivered: 0, opened: 0, clicked: 0 };
        });

    // Campaign status distribution
    const campaignStatusData = (c.campaign_status_distribution || []).length > 0
        ? c.campaign_status_distribution
        : [
            { name: 'Active', value: s.active_campaigns || 0, color: '#10b981' },
            { name: 'Completed', value: s.completed_campaigns || 0, color: '#6366f1' },
            { name: 'Failed', value: s.failed_campaigns || 0, color: '#ef4444' },
        ].filter(item => item.value > 0);

    const hasCampaigns = (s.total_campaigns || 0) > 0;

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
                        <p className="text-indigo-100 mt-1">
                            {hasCampaigns
                                ? `You have ${s.total_campaigns} campaign${s.total_campaigns !== 1 ? 's' : ''} total`
                                : "Ready to create your first campaign?"}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{s.total_campaigns || 0}</div>
                        <div className="text-indigo-100 text-sm">Total Campaigns</div>
                    </div>
                </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Link
                    href="/campaigns/new"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                    <HiPlus className="h-4 w-4 mr-2" />
                    New Campaign
                </Link>
                <Link
                    href="/campaigns"
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                    <HiInbox className="h-4 w-4 mr-2" />
                    View Campaigns
                </Link>
                <Link
                    href="/analytics"
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                    <HiChartBar className="h-4 w-4 mr-2" />
                    Analytics
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="flex flex-wrap gap-4">
                <StatCard icon={HiPaperAirplane} label="Total Campaigns" value={s.total_campaigns || 0} sublabel={`${s.weekly_created || 0} this week`} trend="up" color="blue" />
                <StatCard icon={HiCheckCircle} label="Active" value={s.active_campaigns || 0} sublabel="Running now" color="green" />
                <StatCard icon={HiClock} label="Completed" value={s.completed_campaigns || 0} sublabel="Finished" color="purple" />
                <StatCard icon={HiX} label="Failed" value={s.failed_campaigns || 0} sublabel="Need attention" trend="down" color="red" />
            </div>

            {/* Email Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <div className="flex items-center">
                        <HiMail className="h-8 w-8 text-indigo-500" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-500">Emails Sent</p>
                            <p className="text-2xl font-bold text-gray-900">{s.emails_sent || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <div className="flex items-center">
                        <HiCheckCircle className="h-8 w-8 text-green-500" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-500">Delivered</p>
                            <p className="text-2xl font-bold text-gray-900">{s.emails_delivered || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <div className="flex items-center">
                        <HiEye className="h-8 w-8 text-blue-500" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-500">Opens</p>
                            <p className="text-2xl font-bold text-gray-900">{s.opens || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <div className="flex items-center">
                        <HiCursorClick className="h-8 w-8 text-purple-500" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-500">Clicks</p>
                            <p className="text-2xl font-bold text-gray-900">{s.clicks || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trends */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Email Performance Trends</h3>
                            <p className="text-sm text-gray-500">Last 7 days</p>
                        </div>
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <HiChartBar className="h-5 w-5 text-indigo-600" />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={performanceData}>
                            <defs>
                                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="sent" stroke="#6366f1" fill="url(#colorSent)" strokeWidth={2} name="Sent" />
                            <Area type="monotone" dataKey="opened" stroke="#10b981" fill="url(#colorOpened)" strokeWidth={2} name="Opened" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Campaign Status Distribution */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Campaign Status</h3>
                            <p className="text-sm text-gray-500">Distribution overview</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <HiMail className="h-5 w-5 text-green-600" />
                        </div>
                    </div>
                    {campaignStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={campaignStatusData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={100}
                                    paddingAngle={5} dataKey="value"
                                >
                                    {campaignStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <HiMail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No campaigns yet</p>
                                <Link href="/campaigns/new" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                                    <HiPlus className="h-4 w-4 mr-2" /> Create Campaign
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Campaigns */}
            {s.recent_campaigns && s.recent_campaigns.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
                        <Link href="/campaigns" className="text-sm text-indigo-600 hover:text-indigo-800">
                            View all →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicked</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {s.recent_campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            <Link href={`/campaigns/${campaign.id}`} className="text-indigo-600 hover:text-indigo-800">
                                                {campaign.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                campaign.status === 'running' ? 'bg-green-100 text-green-800' :
                                                campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{campaign.emails_sent || 0}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{campaign.opens || 0}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{campaign.clicks || 0}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(campaign.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

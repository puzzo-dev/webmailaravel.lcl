import { useState } from 'react';
import {
    HiServer, HiChartBar, HiShieldCheck, HiExclamation, HiCheckCircle,
    HiRefresh, HiCalendar, HiUsers, HiMail, HiSearch, HiTrendingUp,
    HiLightBulb, HiCog, HiClock, HiDatabase, HiXCircle, HiGlobe,
} from 'react-icons/hi';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar,
    AreaChart, Area, Cell,
} from 'recharts';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import EmptyState from '../../../Components/EmptyState';
import MetricCard from '../../../Components/MetricCard';
import Button from '../../../Components/Button';
import { useApi } from '../../../hooks/useApi';
import axios from 'axios';

const apiClient = axios.create({ withCredentials: true });

export default function AdminPowerMTA({ auth }) {
    const [activeTab, setActiveTab] = useState('daily');
    const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);
    const [trendDays, setTrendDays] = useState(7);
    const [scanLoading, setScanLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [selectedSenderId, setSelectedSenderId] = useState(null);

    // Real-time PMTA management API data
    // Engine status (host-wide, NOT campaign-scoped — for the Engine Status tab only)
    const { data: statusData, loading: statusLoading, refetch: refetchStatus } = useApi('/api/admin/powermta/status');

    // File-based monitoring data
    const { data: overviewData } = useApi('/api/admin/powermta/overview');
    const { data: dailyData, loading: dailyLoading } = useApi(`/api/admin/powermta/daily-summary?date=${analysisDate}`);
    const { data: campaignRatesData, loading: campaignLoading } = useApi(`/api/admin/powermta/delivery-rate/campaign?date=${analysisDate}`);
    const { data: userRatesData, loading: userLoading } = useApi(`/api/admin/powermta/delivery-rate/user?date=${analysisDate}`);
    const { data: reputationByUserData, loading: repLoading } = useApi(`/api/admin/powermta/reputation/by-user?date=${analysisDate}`);

    // All senders health + trend (auto-loaded for charts)
    const { data: allSendersHealthData, loading: allSendersLoading } = useApi(
        `/api/admin/powermta/all-senders-health?date=${analysisDate}&days=${trendDays}`
    );

    const status = statusData?.data || statusData || {};
    const overview = overviewData?.data || overviewData || {};
    const dailySummary = dailyData?.data || dailyData || {};
    const campaignRates = campaignRatesData?.data || campaignRatesData || {};
    const userRates = userRatesData?.data || userRatesData || {};
    const reputationByUser = reputationByUserData?.data || reputationByUserData || {};
    const allSendersHealth = allSendersHealthData?.data || allSendersHealthData || {};
    const allSenders = allSendersHealth.senders || [];
    const selectedSender = allSenders.find((s) => s.id === selectedSenderId) || allSenders[0] || null;

    const formatNum = (val) => {
        if (val === null || val === undefined) return '—';
        if (typeof val === 'number') return val.toLocaleString();
        const num = parseFloat(val);
        return isNaN(num) ? String(val) : num.toLocaleString();
    };

    const formatPercent = (val, decimals = 2) => {
        if (val === null || val === undefined) return '—';
        const num = typeof val === 'number' ? val : parseFloat(val);
        return isNaN(num) ? '—' : `${num.toFixed(decimals)}%`;
    };

    const formatBytes = (kb) => {
        if (!kb) return '—';
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
        return `${(kb / 1024 / 1024).toFixed(1)} GB`;
    };

    const getHealthColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-blue-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const getRateBadge = (rate) => {
        const num = typeof rate === 'number' ? rate : parseFloat(rate) || 0;
        if (num >= 95) return 'bg-green-100 text-green-700';
        if (num >= 80) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    const handleScan = async () => {
        setScanLoading(true);
        setScanResult(null);
        try {
            const res = await apiClient.post('/api/admin/powermta/scan');
            setScanResult(res.data?.data || res.data);
        } catch (err) {
            setScanResult({ success: false, error: err.response?.data?.message || 'Scan failed' });
        } finally {
            setScanLoading(false);
        }
    };

    const tabs = [
        { key: 'daily', label: 'Daily Summary', icon: HiCalendar },
        { key: 'campaigns', label: 'By Campaign', icon: HiMail },
        { key: 'users', label: 'By User', icon: HiUsers },
        { key: 'reputation', label: 'Reputation', icon: HiShieldCheck },
        { key: 'sender', label: 'Sender Analysis', icon: HiSearch },
        { key: 'engine', label: 'Engine Status', icon: HiServer },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">PowerMTA Monitoring</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Campaign-scoped monitoring via PMTA accounting files (X-User-ID filtered)
                        {status.hostname && ` — Engine: ${status.hostname}`}
                        {status.version && ` (v${status.version})`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={analysisDate}
                        onChange={(e) => setAnalysisDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <Button variant="secondary" size="sm" onClick={() => refetchStatus()} disabled={statusLoading}>
                        <HiRefresh className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleScan} disabled={scanLoading}>
                        <HiRefresh className={`h-4 w-4 ${scanLoading ? 'animate-spin' : ''}`} />
                        {scanLoading ? 'Scanning...' : 'Scan Files'}
                    </Button>
                </div>
            </div>

            {/* Scan Result */}
            {scanResult && (
                <div className={`p-4 rounded-lg border ${scanResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                        {scanResult.success ? (
                            <HiCheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                            <HiXCircle className="h-5 w-5 text-red-600" />
                        )}
                        <p className={`text-sm font-medium ${scanResult.success ? 'text-green-700' : 'text-red-700'}`}>
                            {scanResult.message || scanResult.error}
                        </p>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex gap-1 -mb-px">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Engine Status Tab — host-wide PMTA info, NOT campaign-scoped */}
            {activeTab === 'engine' && (
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                        <HiExclamation className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Host-wide PMTA engine status</p>
                            <p className="text-xs text-blue-700 mt-1">
                                These metrics reflect ALL traffic on the shared PMTA engine — including emails from other projects.
                                Campaign-scoped analytics are on the other tabs (Daily Summary, By Campaign, By User, Reputation, Sender Analysis)
                                and are filtered by X-User-ID headers to show only this project's emails.
                            </p>
                        </div>
                    </div>

                    {statusLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : status.status === 'offline' || status.status === 'error' ? (
                        <div className="p-4 bg-red-50 rounded-lg flex items-center gap-2">
                            <HiXCircle className="h-5 w-5 text-red-500" />
                            <p className="text-sm text-red-700">{status.message || 'PMTA management API not reachable'}</p>
                        </div>
                    ) : (
                        <>
                            {/* Engine status row */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <MetricCard icon={HiServer} label="Engine Status" value={status.status || 'Unknown'} color={status.status === 'running' ? 'green' : 'red'} />
                                <MetricCard icon={HiClock} label="Uptime" value={status.uptime || 'N/A'} color="blue" />
                                <MetricCard icon={HiServer} label="Connections" value={`${status.active_connections || 0}/${status.max_connections || 0}`} color="indigo" />
                                <MetricCard icon={HiDatabase} label="Spool Files" value={`${status.spool_files_in_use || 0}/${status.spool_files_total || 0}`} color="purple" />
                            </div>

                            {/* Server info */}
                            <Card title="Engine Information">
                                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500">Hostname</p>
                                        <p className="font-medium text-gray-900">{status.hostname || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Version</p>
                                        <p className="font-medium text-gray-900">{status.version || '—'} ({status.variant || '—'})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">OS</p>
                                        <p className="font-medium text-gray-900">{status.os || '—'} {status.os_version || ''}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">CPU / RAM</p>
                                        <p className="font-medium text-gray-900">{status.cpu_count || 0} CPU / {formatBytes((status.ram || 0) / 1024)}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Host-wide traffic — labeled as NOT campaign-scoped */}
                            <Card title="Host-Wide Traffic (All Projects)">
                                <div className="p-5 space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Total Sent (msgs)</span><span className="font-medium">{formatNum(status.messages_sent_today)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Last Hour</span><span className="font-medium">{formatNum(status.last_hr_sent)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Last Minute</span><span className="font-medium">{formatNum(status.last_min_sent)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Bounces Processed</span><span className="font-medium text-red-600">{formatNum(status.bounce_processed)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">FBL Processed</span><span className="font-medium text-orange-600">{formatNum(status.fbl_processed)}</span></div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            )}

            {/* Daily Summary Tab */}
            {activeTab === 'daily' && (
                <div className="space-y-6">
                    {dailyLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : dailySummary.error ? (
                        <div className="p-4 bg-yellow-50 rounded-lg flex items-center gap-2">
                            <HiExclamation className="h-5 w-5 text-yellow-500" />
                            <p className="text-sm text-yellow-700">{dailySummary.error} — Enable PMTA file monitoring in System Settings to collect accounting data.</p>
                        </div>
                    ) : !overview.enabled ? (
                        <EmptyState icon={HiCalendar} title="File Monitoring Not Enabled" description="Enable PMTA file monitoring in Admin → System Settings to collect daily accounting data." />
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MetricCard icon={HiMail} label="Total Sent" value={formatNum(dailySummary.total_sent)} color="blue" />
                                <MetricCard icon={HiCheckCircle} label="Delivered" value={formatNum(dailySummary.delivered)} color="green" />
                                <MetricCard icon={HiXCircle} label="Bounced" value={formatNum(dailySummary.bounced)} color="red" />
                                <MetricCard icon={HiExclamation} label="Complaints" value={formatNum(dailySummary.complaints)} color="orange" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <MetricCard icon={HiTrendingUp} label="Delivery Rate" value={formatPercent(dailySummary.delivery_rate)} color="green" />
                                <MetricCard icon={HiChartBar} label="Bounce Rate" value={formatPercent(dailySummary.bounce_rate)} color="red" />
                                <MetricCard icon={HiShieldCheck} label="Complaint Rate" value={formatPercent(dailySummary.complaint_rate, 4)} color="orange" />
                            </div>
                            {dailySummary.total_sent === 0 && (
                                <EmptyState icon={HiCalendar} title="No Data for This Date" description={`No PMTA accounting data found for ${analysisDate}.`} />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* By Campaign Tab */}
            {activeTab === 'campaigns' && (
                <Card title={`Delivery Rate by Campaign (${analysisDate})`}>
                    <div className="overflow-x-auto">
                        {campaignLoading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                        ) : !campaignRates.campaigns || campaignRates.campaigns.length === 0 ? (
                            <EmptyState icon={HiMail} title="No Campaign Data" description="No PMTA accounting data found for campaigns on this date. Enable file monitoring in System Settings." />
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivered</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bounced</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivery Rate</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bounce Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {campaignRates.campaigns.map((c, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">{c.campaign_name || c.campaign_id || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatNum(c.total_sent)}</td>
                                            <td className="px-4 py-3 text-sm text-green-600 text-right">{formatNum(c.delivered)}</td>
                                            <td className="px-4 py-3 text-sm text-red-600 text-right">{formatNum(c.bounced)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRateBadge(c.delivery_rate)}`}>{formatPercent(c.delivery_rate)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatPercent(c.bounce_rate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            )}

            {/* By User Tab */}
            {activeTab === 'users' && (
                <Card title={`Delivery Rate by User (${analysisDate})`}>
                    <div className="overflow-x-auto">
                        {userLoading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                        ) : !userRates.users || userRates.users.length === 0 ? (
                            <EmptyState icon={HiUsers} title="No User Data" description="No PMTA accounting data found for users on this date. Enable file monitoring in System Settings." />
                        ) : (
                            <>
                                <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                                    <p className="text-sm text-indigo-700">Average Delivery Rate: <span className="font-semibold">{formatPercent(userRates.avg_delivery_rate)}</span> across {userRates.total_users} user(s)</p>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivered</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bounced</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Campaigns</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Senders</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivery Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {userRates.users.map((u, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{u.username || u.user_id || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatNum(u.total_sent)}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 text-right">{formatNum(u.delivered)}</td>
                                                <td className="px-4 py-3 text-sm text-red-600 text-right">{formatNum(u.bounced)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 text-right">{u.unique_campaigns || 0}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 text-right">{u.unique_senders || 0}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRateBadge(u.delivery_rate)}`}>{formatPercent(u.delivery_rate)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </Card>
            )}

            {/* Reputation Tab */}
            {activeTab === 'reputation' && (
                <div className="space-y-6">
                    {repLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : !reputationByUser.users || reputationByUser.users.length === 0 ? (
                        <EmptyState icon={HiShieldCheck} title="No Reputation Data" description="No sender reputation data found. Enable file monitoring in System Settings." />
                    ) : (
                        reputationByUser.users.map((userData, idx) => (
                            <Card key={idx} title={`User: ${userData.username || userData.user_id}`}>
                                <div className="p-5 space-y-4">
                                    {userData.senders && userData.senders.map((sender, i) => (
                                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{sender.sender_email}</p>
                                                    <p className="text-xs text-gray-500">Sent: {formatNum(sender.total_sent)} | Delivered: {formatNum(sender.delivered)} | Bounced: {formatNum(sender.bounced)} | Complaints: {formatNum(sender.complaints)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-2xl font-bold ${getHealthColor(sender.health_score)}`}>{(sender.health_score || 0).toFixed(1)}</p>
                                                    <p className="text-xs text-gray-500">Health Score</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div className="p-2 bg-gray-50 rounded text-center"><p className="text-gray-500">Delivery Rate</p><p className="font-medium text-green-600">{formatPercent(sender.delivery_rate)}</p></div>
                                                <div className="p-2 bg-gray-50 rounded text-center"><p className="text-gray-500">Bounce Rate</p><p className="font-medium text-red-600">{formatPercent(sender.bounce_rate)}</p></div>
                                                <div className="p-2 bg-gray-50 rounded text-center"><p className="text-gray-500">Complaint Rate</p><p className="font-medium text-orange-600">{formatPercent(sender.complaint_rate, 4)}</p></div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!userData.senders || userData.senders.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No sender data for this user.</p>}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Sender Analysis Tab — auto-loaded charts */}
            {activeTab === 'sender' && (
                <div className="space-y-6">
                    {allSendersLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : !allSenders || allSenders.length === 0 ? (
                        <EmptyState
                            icon={HiSearch}
                            title="No Senders Found"
                            description="No senders are configured. Add senders to see health and trend analysis."
                        />
                    ) : !overview.enabled ? (
                        <EmptyState
                            icon={HiCog}
                            title="File Monitoring Not Enabled"
                            description="Enable PMTA file monitoring in Admin → System Settings to collect accounting data for health analysis."
                        />
                    ) : (
                        <>
                            {/* Sender selector + trend period */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700">Sender:</label>
                                    <select
                                        value={selectedSenderId || ''}
                                        onChange={(e) => setSelectedSenderId(parseInt(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {allSenders.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.email} {s.banned ? '(Banned)' : ''} — Health: {(s.health_score || 0).toFixed(0)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700">Trend Period:</label>
                                    <select
                                        value={trendDays}
                                        onChange={(e) => setTrendDays(parseInt(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value={7}>Last 7 days</option>
                                        <option value={14}>Last 14 days</option>
                                        <option value={30}>Last 30 days</option>
                                        <option value={60}>Last 60 days</option>
                                        <option value={90}>Last 90 days</option>
                                    </select>
                                </div>
                            </div>

                            {/* All senders health overview bar chart */}
                            <Card title="Health Score — All Senders">
                                <div className="p-5">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={allSenders.map((s) => ({
                                            email: s.email.length > 20 ? s.email.substring(0, 20) + '...' : s.email,
                                            health: Math.round((s.health_score || 0) * 10) / 10,
                                            sent: s.total_sent || 0,
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="email" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={70} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                                                            <p className="text-sm font-medium text-gray-900">{data.email}</p>
                                                            <p className="text-xs text-gray-500">Health: {data.health}%</p>
                                                            <p className="text-xs text-gray-500">Sent: {data.sent}</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Bar dataKey="health" name="Health Score" radius={[4, 4, 0, 0]}>
                                                {allSenders.map((s, i) => (
                                                    <Cell key={i} fill={
                                                        (s.health_score || 0) >= 90 ? '#16a34a' :
                                                        (s.health_score || 0) >= 75 ? '#2563eb' :
                                                        (s.health_score || 0) >= 60 ? '#ca8a04' :
                                                        (s.health_score || 0) >= 40 ? '#ea580c' :
                                                        '#dc2626'
                                                    } />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Selected sender detailed charts */}
                            {selectedSender && (
                                <>
                                    {/* Health score gauge + summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card title="Health Score">
                                            <div className="p-5 flex flex-col items-center">
                                                <div className="relative w-40 h-40">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadialBarChart
                                                            innerRadius="70%"
                                                            outerRadius="100%"
                                                            data={[{ value: selectedSender.health_score || 0, fill:
                                                                (selectedSender.health_score || 0) >= 90 ? '#16a34a' :
                                                                (selectedSender.health_score || 0) >= 75 ? '#2563eb' :
                                                                (selectedSender.health_score || 0) >= 60 ? '#ca8a04' :
                                                                (selectedSender.health_score || 0) >= 40 ? '#ea580c' :
                                                                '#dc2626'
                                                            }]}
                                                            startAngle={90}
                                                            endAngle={-270}
                                                        >
                                                            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f3f4f6' }} />
                                                        </RadialBarChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                        <span className={`text-3xl font-bold ${getHealthColor(selectedSender.health_score || 0)}`}>
                                                            {(selectedSender.health_score || 0).toFixed(1)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">/ 100</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                                        selectedSender.trend === 'improving' ? 'bg-green-100 text-green-700' :
                                                        selectedSender.trend === 'declining' ? 'bg-red-100 text-red-700' :
                                                        selectedSender.trend === 'stable' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {selectedSender.trend === 'improving' ? 'Improving' :
                                                         selectedSender.trend === 'declining' ? 'Declining' :
                                                         selectedSender.trend === 'stable' ? 'Stable' : 'No Data'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card title="Delivery Metrics">
                                            <div className="p-5 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                        <p className="text-2xl font-bold text-blue-600">{formatNum(selectedSender.total_sent)}</p>
                                                        <p className="text-xs text-gray-500">Total Sent</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                                        <p className="text-2xl font-bold text-green-600">{formatNum(selectedSender.delivered)}</p>
                                                        <p className="text-xs text-gray-500">Delivered</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                                        <p className="text-2xl font-bold text-red-600">{formatNum(selectedSender.bounced)}</p>
                                                        <p className="text-xs text-gray-500">Bounced</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                        <p className="text-2xl font-bold text-orange-600">{formatNum(selectedSender.complaints)}</p>
                                                        <p className="text-xs text-gray-500">Complaints</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card title="Rate Breakdown">
                                            <div className="p-5 space-y-3">
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-500">Delivery Rate</span>
                                                        <span className="font-medium text-green-600">{formatPercent(selectedSender.delivery_rate)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(selectedSender.delivery_rate || 0, 100)}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-500">Bounce Rate</span>
                                                        <span className="font-medium text-red-600">{formatPercent(selectedSender.bounce_rate)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(selectedSender.bounce_rate || 0, 100)}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-500">Complaint Rate</span>
                                                        <span className="font-medium text-orange-600">{formatPercent(selectedSender.complaint_rate, 4)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((selectedSender.complaint_rate || 0) * 10, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Trend line chart — delivery rate + bounce rate over time */}
                                    {selectedSender.daily_stats && selectedSender.daily_stats.length > 0 ? (
                                        <Card title={`Trend — Last ${trendDays} Days (${selectedSender.email})`}>
                                            <div className="p-5">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={selectedSender.daily_stats.map((d) => ({
                                                        date: d.date?.substring(5) || '',
                                                        delivery: Math.round((d.delivery_rate || 0) * 100) / 100,
                                                        bounce: Math.round((d.bounce_rate || 0) * 100) / 100,
                                                        health: Math.round((d.health_score || 0) * 100) / 100,
                                                        sent: d.total_sent || 0,
                                                    }))}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
                                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                                                        <Tooltip
                                                            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                        />
                                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                                        <Line yAxisId="left" type="monotone" dataKey="delivery" stroke="#16a34a" strokeWidth={2} name="Delivery Rate %" dot={{ r: 3 }} />
                                                        <Line yAxisId="left" type="monotone" dataKey="bounce" stroke="#dc2626" strokeWidth={2} name="Bounce Rate %" dot={{ r: 3 }} />
                                                        <Line yAxisId="left" type="monotone" dataKey="health" stroke="#2563eb" strokeWidth={2} name="Health Score" dot={{ r: 3 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>
                                    ) : (
                                        <Card title={`Trend — Last ${trendDays} Days`}>
                                            <div className="p-5">
                                                <EmptyState
                                                    icon={HiTrendingUp}
                                                    title="No Trend Data"
                                                    description="No accounting data found for this sender in the selected period."
                                                />
                                            </div>
                                        </Card>
                                    )}

                                    {/* Daily volume bar chart */}
                                    {selectedSender.daily_stats && selectedSender.daily_stats.length > 0 && (
                                        <Card title="Daily Volume">
                                            <div className="p-5">
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={selectedSender.daily_stats.map((d) => ({
                                                        date: d.date?.substring(5) || '',
                                                        sent: d.total_sent || 0,
                                                        delivered: d.delivered || 0,
                                                        bounced: d.bounced || 0,
                                                    }))}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                        <YAxis tick={{ fontSize: 11 }} />
                                                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                                        <Bar dataKey="sent" fill="#3b82f6" name="Sent" radius={[2, 2, 0, 0]} />
                                                        <Bar dataKey="delivered" fill="#16a34a" name="Delivered" radius={[2, 2, 0, 0]} />
                                                        <Bar dataKey="bounced" fill="#dc2626" name="Bounced" radius={[2, 2, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>
                                    )}

                                    {/* Recommendations */}
                                    {selectedSender.recommendations && selectedSender.recommendations.length > 0 && (
                                        <Card title="Recommendations">
                                            <div className="p-5 space-y-2">
                                                {selectedSender.recommendations.map((rec, i) => {
                                                    const isCritical = rec.includes('Critical');
                                                    const isWarning = rec.includes('Warning');
                                                    const isExcellent = rec.includes('Excellent');
                                                    return (
                                                        <div key={i} className={`p-3 rounded-lg flex items-start gap-2 ${
                                                            isCritical ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : isExcellent ? 'bg-green-50' : 'bg-blue-50'
                                                        }`}>
                                                            {isCritical ? <HiExclamation className="h-5 w-5 text-red-500 flex-shrink-0" /> :
                                                             isWarning ? <HiExclamation className="h-5 w-5 text-yellow-500 flex-shrink-0" /> :
                                                             isExcellent ? <HiCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /> :
                                                             <HiLightBulb className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                                                            <p className={`text-sm ${
                                                                isCritical ? 'text-red-700' : isWarning ? 'text-yellow-700' : isExcellent ? 'text-green-700' : 'text-blue-700'
                                                            }`}>{rec}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

AdminPowerMTA.layout = (page) => <AppLayout>{page}</AppLayout>;

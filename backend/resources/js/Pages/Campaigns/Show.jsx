import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { HiArrowLeft, HiPlay, HiPause, HiStop, HiDuplicate, HiTrash, HiMail, HiEye, HiCursorClick, HiExclamationCircle } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import StatusBadge from '../../Components/StatusBadge';
import MetricCard from '../../Components/MetricCard';
import EmptyState from '../../Components/EmptyState';

export default function CampaignsShow({ campaign, auth }) {
    const [tab, setTab] = useState('overview');
    const [actionLoading, setActionLoading] = useState(false);

    const handleAction = async (action) => {
        setActionLoading(true);
        try {
            await axios.post(`/api/campaigns/${campaign.id}/${action}`);
            router.reload({ preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} campaign`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        setActionLoading(true);
        try {
            await axios.delete(`/api/campaigns/${campaign.id}`);
            router.visit('/campaigns');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete campaign');
        } finally {
            setActionLoading(false);
        }
    };

    const stats = [
        { icon: HiMail, label: 'Total Sent', value: (campaign.total_sent || 0).toLocaleString(), color: 'indigo' },
        { icon: HiEye, label: 'Opens', value: (campaign.opens || 0).toLocaleString(), color: 'green' },
        { icon: HiCursorClick, label: 'Clicks', value: (campaign.clicks || 0).toLocaleString(), color: 'blue' },
        { icon: HiExclamationCircle, label: 'Bounces', value: (campaign.bounces || 0).toLocaleString(), color: 'red' },
    ];

    const tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'content', label: 'Content' },
        { key: 'recipients', label: 'Recipients' },
        { key: 'settings', label: 'Settings' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/campaigns" className="text-gray-500 hover:text-gray-700">
                        <HiArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                            <StatusBadge status={campaign.status} />
                        </div>
                        {campaign.subject && <p className="text-sm text-gray-500 mt-1">{campaign.subject}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {campaign.status === 'paused' && (
                        <Button size="sm" variant="success" onClick={() => handleAction('resume')} disabled={actionLoading}>
                            <HiPlay className="h-4 w-4" /> Resume
                        </Button>
                    )}
                    {campaign.status === 'running' && (
                        <Button size="sm" variant="secondary" onClick={() => handleAction('pause')} disabled={actionLoading}>
                            <HiPause className="h-4 w-4" /> Pause
                        </Button>
                    )}
                    {['running', 'paused', 'scheduled'].includes(campaign.status) && (
                        <Button size="sm" variant="danger" onClick={() => handleAction('stop')} disabled={actionLoading}>
                            <HiStop className="h-4 w-4" /> Stop
                        </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => router.post(`/api/campaigns/${campaign.id}/duplicate`)} disabled={actionLoading}>
                        <HiDuplicate className="h-4 w-4" /> Duplicate
                    </Button>
                    {['draft', 'completed', 'failed', 'cancelled'].includes(campaign.status) && (
                        <Button size="sm" variant="danger" onClick={handleDelete} disabled={actionLoading}>
                            <HiTrash className="h-4 w-4" /> Delete
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <MetricCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
                ))}
            </div>

            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                tab === t.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Campaign Details">
                        <dl className="divide-y divide-gray-200">
                            <div className="px-5 py-3 flex justify-between">
                                <dt className="text-sm text-gray-500">Status</dt>
                                <dd><StatusBadge status={campaign.status} /></dd>
                            </div>
                            <div className="px-5 py-3 flex justify-between">
                                <dt className="text-sm text-gray-500">Sender(s)</dt>
                                <dd className="text-sm text-gray-900">
                                    {campaign.senders && campaign.senders.length > 0
                                        ? campaign.senders.map((s) => s.email || s.name).join(', ')
                                        : campaign.sender?.email || campaign.sender?.name || '—'}
                                </dd>
                            </div>
                            <div className="px-5 py-3 flex justify-between">
                                <dt className="text-sm text-gray-500">Recipients</dt>
                                <dd className="text-sm text-gray-900">{(campaign.recipient_count || 0).toLocaleString()}</dd>
                            </div>
                            <div className="px-5 py-3 flex justify-between">
                                <dt className="text-sm text-gray-500">Created</dt>
                                <dd className="text-sm text-gray-900">{new Date(campaign.created_at).toLocaleString()}</dd>
                            </div>
                            {campaign.started_at && (
                                <div className="px-5 py-3 flex justify-between">
                                    <dt className="text-sm text-gray-500">Started</dt>
                                    <dd className="text-sm text-gray-900">{new Date(campaign.started_at).toLocaleString()}</dd>
                                </div>
                            )}
                            {campaign.completed_at && (
                                <div className="px-5 py-3 flex justify-between">
                                    <dt className="text-sm text-gray-500">Completed</dt>
                                    <dd className="text-sm text-gray-900">{new Date(campaign.completed_at).toLocaleString()}</dd>
                                </div>
                            )}
                        </dl>
                    </Card>

                    <Card title="Performance">
                        <div className="p-5 space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Open Rate</span>
                                    <span className="font-medium text-gray-900">
                                        {campaign.total_sent > 0 ? ((campaign.opens / campaign.total_sent) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${campaign.total_sent > 0 ? (campaign.opens / campaign.total_sent) * 100 : 0}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Click Rate</span>
                                    <span className="font-medium text-gray-900">
                                        {campaign.total_sent > 0 ? ((campaign.clicks / campaign.total_sent) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${campaign.total_sent > 0 ? (campaign.clicks / campaign.total_sent) * 100 : 0}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Bounce Rate</span>
                                    <span className="font-medium text-gray-900">
                                        {campaign.total_sent > 0 ? ((campaign.bounces / campaign.total_sent) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${campaign.total_sent > 0 ? (campaign.bounces / campaign.total_sent) * 100 : 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {tab === 'content' && (
                <Card title="Email Content">
                    <div className="p-5">
                        <p className="text-sm text-gray-500 mb-2">Subject: <span className="font-medium text-gray-900">{campaign.subject || '—'}</span></p>
                        {campaign.enable_content_switching && (
                            <p className="text-xs text-indigo-600 mb-3">A/B content switching enabled — {campaign.contents?.length || 0} variation(s)</p>
                        )}
                        {campaign.contents && campaign.contents.length > 0 ? (
                            <div className="space-y-4">
                                {campaign.contents.map((content, i) => (
                                    <div key={content.id || i} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="text-xs text-gray-400 mb-2">Variation {i + 1}: {content.name || 'Untitled'}</p>
                                        <p className="text-sm text-gray-500 mb-2">Subject: {content.subject || '—'}</p>
                                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.html_body || content.body || '' }} />
                                    </div>
                                ))}
                            </div>
                        ) : campaign.email_content ? (
                            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: campaign.email_content }} />
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No content available</p>
                        )}
                    </div>
                </Card>
            )}

            {tab === 'recipients' && (
                <Card title="Recipient Information">
                    <div className="p-5">
                        <dl className="grid grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm text-gray-500">Total Recipients</dt>
                                <dd className="text-lg font-medium text-gray-900">{(campaign.recipient_count || 0).toLocaleString()}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Sent</dt>
                                <dd className="text-lg font-medium text-gray-900">{(campaign.total_sent || 0).toLocaleString()}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Delivered</dt>
                                <dd className="text-lg font-medium text-gray-900">{((campaign.total_sent || 0) - (campaign.bounces || 0)).toLocaleString()}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Recipient File</dt>
                                <dd className="text-sm text-gray-900">{campaign.recipient_list_path ? campaign.recipient_list_path.split('/').pop() : '—'}</dd>
                            </div>
                        </dl>
                    </div>
                </Card>
            )}

            {tab === 'settings' && (
                <Card title="Campaign Settings">
                    <div className="p-5 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Open Tracking</span>
                            <span className="text-sm">{campaign.enable_open_tracking ? '✅ Enabled' : '❌ Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Click Tracking</span>
                            <span className="text-sm">{campaign.enable_click_tracking ? '✅ Enabled' : '❌ Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Unsubscribe Link</span>
                            <span className="text-sm">{campaign.enable_unsubscribe_link ? '✅ Enabled' : '❌ Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Content Switching</span>
                            <span className="text-sm">{campaign.enable_content_switching ? '✅ Enabled' : '❌ Disabled'}</span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

CampaignsShow.layout = (page) => <AppLayout>{page}</AppLayout>;

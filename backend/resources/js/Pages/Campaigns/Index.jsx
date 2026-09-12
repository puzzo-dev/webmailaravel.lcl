import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { HiPlus, HiSearch, HiPlay, HiPause, HiStop, HiDuplicate, HiTrash, HiEye } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import StatusBadge from '../../Components/StatusBadge';
import DataTable from '../../Components/DataTable';
import EmptyState from '../../Components/EmptyState';
import Pagination from '../../Components/Pagination';

export default function CampaignsIndex({ campaigns, auth }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const filteredData = (campaigns?.data || []).filter((c) => {
        const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.subject?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleAction = async (action, id) => {
        setActionLoading(`${action}-${id}`);
        try {
            await axios.post(`/api/campaigns/${id}/${action}`);
            router.reload({ preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} campaign`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        setActionLoading(`delete-${id}`);
        try {
            await axios.delete(`/api/campaigns/${id}`);
            router.reload({ preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete campaign');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDuplicate = async (id) => {
        setActionLoading(`duplicate-${id}`);
        try {
            await axios.post(`/api/campaigns/${id}/duplicate`);
            router.reload({ preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to duplicate campaign');
        } finally {
            setActionLoading(null);
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Campaign',
            sortable: true,
            render: (row) => (
                <div>
                    <Link href={`/campaigns/${row.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                        {row.name}
                    </Link>
                    {row.subject && <p className="text-xs text-gray-400 mt-0.5">{row.subject}</p>}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'sender',
            label: 'Sender(s)',
            render: (row) => {
                if (row.senders && row.senders.length > 0) {
                    return row.senders.length === 1
                        ? (row.senders[0].email || row.senders[0].name)
                        : `${row.senders.length} senders`;
                }
                return row.sender?.email || row.sender?.name || <span className="text-gray-400">—</span>;
            },
        },
        {
            key: 'total_sent',
            label: 'Sent',
            sortable: true,
            render: (row) => (row.total_sent || 0).toLocaleString(),
        },
        {
            key: 'opens',
            label: 'Opens',
            render: (row) => (row.opens || 0).toLocaleString(),
        },
        {
            key: 'clicks',
            label: 'Clicks',
            render: (row) => (row.clicks || 0).toLocaleString(),
        },
        {
            key: 'created_at',
            label: 'Created',
            sortable: true,
            render: (row) => new Date(row.created_at).toLocaleDateString(),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/campaigns/${row.id}`} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded" title="View">
                        <HiEye className="h-4 w-4" />
                    </Link>
                    {row.status === 'paused' && (
                        <button onClick={() => handleAction('resume', row.id)} disabled={actionLoading === `resume-${row.id}`} className="p-1.5 text-gray-500 hover:text-green-600 rounded" title="Resume">
                            <HiPlay className="h-4 w-4" />
                        </button>
                    )}
                    {row.status === 'running' && (
                        <button onClick={() => handleAction('pause', row.id)} disabled={actionLoading === `pause-${row.id}`} className="p-1.5 text-gray-500 hover:text-yellow-600 rounded" title="Pause">
                            <HiPause className="h-4 w-4" />
                        </button>
                    )}
                    {['running', 'paused', 'scheduled'].includes(row.status) && (
                        <button onClick={() => handleAction('stop', row.id)} disabled={actionLoading === `stop-${row.id}`} className="p-1.5 text-gray-500 hover:text-red-600 rounded" title="Stop">
                            <HiStop className="h-4 w-4" />
                        </button>
                    )}
                    <button onClick={() => handleDuplicate(row.id)} disabled={actionLoading === `duplicate-${row.id}`} className="p-1.5 text-gray-500 hover:text-blue-600 rounded" title="Duplicate">
                        <HiDuplicate className="h-4 w-4" />
                    </button>
                    {['draft', 'completed', 'failed', 'cancelled'].includes(row.status) && (
                        <button onClick={() => handleDelete(row.id)} disabled={actionLoading === `delete-${row.id}`} className="p-1.5 text-gray-500 hover:text-red-600 rounded" title="Delete">
                            <HiTrash className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your email campaigns</p>
                </div>
                <Button href="/campaigns/new">
                    <HiPlus className="h-4 w-4" />
                    New Campaign
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search campaigns..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="running">Running</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>
            </Card>

            {filteredData.length === 0 ? (
                <Card>
                    <EmptyState
                        title="No campaigns found"
                        description="Create your first campaign to start sending emails."
                        action={<Button href="/campaigns/new"><HiPlus className="h-4 w-4" />New Campaign</Button>}
                    />
                </Card>
            ) : (
                <>
                    <DataTable columns={columns} data={filteredData} rowKey="id" />
                    {campaigns?.links && <Pagination links={campaigns.links} />}
                </>
            )}
        </div>
    );
}

CampaignsIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

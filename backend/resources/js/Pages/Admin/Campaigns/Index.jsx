import { useState } from 'react';
import { HiMail, HiSearch, HiEye } from 'react-icons/hi';
import { Link } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import StatusBadge from '../../../Components/StatusBadge';
import Pagination from '../../../Components/Pagination';
import EmptyState from '../../../Components/EmptyState';
import { useApi } from '../../../hooks/useApi';

export default function AdminCampaigns({ auth }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const { data: campaignsData, loading } = useApi(`/api/admin/campaigns?page=${page}`);

    const campaigns = campaignsData?.data?.data || campaignsData?.data || [];
    const pagination = campaignsData?.data || campaignsData;

    const filtered = campaigns.filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">All Campaigns</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all user campaigns</p>
            </div>

            <Card>
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : filtered.length === 0 ? (
                <Card><EmptyState icon={HiMail} title="No campaigns found" description="User campaigns will appear here." /></Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opens</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filtered.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{c.user?.name || c.user?.email || '—'}</td>
                                        <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                                        <td className="px-5 py-3 text-sm text-gray-700">{(c.total_sent || 0).toLocaleString()}</td>
                                        <td className="px-5 py-3 text-sm text-gray-700">{(c.opens || 0).toLocaleString()}</td>
                                        <td className="px-5 py-3 text-sm text-gray-700">{(c.clicks || 0).toLocaleString()}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Link href={`/campaigns/${c.id}`} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded"><HiEye className="h-4 w-4" /></Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination?.links && <div className="px-5 py-3 border-t border-gray-200"><Pagination links={pagination.links} /></div>}
                </Card>
            )}
        </div>
    );
}

AdminCampaigns.layout = (page) => <AppLayout>{page}</AppLayout>;

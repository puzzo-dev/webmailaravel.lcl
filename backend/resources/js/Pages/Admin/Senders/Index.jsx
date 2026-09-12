import { useState } from 'react';
import axios from 'axios';
import { HiMail, HiBan, HiCheckCircle, HiRefresh } from 'react-icons/hi';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import StatusBadge from '../../../Components/StatusBadge';
import Pagination from '../../../Components/Pagination';
import EmptyState from '../../../Components/EmptyState';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminSenders({ auth }) {
    const { data, loading, refetch } = useApi('/api/admin/senders');
    const { execute, loading: actionLoading } = useApiAction();
    const [actionId, setActionId] = useState(null);

    const senders = data?.data?.data || data?.data || [];
    const pagination = data?.data || data;

    const handleBan = async (id) => {
        if (!confirm('Ban this sender? Banned senders cannot be used in campaign sending.')) return;
        setActionId(id);
        try {
            await execute('post', `/api/admin/senders/${id}/ban`);
            refetch();
        } catch (err) {
            alert(err.message || 'Failed to ban sender');
        } finally {
            setActionId(null);
        }
    };

    const handleUnban = async (id) => {
        if (!confirm('Unban this sender? They will be available for campaign sending again.')) return;
        setActionId(id);
        try {
            await execute('post', `/api/admin/senders/${id}/unban`);
            refetch();
        } catch (err) {
            alert(err.message || 'Failed to unban sender');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">All Senders</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all sender identities — ban or unban senders as needed</p>
            </div>
            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : senders.length === 0 ? (
                <Card><EmptyState icon={HiMail} title="No senders found" description="User senders will appear here." /></Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMTP</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {senders.map((s) => (
                                    <tr key={s.id} className={`hover:bg-gray-50 ${s.banned ? 'bg-red-50' : ''}`}>
                                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.name || '—'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-700">{s.email}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{s.user?.name || s.user?.email || '—'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">
                                            {s.smtp_config
                                                ? `${s.smtp_config.host}:${s.smtp_config.port}`
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            {s.banned ? (
                                                <StatusBadge status="banned" label="Banned" />
                                            ) : s.is_active ? (
                                                <StatusBadge status="active" label="Active" />
                                            ) : (
                                                <StatusBadge status="suspended" label="Inactive" />
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {s.banned ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleUnban(s.id)}
                                                    disabled={actionLoading && actionId === s.id}
                                                >
                                                    <HiCheckCircle className="h-3.5 w-3.5" /> Unban
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleBan(s.id)}
                                                    disabled={actionLoading && actionId === s.id}
                                                >
                                                    <HiBan className="h-3.5 w-3.5 text-red-500" /> Ban
                                                </Button>
                                            )}
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

AdminSenders.layout = (page) => <AppLayout>{page}</AppLayout>;

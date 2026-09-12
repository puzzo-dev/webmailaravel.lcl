import { useState } from 'react';
import { HiDatabase, HiDownload, HiRefresh, HiTrash, HiPlus } from 'react-icons/hi';
import axios from 'axios';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import StatusBadge from '../../../Components/StatusBadge';
import EmptyState from '../../../Components/EmptyState';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminBackups({ auth }) {
    const { data, loading, refetch } = useApi('/api/admin/backups');
    const { execute, loading: actionLoading } = useApiAction();
    const backups = data?.data?.data || data?.data || [];

    const handleCreate = async () => {
        try { await execute('post', '/api/admin/backups'); refetch(); } catch (e) { alert(e.message); }
    };
    const handleRestore = async (id) => {
        if (!confirm('Restore this backup?')) return;
        try { await execute('post', `/api/admin/backups/${id}/restore`); refetch(); } catch (e) { alert(e.message); }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this backup?')) return;
        try { await execute('delete', `/api/admin/backups/${id}`); refetch(); } catch (e) { alert(e.message); }
    };
    const handleDownload = async (id) => {
        try {
            const res = await axios.post(`/api/admin/backups/${id}/download`, {}, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a'); a.href = url; a.download = `backup-${id}.zip`; a.click();
            URL.revokeObjectURL(url);
        } catch (e) { alert('Download failed'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Backups</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage system backups</p>
                </div>
                <Button onClick={handleCreate} disabled={actionLoading}><HiPlus className="h-4 w-4" /> Create Backup</Button>
            </div>
            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : backups.length === 0 ? (
                <Card><EmptyState icon={HiDatabase} title="No backups found" description="Create a backup to get started." /></Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {backups.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{b.name || b.filename || `Backup #${b.id}`}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{b.human_size || b.size || '—'}</td>
                                        <td className="px-5 py-3"><StatusBadge status={b.status || 'completed'} /></td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleDownload(b.id)} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded" title="Download"><HiDownload className="h-4 w-4" /></button>
                                                <button onClick={() => handleRestore(b.id)} className="p-1.5 text-gray-500 hover:text-green-600 rounded" title="Restore"><HiRefresh className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded" title="Delete"><HiTrash className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

AdminBackups.layout = (page) => <AppLayout>{page}</AppLayout>;

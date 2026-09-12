import { useState } from 'react';
import { HiBan, HiTrash, HiSearch, HiUpload } from 'react-icons/hi';
import axios from 'axios';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import Pagination from '../../../Components/Pagination';
import EmptyState from '../../../Components/EmptyState';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminSuppressionList({ auth }) {
    const { data, loading, refetch } = useApi('/api/admin/suppression-list');
    const { execute, loading: actionLoading } = useApiAction();
    const [search, setSearch] = useState('');

    const items = (data?.data?.data || data?.data || []).filter((i) => !search || i.email?.toLowerCase().includes(search.toLowerCase()));
    const pagination = data?.data || data;

    const handleDelete = async (id) => { if (!confirm('Remove this email?')) return; try { await execute('delete', `/api/admin/suppression-list/${id}`); refetch(); } catch (e) { alert(e.message); } };

    const handleImport = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const formData = new FormData(); formData.append('file', file);
        try { await axios.post('/api/admin/suppression-list/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); refetch(); alert('Import successful'); } catch (err) { alert('Import failed'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900">Suppression List</h1><p className="text-sm text-gray-500 mt-1">Global suppression list management</p></div>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                    <HiUpload className="h-4 w-4" /> Import
                    <input type="file" accept=".csv,.txt" onChange={handleImport} className="hidden" />
                </label>
            </div>
            <Card>
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Search emails..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                </div>
            </Card>
            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : items.length === 0 ? (
                <Card><EmptyState icon={HiBan} title="No suppressed emails" description="The suppression list is empty." /></Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm text-gray-900">{item.email}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{item.reason || 'Manual'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{item.user?.email || 'System'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-3 text-right"><button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded"><HiTrash className="h-4 w-4" /></button></td>
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

AdminSuppressionList.layout = (page) => <AppLayout>{page}</AppLayout>;

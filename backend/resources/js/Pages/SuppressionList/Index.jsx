import { useState } from 'react';
import { HiPlus, HiTrash, HiUpload, HiDownload, HiBan } from 'react-icons/hi';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import EmptyState from '../../Components/EmptyState';
import Pagination from '../../Components/Pagination';
import { useApi, useApiAction } from '../../hooks/useApi';

export default function SuppressionListIndex({ auth }) {
    const [page, setPage] = useState(1);
    const { data: listData, loading, refetch } = useApi(`/api/suppression-list?page=${page}`);
    const { execute, loading: actionLoading } = useApiAction();
    const [showAdd, setShowAdd] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    const items = listData?.data?.data || listData?.data || [];
    const pagination = listData?.data || listData;

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await execute('post', '/api/suppression-list', { email: newEmail });
            setNewEmail('');
            setShowAdd(false);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this email from suppression list?')) return;
        try {
            await execute('delete', `/api/suppression-list/${id}`);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await axios.post('/api/suppression-list/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            refetch();
            alert('Import successful');
        } catch (err) {
            alert(err.response?.data?.message || 'Import failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suppression List</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage emails that should never receive campaigns</p>
                </div>
                <div className="flex gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                        <HiUpload className="h-4 w-4" /> Import
                        <input type="file" accept=".csv,.txt" onChange={handleImport} className="hidden" />
                    </label>
                    <Button onClick={() => setShowAdd(!showAdd)}>
                        <HiPlus className="h-4 w-4" /> Add Email
                    </Button>
                </div>
            </div>

            {showAdd && (
                <Card>
                    <form onSubmit={handleAdd} className="p-5 flex gap-3">
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" required className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        <Button type="submit" disabled={actionLoading}>Add</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </form>
                </Card>
            )}

            <Card>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : items.length === 0 ? (
                    <EmptyState icon={HiBan} title="Suppression list is empty" description="Add emails to suppress from your campaigns." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm text-gray-900">{item.email}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{item.reason || 'Manual'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600">
                                                <HiTrash className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {pagination?.links && <div className="px-5 py-3 border-t border-gray-200"><Pagination links={pagination.links} /></div>}
            </Card>
        </div>
    );
}

SuppressionListIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

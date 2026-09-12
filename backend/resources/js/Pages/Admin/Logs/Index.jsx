import { useState } from 'react';
import { HiDocumentText, HiDownload, HiTrash, HiSearch } from 'react-icons/hi';
import axios from 'axios';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import EmptyState from '../../../Components/EmptyState';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminLogs({ auth }) {
    const { data, loading } = useApi('/api/admin/logs');
    const { execute, loading: actionLoading } = useApiAction();
    const [selectedLog, setSelectedLog] = useState(null);

    const logs = data?.data?.data || data?.data || [];

    const handleDownload = async (filename) => {
        try {
            const res = await axios.get(`/api/admin/logs/files/${filename}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download log');
        }
    };

    const handleClear = async (filename) => {
        if (!confirm(`Clear log file ${filename}?`)) return;
        try {
            await execute('delete', `/api/admin/logs/files/${filename}`);
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
                <p className="text-sm text-gray-500 mt-1">View and manage application logs</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : logs.length === 0 ? (
                <Card><EmptyState icon={HiDocumentText} title="No logs found" description="System logs will appear here." /></Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.filename || log.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <HiDocumentText className="h-4 w-4 text-gray-400" />
                                                {log.filename || log.name}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{log.size || '—'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{log.modified ? new Date(log.modified).toLocaleString() : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleDownload(log.filename)} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded" title="Download"><HiDownload className="h-4 w-4" /></button>
                                                <button onClick={() => handleClear(log.filename)} className="p-1.5 text-gray-500 hover:text-red-600 rounded" title="Clear"><HiTrash className="h-4 w-4" /></button>
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

AdminLogs.layout = (page) => <AppLayout>{page}</AppLayout>;

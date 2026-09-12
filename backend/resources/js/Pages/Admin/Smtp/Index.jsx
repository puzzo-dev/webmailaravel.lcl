import { useState } from 'react';
import { HiServer, HiPlus, HiTrash, HiPencil, HiCog } from 'react-icons/hi';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import StatusBadge from '../../../Components/StatusBadge';
import Modal from '../../../Components/Modal';
import EmptyState from '../../../Components/EmptyState';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminSmtp({ auth }) {
    const { data, loading, refetch } = useApi('/api/admin/smtp-configs');
    const { execute, loading: actionLoading } = useApiAction();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', host: '', port: 587, username: '', password: '', encryption: 'tls' });

    const configs = data?.data?.data || data?.data || [];

    const openCreate = () => { setEditing(null); setForm({ name: '', host: '', port: 587, username: '', password: '', encryption: 'tls' }); setShowModal(true); };
    const openEdit = (c) => { setEditing(c); setForm({ name: c.name || '', host: c.host || '', port: c.port || 587, username: c.username || '', password: '', encryption: c.encryption || 'tls' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) await execute('put', `/api/admin/smtp-configs/${editing.id}`, form);
            else await execute('post', '/api/admin/smtp-configs', form);
            setShowModal(false); refetch();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => { if (!confirm('Delete this SMTP config?')) return; try { await execute('delete', `/api/admin/smtp-configs/${id}`); refetch(); } catch (e) { alert(e.message); } };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900">SMTP Configurations</h1><p className="text-sm text-gray-500 mt-1">Manage system-wide SMTP servers</p></div>
                <Button onClick={openCreate}><HiPlus className="h-4 w-4" /> Add Config</Button>
            </div>
            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : configs.length === 0 ? (
                <Card><EmptyState icon={HiServer} title="No SMTP configs" description="Add an SMTP configuration to get started." action={<Button onClick={openCreate}><HiPlus className="h-4 w-4" />Add Config</Button>} /></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configs.map((c) => (
                        <Card key={c.id} className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div><p className="font-medium text-gray-900">{c.name}</p><p className="text-xs text-gray-400">{c.host}:{c.port}</p></div>
                                <StatusBadge status={c.active ? 'active' : 'suspended'} />
                            </div>
                            <p className="text-xs text-gray-400 mb-3">From address is determined by the sender using this config</p>
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><HiPencil className="h-3.5 w-3.5" /> Edit</Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><HiTrash className="h-3.5 w-3.5 text-red-500" /></Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit SMTP Config' : 'Add SMTP Config'} maxWidth="max-w-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" /></div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Host</label><input type="text" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Port</label><input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Leave blank to keep' : ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label><select value={form.encryption} onChange={(e) => setForm({ ...form, encryption: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"><option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option></select></div>
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">The "from" address is determined by the sender assigned to each campaign — one SMTP config can be used by multiple senders.</p>
                    <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" disabled={actionLoading}>{editing ? 'Update' : 'Create'}</Button></div>
                </form>
            </Modal>
        </div>
    );
}

AdminSmtp.layout = (page) => <AppLayout>{page}</AppLayout>;

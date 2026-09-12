import { useState } from 'react';
import { HiPlus, HiTrash, HiMail, HiCog, HiCheckCircle } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import StatusBadge from '../../Components/StatusBadge';
import Modal from '../../Components/Modal';
import EmptyState from '../../Components/EmptyState';
import { useApi, useApiAction } from '../../hooks/useApi';

export default function BounceCredentialsIndex({ auth }) {
    const { data: credsData, loading, refetch } = useApi('/api/bounce-credentials');
    const { execute, loading: actionLoading } = useApiAction();
    const [showModal, setShowModal] = useState(false);
    const [editingCred, setEditingCred] = useState(null);
    const [form, setForm] = useState({ name: '', host: '', port: 993, username: '', password: '', encryption: 'ssl', protocol: 'imap' });

    const credentials = credsData?.data || credsData || [];

    const openCreate = () => {
        setEditingCred(null);
        setForm({ name: '', host: '', port: 993, username: '', password: '', encryption: 'ssl', protocol: 'imap' });
        setShowModal(true);
    };

    const openEdit = (cred) => {
        setEditingCred(cred);
        setForm({ name: cred.name || '', host: cred.host || '', port: cred.port || 993, username: cred.username || '', password: '', encryption: cred.encryption || 'ssl', protocol: cred.protocol || 'imap' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCred) {
                await execute('put', `/api/bounce-credentials/${editingCred.id}`, form);
            } else {
                await execute('post', '/api/bounce-credentials', form);
            }
            setShowModal(false);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete these credentials?')) return;
        try {
            await execute('delete', `/api/bounce-credentials/${id}`);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleTest = async (id) => {
        try {
            await execute('post', `/api/bounce-credentials/${id}/test`);
            alert('Connection test successful');
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bounce Processing</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure IMAP/POP3 credentials for bounce processing</p>
                </div>
                <Button onClick={openCreate}>
                    <HiPlus className="h-4 w-4" /> Add Credentials
                </Button>
            </div>

            {credentials.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={HiMail}
                        title="No bounce credentials configured"
                        description="Add IMAP/POP3 credentials to automatically process bounce emails."
                        action={<Button onClick={openCreate}><HiPlus className="h-4 w-4" />Add Credentials</Button>}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {credentials.map((cred) => (
                        <Card key={cred.id} className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <HiMail className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{cred.name}</p>
                                        <p className="text-xs text-gray-400">{cred.host}:{cred.port} ({cred.protocol?.toUpperCase()})</p>
                                    </div>
                                </div>
                                <StatusBadge status={cred.active ? 'active' : 'suspended'} label={cred.active ? 'Active' : 'Inactive'} />
                            </div>
                            <p className="text-sm text-gray-500 mb-3">User: {cred.username}</p>
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Button size="sm" variant="secondary" onClick={() => handleTest(cred.id)} disabled={actionLoading}>
                                    <HiCheckCircle className="h-3.5 w-3.5" /> Test
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(cred)}>
                                    <HiCog className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(cred.id)}>
                                    <HiTrash className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} title={editingCred ? 'Edit Bounce Credentials' : 'Add Bounce Credentials'} maxWidth="max-w-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
                            <select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500">
                                <option value="imap">IMAP</option>
                                <option value="pop3">POP3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                            <select value={form.encryption} onChange={(e) => setForm({ ...form, encryption: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500">
                                <option value="ssl">SSL</option>
                                <option value="tls">TLS</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                            <input type="text" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required placeholder="imap.example.com" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                            <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingCred ? 'Leave blank to keep current' : ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={actionLoading}>{editingCred ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

BounceCredentialsIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

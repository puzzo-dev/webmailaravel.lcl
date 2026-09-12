import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiPlus, HiPencil, HiTrash, HiMail, HiCheckCircle, HiXCircle, HiCog, HiServer, HiGlobe, HiShieldCheck } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import StatusBadge from '../../Components/StatusBadge';
import Modal from '../../Components/Modal';
import EmptyState from '../../Components/EmptyState';
import { useApi, useApiAction } from '../../hooks/useApi';

const apiClient = axios.create({ withCredentials: true });

export default function SendersIndex({ auth }) {
    const { data: sendersData, loading, refetch } = useApi('/api/senders');
    const { execute, loading: actionLoading } = useApiAction();
    const [showModal, setShowModal] = useState(false);
    const [editingSender, setEditingSender] = useState(null);
    const [smtpConfigs, setSmtpConfigs] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', smtp_config_id: '', reply_to: '' });
    const [dnsModal, setDnsModal] = useState(null);
    const [dnsLoading, setDnsLoading] = useState(false);
    const [dnsResult, setDnsResult] = useState(null);
    const [dnsCheckResult, setDnsCheckResult] = useState(null);

    const senders = sendersData?.data || sendersData || [];

    // Fetch available SMTP configs
    useEffect(() => {
        axios.get('/api/admin/smtp-configs').then((res) => {
            setSmtpConfigs(res.data?.data || res.data || []);
        }).catch(() => {
            // Non-admin users may not have access; that's ok
        });
    }, []);

    const openCreate = () => {
        setEditingSender(null);
        setForm({ name: '', email: '', smtp_config_id: '', reply_to: '' });
        setShowModal(true);
    };

    const openEdit = (sender) => {
        setEditingSender(sender);
        setForm({
            name: sender.name || '',
            email: sender.email || '',
            smtp_config_id: sender.smtp_config_id || '',
            reply_to: sender.reply_to || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSender) {
                await execute('put', `/api/senders/${editingSender.id}`, form);
            } else {
                await execute('post', '/api/senders', form);
            }
            setShowModal(false);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this sender?')) return;
        try {
            await execute('delete', `/api/senders/${id}`);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleTest = async (id) => {
        const testEmail = prompt('Enter test email address:');
        if (!testEmail) return;
        try {
            await execute('post', `/api/senders/${id}/test`, { test_email: testEmail });
            alert('Test email sent successfully');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSetupDns = async (sender) => {
        setDnsModal(sender);
        setDnsResult(null);
        setDnsCheckResult(null);
        setDnsLoading(true);
        try {
            const res = await apiClient.post('/api/admin/powermta/dns/setup-sender', { sender_id: sender.id });
            setDnsResult(res.data?.data || res.data);
        } catch (err) {
            setDnsResult({ success: false, error: err.response?.data?.message || 'DNS setup failed' });
        } finally {
            setDnsLoading(false);
        }
    };

    const handleCheckDns = async (senderId) => {
        setDnsLoading(true);
        setDnsCheckResult(null);
        try {
            const res = await apiClient.post('/api/admin/powermta/dns/check-sender', { sender_id: senderId });
            setDnsCheckResult(res.data?.data || res.data);
        } catch (err) {
            setDnsCheckResult({ success: false, error: err.response?.data?.message || 'DNS check failed' });
        } finally {
            setDnsLoading(false);
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
                    <h1 className="text-2xl font-bold text-gray-900">Senders</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your sender identities and SMTP configs</p>
                </div>
                <Button onClick={openCreate}>
                    <HiPlus className="h-4 w-4" /> Add Sender
                </Button>
            </div>

            {senders.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={HiMail}
                        title="No senders configured"
                        description="Add a sender identity to start sending campaigns."
                        action={<Button onClick={openCreate}><HiPlus className="h-4 w-4" />Add Sender</Button>}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {senders.map((sender) => (
                        <Card key={sender.id} className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <HiMail className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{sender.name || sender.email}</p>
                                        <p className="text-sm text-gray-500">{sender.email}</p>
                                    </div>
                                </div>
                                <StatusBadge status={sender.verified ? 'verified' : 'unverified'} label={sender.verified ? 'Verified' : 'Unverified'} />
                            </div>
                            {sender.reply_to && <p className="text-xs text-gray-400 mb-2">Reply-to: {sender.reply_to}</p>}
                            <div className="flex items-center gap-2 mb-3 text-xs">
                                <HiServer className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-500">
                                    {sender.smtp_config
                                        ? `${sender.smtp_config.host}:${sender.smtp_config.port}`
                                        : 'No SMTP config'}
                                </span>
                            </div>
                            {sender.dkim_selector && (
                                <div className="flex items-center gap-2 mb-3 text-xs">
                                    <HiShieldCheck className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500">DKIM: {sender.dkim_selector}</span>
                                    {sender.dns_verified_at ? (
                                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Verified</span>
                                    ) : (
                                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Pending</span>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Button size="sm" variant="secondary" onClick={() => handleTest(sender.id)} disabled={actionLoading}>
                                    <HiCog className="h-3.5 w-3.5" /> Test
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleSetupDns(sender)} disabled={actionLoading}>
                                    <HiGlobe className="h-3.5 w-3.5" /> DNS
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(sender)}>
                                    <HiPencil className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(sender.id)}>
                                    <HiTrash className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} title={editingSender ? 'Edit Sender' : 'Add Sender'} maxWidth="max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reply-to</label>
                        <input type="email" value={form.reply_to} onChange={(e) => setForm({ ...form, reply_to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Config</label>
                        <select
                            value={form.smtp_config_id}
                            onChange={(e) => setForm({ ...form, smtp_config_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">No SMTP config</option>
                            {smtpConfigs.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.host}:{c.port} ({c.encryption})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select the SMTP server this sender will use for sending emails.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={actionLoading}>{editingSender ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>

            {/* DNS Setup Modal */}
            <Modal show={!!dnsModal} onClose={() => setDnsModal(null)} title={`DNS Setup — ${dnsModal?.email || ''}`} maxWidth="max-w-2xl">
                <div className="space-y-4">
                    {dnsLoading && (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    )}

                    {!dnsLoading && dnsResult && !dnsResult.success && dnsResult.error && (
                        <div className="p-4 bg-red-50 rounded-lg flex items-center gap-2">
                            <HiXCircle className="h-5 w-5 text-red-500" />
                            <p className="text-sm text-red-700">{dnsResult.error}</p>
                        </div>
                    )}

                    {!dnsLoading && dnsResult && dnsResult.success && (
                        <>
                            <div className="p-4 bg-green-50 rounded-lg flex items-center gap-2">
                                <HiCheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-700">
                                    DNS records created successfully for <strong>{dnsResult.domain}</strong>
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Created Records</h4>
                                <div className="space-y-2">
                                    {dnsResult.records && Object.entries(dnsResult.records).map(([type, rec]) => (
                                        <div key={type} className={`p-3 rounded-lg border ${rec.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-900 uppercase">{type}</span>
                                                {rec.success ? (
                                                    <HiCheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <HiXCircle className="h-4 w-4 text-red-600" />
                                                )}
                                            </div>
                                            {rec.error && <p className="text-xs text-red-600 mt-1">{rec.error}</p>}
                                            {rec.name && <p className="text-xs text-gray-500 mt-1">Name: {rec.name}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleCheckDns(dnsModal.id)} disabled={dnsLoading}>
                                    <HiShieldCheck className="h-4 w-4" /> Verify DNS
                                </Button>
                            </div>
                        </>
                    )}

                    {!dnsLoading && dnsCheckResult && (
                        <div className={`p-4 rounded-lg border ${dnsCheckResult.all_configured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                {dnsCheckResult.all_configured ? (
                                    <HiCheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <HiXCircle className="h-5 w-5 text-yellow-600" />
                                )}
                                <p className={`text-sm font-medium ${dnsCheckResult.all_configured ? 'text-green-700' : 'text-yellow-700'}`}>
                                    {dnsCheckResult.all_configured ? 'All DNS records verified!' : 'Some DNS records are not yet propagated'}
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                {['spf', 'dkim', 'dmarc'].map((type) => (
                                    <div key={type} className={`p-2 rounded text-center ${dnsCheckResult.status?.[type] ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <p className="font-medium uppercase text-gray-700">{type}</p>
                                        <p className={dnsCheckResult.status?.[type] ? 'text-green-700' : 'text-red-700'}>
                                            {dnsCheckResult.status?.[type] ? 'Found' : 'Not Found'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!dnsLoading && !dnsResult && (
                        <div className="text-center py-6">
                            <HiGlobe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">
                                This will automatically generate a DKIM key pair and create SPF, DKIM, and DMARC DNS records
                                via Cloudflare for <strong>{dnsModal?.email}</strong>.
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Make sure Cloudflare API credentials are configured in Admin → System Settings.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setDnsModal(null)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

SendersIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

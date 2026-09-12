import { useState } from 'react';
import { HiBell, HiPaperAirplane } from 'react-icons/hi';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import Modal from '../../../Components/Modal';
import EmptyState from '../../../Components/EmptyState';
import { useApiAction } from '../../../hooks/useApi';

export default function AdminNotifications({ auth }) {
    const { execute, loading: actionLoading } = useApiAction();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', message: '', type: 'info', send_to_all: true });
    const [lastResult, setLastResult] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();
        try {
            const res = await execute('post', '/api/admin/notifications', form);
            setLastResult(res);
            setShowModal(false);
            setForm({ title: '', message: '', type: 'info', send_to_all: true });
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">Send Telegram notifications to users</p>
                </div>
                <Button onClick={() => setShowModal(true)}><HiPaperAirplane className="h-4 w-4" /> Send Notification</Button>
            </div>

            <Card>
                <div className="p-5">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                        <HiBell className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Telegram Only</p>
                            <p className="text-sm text-blue-700 mt-1">
                                All notifications are delivered via Telegram. Users must have Telegram configured in their account settings to receive notifications.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {lastResult && (
                <Card title="Last Send Result">
                    <div className="p-5">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Sent to:</span>
                                <span className="text-sm font-medium text-gray-900">{lastResult.sent_count || 0} user(s)</span>
                            </div>
                            {lastResult.errors && lastResult.errors.length > 0 && (
                                <div className="mt-3 p-3 bg-red-50 rounded-md">
                                    <p className="text-sm text-red-700 font-medium mb-1">Errors:</p>
                                    <ul className="text-sm text-red-600 list-disc list-inside">
                                        {lastResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                            {(!lastResult.errors || lastResult.errors.length === 0) && (
                                <p className="text-sm text-green-600">All notifications delivered successfully via Telegram.</p>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            <Card>
                <div className="p-5">
                    <EmptyState
                        icon={HiBell}
                        title="No notification history"
                        description="Notifications are sent via Telegram and not stored in the database. Use the Send Notification button to send a Telegram message to your users."
                        action={<Button onClick={() => setShowModal(true)}><HiPaperAirplane className="h-4 w-4" /> Send Notification</Button>}
                    />
                </div>
            </Card>

            <Modal show={showModal} onClose={() => setShowModal(false)} title="Send Telegram Notification">
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="info">Info</option>
                            <option value="success">Success</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.send_to_all}
                            onChange={(e) => setForm({ ...form, send_to_all: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Send to all users</span>
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500">
                            The notification will be sent via Telegram to all users who have Telegram configured.
                            Users without Telegram settings will be skipped.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={actionLoading}>{actionLoading ? 'Sending...' : 'Send via Telegram'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

AdminNotifications.layout = (page) => <AppLayout>{page}</AppLayout>;

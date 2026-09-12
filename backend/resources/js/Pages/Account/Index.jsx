import { useState, useEffect } from 'react';
import { HiUser, HiLockClosed, HiCog, HiKey, HiCheck, HiChat, HiPaperAirplane } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import { useApi, useApiAction } from '../../hooks/useApi';

export default function AccountIndex({ auth }) {
    const [tab, setTab] = useState('profile');
    const { data: settingsData, loading: settingsLoading } = useApi('/api/user/settings');
    const { execute, loading: actionLoading } = useApiAction();
    const [profileForm, setProfileForm] = useState({ name: '', username: '', email: '' });
    const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [telegramForm, setTelegramForm] = useState({ telegram_chat_id: '', telegram_notifications_enabled: false });
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (auth?.user) {
            setProfileForm({
                name: auth.user.name || '',
                username: auth.user.username || '',
                email: auth.user.email || '',
            });
        }
    }, [auth]);

    useEffect(() => {
        if (settingsData?.data || settingsData) {
            const s = settingsData.data || settingsData;
            setTelegramForm({
                telegram_chat_id: s.telegram_chat_id || '',
                telegram_notifications_enabled: s.telegram_notifications_enabled || false,
            });
        }
    }, [settingsData]);

    const showMessage = (msg, type = 'success') => {
        setMessage({ text: msg, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            await execute('put', '/api/user/settings/general', profileForm);
            showMessage('Profile updated successfully');
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        try {
            await execute('put', '/api/user/settings/security', passwordForm);
            setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
            showMessage('Password changed successfully');
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    const handleTelegramSubmit = async (e) => {
        e.preventDefault();
        try {
            await execute('put', '/api/user/settings/notifications', telegramForm);
            showMessage('Telegram settings saved successfully');
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    const handleTestTelegram = async () => {
        try {
            await execute('post', '/api/user/settings/telegram/test', {
                chat_id: telegramForm.telegram_chat_id,
                message: 'Test notification from WebMail Laravel - Telegram is working!',
            });
            showMessage('Test message sent to your Telegram');
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    const tabs = [
        { key: 'profile', label: 'Profile', icon: HiUser },
        { key: 'security', label: 'Security', icon: HiLockClosed },
        { key: 'telegram', label: 'Telegram', icon: HiChat },
    ];

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Account</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your account settings and Telegram notifications</p>
            </div>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {tab === 'profile' && (
                <Card title="Profile Information">
                    <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={actionLoading}>Save Changes</Button>
                        </div>
                    </form>
                </Card>
            )}

            {tab === 'security' && (
                <div className="space-y-6">
                    <Card title="Change Password">
                        <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required minLength={8} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input type="password" value={passwordForm.new_password_confirmation} onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={actionLoading}>Change Password</Button>
                            </div>
                        </form>
                    </Card>

                    <Card title="Security Information">
                        <div className="p-5 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Two-Factor Authentication</span>
                                <span className="text-sm">{auth?.user?.two_factor_enabled ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Last Password Change</span>
                                <span className="text-sm text-gray-700">{auth?.user?.last_password_change ? new Date(auth.user.last_password_change).toLocaleDateString() : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Account Created</span>
                                <span className="text-sm text-gray-700">{auth?.user?.created_at ? new Date(auth.user.created_at).toLocaleDateString() : '—'}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {tab === 'telegram' && (
                <Card title="Telegram Notifications">
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <HiChat className="h-5 w-5 text-blue-500" />
                            <p className="text-sm text-gray-500">
                                All notifications (login alerts, billing updates, campaign activity) are sent via Telegram.
                                Enter your Telegram Chat ID to receive notifications.
                            </p>
                        </div>
                        {settingsLoading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                        ) : (
                            <form onSubmit={handleTelegramSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Chat ID</label>
                                    <input
                                        type="text"
                                        value={telegramForm.telegram_chat_id}
                                        onChange={(e) => setTelegramForm({ ...telegramForm, telegram_chat_id: e.target.value })}
                                        placeholder="e.g. 123456789"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        To get your Chat ID, message @userinfobot on Telegram.
                                    </p>
                                </div>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={telegramForm.telegram_notifications_enabled}
                                        onChange={(e) => setTelegramForm({ ...telegramForm, telegram_notifications_enabled: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Enable Telegram notifications</span>
                                </label>
                                <div className="flex justify-between gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleTestTelegram}
                                        disabled={actionLoading || !telegramForm.telegram_chat_id}
                                    >
                                        <HiPaperAirplane className="h-4 w-4" /> Send Test Message
                                    </Button>
                                    <Button type="submit" disabled={actionLoading}>
                                        <HiCheck className="h-4 w-4" /> Save Telegram Settings
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}

AccountIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

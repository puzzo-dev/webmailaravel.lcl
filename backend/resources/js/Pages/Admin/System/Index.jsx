import { useState } from 'react';
import { HiCog, HiSave, HiMail, HiCurrencyDollar, HiChat, HiServer, HiGlobe } from 'react-icons/hi';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminSystem({ auth }) {
    const { data, loading } = useApi('/api/admin/system-config');
    const { data: btcpayData } = useApi('/api/admin/system-config/btcpay');
    const { data: telegramData } = useApi('/api/admin/system-config/telegram');
    const { data: pmtaData } = useApi('/api/admin/system-config/pmta-monitoring');
    const { data: cloudflareData } = useApi('/api/admin/system-config/cloudflare');
    const { execute, loading: actionLoading } = useApiAction();
    const [form, setForm] = useState({});
    const [btcpayForm, setBtcpayForm] = useState({});
    const [telegramForm, setTelegramForm] = useState({});
    const [pmtaForm, setPmtaForm] = useState({});
    const [cloudflareForm, setCloudflareForm] = useState({});
    const [message, setMessage] = useState(null);

    const config = data?.data || data || {};
    const btcpayConfig = btcpayData?.data || btcpayData || {};
    const telegramConfig = telegramData?.data || telegramData || {};
    const pmtaConfig = pmtaData?.data || pmtaData || {};
    const cloudflareConfig = cloudflareData?.data || cloudflareData || {};

    const sections = [
        { title: 'SMTP Settings', fields: [
            { key: 'SYSTEM_SMTP_HOST', label: 'SMTP Host' },
            { key: 'SYSTEM_SMTP_PORT', label: 'SMTP Port' },
            { key: 'SYSTEM_SMTP_USERNAME', label: 'SMTP Username' },
            { key: 'SYSTEM_SMTP_PASSWORD', label: 'SMTP Password', type: 'password' },
            { key: 'SYSTEM_SMTP_ENCRYPTION', label: 'Encryption' },
            { key: 'SYSTEM_SMTP_FROM_ADDRESS', label: 'From Address' },
            { key: 'SYSTEM_SMTP_FROM_NAME', label: 'From Name' },
        ]},
        { title: 'Application Settings', fields: [
            { key: 'APP_NAME', label: 'Application Name' },
            { key: 'MAX_CAMPAIGNS_PER_DAY', label: 'Max Campaigns/Day' },
            { key: 'MAX_RECIPIENTS_PER_CAMPAIGN', label: 'Max Recipients/Campaign' },
        ]},
    ];

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await execute('post', '/api/admin/system-config', form);
            setMessage({ text: 'Settings saved successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveBtcpay = async (e) => {
        e.preventDefault();
        try {
            await execute('post', '/api/admin/system-config/btcpay', btcpayForm);
            setMessage({ text: 'BTCPay settings saved successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveTelegram = async (e) => {
        e.preventDefault();
        try {
            await execute('post', '/api/admin/system-config/telegram', telegramForm);
            setMessage({ text: 'Telegram settings saved successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSavePmta = async (e) => {
        e.preventDefault();
        try {
            await execute('post', '/api/admin/system-config/pmta-monitoring', pmtaForm);
            setMessage({ text: 'PMTA monitoring settings saved successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveCloudflare = async (e) => {
        e.preventDefault();
        try {
            await execute('post', '/api/admin/system-config/cloudflare', cloudflareForm);
            setMessage({ text: 'Cloudflare settings saved successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleTestSmtp = async () => {
        try {
            await execute('post', '/api/system-settings/test-smtp', form);
            setMessage({ text: 'Test email sent successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Configure system-wide settings</p>
            </div>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message.text}</div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {sections.map((section) => (
                    <Card key={section.title} title={section.title}>
                        <div className="p-5 space-y-4">
                            {section.fields.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                    <input
                                        type={field.type || 'text'}
                                        defaultValue={config[field.key] || ''}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={handleTestSmtp} disabled={actionLoading}>
                        <HiMail className="h-4 w-4" /> Test SMTP
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                        <HiSave className="h-4 w-4" /> Save Settings
                    </Button>
                </div>
            </form>

            {/* BTCPay Configuration */}
            <Card title="BTCPay Configuration">
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiCurrencyDollar className="h-5 w-5 text-orange-500" />
                        <p className="text-sm text-gray-500">Configure BTCPay Server credentials for processing billing payments.</p>
                    </div>
                    <form onSubmit={handleSaveBtcpay} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">BTCPay Server URL</label>
                            <input
                                type="url"
                                defaultValue={btcpayConfig.base_url || ''}
                                onChange={(e) => setBtcpayForm({ ...btcpayForm, base_url: e.target.value })}
                                placeholder="https://btcpay.example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                            <input
                                type="password"
                                defaultValue={btcpayConfig.api_key || ''}
                                onChange={(e) => setBtcpayForm({ ...btcpayForm, api_key: e.target.value })}
                                placeholder="BTCPay API key"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                            <input
                                type="text"
                                defaultValue={btcpayConfig.store_id || ''}
                                onChange={(e) => setBtcpayForm({ ...btcpayForm, store_id: e.target.value })}
                                placeholder="BTCPay Store ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                            <input
                                type="password"
                                defaultValue={btcpayConfig.webhook_secret || ''}
                                onChange={(e) => setBtcpayForm({ ...btcpayForm, webhook_secret: e.target.value })}
                                placeholder="Webhook secret for verifying callbacks"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <input
                                type="text"
                                defaultValue={btcpayConfig.currency || 'USD'}
                                onChange={(e) => setBtcpayForm({ ...btcpayForm, currency: e.target.value })}
                                placeholder="USD"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={actionLoading}>
                                <HiSave className="h-4 w-4" /> Save BTCPay Settings
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            {/* Telegram Configuration */}
            <Card title="Telegram Bot Configuration">
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiChat className="h-5 w-5 text-blue-500" />
                        <p className="text-sm text-gray-500">Configure the system Telegram bot for sending notifications to users.</p>
                    </div>
                    <form onSubmit={handleSaveTelegram} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token</label>
                            <input
                                type="password"
                                defaultValue={telegramConfig.bot_token || ''}
                                onChange={(e) => setTelegramForm({ ...telegramForm, bot_token: e.target.value })}
                                placeholder="Telegram Bot Token from @BotFather"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Chat ID</label>
                            <input
                                type="text"
                                defaultValue={telegramConfig.chat_id || ''}
                                onChange={(e) => setTelegramForm({ ...telegramForm, chat_id: e.target.value })}
                                placeholder="Default chat ID for admin notifications"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    defaultChecked={telegramConfig.enabled || false}
                                    onChange={(e) => setTelegramForm({ ...telegramForm, enabled: e.target.checked })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Enable Telegram notifications system-wide
                            </label>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={actionLoading}>
                                <HiSave className="h-4 w-4" /> Save Telegram Settings
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            {/* PMTA Monitoring Configuration */}
            <Card title="PMTA File Monitoring">
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiServer className="h-5 w-5 text-purple-500" />
                        <p className="text-sm text-gray-500">Configure PMTA file-based monitoring for accounting, FBL, diagnostic, and log files.</p>
                    </div>
                    <form onSubmit={handleSavePmta} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    defaultChecked={pmtaConfig.enabled || false}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, enabled: e.target.checked })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Enable PMTA file monitoring
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Identifier</label>
                            <input
                                type="text"
                                defaultValue={pmtaConfig.project_id || 'webmailaravel'}
                                onChange={(e) => setPmtaForm({ ...pmtaForm, project_id: e.target.value })}
                                placeholder="webmailaravel"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Unique ID sent as X-Project-ID header on every email. Distinguishes this project from
                                others (e.g. EmailMarketingSaaS) sharing the same PMTA engine. PMTA config must include
                                header_X-Project-ID in record-fields for accounting files.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Files Path</label>
                            <input
                                type="text"
                                defaultValue={pmtaConfig.files_path || '/root/pmta/logs'}
                                onChange={(e) => setPmtaForm({ ...pmtaForm, files_path: e.target.value })}
                                placeholder="/var/log/pmta"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">FBL Subdirectory</label>
                                <input
                                    type="text"
                                    defaultValue={pmtaConfig.fbl_path || 'pmta-fbl'}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, fbl_path: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logs Subdirectory</label>
                                <input
                                    type="text"
                                    defaultValue={pmtaConfig.logs_path || ''}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, logs_path: e.target.value })}
                                    placeholder="(empty = base dir)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Accounting Subdirectory</label>
                                <input
                                    type="text"
                                    defaultValue={pmtaConfig.acct_path || 'pmta-acct'}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, acct_path: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostic Subdirectory</label>
                                <input
                                    type="text"
                                    defaultValue={pmtaConfig.diag_path || 'pmta-diag'}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, diag_path: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bounce Subdirectory</label>
                                <input
                                    type="text"
                                    defaultValue={pmtaConfig.bounce_path || 'pmta-bounce'}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, bounce_path: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scan Interval (minutes)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1440"
                                    defaultValue={pmtaConfig.scan_interval || 5}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, scan_interval: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Retention (days)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    defaultValue={pmtaConfig.retention_days || 30}
                                    onChange={(e) => setPmtaForm({ ...pmtaForm, retention_days: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={actionLoading}>
                                <HiSave className="h-4 w-4" /> Save PMTA Settings
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            {/* Cloudflare DNS Automation */}
            <Card title="Cloudflare DNS Automation">
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiGlobe className="h-5 w-5 text-orange-500" />
                        <p className="text-sm text-gray-500">
                            Configure Cloudflare API credentials for automated DNS setup (SPF, DKIM, DMARC) for senders.
                            {cloudflareConfig.is_configured && (
                                <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Configured</span>
                            )}
                        </p>
                    </div>
                    <form onSubmit={handleSaveCloudflare} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                            <input
                                type="password"
                                defaultValue={cloudflareConfig.api_token || ''}
                                onChange={(e) => setCloudflareForm({ ...cloudflareForm, api_token: e.target.value })}
                                placeholder="Cloudflare API token with DNS edit permissions"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">Create at: Cloudflare → My Profile → API Tokens → Create Token → Edit zone DNS</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zone ID</label>
                            <input
                                type="text"
                                defaultValue={cloudflareConfig.zone_id || ''}
                                onChange={(e) => setCloudflareForm({ ...cloudflareForm, zone_id: e.target.value })}
                                placeholder="Cloudflare Zone ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">Found at: Cloudflare → Overview → your domain → API section → Zone ID</p>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={actionLoading}>
                                <HiSave className="h-4 w-4" /> Save Cloudflare Settings
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
}

AdminSystem.layout = (page) => <AppLayout>{page}</AppLayout>;

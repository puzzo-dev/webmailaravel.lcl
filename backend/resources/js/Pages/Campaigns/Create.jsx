import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { HiArrowLeft, HiUpload, HiPaperClip, HiX, HiUsers, HiDocumentText, HiMail } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import WysiwygEditor from '../../Components/WysiwygEditor';

export default function CampaignsCreate({ auth }) {
    const [senders, setSenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [recipientFile, setRecipientFile] = useState(null);
    const [recipientCount, setRecipientCount] = useState(null);

    const [form, setForm] = useState({
        name: '',
        subject: '',
        content: '',
        sender_ids: [],
        enable_open_tracking: true,
        enable_click_tracking: true,
        enable_unsubscribe_link: true,
        enable_content_switching: false,
    });

    useEffect(() => {
        axios.get('/api/senders').then((sendersRes) => {
            setSenders(sendersRes.data?.data || sendersRes.data || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleRecipientFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setRecipientFile(file);

        // Quick count for txt files (one email per line)
        if (file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const lines = ev.target.result.split('\n').filter((l) => l.trim() && l.includes('@'));
                setRecipientCount(lines.length);
            };
            reader.readAsText(file);
        } else {
            setRecipientCount(null);
        }
    };

    const handleFileChange = (e) => {
        setAttachments(Array.from(e.target.files));
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (key === 'sender_ids') {
                value.forEach((id) => formData.append('sender_ids[]', id));
            } else {
                formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
            }
        });
        if (recipientFile) {
            formData.append('recipient_file', recipientFile);
        }
        attachments.forEach((file) => {
            formData.append('attachments[]', file);
        });

        try {
            await axios.post('/api/campaigns', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            router.visit('/campaigns');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create campaign');
        } finally {
            setSubmitting(false);
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
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Link href="/campaigns" className="text-gray-500 hover:text-gray-700">
                    <HiArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
                    <p className="text-sm text-gray-500 mt-1">Create a new email campaign</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card title="Basic Information">
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                            <input
                                type="text"
                                name="subject"
                                value={form.subject}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </Card>

                <Card title="Senders">
                    <div className="p-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Senders</label>
                        <p className="text-xs text-gray-500 mb-3">
                            Select one or more senders. Each sender's email is used as the "from" address and its SMTP config is used for delivery.
                            Multiple senders are rotated automatically during sending.
                        </p>
                        {senders.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No senders available. Create senders first.</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                                {senders.map((s) => (
                                    <label key={s.id} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${form.sender_ids.includes(s.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                                        <input
                                            type="checkbox"
                                            checked={form.sender_ids.includes(s.id)}
                                            onChange={(e) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    sender_ids: e.target.checked
                                                        ? [...prev.sender_ids, s.id]
                                                        : prev.sender_ids.filter((id) => id !== s.id),
                                                }));
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{s.name || s.email}</p>
                                            <p className="text-xs text-gray-400">{s.email}</p>
                                        </div>
                                        {s.smtp_config && (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                {s.smtp_config.name || s.smtp_config.host}
                                            </span>
                                        )}
                                        {s.banned && (
                                            <span className="text-xs text-red-600 font-medium">Banned</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, sender_ids: senders.filter((s) => !s.banned).map((s) => s.id) }))}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Select All
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, sender_ids: [] }))}
                                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Clear
                            </button>
                            <span className="text-xs text-gray-400 ml-auto">
                                {form.sender_ids.length} selected
                            </span>
                        </div>
                    </div>
                </Card>

                <Card title="Recipient List">
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <HiUsers className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">
                                        {recipientFile ? recipientFile.name : 'Click to upload recipient list'}
                                    </p>
                                    <p className="text-xs text-gray-400">TXT (one email per line), CSV, or Excel up to 10MB</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".txt,.csv,.xlsx,.xls"
                                    onChange={handleRecipientFile}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {recipientFile && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-2">
                                    <HiDocumentText className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-700">{recipientFile.name}</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            ({(recipientFile.size / 1024).toFixed(0)} KB)
                                            {recipientCount !== null && ` — ${recipientCount} recipients`}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setRecipientFile(null); setRecipientCount(null); }}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <HiX className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-500">
                            Upload a file with your recipient email addresses. Suppressed emails are automatically filtered out.
                            For TXT files, put one email per line. For CSV, include an email column.
                        </p>
                    </div>
                </Card>

                <Card title="Email Content">
                    <div className="p-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Body (WYSIWYG Editor)</label>
                        <WysiwygEditor
                            value={form.content}
                            onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                            placeholder="Write your email content here..."
                        />
                    </div>
                </Card>

                <Card title="Attachments">
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <HiUpload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to upload attachments</p>
                                    <p className="text-xs text-gray-400">PDF, DOC, XLS, ZIP, images up to 10MB</p>
                                </div>
                                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="space-y-2">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <HiPaperClip className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-700">{file.name}</span>
                                            <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                        <button type="button" onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-600">
                                            <HiX className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Tracking Options">
                    <div className="p-5 space-y-3">
                        {[
                            { key: 'enable_open_tracking', label: 'Track email opens' },
                            { key: 'enable_click_tracking', label: 'Track link clicks' },
                            { key: 'enable_unsubscribe_link', label: 'Include unsubscribe link' },
                            { key: 'enable_content_switching', label: 'Enable A/B content switching' },
                        ].map((opt) => (
                            <label key={opt.key} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name={opt.key}
                                    checked={form[opt.key]}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" href="/campaigns" type="button">Cancel</Button>
                    <Button type="submit" disabled={submitting || !form.name || form.sender_ids.length === 0}>
                        {submitting ? 'Creating...' : 'Create Campaign'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

CampaignsCreate.layout = (page) => <AppLayout>{page}</AppLayout>;

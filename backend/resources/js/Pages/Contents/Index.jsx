import { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiDocumentText, HiEye, HiX } from 'react-icons/hi';
import AppLayout from '../../Layouts/AppLayout';
import Card from '../../Components/Card';
import Button from '../../Components/Button';
import StatusBadge from '../../Components/StatusBadge';
import Modal from '../../Components/Modal';
import EmptyState from '../../Components/EmptyState';
import WysiwygEditor from '../../Components/WysiwygEditor';
import { useApi, useApiAction } from '../../hooks/useApi';

export default function ContentsIndex({ auth }) {
    const { data, loading, refetch } = useApi('/api/contents');
    const { execute, loading: actionLoading } = useApiAction();
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', subject: '', html_body: '', is_active: true });

    const contents = data?.data?.data || data?.data || [];

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', subject: '', html_body: '', is_active: true });
        setShowModal(true);
    };

    const openEdit = (content) => {
        setEditing(content);
        setForm({
            name: content.name || '',
            subject: content.subject || '',
            html_body: content.html_body || content.body || '',
            is_active: content.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, body: form.html_body };
            if (editing) {
                await execute('put', `/api/contents/${editing.id}`, payload);
            } else {
                await execute('post', '/api/contents', payload);
            }
            setShowModal(false);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this content? This cannot be undone.')) return;
        try {
            await execute('delete', `/api/contents/${id}`);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePreview = async (content) => {
        try {
            const res = await execute('get', `/api/contents/${content.id}`);
            setShowPreview(res?.data || content);
        } catch (err) {
            // Fallback to showing what we have
            setShowPreview(content);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Content</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage email content templates for campaigns</p>
                </div>
                <Button onClick={openCreate}>
                    <HiPlus className="h-4 w-4" /> New Content
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : contents.length === 0 ? (
                <Card><EmptyState icon={HiDocumentText} title="No content yet" description="Create email content templates to use in your campaigns." action={<Button onClick={openCreate}><HiPlus className="h-4 w-4" />New Content</Button>} /></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contents.map((content) => (
                        <Card key={content.id} className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{content.name || 'Untitled'}</h3>
                                    <p className="text-xs text-gray-400 mt-1 truncate">{content.subject || 'No subject'}</p>
                                </div>
                                <StatusBadge status={content.is_active ? 'active' : 'inactive'} label={content.is_active ? 'Active' : 'Inactive'} />
                            </div>
                            <div className="text-xs text-gray-400 mb-3">
                                {content.html_body || content.body
                                    ? `${(content.html_body || content.body || '').replace(/<[^>]*>/g, '').substring(0, 100)}...`
                                    : 'No content'}
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Button size="sm" variant="ghost" onClick={() => handlePreview(content)}>
                                    <HiEye className="h-3.5 w-3.5" /> Preview
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(content)}>
                                    <HiPencil className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(content.id)}>
                                    <HiTrash className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Content' : 'New Content'} maxWidth="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="e.g. Welcome Email, Newsletter Template"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line *</label>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            required
                            placeholder="Email subject line"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Body *</label>
                        <WysiwygEditor
                            value={form.html_body}
                            onChange={(html) => setForm({ ...form, html_body: html })}
                            placeholder="Write your email content here..."
                        />
                    </div>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Active (available for campaigns)</span>
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={actionLoading}>{editing ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal show={!!showPreview} onClose={() => setShowPreview(null)} title="Content Preview" maxWidth="max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Name</p>
                        <p className="font-medium text-gray-900">{showPreview?.name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Subject</p>
                        <p className="font-medium text-gray-900">{showPreview?.subject || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Body</p>
                        <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: showPreview?.html_body || showPreview?.body || '<p class="text-gray-400">No content</p>' }} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button variant="secondary" onClick={() => setShowPreview(null)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

ContentsIndex.layout = (page) => <AppLayout>{page}</AppLayout>;

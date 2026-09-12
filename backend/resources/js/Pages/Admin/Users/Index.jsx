import { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiUser, HiCheckCircle, HiXCircle, HiBan, HiLockOpen } from 'react-icons/hi';
import AppLayout from '../../../Layouts/AppLayout';
import Card from '../../../Components/Card';
import Button from '../../../Components/Button';
import StatusBadge from '../../../Components/StatusBadge';
import Modal from '../../../Components/Modal';
import Pagination from '../../../Components/Pagination';
import EmptyState from '../../../Components/EmptyState';
import { useApi, useApiAction } from '../../../hooks/useApi';

export default function AdminUsers({ auth }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const { data: usersData, loading, refetch } = useApi(`/api/admin/users?page=${page}`);
    const { execute, loading: actionLoading } = useApiAction();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'user' });
    const [banModal, setBanModal] = useState(null);
    const [banReason, setBanReason] = useState('');

    const users = usersData?.data?.data || usersData?.data || [];
    const pagination = usersData?.data || usersData;

    const openCreate = () => {
        setEditingUser(null);
        setForm({ name: '', username: '', email: '', password: '', role: 'user' });
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setForm({ name: user.name || '', username: user.username || '', email: user.email || '', password: '', role: user.role || 'user' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await execute('put', `/api/admin/users/${editingUser.id}`, payload);
            } else {
                await execute('post', `/api/admin/users`, form);
            }
            setShowModal(false);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
            await execute('delete', `/api/admin/users/${id}`);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleBan = async () => {
        if (!banModal) return;
        try {
            await execute('post', `/api/admin/users/${banModal.id}/ban`, { reason: banReason || undefined });
            setBanModal(null);
            setBanReason('');
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUnban = async (user) => {
        if (!confirm(`Unban ${user.name || user.email}? They will be able to send email again.`)) return;
        try {
            await execute('post', `/api/admin/users/${user.id}/unban`);
            refetch();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredUsers = users.filter((u) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage user accounts — banned users can login but cannot send email</p>
                </div>
                <Button onClick={openCreate}>
                    <HiPlus className="h-4 w-4" /> Add User
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : filteredUsers.length === 0 ? (
                <Card><EmptyState icon={HiUser} title="No users found" description="Add a user to get started." action={<Button onClick={openCreate}><HiPlus className="h-4 w-4" />Add User</Button>} /></Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaigns</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 ${user.banned ? 'bg-red-50' : ''}`}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
                                                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3"><StatusBadge status={user.role || 'user'} label={user.role || 'User'} /></td>
                                        <td className="px-5 py-3">
                                            {user.banned ? (
                                                <span className="inline-flex items-center gap-1 text-sm text-red-600 font-medium">
                                                    <HiBan className="h-4 w-4" /> Banned
                                                </span>
                                            ) : user.email_verified_at ? (
                                                <span className="inline-flex items-center gap-1 text-sm text-green-600"><HiCheckCircle className="h-4 w-4" /> Verified</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-sm text-yellow-600"><HiXCircle className="h-4 w-4" /> Pending</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-700">{user.campaigns_count || 0}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {user.banned ? (
                                                    <button onClick={() => handleUnban(user)} title="Unban user" className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                                                        <HiLockOpen className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    !user.hasRole?.('admin') && user.role !== 'admin' && (
                                                        <button onClick={() => { setBanModal(user); setBanReason(''); }} title="Ban user" className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                                            <HiBan className="h-4 w-4" />
                                                        </button>
                                                    )
                                                )}
                                                <button onClick={() => openEdit(user)} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded"><HiPencil className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(user.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded"><HiTrash className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination?.links && <div className="px-5 py-3 border-t border-gray-200"><Pagination links={pagination.links} /></div>}
                </Card>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Add User'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingUser && '(leave blank to keep)'}</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={actionLoading}>{editingUser ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal show={!!banModal} onClose={() => setBanModal(null)} title="Ban User">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        You are about to ban <strong>{banModal?.name || banModal?.email}</strong>.
                        They will still be able to login but will not be able to send email or create campaigns.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ban Reason (optional)</label>
                        <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            rows={3}
                            placeholder="Reason for banning this user..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setBanModal(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleBan} disabled={actionLoading}>
                            <HiBan className="h-4 w-4" /> Ban User
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

AdminUsers.layout = (page) => <AppLayout>{page}</AppLayout>;

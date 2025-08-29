import React, { useState, useEffect } from 'react';
import {
    HiPlus as Plus,
    HiCog as Settings,
    HiTrash as Trash2,
    HiCheckCircle as CheckCircle,
    HiExclamationCircle as AlertCircle,
    HiWifi as Wifi,
    HiX as WifiOff,
    HiChevronDown as ChevronDown,
    HiChevronUp as ChevronUp,
    HiServer as Server
} from 'react-icons/hi';
import { bounceCredentialService } from '../../services/api';
import toast from 'react-hot-toast';
import BounceCredentialForm from './BounceCredentialForm';
import TestConnectionModal from './TestConnectionModal';

const BounceCredentials = () => {
    const [credentials, setCredentials] = useState([]);
    const [domains, setDomains] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCredential, setEditingCredential] = useState(null);
    const [testingCredential, setTestingCredential] = useState(null);
    const [expandedCard, setExpandedCard] = useState(null);
    const [filterDomain, setFilterDomain] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [credentialsData, domainsData, statsData] = await Promise.all([
                bounceCredentialService.getBounceCredentials(),
                bounceCredentialService.getUserDomains(),
                bounceCredentialService.getStatistics()
            ]);

            setCredentials(credentialsData.data || []);
            setDomains(domainsData.data || []);
            setStatistics(statsData.data || {});
        } catch (err) {
            setError(err.message);
            toast.error('Failed to load bounce credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingCredential(null);
        setShowForm(true);
    };

    const handleEdit = (credential) => {
        setEditingCredential(credential);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this bounce credential?')) {
            return;
        }

        try {
            await bounceCredentialService.deleteBounceCredential(id);
            toast.success('Bounce credential deleted successfully');
            loadData();
        } catch (_err) {
            toast.error('Failed to delete bounce credential');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await bounceCredentialService.setAsDefault(id);
            toast.success('Credential set as default successfully');
            loadData();
        } catch (_err) {
            toast.error('Failed to set credential as default');
        }
    };

    const handleTestConnection = (credential) => {
        setTestingCredential(credential);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingCredential) {
                await bounceCredentialService.updateBounceCredential(editingCredential.id, formData);
                toast.success('Bounce credential updated successfully');
            } else {
                await bounceCredentialService.createBounceCredential(formData);
                toast.success('Bounce credential created successfully');
            }
            setShowForm(false);
            setEditingCredential(null);
            loadData();
        } catch (_err) {
            toast.error('Failed to save bounce credential');
        }
    };

    const filteredCredentials = credentials.filter(credential => {
        if (filterDomain === 'all') return true;
        if (filterDomain === 'default') return !credential.domain_id;
        return credential.domain_id?.toString() === filterDomain;
    });

    const getConnectionIcon = (credential) => {
        if (credential.last_error) {
            return <WifiOff className="w-4 h-4 text-red-500" />;
        }
        return <Wifi className="w-4 h-4 text-green-500" />;
    };

    const getProtocolColor = (protocol) => {
        return protocol === 'IMAP' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bounce Processing Credentials</h1>
                    <p className="text-gray-600 mt-2">
                        Manage IMAP/POP3 credentials for automatic bounce processing
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Credential
                </button>
            </div>

            {/* Statistics */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-blue-500" />
                            <span className="text-sm font-medium text-gray-600">Total Credentials</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {statistics.total_credentials || 0}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-gray-600">Active</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {statistics.active_credentials || 0}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-600">Processed (30d)</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {statistics.last_30_days?.total_processed || 0}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-gray-600">Errors (30d)</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {statistics.last_30_days?.total_errors || 0}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by domain:</label>
                    <select
                        value={filterDomain}
                        onChange={(e) => setFilterDomain(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                        <option value="all">All domains</option>
                        <option value="default">Default (no domain)</option>
                        {domains.map(domain => (
                            <option key={domain.id} value={domain.id.toString()}>
                                {domain.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Credentials List */}
            <div className="space-y-4">
                {filteredCredentials.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border">
                        <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No bounce credentials</h3>
                        <p className="text-gray-600 mb-4">
                            Create your first bounce processing credential to get started.
                        </p>
                        <button
                            onClick={handleCreate}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Add First Credential
                        </button>
                    </div>
                ) : (
                    filteredCredentials.map(credential => (
                        <div key={credential.id} className="bg-white rounded-lg border overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getConnectionIcon(credential)}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-gray-900">
                                                    {credential.domain ? credential.domain.name : 'Default Credential'}
                                                </h3>
                                                {credential.is_default && (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                        Default
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-1 rounded-full ${getProtocolColor(credential.protocol)}`}>
                                                    {credential.protocol}
                                                </span>
                                                {!credential.is_active && (
                                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {credential.email} ({credential.username}@{credential.host}:{credential.port})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleTestConnection(credential)}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                            title="Test connection"
                                        >
                                            <Wifi className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(credential)}
                                            className="text-gray-600 hover:text-gray-800 p-1"
                                            title="Edit credential"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(credential.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Delete credential"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setExpandedCard(expandedCard === credential.id ? null : credential.id)}
                                            className="text-gray-600 hover:text-gray-800 p-1"
                                        >
                                            {expandedCard === credential.id ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {expandedCard === credential.id && (
                                    <div className="mt-4 pt-4 border-t space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <label className="font-medium text-gray-700">Last Checked:</label>
                                                <p className="text-gray-600">
                                                    {credential.last_checked_at
                                                        ? new Date(credential.last_checked_at).toLocaleString()
                                                        : 'Never'
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-700">Processed Count:</label>
                                                <p className="text-gray-600">{credential.processed_count || 0}</p>
                                            </div>
                                        </div>

                                        {credential.last_error && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                <h4 className="font-medium text-red-800 text-sm">Last Error:</h4>
                                                <p className="text-red-700 text-sm mt-1">{credential.last_error}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {!credential.is_default && !credential.domain_id && (
                                                <button
                                                    onClick={() => handleSetDefault(credential.id)}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            {showForm && (
                <BounceCredentialForm
                    credential={editingCredential}
                    domains={domains}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingCredential(null);
                    }}
                />
            )}

            {testingCredential && (
                <TestConnectionModal
                    credential={testingCredential}
                    onClose={() => setTestingCredential(null)}
                />
            )}
        </div>
    );
};

export default BounceCredentials;

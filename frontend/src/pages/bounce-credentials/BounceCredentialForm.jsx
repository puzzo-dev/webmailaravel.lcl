import React, { useState, useEffect } from 'react';
import { HiX as X, HiEye as Eye, HiEyeOff as EyeOff, HiExclamationCircle as AlertCircle } from 'react-icons/hi';

const BounceCredentialForm = ({ credential, domains, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        protocol: 'IMAP',
        host: '',
        port: 993,
        email: '',
        username: '',
        password: '',
        encryption: 'SSL',
        domain_id: '',
        is_active: true,
        is_default: false,
        inbox_folder: 'INBOX',
        processed_folder: 'Processed'
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (credential) {
            setFormData({
                protocol: credential.protocol || 'IMAP',
                host: credential.host || '',
                port: credential.port || 993,
                email: credential.email || '',
                username: credential.username || '',
                password: '', // Don't populate password for security
                encryption: credential.encryption || 'SSL',
                domain_id: credential.domain_id || '',
                is_active: credential.is_active !== undefined ? credential.is_active : true,
                is_default: credential.is_default || false,
                inbox_folder: credential.inbox_folder || 'INBOX',
                processed_folder: credential.processed_folder || 'Processed'
            });
        }
    }, [credential]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.host.trim()) {
            newErrors.host = 'Host is required';
        }

        if (!formData.port || formData.port < 1 || formData.port > 65535) {
            newErrors.port = 'Port must be between 1 and 65535';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!credential && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        if (!formData.inbox_folder.trim()) {
            newErrors.inbox_folder = 'Inbox folder is required';
        }

        if (!formData.processed_folder.trim()) {
            newErrors.processed_folder = 'Processed folder is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Don't send empty password for updates
            const submitData = { ...formData };
            if (credential && !submitData.password.trim()) {
                delete submitData.password;
            }

            // Convert domain_id to null if empty
            if (!submitData.domain_id) {
                submitData.domain_id = null;
            }

            await onSubmit(submitData);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProtocolChange = (protocol) => {
        const defaultPorts = {
            'IMAP': 993,
            'POP3': 995
        };
        
        setFormData(prev => ({
            ...prev,
            protocol,
            port: defaultPorts[protocol],
            encryption: 'SSL'
        }));
    };

    const handleEncryptionChange = (encryption) => {
        const defaultPorts = {
            'IMAP': {
                'SSL': 993,
                'TLS': 143,
                'None': 143
            },
            'POP3': {
                'SSL': 995,
                'TLS': 110,
                'None': 110
            }
        };
        
        setFormData(prev => ({
            ...prev,
            encryption,
            port: defaultPorts[prev.protocol][encryption]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {credential ? 'Edit Bounce Credential' : 'Create Bounce Credential'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Domain Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Domain
                        </label>
                        <select
                            value={formData.domain_id}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                domain_id: e.target.value,
                                is_default: e.target.value ? false : prev.is_default 
                            }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Default (applies to all domains)</option>
                            {domains.map(domain => (
                                <option key={domain.id} value={domain.id}>
                                    {domain.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to create a default credential that applies to all domains
                        </p>
                    </div>

                    {/* Protocol */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Protocol
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="IMAP"
                                    checked={formData.protocol === 'IMAP'}
                                    onChange={(e) => handleProtocolChange(e.target.value)}
                                    className="mr-2"
                                />
                                IMAP (recommended)
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="POP3"
                                    checked={formData.protocol === 'POP3'}
                                    onChange={(e) => handleProtocolChange(e.target.value)}
                                    className="mr-2"
                                />
                                POP3
                            </label>
                        </div>
                    </div>

                    {/* Connection Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Host *
                            </label>
                            <input
                                type="text"
                                value={formData.host}
                                onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.host ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="mail.example.com"
                            />
                            {errors.host && (
                                <p className="text-red-600 text-xs mt-1">{errors.host}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Port *
                            </label>
                            <input
                                type="number"
                                value={formData.port}
                                onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 993 }))}
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.port ? 'border-red-300' : 'border-gray-300'
                                }`}
                                min="1"
                                max="65535"
                            />
                            {errors.port && (
                                <p className="text-red-600 text-xs mt-1">{errors.port}</p>
                            )}
                        </div>
                    </div>

                    {/* Encryption */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Encryption
                        </label>
                        <select
                            value={formData.encryption}
                            onChange={(e) => handleEncryptionChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="SSL">SSL/TLS</option>
                            <option value="TLS">STARTTLS</option>
                            <option value="None">None (not recommended)</option>
                        </select>
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bounce Email Address *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.email ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="bounces@example.com"
                        />
                        {errors.email && (
                            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            This email address will be used to receive bounce notifications
                        </p>
                    </div>

                    {/* Login Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Login Username *
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.username ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="mail username (often same as email)"
                            />
                            {errors.username && (
                                <p className="text-red-600 text-xs mt-1">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password {credential ? '' : '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder={credential ? 'Leave empty to keep current' : 'Enter password'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
                            )}
                        </div>
                    </div>

                    {/* Folder Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Inbox Folder *
                            </label>
                            <input
                                type="text"
                                value={formData.inbox_folder}
                                onChange={(e) => setFormData(prev => ({ ...prev, inbox_folder: e.target.value }))}
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.inbox_folder ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="INBOX"
                            />
                            {errors.inbox_folder && (
                                <p className="text-red-600 text-xs mt-1">{errors.inbox_folder}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Processed Folder *
                            </label>
                            <input
                                type="text"
                                value={formData.processed_folder}
                                onChange={(e) => setFormData(prev => ({ ...prev, processed_folder: e.target.value }))}
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.processed_folder ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Processed"
                            />
                            {errors.processed_folder && (
                                <p className="text-red-600 text-xs mt-1">{errors.processed_folder}</p>
                            )}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Active</span>
                        </label>

                        {!formData.domain_id && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Set as default credential</span>
                            </label>
                        )}
                    </div>

                    {/* Warning for domain-specific credentials */}
                    {formData.domain_id && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium">Domain-specific credential</p>
                                <p>This credential will only be used for bounce processing of the selected domain. It will override any default credentials for this domain.</p>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (credential ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BounceCredentialForm;

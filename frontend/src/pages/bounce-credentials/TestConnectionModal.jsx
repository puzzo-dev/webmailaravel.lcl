import React, { useState } from 'react';
import { HiX as X, HiCheckCircle as CheckCircle, HiXCircle as XCircle, HiRefresh as Loader, HiWifi as Wifi } from 'react-icons/hi';
import { bounceCredentialService } from '../../services/api';

const TestConnectionModal = ({ credential, onClose }) => {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState(null);

    const handleTest = async () => {
        setTesting(true);
        setResult(null);

        try {
            const response = await bounceCredentialService.testConnection(credential.id);
            setResult(response.data);
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Connection test failed',
                details: error.response?.data?.data || null
            });
        } finally {
            setTesting(false);
        }
    };

    React.useEffect(() => {
        // Auto-start test when modal opens
        handleTest();
    }, []);

    const getStatusIcon = () => {
        if (testing) {
            return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
        }
        if (result?.success) {
            return <CheckCircle className="w-6 h-6 text-green-500" />;
        }
        if (result && !result.success) {
            return <XCircle className="w-6 h-6 text-red-500" />;
        }
        return <Wifi className="w-6 h-6 text-gray-400" />;
    };

    const getStatusMessage = () => {
        if (testing) {
            return 'Testing connection...';
        }
        if (result?.success) {
            return result.message || 'Connection successful!';
        }
        if (result && !result.success) {
            return result.message || 'Connection failed';
        }
        return 'Ready to test connection';
    };

    const getStatusColor = () => {
        if (testing) return 'text-blue-600';
        if (result?.success) return 'text-green-600';
        if (result && !result.success) return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Test Connection
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Credential Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-gray-900 mb-2">
                            {credential.domain ? credential.domain.name : 'Default Credential'}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Email:</span> {credential.email}</p>
                            <p><span className="font-medium">Protocol:</span> {credential.protocol}</p>
                            <p><span className="font-medium">Host:</span> {credential.host}:{credential.port}</p>
                            <p><span className="font-medium">Username:</span> {credential.username}</p>
                            <p><span className="font-medium">Encryption:</span> {credential.encryption}</p>
                        </div>
                    </div>

                    {/* Test Status */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            {getStatusIcon()}
                        </div>
                        <h3 className={`text-lg font-medium ${getStatusColor()}`}>
                            {getStatusMessage()}
                        </h3>
                    </div>

                    {/* Test Results */}
                    {result && (
                        <div className="space-y-4">
                            {result.success ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-medium text-green-800 mb-2">Connection Details</h4>
                                    <div className="text-sm text-green-700 space-y-1">
                                        {result.server_info && (
                                            <p><span className="font-medium">Server:</span> {result.server_info}</p>
                                        )}
                                        {result.folders && (
                                            <div>
                                                <p className="font-medium">Available folders:</p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    {result.folders.map((folder, index) => (
                                                        <li key={index} className="text-xs">{folder}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {result.inbox_count !== undefined && (
                                            <p><span className="font-medium">Messages in inbox:</span> {result.inbox_count}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-medium text-red-800 mb-2">Connection Error</h4>
                                    <p className="text-sm text-red-700 mb-2">{result.message}</p>
                                    
                                    {result.details && (
                                        <div className="text-xs text-red-600 bg-red-100 rounded p-2 mt-2">
                                            <p className="font-medium">Technical details:</p>
                                            <pre className="whitespace-pre-wrap mt-1">{result.details}</pre>
                                        </div>
                                    )}

                                    {/* Common troubleshooting tips */}
                                    <div className="mt-4 text-sm text-red-700">
                                        <p className="font-medium">Common solutions:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                                            <li>Verify the host and port are correct</li>
                                            <li>Check that the username and password are valid</li>
                                            <li>Ensure the mail server allows IMAP/POP3 connections</li>
                                            <li>Try different encryption settings (SSL, TLS, None)</li>
                                            <li>Check if the server requires app-specific passwords</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        {!testing && (
                            <button
                                onClick={handleTest}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Test Again
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestConnectionModal;

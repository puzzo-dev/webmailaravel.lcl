import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlus,
  HiTrash,
  HiDownload,
  HiEye,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiInformationCircle,
  HiShieldCheck,
  HiCog,
  HiDatabase,
  HiCloud,
  HiRefresh,
} from 'react-icons/hi';
import { formatDate, formatFileSize } from '../../utils/helpers';

const AdminBackups = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [newBackupDescription, setNewBackupDescription] = useState('');

  // Mock data - replace with actual API calls
  const backups = [
    {
      id: 1,
      filename: 'backup_2024-01-15_10-30-45.sql',
      path: '/storage/backups/backup_2024-01-15_10-30-45.sql',
      size: 52428800, // 50MB
      description: 'Daily backup before system update',
      created_by: 1,
      created_at: '2024-01-15T10:30:45Z',
      restored_at: null,
      restored_by: null,
      status: 'completed',
    },
    {
      id: 2,
      filename: 'backup_2024-01-14_10-30-45.sql',
      path: '/storage/backups/backup_2024-01-14_10-30-45.sql',
      size: 51200000, // 49MB
      description: 'Daily backup',
      created_by: 1,
      created_at: '2024-01-14T10:30:45Z',
      restored_at: '2024-01-15T09:15:30Z',
      restored_by: 1,
      status: 'restored',
    },
    {
      id: 3,
      filename: 'backup_2024-01-13_10-30-45.sql',
      path: '/storage/backups/backup_2024-01-13_10-30-45.sql',
      size: 49800000, // 47MB
      description: 'Daily backup',
      created_by: 1,
      created_at: '2024-01-13T10:30:45Z',
      restored_at: null,
      restored_by: null,
      status: 'completed',
    },
  ];

  const statistics = {
    total_backups: 15,
    total_size: 750000000, // 715MB
    last_backup: '2024-01-15T10:30:45Z',
    backup_frequency: 'daily',
    retention_days: 30,
  };

  const handleCreateBackup = async () => {
    if (!newBackupDescription.trim()) return;
    
    setIsLoading(true);
    try {
      // Implement create backup API call
      console.log('Creating backup:', newBackupDescription);
      setShowCreateModal(false);
      setNewBackupDescription('');
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = async (backupId) => {
    setIsLoading(true);
    try {
      // Implement download backup API call
      console.log('Downloading backup:', backupId);
    } catch (error) {
      console.error('Failed to download backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    if (!confirm(`Are you sure you want to restore from backup "${selectedBackup.filename}"? This will overwrite current data.`)) return;
    
    setIsLoading(true);
    try {
      // Implement restore backup API call
      console.log('Restoring backup:', selectedBackup.id);
      setShowRestoreModal(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Failed to restore backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      // Implement delete backup API call
      console.log('Deleting backup:', backupId);
    } catch (error) {
      console.error('Failed to delete backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'restored':
        return 'info';
      case 'failed':
        return 'danger';
      case 'in_progress':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <HiCheckCircle className="h-4 w-4" />;
      case 'restored':
        return <HiRefresh className="h-4 w-4" />;
      case 'failed':
        return <HiXCircle className="h-4 w-4" />;
      case 'in_progress':
        return <HiClock className="h-4 w-4" />;
      default:
        return <HiClock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
            <p className="text-gray-600 mt-1">Create, restore, and manage system backups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isLoading}
            className="btn btn-primary flex items-center"
          >
            <HiPlus className="h-5 w-5 mr-2" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <HiDatabase className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_backups}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-info-100 rounded-lg flex items-center justify-center">
                <HiCloud className="h-5 w-5 text-info-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(statistics.total_size)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
                <HiClock className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Backup</p>
              <p className="text-2xl font-bold text-gray-900">{formatDate(statistics.last_backup)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <HiExclamation className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Retention</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.retention_days} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">System Backups</h3>
            <button
              onClick={() => window.location.reload()}
              disabled={isLoading}
              className="btn btn-secondary btn-sm flex items-center"
            >
              <HiRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restored
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{backup.filename}</div>
                      {backup.description && (
                        <div className="text-sm text-gray-500">{backup.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(backup.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(backup.status)}-100 text-${getStatusColor(backup.status)}-800`}>
                      {getStatusIcon(backup.status)}
                      <span className="ml-1">{backup.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.restored_at ? (
                      <div>
                        <div>{formatDate(backup.restored_at)}</div>
                        <div className="text-xs text-gray-500">by User #{backup.restored_by}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not restored</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownloadBackup(backup.id)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Download"
                      >
                        <HiDownload className="h-4 w-4" />
                      </button>
                      {backup.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRestoreModal(true);
                          }}
                          className="text-info-600 hover:text-info-900"
                          title="Restore"
                        >
                          <HiRefresh className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-danger-600 hover:text-danger-900"
                        title="Delete"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Backup</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newBackupDescription}
                    onChange={(e) => setNewBackupDescription(e.target.value)}
                    placeholder="Enter a description for this backup..."
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <HiInformationCircle className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Backup Information</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• Database will be backed up</p>
                        <p>• Backup will be stored securely</p>
                        <p>• Process may take several minutes</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBackup}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Creating...' : 'Create Backup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Restore Backup</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup File
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedBackup.filename}
                  </p>
                </div>
                {selectedBackup.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {selectedBackup.description}
                    </p>
                  </div>
                )}
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <HiExclamation className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Warning</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>• This will overwrite current data</p>
                        <p>• The process cannot be undone</p>
                        <p>• Make sure you have a recent backup</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRestoreModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestoreBackup}
                    disabled={isLoading}
                    className="btn btn-danger"
                  >
                    {isLoading ? 'Restoring...' : 'Restore Backup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackups; 
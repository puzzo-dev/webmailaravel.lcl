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
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';

const AdminBackups = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [newBackupDescription, setNewBackupDescription] = useState('');

  // Real data from API
  const [backups, setBackups] = useState([]);
  const [statistics, setStatistics] = useState({
    total_backups: 0,
    total_size: 0,
    last_backup: null,
    backup_frequency: 'daily',
    retention_days: 30,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user has admin access
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBackups();
      fetchStatistics();
    }
  }, [user]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getBackups();
      // Handle both possible response structures
      const backupsData = response.data || response || [];
      setBackups(backupsData);
    } catch (error) {
      setError('Failed to load backups');
      toast.error('Failed to load backups');
      console.error('Backups fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await adminService.getBackupStatistics();
      // Handle both possible response structures
      const statsData = response.data || response || {
        total_backups: 0,
        total_size: 0,
        last_backup: null,
        backup_frequency: 'daily',
        retention_days: 30,
      };
      setStatistics(statsData);
    } catch (error) {
      console.error('Statistics fetch error:', error);
      // Use default statistics if API fails
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const backupData = {};
      if (newBackupDescription.trim()) {
        backupData.description = newBackupDescription.trim();
      }
      
      const result = await adminService.createBackup(backupData);
      
      toast.success('Backup created successfully');
      setShowCreateModal(false);
      setNewBackupDescription('');
      // Refresh data
      await fetchBackups();
      await fetchStatistics();
    } catch (error) {
      console.error('Failed to create backup - full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to create backup: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = async (backupId) => {
    setIsLoading(true);
    try {
      const blob = await adminService.downloadBackup(backupId);
      
      // Verify we received a blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format - expected blob');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backupId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Backup downloaded successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to download backup: ${errorMessage}`);
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
      await adminService.restoreBackup(selectedBackup.id);
      toast.success('Backup restored successfully');
      setShowRestoreModal(false);
      setSelectedBackup(null);
      // Refresh data
      await fetchBackups();
      await fetchStatistics();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to restore backup: ${errorMessage}`);
      console.error('Failed to restore backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      await adminService.deleteBackup(backupId);
      toast.success('Backup deleted successfully');
      // Refresh data
      await fetchBackups();
      await fetchStatistics();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to delete backup: ${errorMessage}`);
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

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamation className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to manage backups.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
              <p className="text-2xl font-bold text-gray-900">{statistics.total_backups || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(statistics.total_size || 0)}</p>
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
              <p className="text-2xl font-bold text-gray-900">
                {statistics.last_backup?.created_at ? formatDate(statistics.last_backup.created_at) : 'Never'}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">{statistics.retention_days || 30} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiXCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backups Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">System Backups</h3>
            <button
              onClick={fetchBackups}
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
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No backups found
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(backup.status || 'completed')}-100 text-${getStatusColor(backup.status || 'completed')}-800`}>
                      {getStatusIcon(backup.status || 'completed')}
                      <span className="ml-1">{backup.status || 'completed'}</span>
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
                      {(backup.status === 'completed' || !backup.status) && (
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
                ))
              )}
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
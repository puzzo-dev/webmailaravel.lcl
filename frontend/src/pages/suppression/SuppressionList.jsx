import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiUpload,
  HiDownload,
  HiPlus,
  HiTrash,
  HiEye,
  HiSearch,
  HiFilter,
  HiX,
  HiCheckCircle,
  HiExclamationCircle,
  HiDocumentText,
  HiMail,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import {
  fetchSuppressionList,
  fetchSuppressionStatistics,
  importSuppressionList,
  removeEmailFromSuppression,
  exportSuppressionList,
} from '../../store/slices/suppressionSlice';

const SuppressionList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { list = [], statistics = {}, pagination = {}, isLoading = false, isImporting = false, isExporting = false, error = null } = useSelector((state) => state.suppression || {});
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadReason, setUploadReason] = useState('bounce');

  useEffect(() => {
    dispatch(fetchSuppressionList());
    dispatch(fetchSuppressionStatistics());
  }, [dispatch]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('reason', uploadReason);
    
    try {
      await dispatch(importSuppressionList(formData)).unwrap();
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadReason('bounce');
      // Refresh statistics
      dispatch(fetchSuppressionStatistics());
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail) return;
    
    try {
      const emailData = {
        email: newEmail,
        reason: 'manual',
        source: 'manual',
      };
      
      // Add email to suppression list
      await dispatch(importSuppressionList({ emails: [emailData] })).unwrap();
      setShowAddModal(false);
      setNewEmail('');
      // Refresh statistics
      dispatch(fetchSuppressionStatistics());
    } catch (error) {
      console.error('Add email failed:', error);
    }
  };

  const handleRemoveEmail = async (emailId) => {
    try {
      const email = list.find(e => e.id === emailId);
      if (email) {
        await dispatch(removeEmailFromSuppression({ email: email.email })).unwrap();
        // Refresh list and statistics
        dispatch(fetchSuppressionList());
        dispatch(fetchSuppressionStatistics());
      }
    } catch (error) {
      console.error('Remove email failed:', error);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      await dispatch(exportSuppressionList({ format })).unwrap();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const filteredEmails = (Array.isArray(list) ? list : []).filter(email =>
    email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (email.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamationCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Suppression list management is restricted to administrators only. 
                  This ensures system-wide compliance and prevents reputation damage.
                </p>
                <p className="mt-2">
                  <strong>Note:</strong> All campaigns automatically use the system-wide suppression list 
                  to prevent sending to suppressed email addresses.
                </p>
              </div>
            </div>
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
            <h1 className="text-2xl font-bold text-gray-900">System Suppression List</h1>
            <p className="text-gray-600 mt-1">
              Manage the system-wide email suppression list. All campaigns automatically use this list.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary flex items-center"
              disabled={isImporting}
            >
              <HiUpload className="h-5 w-5 mr-2" />
              {isImporting ? 'Uploading...' : 'Upload List'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-secondary flex items-center"
            >
              <HiPlus className="h-5 w-5 mr-2" />
              Add Email
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <HiMail className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Suppressed</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : formatNumber(statistics?.totalSuppressed || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-danger-100 rounded-lg flex items-center justify-center">
                <HiExclamationCircle className="h-5 w-5 text-danger-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bounces</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : formatNumber(statistics?.totalBounces || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <HiExclamationCircle className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Complaints</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : formatNumber(statistics?.totalComplaints || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-info-100 rounded-lg flex items-center justify-center">
                <HiCheckCircle className="h-5 w-5 text-info-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unsubscribes</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : formatNumber(statistics?.totalUnsubscribes || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamationCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Suppressed Emails</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={() => handleExport('csv')}
                className="btn btn-secondary flex items-center"
                disabled={isExporting}
              >
                <HiDownload className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmails.map((email) => (
                <tr key={email.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {email.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      email.reason === 'bounce'
                        ? 'bg-danger-100 text-danger-800'
                        : email.reason === 'complaint'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-info-100 text-info-800'
                    }`}>
                      {email.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(email.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {email.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      email.status === 'active'
                        ? 'bg-success-100 text-success-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRemoveEmail(email.id)}
                      className="text-danger-600 hover:text-danger-900"
                      disabled={isLoading}
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Suppression List</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File (TXT, CSV, XLS, XLSX)
                  </label>
                  <input
                    type="file"
                    accept=".txt,.csv,.xls,.xlsx"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <select
                    value={uploadReason}
                    onChange={(e) => setUploadReason(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="bounce">Bounce</option>
                    <option value="complaint">Complaint</option>
                    <option value="unsubscribe">Unsubscribe</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="btn btn-secondary"
                    disabled={isImporting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile || isImporting}
                    className="btn btn-primary"
                  >
                    {isImporting ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Email Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Email to Suppression List</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEmail}
                    disabled={!newEmail || isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Adding...' : 'Add Email'}
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

export default SuppressionList;
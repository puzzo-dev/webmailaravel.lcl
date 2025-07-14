import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSenders,
  createSender,
  updateSender,
  deleteSender,
  testSenderConnection,
  clearError,
} from '../../store/slices/senderSlice';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiCheckCircle,
  HiXCircle,
  HiMail,
  HiShieldCheck,
  HiCog,
  HiPlay,
} from 'react-icons/hi';
import { formatDate } from '../../utils/helpers';

const Senders = () => {
  const dispatch = useDispatch();
  const { senders, isLoading, error } = useSelector((state) => state.senders);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedSender, setSelectedSender] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_name: '',
    reply_to: '',
  });

  useEffect(() => {
    dispatch(fetchSenders());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAddSender = async () => {
    try {
      await dispatch(createSender(formData)).unwrap();
      toast.success('Sender added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to add sender');
    }
  };

  const handleEditSender = async () => {
    try {
      await dispatch(updateSender({ id: selectedSender.id, data: formData })).unwrap();
      toast.success('Sender updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to update sender');
    }
  };

  const handleDeleteSender = async (senderId) => {
    if (!confirm('Are you sure you want to delete this sender?')) return;
    
    setIsLoading(true);
    try {
      // Implement delete sender logic
      console.log('Deleting sender:', senderId);
    } catch (error) {
      console.error('Delete sender failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      // Implement test connection logic
      console.log('Testing connection:', formData);
      setShowTestModal(false);
    } catch (error) {
      console.error('Test connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      smtp_host: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
      smtp_encryption: 'tls',
      from_name: '',
      reply_to: '',
    });
  };

  const openEditModal = (sender) => {
    setSelectedSender(sender);
    setFormData({
      name: sender.name,
      email: sender.email,
      smtp_host: sender.smtp_host,
      smtp_port: sender.smtp_port,
      smtp_username: sender.smtp_username || '',
      smtp_password: '',
      smtp_encryption: sender.smtp_encryption,
      from_name: sender.from_name,
      reply_to: sender.reply_to,
    });
    setShowEditModal(true);
  };

  const openTestModal = (sender) => {
    setSelectedSender(sender);
    setFormData({
      name: sender.name,
      email: sender.email,
      smtp_host: sender.smtp_host,
      smtp_port: sender.smtp_port,
      smtp_username: sender.smtp_username || '',
      smtp_password: '',
      smtp_encryption: sender.smtp_encryption,
      from_name: sender.from_name,
      reply_to: sender.reply_to,
    });
    setShowTestModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sender Management</h1>
            <p className="text-gray-600 mt-1">Manage your sender accounts and SMTP configurations</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <HiPlus className="h-5 w-5 mr-2" />
            Add Sender
          </button>
        </div>
      </div>

      {/* Senders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {senders.map((sender) => (
          <div key={sender.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <HiMail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{sender.name}</h3>
                    <p className="text-sm text-gray-500">{sender.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sender.status === 'active'
                    ? 'bg-success-100 text-success-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {sender.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Daily Limit:</span>
                  <span className="font-medium">{formatNumber(sender.daily_limit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sent Today:</span>
                  <span className="font-medium">{formatNumber(sender.sent_today)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reputation Score:</span>
                  <span className="font-medium">{sender.reputation_score}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Used:</span>
                  <span className="font-medium">{formatDate(sender.last_used)}</span>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button
                  onClick={() => openTestModal(sender)}
                  className="flex-1 btn btn-secondary btn-sm flex items-center justify-center"
                >
                  <HiPlay className="h-4 w-4 mr-1" />
                  Test
                </button>
                <button
                  onClick={() => openEditModal(sender)}
                  className="flex-1 btn btn-secondary btn-sm flex items-center justify-center"
                >
                  <HiPencil className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSender(sender.id)}
                  className="btn btn-danger btn-sm flex items-center justify-center"
                >
                  <HiTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Sender Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Sender</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={formData.smtp_host}
                      onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={formData.smtp_port}
                      onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={formData.smtp_username}
                      onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      value={formData.smtp_password}
                      onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encryption
                    </label>
                    <select
                      value={formData.smtp_encryption}
                      onChange={(e) => setFormData({ ...formData, smtp_encryption: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={formData.from_name}
                      onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    value={formData.reply_to}
                    onChange={(e) => setFormData({ ...formData, reply_to: e.target.value })}
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
                    onClick={handleAddSender}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Adding...' : 'Add Sender'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sender Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Sender</h3>
              <div className="space-y-4">
                {/* Same form fields as Add Modal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={formData.smtp_host}
                      onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={formData.smtp_port}
                      onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={formData.smtp_username}
                      onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      value={formData.smtp_password}
                      onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encryption
                    </label>
                    <select
                      value={formData.smtp_encryption}
                      onChange={(e) => setFormData({ ...formData, smtp_encryption: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={formData.from_name}
                      onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    value={formData.reply_to}
                    onChange={(e) => setFormData({ ...formData, reply_to: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSender}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Connection Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test SMTP Connection</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This will test the SMTP connection for <strong>{selectedSender?.name}</strong>.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTestModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Testing...' : 'Test Connection'}
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

export default Senders; 
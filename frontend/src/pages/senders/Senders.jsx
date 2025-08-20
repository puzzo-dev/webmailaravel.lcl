import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  HiGlobe,
  HiUser,
  HiInformationCircle,
} from 'react-icons/hi';
import { formatDate } from '../../utils/helpers';
import { formatNumber } from '../../utils/format';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHandler';
import { 
  fetchSenders, 
  createSender, 
  updateSender, 
  deleteSender, 
  testSenderConnection 
} from '../../store/slices/senderSlice';
import { fetchDomains } from '../../store/slices/domainsSlice';
import SmartForm from '../../components/SmartForm';

const Senders = () => {
  const dispatch = useDispatch();
  const { senders = [], isLoading = false } = useSelector((state) => state.senders || {});
  const { domains = [], isLoading: isDomainsLoading } = useSelector((state) => state.domains || {});
  const { user, currentView } = useSelector((state) => state.auth || {});

  // Ensure domains is always an array
  const safeDomains = Array.isArray(domains) ? domains : [];

  // Filter domains and senders based on current view
  const isAdminView = currentView === 'admin';
  const isAdmin = user?.role === 'admin';
  
  // In user view, only show domains and senders that belong to the current user
  // In admin view, show all domains and senders
  const filteredDomains = isAdmin && isAdminView 
    ? safeDomains 
    : safeDomains.filter(domain => domain.user_id === user?.id);
    
  const filteredSenders = isAdmin && isAdminView 
    ? senders 
    : senders.filter(sender => {
        // Find the domain for this sender
        const senderDomain = safeDomains.find(domain => domain.id === sender.domain_id);
        return senderDomain && senderDomain.user_id === user?.id;
      });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedSender, setSelectedSender] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain_id: '',
    from_name: '',
    reply_to: '',
  });

  useEffect(() => {
    dispatch(fetchSenders());
    dispatch(fetchDomains());
  }, [dispatch]);

  const validation = {
    name: { required: true, minLength: 2 },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: 'Please enter a valid email address' 
    },
    domain_id: { required: true },
    from_name: { required: true },
  };

  const handleAddSender = async (data) => {
    setIsSubmitting(true);
    try {
      await dispatch(createSender(data)).unwrap();
      toast.success('Sender added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSender = async (data) => {
    setIsSubmitting(true);
    try {
      await dispatch(updateSender({ id: selectedSender.id, ...data })).unwrap();
      toast.success('Sender updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSender = async (senderId) => {
    if (!confirm('Are you sure you want to delete this sender?')) return;
    
    setIsSubmitting(true);
    try {
      await dispatch(deleteSender(senderId)).unwrap();
      toast.success('Sender deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(testSenderConnection({ 
        id: selectedSender.id, 
        test_email: selectedSender.email 
      })).unwrap();
      toast.success('Connection test successful');
      setShowTestModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      domain_id: '',
      from_name: '',
      reply_to: '',
    });
  };

  const openEditModal = (sender) => {
    setSelectedSender(sender);
    setFormData({
      name: sender.name,
      email: sender.email,
      domain_id: sender.domain_id,
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
      domain_id: sender.domain_id,
      from_name: sender.from_name,
      reply_to: sender.reply_to,
    });
    setShowTestModal(true);
  };

  // Ensure senders is always an array
  const safeSenders = Array.isArray(senders) ? senders : [];

  const renderSenderForm = ({ SmartInput, SmartSelect, formData, handleInputChange, isSaving }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartInput
          name="name"
          label="Sender Name"
          placeholder="Enter sender name"
          required
          helpText="A descriptive name for this sender account"
        />
        <SmartInput
          name="email"
          label="Email Address"
          type="email"
          placeholder="sender@yourdomain.com"
          required
          helpText="The email address that will appear as the sender"
        />
      </div>

      {/* Domain Selector with enhanced UX */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Domain <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.domain_id}
          onChange={(e) => handleInputChange('domain_id', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          disabled={isDomainsLoading}
        >
          <option value="">
            {isDomainsLoading ? 'Loading domains...' : 'Select a domain'}
          </option>
          {filteredDomains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name || domain.domain} 
              {domain.status === 'active' ? ' (Active)' : ' (Inactive)'}
            </option>
          ))}
        </select>
        {!formData.domain_id && (
          <div className="flex items-center mt-1 text-sm text-red-600">
            <HiXCircle className="h-4 w-4 mr-1" />
            Please select a domain
          </div>
        )}
        {formData.domain_id && (
          <div className="flex items-center mt-1 text-sm text-green-600">
            <HiCheckCircle className="h-4 w-4 mr-1" />
            Domain selected successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartInput
          name="from_name"
          label="From Name"
          placeholder="Your Company Name"
          required
          helpText="The name that appears in the 'From' field"
        />
        <SmartInput
          name="reply_to"
          label="Reply-To Email"
          type="email"
          placeholder="support@yourdomain.com"
          helpText="Optional: Email address for replies"
        />
      </div>

      {/* Domain SMTP Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <HiInformationCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">SMTP Configuration</h4>
            <p className="text-sm text-blue-700 mt-1">
              SMTP settings are configured at the domain level. 
              The selected domain's SMTP configuration will be used for this sender.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sender Management</h1>
              {isAdmin && (
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  isAdminView 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isAdminView ? 'Admin View' : 'User View'}
                </span>
              )}
            </div>
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

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="loading-spinner h-8 w-8"></div>
            <span className="ml-2 text-gray-600">Loading senders...</span>
          </div>
        </div>
      )}

      {/* Senders Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSenders.length > 0 ? (
            filteredSenders.map((sender) => (
              <div key={sender.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                      <span className="font-medium">{formatNumber(sender.daily_limit || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sent Today:</span>
                      <span className="font-medium">{formatNumber(sender.sent_today || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Reputation Score:</span>
                      <span className="font-medium">{sender.reputation_score || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Used:</span>
                      <span className="font-medium">{formatDate(sender.last_used || new Date())}</span>
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
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <HiMail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {isAdmin && isAdminView 
                    ? 'No senders found in the system' 
                    : 'No senders found'
                  }
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdmin && isAdminView 
                    ? 'Add senders to the system for users to manage.' 
                    : 'Get started by adding your first sender account.'
                  }
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                  >
                    <HiPlus className="h-5 w-5 mr-2" />
                    Add Sender
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Sender Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Sender</h3>
              
              <SmartForm
                onSubmit={handleAddSender}
                initialData={formData}
                validation={validation}
                autoSave={false}
              >
                {renderSenderForm}
              </SmartForm>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddSender(formData)}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Adding...' : 'Add Sender'}
                </button>
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
              
              <SmartForm
                onSubmit={handleEditSender}
                initialData={formData}
                validation={validation}
                autoSave={false}
              >
                {renderSenderForm}
              </SmartForm>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditSender(formData)}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Updating...' : 'Update Sender'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Connection Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test SMTP Connection</h3>
              <p className="text-gray-600 mb-6">
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
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Senders; 
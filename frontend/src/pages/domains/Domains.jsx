import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiCheckCircle,
  HiXCircle,
  HiGlobe,
  HiShieldCheck,
  HiCog,
  HiTrendingUp,
  HiTrendingDown,
  HiInformationCircle,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import { 
  fetchDomains, 
  createDomain, 
  updateDomain, 
  deleteDomain, 
  verifyDomain, 
  updateDomainConfig,
  clearError 
} from '../../store/slices/domainsSlice';
import toast from 'react-hot-toast';

const Domains = () => {
  const dispatch = useDispatch();
  const { domains = [], isLoading, error } = useSelector((state) => state.domains || {});
  
  // Ensure domains is always an array
  const safeDomains = Array.isArray(domains) ? domains : [];
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    domain: '',
    dkim_public_key: '',
    spf_record: '',
    dmarc_record: '',
    bounce_processing: false,
    bounce_host: '',
    bounce_port: '',
    bounce_username: '',
    bounce_password: '',
    bounce_encryption: 'ssl',
    // SMTP Configuration
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
  });

  // Fetch domains on component mount
  useEffect(() => {
    dispatch(fetchDomains());
  }, [dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAddDomain = async () => {
    try {
      await dispatch(createDomain(formData)).unwrap();
      toast.success('Domain added successfully!');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleEditDomain = async () => {
    try {
      await dispatch(updateDomain({ 
        id: selectedDomain.id, 
        domainData: formData 
      })).unwrap();
      toast.success('Domain updated successfully!');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    
    try {
      await dispatch(deleteDomain(domainId)).unwrap();
      toast.success('Domain deleted successfully!');
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      await dispatch(verifyDomain(domainId)).unwrap();
      toast.success('Domain verification initiated!');
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await dispatch(updateDomainConfig({ 
        id: selectedDomain.id, 
        configData: formData 
      })).unwrap();
      toast.success('Domain configuration updated successfully!');
      setShowConfigModal(false);
      resetForm();
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const resetForm = () => {
    setFormData({
      domain: '',
      dkim_public_key: '',
      spf_record: '',
      dmarc_record: '',
      bounce_processing: false,
      bounce_host: '',
      bounce_port: '',
      bounce_username: '',
      bounce_password: '',
      bounce_encryption: 'ssl',
      // SMTP Configuration
      smtp_host: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
      smtp_encryption: 'tls',
    });
  };

  const openEditModal = (domain) => {
    setSelectedDomain(domain);
    setFormData({
      domain: domain.domain,
      dkim_public_key: domain.dkim_public_key || '',
      spf_record: domain.spf_record || '',
      dmarc_record: domain.dmarc_record || '',
      bounce_processing: domain.bounce_processing || false,
      bounce_host: domain.bounce_host || '',
      bounce_port: domain.bounce_port || '',
      bounce_username: domain.bounce_username || '',
      bounce_password: '',
      bounce_encryption: domain.bounce_encryption || 'ssl',
    });
    setShowEditModal(true);
  };

  const openConfigModal = (domain) => {
    setSelectedDomain(domain);
    setFormData({
      domain: domain.domain,
      dkim_public_key: domain.dkim_public_key || '',
      spf_record: domain.spf_record || '',
      dmarc_record: domain.dmarc_record || '',
      bounce_processing: domain.bounce_processing || false,
      bounce_host: domain.bounce_host || '',
      bounce_port: domain.bounce_port || '',
      bounce_username: domain.bounce_username || '',
      bounce_password: '',
      bounce_encryption: domain.bounce_encryption || 'ssl',
    });
    setShowConfigModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getReputationColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  if (isLoading && safeDomains.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Domain Management</h1>
            <p className="text-gray-600 mt-1">Manage your sending domains and monitor reputation</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <HiPlus className="h-5 w-5 mr-2" />
            Add Domain
          </button>
        </div>
      </div>

      {/* Domains Grid */}
      {safeDomains.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <HiGlobe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No domains yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first sending domain</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            Add Your First Domain
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeDomains.map((domain) => (
            <div key={domain.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <HiGlobe className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{domain.domain}</h3>
                      <p className="text-sm text-gray-500">Added {formatDate(domain.created_at)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(domain.status)}-100 text-${getStatusColor(domain.status)}-800`}>
                    {domain.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reputation Score:</span>
                    <span className={`font-medium text-${getReputationColor(domain.reputation_score)}-600`}>
                      {domain.reputation_score || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daily Limit:</span>
                    <span className="font-medium">{formatNumber(domain.daily_limit || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sent Today:</span>
                    <span className="font-medium">{formatNumber(domain.sent_today || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bounce Rate:</span>
                    <span className="font-medium">{domain.bounce_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Complaint Rate:</span>
                    <span className="font-medium">{domain.complaint_rate || 0}%</span>
                  </div>
                </div>

                {/* DNS Records Status */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">DKIM:</span>
                    <span className={`inline-flex items-center ${domain.dkim_configured ? 'text-success-600' : 'text-danger-600'}`}>
                      {domain.dkim_configured ? (
                        <HiCheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <HiXCircle className="h-4 w-4 mr-1" />
                      )}
                      {domain.dkim_configured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">SPF:</span>
                    <span className={`inline-flex items-center ${domain.spf_configured ? 'text-success-600' : 'text-danger-600'}`}>
                      {domain.spf_configured ? (
                        <HiCheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <HiXCircle className="h-4 w-4 mr-1" />
                      )}
                      {domain.spf_configured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">DMARC:</span>
                    <span className={`inline-flex items-center ${domain.dmarc_configured ? 'text-success-600' : 'text-danger-600'}`}>
                      {domain.dmarc_configured ? (
                        <HiCheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <HiXCircle className="h-4 w-4 mr-1" />
                      )}
                      {domain.dmarc_configured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-2">
                  <button
                    onClick={() => openConfigModal(domain)}
                    className="flex-1 btn btn-secondary btn-sm flex items-center justify-center"
                  >
                    <HiCog className="h-4 w-4 mr-1" />
                    Config
                  </button>
                  {domain.status !== 'verified' && (
                    <button
                      onClick={() => handleVerifyDomain(domain.id)}
                      disabled={isLoading}
                      className="flex-1 btn btn-primary btn-sm flex items-center justify-center"
                    >
                      <HiShieldCheck className="h-4 w-4 mr-1" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(domain)}
                    className="btn btn-secondary btn-sm flex items-center justify-center"
                  >
                    <HiPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDomain(domain.id)}
                    disabled={isLoading}
                    className="btn btn-danger btn-sm flex items-center justify-center"
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Domain</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="example.com"
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
                    onClick={handleAddDomain}
                    disabled={!formData.domain || isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Adding...' : 'Add Domain'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Domain Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Domain</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
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
                    onClick={handleEditDomain}
                    disabled={!formData.domain || isLoading}
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

      {/* Domain Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Domain Configuration - {selectedDomain?.domain}</h3>
              <div className="space-y-6">
                {/* DNS Records */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">DNS Records</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DKIM Public Key
                      </label>
                      <textarea
                        value={formData.dkim_public_key}
                        onChange={(e) => setFormData({ ...formData, dkim_public_key: e.target.value })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter DKIM public key..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SPF Record
                      </label>
                      <input
                        type="text"
                        value={formData.spf_record}
                        onChange={(e) => setFormData({ ...formData, spf_record: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="v=spf1 include:_spf.example.com ~all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DMARC Record
                      </label>
                      <input
                        type="text"
                        value={formData.dmarc_record}
                        onChange={(e) => setFormData({ ...formData, dmarc_record: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Bounce Processing */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Bounce Processing</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.bounce_processing}
                        onChange={(e) => setFormData({ ...formData, bounce_processing: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Enable bounce processing
                      </label>
                    </div>
                    {formData.bounce_processing && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bounce Host
                          </label>
                          <input
                            type="text"
                            value={formData.bounce_host}
                            onChange={(e) => setFormData({ ...formData, bounce_host: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bounce Port
                          </label>
                          <input
                            type="number"
                            value={formData.bounce_port}
                            onChange={(e) => setFormData({ ...formData, bounce_port: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bounce Username
                          </label>
                          <input
                            type="text"
                            value={formData.bounce_username}
                            onChange={(e) => setFormData({ ...formData, bounce_username: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bounce Password
                          </label>
                          <input
                            type="password"
                            value={formData.bounce_password}
                            onChange={(e) => setFormData({ ...formData, bounce_password: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bounce Encryption
                          </label>
                          <select
                            value={formData.bounce_encryption}
                            onChange={(e) => setFormData({ ...formData, bounce_encryption: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="ssl">SSL</option>
                            <option value="tls">TLS</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SMTP Configuration */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">SMTP Configuration</h4>
                  <div className="space-y-4">
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
                          placeholder="smtp.gmail.com"
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
                          placeholder="587"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Username
                        </label>
                        <input
                          type="text"
                          value={formData.smtp_username}
                          onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          placeholder="your-email@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Password
                        </label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={formData.smtp_password}
                          onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter SMTP password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Encryption
                        </label>
                        <select
                          value={formData.smtp_encryption}
                          onChange={(e) => setFormData({ ...formData, smtp_encryption: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="tls">TLS (Recommended)</option>
                          <option value="ssl">SSL</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* SMTP Configuration Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <HiInformationCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">SMTP Configuration Tips</h4>
                          <ul className="mt-2 text-sm text-blue-700 space-y-1">
                            <li>• Use port 587 with TLS for most providers</li>
                            <li>• Gmail requires app-specific passwords</li>
                            <li>• Test your connection before sending campaigns</li>
                            <li>• Keep your credentials secure</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateConfig}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Saving...' : 'Save Configuration'}
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

export default Domains; 
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
  HiChartBar,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';

const Domains = () => {
  const dispatch = useDispatch();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
  });

  // State for domains data
  const [domains, setDomains] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch domains data
  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/domains', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setDomains(data.data);
        // Fetch analytics for each domain
        fetchDomainsAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDomainsAnalytics = async (domainsData) => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch('/api/powermta/domains/analytics', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const analyticsMap = {};
        data.data.forEach(item => {
          analyticsMap[item.domain_id] = item.analytics;
        });
        setAnalytics(analyticsMap);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleAddDomain = async () => {
    setIsLoading(true);
    try {
      // Implement add domain logic
      console.log('Adding domain:', formData);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Add domain failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDomain = async () => {
    setIsLoading(true);
    try {
      // Implement edit domain logic
      console.log('Editing domain:', formData);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Edit domain failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    
    setIsLoading(true);
    try {
      // Implement delete domain logic
      console.log('Deleting domain:', domainId);
    } catch (error) {
      console.error('Delete domain failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    setIsLoading(true);
    try {
      // Implement domain verification logic
      console.log('Verifying domain:', domainId);
    } catch (error) {
      console.error('Domain verification failed:', error);
    } finally {
      setIsLoading(false);
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
    });
  };

  const openEditModal = (domain) => {
    setSelectedDomain(domain);
    setFormData({
      domain: domain.domain,
      dkim_public_key: domain.dkim_public_key || '',
      spf_record: domain.spf_record || '',
      dmarc_record: domain.dmarc_record || '',
      bounce_processing: domain.bounce_processing,
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
      domain: domain.name,
      dkim_public_key: domain.dkim_public_key || '',
      spf_record: domain.spf_record || '',
      dmarc_record: domain.dmarc_record || '',
      bounce_processing: domain.bounce_processing,
      bounce_host: domain.bounce_host || '',
      bounce_port: domain.bounce_port || '',
      bounce_username: domain.bounce_username || '',
      bounce_password: '',
      bounce_encryption: domain.bounce_encryption || 'ssl',
    });
    setShowConfigModal(true);
  };

  const openAnalyticsModal = (domain) => {
    setSelectedDomain(domain);
    setShowAnalyticsModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain) => {
          const domainAnalytics = analytics[domain.id];
          const acctMetrics = domainAnalytics?.accounting_metrics || {};
          const healthStatus = domainAnalytics?.overall_health || {};
          
          return (
            <div key={domain.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <HiGlobe className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{domain.name}</h3>
                      <p className="text-sm text-gray-500">Added {formatDate(domain.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(domain.is_active ? 'active' : 'inactive')}-100 text-${getStatusColor(domain.is_active ? 'active' : 'inactive')}-800`}>
                      {domain.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {healthStatus.status && (
                      <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getReputationColor(healthStatus.score || 0)}-100 text-${getReputationColor(healthStatus.score || 0)}-800`}>
                        {healthStatus.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Health Score:</span>
                    <span className={`font-medium text-${getReputationColor(healthStatus.score || 0)}-600`}>
                      {healthStatus.score || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Max Rate:</span>
                    <span className="font-medium">{formatNumber(domain.max_msg_rate || 0)}/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Sent:</span>
                    <span className="font-medium">{formatNumber(acctMetrics.total_sent || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Rate:</span>
                    <span className="font-medium">{(acctMetrics.delivery_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bounce Rate:</span>
                    <span className="font-medium">{(acctMetrics.bounce_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Complaint Rate:</span>
                    <span className="font-medium">{(acctMetrics.complaint_rate || 0).toFixed(2)}%</span>
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
                <button
                  onClick={() => openAnalyticsModal(domain)}
                  className="flex-1 btn btn-primary btn-sm flex items-center justify-center"
                >
                  <HiChartBar className="h-4 w-4 mr-1" />
                  Analytics
                </button>
                <button
                  onClick={() => openEditModal(domain)}
                  className="btn btn-secondary btn-sm flex items-center justify-center"
                >
                  <HiPencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteDomain(domain.id)}
                  className="btn btn-danger btn-sm flex items-center justify-center"
                >
                  <HiTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                            Encryption
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

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditDomain}
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

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedDomain && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Analytics for {selectedDomain.name}
              </h3>
              
              {analytics[selectedDomain.id] ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium">Total Sent</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatNumber(analytics[selectedDomain.id].accounting_metrics.total_sent || 0)}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600 font-medium">Delivery Rate</div>
                      <div className="text-2xl font-bold text-green-900">
                        {(analytics[selectedDomain.id].accounting_metrics.delivery_rate || 0).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600 font-medium">Bounce Rate</div>
                      <div className="text-2xl font-bold text-red-900">
                        {(analytics[selectedDomain.id].accounting_metrics.bounce_rate || 0).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-purple-600 font-medium">Health Score</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {(analytics[selectedDomain.id].overall_health.score || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* FBL and Diagnostic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">FBL Data</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total Complaints:</span>
                          <span className="font-medium">{analytics[selectedDomain.id].fbl_data.total_complaints}</span>
                        </div>
                        {Object.entries(analytics[selectedDomain.id].fbl_data.complaint_types || {}).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span className="text-sm text-gray-500">{type}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Diagnostic Data</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total Diagnostics:</span>
                          <span className="font-medium">{analytics[selectedDomain.id].diagnostic_data.total_diagnostics}</span>
                        </div>
                        {Object.entries(analytics[selectedDomain.id].diagnostic_data.analysis?.error_codes || {}).slice(0, 5).map(([code, count]) => (
                          <div key={code} className="flex justify-between">
                            <span className="text-sm text-gray-500">Error {code}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Health Issues */}
                  {analytics[selectedDomain.id].overall_health.issues?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Health Issues</h4>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {analytics[selectedDomain.id].overall_health.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No analytics data available for this domain</div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Domains; 
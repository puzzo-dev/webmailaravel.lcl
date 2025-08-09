import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiServer,
  HiChartBar,
  HiDocumentText,
  HiRefresh,
  HiEye,
  HiDownload,
  HiCog,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiInformationCircle,
  HiTrendingUp,
  HiTrendingDown,
  HiClock,
  HiGlobe,
} from 'react-icons/hi';
import { adminService } from '../../services/api';
// Force cache refresh
console.log('AdminPowerMTA: adminService imported at', new Date().toISOString());
import toast from 'react-hot-toast';
import { formatDate, formatNumber } from '../../utils/helpers';

const AdminPowerMTA = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [powerMTAStatus, setPowerMTAStatus] = useState({});
  const [fblAccounts, setFblAccounts] = useState([]);
  const [diagnosticFiles, setDiagnosticFiles] = useState([]);
  const [reputationSummary, setReputationSummary] = useState({});

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPowerMTAData();
    }
  }, [user]);

  const loadPowerMTAData = async () => {
    try {
      setLoading(true);
      
      // Debug logging
      console.log('adminService object:', adminService);
      console.log('adminService keys:', Object.keys(adminService));
      console.log('getPowerMTAStatus exists:', typeof adminService.getPowerMTAStatus);
      
      const [statusResponse, fblResponse, diagnosticResponse, reputationResponse] = await Promise.all([
        adminService.getPowerMTAStatus(),
        adminService.getPowerMTAFBLAccounts(),
        adminService.getPowerMTADiagnosticFiles(),
        adminService.getPowerMTAReputationSummary()
      ]);
      
      setPowerMTAStatus(statusResponse.data);
      setFblAccounts(fblResponse.data.accounts || []);
      setDiagnosticFiles(diagnosticResponse.data.files || []);
      setReputationSummary(reputationResponse.data);
    } catch (error) {
      toast.error('Failed to load PowerMTA data');
      console.error('PowerMTA data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setLoading(true);
      await loadPowerMTAData();
      toast.success('PowerMTA status refreshed');
    } catch (error) {
      toast.error('Failed to refresh PowerMTA status');
      console.error('Refresh status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeReputation = async () => {
    if (!selectedDomain) return;
    
    try {
      setLoading(true);
      const response = await adminService.analyzePowerMTAReputation(selectedDomain);
      toast.success('Reputation analysis completed');
      // Update reputation summary with new data
      await loadPowerMTAData();
    } catch (error) {
      toast.error('Failed to analyze reputation');
      console.error('Reputation analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParseDiagnosticFile = async (filename) => {
    try {
      setLoading(true);
      await adminService.parsePowerMTADiagnosticFile(filename);
      toast.success('Diagnostic file parsed successfully');
      await loadPowerMTAData();
    } catch (error) {
      toast.error('Failed to parse diagnostic file');
      console.error('Parse diagnostic file error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDiagnosticFile = async (filename) => {
    try {
      const response = await adminService.downloadPowerMTADiagnosticFile(filename);
      // Create a download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Diagnostic file downloaded successfully');
    } catch (error) {
      toast.error('Failed to download diagnostic file');
      console.error('Download diagnostic file error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'danger';
      case 'starting':
        return 'warning';
      case 'stopping':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <HiCheckCircle className="h-4 w-4" />;
      case 'stopped':
        return <HiXCircle className="h-4 w-4" />;
      case 'starting':
      case 'stopping':
        return <HiClock className="h-4 w-4" />;
      default:
        return <HiInformationCircle className="h-4 w-4" />;
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
                <p>You need admin privileges to manage PowerMTA.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">PowerMTA Management</h1>
            <p className="text-gray-600 mt-1">Monitor PowerMTA status, diagnostics, and reputation</p>
          </div>
          <button
            onClick={handleRefreshStatus}
            disabled={loading}
            className="btn btn-secondary flex items-center"
          >
            <HiRefresh className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">PowerMTA Status</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(powerMTAStatus.status)}-100 text-${getStatusColor(powerMTAStatus.status)}-800`}>
            {getStatusIcon(powerMTAStatus.status)}
            <span className="ml-1">{powerMTAStatus.status}</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Version</p>
            <p className="text-lg font-semibold text-gray-900">{powerMTAStatus.version}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">{powerMTAStatus.uptime}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Connections</p>
            <p className="text-lg font-semibold text-gray-900">{powerMTAStatus.active_connections}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Delivery Rate</p>
            <p className="text-lg font-semibold text-gray-900">{powerMTAStatus.average_delivery_rate}%</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Messages Sent Today</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(powerMTAStatus.messages_sent_today)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Messages Failed Today</p>
            <p className="text-2xl font-bold text-red-600">{formatNumber(powerMTAStatus.messages_failed_today)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Last Restart</p>
            <p className="text-lg font-semibold text-gray-900">{formatDate(powerMTAStatus.last_restart)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'status', name: 'Status', icon: HiServer },
              { id: 'fbl', name: 'FBL Accounts', icon: HiGlobe },
              { id: 'diagnostics', name: 'Diagnostics', icon: HiDocumentText },
              { id: 'reputation', name: 'Reputation', icon: HiChartBar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="text-sm font-medium">2.1 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Disk Usage</span>
                      <span className="text-sm font-medium">15.2 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Network I/O</span>
                      <span className="text-sm font-medium">125 MB/s</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Queue Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending Messages</span>
                      <span className="text-sm font-medium">1,250</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Failed Messages</span>
                      <span className="text-sm font-medium text-red-600">89</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Retry Queue</span>
                      <span className="text-sm font-medium">234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bounce Queue</span>
                      <span className="text-sm font-medium">45</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FBL Accounts Tab */}
          {activeTab === 'fbl' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Feedback Loop Accounts</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Processed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Complaints Today
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Complaints
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fblAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {account.domain}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              account.status === 'active'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {account.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(account.last_processed)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.complaints_today}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.total_complaints}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics Tab */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={() => handleParseDiagnosticFile('diagnostic_' + selectedDate + '.csv')}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Processing...' : 'Process Files'}
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Diagnostic Files</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Filename
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Records
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
                      {diagnosticFiles.map((file) => (
                        <tr key={file.filename} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {file.filename}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(file.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(file.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(file.records)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              file.status === 'processed'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-warning-100 text-warning-800'
                            }`}>
                              {file.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleParseDiagnosticFile(file.filename)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Parse"
                              >
                                <HiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadDiagnosticFile(file.filename)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Download"
                              >
                                <HiDownload className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reputation Tab */}
          {activeTab === 'reputation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <HiGlobe className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Domains</p>
                      <p className="text-2xl font-bold text-gray-900">{reputationSummary.total_domains}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
                        <HiTrendingUp className="h-5 w-5 text-success-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Average Reputation</p>
                      <p className="text-2xl font-bold text-gray-900">{reputationSummary.average_reputation}%</p>
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
                      <p className="text-sm font-medium text-gray-500">High Reputation</p>
                      <p className="text-2xl font-bold text-gray-900">{reputationSummary.high_reputation_domains}</p>
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
                      <p className="text-sm font-medium text-gray-500">Low Reputation</p>
                      <p className="text-2xl font-bold text-gray-900">{reputationSummary.low_reputation_domains}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Top Domains by Reputation</h4>
                <div className="space-y-3">
                  {reputationSummary.top_domains.map((domain, index) => (
                    <div key={domain.domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-3">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{domain.domain}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">{domain.reputation}%</span>
                        <span className={`inline-flex items-center ${
                          domain.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {domain.trend === 'up' ? (
                            <HiTrendingUp className="h-4 w-4" />
                          ) : (
                            <HiTrendingDown className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Reputation Analysis</h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    placeholder="Enter domain name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={handleAnalyzeReputation}
                    disabled={!selectedDomain || loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Reputation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPowerMTA; 
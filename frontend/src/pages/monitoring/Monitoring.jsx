import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiRefresh,
  HiPlay,
  HiPause,
  HiClipboardList,
  HiChartBar,
  HiExclamation,
  HiCheckCircle,
  HiClock,
  HiTrendingUp,
  HiTrendingDown,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  fetchMonitoringStatus,
  fetchMonitoringResults,
  runMonitoring,
  clearMonitoringData
} from '../../store/slices/monitoringSlice';

const Monitoring = () => {
  const dispatch = useDispatch();
  const { monitoringStatus, monitoringResults, isLoading } = useSelector((state) => state.monitoring);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch monitoring data from backend
    dispatch(fetchMonitoringStatus());
    dispatch(fetchMonitoringResults());
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      dispatch(fetchMonitoringStatus());
      dispatch(fetchMonitoringResults());
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleForceRunMonitoring = async () => {
    setIsRunning(true);
    try {
      await dispatch(runMonitoring()).unwrap();
      toast.success('Monitoring started successfully');
    } catch (error) {
      toast.error('Failed to start monitoring');
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearMonitoringData = async () => {
    if (!confirm('Are you sure you want to clear all monitoring data?')) return;
    
    setIsSubmitting(true);
    try {
      await dispatch(clearMonitoringData()).unwrap();
      toast.success('Monitoring data cleared successfully');
    } catch (error) {
      toast.error('Failed to clear monitoring data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDomainHealthColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'orange';
    return 'danger';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
        return <HiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'good':
        return <HiTrendingUp className="h-5 w-5 text-blue-500" />;
      case 'fair':
        return <HiTrendingDown className="h-5 w-5 text-yellow-500" />;
      case 'poor':
        return <HiExclamation className="h-5 w-5 text-red-500" />;
      default:
        return <HiClock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Domain Monitoring</h1>
            <p className="text-gray-600 mt-1">Monitor PowerMTA domain health and performance</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                dispatch(fetchMonitoringStatus());
                dispatch(fetchMonitoringResults());
              }}
              className="btn btn-secondary flex items-center"
            >
              <HiRefresh className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleForceRunMonitoring}
              disabled={isRunning}
              className="btn btn-primary flex items-center"
            >
              <HiPlay className="h-5 w-5 mr-2" />
              {isRunning ? 'Running...' : 'Run Monitoring'}
            </button>
            <button
              onClick={handleClearMonitoringData}
              disabled={isSubmitting}
              className="btn btn-danger flex items-center"
            >
              <HiClipboardList className="h-5 w-5 mr-2" />
              Clear Data
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="loading-spinner h-8 w-8"></div>
            <span className="ml-2 text-gray-600">Loading monitoring data...</span>
          </div>
        </div>
      )}

      {/* Monitoring Status */}
      {!isLoading && monitoringStatus && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monitoring Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Last Run</div>
              <div className="text-lg font-semibold text-blue-900">
                {monitoringStatus.last_run ? formatDate(monitoringStatus.last_run) : 'Never'}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Next Run</div>
              <div className="text-lg font-semibold text-green-900">
                {monitoringStatus.next_run ? formatDate(monitoringStatus.next_run) : 'Not scheduled'}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Should Run Now</div>
              <div className="text-lg font-semibold text-purple-900">
                {monitoringStatus.should_run_now ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Results */}
      {!isLoading && monitoringResults && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monitoring Results</h2>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Domains</div>
              <div className="text-2xl font-bold text-blue-900">
                {monitoringResults.total_domains || 0}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Domains Needing Attention</div>
              <div className="text-2xl font-bold text-red-900">
                {monitoringResults.domains_needing_attention || 0}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Healthy Domains</div>
              <div className="text-2xl font-bold text-green-900">
                {(monitoringResults.total_domains || 0) - (monitoringResults.domains_needing_attention || 0)}
              </div>
            </div>
          </div>

          {/* Domain Results */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Domain Details</h3>
            <div className="grid grid-cols-1 gap-4">
              {monitoringResults.results && monitoringResults.results.length > 0 ? (
                monitoringResults.results.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getStatusIcon(result.analytics?.overall_health?.status)}
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900">{result.domain}</h4>
                          <p className="text-sm text-gray-500">
                            Last monitored: {formatDate(result.monitored_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Health Score</div>
                          <div className={`text-lg font-semibold text-${getDomainHealthColor(result.analytics?.overall_health?.score || 0)}-600`}>
                            {(result.analytics?.overall_health?.score || 0).toFixed(1)}%
                          </div>
                        </div>
                        {result.needs_attention && (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Needs Attention
                          </div>
                        )}
                      </div>
                    </div>

                    {result.analytics && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Total Sent</div>
                          <div className="text-lg font-semibold">
                            {formatNumber(result.analytics.accounting_metrics?.total_sent || 0)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Delivery Rate</div>
                          <div className="text-lg font-semibold">
                            {(result.analytics.accounting_metrics?.delivery_rate || 0).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Bounce Rate</div>
                          <div className="text-lg font-semibold">
                            {(result.analytics.accounting_metrics?.bounce_rate || 0).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Complaint Rate</div>
                          <div className="text-lg font-semibold">
                            {(result.analytics.accounting_metrics?.complaint_rate || 0).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    )}

                    {result.analytics?.overall_health?.issues?.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm font-medium text-yellow-800 mb-1">Issues:</div>
                        <ul className="text-sm text-yellow-700 list-disc list-inside">
                          {result.analytics.overall_health.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.training_result && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm font-medium text-blue-800 mb-1">Training Result:</div>
                        <div className="text-sm text-blue-700">
                          New rate: {result.training_result.new_rate || 'N/A'} msgs/hour
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <HiChartBar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No domain results</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No domains have been monitored yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !monitoringResults && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-8">
            <HiChartBar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No monitoring results</h3>
            <p className="mt-1 text-sm text-gray-500">
              Run monitoring to see domain health and performance data.
            </p>
            <div className="mt-6">
              <button
                onClick={handleForceRunMonitoring}
                disabled={isRunning}
                className="btn btn-primary"
              >
                {isRunning ? 'Running...' : 'Run Monitoring'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;

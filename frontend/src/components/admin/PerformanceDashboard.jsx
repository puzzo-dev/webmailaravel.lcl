import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSystemMetrics, 
  fetchOperationMetrics, 
  generatePerformanceReport,
  clearError,
  clearSuccess 
} from '../../store/slices/performanceSlice';

const PerformanceDashboard = () => {
  const dispatch = useDispatch();
  const { 
    systemMetrics, 
    operationMetrics, 
    report, 
    loading, 
    error, 
    success,
    lastUpdated 
  } = useSelector(state => state.performance);

  const [selectedOperation, setSelectedOperation] = useState('training_unified');
  const [reportHours, setReportHours] = useState(24);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    // Load initial data
    dispatch(fetchSystemMetrics());
  }, [dispatch]);

  useEffect(() => {
    // Auto refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        dispatch(fetchSystemMetrics());
        if (selectedOperation) {
          dispatch(fetchOperationMetrics({ operation: selectedOperation }));
        }
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedOperation, dispatch]);

  const handleOperationSelect = (operation) => {
    setSelectedOperation(operation);
    dispatch(fetchOperationMetrics({ operation }));
  };

  const handleGenerateReport = () => {
    dispatch(generatePerformanceReport(reportHours));
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return `${duration.toFixed(2)}ms`;
  };

  const formatMemory = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getPerformanceColor = (avgDuration) => {
    if (!avgDuration) return 'text-gray-500';
    if (avgDuration < 100) return 'text-green-600';
    if (avgDuration < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
            <p className="text-gray-600">Monitor system performance after refactoring</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto Refresh (30s)
            </label>
            <button
              onClick={() => dispatch(fetchSystemMetrics())}
              disabled={loading.systemMetrics}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading.systemMetrics ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => dispatch(clearError())} className="float-right">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
          <button onClick={() => dispatch(clearSuccess())} className="float-right">×</button>
        </div>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemMetrics && Object.entries(systemMetrics).map(([key, metrics]) => {
          if (key === 'system') {
            return (
              <div key={key} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Usage:</span>
                    <span className="font-medium">{formatMemory(metrics.memory_usage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Memory:</span>
                    <span className="font-medium">{formatMemory(metrics.peak_memory)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DB Connections:</span>
                    <span className="font-medium">{metrics.database_connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cache Hit Rate:</span>
                    <span className="font-medium">{metrics.cache_hit_rate?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          }

          const aggregated = metrics.aggregated;
          if (!aggregated) return null;

          return (
            <div 
              key={key} 
              className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOperationSelect(key)}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                {key.replace(/_/g, ' ')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Duration:</span>
                  <span className={`font-medium ${getPerformanceColor(aggregated.avg_duration)}`}>
                    {formatDuration(aggregated.avg_duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Calls:</span>
                  <span className="font-medium">{aggregated.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min/Max:</span>
                  <span className="font-medium text-sm">
                    {formatDuration(aggregated.min_duration)} / {formatDuration(aggregated.max_duration)}
                  </span>
                </div>
              </div>
              {selectedOperation === key && (
                <div className="mt-2 text-blue-600 text-sm">Click to view details</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Operation Details */}
      {selectedOperation && operationMetrics[selectedOperation] && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedOperation.replace(/_/g, ' ').toUpperCase()} Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Metrics</h3>
              <div className="space-y-2">
                {operationMetrics[selectedOperation].aggregated && Object.entries(operationMetrics[selectedOperation].aggregated).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium">
                      {key.includes('duration') ? formatDuration(value) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Latest Execution</h3>
              {operationMetrics[selectedOperation].latest_metric && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {formatDuration(operationMetrics[selectedOperation].latest_metric.duration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Used:</span>
                    <span className="font-medium">
                      {formatMemory(operationMetrics[selectedOperation].latest_metric.memory_usage)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="font-medium text-sm">
                      {new Date(operationMetrics[selectedOperation].latest_metric.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Report */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Performance Report</h2>
          <div className="flex items-center space-x-4">
            <select
              value={reportHours}
              onChange={(e) => setReportHours(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value={1}>Last Hour</option>
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last Week</option>
            </select>
            <button
              onClick={handleGenerateReport}
              disabled={loading.report}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading.report ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {report && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-900">Report Period</h3>
                <p className="text-blue-700">{report.period}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-green-900">Generated At</h3>
                <p className="text-green-700">{new Date(report.generated_at).toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h3 className="font-semibold text-purple-900">Metrics Count</h3>
                <p className="text-purple-700">{Object.keys(report.metrics).length} operations</p>
              </div>
            </div>

            {/* Improvements Section */}
            {report.improvements && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Refactoring Improvements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(report.improvements).map(([system, improvements]) => (
                    <div key={system} className="bg-gray-50 p-4 rounded">
                      <h4 className="font-medium text-gray-900 capitalize mb-2">
                        {system.replace(/_/g, ' ')}
                      </h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(improvements).map(([metric, value]) => (
                          <div key={metric} className="flex justify-between">
                            <span className="text-gray-600">{metric.replace(/_/g, ' ')}:</span>
                            <span className="font-medium text-green-600">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;

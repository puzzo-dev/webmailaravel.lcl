import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlus,
  HiTrash,
  HiEye,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiInformationCircle,
  HiShieldCheck,
  HiCog,
  HiDownload,
} from 'react-icons/hi';
import { formatDate, formatFileSize } from '../../utils/helpers';

const AdminLogs = () => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState('laravel.log');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Mock data - replace with actual API calls
  const logFiles = [
    'laravel.log',
    'auth.log',
    'campaigns.log',
    'powermta.log',
    'errors.log',
  ];

  const logs = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:45',
      level: 'INFO',
      message: 'Campaign started successfully',
      context: {
        user_id: 1,
        campaign_id: 123,
        ip: '192.168.1.1',
      },
      stack_trace: null,
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:29:30',
      level: 'ERROR',
      message: 'Failed to connect to SMTP server',
      context: {
        user_id: 1,
        sender_id: 5,
        error: 'Connection timeout',
      },
      stack_trace: 'Stack trace at line 45...',
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:28:15',
      level: 'WARNING',
      message: 'High bounce rate detected',
      context: {
        domain: 'example.com',
        bounce_rate: 15.2,
      },
      stack_trace: null,
    },
  ];

  const logLevels = [
    { value: 'all', label: 'All Levels', color: 'gray' },
    { value: 'INFO', label: 'Info', color: 'blue' },
    { value: 'WARNING', label: 'Warning', color: 'yellow' },
    { value: 'ERROR', label: 'Error', color: 'red' },
    { value: 'DEBUG', label: 'Debug', color: 'gray' },
  ];

  const handleLoadLogs = async () => {
    setIsLoading(true);
    try {
      // Implement load logs API call
      console.log('Loading logs for file:', selectedFile);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      // Implement clear logs API call
      console.log('Clearing logs for file:', selectedFile);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLogDetail = (log) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.context && JSON.stringify(log.context).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 bg-red-100';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100';
      case 'INFO':
        return 'text-blue-600 bg-blue-100';
      case 'DEBUG':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR':
        return <HiExclamation className="h-4 w-4" />;
      case 'WARNING':
        return <HiExclamation className="h-4 w-4" />;
      case 'INFO':
        return <HiInformationCircle className="h-4 w-4" />;
      case 'DEBUG':
        return <HiDocumentText className="h-4 w-4" />;
      default:
        return <HiDocumentText className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    handleLoadLogs();
  }, [selectedFile]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
            <p className="text-gray-600 mt-1">Monitor and manage system logs</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleLoadLogs}
              disabled={isLoading}
              className="btn btn-secondary flex items-center"
            >
              <HiRefresh className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleClearLogs}
              disabled={isLoading}
              className="btn btn-danger flex items-center"
            >
              <HiTrash className="h-5 w-5 mr-2" />
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log File
            </label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {logFiles.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Level
            </label>
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {logLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 w-full"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setLogLevel('all');
              }}
              className="btn btn-secondary w-full"
            >
              <HiX className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Log Entries ({filteredLogs.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {logs.length} entries
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Context
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      <span className="ml-1">{log.level}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                    {log.message}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.context ? (
                      <span className="text-gray-500">
                        {Object.keys(log.context).length} fields
                      </span>
                    ) : (
                      <span className="text-gray-400">No context</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewLogDetail(log)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <HiEye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {showLogDetail && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Log Entry Details</h3>
                <button
                  onClick={() => setShowLogDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timestamp
                    </label>
                    <p className="text-sm text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(selectedLog.level)}`}>
                      {getLevelIcon(selectedLog.level)}
                      <span className="ml-1">{selectedLog.level}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedLog.message}
                  </p>
                </div>
                {selectedLog.context && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Context
                    </label>
                    <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.stack_trace && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stack Trace
                    </label>
                    <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto max-h-64">
                      {selectedLog.stack_trace}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs; 
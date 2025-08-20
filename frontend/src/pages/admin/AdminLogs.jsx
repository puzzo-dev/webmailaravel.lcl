import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  HiRefresh,
  HiDocumentText,
  HiX,
} from 'react-icons/hi';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatFileSize } from '../../utils/helpers';

const AdminLogs = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedFile, setSelectedFile] = useState('laravel.log');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logFiles, setLogFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadLogFiles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFile && user?.role === 'admin') {
      loadLogs();
    }
  }, [selectedFile, pagination.current_page, logLevel, user]);

  const loadLogFiles = async () => {
    try {
      const response = await adminService.getLogFiles();
      setLogFiles(response.data.files || []);
      if (response.data.files?.length > 0 && !selectedFile) {
        setSelectedFile(response.data.files[0]);
      }
    } catch (error) {
      toast.error('Failed to load log files');
      console.error('Load log files error:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getLogs({
        file: selectedFile,
        page: pagination.current_page,
        limit: pagination.per_page,
        level: logLevel !== 'all' ? logLevel : undefined,
        search: searchTerm || undefined,
      });
      
      setLogs(response.data.logs || []);
      setPagination({
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
        per_page: response.data.per_page || 50,
        total: response.data.total || 0,
      });
    } catch (error) {
      toast.error('Failed to load logs');
      console.error('Load logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLogs = async () => {
    await loadLogs();
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await adminService.clearLogs(selectedFile);
      toast.success('Logs cleared successfully');
      await loadLogs();
    } catch (error) {
      toast.error('Failed to clear logs');
      console.error('Clear logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLogs = async () => {
    try {
      const response = await adminService.downloadLogs(selectedFile);
      // Create a download link
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Log file downloaded successfully');
    } catch (error) {
      toast.error('Failed to download log file');
      console.error('Download logs error:', error);
    }
  };

  const handleViewLogDetail = (log) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.context && Array.isArray(log.context) && log.context.length > 0 && JSON.stringify(log.context).toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (log.context && typeof log.context === 'object' && Object.keys(log.context).length > 0 && JSON.stringify(log.context).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = logLevel === 'all' || log.level === logLevel || log.channel === logLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 bg-red-100';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100';
      case 'INFO':
      case 'LOCAL':
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
      case 'LOCAL':
        return <HiInformationCircle className="h-4 w-4" />;
      case 'DEBUG':
        return <HiDocumentText className="h-4 w-4" />;
      default:
        return <HiDocumentText className="h-4 w-4" />;
    }
  };

  const logLevels = [
    { value: 'all', label: 'All Levels', color: 'gray' },
    { value: 'LOCAL', label: 'Local', color: 'blue' },
    { value: 'INFO', label: 'Info', color: 'blue' },
    { value: 'WARNING', label: 'Warning', color: 'yellow' },
    { value: 'ERROR', label: 'Error', color: 'red' },
    { value: 'DEBUG', label: 'Debug', color: 'gray' },
  ];

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
                <p>You need admin privileges to access system logs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && logs.length === 0) {
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
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 lg:p-6">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900">System Logs</h1>
            <p className="text-gray-600 mt-1 text-xs lg:text-base">Monitor and manage system logs</p>
          </div>
          <div className="flex gap-1 lg:gap-3">
            <button
              onClick={handleLoadLogs}
              disabled={loading}
              className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-2 py-1.5 lg:px-4 lg:py-2 rounded text-xs lg:text-sm font-medium transition-colors"
            >
              <HiRefresh className={`h-3 w-3 lg:h-4 lg:w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-1 hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleClearLogs}
              disabled={loading}
              className="flex items-center justify-center bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 px-2 py-1.5 lg:px-4 lg:py-2 rounded text-xs lg:text-sm font-medium transition-colors"
            >
              <HiTrash className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="ml-1 hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={handleDownloadLogs}
              disabled={loading}
              className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-700 px-2 py-1.5 lg:px-4 lg:py-2 rounded text-xs lg:text-sm font-medium transition-colors"
            >
              <HiDownload className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="ml-1 hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log File
            </label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="block w-full px-2 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="block w-full px-2 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
              Date Filter
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full px-2 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setLevelFilter('all');
              }}
              className="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors w-full flex items-center justify-center"
            >
              <HiX className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-base lg:text-lg font-medium text-gray-900">
              Log Entries
            </h3>
            <div className="text-xs lg:text-sm text-gray-500">
              Showing {filteredLogs.length} of {pagination.total} entries
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-2 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-2 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="hidden lg:table-cell px-2 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Context
                </th>
                <th className="px-2 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-2 lg:px-6 py-2 lg:py-4 text-xs text-gray-900">
                    <div className="truncate max-w-[80px] lg:max-w-none">
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-400 lg:hidden">
                      {new Date(log.timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-2 lg:px-6 py-2 lg:py-4">
                    <span className={`inline-flex items-center justify-center w-6 h-6 lg:w-auto lg:h-auto lg:px-2 lg:py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      <span className="ml-1 hidden lg:inline">{log.level}</span>
                    </span>
                  </td>
                  <td className="px-2 lg:px-6 py-2 lg:py-4 text-xs text-gray-900">
                    <div className="truncate max-w-[120px] lg:max-w-md" title={log.message}>
                      {log.message}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-2 lg:px-6 py-2 lg:py-4 text-xs text-gray-900">
                    {log.context && Array.isArray(log.context) && log.context.length > 0 ? (
                      <span className="text-gray-500">
                        {log.context.length} items
                      </span>
                    ) : log.context && typeof log.context === 'object' && Object.keys(log.context).length > 0 ? (
                      <span className="text-gray-500">
                        {Object.keys(log.context).length} fields
                      </span>
                    ) : (
                      <span className="text-gray-400">No context</span>
                    )}
                  </td>
                  <td className="px-2 lg:px-6 py-2 lg:py-4 text-center">
                    <button
                      onClick={() => handleViewLogDetail(log)}
                      className="inline-flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <HiEye className="h-3 w-3 lg:h-4 lg:w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.last_page > 1 && (
          <div className="px-3 lg:px-6 py-3 lg:py-4 flex flex-col sm:flex-row justify-center items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
              disabled={pagination.current_page === 1}
              className="px-3 py-1.5 text-xs lg:text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded font-medium transition-colors"
            >
              Previous
            </button>
            <span className="text-xs lg:text-sm text-gray-700 px-2">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1.5 text-xs lg:text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded font-medium transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {showLogDetail && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 lg:top-20 mx-auto border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="p-4 lg:p-6">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timestamp
                    </label>
                    <p className="text-sm text-gray-900 break-words">{formatDate(selectedLog.timestamp)}</p>
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
                  {selectedLog.channel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Channel
                      </label>
                      <p className="text-sm text-gray-900 break-words">{selectedLog.channel}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md break-words">
                    {selectedLog.message}
                  </p>
                </div>
                {selectedLog.context && (Array.isArray(selectedLog.context) ? selectedLog.context.length > 0 : Object.keys(selectedLog.context).length > 0) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Context
                    </label>
                    <pre className="text-xs lg:text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.stack_trace && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stack Trace
                    </label>
                    <pre className="text-xs lg:text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto max-h-64 whitespace-pre-wrap break-words">
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
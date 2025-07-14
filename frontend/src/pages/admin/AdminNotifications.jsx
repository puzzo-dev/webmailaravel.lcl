import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  BellIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  CogIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { fetchAdminNotifications, updateNotificationStatus, deleteNotification, testNotification } from '../../store/slices/notificationSlice';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';

const AdminNotifications = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector(state => state.notifications);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    channel: '',
    search: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    dispatch(fetchAdminNotifications());
  }, [dispatch]);

  const handleStatusChange = async (notificationId, status) => {
    try {
      await dispatch(updateNotificationStatus({ notificationId, status }));
      dispatch(fetchAdminNotifications());
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  };

  const handleTestNotification = async (notificationId) => {
    try {
      await dispatch(testNotification(notificationId));
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) return;
    
    try {
      for (const notificationId of selectedNotifications) {
        if (action === 'delete') {
          await dispatch(deleteNotification(notificationId));
        } else {
          await dispatch(updateNotificationStatus({ notificationId, status: action }));
        }
      }
      setSelectedNotifications([]);
      dispatch(fetchAdminNotifications());
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.type && notification.type !== filters.type) return false;
    if (filters.status && notification.status !== filters.status) return false;
    if (filters.channel && notification.channel !== filters.channel) return false;
    if (filters.search && !notification.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
      draft: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      error: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      email: { color: 'bg-blue-100 text-blue-800', icon: EnvelopeIcon },
      telegram: { color: 'bg-purple-100 text-purple-800', icon: GlobeAltIcon },
      webhook: { color: 'bg-orange-100 text-orange-800', icon: CogIcon },
      system: { color: 'bg-gray-100 text-gray-800', icon: BellIcon }
    };
    
    const config = typeConfig[type] || typeConfig.system;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
          <p className="text-gray-600">Manage notification templates and delivery settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {/* Add new notification template */}}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-2 inline" />
            Add Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', name: 'Templates', icon: BellIcon },
            { id: 'webhooks', name: 'Webhooks', icon: GlobeAltIcon },
            { id: 'settings', name: 'Settings', icon: CogIcon },
            { id: 'history', name: 'History', icon: ClockIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
              <option value="webhook">Webhook</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', status: '', channel: '', search: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedNotifications.length} notification(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('active')}
                className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded hover:bg-green-200"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('inactive')}
                className="px-3 py-1 text-sm text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(filteredNotifications.map(n => n.id));
                      } else {
                        setSelectedNotifications([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triggers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sent
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications([...selectedNotifications, notification.id]);
                        } else {
                          setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{notification.name}</div>
                      <div className="text-sm text-gray-500">{notification.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(notification.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(notification.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {notification.triggers?.map((trigger, index) => (
                        <span key={trigger} className={`inline-block px-2 py-1 rounded text-xs mr-1 mb-1 ${
                          trigger === 'campaign_start' ? 'bg-blue-100 text-blue-800' :
                          trigger === 'campaign_complete' ? 'bg-green-100 text-green-800' :
                          trigger === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {formatNumber(notification.sent_count || 0)}
                        </span>
                        <span className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1 text-green-400" />
                          {notification.delivery_rate || 0}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {notification.last_sent ? formatDate(notification.last_sent) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowNotificationModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTestNotification(notification.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* Edit notification */}}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(notification.id, notification.status === 'active' ? 'inactive' : 'active')}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        {notification.status === 'active' ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleStatusChange(notification.id, 'error')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Notification Detail Modal */}
      {showNotificationModal && selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Notification Details</h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedNotification.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedNotification.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <div className="mt-1">
                    {getTypeBadge(selectedNotification.type)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedNotification.status)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Triggers</label>
                  <div className="mt-1">
                    {selectedNotification.triggers?.map((trigger) => (
                      <span key={trigger} className="inline-block px-2 py-1 rounded text-xs mr-1 mb-1 bg-blue-100 text-blue-800">
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template</label>
                  <p className="text-sm text-gray-900">{selectedNotification.template}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statistics</label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-900">Sent: {formatNumber(selectedNotification.sent_count || 0)}</p>
                    <p className="text-sm text-gray-900">Delivery Rate: {selectedNotification.delivery_rate || 0}%</p>
                    <p className="text-sm text-gray-900">Last Sent: {selectedNotification.last_sent ? formatDate(selectedNotification.last_sent) : 'Never'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleTestNotification(selectedNotification.id)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Test Notification
                </button>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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

export default AdminNotifications; 
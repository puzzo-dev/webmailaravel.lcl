import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiClock,
  HiDeviceMobile,
  HiDesktopComputer,
  HiDeviceTablet,
  HiGlobe,
  HiLocationMarker,
  HiShieldCheck,
  HiShieldExclamation,
  HiRefresh,
  HiEye,
  HiX,
  HiLockClosed,
  HiExclamationTriangle,
  HiCheckCircle,
  HiInformationCircle,
  HiKey,
  HiCog,
} from 'react-icons/hi';
import { securityService } from '../services/api';
import toast from 'react-hot-toast';

const UserActivity = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [activityLog, setActivityLog] = useState([]);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [securitySummary, setSecuritySummary] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [activityResponse, devicesResponse, sessionsResponse, summaryResponse] = await Promise.all([
        securityService.getActivityLog(),
        securityService.getTrustedDevices(),
        securityService.getActiveSessions(),
        securityService.getSecuritySummary(),
      ]);

      setActivityLog(activityResponse.data || []);
      setTrustedDevices(devicesResponse.data || []);
      setActiveSessions(sessionsResponse.data || []);
      setSecuritySummary(summaryResponse.data || {});
    } catch (error) {
      toast.error('Failed to load security data');
      console.error('Security data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAllData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTrustDevice = async (deviceId) => {
    try {
      await securityService.trustDevice(deviceId);
      toast.success('Device trusted successfully');
      await loadAllData();
    } catch (error) {
      toast.error('Failed to trust device');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await securityService.revokeSession(sessionId);
      toast.success('Session revoked successfully');
      await loadAllData();
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <HiDeviceMobile className="h-6 w-6" />;
      case 'tablet':
        return <HiDeviceTablet className="h-6 w-6" />;
      case 'desktop':
      default:
        return <HiDesktopComputer className="h-6 w-6" />;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return <HiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'logout':
        return <HiX className="h-5 w-5 text-gray-500" />;
      case 'password_change':
        return <HiLockClosed className="h-5 w-5 text-blue-500" />;
      case 'security_alert':
        return <HiExclamationTriangle className="h-5 w-5 text-red-500" />;
      case 'api_access':
        return <HiKey className="h-5 w-5 text-purple-500" />;
      default:
        return <HiInformationCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const tabs = [
    { id: 'activity', name: 'Recent Activity', icon: HiClock },
    { id: 'devices', name: 'Trusted Devices', icon: HiDeviceMobile },
    { id: 'sessions', name: 'Active Sessions', icon: HiGlobe },
    { id: 'security', name: 'Security Overview', icon: HiShieldCheck },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <HiShieldCheck className="h-8 w-8 mr-3 text-primary-600" />
              Security & Activity
            </h1>
            <p className="mt-2 text-gray-600">
              Monitor your account activity, manage devices, and review security settings.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <HiRefresh className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Security Overview Tab */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Security Score */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Score</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    (securitySummary.security_score || 0) >= 80 ? 'bg-green-100' : 
                    (securitySummary.security_score || 0) >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-2xl font-bold ${
                      (securitySummary.security_score || 0) >= 80 ? 'text-green-600' : 
                      (securitySummary.security_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {securitySummary.security_score || 0}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Your security score</p>
                    <p className="text-sm text-gray-500">Based on your security settings</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (securitySummary.security_score || 0) >= 80 ? 'bg-green-100 text-green-800' : 
                    (securitySummary.security_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(securitySummary.security_score || 0) >= 80 ? 'Excellent' : 
                     (securitySummary.security_score || 0) >= 60 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Two-Factor Authentication</span>
                  <span className={`font-medium ${securitySummary.two_factor_enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {securitySummary.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Sessions</span>
                  <span className="font-medium text-gray-900">{securitySummary.active_sessions_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Trusted Devices</span>
                  <span className="font-medium text-gray-900">{securitySummary.trusted_devices_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">API Keys</span>
                  <span className="font-medium text-gray-900">{securitySummary.api_keys_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Security Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Recommendations</h3>
              <div className="space-y-3">
                {!securitySummary.two_factor_enabled && (
                  <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <HiExclamationTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Enable Two-Factor Authentication</p>
                      <p className="text-sm text-yellow-700 mt-1">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                )}
                {(securitySummary.active_sessions_count || 0) > 3 && (
                  <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <HiInformationCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Review Active Sessions</p>
                      <p className="text-sm text-blue-700 mt-1">You have multiple active sessions. Review and revoke any unnecessary ones.</p>
                    </div>
                  </div>
                )}
                {securitySummary.last_password_change && new Date() - new Date(securitySummary.last_password_change) > 90 * 24 * 60 * 60 * 1000 && (
                  <div className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <HiLockClosed className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Update Your Password</p>
                      <p className="text-sm text-orange-700 mt-1">Consider changing your password regularly for better security.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiClock className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="ml-3 text-sm text-gray-600">Last Activity</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {activityLog[0] ? formatTimeAgo(activityLog[0].created_at) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <HiDeviceMobile className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="ml-3 text-sm text-gray-600">Devices</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{trustedDevices.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <HiGlobe className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="ml-3 text-sm text-gray-600">Sessions</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{activeSessions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activityLog.length > 0 ? (
                activityLog.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <div className="flex items-center mt-1 space-x-2 text-sm text-gray-500">
                            {activity.ip_address && (
                              <span className="flex items-center">
                                <HiLocationMarker className="h-3 w-3 mr-1" />
                                {activity.ip_address}
                              </span>
                            )}
                            {activity.user_agent && (
                              <span className="truncate max-w-xs">{activity.user_agent}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{formatTimeAgo(activity.created_at)}</p>
                          {activity.location && (
                            <p className="text-xs text-gray-500 mt-1">{activity.location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <HiClock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Your account activity will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trusted Devices</h3>
            <div className="space-y-4">
              {trustedDevices.length > 0 ? (
                trustedDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 text-gray-400">
                        {getDeviceIcon(device.device_type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{device.device_name || 'Unknown Device'}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{device.device_type}</span>
                          {device.ip_address && (
                            <>
                              <span>•</span>
                              <span>{device.ip_address}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Last used {formatTimeAgo(device.last_used_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {device.trusted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <HiShieldCheck className="h-3 w-3 mr-1" />
                          Trusted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTrustDevice(device.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Trust Device
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <HiDeviceMobile className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No trusted devices</h3>
                  <p className="mt-1 text-sm text-gray-500">Devices you trust will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
            <div className="space-y-4">
              {activeSessions.length > 0 ? (
                activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <HiGlobe className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session.user_agent || 'Unknown Browser'}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{session.ip_address}</span>
                          {session.is_current && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">Current Session</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Last activity {formatTimeAgo(session.last_activity)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!session.is_current && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <HiGlobe className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active sessions</h3>
                  <p className="mt-1 text-sm text-gray-500">Your active sessions will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivity;

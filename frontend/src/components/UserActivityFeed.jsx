import React, { useState, useEffect } from 'react';
import {
  HiPlus,
  HiPaperAirplane,
  HiCheckCircle,
  HiXCircle,
  HiLogin,
  HiLogout,
  HiUser,
  HiCreditCard,
  HiRefresh,
  HiGlobe,
  HiMail,
  HiBan,
  HiShieldCheck,
  HiInformationCircle,
  HiClock,
  HiX,
  HiExclamationCircle,
  HiExclamation
} from 'react-icons/hi';
import { userActivityService } from '../services/api';

const UserActivityFeed = ({ limit = 10, showHeader = true, className = '' }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadActivities();
  }, [limit]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userActivityService.getActivities({ limit });
      setActivities(response.data || []);
    } catch (err) {
      console.error('Failed to load user activities:', err);
      
      // Check if it's a 404 or route not found error (migration not run)
      if (err.response?.status === 404 || err.message?.includes('404')) {
        // Show sample activities until migration is run
        const sampleActivities = [
          {
            id: 'sample-1',
            activity_type: 'login',
            activity_description: 'User logged in',
            created_at: new Date().toISOString(),
            icon: 'HiLogin',
            color: 'blue'
          },
          {
            id: 'sample-2',
            activity_type: 'dashboard_view',
            activity_description: 'Viewed dashboard',
            created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            icon: 'HiUser',
            color: 'green'
          },
          {
            id: 'sample-3',
            activity_type: 'system_info',
            activity_description: 'Activity tracking will show real data once migration is run',
            created_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            icon: 'HiInformationCircle',
            color: 'yellow'
          }
        ];
        setActivities(sampleActivities);
        setError(null); // Clear error since we're showing sample data
      } else {
        setError('Failed to load activities. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (iconName, color) => {
    const iconProps = { className: `h-4 w-4 text-${color}-600` };
    
    switch (iconName) {
      case 'HiPlus':
        return <HiPlus {...iconProps} />;
      case 'HiPaperAirplane':
        return <HiPaperAirplane {...iconProps} />;
      case 'HiCheckCircle':
        return <HiCheckCircle {...iconProps} />;
      case 'HiXCircle':
        return <HiXCircle {...iconProps} />;
      case 'HiLogin':
        return <HiLogin {...iconProps} />;
      case 'HiLogout':
        return <HiLogout {...iconProps} />;
      case 'HiUser':
        return <HiUser {...iconProps} />;
      case 'HiCreditCard':
        return <HiCreditCard {...iconProps} />;
      case 'HiRefresh':
        return <HiRefresh {...iconProps} />;
      case 'HiGlobe':
        return <HiGlobe {...iconProps} />;
      case 'HiMail':
        return <HiMail {...iconProps} />;
      case 'HiBan':
        return <HiBan {...iconProps} />;
      case 'HiShieldCheck':
        return <HiShieldCheck {...iconProps} />;
      default:
        return <HiInformationCircle {...iconProps} />;
    }
  };

  const getActivityBgColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      red: 'bg-red-100',
      yellow: 'bg-yellow-100',
      purple: 'bg-purple-100',
      indigo: 'bg-indigo-100',
      orange: 'bg-orange-100',
      teal: 'bg-teal-100',
      cyan: 'bg-cyan-100',
      gray: 'bg-gray-100'
    };
    return colorMap[color] || 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        {showHeader && <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="p-2 rounded-lg bg-gray-200 w-8 h-8"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        {showHeader && <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>}
        <div className="text-center py-8">
          <HiExclamation className="h-12 w-12 mx-auto text-red-300 mb-4" />
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={loadActivities}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button
            onClick={loadActivities}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        </div>
      )}
      
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className={`p-2 rounded-lg ${getActivityBgColor(activity.color)}`}>
                {getActivityIcon(activity.icon, activity.color)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <HiClock className="h-3 w-3 mr-1" />
                  {activity.time_ago}
                </p>
              </div>
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="text-xs text-gray-400">
                  <HiInformationCircle className="h-3 w-3" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <HiClock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No recent activity</p>
            <p className="text-sm">Your activities will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityFeed;

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Custom hook for managing dashboard state and operations
 * Consolidates dashboard logic from Dashboard component
 */
const useDashboard = () => {
  const { user, currentView } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default empty dashboard structure to prevent component errors
  const getEmptyDashboardData = () => ({
    campaigns: {},
    users: {},
    performance: {},
    deliverability: {},
    revenue: {},
    reputation: {},
    bounce_processing: {},
    suppression: {}
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the dedicated dashboard endpoint that provides role-appropriate data
      const response = await analyticsService.getDashboardData();
      
      // Ensure we have the expected data structure
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
      setError(error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
      } else {
        toast.error(getErrorMessage(error));
      }
      
      // Set empty data structure to prevent component errors
      setDashboardData(getEmptyDashboardData());
    } finally {
      setLoading(false);
    }
  };

  // Handle admin dashboard redirection
  const handleAdminRedirection = () => {
    if (user && user.role === 'admin' && currentView === 'admin') {
      navigate('/admin', { replace: true });
      return true;
    }
    return false;
  };

  // Initialize dashboard data
  useEffect(() => {
    if (user) {
      // Check if we need to redirect to admin dashboard
      if (handleAdminRedirection()) {
        return;
      }
      fetchDashboardData();
    }
  }, [user, currentView, navigate]);

  // Get dashboard stats summary
  const getDashboardStats = () => {
    if (!dashboardData) return null;

    const stats = {
      totalCampaigns: dashboardData.campaigns?.total || 0,
      activeCampaigns: dashboardData.campaigns?.active || 0,
      totalUsers: dashboardData.users?.total || 0,
      deliveryRate: dashboardData.performance?.delivery_rate || 0,
      bounceRate: dashboardData.performance?.bounce_rate || 0,
      totalRevenue: dashboardData.revenue?.total || 0,
      monthlyRevenue: dashboardData.revenue?.monthly || 0,
    };

    return stats;
  };

  // Get campaign performance data
  const getCampaignPerformance = () => {
    if (!dashboardData?.campaigns) return null;

    return {
      total: dashboardData.campaigns.total || 0,
      active: dashboardData.campaigns.active || 0,
      completed: dashboardData.campaigns.completed || 0,
      draft: dashboardData.campaigns.draft || 0,
      scheduled: dashboardData.campaigns.scheduled || 0,
    };
  };

  // Get deliverability metrics
  const getDeliverabilityMetrics = () => {
    if (!dashboardData?.deliverability) return null;

    return {
      delivered: dashboardData.deliverability.delivered || 0,
      bounced: dashboardData.deliverability.bounced || 0,
      opened: dashboardData.deliverability.opened || 0,
      clicked: dashboardData.deliverability.clicked || 0,
      rate: dashboardData.deliverability.rate || 0,
    };
  };

  // Get user activity data
  const getUserActivity = () => {
    if (!dashboardData?.users) return null;

    return {
      total: dashboardData.users.total || 0,
      active: dashboardData.users.active || 0,
      newThisMonth: dashboardData.users.new_this_month || 0,
      loginToday: dashboardData.users.login_today || 0,
    };
  };

  // Get reputation status
  const getReputationStatus = () => {
    if (!dashboardData?.reputation) return null;

    return {
      score: dashboardData.reputation.score || 0,
      status: dashboardData.reputation.status || 'unknown',
      domains: dashboardData.reputation.domains || [],
      alerts: dashboardData.reputation.alerts || [],
    };
  };

  // Get bounce processing stats
  const getBounceProcessingStats = () => {
    if (!dashboardData?.bounce_processing) return null;

    return {
      processed: dashboardData.bounce_processing.processed || 0,
      pending: dashboardData.bounce_processing.pending || 0,
      hardBounces: dashboardData.bounce_processing.hard_bounces || 0,
      softBounces: dashboardData.bounce_processing.soft_bounces || 0,
    };
  };

  // Get suppression list stats
  const getSuppressionStats = () => {
    if (!dashboardData?.suppression) return null;

    return {
      total: dashboardData.suppression.total || 0,
      hardBounces: dashboardData.suppression.hard_bounces || 0,
      complaints: dashboardData.suppression.complaints || 0,
      unsubscribes: dashboardData.suppression.unsubscribes || 0,
    };
  };

  // Check if dashboard has data
  const hasData = () => {
    return dashboardData && Object.keys(dashboardData).length > 0;
  };

  // Refresh dashboard data
  const refreshDashboard = () => {
    fetchDashboardData();
  };

  return {
    // State
    dashboardData,
    loading,
    error,
    user,
    currentView,

    // Actions
    fetchDashboardData,
    refreshDashboard,
    handleAdminRedirection,

    // Data getters
    getDashboardStats,
    getCampaignPerformance,
    getDeliverabilityMetrics,
    getUserActivity,
    getReputationStatus,
    getBounceProcessingStats,
    getSuppressionStats,

    // Utilities
    hasData,
    getEmptyDashboardData,
  };
};

export default useDashboard;

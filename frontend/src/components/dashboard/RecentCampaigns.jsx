import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDate } from '../../utils/helpers';
import {
  HiMail,
  HiEye,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiPause,
} from 'react-icons/hi';

const RecentCampaigns = ({ campaigns, isLoading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <HiCheckCircle className="h-4 w-4 text-success-600" />;
      case 'failed':
        return <HiXCircle className="h-4 w-4 text-danger-600" />;
      case 'paused':
        return <HiPause className="h-4 w-4 text-warning-600" />;
      default:
        return <HiClock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'RUNNING':
        return 'bg-success-100 text-success-800';
      case 'paused':
      case 'PAUSED':
        return 'bg-warning-100 text-warning-800';
      case 'stopped':
      case 'STOPPED':
        return 'bg-danger-100 text-danger-800';
      case 'completed':
      case 'COMPLETED':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Campaigns</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Campaigns</h3>
      </div>
      <div className="p-6">
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <HiEye className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first campaign.
            </p>
            <div className="mt-6">
              <Link
                to="/campaigns/new"
                className="btn btn-primary"
              >
                Create Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.slice(0, 5).map((campaign) => (
              <Link
                key={campaign.id}
                to={`/campaigns/${campaign.id}`}
                className="group block"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex-shrink-0">
                    {getStatusIcon(campaign.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
                      {campaign.name}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {campaign.emails_sent || 0} sent
                      </span>
                      {campaign.open_rate && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <HiEye className="h-3 w-3 mr-1" />
                          {campaign.open_rate}%
                        </span>
                      )}
                      {campaign.click_rate && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <HiCursorClick className="h-3 w-3 mr-1" />
                          {campaign.click_rate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {formatDate(campaign.created_at)}
                  </div>
                </div>
              </Link>
            ))}
            
            {campaigns.length > 5 && (
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/campaigns"
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  View all campaigns →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentCampaigns; 
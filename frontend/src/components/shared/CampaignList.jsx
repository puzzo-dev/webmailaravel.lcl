import React from 'react';
import { Link } from 'react-router-dom';
import { HiMail, HiEye, HiPencil, HiTrash, HiPlay, HiPause, HiStop } from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import StatusBadge from './StatusBadge';

const CampaignList = ({
  campaigns,
  loading = false,
  onEdit = null,
  onDelete = null,
  onStart = null,
  onPause = null,
  onStop = null,
  showActions = true,
  emptyMessage = "No campaigns found",
  className = ""
}) => {
  const getActionButtons = (campaign) => {
    const buttons = [];

    if (onStart && campaign.status === 'draft') {
      buttons.push(
        <button
          key="start"
          onClick={() => onStart(campaign.id)}
          className="text-green-600 hover:text-green-900"
          title="Start campaign"
        >
          <HiPlay className="h-4 w-4" />
        </button>
      );
    }

    if (onPause && campaign.status === 'active') {
      buttons.push(
        <button
          key="pause"
          onClick={() => onPause(campaign.id)}
          className="text-yellow-600 hover:text-yellow-900"
          title="Pause campaign"
        >
          <HiPause className="h-4 w-4" />
        </button>
      );
    }

    if (onStop && (campaign.status === 'active' || campaign.status === 'paused')) {
      buttons.push(
        <button
          key="stop"
          onClick={() => onStop(campaign.id)}
          className="text-red-600 hover:text-red-900"
          title="Stop campaign"
        >
          <HiStop className="h-4 w-4" />
        </button>
      );
    }

    if (onEdit && campaign.status === 'draft') {
      buttons.push(
        <Link
          key="edit"
          to={`/campaigns/${campaign.id}/edit`}
          className="text-blue-600 hover:text-blue-900"
          title="Edit campaign"
        >
          <HiPencil className="h-4 w-4" />
        </Link>
      );
    }

    if (onDelete) {
      buttons.push(
        <button
          key="delete"
          onClick={() => onDelete(campaign.id)}
          className="text-red-600 hover:text-red-900"
          title="Delete campaign"
        >
          <HiTrash className="h-4 w-4" />
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <HiMail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first email campaign.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="divide-y divide-gray-200">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HiMail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {campaign.name}
                    </h3>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatDate(campaign.created_at)}
                    {campaign.sent_at && ` • Sent: ${formatDate(campaign.sent_at)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {/* Campaign Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {formatNumber(campaign.recipient_count || 0)}
                    </div>
                    <div className="text-xs">Recipients</div>
                  </div>
                  {campaign.total_sent > 0 && (
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {formatNumber(campaign.total_sent)}
                      </div>
                      <div className="text-xs">Sent</div>
                    </div>
                  )}
                  {campaign.opens > 0 && (
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {formatNumber(campaign.opens)}
                      </div>
                      <div className="text-xs">Opens</div>
                    </div>
                  )}
                  {campaign.clicks > 0 && (
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {formatNumber(campaign.clicks)}
                      </div>
                      <div className="text-xs">Clicks</div>
                    </div>
                  )}
                  {campaign.open_rate > 0 && (
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {(campaign.open_rate || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs">Open Rate</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="View campaign details"
                    >
                      <HiEye className="h-4 w-4" />
                    </Link>
                    {getActionButtons(campaign)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignList; 
import React from 'react';
import {
  HiCheckCircle,
  HiClock,
  HiExclamation,
  HiPlay,
  HiPause,
  HiStop,
  HiXCircle,
  HiEye,
  HiEyeOff
} from 'react-icons/hi';

const StatusBadge = ({ status, size = 'sm' }) => {
  const statusConfig = {
    // Campaign statuses
    active: { color: 'bg-green-100 text-green-800', icon: HiPlay },
    paused: { color: 'bg-yellow-100 text-yellow-800', icon: HiPause },
    completed: { color: 'bg-blue-100 text-blue-800', icon: HiCheckCircle },
    draft: { color: 'bg-gray-100 text-gray-800', icon: HiClock },
    failed: { color: 'bg-red-100 text-red-800', icon: HiExclamation },
    stopped: { color: 'bg-red-100 text-red-800', icon: HiStop },
    
    // User statuses
    online: { color: 'bg-green-100 text-green-800', icon: HiCheckCircle },
    offline: { color: 'bg-gray-100 text-gray-800', icon: HiXCircle },
    
    // Notification statuses
    read: { color: 'bg-gray-100 text-gray-800', icon: HiEye },
    unread: { color: 'bg-blue-100 text-blue-800', icon: HiEyeOff },
    
    // System statuses
    success: { color: 'bg-green-100 text-green-800', icon: HiCheckCircle },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: HiExclamation },
    error: { color: 'bg-red-100 text-red-800', icon: HiXCircle },
    info: { color: 'bg-blue-100 text-blue-800', icon: HiCheckCircle }
  };
  
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      <Icon className={`${iconSizes[size]} mr-1`} />
      {status}
    </span>
  );
};

export default StatusBadge; 
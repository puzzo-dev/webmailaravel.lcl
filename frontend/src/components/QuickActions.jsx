import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiInbox,
  HiChartBar,
  HiUser,
  HiGlobe,
  HiMail,
  HiCog,
  HiBell,
  HiShieldCheck,
  HiDocumentText,
  HiAtSymbol,
} from 'react-icons/hi';

const QuickActions = ({ _user }) => {
  const navigate = useNavigate();
  const [webmailUrl, setWebmailUrl] = useState(null);

  // Fetch system settings to get webmail URL
  useEffect(() => {
    const fetchWebmailSettings = async () => {
      try {
        const response = await adminService.getSystemSettings();
        if (response.success && response.data?.webmail) {
          const { url, enabled } = response.data.webmail;
          // Only set URL if webmail is enabled and URL is provided
          if (enabled && url && url.trim()) {
            setWebmailUrl(url.trim());
          }
        }
      } catch (error) {
        // Silently fail - webmail button won't show if URL not available
        console.log('Could not fetch webmail settings:', error);
      }
    };

    fetchWebmailSettings();
  }, []);

  // Handle webmail button click
  const handleWebmailClick = useCallback(() => {
    if (webmailUrl) {
      window.open(webmailUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Webmail URL not configured');
    }
  }, [webmailUrl]);

  // Define actions based on what users typically need
  const quickActions = [
    {
      id: 'new-campaign',
      title: 'Create Campaign',
      description: 'Start a new email campaign',
      icon: HiPlus,
      action: () => navigate('/campaigns/new'),
      shortcut: 'Ctrl+N',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'campaigns',
      title: 'View Campaigns',
      description: 'Manage your campaigns',
      icon: HiMail,
      action: () => navigate('/campaigns'),
      shortcut: 'Ctrl+C',
      color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Check performance metrics',
      icon: HiChartBar,
      action: () => navigate('/analytics'),
      shortcut: 'Ctrl+A',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    },
    {
      id: 'senders',
      title: 'Senders',
      description: 'Manage sender accounts',
      icon: HiUser,
      action: () => navigate('/senders'),
      shortcut: 'Ctrl+S',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    },
    {
      id: 'domains',
      title: 'Domains',
      description: 'Configure sending domains',
      icon: HiGlobe,
      action: () => navigate('/domains'),
      shortcut: 'Ctrl+D',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    },
    // Conditionally add webmail button if URL is available, otherwise show content button
    webmailUrl ? {
      id: 'webmail',
      title: 'Webmail',
      description: 'Access webmail system',
      icon: HiAtSymbol,
      action: handleWebmailClick,
      shortcut: 'Ctrl+W',
      color: 'bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
    } : {
      id: 'content',
      title: 'Content',
      description: 'Manage email templates',
      icon: HiDocumentText,
      action: () => navigate('/content'),
      shortcut: 'Ctrl+T',
      color: 'bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
    },
  ];

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            navigate('/campaigns/new');
            break;
          case 'c':
            e.preventDefault();
            navigate('/campaigns');
            break;
          case 'a':
            e.preventDefault();
            navigate('/analytics');
            break;
          case 's':
            e.preventDefault();
            navigate('/senders');
            break;
          case 'd':
            e.preventDefault();
            navigate('/domains');
            break;
          case 't':
            if (!webmailUrl) {
              e.preventDefault();
              navigate('/content');
            }
            break;
          case 'w':
            if (webmailUrl) {
              e.preventDefault();
              handleWebmailClick();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, webmailUrl, handleWebmailClick]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Use keyboard shortcuts for faster access
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg`}
          >
            <div className="text-center">
              <action.icon className="h-8 w-8 mx-auto mb-3 text-white" />
              <div className="text-sm font-medium text-white">{action.title}</div>
              <div className="text-xs opacity-90 mt-1 text-white/90">{action.shortcut}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions; 
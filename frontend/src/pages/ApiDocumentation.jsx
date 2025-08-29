import React, { useState } from 'react';
import {
  HiCode,
  HiKey,
  HiGlobe,
  HiMail,
  HiUsers,
  HiChartBar,
  HiShieldCheck,
  HiCog,
  HiDatabase,
  HiLightningBolt,
  HiExternalLink,
  HiClipboard,
  HiCheckCircle,
  HiHome,
  HiLockClosed,
  HiUser,
  HiBan,
  HiCreditCard,
  HiLink,
  HiInformationCircle,
  HiExclamation,
  HiPlay,
  HiDownload,
  HiBookOpen,
  HiTerminal,
  HiCollection,
  HiColorSwatch,
  HiCube,
  HiSparkles,
  HiChevronRight
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const ApiDocumentation = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [activeEndpoint, setActiveEndpoint] = useState(null);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const apiEndpoints = {
    authentication: [
      {
        method: 'POST',
        endpoint: '/api/auth/login',
        description: 'Authenticate user and get JWT token',
        parameters: ['identifier', 'password', 'remember'],
        response: { success: true, token: 'jwt_token', user: 'user_object', expires_in: 3600 }
      },
      {
        method: 'POST',
        endpoint: '/api/auth/register',
        description: 'Register new user account',
        parameters: ['name', 'email', 'password', 'password_confirmation'],
        response: { success: true, token: 'jwt_token', user: 'user_object' }
      },
      {
        method: 'POST',
        endpoint: '/api/auth/logout',
        description: 'Logout user and invalidate token',
        parameters: [],
        response: { success: true, message: 'Successfully logged out' }
      },
      {
        method: 'POST',
        endpoint: '/api/auth/refresh',
        description: 'Refresh JWT token',
        parameters: [],
        response: { success: true, token: 'new_jwt_token', expires_in: 3600 }
      },
      {
        method: 'POST',
        endpoint: '/api/auth/forgot-password',
        description: 'Send password reset email',
        parameters: ['email'],
        response: { success: true, message: 'Password reset email sent' }
      }
    ],
    campaigns: [
      {
        method: 'GET',
        endpoint: '/api/campaigns',
        description: 'Get all campaigns for authenticated user',
        parameters: ['page', 'per_page', 'status', 'search', 'sort'],
        response: { data: 'campaigns_array', meta: 'pagination_info', links: 'pagination_links' }
      },
      {
        method: 'POST',
        endpoint: '/api/campaigns',
        description: 'Create new email campaign',
        parameters: ['name', 'subject', 'content', 'recipients', 'sender_id', 'domain_id', 'schedule_at'],
        response: { success: true, data: 'campaign_object' }
      },
      {
        method: 'GET',
        endpoint: '/api/campaigns/{id}',
        description: 'Get specific campaign details',
        parameters: ['id'],
        response: { success: true, data: 'campaign_object' }
      },
      {
        method: 'PUT',
        endpoint: '/api/campaigns/{id}',
        description: 'Update campaign details',
        parameters: ['id', 'name', 'subject', 'content'],
        response: { success: true, data: 'updated_campaign_object' }
      },
      {
        method: 'POST',
        endpoint: '/api/campaigns/{id}/send',
        description: 'Send campaign to recipients',
        parameters: ['id', 'send_at'],
        response: { success: true, message: 'Campaign queued for sending' }
      },
      {
        method: 'POST',
        endpoint: '/api/campaigns/{id}/test',
        description: 'Send test email for campaign',
        parameters: ['id', 'test_emails'],
        response: { success: true, message: 'Test email sent' }
      },
      {
        method: 'DELETE',
        endpoint: '/api/campaigns/{id}',
        description: 'Delete campaign',
        parameters: ['id'],
        response: { success: true, message: 'Campaign deleted' }
      }
    ],
    analytics: [
      {
        method: 'GET',
        endpoint: '/api/analytics/dashboard',
        description: 'Get dashboard analytics data',
        parameters: ['period', 'start_date', 'end_date'],
        response: { campaigns: 'stats', deliverability: 'stats', performance: 'stats', bounce_processing: 'stats' }
      },
      {
        method: 'GET',
        endpoint: '/api/analytics/campaigns/{id}',
        description: 'Get campaign-specific analytics',
        parameters: ['id', 'period'],
        response: { opens: 'number', clicks: 'number', bounces: 'number', deliveries: 'number', unsubscribes: 'number' }
      },
      {
        method: 'GET',
        endpoint: '/api/analytics/geographic',
        description: 'Get geographic analytics data',
        parameters: ['period', 'campaign_id'],
        response: { countries: 'array', cities: 'array', regions: 'array' }
      },
      {
        method: 'GET',
        endpoint: '/api/analytics/devices',
        description: 'Get device and browser analytics',
        parameters: ['period', 'campaign_id'],
        response: { devices: 'array', browsers: 'array', operating_systems: 'array' }
      }
    ],
    users: [
      {
        method: 'GET',
        endpoint: '/api/user/profile',
        description: 'Get user profile information',
        parameters: [],
        response: { success: true, data: 'user_object' }
      },
      {
        method: 'PUT',
        endpoint: '/api/user/profile',
        description: 'Update user profile',
        parameters: ['name', 'email', 'phone', 'timezone'],
        response: { success: true, data: 'updated_user_object' }
      },
      {
        method: 'PUT',
        endpoint: '/api/user/password',
        description: 'Change user password',
        parameters: ['current_password', 'new_password', 'new_password_confirmation'],
        response: { success: true, message: 'Password updated successfully' }
      },
      {
        method: 'GET',
        endpoint: '/api/user/settings',
        description: 'Get user settings',
        parameters: [],
        response: { success: true, data: 'settings_object' }
      },
      {
        method: 'GET',
        endpoint: '/api/user/activities',
        description: 'Get user activity history',
        parameters: ['limit', 'page', 'type'],
        response: { success: true, data: 'activities_array' }
      }
    ],
    domains: [
      {
        method: 'GET',
        endpoint: '/api/domains',
        description: 'Get all domains for authenticated user',
        parameters: ['page', 'per_page', 'status'],
        response: { success: true, data: 'domains_array', meta: 'pagination_info' }
      },
      {
        method: 'POST',
        endpoint: '/api/domains',
        description: 'Add new domain',
        parameters: ['domain', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password'],
        response: { success: true, data: 'domain_object' }
      },
      {
        method: 'GET',
        endpoint: '/api/domains/{id}',
        description: 'Get specific domain details',
        parameters: ['id'],
        response: { success: true, data: 'domain_object' }
      },
      {
        method: 'POST',
        endpoint: '/api/domains/{id}/verify',
        description: 'Verify domain DNS records',
        parameters: ['id'],
        response: { success: true, data: 'verification_results' }
      },
      {
        method: 'DELETE',
        endpoint: '/api/domains/{id}',
        description: 'Delete domain',
        parameters: ['id'],
        response: { success: true, message: 'Domain deleted' }
      }
    ],
    senders: [
      {
        method: 'GET',
        endpoint: '/api/senders',
        description: 'Get all senders for authenticated user',
        parameters: ['page', 'per_page', 'domain_id'],
        response: { success: true, data: 'senders_array', meta: 'pagination_info' }
      },
      {
        method: 'POST',
        endpoint: '/api/senders',
        description: 'Add new sender identity',
        parameters: ['name', 'email', 'domain_id', 'reply_to'],
        response: { success: true, data: 'sender_object' }
      },
      {
        method: 'POST',
        endpoint: '/api/senders/{id}/verify',
        description: 'Send verification email to sender',
        parameters: ['id'],
        response: { success: true, message: 'Verification email sent' }
      },
      {
        method: 'DELETE',
        endpoint: '/api/senders/{id}',
        description: 'Delete sender identity',
        parameters: ['id'],
        response: { success: true, message: 'Sender deleted' }
      }
    ],
    suppression: [
      {
        method: 'GET',
        endpoint: '/api/suppression-list',
        description: 'Get suppression list entries',
        parameters: ['page', 'per_page', 'type', 'search'],
        response: { success: true, data: 'suppression_entries', meta: 'pagination_info' }
      },
      {
        method: 'POST',
        endpoint: '/api/suppression-list',
        description: 'Add email to suppression list',
        parameters: ['email', 'type', 'reason'],
        response: { success: true, message: 'Email added to suppression list' }
      },
      {
        method: 'DELETE',
        endpoint: '/api/suppression-list/{id}',
        description: 'Remove email from suppression list',
        parameters: ['id'],
        response: { success: true, message: 'Email removed from suppression list' }
      }
    ],
    billing: [
      {
        method: 'GET',
        endpoint: '/api/plans',
        description: 'Get available billing plans (public)',
        parameters: [],
        response: { success: true, data: 'plans_array' }
      },
      {
        method: 'GET',
        endpoint: '/api/billing/subscription',
        description: 'Get current user subscription',
        parameters: [],
        response: { success: true, data: 'subscription_object' }
      },
      {
        method: 'POST',
        endpoint: '/api/billing/subscribe',
        description: 'Subscribe to a plan',
        parameters: ['plan_id', 'payment_method'],
        response: { success: true, data: 'subscription_object' }
      },
      {
        method: 'GET',
        endpoint: '/api/billing/invoices',
        description: 'Get billing invoices',
        parameters: ['page', 'per_page'],
        response: { success: true, data: 'invoices_array' }
      }
    ]
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center mb-4">
          <HiSparkles className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Email Campaign Management API</h1>
        </div>
        <p className="text-blue-100 text-lg">
          Comprehensive API documentation for managing email campaigns, users, analytics, and more.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-sm font-medium">Version: 1.0</span>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-sm font-medium">Base URL: /api</span>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-sm font-medium">Format: JSON</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <HiKey className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Authentication</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            JWT-based authentication system with secure token management and user session handling.
          </p>
          <button
            onClick={() => setActiveSection('authentication')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Authentication →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <HiMail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Campaign Management</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Create, manage, and send email campaigns with advanced targeting and scheduling features.
          </p>
          <button
            onClick={() => setActiveSection('campaigns')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Campaigns →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <HiChartBar className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Analytics & Tracking</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Comprehensive analytics with open tracking, click tracking, and detailed performance metrics.
          </p>
          <button
            onClick={() => setActiveSection('analytics')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Analytics →
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start">
          <HiInformationCircle className="h-6 w-6 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">Getting Started</h3>
            <div className="text-amber-800 space-y-2">
              <p>1. <strong>Get your API key</strong> from the Account Settings page</p>
              <p>2. <strong>Include the API key</strong> in the Authorization header: <code className="bg-amber-100 px-2 py-1 rounded">Bearer YOUR_API_KEY</code></p>
              <p>3. <strong>Make requests</strong> to the API endpoints using HTTPS</p>
              <p>4. <strong>Handle responses</strong> in JSON format with proper error handling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEndpointSection = (sectionKey) => {
    const endpoints = apiEndpoints[sectionKey] || [];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize">{sectionKey} API</h2>
          <p className="text-gray-600 mb-6">
            Manage {sectionKey} through these RESTful API endpoints.
          </p>

          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveEndpoint(activeEndpoint === `${sectionKey}-${index}` ? null : `${sectionKey}-${index}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-800">{endpoint.endpoint}</code>
                    </div>
                    <HiChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${activeEndpoint === `${sectionKey}-${index}` ? 'rotate-90' : ''
                      }`} />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{endpoint.description}</p>
                </div>

                {activeEndpoint === `${sectionKey}-${index}` && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                        <div className="space-y-2">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="flex items-center space-x-2">
                              <code className="bg-gray-200 px-2 py-1 rounded text-sm">{param}</code>
                              <span className="text-xs text-gray-500">string</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Response</h4>
                        <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(endpoint.response, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Example Request</h4>
                      <div className="bg-gray-800 text-gray-100 p-3 rounded">
                        <code className="text-sm">
                          curl -X {endpoint.method} \<br />
                          &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br />
                          &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                          &nbsp;&nbsp;{window.location.origin}{endpoint.endpoint}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`curl -X ${endpoint.method} -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" ${window.location.origin}${endpoint.endpoint}`)}
                          className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <HiClipboard className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'authentication':
      case 'campaigns':
      case 'analytics':
        return renderEndpointSection(activeSection);
      case 'users':
      case 'domains':
      case 'senders':
      case 'suppression':
      case 'billing':
        return renderEndpointSection(activeSection);
      case 'webhooks':
        return renderWebhooksSection();
      case 'examples':
        return renderExamplesSection();
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <HiCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">Documentation for this section is being prepared.</p>
          </div>
        );
    }
  };

  const renderWebhooksSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Webhooks</h2>
        <p className="text-gray-600 mb-6">
          Webhooks allow you to receive real-time notifications about campaign events.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Webhook Events</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <code>campaign.sent</code> - Campaign has been sent</li>
            <li>• <code>campaign.failed</code> - Campaign sending failed</li>
            <li>• <code>email.opened</code> - Email was opened</li>
            <li>• <code>email.clicked</code> - Link in email was clicked</li>
            <li>• <code>email.bounced</code> - Email bounced</li>
            <li>• <code>email.unsubscribed</code> - Recipient unsubscribed</li>
          </ul>
        </div>

        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Example Webhook Payload:</h4>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify({
              event: "email.opened",
              timestamp: "2024-01-15T10:30:00Z",
              data: {
                campaign_id: 123,
                email_id: "abc123",
                recipient: "user@example.com",
                user_agent: "Mozilla/5.0...",
                ip_address: "192.168.1.1"
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );

  const renderExamplesSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Code Examples</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript/Node.js</h3>
            <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                {`// Create a new campaign
const response = await fetch('/api/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Campaign',
    subject: 'Hello World',
    content: '<h1>Hello!</h1>',
    sender_id: 1,
    domain_id: 1,
    recipients: ['user@example.com']
  })
});

const campaign = await response.json();`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">PHP/Laravel</h3>
            <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                {`<?php
// Using Guzzle HTTP client
$client = new \\GuzzleHttp\\Client(); // eslint-disable-line no-useless-escape

$response = $client->post('https://yourapi.com/api/campaigns', [
    'headers' => [
        'Authorization' => 'Bearer YOUR_JWT_TOKEN',
        'Content-Type' => 'application/json'
    ],
    'json' => [
        'name' => 'My Campaign',
        'subject' => 'Hello World',
        'content' => '<h1>Hello!</h1>',
        'sender_id' => 1,
        'domain_id' => 1,
        'recipients' => ['user@example.com']
    ]
]);

$campaign = json_decode($response->getBody(), true);`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Python</h3>
            <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                {`import requests

# Create a new campaign
url = 'https://yourapi.com/api/campaigns'
headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}
data = {
    'name': 'My Campaign',
    'subject': 'Hello World',
    'content': '<h1>Hello!</h1>',
    'sender_id': 1,
    'domain_id': 1,
    'recipients': ['user@example.com']
}

response = requests.post(url, headers=headers, json=data)
campaign = response.json()`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">API Documentation</h2>
          <div className="mt-2">
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/documentation`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center"
            >
              <HiExternalLink className="h-3 w-3 mr-1" />
              Swagger UI
            </a>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {['overview', 'authentication', 'campaigns', 'analytics', 'users', 'domains', 'senders', 'suppression', 'billing', 'webhooks', 'examples'].map((sectionId) => {
              const getIcon = (section) => {
                switch (section) {
                  case 'overview': return HiHome;
                  case 'authentication': return HiLockClosed;
                  case 'campaigns': return HiClipboard;
                  case 'analytics': return HiChartBar;
                  case 'users': return HiUser;
                  case 'domains': return HiGlobe;
                  case 'senders': return HiMail;
                  case 'suppression': return HiBan;
                  case 'billing': return HiCreditCard;
                  case 'webhooks': return HiLink;
                  case 'examples': return HiCode;
                  default: return HiCode;
                }
              };

              const Icon = getIcon(sectionId);
              const title = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

              return (
                <li key={sectionId}>
                  <button
                    onClick={() => setActiveSection(sectionId)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === sectionId
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ApiDocumentation;

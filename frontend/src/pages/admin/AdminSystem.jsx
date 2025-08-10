import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  HiCog,
  HiServer,
  HiDatabase,
  HiGlobe,
  HiMail,
  HiShieldCheck,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiInformationCircle,
  HiSave,
  HiRefresh,
  HiEye,
  HiPencil,
  HiTrash,
  HiPlus,
  HiKey,
  HiLockClosed,
  HiUser,
  HiChartBar,
  HiX,
  HiBell,
} from "react-icons/hi";
import {
  adminService,
  systemSettingsService,
} from "../../services/api";
import toast from "react-hot-toast";

const AdminSystem = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [editedConfig, setEditedConfig] = useState({});
  const [systemStatus, setSystemStatus] = useState({});
  const [systemConfig, setSystemConfig] = useState({});

  // Helper function to calculate memory usage percentage
  const calculateMemoryUsage = (memoryData) => {
    if (!memoryData || !memoryData.limit || !memoryData.current) return 0;

    const parseMemory = (memStr) => {
      const match = memStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
      if (!match) return 0;

      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();

      const multipliers = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        M: 1024 * 1024, // For PHP memory limit format like "512M"
        G: 1024 * 1024 * 1024,
      };

      return value * (multipliers[unit] || 1);
    };

    const limitBytes = parseMemory(memoryData.limit);
    const currentBytes = parseMemory(memoryData.current);

    if (limitBytes === 0) return 0;
    return Math.round((currentBytes / limitBytes) * 100);
  };

  const loadSystemData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusResponse, settingsResponse] = await Promise.all([
        adminService.getSystemStatus(),
        systemSettingsService.getSettings(),
      ]);

      // Transform the system status data to match frontend expectations
      const rawStatus = statusResponse.data || {};
      const transformedStatus = {
        // Overall system status
        status:
          rawStatus.database?.status === "connected" &&
            rawStatus.cache?.status === "connected"
            ? "healthy"
            : "warning",

        // System info
        uptime: rawStatus.uptime || "Unknown",
        version: rawStatus.system?.version || "1.0.0",
        last_backup: rawStatus.backup?.last_backup || null,

        // Service statuses
        database_status: rawStatus.database?.status || "unknown",
        cache_status: rawStatus.cache?.status || "unknown",
        queue_status: rawStatus.queue?.status || "unknown",

        // Resource usage
        storage_usage: rawStatus.storage?.usage_percent || 0,
        memory_usage: rawStatus.memory
          ? calculateMemoryUsage(rawStatus.memory)
          : 0,
        cpu_usage: rawStatus.cpu?.usage_percent || 0,

        // Raw data for other components
        database: rawStatus.database,
        cache: rawStatus.cache,
        queue: rawStatus.queue,
        storage: rawStatus.storage,
        memory: rawStatus.memory,
        disk: rawStatus.disk,
        system: rawStatus.system,
        cpu: rawStatus.cpu,
      };

      setSystemStatus(transformedStatus);
      setSystemConfig(settingsResponse.data || {});

      // Load additional configurations for specific tabs
      if (activeTab === "powermta") {
        try {
          const powermtaResponse = await adminService.getPowerMTAConfig();
          setSystemConfig((prev) => ({
            ...prev,
            powermta: powermtaResponse.data,
          }));
        } catch (error) {
          console.error('Failed to load PowerMTA config:', error);
          toast.error('Failed to load PowerMTA configuration');
        }
      } else if (activeTab === "telegram") {
        try {
          const telegramResponse = await adminService.getTelegramConfig();
          setSystemConfig((prev) => ({
            ...prev,
            telegram: telegramResponse.data,
          }));
        } catch (error) {
          console.error('Failed to load Telegram config:', error);
          toast.error('Failed to load Telegram configuration');
        }
      }
    } catch (error) {
      toast.error("Failed to load system data");
      console.error("System data error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadSystemData();
    }
  }, [user, activeTab, loadSystemData]);

  const handleSaveConfig = async () => {
    try {
      setLoading(true);

      // Handle different configuration types based on activeTab
      if (activeTab === "powermta") {
        await adminService.updatePowerMTAConfig(editedConfig);
      } else if (activeTab === "telegram") {
        await adminService.updateTelegramConfig(editedConfig);
      } else {
        // For regular system settings (system_smtp, webmail, system, notifications, btcpay)
        const updateData = { [activeTab]: editedConfig };
        await systemSettingsService.updateSettings(updateData);
      }

      toast.success("Configuration saved successfully");
      setShowEditModal(false);
      setSelectedConfig(null);
      setEditedConfig({});
      await loadSystemData();
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error("Save config error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setLoading(true);
      await loadSystemData();
      toast.success("System status refreshed");
    } catch (error) {
      toast.error("Failed to refresh system status");
      console.error("Refresh status error:", error);
    } finally {
      setLoading(false);
    }
  };

  const testSystemSMTP = async (email) => {
    try {
      setLoading(true);
      await systemSettingsService.testSmtp({ email });
      toast.success("Test email sent successfully! Check your inbox.");
    } catch (error) {
      toast.error(
        "Failed to send test email: " +
        (error.response?.data?.message || error.message)
      );
      console.error("SMTP test error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "running":
        return "success";
      case "warning":
        return "warning";
      case "error":
      case "disconnected":
      case "stopped":
        return "danger";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "running":
        return <HiCheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <HiExclamation className="w-4 h-4 text-yellow-500" />;
      case "error":
      case "disconnected":
      case "stopped":
        return <HiXCircle className="w-4 h-4 text-red-500" />;
      default:
        return <HiInformationCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Check if user has admin access
  if (user?.role !== "admin") {
    return (
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <div className="flex">
            <HiExclamation className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Access Denied
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to manage system settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              System Configuration
            </h1>
            <p className="mt-1 text-gray-600">
              Manage system settings and monitor system status
            </p>
          </div>
          <button
            onClick={handleRefreshStatus}
            disabled={loading}
            className="flex items-center btn btn-secondary"
          >
            <HiRefresh
              className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Status
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(
              systemStatus.status || "unknown"
            )}-100 text-${getStatusColor(
              systemStatus.status || "unknown"
            )}-800`}
          >
            {getStatusIcon(systemStatus.status || "unknown")}
            <span className="ml-1 capitalize">
              {systemStatus.status || "unknown"}
            </span>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemStatus.uptime}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Version</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemStatus.version}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Last Backup</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(systemStatus.last_backup).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Database</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(
                systemStatus.database?.status || "unknown"
              )}-100 text-${getStatusColor(
                systemStatus.database?.status || "unknown"
              )}-800`}
            >
              {getStatusIcon(systemStatus.database?.status || "unknown")}
              <span className="ml-1">
                {systemStatus.database?.status || "unknown"}
              </span>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Storage Usage</p>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {systemStatus.storage_usage}%
                </span>
              </div>
              <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${systemStatus.storage_usage > 80
                    ? "bg-red-600"
                    : systemStatus.storage_usage > 60
                      ? "bg-yellow-600"
                      : "bg-green-600"
                    }`}
                  style={{ width: `${systemStatus.storage_usage}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Memory Usage</p>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {systemStatus.memory_usage}%
                </span>
              </div>
              <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${systemStatus.memory_usage > 80
                    ? "bg-red-600"
                    : systemStatus.memory_usage > 60
                      ? "bg-yellow-600"
                      : "bg-green-600"
                    }`}
                  style={{ width: `${systemStatus.memory_usage}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">CPU Usage</p>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {systemStatus.cpu_usage}%
                </span>
              </div>
              <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${systemStatus.cpu_usage > 80
                    ? "bg-red-600"
                    : systemStatus.cpu_usage > 60
                      ? "bg-yellow-600"
                      : "bg-green-600"
                    }`}
                  style={{ width: `${systemStatus.cpu_usage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex px-4 overflow-x-auto scrollbar-hide md:px-6">
            {[
              {
                id: "overview",
                name: "Overview",
                shortName: "Overview",
                icon: HiServer,
              },
              {
                id: "system",
                name: "System Config",
                shortName: "System",
                icon: HiCog,
              },
              {
                id: "system_smtp",
                name: "System SMTP",
                shortName: "SMTP",
                icon: HiMail,
              },
              {
                id: "webmail",
                name: "Webmail",
                shortName: "Webmail",
                icon: HiGlobe,
              },
              {
                id: "notifications",
                name: "Notifications",
                shortName: "Notify",
                icon: HiBell,
              },
              {
                id: "btcpay",
                name: "BTCPay",
                shortName: "BTCPay",
                icon: HiKey,
              },
              {
                id: "powermta",
                name: "PowerMTA",
                shortName: "PowerMTA",
                icon: HiDatabase,
              },
              {
                id: "telegram",
                name: "Telegram",
                shortName: "Telegram",
                icon: HiUser,
              },
              {
                id: "training",
                name: "Training",
                shortName: "Training",
                icon: HiChartBar,
              },
              {
                id: "services",
                name: "Services",
                shortName: "Services",
                icon: HiClock,
              },
              {
                id: "env",
                name: "Environment",
                shortName: "Env",
                icon: HiShieldCheck,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center py-4 px-3 mr-6 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Icon className="flex-shrink-0 w-4 h-4 mr-2" />
                  <span className="hidden md:inline whitespace-nowrap">
                    {tab.name}
                  </span>
                  <span className="md:hidden whitespace-nowrap">
                    {tab.shortName}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="p-6 rounded-lg bg-gray-50">
                  <h4 className="mb-4 font-medium text-gray-900 text-md">
                    Service Status
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(
                          systemStatus.database?.status || "unknown"
                        )}-100 text-${getStatusColor(
                          systemStatus.database?.status || "unknown"
                        )}-800`}
                      >
                        {getStatusIcon(
                          systemStatus.database?.status || "unknown"
                        )}
                        <span className="ml-1">
                          {systemStatus.database?.status || "unknown"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cache</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(
                          systemStatus.cache?.status || "unknown"
                        )}-100 text-${getStatusColor(
                          systemStatus.cache?.status || "unknown"
                        )}-800`}
                      >
                        {getStatusIcon(systemStatus.cache?.status || "unknown")}
                        <span className="ml-1">
                          {systemStatus.cache?.status || "unknown"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Queue</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(
                          systemStatus.queue?.status || "unknown"
                        )}-100 text-${getStatusColor(
                          systemStatus.queue?.status || "unknown"
                        )}-800`}
                      >
                        {getStatusIcon(systemStatus.queue?.status || "unknown")}
                        <span className="ml-1">
                          {systemStatus.queue?.status || "unknown"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-lg bg-gray-50">
                  <h4 className="mb-4 font-medium text-gray-900 text-md">
                    System Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">App Name</span>
                      <span className="text-sm font-medium">
                        {systemConfig.system?.app_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">App URL</span>
                      <span className="text-sm font-medium">
                        {systemConfig.system?.app_url || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Timezone</span>
                      <span className="text-sm font-medium">
                        {systemConfig.system?.timezone || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Max Campaigns/Day
                      </span>
                      <span className="text-sm font-medium">
                        {systemConfig.system?.max_campaigns_per_day || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Max Recipients/Campaign
                      </span>
                      <span className="text-sm font-medium">
                        {systemConfig.system?.max_recipients_per_campaign ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Tabs */}
          {activeTab !== "overview" && activeTab !== "env" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 capitalize">
                  {activeTab.replace("_", " ")} Configuration
                </h4>
                <div className="flex space-x-2">
                  {activeTab === "system_smtp" && (
                    <button
                      onClick={() => {
                        const email = prompt(
                          "Enter email address to test SMTP:"
                        );
                        if (email) {
                          testSystemSMTP(email);
                        }
                      }}
                      className="flex items-center btn btn-secondary btn-sm"
                    >
                      <HiMail className="w-4 h-4 mr-2" />
                      Test SMTP
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const config = systemConfig[activeTab] || {};
                      setSelectedConfig(config);
                      setEditedConfig({ ...config });
                      setShowEditModal(true);
                    }}
                    className="flex items-center btn btn-primary btn-sm"
                  >
                    <HiPencil className="w-4 h-4 mr-2" />
                    Edit Configuration
                  </button>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {Object.entries(systemConfig[activeTab] || {})
                    .filter(([key]) => {
                      // Hide pointless user override and approval settings for training
                      if (activeTab === 'training' && (
                        key.toLowerCase().includes('allow_user_override') ||
                        key.toLowerCase().includes('user_override') ||
                        key.toLowerCase().includes('manual_approval') ||
                        key.toLowerCase().includes('approval_required')
                      )) {
                        return false;
                      }
                      return true;
                    })
                    .map(([key, value]) => (
                      <div key={key}>
                        <label className="block mb-2 text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, " ")}
                        </label>
                        <div className="p-3 text-sm text-gray-900 bg-white border rounded-md">
                          {typeof value === "boolean" ? (
                            <span
                              className={
                                value ? "text-green-600" : "text-gray-500"
                              }
                            >
                              {value ? "Enabled" : "Disabled"}
                            </span>
                          ) : typeof value === "object" ? (
                            <pre className="overflow-x-auto text-xs">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : key.toLowerCase().includes("password") ||
                            key.toLowerCase().includes("secret") ||
                            key.toLowerCase().includes("key") ? (
                            <span className="text-gray-500">
                              {"*".repeat(Math.min(String(value).length, 20))}
                            </span>
                          ) : (
                            String(value) || (
                              <span className="italic text-gray-400">
                                Not configured
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">
                  System Services
                </h4>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center btn btn-secondary btn-sm"
                >
                  <HiRefresh className="w-4 h-4 mr-2" />
                  Refresh Status
                </button>
              </div>

              {/* Laravel Scheduler Service */}
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <HiClock className="w-6 h-6 mr-3 text-blue-600" />
                    <div>
                      <h5 className="text-lg font-medium text-gray-900">Laravel Scheduler</h5>
                      <p className="text-sm text-gray-600">Manages scheduled tasks, queue processing, and background jobs</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${systemStatus.queue_status === 'running'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {systemStatus.queue_status === 'running' ? (
                        <>
                          <HiCheckCircle className="w-4 h-4 mr-1" /> Running
                        </>
                      ) : (
                        <>
                          <HiXCircle className="w-4 h-4 mr-1" /> Stopped
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-500">Queue Connection</p>
                    <p className="text-lg font-semibold text-gray-900">{systemStatus.queue?.connection || 'database'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-500">Pending Jobs</p>
                    <p className="text-lg font-semibold text-gray-900">{systemStatus.queue?.pending || 0}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-500">Failed Jobs</p>
                    <p className="text-lg font-semibold text-red-600">{systemStatus.queue?.failed || 0}</p>
                  </div>
                </div>

                <div className="p-4 mb-6 border border-yellow-200 rounded-md bg-yellow-50">
                  <div className="flex">
                    <HiInformationCircle className="w-5 h-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Scheduler Setup Required
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>To enable automatic queue processing and scheduled tasks, add this cron job to your server:</p>
                        <div className="p-3 mt-2 font-mono text-xs text-green-400 bg-gray-900 rounded">
                          * * * * * cd /path/to/your/project && php artisan schedule:run &gt;&gt; /dev/null 2&gt;&1
                        </div>
                        <p className="mt-2">This will run Laravel's scheduler every minute, which will execute:</p>
                        <ul className="mt-1 list-disc list-inside">
                          <li>Queue job processing</li>
                          <li>Bounce processing (every 30 minutes)</li>
                          <li>PowerMTA file processing (hourly)</li>
                          <li>Domain reputation monitoring (every 30 minutes)</li>
                          <li>Training system (daily)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        // This would trigger a manual queue processing
                        await adminService.runScheduler();
                        toast.success('Scheduler triggered manually');
                      } catch (error) {
                        toast.error('Failed to trigger scheduler: ' + error.message);
                      }
                    }}
                    className="flex items-center btn btn-primary"
                  >
                    <HiClock className="w-4 h-4 mr-2" />
                    Run Scheduler Now
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await adminService.processQueue();
                        toast.success('Queue processing triggered');
                      } catch (error) {
                        toast.error('Failed to process queue: ' + error.message);
                      }
                    }}
                    className="flex items-center btn btn-secondary"
                  >
                    <HiRefresh className="w-4 h-4 mr-2" />
                    Process Queue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Environment Variables Tab */}
          {activeTab === "env" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">
                  Environment Variables
                </h4>
                <button
                  onClick={async () => {
                    try {
                      const envResponse =
                        await systemSettingsService.getEnvVariables();
                      setSystemConfig((prev) => ({
                        ...prev,
                        env: envResponse.data,
                      }));
                      toast.success("Environment variables refreshed");
                    } catch {
                      toast.error("Failed to load environment variables");
                    }
                  }}
                  className="flex items-center btn btn-secondary btn-sm"
                >
                  <HiRefresh className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>

              {Object.entries(systemConfig.env || {}).map(([section, vars]) => (
                <div key={section} className="p-6 rounded-lg bg-gray-50">
                  <h5 className="mb-4 font-medium text-gray-900 capitalize text-md">
                    {section.replace("_", " ")} Variables
                  </h5>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.entries(vars).map(([key, value]) => (
                      <div key={key} className="p-3 bg-white border rounded">
                        <div className="mb-1 font-mono text-xs text-gray-500">
                          {key}
                        </div>
                        <div className="text-sm text-gray-900">
                          {key.toLowerCase().includes("password") ||
                            key.toLowerCase().includes("secret") ||
                            key.toLowerCase().includes("key") ? (
                            <span className="text-gray-500">
                              {"*".repeat(Math.min(String(value).length, 20))}
                            </span>
                          ) : (
                            String(value) || (
                              <span className="italic text-gray-400">
                                Not set
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Configuration Modal */}
      {showEditModal && selectedConfig && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-full max-w-4xl p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Configuration
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedConfig(null);
                    setEditedConfig({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
                  <div className="flex">
                    <HiExclamation className="w-5 h-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Warning
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          • Changes to system configuration may affect
                          application behavior
                        </p>
                        <p>
                          • Some changes may require a system restart to take
                          effect
                        </p>
                        <p>
                          • Make sure to backup your configuration before making
                          changes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {Object.entries(selectedConfig)
                    .filter(([key]) => {
                      // Hide pointless user override and approval settings for training
                      if (activeTab === 'training' && (
                        key.toLowerCase().includes('allow_user_override') ||
                        key.toLowerCase().includes('user_override') ||
                        key.toLowerCase().includes('manual_approval') ||
                        key.toLowerCase().includes('approval_required')
                      )) {
                        return false;
                      }
                      return true;
                    })
                    .map(([key, value]) => (
                      <div key={key}>
                        <label className="block mb-2 text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, " ")}
                        </label>
                        {typeof value === "boolean" ? (
                          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                            <span className="text-sm text-gray-700">
                              {editedConfig[key] !== undefined ? editedConfig[key] : value ? "Enabled" : "Disabled"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditedConfig((prev) => ({
                                  ...prev,
                                  [key]: editedConfig[key] !== undefined ? !editedConfig[key] : !value,
                                }))
                              }
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${(editedConfig[key] !== undefined ? editedConfig[key] : value) ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(editedConfig[key] !== undefined ? editedConfig[key] : value) ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        ) : typeof value === "number" ? (
                          <input
                            type="number"
                            value={
                              editedConfig[key] !== undefined
                                ? editedConfig[key]
                                : value
                            }
                            onChange={(e) =>
                              setEditedConfig((prev) => ({
                                ...prev,
                                [key]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (key.toLowerCase().includes('training') && key.toLowerCase().includes('mode')) || key.toLowerCase() === 'default_mode' ? (
                          // Training mode - styled dropdown
                          <div className="relative">
                            <select
                              value={editedConfig[key] !== undefined ? editedConfig[key] : value || 'manual'}
                              onChange={(e) =>
                                setEditedConfig((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="block w-full px-4 py-3 text-base transition-colors bg-white border-2 border-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-300"
                            >
                              <option value="manual">🔧 Manual Training</option>
                              <option value="automatic">🤖 Automatic Training</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        ) : key.toLowerCase().includes('training') && (key.toLowerCase().includes('enabled') || key.toLowerCase().includes('allow') || key.toLowerCase().includes('required') || key.toLowerCase().includes('approval')) ? (
                          // Training boolean fields (enabled, allow_user_override, manual_approval_required, etc.)
                          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                            <span className="text-sm text-gray-700">
                              {editedConfig[key] !== undefined ? (editedConfig[key] ? "Enabled" : "Disabled") : (value ? "Enabled" : "Disabled")}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditedConfig((prev) => ({
                                  ...prev,
                                  [key]: editedConfig[key] !== undefined ? !editedConfig[key] : !value,
                                }))
                              }
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${(editedConfig[key] !== undefined ? editedConfig[key] : value) ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(editedConfig[key] !== undefined ? editedConfig[key] : value) ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        ) : typeof value === 'string' && (value === 'true' || value === 'false' || value === true || value === false) ? (
                          // Handle string boolean values
                          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                            <span className="text-sm text-gray-700">
                              {(editedConfig[key] !== undefined ? editedConfig[key] : value === 'true' || value === true) ? "Enabled" : "Disabled"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditedConfig((prev) => ({
                                  ...prev,
                                  [key]: editedConfig[key] !== undefined ? !editedConfig[key] : !(value === 'true' || value === true),
                                }))
                              }
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${(editedConfig[key] !== undefined ? editedConfig[key] : (value === 'true' || value === true)) ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(editedConfig[key] !== undefined ? editedConfig[key] : (value === 'true' || value === true)) ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={
                              editedConfig[key] !== undefined
                                ? editedConfig[key]
                                : value
                            }
                            onChange={(e) =>
                              setEditedConfig((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        )}
                      </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedConfig(null);
                      setEditedConfig({});
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={loading}
                    className="flex items-center btn btn-primary"
                  >
                    <HiSave className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystem;

// Consolidated API - moved from utils/api.js to eliminate redundancy
import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configure axios defaults for JWT authentication
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; // Enable sending cookies with requests

// Add request interceptor to main axios for debugging
axios.interceptors.request.use((config) => {
    console.log('=== MAIN AXIOS REQUEST ===');
    console.log('URL:', config.url);
    console.log('Data instanceof FormData:', config.data instanceof FormData);
    console.log('Headers:', config.headers);

    // WARNING: If FormData reaches main axios, something is wrong
    if (config.data instanceof FormData) {
        console.error('🚨 ERROR: FormData detected in main axios! Should use formDataAxios instead!');
        // Remove Content-Type to let browser set it
        delete config.headers['Content-Type'];
    }

    return config;
}, (error) => {
    console.error('Main axios request error:', error);
    return Promise.reject(error);
});

// Add response interceptor to main axios for debugging
axios.interceptors.response.use((response) => {
    console.log('=== MAIN AXIOS RESPONSE ===');
    console.log('Status:', response.status);
    return response;
}, (error) => {
    console.error('=== MAIN AXIOS ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    return Promise.reject(error);
});

// Create a separate axios instance for FormData requests
const formDataAxios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 300000, // 5 minutes for large file uploads
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
    // Don't set Content-Type - let axios set it automatically for FormData
});

// Add request interceptor for debugging FormData requests
formDataAxios.interceptors.request.use((config) => {
    console.log('=== FORMDATA AXIOS REQUEST ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Data instanceof FormData:', config.data instanceof FormData);
    console.log('WithCredentials:', config.withCredentials);
    console.log('Headers:', config.headers);

    // Ensure Content-Type is not set for FormData (let browser set it with boundary)
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        console.log('Removed Content-Type header for FormData');
    }

    return config;
}, (error) => {
    console.error('FormData axios request error:', error);
    return Promise.reject(error);
});

// Add response interceptor for debugging
formDataAxios.interceptors.response.use((response) => {
    console.log('=== FORMDATA AXIOS RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
}, (error) => {
    console.error('=== FORMDATA AXIOS ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Headers sent:', error.config?.headers);
    return Promise.reject(error);
});

// Consolidated API methods (moved from utils/api.js)
export const api = {
    // GET request with query parameters
    get: async (endpoint, params = {}, config = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `${endpoint}?${queryString}` : endpoint;
            const response = await axios.get(url, config);
            return response;
        } catch (error) {
            console.error('API GET error:', error.response?.status, error.response?.data);
            throw error;
        }
    },

    // POST request
    post: async (endpoint, data = {}, config = {}) => {
        try {
            console.log('=== API POST DEBUG ===');
            console.log('Endpoint:', endpoint);
            console.log('Data type:', typeof data);
            console.log('Data instanceof FormData:', data instanceof FormData);
            console.log('Data constructor:', data.constructor.name);

            // Handle FormData - use separate axios instance
            if (data instanceof FormData) {
                console.log('✅ Detected FormData, using formDataAxios');
                console.log('FormData entries:');
                for (let [key, value] of data.entries()) {
                    if (value instanceof File) {
                        console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                }

                // Ensure no Content-Type is set in config for FormData
                const formDataConfig = { ...config };
                delete formDataConfig.headers?.['Content-Type'];
                console.log('FormData config:', formDataConfig);

                const response = await formDataAxios.post(endpoint, data, formDataConfig);
                return response;
            } else {
                console.log('Using regular axios for non-FormData');
                console.log('Data:', data);
                const response = await axios.post(endpoint, data, config);
                return response;
            }
        } catch (error) {
            console.error('API POST error:', error.response?.status, error.response?.data);
            console.error('Error config:', error.config);
            throw error;
        }
    },

    // PUT request
    put: async (endpoint, data = {}, config = {}) => {
        try {
            // Handle FormData - use separate axios instance
            if (data instanceof FormData) {
                // Ensure no Content-Type is set in config for FormData
                const formDataConfig = { ...config };
                delete formDataConfig.headers?.['Content-Type'];

                const response = await formDataAxios.put(endpoint, data, formDataConfig);
                return response;
            } else {
                const response = await axios.put(endpoint, data, config);
                return response;
            }
        } catch (error) {
            console.error('API PUT error:', error.response?.status, error.response?.data);
            throw error;
        }
    },

    // DELETE request
    delete: async (endpoint, data = {}) => {
        try {
            const response = await axios.delete(endpoint, { data });
            return response;
        } catch (error) {
            console.error('API DELETE error:', error.response?.status, error.response?.data);
            throw error;
        }
    },

    // PATCH request
    patch: async (endpoint, data = {}) => {
        try {
            const response = await axios.patch(endpoint, data);
            return response;
        } catch (error) {
            console.error('API PATCH error:', error.response?.status, error.response?.data);
            throw error;
        }
    },
};

// Common error handler
export const handleApiError = (error) => {
    if (error.response) {
        return {
            message: error.response.data?.message || 'An error occurred',
            status: error.response.status,
            data: error.response.data,
        };
    }
    return {
        message: error.message || 'Network error',
        status: 0,
    };
};

// Common success handler
export const handleApiSuccess = (response) => {
    return {
        data: response.data || response,
        message: response.message || 'Success',
    };
};

// Cache-busting update: 2025-08-09T15:15:54Z - Fixed PowerMTA and Notifications methods

// Auth service methods
export const authService = {
    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    async register(userData) {

        const response = await api.post('/auth/register', userData);
        // Return the full response data
        return response.data;
    },

    async logout() {
        try {
            await api.post('/auth/logout');
            // Backend will clear the HTTP-only cookie
        } catch (error) {
            console.error('Logout error:', error);
            // Ignore logout errors, backend will still clear cookie
        }
    },

    async getProfile(isAuthInit = false) {
        try {
            const config = isAuthInit ? { _isAuthInit: true } : {};
            const response = await api.get('/user/me', {}, config);
            return response.data;
        } catch (error) {
            console.error('getProfile error:', error);
            throw error;
        }
    },

    isAuthenticated() {
        // Authentication state is managed by Redux, not local storage
        return false;
    },

    getCurrentUser() {
        // User data is managed by Redux, not local storage
        return null;
    }
};

// Campaign service methods
export const campaignService = {
    async getCampaigns() {
        const response = await api.get('/campaigns');
        return response.data;
    },

    async createCampaign(campaignData) {
        const response = await api.post('/campaigns', campaignData);
        return response.data;
    },

    async getCampaign(id) {
        const response = await api.get(`/campaigns/${id}`);
        return response.data;
    },

    async updateCampaign(id, campaignData) {
        const response = await api.put(`/campaigns/${id}`, campaignData);
        return response.data;
    },

    async deleteCampaign(id) {
        const response = await api.delete(`/campaigns/${id}`);
        return response.data;
    },

    async startCampaign(id) {
        const response = await api.post(`/campaigns/${id}/start`);
        return response.data;
    },

    async pauseCampaign(id) {
        const response = await api.post(`/campaigns/${id}/pause`);
        return response.data;
    },

    async resumeCampaign(id) {
        const response = await api.post(`/campaigns/${id}/resume`);
        return response.data;
    },

    async stopCampaign(id) {
        const response = await api.post(`/campaigns/${id}/stop`);
        return response.data;
    },

    async getCampaignStats(id) {
        const response = await api.get(`/campaigns/${id}/stats`);
        return response.data;
    },

    async uploadContent(formData) {
        const response = await api.post('/campaigns/upload-content', formData);
        return response.data;
    },

    async sendSingle(emailData) {
        const response = await api.post('/campaigns/send-single', emailData);
        return response.data;
    }
};

// User service methods (consolidated - removed duplicate getProfile)
export const userService = {

    async updateProfile(profileData) {
        const response = await api.put('/user/profile', profileData);
        return response.data;
    },

    async changePassword(passwordData) {
        const response = await api.put('/user/password', passwordData);
        return response.data;
    },

    // Removed getUsers - use adminService.getUsers instead
    // Removed getAdminUsers - use adminService.getUsers instead

    async deleteUser(userId) {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
    },

    async updateUserStatus(userId, status) {
        const response = await api.put(`/users/${userId}/status`, { status });
        return response.data;
    }
};

// User Activity service methods

// Queue service methods (user-specific, different from admin queue methods)

// Domain service methods
export const domainService = {
    async getDomains() {
        const response = await api.get('/domains');
        return response.data;
    },

    async createDomain(domainData) {
        const response = await api.post('/domains', domainData);
        return response.data;
    },

    async getDomain(id) {
        const response = await api.get(`/domains/${id}`);
        return response.data;
    },

    async updateDomain(id, domainData) {
        const response = await api.put(`/domains/${id}`, domainData);
        return response.data;
    },

    async deleteDomain(id) {
        const response = await api.delete(`/domains/${id}`);
        return response.data;
    },

    async getDomainSmtpConfig(id) {
        const response = await api.get(`/domains/${id}/smtp`);
        return response.data;
    },

    async updateDomainSmtpConfig(id, smtpData) {
        const response = await api.post(`/domains/${id}/smtp`, smtpData);
        return response.data;
    },

    async deleteDomainSmtpConfig(id) {
        const response = await api.delete(`/domains/${id}/smtp`);
        return response.data;
    },

    async updateBounceProcessing(id, bounceData) {
        const response = await api.put(`/domains/${id}/bounce-processing`, bounceData);
        return response.data;
    },

    async testBounceConnection(id) {
        const response = await api.post(`/domains/${id}/bounce-processing/test`);
        return response.data;
    },

    async getBounceStatistics(id) {
        const response = await api.get(`/domains/${id}/bounce-processing/stats`);
        return response.data;
    },

    async processBounces(id) {
        const response = await api.post(`/domains/${id}/bounce-processing/process`);
        return response.data;
    }
};

// Bounce credential service methods
export const bounceCredentialService = {
    async getBounceCredentials(params = {}) {
        const response = await api.get('/bounce-credentials', params);
        return response.data;
    },

    async createBounceCredential(credentialData) {
        const response = await api.post('/bounce-credentials', credentialData);
        return response.data;
    },

    async getBounceCredential(id) {
        const response = await api.get(`/bounce-credentials/${id}`);
        return response.data;
    },

    async updateBounceCredential(id, credentialData) {
        const response = await api.put(`/bounce-credentials/${id}`, credentialData);
        return response.data;
    },

    async deleteBounceCredential(id) {
        const response = await api.delete(`/bounce-credentials/${id}`);
        return response.data;
    },

    async testConnection(id) {
        const response = await api.post(`/bounce-credentials/${id}/test`);
        return response.data;
    },

    async setAsDefault(id) {
        const response = await api.post(`/bounce-credentials/${id}/set-default`);
        return response.data;
    },

    async getStatistics() {
        const response = await api.get('/bounce-credentials/statistics');
        return response.data;
    },

    async getUserDomains() {
        const response = await api.get('/bounce-credentials/domains');
        return response.data;
    }
};

// Sender service methods
export const senderService = {
    async getSenders(params = {}) {
        const response = await api.get('/senders', params);
        return response.data;
    },

    async createSender(senderData) {
        const response = await api.post('/senders', senderData);
        return response.data;
    },

    async getSender(id) {
        const response = await api.get(`/senders/${id}`);
        return response.data;
    },

    async updateSender(id, senderData) {
        const response = await api.put(`/senders/${id}`, senderData);
        return response.data;
    },

    async deleteSender(id) {
        const response = await api.delete(`/senders/${id}`);
        return response.data;
    },

    async testSender(id) {
        const response = await api.post(`/senders/${id}/test`);
        return response.data;
    }
};

// Content service methods
export const contentService = {
    async getContents() {
        const response = await api.get('/contents');
        return response.data;
    },

    async createContent(contentData) {
        const response = await api.post('/contents', contentData);
        return response.data;
    },

    async getContent(id) {
        const response = await api.get(`/contents/${id}`);
        return response.data;
    },

    async updateContent(id, contentData) {
        const response = await api.put(`/contents/${id}`, contentData);
        return response.data;
    },

    async deleteContent(id) {
        const response = await api.delete(`/contents/${id}`);
        return response.data;
    },

    async previewContent(id) {
        const response = await api.get(`/contents/${id}/preview`);
        return response.data;
    }
};

// Notification service methods
export const notificationService = {
    async getNotifications() {
        const response = await api.get('/notifications');
        return response.data;
    },

    async getNotification(id) {
        const response = await api.get(`/notifications/${id}`);
        return response.data;
    },

    async markAsRead(id) {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.put('/notifications/mark-all-read');
        return response.data;
    },

    async deleteNotification(id) {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },

    async deleteAllNotifications() {
        const response = await api.delete('/notifications');
        return response.data;
    }
};

// Analytics service methods
export const analyticsService = {
    async getAnalytics() {
        const response = await api.get('/analytics');
        return response.data;
    },

    async getDashboardData() {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    async getCampaignAnalytics(params = {}) {
        const response = await api.get('/analytics/campaigns', params);
        return response.data;
    },

    async getUserAnalytics(params = {}) {
        const response = await api.get('/analytics/users', params);
        return response.data;
    },

    async getRevenueAnalytics(params = {}) {
        const response = await api.get('/analytics/revenue', params);
        return response.data;
    },

    async getDeliverabilityAnalytics(params = {}) {
        const response = await api.get('/analytics/deliverability', params);
        return response.data;
    },

    async getReputationAnalytics(params = {}) {
        const response = await api.get('/analytics/reputation', params);
        return response.data;
    },

    async getTrendingMetrics(params = {}) {
        const response = await api.get('/analytics/trending', params);
        return response.data;
    },

    async getCampaignPerformance(campaignId) {
        const response = await api.get(`/analytics/campaign/${campaignId}/performance`);
        return response.data;
    },

    async getCampaignHourlyStats(campaignId) {
        const response = await api.get(`/analytics/campaign/${campaignId}/hourly`);
        return response.data;
    },

    async getCampaignDailyStats(campaignId) {
        const response = await api.get(`/analytics/campaign/${campaignId}/daily`);
        return response.data;
    },

    async getCampaignDomainPerformance(campaignId) {
        const response = await api.get(`/analytics/campaign/${campaignId}/domains`);
        return response.data;
    },

    async getCampaignSenderPerformance(campaignId) {
        const response = await api.get(`/analytics/campaign/${campaignId}/senders`);
        return response.data;
    }
};

// Suppression service methods (Admin only)
export const suppressionService = {
    async getList(params = {}) {
        const response = await api.get('/admin/suppression-list', { params });
        return response.data;
    },

    async getStatistics() {
        const response = await api.get('/admin/suppression-list/statistics');
        return response.data;
    },

    async exportList(exportData) {
        const response = await api.post('/admin/suppression-list/export', exportData);
        return response.data;
    },

    async importList(importData) {
        const response = await api.post('/admin/suppression-list/import', importData);
        return response.data;
    },

    async processFBLFile(fileData) {
        const response = await api.post('/admin/suppression-list/process-fbl', fileData);
        return response.data;
    },

    async removeEmail(emailData) {
        const response = await api.delete('/admin/suppression-list/remove-email', emailData);
        return response.data;
    },

    async cleanupList(cleanupData) {
        const response = await api.post('/admin/suppression-list/cleanup', cleanupData);
        return response.data;
    },

    async downloadFile(filename) {
        const response = await api.get(`/admin/suppression-list/download/${filename}`);
        return response.data;
    }
};

// Security service methods
export const securityService = {
    async getSettings() {
        const response = await api.get('/security/settings');
        return response.data;
    },

    async enable2FA() {
        const response = await api.post('/security/2fa/enable');
        return response.data;
    },

    async disable2FA() {
        const response = await api.delete('/security/2fa/disable');
        return response.data;
    },

    async verify2FA(code) {
        const response = await api.post('/security/2fa/verify', { code });
        return response.data;
    },

    async getApiKeys() {
        const response = await api.get('/security/api-keys');
        return response.data;
    },

    async createApiKey(keyData) {
        const response = await api.post('/security/api-keys', keyData);
        return response.data;
    },

    async deleteApiKey(keyId) {
        const response = await api.delete(`/security/api-keys/${keyId}`);
        return response.data;
    },

    async getActiveSessions() {
        const response = await api.get('/security/sessions');
        return response.data;
    },

    async revokeSession(sessionId) {
        const response = await api.delete(`/security/sessions/${sessionId}`);
        return response.data;
    },

    async getTrustedDevices() {
        const response = await api.get('/security/devices');
        return response.data;
    },

    async trustDevice(deviceId) {
        const response = await api.post(`/security/devices/${deviceId}/trust`);
        return response.data;
    },

    async getActivityLog() {
        const response = await api.get('/security/activity');
        return response.data;
    },

    async getSecuritySummary() {
        const response = await api.get('/security/summary');
        return response.data;
    },

    async changePassword(passwordData) {
        const response = await api.post('/security/password/change', passwordData);
        return response.data;
    }
};

// Billing service methods
export const billingService = {
    async getSubscriptions(params = {}) {
        const response = await api.get('/billing/subscriptions', params);
        return response.data;
    },

    async createSubscription(subscriptionData) {
        const response = await api.post('/billing/subscriptions', subscriptionData);
        return response.data;
    },

    async cancelSubscription(id) {
        const response = await api.delete(`/billing/subscriptions/${id}`);
        return response.data;
    },

    async createBTCPayInvoice(invoiceData) {
        const response = await api.post('/btcpay/invoice', invoiceData);
        return response.data;
    },

    async getPaymentHistory(params = {}) {
        const response = await api.get('/billing/payment-history', params);
        return response.data;
    },

    async getPaymentRates() {
        const response = await api.get('/billing/rates');
        return response.data;
    },

    // Plan management
    async getPlans() {
        const response = await api.get('/billing/plans');
        return response.data;
    },

    async createPlan(planData) {
        const response = await api.post('/admin/billing/plans', planData);
        return response.data;
    },

    async updatePlan(planId, planData) {
        const response = await api.put(`/admin/billing/plans/${planId}`, planData);
        return response.data;
    },

    async deletePlan(planId) {
        const response = await api.delete(`/admin/billing/plans/${planId}`);
        return response.data;
    },

    // Admin billing management
    async getBillingStats() {
        const response = await api.get('/admin/billing/stats');
        return response.data;
    },

    async getAllSubscriptions(params = {}) {
        const response = await api.get('/admin/billing/subscriptions', { params });
        return response.data;
    },

    async processManualPayment(subscriptionId, paymentData) {
        const response = await api.post(`/admin/billing/subscriptions/${subscriptionId}/manual-payment`, paymentData);
        return response.data;
    },

    // Manual payments for users
    async createManualPayment(paymentData) {
        const response = await api.post('/billing/manual-payment', paymentData);
        return response.data;
    },

    // Invoice operations
    async getInvoiceStatus(invoiceId) {
        const response = await api.get(`/billing/invoice/${invoiceId}/status`);
        return response.data;
    },

    async getInvoice(invoiceId) {
        const response = await api.get(`/billing/invoice/${invoiceId}`);
        return response.data;
    },

    async downloadInvoice(invoiceId) {
        const response = await api.get(`/billing/invoice/${invoiceId}/download`, {
            responseType: 'blob' // Important for file downloads
        });
        return response;
    },

    async viewInvoice(invoiceId) {
        const response = await api.get(`/billing/invoice/${invoiceId}/view`);
        return response.data;
    }
};

// Settings service methods
export const settingsService = {
    async getSettings() {
        const response = await api.get('/security/settings');
        return response.data;
    },

    async updateSettings(settingsData) {
        const response = await api.put('/security/settings', settingsData);
        return response.data;
    },

    async getSystemSettings() {
        const response = await api.get('/admin/system-config');
        return response.data;
    },

    async updateSystemSettings(settingsData) {
        const response = await api.put('/admin/system-config', settingsData);
        return response.data;
    }
};

// System Settings service methods
export const systemSettingsService = {
    async getSettings() {
        const response = await api.get('/admin/system-settings');
        return response.data;
    },

    async updateSettings(settingsData) {
        const response = await api.put('/admin/system-settings', settingsData);
        return response.data;
    },

    async testSmtp(emailData) {
        const response = await api.post('/admin/system-settings/test-smtp', emailData);
        return response.data;
    },

    async getEnvVariables() {
        const response = await api.get('/admin/system-settings/env-variables');
        return response.data;
    }
};

// Admin service methods
export const adminService = {
    async getDashboard() {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    async getUsers(params = {}) {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    async updateUserStatus(userId, status) {
        const response = await api.put(`/admin/users/${userId}`, { status });
        return response.data;
    },

    async deleteUser(userId) {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    },

    async getCampaigns(params = {}) {
        const response = await api.get('/admin/campaigns', { params });
        return response.data;
    },

    async getDomains(params = {}) {
        const response = await api.get('/admin/domains', { params });
        return response.data;
    },

    async testDomainConnection(domainId) {
        const response = await api.post(`/admin/domains/${domainId}/test`);
        return response.data;
    },

    async getSenders(params = {}) {
        const response = await api.get('/admin/senders', { params });
        return response.data;
    },

    async createSender(senderData) {
        const response = await api.post('/admin/senders', senderData);
        return response.data;
    },

    async updateSender(senderId, senderData) {
        const response = await api.put(`/admin/senders/${senderId}/admin-update`, senderData);
        return response.data;
    },

    async deleteSender(senderId) {
        const response = await api.delete(`/admin/senders/${senderId}`);
        return response.data;
    },

    async updateSenderStatus(senderId, isActive) {
        const response = await api.put(`/admin/senders/${senderId}/admin-update`, { is_active: isActive });
        return response.data;
    },

    async testSenderConnection(senderId, testData) {
        const response = await api.post(`/senders/${senderId}/test`, testData);
        return response.data;
    },

    async getSmtpConfigs(params = {}) {
        const response = await api.get('/admin/smtp-configs', { params });
        return response.data;
    },

    async testSmtpConnection(configId) {
        const response = await api.post(`/admin/smtp-configs/${configId}/test`);
        return response.data;
    },

    async getLogFiles() {
        const response = await api.get('/admin/logs/files');
        return response.data;
    },

    async getLogs(params = {}) {
        const response = await api.get('/admin/logs', { params });
        return response.data;
    },

    async downloadLogFile(filename) {
        const response = await api.get(`/admin/logs/files/${filename}/download`);
        return response.data;
    },

    async clearLogs(filename) {
        const response = await api.delete(`/admin/logs/files/${filename}`);
        return response.data;
    },

    async downloadLogs(filename) {
        const response = await api.get(`/admin/logs/files/${filename}/download`, { responseType: 'blob' });
        return response;
    },

    // Queue management methods
    async getQueueStats() {
        const response = await api.get('/admin/queue/stats');
        return response.data;
    },

    async getPendingJobs(params = {}) {
        const response = await api.get('/admin/queue/pending', { params });
        return response.data;
    },

    async getFailedJobs(params = {}) {
        const response = await api.get('/admin/queue/failed', { params });
        return response.data;
    },

    async retryFailedJob(jobId) {
        const response = await api.post(`/admin/queue/failed/${jobId}/retry`);
        return response.data;
    },

    async deleteFailedJob(jobId) {
        const response = await api.delete(`/admin/queue/failed/${jobId}`);
        return response.data;
    },

    async clearAllFailedJobs() {
        const response = await api.delete('/admin/queue/failed');
        return response.data;
    },

    async deletePendingJob(jobId) {
        const response = await api.delete(`/admin/queue/pending/${jobId}`);
        return response.data;
    },

    async clearAllPendingJobs() {
        const response = await api.delete('/admin/queue/pending');
        return response.data;
    },

    async getJobDetail(type, jobId) {
        const response = await api.get(`/admin/queue/${type}/${jobId}`);
        return response.data;
    },

    async getSystemStatus() {
        const response = await api.get('/admin/system-status');
        return response.data;
    },

    async getSystemInfo() {
        const response = await api.get('/admin/system/info');
        return response.data;
    },

    async getSystemMetrics() {
        const response = await api.get('/admin/system/metrics');
        return response.data;
    },

    // System configuration
    async getSystemConfig() {
        const response = await api.get('/admin/system-config');
        return response.data;
    },

    async updateSystemConfig(configData) {
        const response = await api.post('/admin/system-config', configData);
        return response.data;
    },

    // System settings (different from config)
    async getSystemSettings() {
        const response = await api.get('/admin/system-settings');
        return response.data;
    },

    async updateSystemSettings(settingsData) {
        const response = await api.put('/admin/system-settings', settingsData);
        return response.data;
    },

    // Security settings
    async getSecuritySettings() {
        const response = await api.get('/admin/security-settings');
        return response.data;
    },

    async updateSecuritySettings(securityData) {
        const response = await api.put('/admin/security-settings', securityData);
        return response.data;
    },

    // BTCPay configuration
    async getBTCPayConfig() {
        const response = await api.get('/admin/system-config/btcpay');
        return response.data;
    },

    async updateBTCPayConfig(btcpayData) {
        const response = await api.post('/admin/system-config/btcpay', btcpayData);
        return response.data;
    },

    // PowerMTA configuration
    async getPowerMTAConfig() {
        const response = await api.get('/admin/system-config/powermta');
        return response.data;
    },

    async updatePowerMTAConfig(powermtaData) {
        const response = await api.post('/admin/system-config/powermta', powermtaData);
        return response.data;
    },

    // Telegram configuration
    async getTelegramConfig() {
        const response = await api.get('/admin/system-config/telegram');
        return response.data;
    },

    async updateTelegramConfig(telegramData) {
        const response = await api.post('/admin/system-config/telegram', telegramData);
        return response.data;
    },

    // Environment variables
    async getEnvVariables() {
        const response = await api.get('/admin/system-settings/env-variables');
        return response.data;
    },

    // Test SMTP
    async testSystemSmtp(smtpData) {
        const response = await api.post('/admin/system-settings/test-smtp', smtpData);
        return response.data;
    },

    // Notification management
    async getNotifications(params = {}) {
        const response = await api.get('/admin/notifications', { params });
        return response.data;
    },

    async createNotification(notificationData) {
        const response = await api.post('/admin/notifications', notificationData);
        return response.data;
    },

    async sendBulkNotification(notificationData) {
        const response = await api.post('/admin/notifications/bulk', notificationData);
        return response.data;
    },

    async deleteNotification(notificationId) {
        const response = await api.delete(`/admin/notifications/${notificationId}`);
        return response.data;
    },

    async markNotificationAsRead(notificationId) {
        const response = await api.put(`/admin/notifications/${notificationId}/read`);
        return response.data;
    },

    // PowerMTA Status and Management
    async getPowerMTAStatus() {
        const response = await api.get('/admin/powermta/status');
        return response.data;
    },

    async getPowerMTAFBLAccounts() {
        const response = await api.get('/admin/powermta/fbl-accounts');
        return response.data;
    },

    async getPowerMTADiagnosticFiles() {
        const response = await api.get('/admin/powermta/diagnostic-files');
        return response.data;
    },

    async getPowerMTAReputationSummary() {
        const response = await api.get('/admin/powermta/reputation-summary');
        return response.data;
    },

    async analyzePowerMTAReputation(domain) {
        const response = await api.post('/admin/powermta/analyze-reputation', { domain });
        return response.data;
    },

    async parsePowerMTADiagnosticFile(filename) {
        const response = await api.post('/admin/powermta/parse-diagnostic', { filename });
        return response.data;
    },

    async downloadPowerMTADiagnosticFile(filename) {
        const response = await api.get(`/admin/powermta/diagnostic-files/${filename}/download`, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Backup Management
    async getBackups() {
        const response = await api.get('/admin/backups');
        return response.data;
    },

    async getBackupStatistics() {
        const response = await api.get('/admin/backups/statistics');
        return response.data;
    },

    async createBackup(backupData) {
        const response = await api.post('/admin/backups', backupData);
        return response.data;
    },

    async deleteBackup(backupId) {
        const response = await api.delete(`/admin/backups/${backupId}`);
        return response.data;
    },

    async downloadBackup(backupId) {
        const response = await api.get(`/admin/backups/${backupId}/download`, {
            responseType: 'blob'
        });
        return response.data;
    },

    async restoreBackup(backupId) {
        const response = await api.post(`/admin/backups/${backupId}/restore`);
        return response.data;
    },
};

// User Activity Service
export const userActivityService = {
    async getActivity(id) {
        const response = await api.get(`/user/activities/${id}`);
        return response.data;
    },
    async getActivities(params = {}) {
        const response = await api.get('/user/activities', params);
        return response.data;
    },

    async logActivity(activityData) {
        const response = await api.post('/user/activities', activityData);
        return response.data;
    },

    async getActivityStats() {
        const response = await api.get('/user/activities/stats');
        return response.data;
    }
};

// Queue Service
export const queueService = {
    async getCampaignFailedJobs(campaignId, params = {}) {
        const response = await api.get(`/campaigns/${campaignId}/failed-jobs`, params);
        return response.data;
    },

    async retryFailedJob(jobId) {
        const response = await api.post(`/queue/failed/${jobId}/retry`);
        return response.data;
    },
    async getQueueStatus() {
        const response = await api.get('/queue/status');
        return response.data;
    },

    async getFailedJobs() {
        const response = await api.get('/queue/failed');
        return response.data;
    },

    async retryJob(jobId) {
        const response = await api.post(`/queue/retry/${jobId}`);
        return response.data;
    },

    async deleteJob(jobId) {
        const response = await api.delete(`/queue/jobs/${jobId}`);
        return response.data;
    },

    async clearQueue() {
        const response = await api.post('/queue/clear');
        return response.data;
    }
};

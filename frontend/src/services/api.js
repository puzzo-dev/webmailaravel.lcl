import { api } from '../utils/api';

// Auth service methods
export const authService = {
    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            // Return the full response data
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        try {
            await api.post('/auth/logout');
            // Backend will clear the HTTP-only cookie
        } catch (error) {
            // Ignore logout errors, backend will still clear cookie
        }
    },

    async getProfile(isAuthInit = false) {
        try {
        const config = isAuthInit ? { _isAuthInit: true } : {};
        const response = await api.get('/user/me', {}, config);
            console.log('getProfile response:', response);
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
    }
};

// User service methods
export const userService = {
    async getProfile() {
        const response = await api.get('/user/profile');
        return response.data;
    },

    async updateProfile(profileData) {
        const response = await api.put('/user/profile', profileData);
        return response.data;
    },

    async changePassword(passwordData) {
        const response = await api.put('/user/password', passwordData);
        return response.data;
    },

    async getUsers(params = {}) {
        const response = await api.get('/users', params);
        return response.data;
    },

    async getAdminUsers(params = {}) {
        const response = await api.get('/admin/users', params);
        return response.data;
    },

    async deleteUser(userId) {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
    },

    async updateUserStatus(userId, status) {
        const response = await api.put(`/users/${userId}/status`, { status });
        return response.data;
    }
};

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
    }
};

// Suppression service methods
export const suppressionService = {
    async getStatistics() {
        const response = await api.get('/suppression-list/statistics');
        return response.data;
    },

    async exportList(exportData) {
        const response = await api.post('/suppression-list/export', exportData);
        return response.data;
    },

    async importList(importData) {
        const response = await api.post('/suppression-list/import', importData);
        return response.data;
    },

    async processFBLFile(fileData) {
        const response = await api.post('/suppression-list/process-fbl', fileData);
        return response.data;
    },

    async removeEmail(emailData) {
        const response = await api.delete('/suppression-list/remove-email', emailData);
        return response.data;
    },

    async cleanupList(cleanupData) {
        const response = await api.post('/suppression-list/cleanup', cleanupData);
        return response.data;
    },

    async downloadFile(filename) {
        const response = await api.get(`/suppression-list/download/${filename}`);
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

    async getSystemStatus() {
        const response = await api.get('/admin/system/status');
        return response.data;
    },

    async getSystemInfo() {
        const response = await api.get('/admin/system/info');
        return response.data;
    },

    async getSystemMetrics() {
        const response = await api.get('/admin/system/metrics');
        return response.data;
    }
}; 
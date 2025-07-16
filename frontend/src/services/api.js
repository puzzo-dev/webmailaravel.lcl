import { api } from '../utils/api';

// Auth service methods
export const authService = {
    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);
            // Token and user data are handled by backend cookies and Redux
            return response;
        } catch (error) {
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            // Token and user data are handled by backend cookies and Redux
            return response;
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
        const config = isAuthInit ? { _isAuthInit: true } : {};
        const response = await api.get('/user/me', {}, config);
        return response;
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
        return response;
    },

    async createCampaign(campaignData) {
        const response = await api.post('/campaigns', campaignData);
        return response;
    },

    async getCampaign(id) {
        const response = await api.get(`/campaigns/${id}`);
        return response;
    },

    async updateCampaign(id, campaignData) {
        const response = await api.put(`/campaigns/${id}`, campaignData);
        return response;
    },

    async deleteCampaign(id) {
        const response = await api.delete(`/campaigns/${id}`);
        return response;
    },

    async startCampaign(id) {
        const response = await api.post(`/campaigns/${id}/start`);
        return response;
    },

    async pauseCampaign(id) {
        const response = await api.post(`/campaigns/${id}/pause`);
        return response;
    },

    async resumeCampaign(id) {
        const response = await api.post(`/campaigns/${id}/resume`);
        return response;
    },

    async stopCampaign(id) {
        const response = await api.post(`/campaigns/${id}/stop`);
        return response;
    },

    async getCampaignStats(id) {
        const response = await api.get(`/campaigns/${id}/stats`);
        return response;
    },

    async uploadContent(formData) {
        const response = await api.post('/campaigns/upload-content', formData);
        return response;
    }
};

// User service methods
export const userService = {
    async getProfile() {
        const response = await api.get('/user/profile');
        return response;
    },

    async updateProfile(profileData) {
        const response = await api.put('/user/profile', profileData);
        return response;
    },

    async changePassword(passwordData) {
        const response = await api.put('/user/password', passwordData);
        return response;
    },

    async getUsers(params = {}) {
        const response = await api.get('/users', params);
        return response;
    },

    async getAdminUsers(params = {}) {
        const response = await api.get('/admin/users', params);
        return response;
    },

    async deleteUser(userId) {
        const response = await api.delete(`/users/${userId}`);
        return response;
    },

    async updateUserStatus(userId, status) {
        const response = await api.put(`/users/${userId}/status`, { status });
        return response;
    }
};

// Domain service methods
export const domainService = {
    async getDomains() {
        const response = await api.get('/domains');
        return response;
    },

    async createDomain(domainData) {
        const response = await api.post('/domains', domainData);
        return response;
    },

    async getDomain(id) {
        const response = await api.get(`/domains/${id}`);
        return response;
    },

    async updateDomain(id, domainData) {
        const response = await api.put(`/domains/${id}`, domainData);
        return response;
    },

    async deleteDomain(id) {
        const response = await api.delete(`/domains/${id}`);
        return response;
    },

    async verifyDomain(id) {
        const response = await api.post(`/domains/${id}/verify`);
        return response;
    },

    async updateDomainConfig(id, configData) {
        const response = await api.put(`/domains/${id}/config`, configData);
        return response;
    },

    async getDomainSmtpConfig(id) {
        const response = await api.get(`/domains/${id}/smtp`);
        return response;
    },

    async updateDomainSmtpConfig(id, smtpData) {
        const response = await api.put(`/domains/${id}/smtp`, smtpData);
        return response;
    },

    async deleteDomainSmtpConfig(id) {
        const response = await api.delete(`/domains/${id}/smtp`);
        return response;
    },

    async updateBounceProcessing(id, bounceData) {
        const response = await api.put(`/domains/${id}/bounce-processing`, bounceData);
        return response;
    },

    async testBounceConnection(id) {
        const response = await api.post(`/domains/${id}/test-bounce`);
        return response;
    },

    async getBounceStatistics(id) {
        const response = await api.get(`/domains/${id}/bounce-stats`);
        return response;
    },

    async processBounces(id) {
        const response = await api.post(`/domains/${id}/process-bounces`);
        return response;
    }
};

// Sender service methods
export const senderService = {
    async getSenders() {
        const response = await api.get('/senders');
        return response;
    },

    async createSender(senderData) {
        const response = await api.post('/senders', senderData);
        return response;
    },

    async getSender(id) {
        const response = await api.get(`/senders/${id}`);
        return response;
    },

    async updateSender(id, senderData) {
        const response = await api.put(`/senders/${id}`, senderData);
        return response;
    },

    async deleteSender(id) {
        const response = await api.delete(`/senders/${id}`);
        return response;
    },

    async testSender(id) {
        const response = await api.post(`/senders/${id}/test`);
        return response;
    }
};

// Content service methods
export const contentService = {
    async getContents() {
        const response = await api.get('/contents');
        return response;
    },

    async createContent(contentData) {
        const response = await api.post('/contents', contentData);
        return response;
    },

    async getContent(id) {
        const response = await api.get(`/contents/${id}`);
        return response;
    },

    async updateContent(id, contentData) {
        const response = await api.put(`/contents/${id}`, contentData);
        return response;
    },

    async deleteContent(id) {
        const response = await api.delete(`/contents/${id}`);
        return response;
    },

    async previewContent(id) {
        const response = await api.get(`/contents/${id}/preview`);
        return response;
    }
};

// Notification service methods
export const notificationService = {
    async getNotifications() {
        const response = await api.get('/notifications');
        return response;
    },

    async getNotification(id) {
        const response = await api.get(`/notifications/${id}`);
        return response;
    },

    async markAsRead(id) {
        const response = await api.put(`/notifications/${id}/read`);
        return response;
    },

    async markAllAsRead() {
        const response = await api.put('/notifications/mark-all-read');
        return response;
    },

    async deleteNotification(id) {
        const response = await api.delete(`/notifications/${id}`);
        return response;
    },

    async deleteAllNotifications() {
        const response = await api.delete('/notifications');
        return response;
    }
};

// Analytics service methods
export const analyticsService = {
    async getAnalytics() {
        const response = await api.get('/analytics');
        return response;
    },

    async getDashboardData() {
        const response = await api.get('/analytics/dashboard');
        return response;
    },

    async getCampaignAnalytics(params = {}) {
        const response = await api.get('/analytics/campaigns', params);
        return response;
    },

    async getUserAnalytics(params = {}) {
        const response = await api.get('/analytics/users', params);
        return response;
    },

    async getRevenueAnalytics(params = {}) {
        const response = await api.get('/analytics/revenue', params);
        return response;
    },

    async getDeliverabilityAnalytics(params = {}) {
        const response = await api.get('/analytics/deliverability', params);
        return response;
    },

    async getReputationAnalytics(params = {}) {
        const response = await api.get('/analytics/reputation', params);
        return response;
    },

    async getTrendingMetrics(params = {}) {
        const response = await api.get('/analytics/trending', params);
        return response;
    }
};

// Suppression service methods
export const suppressionService = {
    async getStatistics() {
        const response = await api.get('/suppression-list/statistics');
        return response;
    },

    async exportList(exportData) {
        const response = await api.post('/suppression-list/export', exportData);
        return response;
    },

    async importList(importData) {
        const response = await api.post('/suppression-list/import', importData);
        return response;
    },

    async processFBLFile(fileData) {
        const response = await api.post('/suppression-list/process-fbl', fileData);
        return response;
    },

    async removeEmail(emailData) {
        const response = await api.delete('/suppression-list/remove-email', emailData);
        return response;
    },

    async cleanupList(cleanupData) {
        const response = await api.post('/suppression-list/cleanup', cleanupData);
        return response;
    },

    async downloadFile(filename) {
        const response = await api.get(`/suppression-list/download/${filename}`);
        return response;
    }
};

// Security service methods
export const securityService = {
    async getSettings() {
        const response = await api.get('/security/settings');
        return response;
    },

    async enable2FA() {
        const response = await api.post('/security/2fa/enable');
        return response;
    },

    async disable2FA() {
        const response = await api.post('/security/2fa/disable');
        return response;
    },

    async verify2FA(code) {
        const response = await api.post('/security/2fa/verify', { code });
        return response;
    },

    async getApiKeys() {
        const response = await api.get('/security/api-keys');
        return response;
    },

    async createApiKey(keyData) {
        const response = await api.post('/security/api-keys', keyData);
        return response;
    },

    async deleteApiKey(keyId) {
        const response = await api.delete(`/security/api-keys/${keyId}`);
        return response;
    },

    async getActiveSessions() {
        const response = await api.get('/security/sessions');
        return response;
    },

    async revokeSession(sessionId) {
        const response = await api.delete(`/security/sessions/${sessionId}`);
        return response;
    },

    async getTrustedDevices() {
        const response = await api.get('/security/devices');
        return response;
    },

    async trustDevice(deviceId) {
        const response = await api.post(`/security/devices/${deviceId}/trust`);
        return response;
    },

    async getActivityLog() {
        const response = await api.get('/security/activity');
        return response;
    },

    async getSecuritySummary() {
        const response = await api.get('/security/summary');
        return response;
    },

    async changePassword(passwordData) {
        const response = await api.post('/security/password/change', passwordData);
        return response;
    }
};

// Billing service methods
export const billingService = {
    async getSubscriptions(params = {}) {
        const response = await api.get('/billing/subscriptions', params);
        return response;
    },

    async createSubscription(subscriptionData) {
        const response = await api.post('/billing/subscriptions', subscriptionData);
        return response;
    },

    async cancelSubscription(id) {
        const response = await api.delete(`/billing/subscriptions/${id}`);
        return response;
    },

    async createBTCPayInvoice(invoiceData) {
        const response = await api.post('/btcpay/invoice', invoiceData);
        return response;
    },

    async getPaymentHistory(params = {}) {
        const response = await api.get('/billing/payment-history', params);
        return response;
    },

    async getPaymentRates() {
        const response = await api.get('/billing/rates');
        return response;
    }

    // Note: Manual payments not implemented in backend
    // async createManualPayment(paymentData) {
    //     const response = await api.post('/billing/manual-payment', paymentData);
    //     return response;
    // }
};

// Settings service methods
export const settingsService = {
    async getSettings() {
        const response = await api.get('/security/settings');
        return response;
    },

    async updateSettings(settingsData) {
        const response = await api.put('/security/settings', settingsData);
        return response;
    },

    async getSystemSettings() {
        const response = await api.get('/admin/system-config');
        return response;
    },

    async updateSystemSettings(settingsData) {
        const response = await api.put('/admin/system-config', settingsData);
        return response;
    }
};

// System Settings service methods
export const systemSettingsService = {
    async getSettings() {
        const response = await api.get('/admin/system-settings');
        return response;
    },

    async updateSettings(settingsData) {
        const response = await api.put('/admin/system-settings', settingsData);
        return response;
    },

    async testSmtp(emailData) {
        const response = await api.post('/admin/system-settings/test-smtp', emailData);
        return response;
    },

    async getEnvVariables() {
        const response = await api.get('/admin/system-settings/env-variables');
        return response;
    }
};

// Admin service methods
export const adminService = {
    async getDashboard() {
        const response = await api.get('/admin/dashboard');
        return response;
    },

    async getUsers(params = {}) {
        const response = await api.get('/admin/users', { params });
        return response;
    },

    async getCampaigns(params = {}) {
        const response = await api.get('/admin/campaigns', { params });
        return response;
    },

    async getAnalytics(params = {}) {
        const response = await api.get('/admin/analytics', { params });
        return response;
    },

    async getSystemStatus() {
        const response = await api.get('/admin/system-status');
        return response;
    },

    async getSystemConfig() {
        const response = await api.get('/admin/system-config');
        return response;
    },

    async updateSystemConfig(configData) {
        const response = await api.post('/admin/system-config', configData);
        return response;
    },

    async getBTCPayConfig() {
        const response = await api.get('/admin/system-config/btcpay');
        return response;
    },

    async updateBTCPayConfig(configData) {
        const response = await api.post('/admin/system-config/btcpay', configData);
        return response;
    },

    async getTelegramConfig() {
        const response = await api.get('/admin/system-config/telegram');
        return response;
    },

    async updateTelegramConfig(configData) {
        const response = await api.post('/admin/system-config/telegram', configData);
        return response;
    },

    async getPowerMTAConfig() {
        const response = await api.get('/admin/system-config/powermta');
        return response;
    },

    async updatePowerMTAConfig(configData) {
        const response = await api.post('/admin/system-config/powermta', configData);
        return response;
    }
}; 
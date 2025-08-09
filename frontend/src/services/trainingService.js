import api from './api';

const trainingService = {
  // Unified training endpoints using new TrainingController
  
  // Get training status and statistics
  getTrainingStatus: async () => {
    const response = await api.get('/training/status');
    return response.data;
  },

  getTrainingStatistics: async () => {
    const response = await api.get('/training/statistics');
    return response.data;
  },

  // Run training operations
  runTraining: async (params = {}) => {
    const response = await api.post('/training/run', params);
    return response.data;
  },

  runUserTraining: async (userId, params = {}) => {
    const response = await api.post(`/training/run/user/${userId}`, params);
    return response.data;
  },

  runDomainTraining: async (domainId, params = {}) => {
    const response = await api.post(`/training/run/domain/${domainId}`, params);
    return response.data;
  },

  runSystemTraining: async (params = {}) => {
    const response = await api.post('/training/run/system', params);
    return response.data;
  },

  // Admin training management
  getAdminTrainingSettings: async (userId) => {
    const response = await api.get(`/admin/training/users/${userId}/settings`);
    return response.data;
  },

  updateAdminTrainingActivation: async (userId, activation) => {
    const response = await api.put(`/admin/training/users/${userId}/activation`, activation);
    return response.data;
  },

  getAdminTrainingStats: async (userId) => {
    const response = await api.get(`/admin/training/users/${userId}/stats`);
    return response.data;
  },

  // User-specific training statistics
  getUserTrainingStats: async (userId) => {
    const response = await api.get(`/training/statistics/user/${userId}`);
    return response.data;
  },

  getDomainTrainingStats: async (domainId) => {
    const response = await api.get(`/training/statistics/domain/${domainId}`);
    return response.data;
  }
};

export default trainingService;

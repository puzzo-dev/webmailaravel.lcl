import api from './api';

const trainingService = {
  // Admin training activation only
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

  // Existing automatic training endpoints
  getTrainingStatus: async () => {
    const response = await api.get('/admin/training/status');
    return response.data;
  },

  getTrainingStatistics: async () => {
    const response = await api.get('/admin/training/statistics');
    return response.data;
  },

  runAutomaticTraining: async () => {
    const response = await api.post('/admin/training/run');
    return response.data;
  },

  runDomainTraining: async (domainId) => {
    const response = await api.post(`/admin/training/run/${domainId}`);
    return response.data;
  }
};

export default trainingService;

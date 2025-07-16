import api from './api';

export const domainsService = {
  // Get all domains
  getDomains: () => {
    return api.get('/domains');
  },

  // Get single domain
  getDomain: (id) => {
    return api.get(`/domains/${id}`);
  },

  // Create new domain
  createDomain: (domainData) => {
    return api.post('/domains', domainData);
  },

  // Update domain
  updateDomain: (id, domainData) => {
    return api.put(`/domains/${id}`, domainData);
  },

  // Delete domain
  deleteDomain: (id) => {
    return api.delete(`/domains/${id}`);
  },

  // Verify domain
  verifyDomain: (id) => {
    return api.post(`/domains/${id}/verify`);
  },

  // Update domain configuration
  updateDomainConfig: (id, configData) => {
    return api.put(`/domains/${id}/config`, configData);
  },

  // Get domain SMTP configuration
  getDomainSmtpConfig: (id) => {
    return api.get(`/domains/${id}/smtp`);
  },

  // Update domain SMTP configuration
  updateDomainSmtpConfig: (id, smtpData) => {
    return api.put(`/domains/${id}/smtp`, smtpData);
  },

  // Delete domain SMTP configuration
  deleteDomainSmtpConfig: (id) => {
    return api.delete(`/domains/${id}/smtp`);
  },

  // Update bounce processing
  updateBounceProcessing: (id, bounceData) => {
    return api.put(`/domains/${id}/bounce-processing`, bounceData);
  },

  // Test bounce connection
  testBounceConnection: (id) => {
    return api.post(`/domains/${id}/bounce-processing/test`);
  },

  // Get bounce statistics
  getBounceStatistics: (id) => {
    return api.get(`/domains/${id}/bounce-processing/stats`);
  },

  // Process bounces
  processBounces: (id) => {
    return api.post(`/domains/${id}/bounce-processing/process`);
  },
}; 
// Debug utility to inspect service objects
import { adminService } from '../services/api';

export const debugAdminService = () => {
  console.log('=== Admin Service Debug ===');
  console.log('adminService object:', adminService);
  console.log('adminService type:', typeof adminService);
  console.log('adminService keys:', Object.keys(adminService));
  
  // Check specific methods
  const methodsToCheck = [
    'getNotifications',
    'getPowerMTAStatus',
    'getDashboard',
    'getUsers'
  ];
  
  methodsToCheck.forEach(method => {
    console.log(`${method}:`, typeof adminService[method], adminService[method] ? 'EXISTS' : 'MISSING');
  });
  
  console.log('=== End Debug ===');
};

// Auto-run in development
if (import.meta.env.DEV) {
  debugAdminService();
}

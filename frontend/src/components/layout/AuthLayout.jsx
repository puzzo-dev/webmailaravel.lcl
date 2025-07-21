import React from 'react';
import { Outlet } from 'react-router-dom';
import { HiInbox } from 'react-icons/hi';
import { useAppName } from '../../hooks/useSystemConfig';

const AuthLayout = () => {
  const appName = useAppName();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <HiInbox className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {appName}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Professional email campaign management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 {appName}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout; 
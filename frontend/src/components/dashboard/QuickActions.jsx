import React from 'react';
import { Link } from 'react-router-dom';

const QuickActions = ({ actions, userRole }) => {
  const filteredActions = actions.filter(action => {
    if (action.adminOnly && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group relative rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 bg-${action.color}-50 rounded-lg flex items-center justify-center group-hover:bg-${action.color}-100 transition-colors duration-200`}>
                    <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {action.name}
                  </p>
                  <p className="text-sm text-gray-500 group-hover:text-gray-600">
                    {action.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions; 
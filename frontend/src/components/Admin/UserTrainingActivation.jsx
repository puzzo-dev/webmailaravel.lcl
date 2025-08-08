import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminTrainingSettings,
  updateAdminTrainingActivation,
  fetchAdminTrainingStats,
  resetAdminData,
  clearError,
  clearSuccess
} from '../../store/slices/trainingSlice';

const UserTrainingActivation = ({ userId, userEmail, onClose }) => {
  const dispatch = useDispatch();
  const { adminSettings, adminStats, loading, error, success } = useSelector(state => state.training);

  const [trainingEnabled, setTrainingEnabled] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (userId) {
      dispatch(fetchAdminTrainingSettings(userId));
    }
    
    return () => {
      dispatch(resetAdminData());
    };
  }, [dispatch, userId]);

  useEffect(() => {
    if (adminSettings) {
      setTrainingEnabled(adminSettings.training_enabled || false);
    }
  }, [adminSettings]);

  const handleToggleTraining = async () => {
    const newStatus = !trainingEnabled;
    await dispatch(updateAdminTrainingActivation({ 
      userId, 
      activation: { training_enabled: newStatus } 
    }));
    setTrainingEnabled(newStatus);
  };

  const handleShowStats = () => {
    if (!showStats) {
      dispatch(fetchAdminTrainingStats(userId));
    }
    setShowStats(!showStats);
  };

  const handleCloseAlert = (type) => {
    if (type === 'error') {
      dispatch(clearError());
    } else if (type === 'success') {
      dispatch(clearSuccess());
    }
  };

  if (loading.adminSettings) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Training Activation - {userEmail}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{typeof error === 'string' ? error : error?.message || 'An error occurred'}</p>
              <button
                onClick={() => handleCloseAlert('error')}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex justify-between items-center">
              <p className="text-green-800">{success}</p>
              <button
                onClick={() => handleCloseAlert('success')}
                className="text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Training Activation Toggle */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Training Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Enable automatic training for this user's senders
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Training increases sender limits by 10% daily (max 500/day)
                </p>
              </div>
              <button
                onClick={handleToggleTraining}
                disabled={loading.adminUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  trainingEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } ${loading.adminUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    trainingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Current Status */}
          {adminSettings && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Current Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Training Enabled:</span>
                  <span className={`ml-2 font-medium ${adminSettings.training_enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {adminSettings.training_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Training Mode:</span>
                  <span className="ml-2 text-gray-900 font-medium">Manual (10% daily)</span>
                </div>
                <div>
                  <span className="text-gray-500">Daily Increase:</span>
                  <span className="ml-2 text-gray-900 font-medium">10%</span>
                </div>
                <div>
                  <span className="text-gray-500">Max Limit:</span>
                  <span className="ml-2 text-gray-900 font-medium">500/day</span>
                </div>
                {adminSettings.last_manual_training_at && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Last Training:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(adminSettings.last_manual_training_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleShowStats}
              disabled={loading.adminStats}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading.adminStats ? 'Loading...' : showStats ? 'Hide Statistics' : 'Show Statistics'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>

          {/* Training Statistics */}
          {showStats && adminStats && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Training Statistics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{adminStats.total_senders}</div>
                  <div className="text-xs text-gray-500">Total Senders</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{adminStats.total_current_limit}</div>
                  <div className="text-xs text-gray-500">Total Daily Limit</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{adminStats.average_limit}</div>
                  <div className="text-xs text-gray-500">Average Limit</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">{adminStats.max_limit}</div>
                  <div className="text-xs text-gray-500">Max Limit</div>
                </div>
              </div>

              {/* Next Training Projection */}
              {adminStats.next_training_projection && adminStats.next_training_projection.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Next Training Projection</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Sender
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Current
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Increase
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            New Limit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminStats.next_training_projection.slice(0, 5).map((projection, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-gray-900 truncate max-w-32">
                              {projection.sender_email}
                            </td>
                            <td className="px-4 py-2 text-gray-900">
                              {projection.current_limit}
                            </td>
                            <td className="px-4 py-2 text-green-600">
                              +{projection.projected_increase}
                            </td>
                            <td className="px-4 py-2 font-medium text-gray-900">
                              {projection.projected_new_limit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {adminStats.next_training_projection.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing 5 of {adminStats.next_training_projection.length} senders
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTrainingActivation;

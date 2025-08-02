import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminTrainingSettings,
  updateAdminTrainingSettings,
  fetchAdminTrainingStats,
  runAdminTraining,
  resetAdminData,
  clearError,
  clearSuccess,
  clearTrainingResult
} from '../../store/slices/trainingSlice';

const UserTrainingManagement = ({ userId, userEmail, onClose }) => {
  const dispatch = useDispatch();
  const { adminSettings, adminStats, loading, error, success, lastTrainingResult } = useSelector(state => state.training);

  const [formData, setFormData] = useState({
    training_enabled: false,
    training_mode: 'automatic',
    manual_training_percentage: 10.0
  });

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
      setFormData({
        training_enabled: adminSettings.training_enabled || false,
        training_mode: adminSettings.training_mode || 'automatic',
        manual_training_percentage: adminSettings.manual_training_percentage || 10.0
      });
    }
  }, [adminSettings]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(updateAdminTrainingSettings({ userId, settings: formData }));
  };

  const handleRunTraining = async () => {
    await dispatch(runAdminTraining(userId));
    // Refresh stats after training
    if (showStats) {
      dispatch(fetchAdminTrainingStats(userId));
    }
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
    } else if (type === 'result') {
      dispatch(clearTrainingResult());
    }
  };

  if (loading.adminSettings) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Training Settings - {userEmail}
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
              <p className="text-red-800">{error}</p>
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

        {lastTrainingResult && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-800 font-medium">{lastTrainingResult.message}</p>
                {lastTrainingResult.senders_updated !== undefined && (
                  <p className="text-blue-600 text-sm mt-1">
                    Senders updated: {lastTrainingResult.senders_updated}
                  </p>
                )}
                {lastTrainingResult.percentage_applied && (
                  <p className="text-blue-600 text-sm">
                    Percentage applied: {lastTrainingResult.percentage_applied}%
                  </p>
                )}
                {lastTrainingResult.domains_processed && (
                  <p className="text-blue-600 text-sm">
                    Domains processed: {lastTrainingResult.domains_processed}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleCloseAlert('result')}
                className="text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Training Enabled */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="training_enabled"
              name="training_enabled"
              checked={formData.training_enabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="training_enabled" className="ml-2 block text-sm font-medium text-gray-700">
              Enable Training for this User
            </label>
          </div>

          {/* Training Mode */}
          {formData.training_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Mode
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="automatic"
                    name="training_mode"
                    value="automatic"
                    checked={formData.training_mode === 'automatic'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="automatic" className="ml-2 block text-sm text-gray-700">
                    Automatic Training (PowerMTA analysis-based)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="manual"
                    name="training_mode"
                    value="manual"
                    checked={formData.training_mode === 'manual'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="manual" className="ml-2 block text-sm text-gray-700">
                    Manual Training (Fixed percentage increase)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Manual Training Percentage */}
          {formData.training_enabled && formData.training_mode === 'manual' && (
            <div>
              <label htmlFor="manual_training_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                Daily Increase Percentage (1-50%)
              </label>
              <input
                type="number"
                id="manual_training_percentage"
                name="manual_training_percentage"
                min="1"
                max="50"
                step="0.1"
                value={formData.manual_training_percentage}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Sender limits will increase by this percentage daily
              </p>
            </div>
          )}

          {/* Current Status */}
          {adminSettings && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Current Status</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Training Enabled:</span>
                  <span className={`ml-2 ${adminSettings.training_enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {adminSettings.training_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Mode:</span>
                  <span className="ml-2 text-gray-900 capitalize">{adminSettings.training_mode}</span>
                </div>
                {adminSettings.training_mode === 'manual' && (
                  <>
                    <div>
                      <span className="text-gray-500">Percentage:</span>
                      <span className="ml-2 text-gray-900">{adminSettings.manual_training_percentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Training Due:</span>
                      <span className={`ml-2 ${adminSettings.is_manual_training_due ? 'text-orange-600' : 'text-green-600'}`}>
                        {adminSettings.is_manual_training_due ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </>
                )}
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
              type="submit"
              disabled={loading.adminUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading.adminUpdating ? 'Updating...' : 'Update Settings'}
            </button>

            {formData.training_enabled && (
              <button
                type="button"
                onClick={handleRunTraining}
                disabled={loading.adminRunning}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading.adminRunning ? 'Running...' : 'Run Training Now'}
              </button>
            )}

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
        </form>

        {/* Training Statistics */}
        {showStats && adminStats && (
          <div className="mt-8 bg-gray-50 p-6 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Training Statistics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{adminStats.total_senders}</div>
                <div className="text-sm text-gray-500">Total Senders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{adminStats.total_current_limit}</div>
                <div className="text-sm text-gray-500">Total Daily Limit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{adminStats.average_limit}</div>
                <div className="text-sm text-gray-500">Average Limit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{adminStats.max_limit}</div>
                <div className="text-sm text-gray-500">Max Limit</div>
              </div>
            </div>

            {/* Next Training Projection */}
            {adminStats.next_training_projection && adminStats.next_training_projection.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Next Training Projection</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sender
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Increase
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          New Limit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adminStats.next_training_projection.map((projection, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {projection.sender_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {projection.current_limit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            +{projection.projected_increase}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {projection.projected_new_limit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTrainingManagement;

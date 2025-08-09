import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  HiPlay, 
  HiClock, 
  HiCog, 
  HiRefresh,
  HiCheckCircle,
  HiExclamation,
  HiInformationCircle
} from 'react-icons/hi';
import { api } from '../../utils/api';

const AdminScheduler = () => {
  const [schedulerInfo, setSchedulerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningCommand, setRunningCommand] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);

  useEffect(() => {
    loadSchedulerInfo();
    loadQueueStatus();
  }, []);

  const loadSchedulerInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/scheduler');
      setSchedulerInfo(response.data);
    } catch (error) {
      console.error('Failed to load scheduler info:', error);
      toast.error('Failed to load scheduler information');
    } finally {
      setLoading(false);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const response = await api.get('/admin/scheduler/queue-status');
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Failed to load queue status:', error);
    }
  };

  const runScheduler = async () => {
    try {
      setRunningCommand('scheduler');
      toast.loading('Running scheduler...', { id: 'scheduler' });
      
      const response = await api.post('/admin/scheduler/run');
      
      toast.success('Scheduler executed successfully!', { id: 'scheduler' });
      console.log('Scheduler output:', response.data.output);
      
      // Reload info after running
      loadSchedulerInfo();
      
    } catch (error) {
      console.error('Failed to run scheduler:', error);
      toast.error('Failed to run scheduler', { id: 'scheduler' });
    } finally {
      setRunningCommand(null);
    }
  };

  const runCommand = async (command) => {
    try {
      setRunningCommand(command);
      toast.loading(`Running ${command}...`, { id: command });
      
      const response = await api.post('/admin/scheduler/command', { command });
      
      toast.success(`${command} executed successfully!`, { id: command });
      console.log('Command output:', response.data.output);
      
    } catch (error) {
      console.error(`Failed to run ${command}:`, error);
      toast.error(`Failed to run ${command}`, { id: command });
    } finally {
      setRunningCommand(null);
    }
  };

  const testScheduler = async () => {
    try {
      toast.loading('Testing scheduler setup...', { id: 'test' });
      
      const response = await api.post('/admin/scheduler/test');
      
      toast.success('Scheduler test completed!', { id: 'test' });
      console.log('Test results:', response.data);
      
    } catch (error) {
      console.error('Scheduler test failed:', error);
      toast.error('Scheduler test failed', { id: 'test' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scheduler Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor scheduled tasks</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={testScheduler}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiCog className="h-4 w-4 mr-2" />
              Test Setup
            </button>
            <button
              onClick={loadSchedulerInfo}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <HiRefresh className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Cron Job Setup Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <HiInformationCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Cron Job Setup Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>To enable automatic scheduling, add this cron job to your server:</p>
              <code className="block mt-2 p-2 bg-yellow-100 rounded text-xs">
                {`* * * * * cd /path/to/your/project/backend && php artisan schedule:run >> /dev/null 2>&1`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Scheduler Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Manual Controls</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Run All Scheduled Tasks</h3>
              <p className="text-sm text-gray-600">Execute all scheduled tasks manually</p>
            </div>
            <button
              onClick={runScheduler}
              disabled={runningCommand === 'scheduler'}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {runningCommand === 'scheduler' ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Running...
                </>
              ) : (
                <>
                  <HiPlay className="h-4 w-4 mr-2" />
                  Run Scheduler
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Available Commands */}
      {schedulerInfo?.available_commands && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Individual Commands</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schedulerInfo.available_commands.map((cmd, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{cmd.command}</h3>
                    <p className="text-sm text-gray-600 mt-1">{cmd.description}</p>
                    <div className="flex items-center mt-2">
                      <HiClock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">{cmd.frequency}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => runCommand(cmd.command)}
                    disabled={runningCommand === cmd.command}
                    className="ml-3 inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {runningCommand === cmd.command ? (
                      <>
                        <div className="animate-spin h-3 w-3 mr-1 border border-white border-t-transparent rounded-full"></div>
                        Running
                      </>
                    ) : (
                      <>
                        <HiPlay className="h-3 w-3 mr-1" />
                        Run
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule List */}
      {schedulerInfo?.schedule_list && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Schedule</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            {schedulerInfo.schedule_list}
          </pre>
        </div>
      )}

      {/* Queue Status */}
      {queueStatus && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Queue Status</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <HiCheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">Queue system is operational</span>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              {queueStatus.failed_jobs}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScheduler;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendar, 
  FaShieldAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaKey,
  FaChartBar,
  FaCog
} from 'react-icons/fa';
import { fetchAdminUsers, updateUserStatus, deleteUser } from '../../store/slices/userSlice';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(state => state.users);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateRange: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const handleStatusChange = async (userId, status) => {
    try {
      await dispatch(updateUserStatus({ userId, status }));
      dispatch(fetchAdminUsers());
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;
    
    try {
      for (const userId of selectedUsers) {
        if (action === 'delete') {
          await dispatch(deleteUser(userId));
        } else if (action === 'activate') {
          await dispatch(updateUserStatus({ userId, status: 'active' }));
        } else if (action === 'deactivate') {
          await dispatch(updateUserStatus({ userId, status: 'inactive' }));
        }
      }
      setSelectedUsers([]);
      dispatch(fetchAdminUsers());
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filters.status && user.status !== filters.status) return false;
    if (filters.search && !user.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !user.email.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle },
      suspended: { color: 'bg-red-100 text-red-800', icon: FaLock },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaCalendar }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users and their accounts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', search: '', dateRange: '' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <FaUser className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                        className="text-green-600 hover:text-green-900"
                      >
                        {user.status === 'active' ? <FaTimesCircle className="h-4 w-4" /> : <FaCheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => dispatch(deleteUser(user.id))}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers; 
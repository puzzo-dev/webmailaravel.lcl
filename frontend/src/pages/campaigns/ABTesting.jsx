import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiChartBar,
  HiPlay,
  HiPause,
  HiStop,
  HiCheck,
  HiX,
  HiTrendingUp,
  HiTrendingDown,
  HiClock,
  HiUsers,
  HiMail,
  HiCursorClick,
  HiStar,
} from 'react-icons/hi';

const ABTesting = () => {
  const dispatch = useDispatch();
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API calls
  const mockTests = [
    {
      id: 1,
      name: 'Subject Line Test',
      description: 'Testing different subject lines for newsletter',
      status: 'running',
      type: 'subject',
      variants: [
        {
          id: 1,
          name: 'Variant A',
          content: 'Your weekly newsletter is here!',
          sent: 1000,
          opens: 250,
          clicks: 45,
          conversions: 12,
          open_rate: 25.0,
          click_rate: 4.5,
          conversion_rate: 1.2,
        },
        {
          id: 2,
          name: 'Variant B',
          content: 'Don\'t miss this week\'s updates',
          sent: 1000,
          opens: 280,
          clicks: 52,
          conversions: 15,
          open_rate: 28.0,
          click_rate: 5.2,
          conversion_rate: 1.5,
        },
      ],
      winner: 2,
      sample_size: 2000,
      confidence_level: 95,
      start_date: '2024-01-15T10:00:00Z',
      end_date: '2024-01-22T10:00:00Z',
      created_at: '2024-01-15T09:30:00Z',
    },
    {
      id: 2,
      name: 'Content Layout Test',
      description: 'Testing different content layouts',
      status: 'completed',
      type: 'content',
      variants: [
        {
          id: 3,
          name: 'Variant A',
          content: 'Single column layout',
          sent: 500,
          opens: 125,
          clicks: 25,
          conversions: 8,
          open_rate: 25.0,
          click_rate: 5.0,
          conversion_rate: 1.6,
        },
        {
          id: 4,
          name: 'Variant B',
          content: 'Two column layout',
          sent: 500,
          opens: 140,
          clicks: 30,
          conversions: 10,
          open_rate: 28.0,
          click_rate: 6.0,
          conversion_rate: 2.0,
        },
      ],
      winner: 4,
      sample_size: 1000,
      confidence_level: 95,
      start_date: '2024-01-10T10:00:00Z',
      end_date: '2024-01-17T10:00:00Z',
      created_at: '2024-01-10T09:30:00Z',
    },
    {
      id: 3,
      name: 'CTA Button Test',
      description: 'Testing different call-to-action buttons',
      status: 'draft',
      type: 'cta',
      variants: [
        {
          id: 5,
          name: 'Variant A',
          content: 'Learn More',
          sent: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
        },
        {
          id: 6,
          name: 'Variant B',
          content: 'Get Started Now',
          sent: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
        },
      ],
      winner: null,
      sample_size: 1000,
      confidence_level: 95,
      start_date: null,
      end_date: null,
      created_at: '2024-01-20T09:30:00Z',
    },
  ];

  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    type: 'subject',
    variants: [
      { name: 'Variant A', content: '' },
      { name: 'Variant B', content: '' },
    ],
    sample_size: 1000,
    confidence_level: 95,
  });

  useEffect(() => {
    setTests(mockTests);
  }, []);

  const handleCreateTest = async () => {
    if (!newTest.name.trim() || !newTest.variants.every(v => v.content.trim())) return;
    
    setIsLoading(true);
    try {
      // Implement create test API call
      console.log('Creating A/B test:', newTest);
      setShowCreateModal(false);
      setNewTest({
        name: '',
        description: '',
        type: 'subject',
        variants: [
          { name: 'Variant A', content: '' },
          { name: 'Variant B', content: '' },
        ],
        sample_size: 1000,
        confidence_level: 95,
      });
    } catch (error) {
      console.error('Failed to create A/B test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTest = async () => {
    if (!selectedTest || !selectedTest.name.trim()) return;
    
    setIsLoading(true);
    try {
      // Implement update test API call
      console.log('Updating A/B test:', selectedTest);
      setShowEditModal(false);
      setSelectedTest(null);
    } catch (error) {
      console.error('Failed to update A/B test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async (testId) => {
    setIsLoading(true);
    try {
      // Implement start test API call
      console.log('Starting A/B test:', testId);
    } catch (error) {
      console.error('Failed to start A/B test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTest = async (testId) => {
    setIsLoading(true);
    try {
      // Implement stop test API call
      console.log('Stopping A/B test:', testId);
    } catch (error) {
      console.error('Failed to stop A/B test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this A/B test? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      // Implement delete test API call
      console.log('Deleting A/B test:', testId);
    } catch (error) {
      console.error('Failed to delete A/B test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'completed':
        return 'info';
      case 'draft':
        return 'gray';
      case 'paused':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <HiPlay className="h-4 w-4" />;
      case 'completed':
        return <HiCheck className="h-4 w-4" />;
      case 'draft':
        return <HiClock className="h-4 w-4" />;
      case 'paused':
        return <HiPause className="h-4 w-4" />;
      default:
        return <HiClock className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'subject':
        return 'Subject Line';
      case 'content':
        return 'Content';
      case 'cta':
        return 'Call-to-Action';
      case 'sender':
        return 'Sender Name';
      default:
        return type;
    }
  };

  const calculateWinner = (variants) => {
    if (variants.length < 2) return null;
    
    // Simple winner calculation based on conversion rate
    const bestVariant = variants.reduce((best, current) => 
      current.conversion_rate > best.conversion_rate ? current : best
    );
    
    return bestVariant.id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1>
            <p className="text-gray-600 mt-1">Test different email elements to optimize performance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <HiPlus className="h-5 w-5 mr-2" />
            Create Test
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <HiChartBar className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
                <HiPlay className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Running</p>
              <p className="text-2xl font-bold text-gray-900">
                {tests.filter(t => t.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-info-100 rounded-lg flex items-center justify-center">
                <HiCheck className="h-5 w-5 text-info-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {tests.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <HiStar className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Winners Found</p>
              <p className="text-2xl font-bold text-gray-900">
                {tests.filter(t => t.winner).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tests List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">A/B Tests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sample Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Winner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{test.name}</div>
                      <div className="text-sm text-gray-500">{test.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTypeLabel(test.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(test.status)}-100 text-${getStatusColor(test.status)}-800`}>
                      {getStatusIcon(test.status)}
                      <span className="ml-1">{test.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {test.variants.length} variants
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {test.sample_size.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {test.winner ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <HiTrendingUp className="h-3 w-3 mr-1" />
                        Variant {test.variants.find(v => v.id === test.winner)?.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">No winner yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setShowResultsModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Results"
                      >
                        <HiEye className="h-4 w-4" />
                      </button>
                      {test.status === 'draft' && (
                        <button
                          onClick={() => handleStartTest(test.id)}
                          className="text-success-600 hover:text-success-900"
                          title="Start Test"
                        >
                          <HiPlay className="h-4 w-4" />
                        </button>
                      )}
                      {test.status === 'running' && (
                        <button
                          onClick={() => handleStopTest(test.id)}
                          className="text-warning-600 hover:text-warning-900"
                          title="Stop Test"
                        >
                          <HiStop className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="text-danger-600 hover:text-danger-900"
                        title="Delete Test"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create A/B Test</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Name
                    </label>
                    <input
                      type="text"
                      value={newTest.name}
                      onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                      placeholder="Enter test name..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Type
                    </label>
                    <select
                      value={newTest.type}
                      onChange={(e) => setNewTest({ ...newTest, type: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="subject">Subject Line</option>
                      <option value="content">Content</option>
                      <option value="cta">Call-to-Action</option>
                      <option value="sender">Sender Name</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                    placeholder="Enter test description..."
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variants
                  </label>
                  <div className="space-y-4">
                    {newTest.variants.map((variant, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {variant.name}
                          </label>
                        </div>
                        <textarea
                          value={variant.content}
                          onChange={(e) => {
                            const updatedVariants = [...newTest.variants];
                            updatedVariants[index].content = e.target.value;
                            setNewTest({ ...newTest, variants: updatedVariants });
                          }}
                          placeholder={`Enter ${newTest.type} content for ${variant.name}...`}
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sample Size
                    </label>
                    <input
                      type="number"
                      value={newTest.sample_size}
                      onChange={(e) => setNewTest({ ...newTest, sample_size: parseInt(e.target.value) })}
                      min="100"
                      step="100"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Level (%)
                    </label>
                    <select
                      value={newTest.confidence_level}
                      onChange={(e) => setNewTest({ ...newTest, confidence_level: parseInt(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="90">90%</option>
                      <option value="95">95%</option>
                      <option value="99">99%</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTest}
                    disabled={isLoading || !newTest.name.trim() || !newTest.variants.every(v => v.content.trim())}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Creating...' : 'Create Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Test Results: {selectedTest.name}</h3>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Test Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{getTypeLabel(selectedTest.type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{selectedTest.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sample Size:</span>
                        <span className="font-medium">{selectedTest.sample_size.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{selectedTest.confidence_level}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Winner</h4>
                    {selectedTest.winner ? (
                      <div className="text-center">
                        <HiTrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTest.variants.find(v => v.id === selectedTest.winner)?.name}
                        </p>
                        <p className="text-xs text-gray-500">Best performing variant</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <HiClock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No winner yet</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Test Duration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start:</span>
                        <span className="font-medium">
                          {selectedTest.start_date ? new Date(selectedTest.start_date).toLocaleDateString() : 'Not started'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End:</span>
                        <span className="font-medium">
                          {selectedTest.end_date ? new Date(selectedTest.end_date).toLocaleDateString() : 'Not ended'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Variant Performance</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Variant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Opens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clicks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Open Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Click Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conv. Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedTest.variants.map((variant) => (
                          <tr key={variant.id} className={variant.id === selectedTest.winner ? 'bg-green-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">{variant.name}</span>
                                {variant.id === selectedTest.winner && (
                                  <HiTrendingUp className="h-4 w-4 text-green-500 ml-2" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.sent.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.opens.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.clicks.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.conversions.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.open_rate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.click_rate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.conversion_rate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowResultsModal(false)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ABTesting; 
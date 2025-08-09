import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheckCircle,
  HiXCircle,
  HiGlobe,
  HiMail,
  HiUser,
  HiCog,
  HiInformationCircle,
  HiServer,
  HiAtSymbol,
  HiX,
  HiPaperAirplane,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { 
  fetchDomains, 
  createDomain, 
  updateDomain, 
  deleteDomain, 
  clearError,
} from '../../store/slices/domainsSlice';
import {
  fetchSenders,
  createSender,
  updateSender,
  deleteSender,
  testSenderConnection,
} from '../../store/slices/senderSlice';
import { domainService, senderService } from '../../services/api';
import { useSubscriptionError } from '../../hooks/useSubscriptionError';

const Domains = () => {
  const dispatch = useDispatch();
  const { domains = [], isLoading, error } = useSelector((state) => state.domains || {});
  const { senders = [], isLoading: isSendersLoading } = useSelector((state) => state.senders || {});
  const { user, currentView } = useSelector((state) => state.auth || {});
  
  // State declarations
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeTab, setActiveTab] = useState('smtp');
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [domainForm, setDomainForm] = useState({ name: '' });
  const [smtpConfig, setSmtpConfig] = useState(null);
  const [smtpForm, setSmtpForm] = useState({ host: '', port: 587, username: '', password: '', encryption: 'tls', is_active: true });
  const [editingSmtp, setEditingSmtp] = useState(false);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [senderForm, setSenderForm] = useState({ name: '', username: '', domain_id: '' });
  const [editingSender, setEditingSender] = useState(null);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSender, setTestSender] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingSender, setIsTestingSender] = useState(false);
  
  // Ensure senders is always an array
  const safeSenders = Array.isArray(senders) ? senders : [];
  

  
  const { handleSubscriptionError } = useSubscriptionError();
  
  // Use ref to track previous selected domain ID to prevent infinite loops
  const prevSelectedDomainId = useRef(null);

  // Filter domains based on current view
  const isAdminView = currentView === 'admin';
  const isAdmin = user?.role === 'admin';
  
  // In user view, only show domains that belong to the current user
  // In admin view, show all domains
  const filteredDomains = isAdmin && isAdminView 
    ? domains 
    : domains.filter(domain => domain.user_id === user?.id);

  useEffect(() => {
    dispatch(fetchDomains()).catch(error => {
      handleSubscriptionError(error);
    });
  }, [dispatch]);

  // Clear selected domain if it doesn't belong to current user in user view
  useEffect(() => {
    if (selectedDomain && !isAdminView && isAdmin) {
      const domainBelongsToUser = filteredDomains.some(domain => domain.id === selectedDomain.id);
      if (!domainBelongsToUser) {
        setSelectedDomain(null);
      }
    }
  }, [selectedDomain, filteredDomains, isAdminView, isAdmin]);

  useEffect(() => {
    if (selectedDomain && selectedDomain.id !== prevSelectedDomainId.current) {
      prevSelectedDomainId.current = selectedDomain.id;
      // Fetch SMTP config
      if (selectedDomain.id) {
        domainService.getDomainSmtpConfig(selectedDomain.id)
          .then(res => setSmtpConfig(res.data || null))
          .catch(() => setSmtpConfig(null));
      }
      // Fetch senders
      dispatch(fetchSenders({ domain_id: selectedDomain.id }));
    }
  }, [selectedDomain?.id, dispatch]);

  useEffect(() => {
    if (error) {
      if (!handleSubscriptionError({ response: { status: 403, data: { error: 'subscription_required', message: error } } })) {
        // Ensure error is a string for toast display
        const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';
        toast.error(errorMessage);
      }
      dispatch(clearError());
    }
  }, [error, dispatch]);



  // Domain CRUD
  const handleAddDomain = async () => {
    try {
      await dispatch(createDomain(domainForm)).unwrap();
      toast.success('Domain added!');
      setShowDomainModal(false);
      setDomainForm({ name: '' });
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error('Failed to add domain');
      }
    }
  };
  const handleEditDomain = async () => {
    try {
      await dispatch(updateDomain({ id: editingDomain.id, domainData: domainForm })).unwrap();
      toast.success('Domain updated!');
      setShowDomainModal(false);
      setEditingDomain(null);
      setDomainForm({ name: '' });
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error('Failed to update domain');
      }
    }
  };
  const handleDeleteDomain = async (id) => {
    if (!window.confirm('Delete this domain?')) return;
    try {
      await dispatch(deleteDomain(id)).unwrap();
      toast.success('Domain deleted!');
      if (selectedDomain?.id === id) setSelectedDomain(null);
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error('Failed to delete domain');
      }
    }
  };

  // SMTP Config CRUD
  const handleSaveSmtp = async () => {
    try {
      if (smtpConfig) {
        await domainService.updateDomainSmtpConfig(selectedDomain.id, smtpForm);
        toast.success('SMTP config updated!');
      } else {
        await domainService.updateDomainSmtpConfig(selectedDomain.id, smtpForm);
        toast.success('SMTP config added!');
      }
      setShowSmtpModal(false);
      setEditingSmtp(false);
      // Refresh SMTP config
      const res = await domainService.getDomainSmtpConfig(selectedDomain.id);
      setSmtpConfig(res.data || null);
    } catch (_e) {
      toast.error('Failed to save SMTP config');
    }
  };
  const handleDeleteSmtp = async () => {
    if (!window.confirm('Delete SMTP config?')) return;
    try {
      await domainService.deleteDomainSmtpConfig(selectedDomain.id);
      toast.success('SMTP config deleted!');
      setSmtpConfig(null);
    } catch (_e) {
      toast.error('Failed to delete SMTP config');
    }
  };

  // Sender CRUD
  const handleAddSender = async () => {
    try {
      const email = `${senderForm.username}@${selectedDomain.name}`;
      await dispatch(createSender({ 
        name: senderForm.name, 
        email: email, 
        domain_id: selectedDomain.id 
      })).unwrap();
      toast.success('Sender added!');
      setShowSenderModal(false);
      setSenderForm({ name: '', username: '', domain_id: '' });
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error('Failed to add sender');
      }
    }
  };
  const handleEditSender = async () => {
    try {
      const email = `${senderForm.username}@${selectedDomain.name}`;
      await dispatch(updateSender({ 
        id: editingSender.id, 
        data: {
          name: senderForm.name, 
          email: email 
        }
      })).unwrap();
      toast.success('Sender updated!');
      setShowSenderModal(false);
      setEditingSender(null);
      setSenderForm({ name: '', username: '', domain_id: '' });
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error('Failed to update sender');
      }
    }
  };
  const handleDeleteSender = async (id) => {
    if (!window.confirm('Delete this sender?')) return;
    try {
      await dispatch(deleteSender(id)).unwrap();
      toast.success('Sender deleted!');
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error('Failed to delete sender');
      }
    }
  };

  // Test Sender
  const handleTestSender = async () => {
    if (!testSender) {
      toast.error('Please select a sender to test.');
      return;
    }
    
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid test email address.');
      return;
    }
    
    setIsTestingSender(true);
    try {
      const result = await dispatch(testSenderConnection({ 
        id: testSender.id, 
        test_email: testEmail 
      })).unwrap();
      
      toast.success(`Test email sent successfully to ${testEmail}! Check your inbox for the test email.`);
      setShowTestModal(false);
      setTestSender(null);
      setTestEmail('');
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error('Failed to send test email: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsTestingSender(false);
    }
  };

  // UI
  return (
    <div className="flex h-full bg-gray-50">
      {/* Left: Domain List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-900">Domains</h2>
            </div>
            <button
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" 
              onClick={() => { setShowDomainModal(true); setEditingDomain(null); }}
            >
              <HiPlus className="w-4 h-4 mr-1" />
              Add Domain
            </button>
          </div>
          {isAdmin && (
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isAdminView 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isAdminView ? 'Admin View' : 'User View'}
              </span>
              <div className="text-sm text-gray-500">
                {filteredDomains.length} domain{filteredDomains.length !== 1 ? 's' : ''} configured
              </div>
            </div>
          )}
          {!isAdmin && (
            <div className="text-sm text-gray-500">
              {filteredDomains.length} domain{filteredDomains.length !== 1 ? 's' : ''} configured
            </div>
          )}
        </div>

        {/* Domain List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading domains...
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <HiGlobe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {isAdmin && isAdminView 
                  ? 'No domains configured in the system' 
                  : 'No domains configured yet'
                }
              </p>
              <p className="text-xs text-gray-400">
                {isAdmin && isAdminView 
                  ? 'Add domains to the system for users to manage' 
                  : 'Add your first domain to get started'
                }
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredDomains.map(domain => (
                <div
                  key={domain.id}
                  className={`group relative mb-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedDomain?.id === domain.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDomain(domain)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <HiGlobe className={`w-5 h-5 mr-3 flex-shrink-0 ${
                          selectedDomain?.id === domain.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${
                            selectedDomain?.id === domain.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {domain.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {safeSenders.filter(s => s.domain_id === domain.id).length} sender{safeSenders.filter(s => s.domain_id === domain.id).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingDomain(domain);
                            setDomainForm({ name: domain.name });
                            setShowDomainModal(true);
                          }}
                          title="Edit domain"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteDomain(domain.id);
                          }}
                          title="Delete domain"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Details Panel */}
      <div className="flex-1 flex flex-col">
        {!selectedDomain ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <HiGlobe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Domain</h3>
              <p className="text-gray-500 max-w-sm">
                Choose a domain from the list to manage its SMTP configuration and senders.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                    <HiGlobe className="w-6 h-6 mr-3 text-blue-600" />
                    {selectedDomain.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage SMTP configuration and senders for this domain
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
              <div className="px-6">
                <nav className="flex space-x-8">
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'smtp'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('smtp')}
                  >
                    <HiServer className="w-4 h-4 inline mr-2" />
                    SMTP Configuration
                  </button>
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'senders'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('senders')}
                  >
                    <HiAtSymbol className="w-4 h-4 inline mr-2" />
                    Senders
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'smtp' && (
                <div className="max-w-4xl">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h2>
                    {smtpConfig ? (
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                              <HiServer className="w-5 h-5 text-green-600 mr-2" />
                              <span className="text-sm font-medium text-gray-900">SMTP Server Active</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                onClick={() => {
                                  setSmtpForm(smtpConfig);
                                  setEditingSmtp(true);
                                  setShowSmtpModal(true);
                                }}
                              >
                                <HiPencil className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                              <button
                                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                onClick={handleDeleteSmtp}
                              >
                                <HiTrash className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">{smtpConfig.host}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">{smtpConfig.port}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">{smtpConfig.username}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border capitalize">{smtpConfig.encryption}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <div className="flex items-center">
                                {smtpConfig.is_active ? (
                                  <>
                                    <HiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                    <span className="text-sm text-green-700">Active</span>
                                  </>
                                ) : (
                                  <>
                                    <HiXCircle className="w-5 h-5 text-red-500 mr-2" />
                                    <span className="text-sm text-red-700">Inactive</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-start">
                          <HiInformationCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="text-sm font-medium text-yellow-800">No SMTP Configuration</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              This domain doesn't have an SMTP configuration yet. Add one to enable email sending.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    onClick={() => {
                      setSmtpForm({ host: '', port: 587, username: '', password: '', encryption: 'tls', is_active: true });
                      setEditingSmtp(false);
                      setShowSmtpModal(true);
                    }}
                  >
                    <HiPlus className="w-4 h-4 mr-2" />
                    {smtpConfig ? 'Update SMTP Configuration' : 'Add SMTP Configuration'}
                  </button>
                </div>
              )}

              {activeTab === 'senders' && (
                <div className="max-w-4xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Senders</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Manage email senders for this domain
                      </p>
                    </div>
                    <button
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      onClick={() => {
                        setSenderForm({ name: '', username: '', domain_id: selectedDomain.id });
                        setEditingSender(null);
                        setShowSenderModal(true);
                      }}
                    >
                      <HiPlus className="w-4 h-4 mr-2" />
                      Add Sender
                    </button>
                  </div>

                  {isSendersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <div className="text-gray-500">Loading senders...</div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      {safeSenders.filter(s => s.domain_id === selectedDomain.id).length === 0 ? (
                        <div className="p-8 text-center">
                          <HiAtSymbol className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-sm font-medium text-gray-900 mb-2">No senders configured</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Add your first sender to start sending emails from this domain.
                          </p>
                          <button
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            onClick={() => {
                              setSenderForm({ name: '', username: '', domain_id: selectedDomain.id });
                              setEditingSender(null);
                              setShowSenderModal(true);
                            }}
                          >
                            <HiPlus className="w-4 h-4 mr-2" />
                            Add First Sender
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {safeSenders.filter(s => s.domain_id === selectedDomain.id).map(sender => (
                            <div key={sender.id} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 flex-1">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <HiUser className="w-5 h-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4 min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{sender.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{sender.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                                    onClick={() => {
                                      setEditingSender(sender);
                                      const username = sender.email.split('@')[0];
                                      setSenderForm({ name: sender.name, username: username, domain_id: sender.domain_id });
                                      setShowSenderModal(true);
                                    }}
                                    title="Edit sender"
                                  >
                                    <HiPencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                    onClick={() => handleDeleteSender(sender.id)}
                                    title="Delete sender"
                                  >
                                    <HiTrash className="w-4 h-4" />
                                  </button>
                                  <button
                                    className={`p-2 rounded-md transition-colors ${
                                      smtpConfig 
                                        ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' 
                                        : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                    onClick={() => {
                                      if (smtpConfig) {
                                        setTestSender(sender);
                                        setShowTestModal(true);
                                      }
                                    }}
                                    title={smtpConfig ? "Test sender" : "No SMTP configuration available"}
                                    disabled={!smtpConfig}
                                  >
                                    <HiPaperAirplane className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Domain Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{editingDomain ? 'Edit Domain' : 'Add Domain'}</h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => { setShowDomainModal(false); setEditingDomain(null); }}
              >
                <HiXCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="example.com"
                value={domainForm.name}
                onChange={e => setDomainForm({ name: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={() => { setShowDomainModal(false); setEditingDomain(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={editingDomain ? handleEditDomain : handleAddDomain}
              >
                {editingDomain ? 'Save Changes' : 'Add Domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{editingSmtp ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}</h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => { setShowSmtpModal(false); setEditingSmtp(false); }}
              >
                <HiXCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="smtp.example.com"
                  value={smtpForm.host}
                  onChange={e => setSmtpForm(f => ({ ...f, host: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  type="number"
                  placeholder="587"
                  value={smtpForm.port}
                  onChange={e => setSmtpForm(f => ({ ...f, port: parseInt(e.target.value) || 587 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                  value={smtpForm.username}
                  onChange={e => setSmtpForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  type="password"
                  placeholder="••••••••"
                  value={smtpForm.password}
                  onChange={e => setSmtpForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={smtpForm.encryption}
                  onChange={e => setSmtpForm(f => ({ ...f, encryption: e.target.value }))}
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={smtpForm.is_active}
                  onChange={e => setSmtpForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={() => { setShowSmtpModal(false); setEditingSmtp(false); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={handleSaveSmtp}
              >
                {editingSmtp ? 'Save Changes' : 'Add Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sender Modal */}
      {showSenderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{editingSender ? 'Edit Sender' : 'Add Sender'}</h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => { setShowSenderModal(false); setEditingSender(null); }}
              >
                <HiXCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                  value={senderForm.name}
                  onChange={e => setSenderForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="flex">
                  <input
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john"
                    value={senderForm.username}
                    onChange={e => setSenderForm(f => ({ ...f, username: e.target.value }))}
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                    @{selectedDomain?.name}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Full email: {senderForm.username ? `${senderForm.username}@${selectedDomain?.name}` : 'Enter username above'}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={() => { setShowSenderModal(false); setEditingSender(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={editingSender ? handleEditSender : handleAddSender}
              >
                {editingSender ? 'Save Changes' : 'Add Sender'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Sender Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Test Sender</h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => { 
                  setShowTestModal(false); 
                  setTestSender(null); 
                  setTestEmail('');
                }}
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <HiUser className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{testSender?.name}</p>
                  <p className="text-sm text-gray-500">{testSender?.email}</p>
                  <p className="text-xs text-gray-400">Domain: {selectedDomain?.name}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the email address where you want to receive the test email
                </p>
              </div>
              
              {!smtpConfig && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <HiInformationCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-yellow-800">No SMTP Configuration</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This domain doesn't have SMTP configuration. Please add SMTP settings first.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={() => { 
                  setShowTestModal(false); 
                  setTestSender(null); 
                  setTestEmail('');
                }}
                disabled={isTestingSender}
              >
                Cancel
              </button>
              <button
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                  isTestingSender || !testEmail || !testEmail.includes('@') || !smtpConfig
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={handleTestSender}
                disabled={isTestingSender || !testEmail || !testEmail.includes('@') || !smtpConfig}
              >
                {isTestingSender ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <HiPaperAirplane className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Domains; 
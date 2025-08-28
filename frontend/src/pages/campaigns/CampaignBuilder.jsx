import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createCampaign, fetchSenders, fetchDomains, fetchContents } from '../../store/slices/campaignSlice';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHandler';
import {
  HiUpload,
  HiEye,
  HiTrash,
  HiPlus,
  HiSave,
  HiCalendar,
  HiClock,
  HiUserGroup,
  HiMail,
  HiCursorClick,
  HiEyeOff,
  HiX,
  HiShieldCheck,
  HiPaperAirplane,
} from 'react-icons/hi';
import QuillEditor from '../../components/QuillEditor';
import PageSubscriptionOverlay from '../../components/common/PageSubscriptionOverlay';

// Safe array mapping component
const SafeSelect = ({ items = [], renderItem, placeholder = "Select..." }) => {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <>
      <option value="">{placeholder}</option>
      {safeItems.map(renderItem)}
    </>
  );
};

const CampaignBuilder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sendersState = useSelector((state) => state.senders);
  const domainsState = useSelector((state) => state.domains);
  const contentsState = useSelector((state) => state.contents);
  const authState = useSelector((state) => state.auth);
  
  const { senders = [], isLoading: isSendersLoading } = sendersState || {};
  const { domains = [], isLoading: isDomainsLoading } = domainsState || {};
  const { contents = [], isLoading: isContentsLoading } = contentsState || {};
  const { user, currentView } = authState || {};

  // Filter domains and senders based on current view
  const isAdminView = currentView === 'admin';
  const isAdmin = user?.role === 'admin';

  // In user view, only show domains and senders that belong to the current user
  // In admin view, show all domains and senders
  const filteredDomains = isAdmin && isAdminView
    ? domains
    : domains.filter(domain => domain.user_id === user?.id);

  const filteredSenders = isAdmin && isAdminView
    ? senders
    : senders.filter(sender => {
      // Find the domain for this sender
      const senderDomain = domains.find(domain => domain.id === sender.domain_id);
      return senderDomain && senderDomain.user_id === user?.id;
    });

  // Ensure arrays are always defined and are arrays
  const safeSenders = Array.isArray(filteredSenders) ? filteredSenders : [];
  const safeDomains = Array.isArray(filteredDomains) ? filteredDomains : [];
  const safeContents = Array.isArray(contents) ? contents : [];

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email_content: '',
    enable_open_tracking: true,
    enable_click_tracking: true,
    enable_unsubscribe_link: true,
    enable_template_variables: false,
    template_variables: '',
  });

  const [previewMode, setPreviewMode] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [enableContentSwitching, setEnableContentSwitching] = useState(false);
  const [contentVariations, setContentVariations] = useState([
    { subject: '', content: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSenders());
    dispatch(fetchDomains());
    dispatch(fetchContents());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Recipient file uploaded:', file.name, file.size, 'bytes, type:', file.type);
      setSelectedFile(file);
    }
  };

  const handleContentVariationChange = (idx, field, value) => {
    setContentVariations((prev) => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const addContentVariation = () => {
    setContentVariations((prev) => [...prev, { subject: '', content: '' }]);
  };

  const removeContentVariation = (idx) => {
    setContentVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  // Helper function to check if HTML content is actually empty
  const isContentEmpty = (htmlContent) => {
    if (!htmlContent) return true;
    
    const cleanContent = htmlContent
      .replace(/<p><br><\/p>/g, '')
      .replace(/<p><\/p>/g, '')
      .replace(/<br>/g, '')
      .replace(/&nbsp;/g, '')
      .trim();
    
    return cleanContent === '';
  };

  const validateForm = () => {
    // Check basic required fields
    if (!formData.name.trim()) {
      toast.error('Please enter a campaign name');
      return false;
    }

    if (!selectedFile) {
      toast.error('Please upload a recipient file');
      return false;
    }

    // Check content based on mode
    if (enableContentSwitching) {
      // Validate content variations
      if (contentVariations.length === 0) {
        toast.error('Please add at least one content variation');
        return false;
      }

      for (let i = 0; i < contentVariations.length; i++) {
        const variation = contentVariations[i];
        if (!variation.subject.trim()) {
          toast.error(`Please enter a subject for variation ${i + 1}`);
          return false;
        }
        if (isContentEmpty(variation.content)) {
          toast.error(`Please enter content for variation ${i + 1}`);
          return false;
        }
      }
    } else {
      // Single content mode
      if (!formData.subject.trim()) {
        toast.error('Please enter a subject line');
        return false;
      }
      if (isContentEmpty(formData.email_content)) {
        toast.error('Please enter email content');
        return false;
      }
    }

    return true;
  };

  const buildCampaignFormData = () => {
    const campaignData = new FormData();
    
    // Add basic form data
    campaignData.append('name', formData.name.trim());
    campaignData.append('sender_id', formData.sender_id);
    campaignData.append('type', formData.type);
    campaignData.append('schedule_type', formData.schedule_type);
    
    if (formData.schedule_type === 'scheduled' && formData.scheduled_at) {
      campaignData.append('scheduled_at', formData.scheduled_at);
    }
    
    // Add recipient file
    if (selectedFile && selectedFile instanceof File) {
      campaignData.append('recipient_file', selectedFile);
      console.log('✓ Added recipient file:', selectedFile.name, selectedFile.type, selectedFile.size, 'bytes');
    }
    
    // Add attachments
    if (selectedAttachments?.length > 0) {
      selectedAttachments.forEach((file, index) => {
        campaignData.append(`attachments[${index}]`, file);
      });
    }
    
    // Add content variations if enabled
    if (enableContentSwitching) {
      campaignData.append('content_variations', JSON.stringify(contentVariations));
    }

    return campaignData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const campaignData = buildCampaignFormData();
      
      // Log FormData for debugging
      console.log('=== CAMPAIGN SUBMISSION ===');
      for (let [key, value] of campaignData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      // Submit campaign
      const response = await api.post('/campaigns', campaignData);
      console.log('✅ Campaign created successfully:', response);
      
      toast.success('Campaign created successfully!');
      navigate('/campaigns');
      
    } catch (error) {
      console.error('❌ Campaign creation failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors || 
                          error.message || 
                          'Failed to create campaign';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildDraftFormData = () => {
    const campaignData = new FormData();

    // Add basic form fields for draft
    campaignData.append('name', formData.name.trim());
    campaignData.append('status', 'DRAFT');
    campaignData.append('enable_open_tracking', formData.enable_open_tracking ? '1' : '0');
    campaignData.append('enable_click_tracking', formData.enable_click_tracking ? '1' : '0');
    campaignData.append('enable_unsubscribe_link', formData.enable_unsubscribe_link ? '1' : '0');
    campaignData.append('enable_template_variables', formData.enable_template_variables ? '1' : '0');
    campaignData.append('enable_content_switching', enableContentSwitching ? '1' : '0');

    if (formData.template_variables) {
      campaignData.append('template_variables', formData.template_variables);
    }

    // Add recipient file if selected
    if (selectedFile && selectedFile instanceof File) {
      campaignData.append('recipient_file', selectedFile);
    }
    
    // Add attachments if selected
    if (selectedAttachments?.length > 0) {
      selectedAttachments.forEach((file, index) => {
        if (file instanceof File) {
          campaignData.append('attachments[]', file);
        }
      });
    }

    // Add content data
    if (enableContentSwitching) {
      campaignData.append('content_variations', JSON.stringify(contentVariations));
    } else {
      campaignData.append('subject', formData.subject.trim());
      campaignData.append('content', formData.email_content);
    }

    return campaignData;
  };

  const handleSaveDraft = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a campaign name to save as draft');
      return;
    }

    setIsSubmitting(true);

    try {
      const campaignData = buildDraftFormData();
      const result = await dispatch(createCampaign(campaignData)).unwrap();
      
      toast.success('Draft saved successfully');
      navigate(`/campaigns/${result.data?.id || result.id}`);
    } catch (error) {
      console.error('Draft save error:', error);
      toast.error(getErrorMessage(error) || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      recipient_file: null,
    }));
  };

  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      console.log('Attachments uploaded:', files, files.map(f => f instanceof File));
      console.log('File details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      // Only update selectedAttachments state - don't store File objects in formData
      setSelectedAttachments(prev => {
        const newAttachments = [...prev, ...files];
        console.log('Updated selectedAttachments:', newAttachments, newAttachments.map(f => f instanceof File));
        return newAttachments;
      });
      
      // Don't store File objects in formData as they can't be serialized properly
      // We'll use selectedAttachments for the actual File objects
    }
    // Clear the input value to allow re-selecting the same file
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
    // No need to update formData.attachments since we're not storing File objects there
  };

  return (
    <>
      <PageSubscriptionOverlay 
        feature="advanced campaign builder"
        customMessage="Upgrade to Pro to unlock the advanced campaign builder with custom templates, A/B testing, automation, and premium sending features."
      />
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
              {isAdmin && (
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${isAdminView
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                  }`}>
                  {isAdminView ? 'Admin View' : 'User View'}
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">Build and configure your email campaign</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-secondary flex items-center"
            >
              <HiSave className="h-5 w-5 mr-2" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="btn btn-secondary flex items-center"
            >
              {previewMode ? (
                <>
                  <HiEyeOff className="h-5 w-5 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <HiEye className="h-5 w-5 mr-2" />
                  Preview
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <HiPaperAirplane className="h-5 w-5 mr-2" />
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={enableContentSwitching}
            onChange={e => setEnableContentSwitching(e.target.checked)}
            className="form-checkbox"
          />
          <span>Enable Content Switching (A/B test multiple email contents)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="form-label">Campaign Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter campaign name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sender Configuration Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sender Configuration</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <HiShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Automatic Sender Management</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    All your active senders will be automatically used for this campaign.
                    The system will rotate between them to optimize delivery, maintain reputation, and avoid rate limits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Template Variables */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Template Variables</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enable_template_variables"
                  checked={formData.enable_template_variables}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-900">Enable template variables</label>
              </div>
              {formData.enable_template_variables && (
                <div>
                  <label className="form-label">Template Variables (JSON format)</label>
                  <textarea
                    name="template_variables"
                    value={formData.template_variables}
                    onChange={handleInputChange}
                    className="input"
                    rows="4"
                    placeholder='{"firstname": "John", "lastname": "Doe", "custom_field": "value"}'
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Use JSON format to define template variables. These will be replaced in your email content.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content</h3>
            {enableContentSwitching ? (
              <div className="space-y-6">
                {contentVariations.map((variation, idx) => (
                  <div key={idx} className="border rounded p-4 mb-2 relative">
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-500"
                      onClick={() => removeContentVariation(idx)}
                      disabled={contentVariations.length === 1}
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                    <label className="form-label">Subject *</label>
                    <input
                      type="text"
                      className="input mb-2"
                      value={variation.subject}
                      onChange={e => handleContentVariationChange(idx, 'subject', e.target.value)}
                      placeholder="Enter subject"
                      required
                    />
                    <label className="form-label">Email Content *</label>
                    <QuillEditor
                      key={`variation-${idx}`}
                      value={variation.content}
                      onChange={data => handleContentVariationChange(idx, 'content', data.html)}
                      placeholder="Enter your email content here. You can use HTML tags for formatting."
                      className="block w-full"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary mt-2"
                  onClick={addContentVariation}
                >
                  <HiPlus className="h-4 w-4 mr-1" /> Add Variation
                </button>
              </div>
            ) : (
              <div>
                <label className="form-label">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="input mb-2"
                  placeholder="Enter subject"
                  required
                />
                <label className="form-label">Email Content *</label>
                <QuillEditor
                  key="single-content"
                  value={formData.email_content}
                  onChange={data => handleInputChange({ target: { name: 'email_content', value: data.html } })}
                  placeholder="Enter your email content here. You can use HTML tags for formatting."
                  className="block w-full"
                />
              </div>
            )}
          </div>

          {/* Recipient Upload */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recipient List *</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <HiUpload className="h-8 w-8 text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={removeFile}
                        className="btn btn-danger btn-sm flex items-center"
                      >
                        <HiTrash className="h-4 w-4 mr-1" />
                        Remove
                      </button>

                    </div>
                  </div>
                ) : (
                  <div>
                    <HiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="btn btn-primary cursor-pointer">
                        <HiUpload className="h-5 w-5 mr-2" />
                        Upload File
                      </label>
                      <input
                        id="file-upload"
                        name="recipient_file"
                        type="file"
                        accept=".txt,.csv,.xls,.xlsx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Supported formats: TXT, CSV, XLS, XLSX
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Attachments */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">File Attachments</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <HiUpload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="attachment-upload" className="btn btn-secondary cursor-pointer">
                    <HiUpload className="h-4 w-4 mr-2" />
                    Add Attachments
                  </label>
                  <input
                    id="attachment-upload"
                    name="attachments"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF, ZIP
                </p>
              </div>
            </div>
            
            {selectedAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-medium text-gray-700">Selected Files:</h4>
                {selectedAttachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <HiUpload className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tracking Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Options</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enable_open_tracking"
                  checked={formData.enable_open_tracking}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-900">Track email opens</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enable_click_tracking"
                  checked={formData.enable_click_tracking}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-900">Track link clicks</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enable_unsubscribe_link"
                  checked={formData.enable_unsubscribe_link}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-900">Include unsubscribe link</label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Campaign Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Campaign Name</span>
                <span className="text-sm font-medium text-gray-900">{formData.name || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Subject Line</span>
                <span className="text-sm font-medium text-gray-900">
                  {enableContentSwitching
                    ? (contentVariations.length > 0 ? `${contentVariations.length} variations` : 'Not set')
                    : (formData.subject || 'Not set')
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Recipients</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedFile ? 'File uploaded' : 'No file'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Content Switching</span>
                <span className="text-sm font-medium text-gray-900">
                  {enableContentSwitching ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSendersLoading || isDomainsLoading || isContentsLoading || isSubmitting}
                className="btn btn-secondary w-full flex items-center justify-center"
              >
                {isSendersLoading || isDomainsLoading || isContentsLoading || isSubmitting ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  <>
                    <HiSave className="h-5 w-5 mr-2" />
                    Save as Draft
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use HTML tags for rich formatting</li>
              <li>• Template variables are automatically replaced</li>
              <li>• Supported file formats: TXT, CSV, XLS, XLSX</li>
              <li>• Tracking helps measure campaign performance</li>
              <li>• All active senders will be used for sender switching.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Email Preview</h3>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">From:</span>
                  <div className="text-sm text-gray-900">
                    Will use active senders automatically
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Subject:</span>
                  <div className="text-sm text-gray-900">{formData.subject || 'Not set'}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Content:</span>
                  <div className="mt-2 p-4 border border-gray-200 rounded-lg">
                    <div dangerouslySetInnerHTML={{ __html: formData.email_content || 'No content' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </form>
    </>
  );
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default CampaignBuilder;
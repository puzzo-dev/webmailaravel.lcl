import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createCampaign, startCampaign, fetchSenders, fetchDomains, fetchContents } from '../../store/slices/campaignSlice';
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

  // Extract loading states for UI feedback
  const { isLoading: isSendersLoading } = sendersState || {};
  const { isLoading: isDomainsLoading } = domainsState || {};
  const { isLoading: isContentsLoading } = contentsState || {};
  const { user, currentView } = authState || {};

  // Filter domains and senders based on current view
  const isAdminView = currentView === 'admin';
  const isAdmin = user?.role === 'admin';

  // Note: Sender and domain filtering logic is available but currently using automatic sender management
  // All active senders will be automatically used for the campaign

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
  const [startImmediately, setStartImmediately] = useState(false);

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

    console.log('🔍 Building campaign FormData...');
    console.log('selectedFile:', selectedFile, selectedFile instanceof File);
    console.log('selectedAttachments:', selectedAttachments, selectedAttachments.map(f => f instanceof File));

    // Add basic form data
    campaignData.append('name', formData.name.trim());

    // Add subject and content
    if (!enableContentSwitching) {
      campaignData.append('subject', formData.subject || '');
      campaignData.append('content', formData.email_content || '');
    }

    // Add tracking options
    campaignData.append('enable_open_tracking', formData.enable_open_tracking ? '1' : '0');
    campaignData.append('enable_click_tracking', formData.enable_click_tracking ? '1' : '0');
    campaignData.append('enable_unsubscribe_link', formData.enable_unsubscribe_link ? '1' : '0');

    // Add template variables if enabled
    if (formData.enable_template_variables && formData.template_variables) {
      campaignData.append('enable_template_variables', '1');
      campaignData.append('template_variables', formData.template_variables);
    }

    // Add recipient file
    if (selectedFile && selectedFile instanceof File) {
      campaignData.append('recipient_file', selectedFile);
      console.log('✓ Added recipient file:', selectedFile.name, selectedFile.type, selectedFile.size, 'bytes');
    } else {
      console.log('❌ No valid recipient file:', selectedFile);
    }

    // Add attachments
    if (selectedAttachments?.length > 0) {
      selectedAttachments.forEach((file, index) => {
        if (file instanceof File) {
          campaignData.append(`attachments[]`, file);
          console.log(`✓ Added attachment ${index}:`, file.name, file.type, file.size, 'bytes');
        } else {
          console.log(`❌ Invalid attachment ${index}:`, file);
        }
      });
    }

    // Add content variations if enabled
    if (enableContentSwitching) {
      campaignData.append('enable_content_switching', '1');
      campaignData.append('content_variations', JSON.stringify(contentVariations));
    }

    console.log('📤 FormData built with entries:', [...campaignData.entries()]);
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
      console.log('FormData instance:', campaignData);
      console.log('FormData constructor:', campaignData.constructor.name);
      console.log('Is FormData:', campaignData instanceof FormData);

      for (let [key, value] of campaignData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value} (${typeof value})`);
        }
      }

      // Submit campaign
      const result = await dispatch(createCampaign(campaignData)).unwrap();
      console.log('✅ Campaign created successfully:', result);

      // Start campaign immediately if requested
      if (startImmediately) {
        try {
          const campaignId = result.data?.id || result.id;
          await dispatch(startCampaign(campaignId)).unwrap();
          toast.success('Campaign created and started successfully!');
        } catch (startError) {
          console.error('❌ Failed to start campaign:', startError);
          toast.error('Campaign created but failed to start. You can start it manually from the campaigns page.');
        }
      } else {
        toast.success('Campaign created successfully!');
      }

      navigate('/campaigns');

    } catch (error) {
      console.error('❌ Campaign creation failed:', error);

      // Use the error handler utility for better error messages
      const errorMessage = getErrorMessage(error);

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildDraftFormData = () => {
    const campaignData = new FormData();

    // Add basic form fields for draft
    campaignData.append('name', formData.name.trim());
    campaignData.append('status', 'draft');
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
      selectedAttachments.forEach((file) => {
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
        <div className="p-6 bg-white rounded-lg shadow-sm">
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
              <p className="mt-1 text-gray-600">Build and configure your email campaign</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="startImmediately"
                  checked={startImmediately}
                  onChange={(e) => setStartImmediately(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="startImmediately" className="ml-2 text-sm text-gray-700">
                  Start campaign immediately after creation
                </label>
              </div>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center btn btn-secondary"
              >
                <HiSave className="w-5 h-5 mr-2" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center btn btn-secondary"
              >
                {previewMode ? (
                  <>
                    <HiEyeOff className="w-5 h-5 mr-2" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <HiEye className="w-5 h-5 mr-2" />
                    Preview
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <HiPaperAirplane className="w-5 h-5 mr-2" />
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Campaign Information</h3>
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
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Sender Configuration</h3>
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-start">
                  <HiShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Automatic Sender Management</h4>
                    <p className="mt-1 text-sm text-blue-700">
                      All your active senders will be automatically used for this campaign.
                      The system will rotate between them to optimize delivery, maintain reputation, and avoid rate limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Variables */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Template Variables</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_template_variables"
                    checked={formData.enable_template_variables}
                    onChange={handleInputChange}
                    className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
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
                    <p className="mt-2 text-sm text-gray-500">
                      Use JSON format to define template variables. These will be replaced in your email content.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Selection */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Content</h3>
              {enableContentSwitching ? (
                <div className="space-y-6">
                  {contentVariations.map((variation, idx) => (
                    <div key={idx} className="relative p-4 mb-2 border rounded">
                      <button
                        type="button"
                        className="absolute text-red-500 top-2 right-2"
                        onClick={() => removeContentVariation(idx)}
                        disabled={contentVariations.length === 1}
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                      <label className="form-label">Subject *</label>
                      <input
                        type="text"
                        className="mb-2 input"
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
                    className="mt-2 btn btn-secondary"
                    onClick={addContentVariation}
                  >
                    <HiPlus className="w-4 h-4 mr-1" /> Add Variation
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
                    className="mb-2 input"
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
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Recipient List *</h3>
              <div className="space-y-4">
                <div className="p-6 text-center border-2 border-gray-300 border-dashed rounded-lg">
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <HiUpload className="w-8 h-8 text-success-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={removeFile}
                          className="flex items-center btn btn-danger btn-sm"
                        >
                          <HiTrash className="w-4 h-4 mr-1" />
                          Remove
                        </button>

                      </div>
                    </div>
                  ) : (
                    <div>
                      <HiUpload className="w-12 h-12 mx-auto text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer btn btn-primary">
                          <HiUpload className="w-5 h-5 mr-2" />
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
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">File Attachments</h3>
              <div className="p-4 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="text-center">
                  <HiUpload className="w-8 h-8 mx-auto text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="attachment-upload" className="cursor-pointer btn btn-secondary">
                      <HiUpload className="w-4 h-4 mr-2" />
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
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <HiUpload className="w-4 h-4 text-gray-400" />
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
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tracking Options */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Tracking Options</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_open_tracking"
                    checked={formData.enable_open_tracking}
                    onChange={handleInputChange}
                    className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">Track email opens</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_click_tracking"
                    checked={formData.enable_click_tracking}
                    onChange={handleInputChange}
                    className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">Track link clicks</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_unsubscribe_link"
                    checked={formData.enable_unsubscribe_link}
                    onChange={handleInputChange}
                    className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">Include unsubscribe link</label>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Summary */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Campaign Summary</h3>
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
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Actions</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSendersLoading || isDomainsLoading || isContentsLoading || isSubmitting}
                  className="flex items-center justify-center w-full btn btn-secondary"
                >
                  {isSendersLoading || isDomainsLoading || isContentsLoading || isSubmitting ? (
                    <div className="w-4 h-4 loading-spinner"></div>
                  ) : (
                    <>
                      <HiSave className="w-5 h-5 mr-2" />
                      Save as Draft
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="p-4 rounded-lg bg-blue-50">
              <h4 className="mb-2 text-sm font-medium text-blue-900">Need Help?</h4>
              <ul className="space-y-1 text-sm text-blue-700">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl max-h-screen mx-4 overflow-y-auto bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Email Preview</h3>
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <HiX className="w-6 h-6" />
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
                    <div className="p-4 mt-2 border border-gray-200 rounded-lg">
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

export default CampaignBuilder;
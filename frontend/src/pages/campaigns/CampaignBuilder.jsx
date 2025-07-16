import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createCampaign, fetchSenders, fetchDomains, fetchContents } from '../../store/slices/campaignSlice';
import toast from 'react-hot-toast';
import {
  HiUpload,
  HiEye,
  HiTrash,
  HiPlus,
  HiSave,
  HiPlay,
  HiCalendar,
  HiClock,
  HiUserGroup,
  HiMail,
  HiCursorClick,
  HiEyeOff,
  HiX,
  HiShieldCheck,
} from 'react-icons/hi';
import QuillEditor from '../../components/QuillEditor';

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
  const { isLoading, senders, domains, contents } = useSelector((state) => state.campaigns);

  // Ensure arrays are always defined and are arrays
  const safeSenders = Array.isArray(senders) ? senders : [];
  const safeDomains = Array.isArray(domains) ? domains : [];
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
    recipient_file: null,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [enableContentSwitching, setEnableContentSwitching] = useState(false);
  const [contentVariations, setContentVariations] = useState([
    { subject: '', content: '' }
  ]);

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
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        recipient_file: file,
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || (!enableContentSwitching && !formData.email_content)) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedFile) {
      toast.error('Please upload a recipient file');
      return;
    }

    try {
      const campaignData = new FormData();
      
      // Add basic form fields
      campaignData.append('name', formData.name);
      campaignData.append('subject', formData.subject);
      campaignData.append('enable_open_tracking', formData.enable_open_tracking);
      campaignData.append('enable_click_tracking', formData.enable_click_tracking);
      campaignData.append('enable_unsubscribe_link', formData.enable_unsubscribe_link);
      campaignData.append('enable_template_variables', formData.enable_template_variables);
      
      if (formData.template_variables) {
        campaignData.append('template_variables', formData.template_variables);
      }

      // Add file
      if (selectedFile) {
        campaignData.append('recipient_file', selectedFile);
      }

      // Add content switching data
      campaignData.append('enable_content_switching', enableContentSwitching);
      if (enableContentSwitching) {
        campaignData.append('content_variations', JSON.stringify(contentVariations));
      } else {
        // Single content mode
        campaignData.append('content', formData.email_content);
      }

      const result = await dispatch(createCampaign(campaignData)).unwrap();
      toast.success('Campaign created successfully');
      navigate(`/campaigns/${result.data?.id || result.id}`);
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error(error || 'Failed to create campaign');
    }
  };

  const handleSaveDraft = () => {
    // Save as draft logic
    toast.success('Draft saved successfully');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
            <p className="text-gray-600 mt-1">Build and configure your email campaign</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveDraft}
              className="btn btn-secondary flex items-center"
            >
              <HiSave className="h-5 w-5 mr-2" />
              Save Draft
            </button>
            <button
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
              <div>
                <label className="form-label">Subject Line *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter email subject"
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
                <span className="text-sm font-medium text-gray-900">{formData.subject || 'Not set'}</span>
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
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  <>
                    <HiPlay className="h-5 w-5 mr-2" />
                    Create Campaign
                  </>
                )}
              </button>
              <button
                onClick={handleSaveDraft}
                className="btn btn-secondary w-full flex items-center justify-center"
              >
                <HiSave className="h-5 w-5 mr-2" />
                Save as Draft
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
    </div>
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
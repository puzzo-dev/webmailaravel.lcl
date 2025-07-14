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
} from 'react-icons/hi';
import QuillEditor from '../../components/QuillEditor';

const CampaignBuilder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, senders, domains, contents } = useSelector((state) => state.campaigns);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_name: '',
    from_email: '',
    reply_to: '',
    email_content: '',
    scheduled_at: '',
    enable_tracking: true,
    enable_open_tracking: true,
    enable_click_tracking: true,
    enable_unsubscribe: true,
    recipient_file: null,
    sender_id: '',
    domain_id: '',
    content_id: '',
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject || !formData.email_content) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedFile) {
      toast.error('Please upload a recipient file');
      return;
    }

    try {
      const campaignData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'recipient_file') {
          campaignData.append(key, formData[key]);
        }
      });

      // Add file
      if (selectedFile) {
        campaignData.append('recipient_file', selectedFile);
      }

      const result = await dispatch(createCampaign(campaignData)).unwrap();
      toast.success('Campaign created successfully');
      navigate(`/campaigns/${result.id}`);
    } catch (error) {
      toast.error('Failed to create campaign');
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="form-label">From Name</label>
                <input
                  type="text"
                  name="from_name"
                  value={formData.from_name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter sender name"
                />
              </div>
              <div>
                <label className="form-label">From Email</label>
                <input
                  type="email"
                  name="from_email"
                  value={formData.from_email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter sender email"
                />
              </div>
              <div>
                <label className="form-label">Reply To</label>
                <input
                  type="email"
                  name="reply_to"
                  value={formData.reply_to}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter reply-to email"
                />
              </div>
              <div>
                <label className="form-label">Scheduled Date</label>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Sender Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sender Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Sender</label>
                <select
                  name="sender_id"
                  value={formData.sender_id}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select a sender</option>
                  {senders.map(sender => (
                    <option key={sender.id} value={sender.id}>
                      {sender.name} ({sender.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Domain</label>
                <select
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select a domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content</h3>
            <div>
              <label className="form-label">Select Content</label>
              <select
                name="content_id"
                value={formData.content_id}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select content</option>
                {contents.map(content => (
                  <option key={content.id} value={content.id}>
                    {content.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Content *</h3>
            <div>
              <QuillEditor
                value={formData.email_content}
                onChange={(data) => handleInputChange({ target: { name: 'email_content', value: data.html } })}
                placeholder="Enter your email content here. You can use HTML tags for formatting."
                className="block w-full"
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Available template variables: {'{username}', '{email}', '{firstname}', '{lastname}', '{unsubscribelink}'}
            </div>
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
                  name="enable_tracking"
                  checked={formData.enable_tracking}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-900">Enable tracking</label>
              </div>
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
                  name="enable_unsubscribe"
                  checked={formData.enable_unsubscribe}
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
                <span className="text-sm text-gray-500">Scheduled</span>
                <span className="text-sm font-medium text-gray-900">
                  {formData.scheduled_at ? formatDate(formData.scheduled_at) : 'Not scheduled'}
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
                    {formData.from_name || 'Not set'} &lt;{formData.from_email || 'Not set'}&gt;
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
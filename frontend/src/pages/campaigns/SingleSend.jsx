import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHandler';
import { 
  HiMail, 
  HiPaperAirplane, 
  HiEye,
  HiUsers,
  HiCog,
  HiInformationCircle,
  HiUpload,
  HiTrash
} from 'react-icons/hi';
import { campaignService, senderService } from '../../services/api';

const SingleSend = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [senders, setSenders] = useState([]);
  const [formData, setFormData] = useState({
    to: '',
    bcc: '',
    sender_id: '',
    subject: '',
    content: '',
    enable_open_tracking: true,
    enable_click_tracking: true,
    enable_unsubscribe_link: true,
    attachments: [],
  });
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSenders();
  }, []);

  const loadSenders = async () => {
    try {
      const response = await senderService.getSenders();
      setSenders(response.data || []);
    } catch (error) {
      console.error('Failed to load senders:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.to || !formData.sender_id || !formData.subject || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      
      // Add basic form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'attachments') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add attachments
      selectedAttachments.forEach((file, index) => {
        submitData.append(`attachments[${index}]`, file);
      });

      const response = await campaignService.sendSingle(submitData);
      toast.success(response.message || 'Email sent successfully!');
      navigate('/campaigns');
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedAttachments(prev => [...prev, ...files]);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
      }));
    }
  };

  const removeAttachment = (index) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const getPreviewHtml = () => {
    return formData.content;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HiMail className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Send Single Email</h1>
              </div>
              <button
                onClick={() => navigate('/campaigns')}
                className="text-gray-500 hover:text-gray-700"
              >
                Back to Campaigns
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Email Details</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Recipients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="to"
                      value={formData.to}
                      onChange={handleInputChange}
                      placeholder="recipient@example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BCC (optional)
                    </label>
                    <input
                      type="text"
                      name="bcc"
                      value={formData.bcc}
                      onChange={handleInputChange}
                      placeholder="email1@example.com, email2@example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                  </div>
                </div>

                {/* Sender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From (Sender) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sender_id"
                    value={formData.sender_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a sender...</option>
                    {senders.map(sender => (
                      <option key={sender.id} value={sender.id}>
                        {sender.name} &lt;{sender.email}&gt;
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Email subject"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Email content (HTML supported)"
                    rows={12}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">HTML formatting is supported</p>
                </div>

                {/* File Attachments */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">File Attachments</h3>
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
                        PDF, DOC, XLS, PPT, Images, ZIP (Max 10MB each)
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
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Tracking Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="enable_open_tracking"
                        checked={formData.enable_open_tracking}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable open tracking</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="enable_click_tracking"
                        checked={formData.enable_click_tracking}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable click tracking</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="enable_unsubscribe_link"
                        checked={formData.enable_unsubscribe_link}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include unsubscribe link</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="btn btn-secondary flex items-center"
                  >
                    <HiEye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide Preview' : 'Preview'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center"
                  >
                    <HiPaperAirplane className="h-4 w-4 mr-2" />
                    {loading ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <HiInformationCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Single Send Features</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Full tracking integration</li>
                    <li>• Automatic bounce processing</li>
                    <li>• Suppression list checking</li>
                    <li>• Analytics tracking</li>
                    <li>• Unsubscribe protection</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && formData.content && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Email Preview</h3>
                </div>
                <div className="p-4">
                  <div className="border border-gray-200 rounded p-3 bg-gray-50 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSend;

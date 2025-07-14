import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiDuplicate,
  HiDownload,
  HiUpload,
  HiDocumentText,
  HiTemplate,
  HiCode,
  HiVariable,
  HiCheck,
  HiX,
  HiStar,
  HiSearch,
  HiFilter,
} from 'react-icons/hi';
import QuillEditor from '../../components/QuillEditor';

const Templates = () => {
  const dispatch = useDispatch();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API calls
  const mockTemplates = [
    {
      id: 1,
      name: 'Welcome Email',
      description: 'Welcome email for new subscribers',
      category: 'onboarding',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome {{firstname}}!</h1>
          <p>Thank you for subscribing to our newsletter.</p>
          <p>We're excited to have you on board!</p>
          <a href="{{unsubscribelink}}" style="color: #666; text-decoration: none;">Unsubscribe</a>
        </div>
      `,
      variables: ['firstname', 'email', 'unsubscribelink'],
      is_favorite: true,
      created_at: '2024-01-15T10:30:45Z',
      updated_at: '2024-01-15T10:30:45Z',
    },
    {
      id: 2,
      name: 'Newsletter Template',
      description: 'Standard newsletter template',
      category: 'newsletter',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">{{subject}}</h1>
          <p>{{content}}</p>
          <p>Best regards,<br>{{company_name}}</p>
          <a href="{{unsubscribelink}}" style="color: #666; text-decoration: none;">Unsubscribe</a>
        </div>
      `,
      variables: ['subject', 'content', 'company_name', 'unsubscribelink'],
      is_favorite: false,
      created_at: '2024-01-14T15:20:30Z',
      updated_at: '2024-01-14T15:20:30Z',
    },
    {
      id: 3,
      name: 'Promotional Email',
      description: 'Promotional email template with CTA',
      category: 'promotional',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">{{promo_title}}</h1>
          <p>{{promo_description}}</p>
          <a href="{{cta_link}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">{{cta_text}}</a>
          <p>Offer valid until {{expiry_date}}</p>
          <a href="{{unsubscribelink}}" style="color: #666; text-decoration: none;">Unsubscribe</a>
        </div>
      `,
      variables: ['promo_title', 'promo_description', 'cta_link', 'cta_text', 'expiry_date', 'unsubscribelink'],
      is_favorite: true,
      created_at: '2024-01-13T09:15:20Z',
      updated_at: '2024-01-13T09:15:20Z',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Templates', count: mockTemplates.length },
    { id: 'onboarding', name: 'Onboarding', count: mockTemplates.filter(t => t.category === 'onboarding').length },
    { id: 'newsletter', name: 'Newsletter', count: mockTemplates.filter(t => t.category === 'newsletter').length },
    { id: 'promotional', name: 'Promotional', count: mockTemplates.filter(t => t.category === 'promotional').length },
  ];

  const standardVariables = [
    { name: 'firstname', description: 'Recipient first name' },
    { name: 'lastname', description: 'Recipient last name' },
    { name: 'email', description: 'Recipient email address' },
    { name: 'username', description: 'Recipient username' },
    { name: 'unsubscribelink', description: 'Unsubscribe link' },
    { name: 'company_name', description: 'Your company name' },
    { name: 'subject', description: 'Email subject line' },
    { name: 'content', description: 'Main email content' },
  ];

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'newsletter',
    content: '',
    variables: [],
  });

  useEffect(() => {
    setTemplates(mockTemplates);
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) return;
    
    setIsLoading(true);
    try {
      // Implement create template API call
      console.log('Creating template:', newTemplate);
      setShowCreateModal(false);
      setNewTemplate({ name: '', description: '', category: 'newsletter', content: '', variables: [] });
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !selectedTemplate.name.trim()) return;
    
    setIsLoading(true);
    try {
      // Implement update template API call
      console.log('Updating template:', selectedTemplate);
      setShowEditModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      // Implement delete template API call
      console.log('Deleting template:', templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateTemplate = async (template) => {
    setIsLoading(true);
    try {
      // Implement duplicate template API call
      console.log('Duplicating template:', template);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTemplate = async (template) => {
    setIsLoading(true);
    try {
      // Implement export template API call
      console.log('Exporting template:', template);
    } catch (error) {
      console.error('Failed to export template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractVariables = (content) => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const handleContentChange = (content) => {
    const variables = extractVariables(content);
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        content,
        variables,
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        content,
        variables,
      });
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case 'onboarding':
        return 'bg-blue-100 text-blue-800';
      case 'newsletter':
        return 'bg-green-100 text-green-800';
      case 'promotional':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-1">Create and manage email templates with dynamic variables</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <HiPlus className="h-5 w-5 mr-2" />
            Create Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Templates
            </label>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="btn btn-secondary w-full"
            >
              <HiFilter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <HiTemplate className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  {template.is_favorite && (
                    <HiStar className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreviewModal(true);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Preview"
                  >
                    <HiEye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="text-gray-400 hover:text-blue-600"
                    title="Duplicate"
                  >
                    <HiDuplicate className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExportTemplate(template)}
                    className="text-gray-400 hover:text-green-600"
                    title="Export"
                  >
                    <HiDownload className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
                <span className="text-xs text-gray-500">
                  {template.variables.length} variables
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowEditModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Template</h3>
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
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Enter template name..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="newsletter">Newsletter</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="promotional">Promotional</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Enter template description..."
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTML Content
                  </label>
                  <QuillEditor
                    value={newTemplate.content}
                    onChange={(data) => handleContentChange(data.html)}
                    placeholder="Enter HTML content with variables like {{firstname}}..."
                    className="block w-full"
                  />
                </div>
                {newTemplate.variables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detected Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {newTemplate.variables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <HiVariable className="h-3 w-3 mr-1" />
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    disabled={isLoading || !newTemplate.name.trim() || !newTemplate.content.trim()}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Creating...' : 'Create Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Template: {selectedTemplate.name}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedTemplate.category}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, category: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="newsletter">Newsletter</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="promotional">Promotional</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedTemplate.description}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTML Content
                  </label>
                  <QuillEditor
                    value={selectedTemplate.content}
                    onChange={(data) => handleContentChange(data.html)}
                    className="block w-full"
                  />
                </div>
                {selectedTemplate.variables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detected Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <HiVariable className="h-3 w-3 mr-1" />
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTemplate}
                    disabled={isLoading || !selectedTemplate.name.trim() || !selectedTemplate.content.trim()}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Updating...' : 'Update Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Template Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Preview Template: {selectedTemplate.name}</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Variables
                  </label>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{variable}</span>
                          <input
                            type="text"
                            placeholder={`Enter value for ${variable}`}
                            className="flex-1 ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedTemplate.content.replace(/\{\{([^}]+)\}\}/g, '<span class="bg-yellow-200 px-1 rounded">$1</span>'),
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowPreviewModal(false)}
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

export default Templates; 
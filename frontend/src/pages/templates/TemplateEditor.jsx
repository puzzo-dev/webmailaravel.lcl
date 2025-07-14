import React from 'react';
import { useParams } from 'react-router-dom';

const TemplateEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Template' : 'Create Template'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update your email template' : 'Design a new email template'}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Template Editor</h2>
        <p className="text-gray-600">Template editor coming soon...</p>
      </div>
    </div>
  );
};

export default TemplateEditor; 
import React, { useState, useRef, useCallback } from 'react';
import { HiUpload, HiX, HiCheck, HiExclamation, HiDocument, HiTable, HiDocumentText } from 'react-icons/hi';

const FileUpload = ({
  onFileUpload,
  acceptedTypes = ['txt', 'csv', 'xls', 'xlsx'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  label = 'Upload Files',
  description = 'Drag and drop files here or click to browse',
  className = '',
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'csv':
        return <HiTable className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <HiDocument className="h-6 w-6 text-green-500" />;
      case 'txt':
        return <HiDocumentText className="h-6 w-6 text-gray-500" />;
      default:
        return <HiDocument className="h-6 w-6 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const errors = [];
    
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      errors.push(`${file.name} has an unsupported file type. Accepted types: ${acceptedTypes.join(', ')}`);
    }
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`${file.name} is too large. Maximum size: ${formatFileSize(maxSize)}`);
    }
    
    return errors;
  };

  const processFiles = useCallback(async (files) => {
    const newErrors = [];
    const validFiles = [];
    
    Array.from(files).forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    setErrors([]);
    
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        // Simulate upload progress
        const uploadResult = await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
              status: 'completed',
            });
          }, 1000 + Math.random() * 2000);
        });
        
        return uploadResult;
      });
      
      const results = await Promise.all(uploadPromises);
      
      if (multiple) {
        setUploadedFiles(prev => [...prev, ...results]);
      } else {
        setUploadedFiles(results);
      }
      
      if (onFileUpload) {
        onFileUpload(multiple ? [...uploadedFiles, ...results] : results);
      }
      
    } catch (error) {
      setErrors([`Upload failed: ${error.message}`]);
    } finally {
      setUploading(false);
    }
  }, [acceptedTypes, maxSize, multiple, onFileUpload, uploadedFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleRemoveFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    if (onFileUpload) {
      const remainingFiles = uploadedFiles.filter(file => file.id !== fileId);
      onFileUpload(remainingFiles);
    }
  }, [onFileUpload, uploadedFiles]);

  const handleClearAll = useCallback(() => {
    setUploadedFiles([]);
    setErrors([]);
    if (onFileUpload) {
      onFileUpload([]);
    }
  }, [onFileUpload]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="text-center">
          <HiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{label}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          <p className="mt-1 text-xs text-gray-400">
            Accepted formats: {acceptedTypes.join(', ').toUpperCase()} (Max: {formatFileSize(maxSize)})
          </p>
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamation className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name.split('.').pop())}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.status === 'completed' && (
                    <HiCheck className="h-5 w-5 text-green-500" />
                  )}
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <HiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 
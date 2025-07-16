import React, { useState, useEffect, useRef } from 'react';
import {
  HiCheck,
  HiX,
  HiExclamation,
  HiInformationCircle,
  HiSave,
  HiEye,
  HiEyeOff,
} from 'react-icons/hi';

const SmartForm = ({ 
  children, 
  onSubmit, 
  onSave, 
  initialData = {}, 
  autoSave = true,
  validation = {},
  className = "" 
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const autoSaveTimeoutRef = useRef(null);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty && onSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSave(formData);
          setLastSaved(new Date());
          setIsDirty(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, isDirty, autoSave, onSave]);

  const validateField = (name, value) => {
    const fieldValidation = validation[name];
    if (!fieldValidation) return null;

    if (fieldValidation.required && !value) {
      return `${name} is required`;
    }

    if (fieldValidation.minLength && value.length < fieldValidation.minLength) {
      return `${name} must be at least ${fieldValidation.minLength} characters`;
    }

    if (fieldValidation.maxLength && value.length > fieldValidation.maxLength) {
      return `${name} must be no more than ${fieldValidation.maxLength} characters`;
    }

    if (fieldValidation.pattern && !fieldValidation.pattern.test(value)) {
      return fieldValidation.message || `${name} format is invalid`;
    }

    if (fieldValidation.custom) {
      return fieldValidation.custom(value);
    }

    return null;
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (name) => {
    const error = validateField(name, formData[name]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(validation).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  const SmartInput = ({ 
    name, 
    label, 
    type = "text", 
    placeholder, 
    required = false,
    helpText,
    ...props 
  }) => {
    const hasError = errors[name];
    const isPassword = type === 'password';
    const showPasswordToggle = isPassword && formData[name];

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            type={isPassword && showPassword[name] ? 'text' : type}
            value={formData[name] || ''}
            onChange={(e) => handleInputChange(name, e.target.value)}
            onBlur={() => handleBlur(name)}
            placeholder={placeholder}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasError 
                ? 'border-red-300 text-red-900 placeholder-red-300' 
                : 'border-gray-300'
            }`}
            {...props}
          />
          
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(prev => ({ ...prev, [name]: !prev[name] }))}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword[name] ? (
                <HiEyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <HiEye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}
        </div>
        
        {hasError && (
          <div className="flex items-center mt-1 text-sm text-red-600">
            <HiX className="h-4 w-4 mr-1" />
            {hasError}
          </div>
        )}
        
        {helpText && !hasError && (
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <HiInformationCircle className="h-4 w-4 mr-1" />
            {helpText}
          </div>
        )}
      </div>
    );
  };

  const SmartSelect = ({ 
    name, 
    label, 
    options, 
    placeholder = "Select an option",
    required = false,
    helpText,
    ...props 
  }) => {
    const hasError = errors[name];

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <select
          value={formData[name] || ''}
          onChange={(e) => handleInputChange(name, e.target.value)}
          onBlur={() => handleBlur(name)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            hasError 
              ? 'border-red-300 text-red-900' 
              : 'border-gray-300'
          }`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {hasError && (
          <div className="flex items-center mt-1 text-sm text-red-600">
            <HiX className="h-4 w-4 mr-1" />
            {hasError}
          </div>
        )}
        
        {helpText && !hasError && (
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <HiInformationCircle className="h-4 w-4 mr-1" />
            {helpText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Auto-save indicator */}
      {autoSave && onSave && (
        <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-600">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <HiCheck className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-600">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </>
            ) : (
              <>
                <HiInformationCircle className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-600">Auto-save enabled</span>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {children({ 
          formData, 
          SmartInput, 
          SmartSelect,
          handleInputChange,
          handleBlur,
          errors,
          isDirty,
          isSaving 
        })}
      </form>
    </div>
  );
};

export default SmartForm; 
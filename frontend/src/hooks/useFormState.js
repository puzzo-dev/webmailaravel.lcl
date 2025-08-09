import { useState, useCallback } from 'react';

/**
 * Custom hook for form state management
 * Handles loading, submitting, errors, and data states consistently
 */
export const useFormState = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const updateFormData = useCallback((data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setIsDirty(true);
  }, []);

  const setFieldError = useCallback((field, message) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const resetForm = useCallback((newData = initialData) => {
    setFormData(newData);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
    setIsLoading(false);
  }, [initialData]);

  const setSubmitting = useCallback((submitting) => {
    setIsSubmitting(submitting);
  }, []);

  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  // Helper to handle form submission
  const handleSubmit = useCallback(async (submitFunction) => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const result = await submitFunction(formData);
      return result;
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          _general: error.response?.data?.message || error.message || 'An error occurred'
        });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  return {
    formData,
    isLoading,
    isSubmitting,
    errors,
    isDirty,
    updateField,
    updateFormData,
    setFieldError,
    clearErrors,
    clearFieldError,
    resetForm,
    setSubmitting,
    setLoading,
    handleSubmit,
    setFormData
  };
};

export default useFormState;

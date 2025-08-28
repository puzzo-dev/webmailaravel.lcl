import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { verify2FA, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { HiShieldCheck, HiKey } from 'react-icons/hi';

const Verify2FA = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(verify2FA({ code: data.code })).unwrap();
      toast.success('2FA verification successful!');
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('code', value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <HiShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="code" className="form-label">
              Authentication Code
            </label>
            <div className="mt-1">
              <input
                id="code"
                type="text"
                autoComplete="one-time-code"
                className={`input text-center text-2xl tracking-widest ${errors.code ? 'input-error' : ''}`}
                placeholder="000000"
                maxLength={6}
                {...register('code', {
                  required: 'Authentication code is required',
                  minLength: {
                    value: 6,
                    message: 'Code must be 6 digits',
                  },
                  maxLength: {
                    value: 6,
                    message: 'Code must be 6 digits',
                  },
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Code must be 6 digits',
                  },
                })}
                onChange={handleCodeChange}
              />
              {errors.code && (
                <p className="form-error mt-1">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center"
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <HiKey className="h-5 w-5 mr-2" />
                  Verify Code
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Having trouble?{' '}
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verify2FA; 
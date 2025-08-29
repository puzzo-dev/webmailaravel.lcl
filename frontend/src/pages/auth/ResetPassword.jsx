import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { resetPassword, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { HiLockClosed, HiEye, HiEyeOff, HiArrowLeft } from 'react-icons/hi';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })).unwrap();

      setIsSubmitted(true);
      toast.success('Password reset successfully!');
    } catch {
      // Error is handled by useEffect above
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-danger-600 rounded-lg flex items-center justify-center">
              <HiLockClosed className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Invalid reset link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              The password reset link is invalid or has expired.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="btn btn-primary"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-success-600 rounded-lg flex items-center justify-center">
              <HiLockClosed className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password reset successful
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="btn btn-primary"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <HiLockClosed className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter new password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="form-error mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password_confirmation" className="form-label">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.password_confirmation ? 'input-error' : ''}`}
                  placeholder="Confirm new password"
                  {...register('password_confirmation', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password_confirmation && (
                  <p className="form-error mt-1">{errors.password_confirmation.message}</p>
                )}
              </div>
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
                  <HiLockClosed className="h-5 w-5 mr-2" />
                  Reset password
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center"
          >
            <HiArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 
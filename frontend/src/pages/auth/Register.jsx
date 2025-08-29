import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { register as registerUser, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { HiInbox, HiLockClosed, HiUser, HiEye, HiEyeOff } from 'react-icons/hi';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Check if user came from pricing page
  const fromPricing = searchParams.get('from') === 'pricing';

  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If user came from pricing, redirect to billing after registration
      const redirectTo = fromPricing ? '/billing?welcome=true' : '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, fromPricing]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(registerUser({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })).unwrap();

      toast.success('Registration successful! Welcome to EmailCampaign.');
      // If user came from pricing, redirect to billing to complete subscription
      const redirectTo = fromPricing ? '/billing?welcome=true' : '/dashboard';
      navigate(redirectTo);
    } catch {
      // Error is handled by useEffect above
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="form-label">
              Full name
            </label>
            <div className="mt-1 relative">
              <input
                id="name"
                type="text"
                autoComplete="name"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                })}
              />
              {errors.name && (
                <p className="form-error mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <div className="mt-1 relative">
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={`input ${errors.username ? 'input-error' : ''}`}
                placeholder="Choose a username"
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers, and underscores',
                  },
                })}
              />
              {errors.username && (
                <p className="form-error mt-1">{errors.username.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <div className="mt-1 relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="form-error mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="Create a password"
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
              Confirm password
            </label>
            <div className="mt-1 relative">
              <input
                id="password_confirmation"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pr-10 ${errors.password_confirmation ? 'input-error' : ''}`}
                placeholder="Confirm your password"
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
                <HiUser className="h-5 w-5 mr-2" />
                Create account
              </>
            )}
          </button>
        </div>

        {/* Terms and conditions */}
        <div className="text-center">
          <p className="text-xs text-gray-600">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register; 
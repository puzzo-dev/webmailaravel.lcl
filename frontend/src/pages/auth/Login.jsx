import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { login, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { HiInbox, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isLoading, error, isAuthenticated, loginAttempts } = useSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Rate limiting warning
  useEffect(() => {
    if (loginAttempts >= 3) {
      toast.error('Too many login attempts. Please wait before trying again.');
    }
  }, [loginAttempts]);

  const onSubmit = async (data) => {
    try {
      await dispatch(login({
        identifier: data.identifier,
        password: data.password,
        remember: rememberMe,
      })).unwrap();
      
      toast.success('Login successful!');
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleDemoLogin = () => {
    // Show a message that demo login is not available
    toast.error('Demo login is not available. Please use your actual credentials.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="identifier" className="form-label">
              Username or Email
            </label>
            <div className="mt-1 relative">
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className={`input ${errors.identifier ? 'input-error' : ''}`}
                placeholder="Enter your username or email"
                {...register('identifier', {
                  required: 'Username or email is required',
                })}
              />
              {errors.identifier && (
                <p className="form-error mt-1">{errors.identifier.message}</p>
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
                autoComplete="current-password"
                className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
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
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || loginAttempts >= 5}
            className="btn btn-primary w-full flex justify-center"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <HiLockClosed className="h-5 w-5 mr-2" />
                Sign in
              </>
            )}
          </button>
        </div>

        {/* Demo login button - disabled for security */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="text-sm text-gray-400 cursor-not-allowed"
          >
            Demo login disabled for security
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login; 
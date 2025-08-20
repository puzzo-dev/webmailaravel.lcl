import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHandler';
import { HiInbox, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import { useForm } from 'react-hook-form';

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

  // Show error messages
  useEffect(() => {
    if (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
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
    } catch (_error) {
      // Error is handled by useEffect above
    }
  };

  const handleDemoLogin = () => {
    // Show a message that demo login is not available
    toast.error('Demo login is not available. Please use your actual credentials.');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding/Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center">
            <HiInbox className="h-20 w-20 mx-auto mb-8 text-blue-200" />
            <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
            <p className="text-xl text-blue-100 mb-8">
              Sign in to access your email campaign management dashboard
            </p>
            <div className="space-y-4 text-blue-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
                <span>Manage email campaigns</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
                <span>Track performance analytics</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
                <span>Monitor deliverability</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -ml-16 -mb-16"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <HiInbox className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Email Campaign Manager</h2>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
            <p className="text-sm text-gray-600 mb-8">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    className={`block w-full px-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 ${
                      errors.identifier 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                    placeholder="Enter your email or username"
                    {...register('identifier', {
                      required: 'Email or username is required',
                    })}
                  />
                  {errors.identifier && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.identifier.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full px-4 py-3 pr-12 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
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
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5" />
                    ) : (
                      <HiEye className="h-5 w-5" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password.message}
                    </p>
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || loginAttempts >= 5}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <HiLockClosed className="h-5 w-5 mr-2" />
                    Sign in to your account
                  </div>
                )}
              </button>

              {loginAttempts >= 3 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                      Multiple failed attempts detected. Please wait before trying again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
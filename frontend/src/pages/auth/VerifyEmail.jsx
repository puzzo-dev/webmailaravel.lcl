import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { verifyEmail, resendEmailVerification } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { HiMail, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [resendCooldown, setResendCooldown] = useState(0);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyEmail = async (verificationToken) => {
    setIsVerifying(true);
    try {
      await dispatch(verifyEmail({ 
        token: verificationToken,
        email: email 
      })).unwrap();
      
      setVerificationStatus('success');
      toast.success('Email verified successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setVerificationStatus('error');
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Email verification failed';
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (resendCooldown > 0) return;

    try {
      await dispatch(resendEmailVerification()).unwrap();
      toast.success('Verification email sent!');
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to resend verification email';
      toast.error(errorMessage);
    }
  };

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Email</h2>
          <p className="text-gray-600">Please wait while we verify your email address...</p>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className="text-center">
          <HiCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-4">
            Your email address has been successfully verified. You can now sign in to your account.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </Link>
        </div>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <div className="text-center">
          <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-4">
            The verification link is invalid or has expired. Please request a new verification email.
          </p>
          {email && (
            <button
              onClick={resendVerificationEmail}
              disabled={resendCooldown > 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>
          )}
        </div>
      );
    }

    // Default state - no token provided
    return (
      <div className="text-center">
        <HiMail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-600 mb-4">
          Please check your email and click the verification link to activate your account.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Didn't receive the email? Check your spam folder or request a new one.
        </p>
        <Link
          to="/login"
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          Back to Sign In
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

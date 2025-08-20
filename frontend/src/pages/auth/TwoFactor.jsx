import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHandler';
import { HiShieldCheck, HiRefresh, HiArrowLeft } from 'react-icons/hi';
import { setUser } from '../../store/slices/authSlice';

const TwoFactor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Get user info from location state (passed from login)
  const { email, tempToken } = location.state || {};

  useEffect(() => {
    // Redirect to login if no temp token
    if (!tempToken || !email) {
      navigate('/login');
      return;
    }
  }, [tempToken, email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          const newCode = digits.split('');
          setCode(newCode);
          handleSubmit(digits);
        }
      });
    }
  };

  const handleSubmit = async (codeString = null) => {
    const verificationCode = codeString || code.join('');
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter a complete 6-digit code');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temp_token: tempToken,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful 2FA verification
        dispatch(setUser(data.user));
        
        toast.success('Two-factor authentication successful!');
        navigate('/dashboard');
      } else {
        toast.error(getErrorMessage({ response: { data } }));
        // Clear the code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      const response = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temp_token: tempToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('New verification code sent!');
        setResendCooldown(60); // 60 second cooldown
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(getErrorMessage({ response: { data } }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!tempToken || !email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <HiShieldCheck className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
            <p className="text-gray-600 mb-6">
              We've sent a 6-digit verification code to your authentication app or SMS.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Signed in as: <span className="font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* 6-digit code input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center space-x-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={isVerifying}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isVerifying || code.some(digit => digit === '')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            {/* Resend code */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiRefresh className="h-4 w-4 mr-1" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            {/* Back to login */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500"
              >
                <HiArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </button>
            </div>
          </form>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Make sure your authentication app is set up correctly or check your SMS messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactor;

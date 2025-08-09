import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiMail, HiCheckCircle, HiExclamationCircle, HiUserRemove, HiHome } from 'react-icons/hi';

const Unsubscribe = () => {
  const { token } = useParams();
  const [unsubscribeStatus, setUnsubscribeStatus] = useState('processing'); // processing, success, error, already_unsubscribed
  const [unsubscribeData, setUnsubscribeData] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (token) {
      processUnsubscribe();
    }
  }, [token]);

  const processUnsubscribe = async () => {
    try {
      const response = await fetch(`/api/unsubscribe/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.already_unsubscribed) {
          setUnsubscribeStatus('already_unsubscribed');
        } else {
          setUnsubscribeStatus('success');
        }
        setUnsubscribeData(data);
        setEmail(data.email || '');
      } else {
        setUnsubscribeStatus('error');
        console.error('Unsubscribe failed:', data.message);
      }
    } catch (error) {
      setUnsubscribeStatus('error');
      console.error('Unsubscribe error:', error);
    }
  };

  const handleResubscribe = async () => {
    if (!token) return;

    try {
      const response = await fetch(`/api/resubscribe/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUnsubscribeStatus('resubscribed');
        setUnsubscribeData(data);
      } else {
        console.error('Resubscribe failed:', data.message);
      }
    } catch (error) {
      console.error('Resubscribe error:', error);
    }
  };

  const renderContent = () => {
    if (unsubscribeStatus === 'processing') {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Request</h2>
          <p className="text-gray-600">Please wait while we process your unsubscribe request...</p>
        </div>
      );
    }

    if (unsubscribeStatus === 'success') {
      return (
        <div className="text-center">
          <HiCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Unsubscribed</h2>
          <p className="text-gray-600 mb-4">
            {email ? `${email} has been` : 'You have been'} successfully removed from our mailing list.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will no longer receive marketing emails from us. Please allow up to 48 hours for this change to take effect.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleResubscribe}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Changed your mind? Resubscribe
            </button>
            
            <Link
              to="/"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiHome className="h-4 w-4 mr-2" />
              Return to Homepage
            </Link>
          </div>
        </div>
      );
    }

    if (unsubscribeStatus === 'already_unsubscribed') {
      return (
        <div className="text-center">
          <HiUserRemove className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Unsubscribed</h2>
          <p className="text-gray-600 mb-4">
            {email ? `${email} is` : 'You are'} already unsubscribed from our mailing list.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you're still receiving emails, please allow up to 48 hours for changes to take effect.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleResubscribe}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Want to resubscribe? Click here
            </button>
            
            <Link
              to="/"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiHome className="h-4 w-4 mr-2" />
              Return to Homepage
            </Link>
          </div>
        </div>
      );
    }

    if (unsubscribeStatus === 'resubscribed') {
      return (
        <div className="text-center">
          <HiCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-gray-600 mb-4">
            {email ? `${email} has been` : 'You have been'} successfully resubscribed to our mailing list.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will continue to receive our marketing emails and updates.
          </p>
          
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HiHome className="h-4 w-4 mr-2" />
            Return to Homepage
          </Link>
        </div>
      );
    }

    if (unsubscribeStatus === 'error') {
      return (
        <div className="text-center">
          <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unsubscribe Failed</h2>
          <p className="text-gray-600 mb-4">
            We were unable to process your unsubscribe request. The link may be invalid or expired.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you continue to have issues, please contact our support team for assistance.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={processUnsubscribe}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <Link
              to="/"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiHome className="h-4 w-4 mr-2" />
              Return to Homepage
            </Link>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <HiMail className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">Email Preferences</h1>
          </div>

          {/* Content */}
          {renderContent()}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              We respect your privacy and email preferences. You can manage your subscription at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;

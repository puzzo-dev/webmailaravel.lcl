import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { HiMail, HiCheckCircle, HiExclamationCircle, HiEye, HiCursorClick } from 'react-icons/hi';

const EmailTracking = () => {
  const { trackingId } = useParams();
  const location = useLocation();
  const [trackingStatus, setTrackingStatus] = useState('processing'); // processing, success, error
  const [trackingData, setTrackingData] = useState(null);

  // Determine tracking type from URL path
  const isOpenTracking = location.pathname.includes('/track/open/');
  const isClickTracking = location.pathname.includes('/track/click/');

  useEffect(() => {
    if (trackingId) {
      recordTracking();
    }
  }, [trackingId]);

  const recordTracking = async () => {
    try {
      const endpoint = isOpenTracking 
        ? `/api/track/open/${trackingId}`
        : `/api/track/click/${trackingId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTrackingStatus('success');
        setTrackingData(data);

        // For click tracking, redirect to the original URL if provided
        if (isClickTracking && data.redirect_url) {
          setTimeout(() => {
            window.location.href = data.redirect_url;
          }, 1000);
        }
      } else {
        setTrackingStatus('error');
        console.error('Tracking failed:', data.message);
      }
    } catch (error) {
      setTrackingStatus('error');
      console.error('Tracking error:', error);
    }
  };

  const renderContent = () => {
    if (trackingStatus === 'processing') {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h2>
          <p className="text-gray-600">
            {isOpenTracking ? 'Recording email open...' : 'Recording click and redirecting...'}
          </p>
        </div>
      );
    }

    if (trackingStatus === 'success') {
      return (
        <div className="text-center">
          {isOpenTracking ? (
            <HiEye className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          ) : (
            <HiCursorClick className="h-16 w-16 text-green-500 mx-auto mb-4" />
          )}
          <HiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isOpenTracking ? 'Email Opened' : 'Click Recorded'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isOpenTracking 
              ? 'Thank you for reading our email!'
              : 'Redirecting you to the requested page...'
            }
          </p>
          
          {trackingData && (
            <div className="text-sm text-gray-500 space-y-1">
              {trackingData.campaign_name && (
                <p>Campaign: {trackingData.campaign_name}</p>
              )}
              {trackingData.timestamp && (
                <p>Time: {new Date(trackingData.timestamp).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    if (trackingStatus === 'error') {
      return (
        <div className="text-center">
          <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tracking Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to process the tracking request. The link may be invalid or expired.
          </p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      );
    }
  };

  // For click tracking with redirect, show minimal UI
  if (isClickTracking && trackingStatus === 'success' && trackingData?.redirect_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <HiMail className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">Email Tracking</h1>
          </div>

          {/* Content */}
          {renderContent()}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              This tracking helps us improve our email delivery and content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTracking;

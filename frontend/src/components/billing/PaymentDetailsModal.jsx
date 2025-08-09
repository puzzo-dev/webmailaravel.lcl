import React from 'react';
import { HiX, HiCheckCircle, HiClock, HiXCircle, HiCreditCard, HiCalendar, HiCurrencyDollar, HiDocumentText } from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';

/**
 * PaymentDetailsModal component for displaying detailed payment information
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Function to close modal
 * @param {Object} payment - Payment object with details
 */
const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <HiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <HiXCircle className="h-5 w-5 text-red-500" />;
      default:
        return <HiClock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>

          {/* Payment Details */}
          <div className="space-y-6">
            {/* Payment ID */}
            <div className="flex items-start space-x-3">
              <HiDocumentText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500">Payment ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {payment.id || 'N/A'}
                </dd>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start space-x-3">
              <HiCalendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {payment.date ? formatDate(payment.date) : 'N/A'}
                </dd>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-start space-x-3">
              <HiCurrencyDollar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  ${payment.amount ? formatNumber(payment.amount, 2) : '0.00'}
                </dd>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start space-x-3">
              {getStatusIcon(payment.status)}
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(payment.status)}`}>
                    {typeof payment.status === 'string' ? payment.status : 'pending'}
                  </span>
                </dd>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start space-x-3">
              <HiCreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {typeof payment.method === 'string' ? payment.method : 'BTCPay'}
                </dd>
              </div>
            </div>

            {/* Invoice */}
            <div className="flex items-start space-x-3">
              <HiDocumentText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500">Invoice</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {typeof payment.invoice === 'string' ? payment.invoice : payment.invoice?.id || 'N/A'}
                </dd>
              </div>
            </div>

            {/* Additional Details */}
            {payment.description && (
              <div className="flex items-start space-x-3">
                <HiDocumentText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {payment.description}
                  </dd>
                </div>
              </div>
            )}

            {/* Transaction ID */}
            {payment.transaction_id && (
              <div className="flex items-start space-x-3">
                <HiDocumentText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                    {payment.transaction_id}
                  </dd>
                </div>
              </div>
            )}

            {/* Payment URL (for pending payments) */}
            {payment.payment_url && payment.status === 'pending' && (
              <div className="flex items-start space-x-3">
                <HiDocumentText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500">Payment Link</dt>
                  <dd className="mt-1">
                    <a
                      href={payment.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 text-sm underline"
                    >
                      Complete Payment
                    </a>
                  </dd>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;

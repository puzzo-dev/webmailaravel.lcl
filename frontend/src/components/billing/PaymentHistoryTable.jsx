import React, { useState } from 'react';
import { HiCheckCircle, HiClock, HiXCircle, HiEye, HiDownload, HiInformationCircle } from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import { useModal } from '../../hooks/useModal';
import PaymentDetailsModal from './PaymentDetailsModal';

/**
 * Reusable PaymentHistoryTable component for displaying payment history
 * @param {Array} paymentHistory - Array of payment records
 * @param {boolean} isLoading - Loading state
 * @param {Function} onViewInvoice - Callback for viewing invoice
 * @param {Function} onDownloadInvoice - Callback for downloading invoice
 */
const PaymentHistoryTable = ({ 
  paymentHistory = [], 
  isLoading = false, 
  onViewInvoice, 
  onDownloadInvoice 
}) => {
  const { isOpen: isDetailsModalOpen, openModal: openDetailsModal, closeModal: closeDetailsModal } = useModal();
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    openDetailsModal();
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <HiCheckCircle className="h-3 w-3 mr-1" />;
      case 'failed':
        return <HiXCircle className="h-3 w-3 mr-1" />;
      default:
        return <HiClock className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-warning-100 text-warning-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(paymentHistory) && paymentHistory.length > 0 ? (
                paymentHistory.map((payment, index) => (
                  <tr key={payment.id || `payment-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.date ? formatDate(payment.date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payment.amount ? formatNumber(payment.amount, 2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {typeof payment.status === 'string' ? payment.status : 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof payment.method === 'string' ? payment.method : 'BTCPay'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.invoice_id || payment.invoice?.id || payment.invoice || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="View Payment Details"
                        >
                          <HiInformationCircle className="h-4 w-4" />
                        </button>
                        {onViewInvoice && (payment.invoice_id || payment.invoice?.id || payment.invoice) && (
                          <button
                            onClick={() => onViewInvoice(payment.invoice_id || payment.invoice?.id || payment.invoice)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="View Invoice"
                          >
                            <HiEye className="h-4 w-4" />
                          </button>
                        )}
                        {onDownloadInvoice && (payment.invoice_id || payment.invoice?.id || payment.invoice) && (
                          <button
                            onClick={() => onDownloadInvoice(payment.invoice_id || payment.invoice?.id || payment.invoice)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Download Invoice"
                          >
                            <HiDownload className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-payment-history">
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No payment history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        payment={selectedPayment}
      />
    </>
  );
};

export default PaymentHistoryTable;

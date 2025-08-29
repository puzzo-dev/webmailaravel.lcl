import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchSubscriptions,
  fetchPaymentHistory,
  fetchPaymentRates,
  fetchPlans,
} from '../store/slices/billingSlice';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Custom hook for managing billing operations and data
 * Handles payment history, invoices, and billing-related API calls
 */
const useBilling = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    paymentHistory,
    invoices,
    plans,
    isLoading,
    error,
  } = useSelector((state) => state.billing);

  // Load all billing data
  const loadBillingData = useCallback(async () => {
    if (isLoading) return;

    try {
      // Always load public data (plans)
      const publicPromises = [
        dispatch(fetchPlans())
      ];

      // Load user-specific data only if user is logged in
      const userPromises = user?.id ? [
        dispatch(fetchSubscriptions()),
        dispatch(fetchPaymentHistory()),
        dispatch(fetchPaymentRates())
      ] : [];

      // Load all data
      const results = await Promise.allSettled([...publicPromises, ...userPromises]);

      // Log any failures but don't block the UI
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoints = ['plans', 'subscriptions', 'payment history', 'payment rates'];
          console.warn(`Failed to load ${endpoints[index]}:`, result.reason);
        }
      });

    } catch (error) {
      console.error('Failed to load billing data:', error);
      // Don't show toast error for data loading failures to avoid UX issues
      console.warn('Some billing data may not be available');
    }
  }, [dispatch, isLoading, user?.id]);

  // Download invoice
  const downloadInvoice = async (invoiceId) => {
    if (!invoiceId || invoiceId === 'N/A') {
      toast.error('Invalid invoice ID');
      return false;
    }

    try {
      // For downloads, we need to use fetch directly with proper authentication
      // since the api wrapper might not handle blob responses correctly
      const downloadResponse = await fetch(`${import.meta.env.VITE_API_URL}/billing/invoice/${invoiceId}/download`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Accept': 'text/html,application/pdf,*/*',
        },
      });

      if (!downloadResponse.ok) {
        let errorMessage = `HTTP ${downloadResponse.status}`;
        try {
          const errorText = await downloadResponse.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If parsing fails, use the status text
          errorMessage = downloadResponse.statusText || errorMessage;
        }
        console.error('Download error response:', errorMessage);
        toast.error(getErrorMessage(error));
        return false;
      }

      // Get content type and determine file extension
      const contentType = downloadResponse.headers.get('content-type');
      let fileName = `invoice-${invoiceId}.pdf`;

      if (contentType) {
        if (contentType.includes('text/html')) {
          fileName = `invoice-${invoiceId}.html`;
        } else if (contentType.includes('application/pdf')) {
          fileName = `invoice-${invoiceId}.pdf`;
        }
      }

      const blob = await downloadResponse.blob();

      // Validate blob size
      if (blob.size === 0) {
        toast.error('Downloaded file is empty');
        return false;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.success('Invoice downloaded successfully');
      return true;
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  // View invoice details
  const viewInvoice = async (invoiceId) => {
    if (!invoiceId || invoiceId === 'N/A') {
      toast.error('Invalid invoice ID');
      return null;
    }

    try {
      const response = await api.get(`/billing/invoice/${invoiceId}/view`);
      console.log('Invoice details:', response);

      // The api wrapper already handles the response parsing
      if (response.success !== false) {
        toast.success('Invoice details loaded');
        return response.data || response;
      } else {
        toast.error(getErrorMessage({ response: { data: response } }));
        return null;
      }
    } catch (error) {
      console.error('Invoice view error:', error);
      toast.error(getErrorMessage(error));
      return null;
    }
  };

  // Format payment history data
  const getFormattedPaymentHistory = () => {
    if (!Array.isArray(paymentHistory)) return [];

    return paymentHistory.map(payment => ({
      id: payment.id,
      date: payment.date || payment.created_at,
      amount: payment.amount || 0,
      status: payment.status || 'pending',
      method: payment.method || payment.payment_method || 'BTCPay',
      invoice: payment.invoice || payment.invoice?.id || 'N/A',
    }));
  };

  // Format invoices data
  const getFormattedInvoices = () => {
    if (!Array.isArray(invoices)) return [];

    return invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number || invoice.id,
      date: invoice.date || invoice.created_at,
      amount: invoice.amount || 0,
      status: invoice.status || 'pending',
      dueDate: invoice.due_date || invoice.dueDate,
    }));
  };

  // Get payment status styling
  const getPaymentStatusStyle = (status) => {
    const statusMap = {
      completed: 'bg-success-100 text-success-800',
      active: 'bg-success-100 text-success-800',
      paid: 'bg-success-100 text-success-800',
      pending: 'bg-warning-100 text-warning-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Get payment status icon
  const getPaymentStatusIcon = (status) => {
    const iconMap = {
      completed: 'HiCheckCircle',
      active: 'HiCheckCircle',
      paid: 'HiCheckCircle',
      pending: 'HiClock',
      processing: 'HiClock',
      failed: 'HiXCircle',
      cancelled: 'HiXCircle',
    };

    return iconMap[status] || 'HiClock';
  };

  // Check if there are any pending payments
  const hasPendingPayments = () => {
    return getFormattedPaymentHistory().some(payment =>
      payment.status === 'pending' || payment.status === 'processing'
    );
  };

  // Get total spent amount
  const getTotalSpent = () => {
    return getFormattedPaymentHistory()
      .filter(payment => payment.status === 'completed' || payment.status === 'active')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  return {
    // State
    paymentHistory,
    invoices,
    plans,
    isLoading,
    error,

    // Actions
    loadBillingData,
    downloadInvoice,
    viewInvoice,

    // Formatted data
    getFormattedPaymentHistory,
    getFormattedInvoices,

    // Utilities
    getPaymentStatusStyle,
    getPaymentStatusIcon,
    hasPendingPayments,
    getTotalSpent,
  };
};

export default useBilling;

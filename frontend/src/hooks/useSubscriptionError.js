import { useDispatch } from 'react-redux';
import { showSubscriptionOverlay } from '../store/slices/uiSlice';

const useSubscriptionError = () => {
  const dispatch = useDispatch();

  const handleSubscriptionError = (error) => {
    if (error?.response?.status === 403 && error?.response?.data?.error === 'subscription_required') {
      dispatch(showSubscriptionOverlay({
        message: error.response.data.message || 'Active subscription required for this feature'
      }));
      return true; // Error was handled
    }
    return false; // Error was not handled
  };

  return { handleSubscriptionError };
};

export default useSubscriptionError; 
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  theme: localStorage.getItem('theme') || 'light',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  notificationsOpen: false,
  subscriptionOverlay: {
    isVisible: false,
    message: '',
  },
  modals: {
    confirmDelete: {
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
    },
    campaignPreview: {
      isOpen: false,
      campaign: null,
    },
    templateEditor: {
      isOpen: false,
      template: null,
    },
  },
  toasts: [],
  loadingStates: {
    campaigns: false,
    analytics: false,
    users: false,
    notifications: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed.toString());
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', action.payload.toString());
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleNotifications: (state) => {
      state.notificationsOpen = !state.notificationsOpen;
    },
    setNotificationsOpen: (state, action) => {
      state.notificationsOpen = action.payload;
    },
    openModal: (state, action) => {
      const { modalName, modalData } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = { ...state.modals[modalName], ...modalData, isOpen: true };
      }
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = { ...state.modals[modalName], isOpen: false };
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName] = { ...state.modals[modalName], isOpen: false };
      });
    },
    addToast: (state, action) => {
      const toast = {
        id: Date.now(),
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    setLoadingState: (state, action) => {
      const { key, isLoading } = action.payload;
      if (state.loadingStates.hasOwnProperty(key)) {
        state.loadingStates[key] = isLoading;
      }
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
    showSubscriptionOverlay: (state, action) => {
      state.subscriptionOverlay = {
        isVisible: true,
        message: action.payload?.message || '',
      };
    },
    hideSubscriptionOverlay: (state) => {
      state.subscriptionOverlay = {
        isVisible: false,
        message: '',
      };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  toggleTheme,
  setTheme,
  toggleNotifications,
  setNotificationsOpen,
  openModal,
  closeModal,
  closeAllModals,
  addToast,
  removeToast,
  setLoadingState,
  clearAllToasts,
  showSubscriptionOverlay,
  hideSubscriptionOverlay,
} = uiSlice.actions;

export default uiSlice.reducer; 
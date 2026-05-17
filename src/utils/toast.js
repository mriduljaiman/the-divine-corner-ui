// Lazy import toast to avoid SSR issues
const getToast = async () => {
  if (typeof window === 'undefined') {
    // Return no-op functions during SSR
    return {
      success: () => {},
      error: () => {},
      loading: () => {},
      dismiss: () => {},
      promise: () => Promise.resolve(),
    };
  }
  const { default: toast } = await import('react-hot-toast');
  return toast;
};

export const showToast = {
  success: async (message) => {
    const toast = await getToast();
    toast.success(message);
  },

  error: async (message) => {
    const toast = await getToast();
    toast.error(message || 'Something went wrong');
  },

  loading: async (message) => {
    const toast = await getToast();
    return toast.loading(message || 'Loading...');
  },

  dismiss: async (toastId) => {
    const toast = await getToast();
    toast.dismiss(toastId);
  },

  promise: async (promise, messages) => {
    const toast = await getToast();
    return toast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: (err) => messages.error || err?.message || 'Error occurred',
    });
  },

  // Custom toast for cart operations
  addedToCart: async (productName) => {
    const toast = await getToast();
    toast.success(`${productName} added to cart!`, {
      icon: '🛒',
      duration: 2000,
    });
  },

  removedFromCart: async (productName) => {
    const toast = await getToast();
    toast.success(`${productName} removed from cart`, {
      icon: '🗑️',
      duration: 2000,
    });
  },

  // Custom toast for order operations
  orderPlaced: async (orderId) => {
    const toast = await getToast();
    toast.success(`Order placed successfully!`, {
      duration: 5000,
      icon: '📦',
    });
  },

  // Custom toast for auth
  loginSuccess: async (name) => {
    const toast = await getToast();
    toast.success(`Welcome back, ${name}!`, {
      icon: '👋',
      duration: 3000,
    });
  },

  logoutSuccess: async () => {
    const toast = await getToast();
    toast.success('Logged out successfully', {
      icon: '👋',
      duration: 2000,
    });
  },

  // Info toast
  info: async (message) => {
    const toast = await getToast();
    toast(message, {
      icon: 'ℹ️',
      duration: 3000,
    });
  },

  // Warning toast
  warning: async (message) => {
    const toast = await getToast();
    toast(message, {
      icon: '⚠️',
      duration: 4000,
      style: {
        background: '#fef3c7',
        color: '#92400e',
      },
    });
  },
};

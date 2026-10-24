// ============ context/CartContext.js ============
import { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();
const GUEST_CART_KEY = 'divine_guest_cart';

function getGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [guestItems, setGuestItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      mergeGuestCartThenFetch();
    } else {
      setCart(null);
      setGuestItems(getGuestCart());
    }
  }, [isAuthenticated()]);

  // Items added before login live in localStorage; move them into the server cart once
  const mergeGuestCartThenFetch = async () => {
    const pending = getGuestCart();
    if (pending.length > 0) {
      saveGuestCart([]);
      setGuestItems([]);
      for (const item of pending) {
        try {
          await cartService.addToCart(item.productId, item.quantity, item.size);
        } catch (error) {
          console.warn('Could not move guest cart item', item.productId, error.response?.data?.message);
        }
      }
    }
    await fetchCart();
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity, productInfo, size) => {
    if (!isAuthenticated()) {
      // Guest cart — store in localStorage
      const current = getGuestCart();
      const sameLine = (i) => i.productId === productId && (i.size || null) === (size || null);
      const existing = current.find(sameLine);
      let updated;
      if (existing) {
        updated = current.map(i =>
          sameLine(i)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        updated = [...current, { productId, quantity, size: size || null, ...(productInfo || {}) }];
      }
      saveGuestCart(updated);
      setGuestItems(updated);
      return { data: { items: updated } };
    }

    try {
      const response = await cartService.addToCart(productId, quantity, size);
      setCart(response.data);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      setCart(response.data);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await cartService.removeFromCart(itemId);
      setCart(response.data);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart({ items: [], totalAmount: 0, shippingCharges: 0, grandTotal: 0 });
    } catch (error) {
      throw error;
    }
  };

  const getCartItemsCount = () => {
    if (!isAuthenticated()) {
      return guestItems.reduce((total, item) => total + item.quantity, 0);
    }
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      guestItems,
      loading,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      fetchCart,
      getCartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

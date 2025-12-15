import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const CART_STORAGE_KEY = '@kisanone_cart';

export function CartProvider({ children }) {
  const [cartItemsById, setCartItemsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load cart data from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItemsById(parsedCart);
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, []);

  // Save cart data to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      const saveCart = async () => {
        try {
          await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItemsById));
        } catch (error) {
          console.error('Error saving cart to storage:', error);
        }
      };
      saveCart();
    }
  }, [cartItemsById, isLoading]);

  const addToCart = (product) => {
    setCartItemsById((prev) => {
      const next = { ...prev };
      const existing = next[product.id];
      next[product.id] = existing
        ? { ...existing, quantity: existing.quantity + 1 }
        : { ...product, quantity: 1 };
      return next;
    });
  };

  const increment = (productId) => {
    setCartItemsById((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      return { ...prev, [productId]: { ...item, quantity: item.quantity + 1 } };
    });
  };

  const decrement = (productId) => {
    setCartItemsById((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const qty = item.quantity - 1;
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = { ...item, quantity: qty };
      }
      return next;
    });
  };

  const clearCart = () => {
    setCartItemsById({});
    // Also clear from storage
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch((error) => {
      console.error('Error clearing cart from storage:', error);
    });
  };

  const items = useMemo(() => Object.values(cartItemsById), [cartItemsById]);
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = items.reduce((sum, it) => sum + it.quantity * (it.priceValue || 0), 0);

  const value = {
    items,
    totalQuantity,
    totalAmount,
    addToCart,
    increment,
    decrement,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

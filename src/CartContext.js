import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const CART_STORAGE_KEY = '@kisanone_cart';
const FIRST_LAUNCH_KEY = '@kisanone_first_launch';

export function CartProvider({ children }) {
  // Always start with empty cart on first render
  const [cartItemsById, setCartItemsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load cart data from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        // Check if this is the first app launch
        const isFirstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        
        if (isFirstLaunch === null) {
          // This is the first launch - explicitly clear cart and mark as launched
          console.log('First app launch detected - ensuring cart is empty');
          await AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {
            // Ignore errors if key doesn't exist
          });
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
          setCartItemsById({});
          setIsLoading(false);
          return;
        }

        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          try {
            const parsedCart = JSON.parse(storedCart);
            // Validate that parsed cart is an object (not array or other type)
            if (parsedCart && typeof parsedCart === 'object' && !Array.isArray(parsedCart)) {
              // Check if cart is empty (no items)
              const cartItemCount = Object.keys(parsedCart).length;
              
              // If cart is empty, ensure it stays empty and clear storage
              if (cartItemCount === 0) {
                console.log('Cart is empty, ensuring clean state');
                await AsyncStorage.removeItem(CART_STORAGE_KEY);
                setCartItemsById({});
              } else {
                // Validate that all values are valid cart items
                const isValid = Object.values(parsedCart).every(item => 
                  item && 
                  typeof item === 'object' && 
                  item.id != null && 
                  typeof item.quantity === 'number' &&
                  item.quantity > 0
                );
                
                if (isValid) {
                  // Only set cart if it has valid items
                  setCartItemsById(parsedCart);
                } else {
                  // Invalid data - clear it
                  console.warn('Invalid cart data found, clearing cart');
                  await AsyncStorage.removeItem(CART_STORAGE_KEY);
                  setCartItemsById({});
                }
              }
            } else {
              // Invalid format - clear it
              console.warn('Invalid cart format found, clearing cart');
              await AsyncStorage.removeItem(CART_STORAGE_KEY);
              setCartItemsById({});
            }
          } catch (parseError) {
            // JSON parse error - clear corrupted data
            console.error('Error parsing cart data, clearing cart:', parseError);
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
            setCartItemsById({});
          }
        } else {
          // No stored cart - start with empty cart (this is the expected behavior for fresh install)
          // Explicitly ensure cart is empty
          setCartItemsById({});
          // Also ensure storage is clean
          await AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {
            // Ignore errors if key doesn't exist
          });
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        // On error, start with empty cart and clear any corrupted data
        try {
          await AsyncStorage.removeItem(CART_STORAGE_KEY);
        } catch (clearError) {
          // Ignore clear errors
        }
        setCartItemsById({});
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
          // Only save if cart has items
          const cartItemCount = Object.keys(cartItemsById).length;
          if (cartItemCount > 0) {
            await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItemsById));
          } else {
            // If cart is empty, remove from storage to ensure clean state
            await AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {
              // Ignore errors if key doesn't exist
            });
          }
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

  const clearCart = async () => {
    setCartItemsById({});
    // Also clear from storage
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart from storage:', error);
    }
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

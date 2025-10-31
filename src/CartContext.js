import React, { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItemsById, setCartItemsById] = useState({});

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

  const clearCart = () => setCartItemsById({});

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

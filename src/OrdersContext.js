import React, { createContext, useContext, useMemo, useState } from 'react';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const addOrder = (order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const value = useMemo(() => ({ orders, addOrder }), [orders]);
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}

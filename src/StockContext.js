import React, { createContext, useContext, useState, useMemo } from 'react';

const StockContext = createContext(null);

// Initial stock levels for products
const initialStock = {
  1: 90, // Geolife No Virus Bio Viricide
  2: 75, // Antracol Fungicide
  3: 60, // Fantac Plus Growth Promoter
  'best-1': 50, // UPL Saathi Herbicide
  'best-2': 40, // Roundup Glyphosate
  'best-3': 55, // Multiplex Falcon
  'best-4': 35, // Syngenta Nativo
  'best-5': 80, // Indian Organic Vermicompost
  'offer-1': 45, // Today's Offer products
  'offer-2': 30,
  'rec-1': 90,
  'rec-2': 75,
  'rec-3': 60,
};

export function StockProvider({ children }) {
  const [stock, setStock] = useState(initialStock);

  const getStock = (productId) => {
    // Handle numeric IDs
    if (typeof productId === 'number' || (!isNaN(productId) && productId.toString().match(/^\d+$/))) {
      const numId = typeof productId === 'number' ? productId : parseInt(productId, 10);
      // Check direct ID first
      if (stock[numId] !== undefined) return stock[numId];
      // Check prefixed versions
      if (stock[`rec-${numId}`] !== undefined) return stock[`rec-${numId}`];
      if (stock[`best-${numId}`] !== undefined) return stock[`best-${numId}`];
      if (stock[`offer-${numId}`] !== undefined) return stock[`offer-${numId}`];
    }
    // Handle string IDs (with prefixes)
    if (typeof productId === 'string') {
      if (stock[productId] !== undefined) return stock[productId];
      // Try extracting numeric ID from string
      const match = productId.match(/(\d+)/);
      if (match) {
        const numId = parseInt(match[1], 10);
        if (stock[numId] !== undefined) return stock[numId];
      }
    }
    // Default stock for unknown products
    return 50;
  };

  const reduceStock = (productId, quantity) => {
    setStock((prev) => {
      const newStock = { ...prev };
      let updated = false;
      
      // Handle numeric IDs
      if (typeof productId === 'number' || (!isNaN(productId) && productId.toString().match(/^\d+$/))) {
        const numId = typeof productId === 'number' ? productId : parseInt(productId, 10);
        
        // Update direct ID
        if (newStock[numId] !== undefined) {
          newStock[numId] = Math.max(0, newStock[numId] - quantity);
          updated = true;
        }
        // Update prefixed versions to keep them in sync
        if (newStock[`rec-${numId}`] !== undefined) {
          newStock[`rec-${numId}`] = Math.max(0, newStock[`rec-${numId}`] - quantity);
          updated = true;
        }
        if (newStock[`best-${numId}`] !== undefined) {
          newStock[`best-${numId}`] = Math.max(0, newStock[`best-${numId}`] - quantity);
          updated = true;
        }
        if (newStock[`offer-${numId}`] !== undefined) {
          newStock[`offer-${numId}`] = Math.max(0, newStock[`offer-${numId}`] - quantity);
          updated = true;
        }
      }
      
      // Handle string IDs
      if (typeof productId === 'string') {
        if (newStock[productId] !== undefined) {
          newStock[productId] = Math.max(0, newStock[productId] - quantity);
          updated = true;
        }
        // Also update numeric version if exists
        const match = productId.match(/(\d+)/);
        if (match) {
          const numId = parseInt(match[1], 10);
          if (newStock[numId] !== undefined) {
            newStock[numId] = Math.max(0, newStock[numId] - quantity);
            updated = true;
          }
        }
      }
      
      // If none found, initialize with default
      if (!updated) {
        const defaultStock = 50;
        const numId = typeof productId === 'number' ? productId : (productId.toString().match(/\d+/) ? parseInt(productId.toString().match(/\d+/)[0], 10) : 0);
        if (numId > 0) {
          newStock[numId] = Math.max(0, defaultStock - quantity);
        }
      }
      
      return newStock;
    });
  };

  const getStockStatus = (productId) => {
    const count = getStock(productId);
    if (count === 0) return { status: 'Out of Stock', count: 0, color: '#FF6B6B' };
    if (count < 20) return { status: 'Low Stock', count, color: '#FFA500' };
    return { status: 'In Stock', count, color: '#4CAF50' };
  };

  const value = useMemo(
    () => ({
      getStock,
      reduceStock,
      getStockStatus,
    }),
    []
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be used within StockProvider');
  return ctx;
}


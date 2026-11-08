import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProductListDto } from '../types/catalog';

interface CompareContextType {
  items: ProductListDto[];
  addToCompare: (product: ProductListDto) => boolean;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  toggleCompare: (product: ProductListDto) => boolean;
  clearCompare: () => void;
  maxItems: number;
}

const STORAGE_KEY = 'madk_compare_products';
const MAX_COMPARE_ITEMS = 4;

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ProductListDto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_COMPARE_ITEMS);
      }
    } catch (e) {
      console.warn('Lỗi đọc danh sách so sánh từ localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Lỗi lưu danh sách so sánh vào localStorage', e);
    }
  }, [items]);

  const isInCompare = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  );

  const addToCompare = useCallback(
    (product: ProductListDto): boolean => {
      if (items.some((p) => p.id === product.id)) {
        return false;
      }
      if (items.length >= MAX_COMPARE_ITEMS) {
        return false;
      }
      setItems((prev) => [...prev, product]);
      return true;
    },
    [items]
  );

  const removeFromCompare = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const toggleCompare = useCallback(
    (product: ProductListDto): boolean => {
      if (items.some((p) => p.id === product.id)) {
        removeFromCompare(product.id);
        return false;
      } else {
        return addToCompare(product);
      }
    },
    [items, addToCompare, removeFromCompare]
  );

  const clearCompare = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        items,
        addToCompare,
        removeFromCompare,
        isInCompare,
        toggleCompare,
        clearCompare,
        maxItems: MAX_COMPARE_ITEMS,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = (): CompareContextType => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare phải được sử dụng bên trong CompareProvider');
  }
  return context;
};

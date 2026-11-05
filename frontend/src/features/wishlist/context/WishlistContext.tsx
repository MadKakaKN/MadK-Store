import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import wishlistApi from '../../../api/wishlistApi';
import { useAuth } from '../../auth/context/AuthContext';

interface WishlistContextType {
  wishlistIds: Set<string>;
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'madk_guest_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Helper load guest wishlist from localStorage
  const getGuestIds = (): string[] => {
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveGuestIds = (ids: string[]) => {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore
    }
  };

  const refreshWishlist = useCallback(async () => {
    if (isAuthenticated) {
      try {
        // Kiểm tra xem khách có lưu sản phẩm nào trước khi đăng nhập không
        const guestIds = getGuestIds();
        if (guestIds.length > 0) {
          const syncedItems = await wishlistApi.syncWishlist(guestIds);
          localStorage.removeItem(GUEST_STORAGE_KEY);
          setWishlistIds(new Set(syncedItems.map((item) => item.productId)));
          return;
        }

        const ids = await wishlistApi.getWishlistProductIds();
        setWishlistIds(new Set(ids));
      } catch (err) {
        console.error('Failed to load user wishlist:', err);
      }
    } else {
      const guestIds = getGuestIds();
      setWishlistIds(new Set(guestIds));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return wishlistIds.has(productId);
    },
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      const currentlyLiked = wishlistIds.has(productId);
      const newLiked = !currentlyLiked;

      // Optimistic state update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (newLiked) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });

      if (isAuthenticated) {
        try {
          if (newLiked) {
            await wishlistApi.addToWishlist(productId);
          } else {
            await wishlistApi.removeFromWishlist(productId);
          }
        } catch (err) {
          console.error('Failed to sync wishlist with server:', err);
          // Rollback on error
          setWishlistIds((prev) => {
            const next = new Set(prev);
            if (currentlyLiked) next.add(productId);
            else next.delete(productId);
            return next;
          });
          return currentlyLiked;
        }
      } else {
        // Guest mode LocalStorage
        const currentGuest = getGuestIds();
        let updated: string[];
        if (newLiked) {
          updated = Array.from(new Set([...currentGuest, productId]));
        } else {
          updated = currentGuest.filter((id) => id !== productId);
        }
        saveGuestIds(updated);
      }

      return newLiked;
    },
    [wishlistIds, isAuthenticated]
  );

  const value = useMemo(
    () => ({
      wishlistIds,
      wishlistCount: wishlistIds.size,
      isInWishlist,
      toggleWishlist,
      refreshWishlist,
    }),
    [wishlistIds, isInWishlist, toggleWishlist, refreshWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;

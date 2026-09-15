import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product, WishlistItem } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistContextValue {
  items: WishlistItem[];
  wishlistCount: number;
  loading: boolean;
  isInWishlist: (productId: number | string) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
  removeFromWishlist: (productId: number | string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshWishlist = async () => {
    if (!currentUser?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getWishlist(currentUser.id);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      refreshWishlist();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, currentUser?.id]);

  const isInWishlist = (productId: number | string): boolean => {
    return items.some((item) => String(item.productId || item.product?.id) === String(productId));
  };

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    if (!isAuthenticated || !currentUser?.id) {
      showToast('Please sign in to save items to your wishlist.', 'info');
      openAuthModal('login');
      return false;
    }

    const alreadyIn = isInWishlist(product.id);

    try {
      if (alreadyIn) {
        await api.removeFromWishlist(currentUser.id, product.id);
        setItems((prev) =>
          prev.filter((it) => String(it.productId || it.product?.id) !== String(product.id))
        );
        showToast(`Removed from wishlist.`, 'info');
        return false;
      } else {
        await api.addToWishlist(currentUser.id, product.id);
        setItems((prev) => [
          ...prev,
          {
            userId: currentUser.id,
            productId: product.id,
            product,
          },
        ]);
        showToast(`Added to wishlist.`, 'success');
        return true;
      }
    } catch (err: any) {
      showToast(err.message || 'Could not update wishlist.', 'error');
      return alreadyIn;
    }
  };

  const removeFromWishlist = async (productId: number | string): Promise<boolean> => {
    if (!currentUser?.id) return false;

    try {
      await api.removeFromWishlist(currentUser.id, productId);
      setItems((prev) =>
        prev.filter((it) => String(it.productId || it.product?.id) !== String(productId))
      );
      showToast('Item removed from wishlist.', 'info');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove from wishlist.', 'error');
      return false;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount: items.length,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}

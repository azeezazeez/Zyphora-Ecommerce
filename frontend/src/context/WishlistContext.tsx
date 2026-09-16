import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api } from '../services/api';
import { Product, WishlistItem } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistContextValue {
  items: WishlistItem[];
  wishlistCount: number;
  loading: boolean;
  isInWishlist: (
    productId: number | string
  ) => boolean;
  toggleWishlist: (
    product: Product
  ) => Promise<boolean>;
  removeFromWishlist: (
    productId: number | string
  ) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext =
  createContext<
    WishlistContextValue | undefined
  >(undefined);

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    currentUser,
    isAuthenticated,
    openAuthModal,
  } = useAuth();

  const { showToast } = useToast();

  const [items, setItems] =
    useState<WishlistItem[]>([]);

  const [loading, setLoading] =
    useState<boolean>(false);

  // Prevent multiple simultaneous wishlist operations.
  const [updatingProducts, setUpdatingProducts] =
    useState<Set<string>>(
      new Set()
    );

  // =============================================================
  // REFRESH WISHLIST
  // =============================================================

  const refreshWishlist =
    async (): Promise<void> => {
      if (!currentUser?.id) {
        setItems([]);
        return;
      }

      setLoading(true);

      try {
        const data =
          await api.getWishlist(
            currentUser.id
          );

        setItems(
          Array.isArray(data)
            ? data
            : []
        );
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

  // =============================================================
  // INITIAL LOAD
  // =============================================================

  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser?.id
    ) {
      refreshWishlist();
    } else {
      setItems([]);
    }
  }, [
    isAuthenticated,
    currentUser?.id,
  ]);

  // =============================================================
  // CHECK WISHLIST
  // =============================================================

  const isInWishlist = (
    productId: number | string
  ): boolean => {
    const normalizedId =
      String(productId);

    return items.some(
      (item) =>
        String(
          item.productId ??
            item.product?.id
        ) === normalizedId
    );
  };

  // =============================================================
  // SET PRODUCT LOADING
  // =============================================================

  const setProductUpdating = (
    productId: number | string,
    updating: boolean
  ) => {
    const id = String(productId);

    setUpdatingProducts(
      (previous) => {
        const next =
          new Set(previous);

        if (updating) {
          next.add(id);
        } else {
          next.delete(id);
        }

        return next;
      }
    );
  };

  // =============================================================
  // TOGGLE WISHLIST
  // =============================================================

  const toggleWishlist = async (
    product: Product
  ): Promise<boolean> => {
    if (
      !isAuthenticated ||
      !currentUser?.id
    ) {
      showToast(
        'Please sign in to save items to your wishlist.',
        'info'
      );

      openAuthModal('login');

      return false;
    }

    const productId =
      String(product.id);

    /*
     * Prevent duplicate clicks while the
     * current request is still running.
     */
    if (
      updatingProducts.has(productId)
    ) {
      return isInWishlist(
        product.id
      );
    }

    const alreadyInWishlist =
      isInWishlist(product.id);

    setProductUpdating(
      product.id,
      true
    );

    try {
      // =========================================================
      // REMOVE
      // =========================================================

      if (alreadyInWishlist) {
        await api.removeFromWishlist(
          currentUser.id,
          product.id
        );

        /*
         * Backend succeeded.
         *
         * Update local state only.
         * No second GET request.
         */
        setItems(
          (previous) =>
            previous.filter(
              (item) =>
                String(
                  item.productId ??
                    item.product?.id
                ) !== productId
            )
        );

        showToast(
          'Removed from wishlist.',
          'info'
        );

        return false;
      }

      // =========================================================
      // ADD
      // =========================================================

      await api.addToWishlist(
        currentUser.id,
        product.id
      );

      /*
       * Backend succeeded.
       *
       * Update local state only.
       * No second GET request.
       */
      setItems(
        (previous) => {
          /*
           * Extra protection against duplicate
           * local entries.
           */
          const alreadyExists =
            previous.some(
              (item) =>
                String(
                  item.productId ??
                    item.product?.id
                ) === productId
            );

          if (alreadyExists) {
            return previous;
          }

          const newItem: WishlistItem =
            {
              userId:
                currentUser.id,
              productId:
                product.id,
              product,
            };

          return [
            ...previous,
            newItem,
          ];
        }
      );

      showToast(
        'Added to wishlist.',
        'success'
      );

      return true;
    } catch (err: any) {
      /*
       * The local state was only changed after
       * the backend operation succeeded, so there
       * is nothing to roll back here.
       */
      showToast(
        err.message ||
          'Could not update wishlist.',
        'error'
      );

      return alreadyInWishlist;
    } finally {
      setProductUpdating(
        product.id,
        false
      );
    }
  };

  // =============================================================
  // REMOVE FROM WISHLIST
  // =============================================================

  const removeFromWishlist =
    async (
      productId: number | string
    ): Promise<boolean> => {
      if (!currentUser?.id) {
        return false;
      }

      const normalizedId =
        String(productId);

      if (
        updatingProducts.has(
          normalizedId
        )
      ) {
        return false;
      }

      setProductUpdating(
        productId,
        true
      );

      try {
        await api.removeFromWishlist(
          currentUser.id,
          productId
        );

        /*
         * Remove locally.
         * No refreshWishlist() call.
         */
        setItems(
          (previous) =>
            previous.filter(
              (item) =>
                String(
                  item.productId ??
                    item.product?.id
                ) !== normalizedId
            )
        );

        showToast(
          'Item removed from wishlist.',
          'info'
        );

        return true;
      } catch (err: any) {
        showToast(
          err.message ||
            'Failed to remove from wishlist.',
          'error'
        );

        return false;
      } finally {
        setProductUpdating(
          productId,
          false
        );
      }
    };

  // =============================================================
  // PROVIDER
  // =============================================================

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount:
          items.length,
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

// =============================================================
// HOOK
// =============================================================

export function useWishlist():
  WishlistContextValue {
  const ctx =
    useContext(
      WishlistContext
    );

  if (!ctx) {
    throw new Error(
      'useWishlist must be used within a WishlistProvider'
    );
  }

  return ctx;
}

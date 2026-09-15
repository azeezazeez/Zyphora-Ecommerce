import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: number | string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: number | string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isItemInCart: (productId: number | string) => boolean;
  getItemQuantity: (productId: number | string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const refreshCart = async () => {
    if (!currentUser?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getCart(currentUser.id);
      const cartItems = (res?.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId || item.product?.id,
        product: item.product,
        name: item.name || item.product?.name,
        price: Number(item.price ?? item.product?.price ?? 0),
        image: item.image || item.product?.image,
        category: item.category || item.product?.category,
        quantity: Number(item.quantity || 1),
        subtotal: Number(item.subtotal ?? (Number(item.price ?? item.product?.price ?? 0) * Number(item.quantity || 1))),
      }));
      setItems(cartItems);
    } catch {
      // If error or 404
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      refreshCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, currentUser?.id]);

  const addToCart = async (product: Product, quantity = 1): Promise<boolean> => {
    if (!isAuthenticated || !currentUser?.id) {
      showToast('Please sign in to add items to your cart.', 'info');
      openAuthModal('login');
      return false;
    }

    try {
      await api.addToCart(currentUser.id, product.id, quantity);
      await refreshCart();
      showToast(`Added ${product.name} to cart.`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Unable to add item to cart.', 'error');
      return false;
    }
  };

  const updateQuantity = async (productId: number | string, quantity: number): Promise<boolean> => {
    if (!currentUser?.id) return false;

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    try {
      await api.updateCart(currentUser.id, productId, quantity);
      await refreshCart();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update quantity.', 'error');
      return false;
    }
  };

  const removeFromCart = async (productId: number | string): Promise<boolean> => {
    if (!currentUser?.id) return false;

    try {
      await api.removeFromCart(currentUser.id, productId);
      setItems((prev) => prev.filter((it) => String(it.productId) !== String(productId)));
      showToast('Item removed from cart.', 'info');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item.', 'error');
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!currentUser?.id) return false;

    try {
      await api.clearCart(currentUser.id);
      setItems([]);
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to clear cart.', 'error');
      return false;
    }
  };

  const isItemInCart = (productId: number | string): boolean => {
    return items.some((it) => String(it.productId) === String(productId));
  };

  const getItemQuantity = (productId: number | string): number => {
    const it = items.find((item) => String(item.productId) === String(productId));
    return it ? it.quantity : 0;
  };

  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartTotal = items.reduce(
    (sum, item) => sum + (item.price || item.product?.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartTotal,
        loading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        isItemInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

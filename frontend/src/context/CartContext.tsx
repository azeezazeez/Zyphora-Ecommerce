import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
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
  addToCart: (
    product: Product,
    quantity?: number
  ) => Promise<boolean>;
  updateQuantity: (
    productId: number | string,
    quantity: number
  ) => Promise<boolean>;
  removeFromCart: (
    productId: number | string
  ) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isItemInCart: (
    productId: number | string
  ) => boolean;
  getItemQuantity: (
    productId: number | string
  ) => number;
}

const CartContext =
  createContext<CartContextValue | undefined>(
    undefined
  );

export function CartProvider({
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

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] =
    useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] =
    useState<boolean>(false);

  // =============================================================
  // NORMALIZE CART ITEM
  // =============================================================

  const normalizeCartItem = (
    item: any
  ): CartItem => {
    const price = Number(
      item.price ??
        item.product?.price ??
        0
    );

    const quantity = Number(
      item.quantity || 1
    );

    return {
      id: item.id,
      productId:
        item.productId ??
        item.product?.id,
      product: item.product,
      name:
        item.name ??
        item.product?.name,
      price,
      image:
        item.image ??
        item.product?.image,
      category:
        item.category ??
        item.product?.category,
      quantity,
      subtotal: Number(
        item.subtotal ??
          price * quantity
      ),
    };
  };

  // =============================================================
  // REFRESH CART
  // =============================================================

  const refreshCart = async (): Promise<void> => {
    if (!currentUser?.id) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const res =
        await api.getCart(
          currentUser.id
        );

      const cartItems = (
        res?.items || []
      ).map(normalizeCartItem);

      setItems(cartItems);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // INITIAL CART LOAD
  // =============================================================

  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser?.id
    ) {
      refreshCart();
    } else {
      setItems([]);
    }
  }, [
    isAuthenticated,
    currentUser?.id,
  ]);

  // =============================================================
  // ADD TO CART
  // =============================================================

  const addToCart = async (
    product: Product,
    quantity = 1
  ): Promise<boolean> => {
    if (
      !isAuthenticated ||
      !currentUser?.id
    ) {
      showToast(
        'Please sign in to add items to your cart.',
        'info'
      );

      openAuthModal('login');

      return false;
    }

    if (quantity <= 0) {
      return false;
    }

    try {
      /*
       * Only ONE backend request.
       *
       * Previously:
       *
       * POST /cart/add
       *       +
       * GET /cart/{userId}
       *
       * Now we update React state locally after
       * the successful POST.
       */
      await api.addToCart(
        currentUser.id,
        product.id,
        quantity
      );

      setItems((prevItems) => {
        const productId =
          String(product.id);

        const existingIndex =
          prevItems.findIndex(
            (item) =>
              String(
                item.productId
              ) === productId
          );

        // ---------------------------------------------------------
        // Existing cart item
        // ---------------------------------------------------------

        if (existingIndex !== -1) {
          return prevItems.map(
            (item, index) => {
              if (
                index !==
                existingIndex
              ) {
                return item;
              }

              const newQuantity =
                Number(
                  item.quantity || 1
                ) + quantity;

              const price = Number(
                item.price ??
                  product.price ??
                  0
              );

              return {
                ...item,
                quantity:
                  newQuantity,
                subtotal:
                  price *
                  newQuantity,
              };
            }
          );
        }

        // ---------------------------------------------------------
        // New cart item
        // ---------------------------------------------------------

        const price = Number(
          product.price || 0
        );

        const newItem: CartItem = {
          id: `local-${product.id}`,
          productId: product.id,
          product,
          name: product.name,
          price,
          image: product.image,
          category:
            product.category,
          quantity,
          subtotal:
            price * quantity,
        };

        return [
          ...prevItems,
          newItem,
        ];
      });

      showToast(
        `Added ${product.name} to cart.`,
        'success'
      );

      return true;
    } catch (err: any) {
      showToast(
        err.message ||
          'Unable to add item to cart.',
        'error'
      );

      return false;
    }
  };

  // =============================================================
  // UPDATE QUANTITY
  // =============================================================

  const updateQuantity = async (
    productId: number | string,
    quantity: number
  ): Promise<boolean> => {
    if (!currentUser?.id) {
      return false;
    }

    if (quantity <= 0) {
      return removeFromCart(
        productId
      );
    }

    try {
      /*
       * Only one backend request.
       */
      await api.updateCart(
        currentUser.id,
        productId,
        quantity
      );

      /*
       * Update local state immediately.
       */
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (
            String(
              item.productId
            ) !==
            String(productId)
          ) {
            return item;
          }

          const price = Number(
            item.price ??
              item.product?.price ??
              0
          );

          return {
            ...item,
            quantity,
            subtotal:
              price * quantity,
          };
        })
      );

      return true;
    } catch (err: any) {
      showToast(
        err.message ||
          'Failed to update quantity.',
        'error'
      );

      return false;
    }
  };

  // =============================================================
  // REMOVE FROM CART
  // =============================================================

  const removeFromCart = async (
    productId: number | string
  ): Promise<boolean> => {
    if (!currentUser?.id) {
      return false;
    }

    try {
      await api.removeFromCart(
        currentUser.id,
        productId
      );

      /*
       * No GET /cart request needed.
       *
       * Remove locally.
       */
      setItems((prevItems) =>
        prevItems.filter(
          (item) =>
            String(
              item.productId
            ) !==
            String(productId)
        )
      );

      showToast(
        'Item removed from cart.',
        'info'
      );

      return true;
    } catch (err: any) {
      showToast(
        err.message ||
          'Failed to remove item from cart.',
        'error'
      );

      return false;
    }
  };

  // =============================================================
  // CLEAR CART
  // =============================================================

  const clearCart = async (): Promise<boolean> => {
    if (!currentUser?.id) {
      return false;
    }

    try {
      await api.clearCart(
        currentUser.id
      );

      /*
       * Clear local state immediately.
       */
      setItems([]);

      return true;
    } catch (err: any) {
      showToast(
        err.message ||
          'Failed to clear cart.',
        'error'
      );

      return false;
    }
  };

  // =============================================================
  // CHECK ITEM
  // =============================================================

  const isItemInCart = (
    productId: number | string
  ): boolean => {
    return items.some(
      (item) =>
        String(
          item.productId
        ) === String(productId)
    );
  };

  // =============================================================
  // GET ITEM QUANTITY
  // =============================================================

  const getItemQuantity = (
    productId: number | string
  ): number => {
    const item = items.find(
      (cartItem) =>
        String(
          cartItem.productId
        ) === String(productId)
    );

    return item
      ? Number(item.quantity || 0)
      : 0;
  };

  // =============================================================
  // CART TOTALS
  // =============================================================

  const cartCount = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 1),
    0
  );

  const cartTotal = items.reduce(
    (sum, item) =>
      sum +
      Number(
        item.price ??
          item.product?.price ??
          0
      ) *
        Number(item.quantity || 1),
    0
  );

  // =============================================================
  // PROVIDER
  // =============================================================

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

// =============================================================
// HOOK
// =============================================================

export function useCart(): CartContextValue {
  const ctx =
    useContext(CartContext);

  if (!ctx) {
    throw new Error(
      'useCart must be used within a CartProvider'
    );
  }

  return ctx;
}

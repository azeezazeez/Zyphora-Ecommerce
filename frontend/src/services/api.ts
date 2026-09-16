import {
  ApiResponse,
  CartResponse,
  Customer,
  Order,
  OrderStats,
  Product,
  User,
  WishlistItem,
} from '../types';

export const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_BASE_URL as string) ||
  'https://cartify-web-application.onrender.com/api';

export const AUTH_STORAGE_KEY = 'zyphora_currentUser';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Helper to get stored auth token
export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const user: User = JSON.parse(raw);

    // Check if token is expired if JWT contains exp
    if (user.token) {
      const parts = user.token.split('.');

      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));

          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
          }
        } catch {
          // Ignore JWT decoding errors
        }
      }
    }

    return user;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: User): void {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(user)
  );
}

export function clearStoredUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Core fetch wrapper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }`;

  const currentUser = getStoredUser();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach JWT to authenticated requests
  if (currentUser?.token) {
    headers['Authorization'] = `Bearer ${currentUser.token}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      'Unable to connect to Zyphora backend server. The service might be starting up, please try again.',
      0,
      err
    );
  }

  /*
   * Only remove authentication when the backend explicitly
   * returns 401 Unauthorized.
   *
   * A successful profile update will never reach this block.
   */
  if (response.status === 401) {
    clearStoredUser();

    window.dispatchEvent(
      new CustomEvent('zyphora:unauthorized')
    );

    throw new ApiError(
      'Session expired. Please sign in again.',
      401
    );
  }

  // Try parsing JSON response
  let json: any = null;

  const text = await response.text();

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!response.ok) {
    const errorMsg =
      (json &&
        typeof json === 'object' &&
        (json.message || json.error)) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(
      errorMsg,
      response.status,
      json
    );
  }

  // Unwrap { success: true, data: T } standard payload if present
  if (
    json &&
    typeof json === 'object' &&
    'data' in json &&
    'success' in json
  ) {
    return json.data as T;
  }

  return json as T;
}

export const api = {
  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------

  async register(payload: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ email: string }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyOtp(payload: {
    email: string;
    otp: string;
  }): Promise<any> {
    return request('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<User> {
    const user = await request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (user && user.token) {
      saveStoredUser(user);
    }

    return user;
  },

  async forgotPasswordGenerateOtp(
    email: string
  ): Promise<any> {
    return request('/auth/forgot-password/generate-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async forgotPasswordReset(payload: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<any> {
    return request('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // -------------------------------------------------------------
  // PROFILE
  // -------------------------------------------------------------

  async getProfile(): Promise<User> {
    const profile = await request<User>('/auth/profile');

    /*
     * The backend profile endpoint may return profile information
     * without returning the JWT.
     *
     * Always preserve the currently stored token.
     */
    const currentUser = getStoredUser();

    if (currentUser?.token && profile) {
      const mergedUser: User = {
        ...currentUser,
        ...profile,
        token: currentUser.token,
      };

      saveStoredUser(mergedUser);

      return mergedUser;
    }

    return profile;
  },

  async updateProfile(
    data: Partial<User>
  ): Promise<User> {
    /*
     * Get the currently authenticated user BEFORE making
     * the update request.
     */
    const currentUser = getStoredUser();

    if (!currentUser?.token) {
      throw new ApiError(
        'Your session has expired. Please sign in again.',
        401
      );
    }

    /*
     * Send profile update to backend.
     */
    const updatedProfile = await request<User>(
      '/auth/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    /*
     * IMPORTANT:
     *
     * The backend response may contain only the updated
     * profile fields and NOT the JWT token.
     *
     * Therefore, merge the response with the existing user
     * and explicitly preserve the existing token.
     */
    const updatedUser: User = {
      ...currentUser,
      ...updatedProfile,
      token: currentUser.token,
    };

    /*
     * Save the COMPLETE authenticated user.
     */
    saveStoredUser(updatedUser);

    /*
     * IMPORTANT:
     *
     * Return updatedUser, NOT updatedProfile.
     *
     * This prevents AuthContext from replacing currentUser
     * with an object that has no JWT token.
     */
    return updatedUser;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<any> {
    return request('/auth/profile/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteProfile(): Promise<any> {
    const res = await request('/auth/profile', {
      method: 'DELETE',
    });

    clearStoredUser();

    return res;
  },

  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------

  async getProducts(params?: {
    category?: string;
    search?: string;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();

    if (
      params?.category &&
      params.category !== 'All'
    ) {
      searchParams.append(
        'category',
        params.category
      );
    }

    if (
      params?.search &&
      params.search.trim()
    ) {
      searchParams.append(
        'search',
        params.search.trim()
      );
    }

    const query = searchParams.toString();

    const endpoint = query
      ? `/products?${query}`
      : '/products';

    const products = await request<Product[]>(
      endpoint
    );

    return Array.isArray(products)
      ? products
      : [];
  },

  async getProductById(
    id: string | number
  ): Promise<Product> {
    return request<Product>(
      `/products/${id}`
    );
  },

  // -------------------------------------------------------------
  // CART
  // -------------------------------------------------------------

  async getCart(
    userId: number
  ): Promise<CartResponse> {
    try {
      const response = await request<any>(
        `/cart/${userId}`
      );

      if (Array.isArray(response)) {
        return {
          userId,
          items: response,
          totalQuantity: response.reduce(
            (
              sum: number,
              item: any
            ) =>
              sum +
              (item.quantity || 1),
            0
          ),
          totalPrice: response.reduce(
            (
              sum: number,
              item: any
            ) =>
              sum +
              (
                (
                  item.price ||
                  item.product?.price ||
                  0
                ) *
                (item.quantity || 1)
              ),
            0
          ),
        };
      }

      return {
        ...response,
        items: Array.isArray(
          response?.items
        )
          ? response.items
          : [],
      };
    } catch (err: any) {
      // If 404 or empty cart
      if (err.status === 404) {
        return {
          userId,
          items: [],
          totalPrice: 0,
          totalQuantity: 0,
        };
      }

      throw err;
    }
  },

  async addToCart(
    userId: number,
    productId: string | number,
    quantity = 1
  ): Promise<any> {
    return request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        productId: String(productId),
        quantity,
      }),
    });
  },

  async updateCart(
    userId: number,
    productId: string | number,
    quantity: number
  ): Promise<any> {
    return request('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({
        userId,
        productId: String(productId),
        quantity,
      }),
    });
  },

  async removeFromCart(
    userId: number,
    productId: string | number
  ): Promise<any> {
    return request(
      `/cart/remove/${userId}/${productId}`,
      {
        method: 'DELETE',
      }
    );
  },

  async clearCart(
    userId: number
  ): Promise<any> {
    return request(
      `/cart/clear/${userId}`,
      {
        method: 'DELETE',
      }
    );
  },

  // -------------------------------------------------------------
  // WISHLIST
  // -------------------------------------------------------------

  async getWishlist(
    userId: number
  ): Promise<WishlistItem[]> {
    try {
      const items =
        await request<WishlistItem[]>(
          `/wishlist/${userId}`
        );

      return Array.isArray(items)
        ? items
        : [];
    } catch (err: any) {
      if (err.status === 404) {
        return [];
      }

      throw err;
    }
  },

  async addToWishlist(
    userId: number,
    productId: string | number
  ): Promise<any> {
    return request('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        productId: String(productId),
      }),
    });
  },

  async removeFromWishlist(
    userId: number,
    productId: string | number
  ): Promise<any> {
    return request(
      `/wishlist/remove/${userId}/${productId}`,
      {
        method: 'DELETE',
      }
    );
  },

  async checkInWishlist(
    userId: number,
    productId: string | number
  ): Promise<boolean> {
    try {
      const res =
        await request<
          boolean | { inWishlist: boolean }
        >(
          `/wishlist/${userId}/check/${productId}`
        );

      if (typeof res === 'boolean') {
        return res;
      }

      if (
        res &&
        typeof res === 'object' &&
        'inWishlist' in res
      ) {
        return !!res.inWishlist;
      }

      return false;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------

  async placeOrder(
    userId: number,
    payload: {
      shippingAddress: string;
      paymentMethod: string;
    }
  ): Promise<Order> {
    return request<Order>(
      `/orders/place/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async getUserOrders(
    userId: number
  ): Promise<Order[]> {
    const orders =
      await request<Order[]>(
        `/orders/user/${userId}`
      );

    return Array.isArray(orders)
      ? orders
      : [];
  },

  async getOrderById(
    orderId: string | number
  ): Promise<Order> {
    return request<Order>(
      `/orders/${orderId}`
    );
  },

  async getUserOrderSummary(
    userId: number
  ): Promise<any> {
    return request(
      `/orders/user/${userId}/summary`
    );
  },

  async cancelOrder(
    orderId: string | number
  ): Promise<any> {
    return request(
      `/orders/${orderId}/cancel`,
      {
        method: 'PUT',
      }
    );
  },

  // -------------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------------

  async getAdminOrders(): Promise<Order[]> {
    const orders =
      await request<Order[]>(
        '/admin/orders'
      );

    return Array.isArray(orders)
      ? orders
      : [];
  },

  async getAdminOrderStats(): Promise<OrderStats> {
    return request<OrderStats>(
      '/admin/orders/stats'
    );
  },

  async updateAdminOrderStatus(
    orderId: string | number,
    status: string
  ): Promise<any> {
    return request(
      `/admin/orders/${orderId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
        }),
      }
    );
  },

  async getAdminCustomers(): Promise<Customer[]> {
    const customers =
      await request<Customer[]>(
        '/admin/customers'
      );

    return Array.isArray(customers)
      ? customers
      : [];
  },

  async createAdminProduct(
    productData: Partial<Product>
  ): Promise<Product> {
    return request<Product>(
      '/admin/products',
      {
        method: 'POST',
        body: JSON.stringify(
          productData
        ),
      }
    );
  },

  async updateAdminProduct(
    id: string | number,
    productData: Partial<Product>
  ): Promise<Product> {
    return request<Product>(
      `/admin/products/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(
          productData
        ),
      }
    );
  },

  async deleteAdminProduct(
    id: string | number
  ): Promise<any> {
    return request(
      `/admin/products/${id}`,
      {
        method: 'DELETE',
      }
    );
  },
};

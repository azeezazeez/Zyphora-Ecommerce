export interface Product {
  id: number | string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN' | string;
  token?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id?: number | string;
  productId: number | string;
  product?: Product;
  name?: string;
  price?: number;
  image?: string;
  category?: string;
  quantity: number;
  subtotal?: number;
}

export interface CartResponse {
  id?: number;
  userId?: number;
  items: CartItem[];
  totalPrice?: number;
  totalQuantity?: number;
}

export interface WishlistItem {
  id?: number | string;
  userId?: number;
  productId: number | string;
  product?: Product;
  addedAt?: string;
}

/* =========================
   ORDER TYPES
   ========================= */

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'COD'
  | 'UPI'
  | 'CARD';

export interface OrderItem {
  id?: number | string;
  productId: number | string;
  productName?: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal?: number;
}

export interface Order {
  id: number | string;
  orderNumber?: string;
  orderId?: string;
  userId?: number;

  totalAmount: number;

  status: OrderStatus;

  orderDate?: string;
  createdAt?: string;
  updatedAt?: string;

  items: OrderItem[];

  shippingAddress?: string;

  paymentMethod?: PaymentMethod;
}

/* =========================
   ORDER STATISTICS
   ========================= */

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;

  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;

  recentOrders?: Order[];
}

/* =========================
   CUSTOMER
   ========================= */

export interface Customer {
  id: number;
  email: string;
  username: string;
  role: string;

  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  profileImage?: string;

  createdAt?: string;
  updatedAt?: string;

  orderCount?: number;
}

/* =========================
   API RESPONSE
   ========================= */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

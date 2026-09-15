import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
  RotateCcw,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order, OrderStatus } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export function OrdersPage() {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | string | null>(null);

  const fetchOrders = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserOrders(currentUser.id);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser?.id]);

  const handleCancelOrder = async (orderId: number | string) => {
    if (cancellingId) return;
    setCancellingId(orderId);
    try {
      await api.cancelOrder(orderId);
      showToast('Order was successfully cancelled.', 'info');
      await fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Unable to cancel this order.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Package}
          title="Sign In to View Orders"
          description="Log in to access your order history, delivery tracking, and cancellations."
          actionText="Sign In Now"
          onAction={() => openAuthModal('login')}
        />
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Truck className="w-3.5 h-3.5" /> Shipped
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const isCancellable = (status: OrderStatus) => {
    return ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(status);
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17202A]">Your Orders</h1>
        <p className="text-xs text-[#5F6368]">
          Review order statuses, items, and cancellations tracked in real-time
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E1E5E9] p-6 animate-pulse space-y-4"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-16 bg-gray-100 rounded" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <span>{error}</span>
          <button onClick={fetchOrders} className="font-bold underline">
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="You haven't placed any orders with Zyphora yet. Start exploring our catalog now."
          actionText="Start Shopping"
          actionLink="/shop"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedDate = order.orderDate || order.createdAt
              ? new Date(order.orderDate || order.createdAt!).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent Order';

            return (
              <div
                key={order.id}
                id={`user-order-${order.id}`}
                className="bg-white rounded-xl border border-[#E1E5E9] shadow-2xs overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 bg-[#F8F9FA] border-b border-[#E1E5E9] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-[#8A9199] block text-[10px] uppercase">
                        Order Placed
                      </span>
                      <span className="font-semibold text-[#17202A]">{formattedDate}</span>
                    </div>
                    <div>
                      <span className="text-[#8A9199] block text-[10px] uppercase">Total</span>
                      <span className="font-extrabold text-[#17202A]">
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A9199] block text-[10px] uppercase">Order ID</span>
                      <span className="font-mono font-bold text-[#17202A]">#ORD-{order.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}

                    {isCancellable(order.status) && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 border border-rose-200 px-2.5 py-1 rounded-md hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="p-4 sm:p-5 divide-y divide-gray-100">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 bg-slate-50 rounded-lg border border-[#E1E5E9] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName || 'Order item'}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-[#17202A] truncate">
                              {item.productName || `Product #${item.productId}`}
                            </p>
                            <p className="text-xs text-[#5F6368]">
                              Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-extrabold text-[#17202A]">
                            ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#5F6368] py-2">
                      Order details confirmed with Zyphora warehouse dispatch.
                    </div>
                  )}
                </div>

                {/* Status Timeline */}
                <div className="p-4 bg-slate-50/50 border-t border-[#E1E5E9]">
                  <div className="flex items-center justify-between text-[11px] text-[#5F6368] max-w-md">
                    <span className={order.status !== 'CANCELLED' ? 'font-bold text-indigo-700' : ''}>
                      ✓ Placed
                    </span>
                    <span>→</span>
                    <span
                      className={
                        ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                          ? 'font-bold text-indigo-700'
                          : ''
                      }
                    >
                      Processing
                    </span>
                    <span>→</span>
                    <span
                      className={
                        ['SHIPPED', 'DELIVERED'].includes(order.status)
                          ? 'font-bold text-indigo-700'
                          : ''
                      }
                    >
                      Shipped
                    </span>
                    <span>→</span>
                    <span className={order.status === 'DELIVERED' ? 'font-bold text-emerald-700' : ''}>
                      Delivered
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Package,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';

import { api } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { TableRowSkeleton } from '../../components/common/Skeleton';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export function AdminOrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // FETCH ORDERS
  // -------------------------------------------------------------

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getAdminOrders();

      // Only keep valid orders that have an orderId.
      const validOrders = Array.isArray(data)
        ? data.filter(
            (order) =>
              order &&
              order.orderId !== undefined &&
              order.orderId !== null &&
              String(order.orderId).trim() !== ''
          )
        : [];

      setOrders(validOrders);
    } catch (err: any) {
      console.error('Failed to load admin orders:', err);

      setError(
        err?.message ||
          'Unable to load orders list.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // -------------------------------------------------------------
  // UPDATE ORDER STATUS
  // -------------------------------------------------------------

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    const cleanOrderId = String(orderId).trim();

    // Defensive check — prevents /undefined/status
    if (
      !cleanOrderId ||
      cleanOrderId === 'undefined' ||
      cleanOrderId === 'null'
    ) {
      console.error(
        'Cannot update order status: invalid orderId',
        {
          orderId,
          newStatus,
        }
      );

      showToast(
        'Unable to update order status because the order ID is missing.',
        'error'
      );

      return;
    }

    setUpdatingId(cleanOrderId);

    try {
      await api.updateAdminOrderStatus(
        cleanOrderId,
        newStatus
      );

      showToast(
        `Order #${cleanOrderId} status updated to ${newStatus}.`,
        'success'
      );

      // Update the correct order using orderId.
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === cleanOrderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );
    } catch (err: any) {
      console.error(
        'Failed to update order status:',
        err
      );

      showToast(
        err?.message ||
          'Failed to update order status.',
        'error'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // -------------------------------------------------------------
  // FILTER ORDERS
  // -------------------------------------------------------------

  const filteredOrders = orders.filter(
    (order) => {
      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();

      const matchesStatus =
        statusFilter === 'ALL' ||
        order.status === statusFilter;

      const matchesSearch =
        normalizedSearch === '' ||
        String(order.orderId)
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(order.userId || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(order.customer?.id || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(order.customer?.email || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(order.customer?.username || '')
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesStatus &&
        matchesSearch
      );
    }
  );

  // -------------------------------------------------------------
  // STATUS BADGE
  // -------------------------------------------------------------

  const getStatusBadge = (
    status: OrderStatus
  ) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';

      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 border-blue-200';

      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800 border-purple-200';

      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';

      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';

      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#17202A]">
            Order Management
          </h1>

          <p className="text-xs text-[#5F6368]">
            Update order lifecycle, track logistics status,
            and view customer checkouts
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              loading ? 'animate-spin' : ''
            }`}
          />

          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <span>{error}</span>

          <button
            onClick={fetchOrders}
            className="font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E1E5E9] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Search by order ID or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8A9199] font-medium hidden md:inline">
            Status:
          </span>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg py-1.5 px-3 text-xs font-semibold text-[#17202A] cursor-pointer focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">
              All Statuses ({orders.length})
            </option>

            {STATUS_OPTIONS.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E1E5E9] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E1E5E9] text-[#5F6368] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">
                  Order ID
                </th>

                <th className="py-3.5 px-4">
                  Customer
                </th>

                <th className="py-3.5 px-4">
                  Date
                </th>

                <th className="py-3.5 px-4">
                  Items / Breakdown
                </th>

                <th className="py-3.5 px-4">
                  Total Amount
                </th>

                <th className="py-3.5 px-4">
                  Status
                </th>

                <th className="py-3.5 px-4 text-right">
                  Change Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E1E5E9]">
              {/* Loading */}
              {loading ? (
                <>
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                </>
              ) : filteredOrders.length === 0 ? (
                /* Empty */
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-[#8A9199]"
                  >
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                /* Orders */
                filteredOrders.map((order) => {
                  const cleanOrderId =
                    String(order.orderId).trim();

                  const isUpdating =
                    updatingId === cleanOrderId;

                  const formattedDate =
                    order.orderDate ||
                    order.createdAt
                      ? new Date(
                          order.orderDate ||
                            order.createdAt!
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )
                      : 'N/A';

                  return (
                    <tr
                      key={cleanOrderId}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                        #{cleanOrderId}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 text-[#5F6368]">
                        {order.customer ? (
                          <div>
                            <div className="font-semibold text-[#17202A]">
                              {order.customer.username ||
                                'Customer'}
                            </div>

                            <div className="text-[10px] text-[#8A9199]">
                              {order.customer.email}
                            </div>
                          </div>
                        ) : (
                          `User #${
                            order.userId || 'Guest'
                          }`
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#5F6368] whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-[#17202A]">
                        {order.items &&
                        order.items.length > 0
                          ? order.items
                              .map(
                                (item) =>
                                  `${
                                    item.productName ||
                                    'Item'
                                  } (x${
                                    item.quantity
                                  })`
                              )
                              .join(', ')
                          : 'General Item Order'}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-extrabold text-[#17202A]">
                        ₹
                        {Number(
                          order.totalAmount
                        ).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Change Status */}
                      <td className="py-3.5 px-4 text-right">
                        <select
                          disabled={
                            isUpdating ||
                            !cleanOrderId
                          }
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              cleanOrderId,
                              e.target
                                .value as OrderStatus
                            )
                          }
                          className="bg-[#F8F9FA] border border-[#E1E5E9] rounded-md py-1 px-2 text-xs font-semibold text-[#17202A] cursor-pointer focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
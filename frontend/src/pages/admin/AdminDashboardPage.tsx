import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  CheckCircle2,
  Clock,
  IndianRupee,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { OrderStats } from '../../types';
import { MetricSkeleton, TableRowSkeleton } from '../../components/common/Skeleton';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminOrderStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin stats from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#17202A]">Zyphora Dashboard</h1>
          <p className="text-xs text-[#5F6368]">
            Overview of marketplace metrics, order fulfillment, and recent transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/admin/products"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <span>{error}</span>
          <button onClick={fetchStats} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* Metrics Grid (Only actual backend statistics from GET /api/admin/orders/stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            {/* Total Orders */}
            <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[#5F6368] mb-2">
                <span className="text-xs font-semibold">Total Orders</span>
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-extrabold text-[#17202A]">
                {stats?.totalOrders ?? 0}
              </p>
              <span className="text-[11px] text-[#8A9199]">Cumulative placed orders</span>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[#5F6368] mb-2">
                <span className="text-xs font-semibold">Total Revenue</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-[#17202A]">
                ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">Authoritative gross total</span>
            </div>

            {/* Shipped & Delivered */}
            <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[#5F6368] mb-2">
                <span className="text-xs font-semibold">Fulfillment Success</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-[#17202A]">
                {(stats?.deliveredOrders ?? 0) + (stats?.shippedOrders ?? 0)}
              </p>
              <span className="text-[11px] text-[#8A9199]">
                {stats?.deliveredOrders ?? 0} Delivered • {stats?.shippedOrders ?? 0} In Transit
              </span>
            </div>

            {/* Active Pipeline */}
            <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[#5F6368] mb-2">
                <span className="text-xs font-semibold">Active Queue</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-[#17202A]">
                {(stats?.pendingOrders ?? 0) +
                  (stats?.confirmedOrders ?? 0) +
                  (stats?.processingOrders ?? 0)}
              </p>
              <span className="text-[11px] text-amber-700 font-medium">
                {stats?.pendingOrders ?? 0} Pending • {stats?.processingOrders ?? 0} Processing
              </span>
            </div>
          </>
        )}
      </div>

      {/* Fulfillment Status Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-lg border border-[#E1E5E9] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-600">Pending</span>
          <p className="text-lg font-bold text-[#17202A]">{stats?.pendingOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E1E5E9] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-600">Confirmed</span>
          <p className="text-lg font-bold text-[#17202A]">{stats?.confirmedOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E1E5E9] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-purple-600">Processing</span>
          <p className="text-lg font-bold text-[#17202A]">{stats?.processingOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E1E5E9] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-blue-600">Shipped</span>
          <p className="text-lg font-bold text-[#17202A]">{stats?.shippedOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E1E5E9] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Delivered</span>
          <p className="text-lg font-bold text-[#17202A]">{stats?.deliveredOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E1E5E9] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-rose-600">Cancelled</span>
          <p className="text-lg font-bold text-[#17202A]">{stats?.cancelledOrders ?? 0}</p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-xl border border-[#E1E5E9] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E1E5E9] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#17202A]">Recent Order Activity</h2>
            <p className="text-xs text-[#5F6368]">Orders synchronized from backend</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Manage All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E1E5E9] text-[#5F6368] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer / Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5E9]">
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#17202A]">
                      #ORD-{order.id}
                    </td>
                    <td className="py-3 px-4 text-[#5F6368]">
                      {order.orderDate || order.createdAt
                        ? new Date(order.orderDate || order.createdAt!).toLocaleDateString()
                        : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-[#17202A]">
                      {order.items ? `${order.items.length} items` : `User #${order.userId}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#17202A]">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-[#17202A]">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/admin/orders"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Update
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8A9199]">
                    No recent orders to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

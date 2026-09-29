import React, { useEffect, useState } from 'react';
import { Mail, Phone, RefreshCw, Search, Shield, User, Users } from 'lucide-react';
import { api } from '../../services/api';
import { User as UserType } from '../../types';
import { TableRowSkeleton } from '../../components/common/Skeleton';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminCustomers();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load customer directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.username.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      String(c.id).includes(q) ||
      (c.phoneNumber && c.phoneNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#17202A]">Customer Directory</h1>
          <p className="text-xs text-[#5F6368]">
            Registered accounts, contact information, and role assignments
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <span>{error}</span>
          <button onClick={fetchCustomers} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-[#E1E5E9] shadow-2xs">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-[#E1E5E9] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E1E5E9] text-[#5F6368] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4 text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5E9]">
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8A9199]">
                    No registered customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                      #{c.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-[#17202A] font-bold text-xs flex items-center justify-center">
                          {c.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-semibold text-[#17202A]">{c.username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#5F6368]">{c.email}</td>
                    <td className="py-3.5 px-4 text-[#5F6368]">
                      {c.phoneNumber || 'Not provided'}
                    </td>
                    <td className="py-3.5 px-4 text-[#5F6368] max-w-xs truncate">
                      {[c.city, c.state, c.country].filter(Boolean).join(', ') || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {c.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

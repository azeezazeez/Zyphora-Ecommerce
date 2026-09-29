import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Boxes,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AccessDeniedPage } from '../AccessDeniedPage';

export function AdminLayout() {
  const { currentUser, isAdmin, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isAdmin) {
    return <AccessDeniedPage />;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Products', path: '/admin/products', icon: Boxes },
    { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Customers', path: '/admin/customers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F7] text-[#17202A] flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E1E5E9] shadow-2xs">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-15">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-xs">
                Z
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-[#17202A]">
                  ZYPHORA ADMIN
                </span>
                <span className="text-[10px] text-[#8A9199] font-medium -mt-1">
                  Enterprise Management Console
                </span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#E1E5E9] text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#17202A] hover:bg-slate-100 rounded-lg transition-colors border border-[#E1E5E9]"
            >
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Return to</span> Store
            </Link>

            <div className="h-4 w-px bg-[#E1E5E9]" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                {currentUser?.username?.[0] || 'A'}
              </div>
              <div className="hidden md:flex flex-col text-xs leading-tight">
                <span className="font-bold text-[#17202A]">{currentUser?.username}</span>
                <span className="text-[10px] text-[#8A9199]">Administrator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dense Admin Tabs (Professional business software style) */}
        <div className="px-4 sm:px-6 lg:px-8 border-t border-[#E1E5E9] bg-[#F8F9FA] flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-md'
                    : 'border-transparent text-[#5F6368] hover:text-[#17202A] hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Main Admin View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Admin Footer */}
      <footer className="bg-white border-t border-[#E1E5E9] py-3 text-center text-[11px] text-[#8A9199]">
        ZYPHORA Admin Console • Spring Boot Backend Engine • Authorized Operations
      </footer>
    </div>
  );
}

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { AuthModal } from '../auth/AuthModal';
import { ToastContainer } from './ToastContainer';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC] text-[#17202A] selection:bg-indigo-500 selection:text-white">
      {/* Global Header */}
      <Header />

      {/* Main Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Global Marketplace Footer */}
      <Footer />

      {/* Global Slideover Cart & Authentication Modals */}
      <CartDrawer />
      <AuthModal />
      <ToastContainer />
    </div>
  );
}

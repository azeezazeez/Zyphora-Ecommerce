import React from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { AuthModal } from '../auth/AuthModal';
import { ToastContainer } from './ToastContainer';
import { AIChatbot } from '../ai/AIChatbot';

export function Layout() {
  return (
    <div
      className="
        min-h-screen
        w-full
        max-w-full
        overflow-x-hidden
        flex
        flex-col
        bg-[#FAFBFC]
        text-[#17202A]
        selection:bg-indigo-500
        selection:text-white
      "
    >
      <Header />

      <main
        className="
          flex-1
          w-full
          max-w-7xl
          mx-auto
          min-w-0
          px-3
          sm:px-6
          lg:px-8
          py-4
          sm:py-6
        "
      >
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />
      <AuthModal />
      <ToastContainer />

      <AIChatbot />
    </div>
  );
}
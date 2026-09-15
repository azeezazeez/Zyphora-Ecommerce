import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, CreditCard, ShieldCheck, Truck } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-[#E1E5E9] text-xs text-[#5F6368] mt-16">
      {/* Back to top banner */}
      <button
        id="footer-back-to-top-btn"
        onClick={scrollToTop}
        className="w-full py-3 bg-[#F8F9FA] hover:bg-slate-200 text-[#17202A] text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1 border-b border-[#E1E5E9]"
      >
        <ArrowUp className="w-3.5 h-3.5" /> Back to Top
      </button>

      {/* Trust & Guarantees bar */}
      <div className="border-b border-[#E1E5E9] bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#17202A]">Fast Delivery</p>
                <p className="text-[11px] text-[#8A9199]">Express door-to-door dispatch</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#17202A]">Cash on Delivery</p>
                <p className="text-[11px] text-[#8A9199]">Pay when your package arrives</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#17202A]">100% Genuine</p>
                <p className="text-[11px] text-[#8A9199]">Authentic verified products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                Z
              </div>
              <span className="text-base font-extrabold text-[#17202A] tracking-tight">ZYPHORA</span>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed mb-4">
              Your trusted marketplace for electronics, fashion, home goods, and lifestyle essentials.
            </p>
            <p className="text-[11px] text-[#8A9199]">
              Engineered with modern web architecture and seamless backend synchronization.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17202A] mb-3 text-xs uppercase tracking-wider">
              Explore Catalog
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="hover:text-indigo-600 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Electronics" className="hover:text-indigo-600 transition-colors">
                  Electronics & Tech
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Fashion" className="hover:text-indigo-600 transition-colors">
                  Fashion & Apparel
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Home%20%26%20Kitchen" className="hover:text-indigo-600 transition-colors">
                  Home & Kitchen
                </Link>
              </li>
              <li>
                <Link to="/shop?filter=new" className="hover:text-indigo-600 transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#17202A] mb-3 text-xs uppercase tracking-wider">
              Customer Care
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/profile" className="hover:text-indigo-600 transition-colors">
                  Your Account Details
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-indigo-600 transition-colors">
                  Saved Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#17202A] mb-3 text-xs uppercase tracking-wider">
              Zyphora Business
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="hover:text-indigo-600 transition-colors cursor-pointer">
                  API & Developer Info
                </span>
              </li>
              <li>
                <span className="hover:text-indigo-600 transition-colors cursor-pointer">
                  Privacy Notice
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#E1E5E9] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8A9199]">
          <p>© 2026 ZYPHORA, Inc. or its affiliates. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#17202A] cursor-pointer">Conditions of Use</span>
            <span className="hover:text-[#17202A] cursor-pointer">Privacy Notice</span>
            <span className="hover:text-[#17202A] cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

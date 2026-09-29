import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

export function CartPage() {
  const navigate = useNavigate();
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is empty"
          description="Looks like you haven't added anything to your cart yet. Check out our latest products and deals."
          actionText="Explore Marketplace"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#17202A]">Shopping Cart</h1>
          <p className="text-xs text-[#5F6368]">
            Review your {cartCount} {cartCount === 1 ? 'item' : 'items'} before proceeding to checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 self-start sm:self-auto flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      {/* Main Grid: Items + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#E1E5E9] divide-y divide-[#E1E5E9] shadow-2xs">
            {items.map((item) => (
              <div
                key={item.id || item.productId}
                className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F8F9FA] rounded-xl border border-[#E1E5E9] p-2 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80'
                      }
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                      {item.category || 'Zyphora'}
                    </span>
                    <Link
                      to={`/product/${item.productId}`}
                      className="text-sm sm:text-base font-bold text-[#17202A] hover:text-indigo-600 transition-colors line-clamp-1 block"
                    >
                      {item.name || 'Marketplace Product'}
                    </Link>
                    <p className="text-xs text-[#5F6368]">
                      Unit Price: ₹{(item.price || 0).toLocaleString('en-IN')}
                    </p>
                    <span className="inline-block text-[11px] text-emerald-600 font-semibold">
                      In Stock & ready to ship
                    </span>
                  </div>
                </div>

                {/* Controls & Subtotal */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="text-right">
                    <span className="text-[10px] text-[#8A9199] block">Item Total</span>
                    <span className="text-base font-extrabold text-[#17202A]">
                      ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#E1E5E9] rounded-lg bg-[#F8F9FA]">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:text-indigo-600 text-[#5F6368] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-[#17202A] min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:text-indigo-600 text-[#5F6368] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-4 shadow-2xs">
          <h2 className="font-bold text-base text-[#17202A] pb-3 border-b border-[#E1E5E9]">
            Order Summary
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#5F6368]">
              <span>Items Total ({cartCount})</span>
              <span className="font-semibold text-[#17202A]">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-[#5F6368]">
              <span>Delivery Charges</span>
              <span className="text-emerald-600 font-semibold">FREE (Express)</span>
            </div>
            <div className="flex justify-between text-[#5F6368]">
              <span>Estimated Tax</span>
              <span>Included</span>
            </div>
            <div className="border-t border-[#E1E5E9] pt-2 flex justify-between text-base font-extrabold text-[#17202A]">
              <span>Total Amount</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Eligible for Free Express Dispatch & Cash on Delivery.</span>
          </div>

          <button
            id="cart-proceed-checkout-btn"
            onClick={handleCheckout}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-[#8A9199] text-center">
            By proceeding, you agree to Zyphora's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

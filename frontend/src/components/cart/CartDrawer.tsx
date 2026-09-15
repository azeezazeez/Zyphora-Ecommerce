import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export function CartDrawer() {
  const navigate = useNavigate();
  const { items, cartCount, cartTotal, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#E1E5E9] flex items-center justify-between bg-[#F8F9FA]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-[#17202A]">Shopping Cart</h3>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              id="close-cart-drawer"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#5F6368] hover:text-[#17202A] rounded-lg hover:bg-slate-200 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="font-bold text-[#17202A] text-base mb-1">Your cart is empty</h4>
                <p className="text-xs text-[#5F6368] mb-5 max-w-xs">
                  Discover top picks across tech, fashion, and home essentials.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id || item.productId}
                  className="flex gap-3 p-3 bg-white rounded-xl border border-[#E1E5E9] shadow-2xs hover:border-slate-300 transition-colors"
                >
                  {/* Image */}
                  <div className="w-20 h-20 bg-slate-50 rounded-lg shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center p-1">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-indigo-600 block">
                        {item.category || 'Product'}
                      </span>
                      <h4 className="text-xs font-bold text-[#17202A] line-clamp-1">
                        {item.name || 'Zyphora Item'}
                      </h4>
                      <p className="text-sm font-extrabold text-[#17202A] mt-0.5">
                        ₹{(item.price || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-[#E1E5E9] rounded-md bg-[#F8F9FA]">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:text-indigo-600 text-[#5F6368] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#17202A] min-w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:text-indigo-600 text-[#5F6368] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Subtotal & Checkout */}
          {items.length > 0 && (
            <div className="p-4 border-t border-[#E1E5E9] bg-[#F8F9FA] space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#5F6368]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#17202A]">
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#5F6368]">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-semibold">FREE (Express)</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#17202A] pt-1 border-t border-[#E1E5E9]">
                  <span>Estimated Total</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  id="cart-drawer-checkout-btn"
                  onClick={handleCheckoutClick}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 px-4 bg-white hover:bg-slate-100 text-[#17202A] border border-[#E1E5E9] font-semibold text-xs rounded-lg transition-colors text-center block"
                >
                  View Full Cart
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

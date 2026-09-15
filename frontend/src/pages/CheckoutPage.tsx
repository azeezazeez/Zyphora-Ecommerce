import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order } from '../types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();

  // Address inputs initialized from user profile if available
  const [fullName, setFullName] = useState(currentUser?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [addressLine, setAddressLine] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [stateName, setStateName] = useState(currentUser?.state || '');
  const [zipCode, setZipCode] = useState(currentUser?.zipCode || '');

  // Payment selection
  const [paymentMethod, setPaymentMethod] = useState<'COD'>('COD');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  if (!isAuthenticated || !currentUser?.id) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#E1E5E9] rounded-2xl text-center shadow-xs">
        <Lock className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#17202A] mb-1">Sign In Required</h2>
        <p className="text-xs text-[#5F6368] mb-4">
          Please sign in to your Zyphora account to complete checkout.
        </p>
        <Link
          to="/"
          className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // If order was successfully placed, display the official receipt
  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 bg-white border border-[#E1E5E9] rounded-2xl shadow-sm space-y-6 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 stroke-[2]" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Order Placed Successfully
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17202A]">
            Thank You For Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368]">
            Your order has been recorded in the Zyphora backend system.
          </p>
        </div>

        {/* Order Details Receipt Box */}
        <div className="bg-[#F8F9FA] rounded-xl border border-[#E1E5E9] p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-[#E1E5E9]">
            <span className="text-[#5F6368]">Order Reference:</span>
            <span className="font-bold text-[#17202A] font-mono text-sm">
              #ORD-{placedOrder.id}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#5F6368]">Current Status:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
              {placedOrder.status || 'CONFIRMED'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#5F6368]">Payment Method:</span>
            <span className="font-semibold text-[#17202A]">Cash on Delivery (COD)</span>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-[#E1E5E9]">
            <span className="text-sm font-bold text-[#17202A]">Total Amount:</span>
            <span className="text-base font-extrabold text-[#17202A]">
              ₹{Number(placedOrder.totalAmount || cartTotal).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 text-left flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            An official order confirmation email has been dispatched by the Zyphora Email Service to{' '}
            <strong>{currentUser.email}</strong>.
          </span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            View Your Orders
          </Link>
          <Link
            to="/shop"
            className="px-6 py-2.5 bg-white border border-[#E1E5E9] hover:bg-slate-50 text-[#17202A] text-xs font-bold rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#E1E5E9] rounded-2xl text-center shadow-xs">
        <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#17202A] mb-1">Your Cart is Empty</h2>
        <p className="text-xs text-[#5F6368] mb-4">Add products to your cart before proceeding to checkout.</p>
        <Link
          to="/shop"
          className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim() || !city.trim()) {
      showToast('Please provide a complete delivery address.', 'error');
      return;
    }

    const compiledAddress = [
      fullName.trim() && `Name: ${fullName.trim()}`,
      phoneNumber.trim() && `Phone: ${phoneNumber.trim()}`,
      addressLine.trim(),
      city.trim(),
      stateName.trim(),
      zipCode.trim() && `PIN: ${zipCode.trim()}`,
    ]
      .filter(Boolean)
      .join(', ');

    setSubmitting(true);
    try {
      const order = await api.placeOrder(currentUser.id, {
        shippingAddress: compiledAddress,
        paymentMethod: 'COD',
      });
      // Clear cart locally and via context
      await clearCart();
      setPlacedOrder(order);
      showToast('Order successfully confirmed!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#E1E5E9]">
        <Link to="/cart" className="p-1 hover:text-indigo-600 text-[#5F6368]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#17202A]">Secure Checkout</h1>
          <p className="text-xs text-[#5F6368]">
            Finalize your shipping address and order confirmation
          </p>
        </div>
      </div>

      {/* Main Grid: Form + Summary */}
      <form onSubmit={handlePlaceOrderSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Shipping Details & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E1E5E9]">
              <Truck className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-[#17202A]">1. Delivery Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Recipient Name"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#17202A] mb-1">
                  Street Address / House No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Flat / Building, Street, Landmark"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">State / Province</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="State"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="110001"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E1E5E9]">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-[#17202A]">2. Payment Method</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="block text-xs font-bold text-[#17202A]">
                    Cash on Delivery (COD)
                  </span>
                  <p className="text-[11px] text-[#5F6368] mt-0.5 leading-relaxed">
                    Pay with cash or UPI at your doorstep when the delivery partner hands over your package.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Order Review & Place Order CTA */}
        <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-4 shadow-2xs">
          <h3 className="font-bold text-sm text-[#17202A] pb-2 border-b border-[#E1E5E9]">
            Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h3>

          {/* Mini items list */}
          <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id || item.productId} className="flex justify-between items-center text-xs pt-2">
                <div className="truncate pr-2">
                  <span className="font-semibold text-[#17202A] block truncate">{item.name}</span>
                  <span className="text-[10px] text-[#8A9199]">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-[#17202A] shrink-0">
                  ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E1E5E9] pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-[#5F6368]">
              <span>Items Subtotal</span>
              <span className="font-semibold text-[#17202A]">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-[#5F6368]">
              <span>Delivery</span>
              <span className="text-emerald-600 font-semibold">FREE</span>
            </div>
            <div className="border-t border-[#E1E5E9] pt-2 flex justify-between text-base font-extrabold text-[#17202A]">
              <span>Amount Payable</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            id="place-order-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
          </button>

          <p className="text-[11px] text-[#8A9199] text-center">
            Authoritative order calculation performed directly by the Zyphora backend.
          </p>
        </div>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  WalletCards,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order } from '../types';

type PaymentMethod = 'COD' | 'UPI' | 'CARD';

const ALLOWED_PAYMENT_METHODS: readonly PaymentMethod[] = [
  'COD',
  'UPI',
  'CARD',
];

const MAX_NAME_LENGTH = 60;
const MAX_ADDRESS_LENGTH = 200;
const MAX_CITY_LENGTH = 60;
const MAX_STATE_LENGTH = 60;
const MAX_PHONE_DIGITS = 15;
const MIN_PHONE_DIGITS = 10;
const PIN_LENGTH = 6;

/* ============================================================
   GENERIC HELPERS
============================================================ */

const normalizeSpaces = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const isAllowedPaymentMethod = (
  value: string
): value is PaymentMethod => {
  return ALLOWED_PAYMENT_METHODS.includes(
    value as PaymentMethod
  );
};

/* ============================================================
   LUHN CHECKSUM
============================================================ */

const isValidLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');

  if (!/^\d+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);

    if (shouldDouble) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/* ============================================================
   UPI VALIDATION
============================================================ */

const isValidUpiId = (value: string): boolean => {
  const upi = value.trim();

  if (!upi) {
    return false;
  }

  // UPI IDs must never contain whitespace.
  if (/\s/.test(upi)) {
    return false;
  }

  // Exactly one @ is required.
  const atCount = (upi.match(/@/g) || []).length;

  if (atCount !== 1) {
    return false;
  }

  const [localPart, handle] = upi.split('@');

  if (!localPart || !handle) {
    return false;
  }

  // Reasonable client-side VPA length limits.
  if (localPart.length < 2 || localPart.length > 64) {
    return false;
  }

  if (handle.length < 2 || handle.length > 64) {
    return false;
  }

  /*
   * UPI ID local part:
   * letters, numbers, dot, underscore and hyphen.
   */
  if (!/^[A-Za-z0-9._-]+$/.test(localPart)) {
    return false;
  }

  /*
   * UPI handle:
   * letters, numbers, dot and hyphen.
   */
  if (!/^[A-Za-z0-9.-]+$/.test(handle)) {
    return false;
  }

  // Local part cannot start/end with punctuation.
  if (/^[._-]|[._-]$/.test(localPart)) {
    return false;
  }

  // Handle cannot start/end with dot or hyphen.
  if (/^[.-]|[.-]$/.test(handle)) {
    return false;
  }

  // Prevent consecutive dots.
  if (localPart.includes('..') || handle.includes('..')) {
    return false;
  }

  return true;
};

/* ============================================================
   CARD NUMBER VALIDATION
============================================================ */

const isValidCardNumber = (value: string): boolean => {
  const digits = value.replace(/\s/g, '');

  if (!/^\d{16}$/.test(digits)) {
    return false;
  }

  // Reject obviously fake repeated values.
  if (/^(\d)\1{15}$/.test(digits)) {
    return false;
  }

  return isValidLuhn(digits);
};

/* ============================================================
   CARDHOLDER NAME VALIDATION
============================================================ */

const isValidCardholderName = (
  value: string
): boolean => {
  const name = normalizeSpaces(value);

  if (!name) {
    return false;
  }

  if (
    name.length < 2 ||
    name.length > MAX_NAME_LENGTH
  ) {
    return false;
  }

  /*
   * Allows:
   * John Doe
   * Azeez Khan
   * O'Connor
   * Anne-Marie
   */
  return /^[A-Za-z][A-Za-z .'-]*[A-Za-z]$/.test(name);
};

/* ============================================================
   EXPIRY VALIDATION
============================================================ */

const isValidCardExpiry = (
  value: string
): boolean => {
  const expiry = value.trim();

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    return false;
  }

  const [monthString, yearString] =
    expiry.split('/');

  const month = Number(monthString);
  const year = 2000 + Number(yearString);

  const now = new Date();

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) {
    return false;
  }

  if (
    year === currentYear &&
    month < currentMonth
  ) {
    return false;
  }

  return true;
};

/* ============================================================
   CVV VALIDATION
============================================================ */

const isValidCvv = (value: string): boolean => {
  return /^\d{3,4}$/.test(value);
};

/* ============================================================
   PHONE VALIDATION
============================================================ */

const isValidPhone = (value: string): boolean => {
  const phone = value.trim();

  /*
   * Phone is optional in this checkout.
   */
  if (!phone) {
    return true;
  }

  /*
   * Permit:
   * +91 9876543210
   * +919876543210
   * 9876543210
   * 98765-43210
   */
  const digits = phone.replace(/\D/g, '');

  if (
    digits.length < MIN_PHONE_DIGITS ||
    digits.length > MAX_PHONE_DIGITS
  ) {
    return false;
  }

  /*
   * Prevent values containing letters.
   */
  if (!/^[+\d\s()-]+$/.test(phone)) {
    return false;
  }

  /*
   * Prevent a phone number consisting entirely of
   * the same digit.
   */
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  return true;
};

/* ============================================================
   DELIVERY VALIDATION
============================================================ */

const isValidPersonName = (
  value: string
): boolean => {
  const name = normalizeSpaces(value);

  if (!name) {
    return false;
  }

  if (
    name.length < 2 ||
    name.length > MAX_NAME_LENGTH
  ) {
    return false;
  }

  return /^[A-Za-z][A-Za-z .'-]*[A-Za-z]$/.test(name);
};

const isValidAddress = (
  value: string
): boolean => {
  const address = normalizeSpaces(value);

  if (!address) {
    return false;
  }

  if (
    address.length < 5 ||
    address.length > MAX_ADDRESS_LENGTH
  ) {
    return false;
  }

  return /[A-Za-z0-9]/.test(address);
};

const isValidCity = (
  value: string
): boolean => {
  const city = normalizeSpaces(value);

  if (!city) {
    return false;
  }

  if (
    city.length < 2 ||
    city.length > MAX_CITY_LENGTH
  ) {
    return false;
  }

  return /^[A-Za-z][A-Za-z .'-]*$/.test(city);
};

const isValidState = (
  value: string
): boolean => {
  const state = normalizeSpaces(value);

  /*
   * State is optional in the current checkout UI.
   */
  if (!state) {
    return true;
  }

  if (
    state.length < 2 ||
    state.length > MAX_STATE_LENGTH
  ) {
    return false;
  }

  return /^[A-Za-z][A-Za-z .'-]*$/.test(state);
};

const isValidPin = (
  value: string
): boolean => {
  const pin = value.trim();

  /*
   * PIN is optional in the current checkout UI.
   */
  if (!pin) {
    return true;
  }

  return /^\d{6}$/.test(pin);
};

/* ============================================================
   COMPONENT
============================================================ */

export function CheckoutPage() {
  const { currentUser, isAuthenticated } =
    useAuth();

  const {
    items,
    cartTotal,
    clearCart,
  } = useCart();

  const { showToast } = useToast();

  /* ==========================================================
     DELIVERY ADDRESS
  ========================================================== */

  const [fullName, setFullName] =
    useState(currentUser?.username || '');

  const [phoneNumber, setPhoneNumber] =
    useState(currentUser?.phoneNumber || '');

  const [addressLine, setAddressLine] =
    useState(currentUser?.address || '');

  const [city, setCity] =
    useState(currentUser?.city || '');

  const [stateName, setStateName] =
    useState(currentUser?.state || '');

  const [zipCode, setZipCode] =
    useState(currentUser?.zipCode || '');

  /* ==========================================================
     PAYMENT
  ========================================================== */

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('COD');

  const [upiId, setUpiId] =
    useState('');

  const [cardholderName, setCardholderName] =
    useState('');

  const [cardNumber, setCardNumber] =
    useState('');

  const [cardExpiry, setCardExpiry] =
    useState('');

  const [cardCvv, setCardCvv] =
    useState('');

  /* ==========================================================
     SUBMISSION
  ========================================================== */

  const [submitting, setSubmitting] =
    useState(false);

  const [placedOrder, setPlacedOrder] =
    useState<Order | null>(null);

  /* ==========================================================
     AUTH CHECK
  ========================================================== */

  if (
    !isAuthenticated ||
    !currentUser?.id
  ) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#E1E5E9] rounded-2xl text-center shadow-xs">
        <Lock className="w-10 h-10 text-indigo-600 mx-auto mb-3" />

        <h2 className="text-lg font-bold text-[#17202A] mb-1">
          Sign In Required
        </h2>

        <p className="text-xs text-[#5F6368] mb-4">
          Please sign in to your Zyphora account
          to complete checkout.
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

  /* ==========================================================
     ORDER SUCCESS
  ========================================================== */

  if (placedOrder) {
    const returnedPaymentMethod =
      placedOrder.paymentMethod;

    const effectivePaymentMethod =
      returnedPaymentMethod &&
      isAllowedPaymentMethod(
        returnedPaymentMethod
      )
        ? returnedPaymentMethod
        : paymentMethod;

    const paymentLabel =
      effectivePaymentMethod === 'COD'
        ? 'Cash on Delivery (COD)'
        : effectivePaymentMethod === 'UPI'
          ? 'UPI'
          : 'Credit / Debit Card';

    const orderReference =
      placedOrder.orderId ||
      (placedOrder as any).id ||
      'N/A';

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
            Your order has been recorded in the
            Zyphora backend system.
          </p>
        </div>

        {/* ORDER DETAILS */}
        <div className="bg-[#F8F9FA] rounded-xl border border-[#E1E5E9] p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-[#E1E5E9]">
            <span className="text-[#5F6368]">
              Order Reference:
            </span>

            <span className="font-bold text-[#17202A] font-mono text-sm">
              #{orderReference}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#5F6368]">
              Current Status:
            </span>

            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
              {placedOrder.status || 'PENDING'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#5F6368]">
              Payment Method:
            </span>

            <span className="font-semibold text-[#17202A]">
              {paymentLabel}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-[#E1E5E9]">
            <span className="text-sm font-bold text-[#17202A]">
              Total Amount:
            </span>

            <span className="text-base font-extrabold text-[#17202A]">
              ₹
              {Number(
                placedOrder.totalAmount ||
                  cartTotal
              ).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* EMAIL INFORMATION */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 text-left flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />

          <span>
            An official order confirmation email
            has been dispatched by the Zyphora Email
            Service to{' '}
            <strong>{currentUser.email}</strong>.
          </span>
        </div>

        {/* ACTIONS */}
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

  /* ==========================================================
     EMPTY CART
  ========================================================== */

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#E1E5E9] rounded-2xl text-center shadow-xs">
        <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />

        <h2 className="text-lg font-bold text-[#17202A] mb-1">
          Your Cart is Empty
        </h2>

        <p className="text-xs text-[#5F6368] mb-4">
          Add products to your cart before
          proceeding to checkout.
        </p>

        <Link
          to="/shop"
          className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  /* ==========================================================
     PAYMENT VALIDATION
  ========================================================== */

  const validatePaymentMethod = (): boolean => {
    /*
     * Runtime whitelist.
     *
     * TypeScript alone cannot protect against manipulated
     * runtime values.
     */
    if (
      !isAllowedPaymentMethod(
        paymentMethod
      )
    ) {
      showToast(
        'Please select a valid payment method.',
        'error'
      );

      return false;
    }

    /* --------------------------------------------------------
       COD
    -------------------------------------------------------- */

    if (paymentMethod === 'COD') {
      return true;
    }

    /* --------------------------------------------------------
       UPI
    -------------------------------------------------------- */

    if (paymentMethod === 'UPI') {
      const normalizedUpi =
        upiId.trim();

      if (!normalizedUpi) {
        showToast(
          'Please enter your UPI ID.',
          'error'
        );

        return false;
      }

      if (!isValidUpiId(normalizedUpi)) {
        showToast(
          'Please enter a valid UPI ID, for example name@upi.',
          'error'
        );

        return false;
      }

      return true;
    }

    /* --------------------------------------------------------
       CARD
    -------------------------------------------------------- */

    if (paymentMethod === 'CARD') {
      const normalizedCardholder =
        normalizeSpaces(cardholderName);

      if (
        !isValidCardholderName(
          normalizedCardholder
        )
      ) {
        showToast(
          'Please enter a valid cardholder name.',
          'error'
        );

        return false;
      }

      const cleanCardNumber =
        cardNumber.replace(/\s/g, '');

      if (!cleanCardNumber) {
        showToast(
          'Please enter your card number.',
          'error'
        );

        return false;
      }

      if (!/^\d+$/.test(cleanCardNumber)) {
        showToast(
          'Card number can contain digits only.',
          'error'
        );

        return false;
      }

      if (cleanCardNumber.length !== 16) {
        showToast(
          'Card number must contain exactly 16 digits.',
          'error'
        );

        return false;
      }

      if (!isValidCardNumber(cleanCardNumber)) {
        showToast(
          'Please enter a valid card number.',
          'error'
        );

        return false;
      }

      if (!cardExpiry.trim()) {
        showToast(
          'Please enter your card expiry date.',
          'error'
        );

        return false;
      }

      if (
        !isValidCardExpiry(
          cardExpiry
        )
      ) {
        showToast(
          'Please enter a valid future expiry date in MM/YY format.',
          'error'
        );

        return false;
      }

      if (!cardCvv.trim()) {
        showToast(
          'Please enter your CVV.',
          'error'
        );

        return false;
      }

      if (!isValidCvv(cardCvv)) {
        showToast(
          'CVV must contain exactly 3 or 4 digits.',
          'error'
        );

        return false;
      }

      return true;
    }

    return false;
  };

  /* ==========================================================
     DELIVERY VALIDATION
  ========================================================== */

  const validateDeliveryAddress =
    (): boolean => {
      const normalizedName =
        normalizeSpaces(fullName);

      if (!isValidPersonName(normalizedName)) {
        showToast(
          'Please enter a valid recipient name.',
          'error'
        );

        return false;
      }

      if (!isValidAddress(addressLine)) {
        showToast(
          'Please enter a valid street address.',
          'error'
        );

        return false;
      }

      if (!isValidCity(city)) {
        showToast(
          'Please enter a valid city.',
          'error'
        );

        return false;
      }

      if (!isValidState(stateName)) {
        showToast(
          'Please enter a valid state or province.',
          'error'
        );

        return false;
      }

      if (!isValidPhone(phoneNumber)) {
        showToast(
          'Please enter a valid phone number.',
          'error'
        );

        return false;
      }

      if (!isValidPin(zipCode)) {
        showToast(
          'Please enter a valid 6-digit PIN code.',
          'error'
        );

        return false;
      }

      return true;
    };

  /* ==========================================================
     FORMAT CARD NUMBER
  ========================================================== */

  const handleCardNumberChange = (
    value: string
  ) => {
    const digits = value
      .replace(/\D/g, '')
      .slice(0, 16);

    const formatted =
      digits.match(/.{1,4}/g)?.join(' ') ||
      '';

    setCardNumber(formatted);
  };

  /* ==========================================================
     FORMAT EXPIRY
  ========================================================== */

  const handleExpiryChange = (
    value: string
  ) => {
    const digits = value
      .replace(/\D/g, '')
      .slice(0, 4);

    if (digits.length <= 2) {
      setCardExpiry(digits);
      return;
    }

    setCardExpiry(
      `${digits.slice(0, 2)}/${digits.slice(2)}`
    );
  };

  /* ==========================================================
     UPI CHANGE
  ========================================================== */

  const handleUpiChange = (
    value: string
  ) => {
    /*
     * Remove spaces immediately.
     * This prevents accidental whitespace from being
     * inserted into the VPA.
     */
    const cleaned = value
      .replace(/\s/g, '')
      .slice(0, 129);

    setUpiId(cleaned);
  };

  /* ==========================================================
     CARDHOLDER CHANGE
  ========================================================== */

  const handleCardholderChange = (
    value: string
  ) => {
    /*
     * Cardholder names should not contain digits.
     * Keep only characters valid for a cardholder name.
     */
    const cleaned = value
      .replace(/[^A-Za-z .'-]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, MAX_NAME_LENGTH);

    setCardholderName(cleaned);
  };

  /* ==========================================================
     PHONE CHANGE
  ========================================================== */

  const handlePhoneChange = (
    value: string
  ) => {
    /*
     * Keep only common phone-number characters.
     */
    const cleaned = value
      .replace(/[^\d+\s()-]/g, '')
      .slice(0, 20);

    setPhoneNumber(cleaned);
  };

  /* ==========================================================
     NAME CHANGE
  ========================================================== */

  const handleNameChange = (
    value: string
  ) => {
    const cleaned = value
      .replace(/[^A-Za-z .'-]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, MAX_NAME_LENGTH);

    setFullName(cleaned);
  };

  /* ==========================================================
     CITY CHANGE
  ========================================================== */

  const handleCityChange = (
    value: string
  ) => {
    const cleaned = value
      .replace(/[^A-Za-z .'-]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, MAX_CITY_LENGTH);

    setCity(cleaned);
  };

  /* ==========================================================
     STATE CHANGE
  ========================================================== */

  const handleStateChange = (
    value: string
  ) => {
    const cleaned = value
      .replace(/[^A-Za-z .'-]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, MAX_STATE_LENGTH);

    setStateName(cleaned);
  };

  /* ==========================================================
     PIN CHANGE
  ========================================================== */

  const handlePinChange = (
    value: string
  ) => {
    setZipCode(
      value
        .replace(/\D/g, '')
        .slice(0, PIN_LENGTH)
    );
  };

  /* ==========================================================
     PAYMENT METHOD CHANGE
  ========================================================== */

  const handlePaymentMethodChange = (
    method: PaymentMethod
  ) => {
    if (!isAllowedPaymentMethod(method)) {
      return;
    }

    setPaymentMethod(method);

    /*
     * We intentionally keep the entered values in local state
     * so the user doesn't lose them when switching methods.
     *
     * None of these values are sent to the Zyphora backend.
     */
  };

  /* ==========================================================
     PLACE ORDER
  ========================================================== */

  const handlePlaceOrderSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    /*
     * Prevent duplicate clicks/submissions.
     */
    if (submitting) {
      return;
    }

    /* --------------------------------------------------------
       AUTH VALIDATION
    -------------------------------------------------------- */

    if (!currentUser?.id) {
      showToast(
        'Your session has expired. Please sign in again.',
        'error'
      );

      return;
    }

    /* --------------------------------------------------------
       CART VALIDATION
    -------------------------------------------------------- */

    if (!items.length) {
      showToast(
        'Your cart is empty.',
        'error'
      );

      return;
    }

    /*
     * Validate cart quantities before placing an order.
     */
    for (const item of items) {
      const quantity = Number(
        item.quantity
      );

      const price = Number(
        item.price
      );

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        showToast(
          'One or more cart quantities are invalid.',
          'error'
        );

        return;
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        showToast(
          'One or more product prices are invalid.',
          'error'
        );

        return;
      }
    }

    /* --------------------------------------------------------
       TOTAL VALIDATION
    -------------------------------------------------------- */

    if (
      !Number.isFinite(cartTotal) ||
      cartTotal < 0
    ) {
      showToast(
        'Invalid order total.',
        'error'
      );

      return;
    }

    /* --------------------------------------------------------
       DELIVERY VALIDATION
    -------------------------------------------------------- */

    if (
      !validateDeliveryAddress()
    ) {
      return;
    }

    /* --------------------------------------------------------
       PAYMENT VALIDATION
    -------------------------------------------------------- */

    if (
      !validatePaymentMethod()
    ) {
      return;
    }

    /* --------------------------------------------------------
       NORMALIZE VALUES
    -------------------------------------------------------- */

    const normalizedName =
      normalizeSpaces(fullName);

    const normalizedAddress =
      normalizeSpaces(addressLine);

    const normalizedCity =
      normalizeSpaces(city);

    const normalizedState =
      normalizeSpaces(stateName);

    const normalizedPhone =
      phoneNumber.trim();

    const normalizedPin =
      zipCode.trim();

    /* --------------------------------------------------------
       COMPILE SHIPPING ADDRESS
    -------------------------------------------------------- */

    const compiledAddress = [
      `Name: ${normalizedName}`,

      normalizedPhone
        ? `Phone: ${normalizedPhone}`
        : null,

      normalizedAddress,

      normalizedCity,

      normalizedState || null,

      normalizedPin
        ? `PIN: ${normalizedPin}`
        : null,
    ]
      .filter(
        (
          value
        ): value is string =>
          Boolean(value)
      )
      .join(', ');

    /* --------------------------------------------------------
       FINAL PAYMENT SAFETY CHECK
    -------------------------------------------------------- */

    const safePaymentMethod =
      paymentMethod;

    if (
      !isAllowedPaymentMethod(
        safePaymentMethod
      )
    ) {
      showToast(
        'Invalid payment method.',
        'error'
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * We deliberately DO NOT send:
     *
     * - cardholderName
     * - cardNumber
     * - cardExpiry
     * - cardCvv
     * - upiId
     *
     * to your current backend.
     *
     * The backend receives only the selected payment method.
     *
     * Real payment processing should be performed by a
     * PCI-compliant payment gateway.
     */
    setSubmitting(true);

    try {
      const order =
        await api.placeOrder(
          currentUser.id,
          {
            shippingAddress:
              compiledAddress,

            paymentMethod:
              safePaymentMethod,
          }
        );

      /*
       * Backend already clears the cart after successfully
       * creating the order.
       *
       * Keep the frontend cart state synchronized.
       */
      await clearCart();

      setPlacedOrder(order);

      showToast(
        'Order successfully placed!',
        'success'
      );
    } catch (err: any) {
      showToast(
        err?.message ||
          'Unable to place order. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     PAYMENT OPTION STYLE
  ========================================================== */

  const paymentOptionClass = (
    method: PaymentMethod
  ) =>
    `flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
      paymentMethod === method
        ? 'border-indigo-600 bg-indigo-50/50'
        : 'border-[#E1E5E9] bg-white hover:border-indigo-300 hover:bg-indigo-50/20'
    }`;

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center gap-2 pb-2 border-b border-[#E1E5E9]">
        <Link
          to="/cart"
          className="p-1 hover:text-indigo-600 text-[#5F6368]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#17202A]">
            Secure Checkout
          </h1>

          <p className="text-xs text-[#5F6368]">
            Finalize your shipping address and
            payment method
          </p>
        </div>
      </div>

      {/* ======================================================
          MAIN FORM
      ====================================================== */}

      <form
        onSubmit={handlePlaceOrderSubmit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
      >

        {/* ====================================================
            LEFT
        ==================================================== */}

        <div className="lg:col-span-2 space-y-6">

          {/* ==================================================
              DELIVERY ADDRESS
          ================================================== */}

          <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-4 shadow-2xs">

            <div className="flex items-center gap-2 pb-3 border-b border-[#E1E5E9]">
              <Truck className="w-4 h-4 text-indigo-600" />

              <h2 className="text-sm font-bold text-[#17202A]">
                1. Delivery Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

              {/* FULL NAME */}

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  Full Name{' '}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) =>
                    handleNameChange(
                      e.target.value
                    )
                  }
                  placeholder="Recipient Name"
                  autoComplete="name"
                  maxLength={
                    MAX_NAME_LENGTH
                  }
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* PHONE */}

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    handlePhoneChange(
                      e.target.value
                    )
                  }
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={20}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* ADDRESS */}

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#17202A] mb-1">
                  Street Address / House No.{' '}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) =>
                    setAddressLine(
                      e.target.value
                        .slice(
                          0,
                          MAX_ADDRESS_LENGTH
                        )
                    )
                  }
                  placeholder="Flat / Building, Street, Landmark"
                  autoComplete="street-address"
                  maxLength={
                    MAX_ADDRESS_LENGTH
                  }
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* CITY */}

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  City{' '}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) =>
                    handleCityChange(
                      e.target.value
                    )
                  }
                  placeholder="City"
                  autoComplete="address-level2"
                  maxLength={
                    MAX_CITY_LENGTH
                  }
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* STATE */}

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  State / Province
                </label>

                <input
                  type="text"
                  value={stateName}
                  onChange={(e) =>
                    handleStateChange(
                      e.target.value
                    )
                  }
                  placeholder="State"
                  autoComplete="address-level1"
                  maxLength={
                    MAX_STATE_LENGTH
                  }
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* PIN */}

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  PIN / Postal Code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={zipCode}
                  onChange={(e) =>
                    handlePinChange(
                      e.target.value
                    )
                  }
                  placeholder="110001"
                  autoComplete="postal-code"
                  maxLength={PIN_LENGTH}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

            </div>
          </div>

          {/* ==================================================
              PAYMENT METHOD
          ================================================== */}

          <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-4 shadow-2xs">

            <div className="flex items-center gap-2 pb-3 border-b border-[#E1E5E9]">
              <CreditCard className="w-4 h-4 text-indigo-600" />

              <h2 className="text-sm font-bold text-[#17202A]">
                2. Payment Method
              </h2>
            </div>

            <div className="space-y-3">

              {/* =================================================
                  COD
              ================================================= */}

              <label
                className={paymentOptionClass(
                  'COD'
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={
                    paymentMethod === 'COD'
                  }
                  onChange={() =>
                    handlePaymentMethodChange(
                      'COD'
                    )
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />

                <div className="flex-1">

                  <div className="flex items-center gap-2">
                    <WalletCards className="w-4 h-4 text-indigo-600" />

                    <span className="block text-xs font-bold text-[#17202A]">
                      Cash on Delivery
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5F6368] mt-1 leading-relaxed">
                    Pay when your package is
                    delivered.
                  </p>

                </div>
              </label>

              {/* =================================================
                  UPI
              ================================================= */}

              <label
                className={paymentOptionClass(
                  'UPI'
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={
                    paymentMethod === 'UPI'
                  }
                  onChange={() =>
                    handlePaymentMethodChange(
                      'UPI'
                    )
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />

                <div className="flex-1">

                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-600" />

                    <span className="block text-xs font-bold text-[#17202A]">
                      UPI
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5F6368] mt-1 leading-relaxed">
                    Pay using Google Pay,
                    PhonePe, Paytm or another
                    UPI app.
                  </p>

                  {paymentMethod === 'UPI' && (
                    <div className="mt-3">

                      <label className="block text-[11px] font-semibold text-[#17202A] mb-1">
                        UPI ID
                      </label>

                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) =>
                          handleUpiChange(
                            e.target.value
                          )
                        }
                        placeholder="yourname@upi"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={129}
                        className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg focus:outline-none focus:border-indigo-600 text-xs"
                      />

                      <p className="text-[10px] text-[#8A9199] mt-1">
                        Example: username@okaxis
                      </p>

                      <p className="text-[10px] text-[#8A9199] mt-1">
                        Your UPI ID is used only for
                        validation on this checkout
                        screen.
                      </p>

                    </div>
                  )}

                </div>
              </label>

              {/* =================================================
                  CARD
              ================================================= */}

              <label
                className={paymentOptionClass(
                  'CARD'
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={
                    paymentMethod === 'CARD'
                  }
                  onChange={() =>
                    handlePaymentMethodChange(
                      'CARD'
                    )
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />

                <div className="flex-1">

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />

                    <span className="block text-xs font-bold text-[#17202A]">
                      Credit / Debit Card
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5F6368] mt-1 leading-relaxed">
                    Pay securely using your Visa,
                    Mastercard or RuPay card.
                  </p>

                  {paymentMethod === 'CARD' && (
                    <div className="mt-4 space-y-3">

                      {/* CARDHOLDER */}

                      <div>
                        <label className="block text-[11px] font-semibold text-[#17202A] mb-1">
                          Cardholder Name
                        </label>

                        <input
                          type="text"
                          value={cardholderName}
                          onChange={(e) =>
                            handleCardholderChange(
                              e.target.value
                            )
                          }
                          placeholder="Name on card"
                          autoComplete="cc-name"
                          maxLength={
                            MAX_NAME_LENGTH
                          }
                          className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg focus:outline-none focus:border-indigo-600 text-xs"
                        />
                      </div>

                      {/* CARD NUMBER */}

                      <div>
                        <label className="block text-[11px] font-semibold text-[#17202A] mb-1">
                          Card Number
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) =>
                            handleCardNumberChange(
                              e.target.value
                            )
                          }
                          placeholder="1234 5678 9012 3456"
                          autoComplete="cc-number"
                          maxLength={19}
                          className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg focus:outline-none focus:border-indigo-600 text-xs tracking-wider"
                        />

                        <p className="text-[10px] text-[#8A9199] mt-1">
                          Enter a valid 16-digit
                          card number.
                        </p>
                      </div>

                      {/* EXPIRY + CVV */}

                      <div className="grid grid-cols-2 gap-3">

                        <div>
                          <label className="block text-[11px] font-semibold text-[#17202A] mb-1">
                            Expiry
                          </label>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardExpiry}
                            onChange={(e) =>
                              handleExpiryChange(
                                e.target.value
                              )
                            }
                            placeholder="MM/YY"
                            autoComplete="cc-exp"
                            maxLength={5}
                            className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg focus:outline-none focus:border-indigo-600 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#17202A] mb-1">
                            CVV
                          </label>

                          <input
                            type="password"
                            inputMode="numeric"
                            value={cardCvv}
                            onChange={(e) =>
                              setCardCvv(
                                e.target.value
                                  .replace(
                                    /\D/g,
                                    ''
                                  )
                                  .slice(0, 4)
                              )
                            }
                            placeholder="CVV"
                            autoComplete="cc-csc"
                            maxLength={4}
                            className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg focus:outline-none focus:border-indigo-600 text-xs"
                          />
                        </div>

                      </div>

                      {/* SECURITY MESSAGE */}

                      <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                        <p className="text-[10px] leading-relaxed text-[#667085]">
                          Card details are validated
                          locally and are never sent
                          to the Zyphora backend.
                          Real card payments require
                          a PCI-compliant payment
                          gateway.
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              </label>

            </div>
          </div>
        </div>

        {/* ====================================================
            RIGHT — ORDER SUMMARY
        ==================================================== */}

        <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-4 shadow-2xs lg:sticky lg:top-24">

          <h3 className="font-bold text-sm text-[#17202A] pb-2 border-b border-[#E1E5E9]">
            Order Summary ({items.length}{' '}
            {items.length === 1
              ? 'item'
              : 'items'}
            )
          </h3>

          {/* MINI ITEMS */}

          <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 divide-y divide-gray-100">

            {items.map((item) => (
              <div
                key={
                  item.id ||
                  item.productId
                }
                className="flex justify-between items-center text-xs pt-2"
              >
                <div className="truncate pr-2">

                  <span className="font-semibold text-[#17202A] block truncate">
                    {item.name}
                  </span>

                  <span className="text-[10px] text-[#8A9199]">
                    Qty: {item.quantity}
                  </span>

                </div>

                <span className="font-bold text-[#17202A] shrink-0">
                  ₹
                  {(
                    (item.price || 0) *
                    (item.quantity || 1)
                  ).toLocaleString(
                    'en-IN'
                  )}
                </span>
              </div>
            ))}

          </div>

          {/* TOTALS */}

          <div className="border-t border-[#E1E5E9] pt-3 space-y-2 text-xs">

            <div className="flex justify-between text-[#5F6368]">
              <span>
                Items Subtotal
              </span>

              <span className="font-semibold text-[#17202A]">
                ₹
                {cartTotal.toLocaleString(
                  'en-IN'
                )}
              </span>
            </div>

            <div className="flex justify-between text-[#5F6368]">
              <span>
                Delivery
              </span>

              <span className="text-emerald-600 font-semibold">
                FREE
              </span>
            </div>

            <div className="border-t border-[#E1E5E9] pt-2 flex justify-between text-base font-extrabold text-[#17202A]">

              <span>
                Amount Payable
              </span>

              <span>
                ₹
                {cartTotal.toLocaleString(
                  'en-IN'
                )}
              </span>

            </div>

          </div>

          {/* SELECTED PAYMENT */}

          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">

            <div className="flex items-center gap-2">

              {paymentMethod === 'COD' && (
                <WalletCards className="w-4 h-4 text-indigo-600" />
              )}

              {paymentMethod === 'UPI' && (
                <Smartphone className="w-4 h-4 text-indigo-600" />
              )}

              {paymentMethod === 'CARD' && (
                <CreditCard className="w-4 h-4 text-indigo-600" />
              )}

              <span className="text-[11px] font-semibold text-indigo-900">
                {paymentMethod === 'COD'
                  ? 'Cash on Delivery'
                  : paymentMethod === 'UPI'
                    ? 'UPI Payment'
                    : 'Credit / Debit Card'}
              </span>

            </div>

          </div>

          {/* PLACE ORDER */}

          <button
            id="place-order-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting
              ? 'Placing Order...'
              : 'Confirm & Place Order'}
          </button>

          {/* SECURITY */}

          <div className="flex items-start gap-2 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />

            <p className="text-[11px] text-[#8A9199] text-center">
              Your order is securely submitted
              through the Zyphora backend.
            </p>
          </div>

          <p className="text-[10px] text-[#A0A6AD] text-center">
            UPI/Card payment processing requires
            a real payment gateway integration.
          </p>

        </div>
      </form>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  User as UserIcon,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const POPULAR_CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Books',
  'Beauty',
  'Sports',
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    currentUser,
    isAuthenticated,
    isAdmin,
    logout,
    openAuthModal,
  } = useAuth();

  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     Sync search state with URL
     ========================================================= */
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  /* =========================================================
     Close account dropdown when clicking outside
     ========================================================= */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* =========================================================
     Close mobile menu after navigation
     ========================================================= */
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  /* =========================================================
     Search
     ========================================================= */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    if (
      selectedCategory &&
      selectedCategory !== 'All'
    ) {
      params.set('category', selectedCategory);
    }

    const query = params.toString();

    navigate(query ? `/shop?${query}` : '/shop');
  };

  return (
    <header
      className="
        sticky
        top-0
        z-40
        w-full
        max-w-full
        bg-white
        border-b
        border-[#E1E5E9]
        shadow-xs
      "
    >
      {/* =====================================================
          MAIN HEADER
          ===================================================== */}
      <div
        className="
          w-full
          max-w-7xl
          mx-auto
          px-3
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            h-16
            gap-1
            sm:gap-4
            min-w-0
          "
        >
          {/* =================================================
              LEFT SIDE
              MENU + LOGO + BRAND
              ================================================= */}
          <div
            className="
              flex
              items-center
              gap-2
              sm:gap-3
              shrink-0
              min-w-0
            "
          >
            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (value) => !value
                )
              }
              className="
                lg:hidden
                shrink-0
                w-9
                h-9
                -ml-1
                rounded-lg
                flex
                items-center
                justify-center
                text-[#5F6368]
                hover:text-[#17202A]
                hover:bg-slate-100
                active:bg-slate-200
                transition-colors
              "
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* =================================================
                BRAND
                ================================================= */}
            <Link
              to="/"
              className="
                flex
                items-center
                gap-2
                shrink-0
                min-w-0
                group
              "
              aria-label="Zyphora Home"
            >
              {/* Z Logo */}
              <div
                className="
                  w-9
                  h-9
                  sm:w-10
                  sm:h-10
                  shrink-0
                  rounded-lg
                  bg-indigo-600
                  flex
                  items-center
                  justify-center
                  text-white
                  font-black
                  text-lg
                  tracking-wider
                  shadow-xs
                  group-hover:bg-indigo-700
                  transition-colors
                "
              >
                Z
              </div>

              {/* ZYPHORA — visible on mobile */}
              <span
                className="
                  block
                  text-[17px]
                  min-[375px]:text-[18px]
                  sm:text-xl
                  font-extrabold
                  tracking-tight
                  text-[#17202A]
                  font-sans
                  whitespace-nowrap
                "
              >
                ZYPHORA
              </span>
            </Link>

            {/* =================================================
                LOCATION
                ================================================= */}
            <div
              className="
                hidden
                xl:flex
                items-center
                gap-1.5
                text-xs
                text-[#5F6368]
                pl-2
                border-l
                border-[#E1E5E9]
                shrink-0
              "
            >
              <MapPin className="w-4 h-4 text-[#8A9199]" />

              <div className="leading-tight">
                <span className="block text-[10px] text-[#8A9199]">
                  Deliver to
                </span>

                <span className="font-semibold text-[#17202A]">
                  India
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              DESKTOP SEARCH
              ===================================================== */}
          <form
            onSubmit={handleSearchSubmit}
            className="
              flex-1
              min-w-0
              max-w-2xl
              hidden
              md:flex
              items-center
              border
              border-[#E1E5E9]
              focus-within:border-indigo-600
              focus-within:ring-2
              focus-within:ring-indigo-100
              rounded-lg
              overflow-hidden
              bg-[#F8F9FA]
              transition-all
            "
          >
            {/* Search Category */}
            <div
              className="
                relative
                shrink-0
                border-r
                border-[#E1E5E9]
              "
            >
              <select
                id="search-category-select"
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value)
                }
                className="
                  appearance-none
                  bg-transparent
                  py-2
                  pl-3
                  pr-7
                  text-xs
                  font-medium
                  text-[#17202A]
                  cursor-pointer
                  focus:outline-none
                  max-w-[130px]
                "
              >
                {POPULAR_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                className="
                  w-3.5
                  h-3.5
                  text-[#8A9199]
                  absolute
                  right-2
                  top-1/2
                  -translate-y-1/2
                  pointer-events-none
                "
              />
            </div>

            {/* Search Input */}
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search products, brands and categories..."
              className="
                flex-1
                min-w-0
                py-2
                px-3
                text-sm
                bg-transparent
                text-[#17202A]
                placeholder-[#8A9199]
                focus:outline-none
              "
            />

            {/* Clear Search */}
            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery('')
                }
                className="
                  shrink-0
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
                  text-[#8A9199]
                  hover:text-[#17202A]
                "
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search Button */}
            <button
              id="global-search-btn"
              type="submit"
              className="
                shrink-0
                w-10
                h-10
                bg-indigo-600
                hover:bg-indigo-700
                text-white
                transition-colors
                flex
                items-center
                justify-center
              "
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* =====================================================
              RIGHT ACTIONS
              ===================================================== */}
          <div
            className="
              flex
              items-center
              gap-1
              sm:gap-2
              shrink-0
            "
          >
            {/* =================================================
                ACCOUNT
                ================================================= */}
            <div
              className="relative"
              ref={accountMenuRef}
            >
              {isAuthenticated &&
                currentUser ? (
                <button
                  id="user-account-menu-trigger"
                  type="button"
                  onClick={() =>
                    setAccountMenuOpen(
                      (value) => !value
                    )
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    p-1
                    sm:px-2
                    sm:py-1
                    rounded-lg
                    hover:bg-slate-100
                    text-left
                    transition-colors
                    shrink-0
                  "
                  aria-label="Account menu"
                  aria-expanded={
                    accountMenuOpen
                  }
                >
                  <div
                    className="
                      shrink-0
                      w-9
                      h-9
                      rounded-full
                      bg-indigo-100
                      text-indigo-700
                      flex
                      items-center
                      justify-center
                      font-bold
                      text-xs
                      uppercase
                    "
                  >
                    {currentUser.username?.[0] ||
                      'U'}
                  </div>

                  <div className="hidden lg:flex flex-col text-xs leading-tight min-w-0">
                    <span className="text-[#8A9199] text-[10px]">
                      Hello,
                    </span>

                    <span className="font-semibold text-[#17202A] truncate max-w-[90px]">
                      {currentUser.username}
                    </span>
                  </div>

                  <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-[#8A9199] shrink-0" />
                </button>
              ) : (
                <button
                  id="header-sign-in-btn"
                  type="button"
                  onClick={() =>
                    openAuthModal('login')
                  }
                  className="
                    flex
                    items-center
                    justify-center
                    gap-1.5
                    w-9
                    h-9
                    sm:w-auto
                    sm:h-auto
                    sm:px-3
                    sm:py-1.5
                    text-xs
                    font-semibold
                    text-[#17202A]
                    hover:bg-slate-100
                    rounded-lg
                    transition-colors
                    border
                    border-[#E1E5E9]
                    shrink-0
                  "
                  aria-label="Sign in"
                >
                  <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />

                  <span className="hidden sm:inline">
                    Sign In
                  </span>
                </button>
              )}

              {/* =================================================
                  ACCOUNT DROPDOWN
                  ================================================= */}
              {accountMenuOpen &&
                isAuthenticated &&
                currentUser && (
                  <div
                    id="user-account-dropdown"
                    className="
                      absolute
                      right-0
                      mt-2
                      w-56
                      max-w-[calc(100vw-24px)]
                      bg-white
                      border
                      border-[#E1E5E9]
                      rounded-xl
                      shadow-lg
                      py-2
                      z-50
                      animate-in
                      fade-in
                      slide-in-from-top-2
                      duration-150
                    "
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-[#8A9199]">
                        Signed in as
                      </p>

                      <p className="text-sm font-bold text-[#17202A] truncate">
                        {currentUser.email}
                      </p>

                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                          Zyphora Admin
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() =>
                          setAccountMenuOpen(false)
                        }
                        className="
                          flex
                          items-center
                          gap-2.5
                          px-4
                          py-2
                          text-xs
                          font-semibold
                          text-indigo-600
                          hover:bg-indigo-50
                          transition-colors
                        "
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Zyphora Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() =>
                        setAccountMenuOpen(false)
                      }
                      className="
                        flex
                        items-center
                        gap-2.5
                        px-4
                        py-2
                        text-xs
                        text-[#17202A]
                        hover:bg-slate-50
                        transition-colors
                      "
                    >
                      <UserIcon className="w-4 h-4 text-[#5F6368]" />
                      Your Profile & Address
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() =>
                        setAccountMenuOpen(false)
                      }
                      className="
                        flex
                        items-center
                        gap-2.5
                        px-4
                        py-2
                        text-xs
                        text-[#17202A]
                        hover:bg-slate-50
                        transition-colors
                      "
                    >
                      <Package className="w-4 h-4 text-[#5F6368]" />
                      Your Orders
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() =>
                        setAccountMenuOpen(false)
                      }
                      className="
                        flex
                        items-center
                        gap-2.5
                        px-4
                        py-2
                        text-xs
                        text-[#17202A]
                        hover:bg-slate-50
                        transition-colors
                      "
                    >
                      <Heart className="w-4 h-4 text-[#5F6368]" />
                      Saved Wishlist
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      id="header-logout-btn"
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        logout();
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        gap-2.5
                        px-4
                        py-2
                        text-xs
                        text-rose-600
                        hover:bg-rose-50
                        transition-colors
                        text-left
                        font-medium
                      "
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
            </div>

            {/* =================================================
                ORDERS - DESKTOP
                ================================================= */}
            <Link
              to="/orders"
              className="
                hidden
                lg:flex
                items-center
                justify-center
                px-4
                py-2
                rounded-lg
                border
                border-slate-200
                bg-white
                hover:bg-slate-50
                hover:border-slate-300
                transition-all
                duration-200
                shrink-0
              "
            >
              <span className="font-semibold text-sm text-[#17202A]">
                Orders
              </span>
            </Link>

            {/* =================================================
                WISHLIST
                ================================================= */}
            <Link
              to="/wishlist"
              id="header-wishlist-link"
              className="
                relative
                shrink-0
                w-9
                h-9
                sm:w-10
                sm:h-10
                flex
                items-center
                justify-center
                text-[#5F6368]
                hover:text-[#17202A]
                hover:bg-slate-100
                rounded-lg
                transition-colors
              "
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />

              {wishlistCount > 0 && (
                <span
                  className="
                    absolute
                    top-0.5
                    right-0.5
                    min-w-4
                    h-4
                    px-1
                    rounded-full
                    bg-rose-500
                    text-white
                    text-[10px]
                    font-bold
                    flex
                    items-center
                    justify-center
                  "
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* =================================================
                CART
                ================================================= */}
            <button
              id="header-cart-btn"
              type="button"
              onClick={() =>
                setIsCartOpen(true)
              }
              className="
                relative
                shrink-0

                w-9
                h-9

                sm:w-auto
                sm:h-10
                sm:px-3

                flex
                items-center
                justify-center
                gap-2

                bg-indigo-50
                hover:bg-indigo-100

                text-indigo-900

                rounded-lg

                transition-colors

                font-semibold
                text-xs

                border
                border-indigo-200
              "
              aria-label="Shopping Cart"
            >
              <div className="relative shrink-0">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />

                {cartCount > 0 && (
                  <span
                    className="
                      absolute
                      -top-1.5
                      -right-2
                      bg-indigo-600
                      text-white
                      rounded-full
                      min-w-4
                      h-4
                      px-1
                      text-[10px]
                      font-bold
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {cartCount}
                  </span>
                )}
              </div>

              {/* Cart text only on sm+ */}
              <span className="hidden sm:inline">
                Cart
              </span>
            </button>
          </div>
        </div>

        {/* =====================================================
            MOBILE SEARCH
            ===================================================== */}
        <div className="pb-3 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="
              w-full
              min-w-0
              flex
              items-center
              border
              border-[#E1E5E9]
              rounded-lg
              overflow-hidden
              bg-[#F8F9FA]
              focus-within:border-indigo-600
              focus-within:ring-2
              focus-within:ring-indigo-100
            "
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search products, brands, categories..."
              className="
                flex-1
                min-w-0
                py-2.5
                px-3
                text-xs
                bg-transparent
                text-[#17202A]
                placeholder-[#8A9199]
                focus:outline-none
              "
            />

            <button
              type="submit"
              className="
                shrink-0
                w-11
                h-10
                bg-indigo-600
                hover:bg-indigo-700
                text-white
                flex
                items-center
                justify-center
              "
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* =======================================================
          CATEGORY NAVIGATION
          ======================================================= */}
      <nav
        className="
          w-full
          bg-[#F8F9FA]
          border-t
          border-[#E1E5E9]
          text-xs
          font-medium
          text-[#17202A]

          overflow-x-auto
          overflow-y-hidden

          overscroll-x-contain

          scrollbar-none
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto
            px-3
            sm:px-6
            lg:px-8

            flex
            items-center

            gap-1
            sm:gap-2

            h-10

            whitespace-nowrap
            min-w-max
          "
        >
          {/* All Products */}
          <Link
            to="/shop"
            className="
              inline-flex
              items-center
              gap-1.5

              py-1.5
              px-2.5

              rounded-md

              hover:bg-slate-200
              transition-colors

              font-bold
              text-[#17202A]

              shrink-0
            "
          >
            <Menu className="w-3.5 h-3.5" />

            All Products
          </Link>

          <div
            className="
              h-4
              w-px
              bg-[#E1E5E9]
              mx-1
              shrink-0
            "
          />

          {/* Categories */}
          {POPULAR_CATEGORIES
            .filter(
              (category) =>
                category !== 'All'
            )
            .map((category) => (
              <Link
                key={category}
                to={`/shop?category=${encodeURIComponent(
                  category
                )}`}
                className={`
                  py-1.5
                  px-2.5
                  rounded-md
                  transition-colors
                  shrink-0

                  ${searchParams.get(
                  'category'
                ) === category
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'hover:bg-slate-200 text-[#5F6368] hover:text-[#17202A]'
                  }
                `}
              >
                {category}
              </Link>
            ))}

          <div
            className="
              h-4
              w-px
              bg-[#E1E5E9]
              mx-1
              shrink-0
            "
          />

          {/* New Arrivals */}
          <Link
            to="/shop?filter=new"
            className="
              inline-flex
              items-center
              gap-1

              py-1.5
              px-2.5

              rounded-md

              text-indigo-600
              hover:bg-indigo-50

              font-semibold

              shrink-0
            "
          >
            <Sparkles className="w-3 h-3" />
            New Arrivals
          </Link>

          {/* Today's Deals */}
          <Link
            to="/shop?filter=deals"
            className="
              inline-flex
              items-center
              gap-1

              py-1.5
              px-2.5

              rounded-md

              text-rose-600
              hover:bg-rose-50

              font-semibold

              shrink-0
            "
          >
            <Tag className="w-3 h-3" />
            Today's Deals
          </Link>
        </div>
      </nav>

      {/* =======================================================
          MOBILE MENU DRAWER
          ======================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay */}
          <div
            className="
              fixed
              inset-0
              bg-black/40
              backdrop-blur-xs
            "
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />

          {/* Drawer */}
          <div
            className="
              relative

              w-72
              max-w-[85vw]

              bg-white
              h-full

              shadow-2xl

              flex
              flex-col

              z-10

              overflow-y-auto
              overscroll-contain
            "
          >
            {/* Drawer Header */}
            <div
              className="
                p-4
                bg-[#17202A]
                text-white

                flex
                items-center
                justify-between

                shrink-0
              "
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="
                    w-7
                    h-7
                    shrink-0
                    rounded-md
                    bg-indigo-600
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-sm
                  "
                >
                  Z
                </div>

                <span className="font-extrabold tracking-tight">
                  ZYPHORA
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  shrink-0
                  w-8
                  h-8
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-slate-300
                  hover:text-white
                  hover:bg-white/10
                "
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Status */}
            <div
              className="
                p-4
                border-b
                border-[#E1E5E9]
                bg-[#F8F9FA]
                shrink-0
              "
            >
              {isAuthenticated &&
                currentUser ? (
                <div className="min-w-0">
                  <p className="text-xs text-[#8A9199]">
                    Signed in as
                  </p>

                  <p className="text-sm font-bold text-[#17202A] truncate">
                    {currentUser.username}
                  </p>

                  <p className="text-xs text-[#5F6368] truncate">
                    {currentUser.email}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="
                    w-full
                    py-2.5

                    bg-indigo-600
                    hover:bg-indigo-700

                    text-white

                    rounded-lg

                    text-xs
                    font-semibold
                  "
                >
                  Sign In / Register
                </button>
              )}
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-1">
              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-[#8A9199]
                  mb-2
                "
              >
                Shopping
              </p>

              <Link
                to="/shop"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  block
                  py-2
                  text-sm
                  text-[#17202A]
                  hover:text-indigo-600
                  font-medium
                "
              >
                All Products
              </Link>

              {POPULAR_CATEGORIES
                .filter(
                  (category) =>
                    category !== 'All'
                )
                .map((category) => (
                  <Link
                    key={category}
                    to={`/shop?category=${encodeURIComponent(
                      category
                    )}`}
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="
                      block
                      py-1.5
                      text-xs
                      text-[#5F6368]
                      hover:text-[#17202A]
                    "
                  >
                    {category}
                  </Link>
                ))}

              <div className="border-t border-[#E1E5E9] my-3" />

              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-[#8A9199]
                  mb-2
                "
              >
                Your Account
              </p>

              <Link
                to="/orders"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  flex
                  items-center
                  gap-2
                  py-2
                  text-sm
                  text-[#17202A]
                "
              >
                <Package className="w-4 h-4 text-[#5F6368]" />
                Orders & Returns
              </Link>

              <Link
                to="/wishlist"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  flex
                  items-center
                  gap-2
                  py-2
                  text-sm
                  text-[#17202A]
                "
              >
                <Heart className="w-4 h-4 text-[#5F6368]" />
                Saved Wishlist
              </Link>

              <Link
                to="/profile"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  flex
                  items-center
                  gap-2
                  py-2
                  text-sm
                  text-[#17202A]
                "
              >
                <UserIcon className="w-4 h-4 text-[#5F6368]" />
                Profile & Address
              </Link>

              {isAdmin && (
                <>
                  <div className="border-t border-[#E1E5E9] my-3" />

                  <Link
                    to="/admin"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      py-2
                      text-sm
                      font-semibold
                      text-indigo-600
                    "
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Zyphora Admin
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      text-rose-600
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
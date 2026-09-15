import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

export function WishlistPage() {
  const { items, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Heart}
          title="Sign In to View Your Wishlist"
          description="Save favorite products and access them anytime across your devices."
          actionText="Sign In Now"
          onAction={() => openAuthModal('login')}
        />
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Save items you love by tapping the heart icon on any product card."
          actionText="Discover Products"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#17202A]">Saved Wishlist</h1>
        <p className="text-xs text-[#5F6368]">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;

          return (
            <div
              key={item.id || item.productId}
              className="bg-white rounded-xl border border-[#E1E5E9] p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div>
                <div className="relative w-full aspect-square bg-slate-50 rounded-lg p-4 overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                  <img
                    src={
                      product.image ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'
                    }
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 rounded-full border border-[#E1E5E9] shadow-2xs transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {product.category}
                </span>
                <Link
                  to={`/product/${product.id}`}
                  className="block text-sm font-bold text-[#17202A] hover:text-indigo-600 transition-colors line-clamp-2 mt-0.5"
                >
                  {product.name}
                </Link>
                <p className="text-base font-extrabold text-[#17202A] mt-2">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center gap-2">
                <button
                  onClick={() => addToCart(product, 1)}
                  disabled={product.stock <= 0}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{product.stock > 0 ? 'Move to Cart' : 'Out of Stock'}</span>
                </button>
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="p-2 border border-[#E1E5E9] rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const inStock = product.stock > 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;

    setAdding(true);
    const success = await addToCart(product, 1);
    setAdding(false);

    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistLoading) return;
    setWishlistLoading(true);
    await toggleWishlist(product);
    setWishlistLoading(false);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative bg-white rounded-xl border border-[#E1E5E9] hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden"
    >
      {/* Top action bar / badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        {/* Stock / New badges */}
        <div className="flex flex-col gap-1 items-start">
          {!inStock ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 pointer-events-auto">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 pointer-events-auto">
              Only {product.stock} left
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 pointer-events-auto">
              In Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-xs border ${
            inWishlist
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-white/90 backdrop-blur-xs border-[#E1E5E9] text-[#5F6368] hover:text-rose-600'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              inWishlist ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>
      </div>

      {/* Product Image */}
      <Link
        to={`/product/${product.id}`}
        className="block relative w-full aspect-square bg-slate-50 p-4 overflow-hidden"
      >
        <img
          src={
            product.image ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'
          }
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-104 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
          }}
        />
      </Link>

      {/* Product Details */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            {product.category || 'General'}
          </span>
          <Link
            to={`/product/${product.id}`}
            className="block text-xs sm:text-sm font-semibold text-[#17202A] hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-1.5"
            title={product.name}
          >
            {product.name}
          </Link>
          <p className="text-xs text-[#5F6368] line-clamp-1 mb-2 font-normal">
            {product.description}
          </p>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8A9199]">Price</span>
            <span className="text-base font-extrabold text-[#17202A] leading-tight">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Add To Cart button */}
          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
              !inStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : adding ? (
              <span>Adding...</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

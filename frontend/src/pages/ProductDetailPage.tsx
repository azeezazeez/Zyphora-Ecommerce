import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Heart,
  Minus,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductGrid } from '../components/product/ProductGrid';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProductById(id!);
        if (!isCancelled) {
          setProduct(data);
          setQuantity(1);

          // Fetch related in same category
          if (data?.category) {
            api
              .getProducts({ category: data.category })
              .then((res) => {
                if (!isCancelled) {
                  setRelatedProducts(res.filter((p) => String(p.id) !== String(id)).slice(0, 4));
                }
              })
              .catch(() => {});
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Unable to load product details.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E1E5E9] p-8 max-w-5xl mx-auto animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-3/4 bg-gray-200 rounded" />
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-20 w-full bg-gray-100 rounded" />
            <div className="h-12 w-48 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#E1E5E9] rounded-2xl text-center shadow-xs">
        <Package className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
        <h2 className="text-lg font-bold text-[#17202A] mb-1">Product Not Found</h2>
        <p className="text-xs text-[#5F6368] mb-5">
          {error || 'The product you requested might have been moved or removed.'}
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (!inStock || adding) return;
    setAdding(true);
    const success = await addToCart(product, quantity);
    setAdding(false);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#5F6368]">
        <Link to="/" className="hover:text-indigo-600">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-indigo-600">
          Shop
        </Link>
        <span>/</span>
        <Link
          to={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-indigo-600"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[#17202A] font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Container */}
      <div className="bg-white rounded-2xl border border-[#E1E5E9] p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Stage */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square bg-[#F8F9FA] rounded-2xl border border-[#E1E5E9] p-6 flex items-center justify-center overflow-hidden">
              <img
                src={
                  product.image ||
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
                }
                alt={product.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                }}
              />

              {/* In-image Wishlist badge */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 p-2.5 rounded-full border shadow-xs transition-transform active:scale-90 ${
                  inWishlist
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-[#E1E5E9] text-[#5F6368] hover:text-rose-600'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
            <p className="text-[11px] text-[#8A9199] mt-2">
              Authentic high-resolution product photography
            </p>
          </div>

          {/* Product Info & Actions */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {product.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17202A] tracking-tight mt-1 leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Price & Stock Display */}
              <div className="flex items-baseline gap-4 py-2 border-y border-[#E1E5E9]">
                <div className="text-3xl font-extrabold text-[#17202A]">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </div>
                <div>
                  {product.stock > 5 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      In Stock ({product.stock} units available)
                    </span>
                  ) : product.stock > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      Low Stock (Only {product.stock} left)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      Currently Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#17202A] mb-1.5">
                  About This Item
                </h3>
                <p className="text-sm text-[#5F6368] leading-relaxed whitespace-pre-line">
                  {product.description ||
                    'Engineered for everyday durability and premium functionality. Backed by the official Zyphora satisfaction guarantee.'}
                </p>
              </div>

              {/* Quantity Selector */}
              {inStock && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#17202A] mb-1.5">Quantity</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#E1E5E9] rounded-lg bg-[#F8F9FA]">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="p-2 hover:text-indigo-600 text-[#5F6368] disabled:opacity-40"
                        aria-label="Reduce quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 text-sm font-bold text-[#17202A] min-w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="p-2 hover:text-indigo-600 text-[#5F6368] disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-[#8A9199]">
                      Max {Math.min(10, product.stock)} per order
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  id="pdp-add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={!inStock || adding}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                    !inStock
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : justAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Your Cart</span>
                    </>
                  ) : adding ? (
                    <span>Adding to Cart...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  id="pdp-wishlist-toggle-btn"
                  onClick={() => toggleWishlist(product)}
                  className={`px-5 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                    inWishlist
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'border-[#E1E5E9] text-[#17202A] hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
                  <span>{inWishlist ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Service & Assurance Grid */}
            <div className="pt-6 border-t border-[#E1E5E9] grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Truck className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-[#17202A]">Free Shipping</p>
                <p className="text-[10px] text-[#8A9199]">Express delivery</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <CreditCard className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-[#17202A]">Cash On Delivery</p>
                <p className="text-[10px] text-[#8A9199]">Pay on arrival</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-[#17202A]">100% Genuine</p>
                <p className="text-[10px] text-[#8A9199]">Verified quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products from same category */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#17202A]">More in {product.category}</h2>
              <p className="text-xs text-[#5F6368]">Products you might also find useful</p>
            </div>
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View More in Category →
            </Link>
          </div>
          <ProductGrid products={relatedProducts} skeletonCount={4} />
        </section>
      )}
    </div>
  );
}

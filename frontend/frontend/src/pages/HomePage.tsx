import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Laptop,
  RefreshCw,
  Shirt,
  Sparkles,
  Tag,
  Tv,
  Watch,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { ProductGrid } from '../components/product/ProductGrid';

const CATEGORY_ITEMS = [
  { name: 'Electronics', icon: Laptop, color: 'bg-blue-50 text-blue-600' },
  { name: 'Fashion', icon: Shirt, color: 'bg-rose-50 text-rose-600' },
  { name: 'Home & Kitchen', icon: Tv, color: 'bg-amber-50 text-amber-600' },
  { name: 'Accessories', icon: Watch, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Audio', icon: Headphones, color: 'bg-purple-50 text-purple-600' },
  { name: 'Books', icon: BookOpen, color: 'bg-teal-50 text-teal-600' },
];

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products from Zyphora backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Featured products (top 8)
  const featuredProducts = products.slice(0, 8);

  // New arrivals (sorted by createdAt or reverse slice)
  const newArrivals = [...products]
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return Number(b.id) - Number(a.id);
    })
    .slice(0, 4);

  return (
    <div className="space-y-10 pb-12">
      {/* Promotional Hero Banner (Amazon / Flipkart inspired) */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl overflow-hidden shadow-sm mx-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> Zyphora Marketplace
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              DISCOVER PRODUCTS <br className="hidden sm:inline" />
              <span className="text-indigo-300">YOU'LL LOVE</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore authentic collections across top brands with fast dispatch, verified stocks, and Cash on Delivery.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#17202A] hover:bg-slate-100 font-bold text-sm rounded-xl transition-all shadow-md active:scale-98"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/shop?filter=deals"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-all backdrop-blur-xs border border-white/10"
              >
                <Tag className="w-4 h-4" />
                <span>Today's Deals</span>
              </Link>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="w-full md:w-auto shrink-0 flex justify-center">
            <div className="relative w-72 sm:w-80 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
              <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80"
                  alt="Trending Electronics"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-300 block text-[11px]">Trending Picks</span>
                  <span className="font-bold text-white text-sm">Premium Audio & Gear</span>
                </div>
                <Link
                  to="/shop?category=Electronics"
                  className="text-indigo-300 hover:text-white font-semibold text-xs flex items-center gap-1"
                >
                  View <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Discovery Chips */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#17202A]">Shop By Category</h2>
            <p className="text-xs text-[#5F6368]">Browse items tailored to your lifestyle</p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORY_ITEMS.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white p-3.5 rounded-xl border border-[#E1E5E9] hover:border-slate-300 hover:shadow-xs transition-all flex flex-col items-center text-center"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-2 group-hover:scale-108 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-[#17202A] group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Error state alert if API fails / cold start */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
          <div>
            <p className="font-bold">Backend Connection Notice</p>
            <p>{error}</p>
          </div>
          <button
            onClick={fetchProducts}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold flex items-center gap-1.5 hover:bg-rose-700 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Featured Products Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#17202A]">Featured Products</h2>
            <p className="text-xs text-[#5F6368]">Hand-selected catalog highlights</p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} loading={loading} skeletonCount={8} />
      </section>

      {/* Special Highlights Banner */}
      <section className="bg-white rounded-2xl border border-[#E1E5E9] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 text-center sm:text-left max-w-lg">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Verified Zyphora Guarantee
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#17202A]">
            Genuine Products, Direct to Your Doorstep
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6368] leading-relaxed">
            Every product on Zyphora is verified for quality and packaged with express handling. Enjoy peace of mind with our no-hassle Cash on Delivery checkout.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-[#17202A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            Start Shopping
          </Link>
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#17202A]">New Arrivals</h2>
              <p className="text-xs text-[#5F6368]">Recently stocked additions</p>
            </div>
            <Link
              to="/shop?filter=new"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              See All New <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ProductGrid products={newArrivals} loading={loading} skeletonCount={4} />
        </section>
      )}
    </div>
  );
}

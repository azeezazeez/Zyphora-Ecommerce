import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  Filter,
  PackageSearch,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { ProductGrid } from '../components/product/ProductGrid';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || 'All';
  const currentSearch = searchParams.get('search') || '';
  const currentFilter = searchParams.get('filter') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort state
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  // Fetch from backend
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProducts({
          category: currentCategory !== 'All' ? currentCategory : undefined,
          search: currentSearch || undefined,
        });
        if (!isCancelled) {
          setProducts(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to fetch products.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [currentCategory, currentSearch]);

  // Derive unique categories from currently loaded or preset list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    // Add default fallbacks if set is small
    ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty', 'Sports'].forEach((c) =>
      set.add(c)
    );
    return ['All', ...Array.from(set)];
  }, [products]);

  // Max price calculation
  const highestProductPrice = useMemo(() => {
    if (products.length === 0) return 50000;
    return Math.max(...products.map((p) => Number(p.price) || 0), 1000);
  }, [products]);

  // Filtered and Sorted products
  const processedProducts = useMemo(() => {
    let list = [...products];

    // Availability filter
    if (onlyInStock) {
      list = list.filter((p) => p.stock > 0);
    }

    // Price filter
    if (maxPrice !== null) {
      list = list.filter((p) => Number(p.price) <= maxPrice);
    }

    // Special quick filter: deals / new
    if (currentFilter === 'new') {
      list = [...list].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return Number(b.id) - Number(a.id);
      });
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'newest':
        list.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return Number(b.id) - Number(a.id);
        });
        break;
      default:
        break;
    }

    return list;
  }, [products, onlyInStock, maxPrice, sortBy, currentFilter]);

  const handleCategorySelect = (category: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', category);
    }
    setSearchParams(nextParams);
    setMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSortBy('default');
    setOnlyInStock(false);
    setMaxPrice(null);
    const nextParams = new URLSearchParams();
    if (currentSearch) nextParams.set('search', currentSearch);
    setSearchParams(nextParams);
  };

  const activeFilterCount =
    (currentCategory !== 'All' ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (maxPrice !== null ? 1 : 0) +
    (currentFilter ? 1 : 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E1E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#17202A]">
              {currentSearch
                ? `Results for "${currentSearch}"`
                : currentCategory !== 'All'
                ? currentCategory
                : currentFilter === 'new'
                ? 'New Arrivals'
                : currentFilter === 'deals'
                ? "Today's Deals"
                : 'All Products'}
            </h1>
            <span className="text-xs bg-slate-100 text-[#5F6368] px-2 py-0.5 rounded font-semibold">
              {processedProducts.length} items
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Real-time stock and prices directly from Zyphora catalog
          </p>
        </div>

        {/* Controls: Mobile Filter Trigger & Sort Dropdown */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            id="mobile-filters-btn"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg text-xs font-semibold text-[#17202A] hover:bg-slate-100"
          >
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8A9199] hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg py-2 pl-3 pr-8 text-xs font-semibold text-[#17202A] cursor-pointer focus:outline-none focus:border-indigo-600"
              >
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A9199] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Catalog Grid */}
      <div className="flex gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="w-60 shrink-0 hidden lg:block bg-white rounded-xl border border-[#E1E5E9] p-5 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#17202A] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Filter Catalog
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider mb-2.5">
              Department
            </h3>
            <div className="space-y-1">
              {availableCategories.map((cat) => {
                const isSelected =
                  currentCategory === cat || (cat === 'All' && !searchParams.get('category'));
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 font-bold text-indigo-700'
                        : 'text-[#5F6368] hover:text-[#17202A] hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#E1E5E9]" />

          {/* Stock Availability Filter */}
          <div>
            <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider mb-2.5">
              Availability
            </h3>
            <label className="flex items-center gap-2 text-xs text-[#17202A] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-[#E1E5E9] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          <div className="border-t border-[#E1E5E9]" />

          {/* Price Range Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
                Max Price
              </h3>
              {maxPrice !== null && (
                <span className="text-xs font-semibold text-indigo-600">
                  ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <input
              type="range"
              min={100}
              max={highestProductPrice}
              step={100}
              value={maxPrice ?? highestProductPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#8A9199] mt-1">
              <span>₹100</span>
              <span>₹{highestProductPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </aside>

        {/* Catalog Grid Area */}
        <main className="flex-1 min-w-0">
          <ProductGrid
            products={processedProducts}
            loading={loading}
            skeletonCount={8}
            emptyTitle={
              currentSearch
                ? `No products found matching "${currentSearch}"`
                : 'No items currently in this view'
            }
            emptyDescription="Try clearing your filters or exploring our other popular categories."
            emptyActionText="Clear All Filters"
            emptyActionLink="/shop"
          />
        </main>
      </div>

      {/* Mobile Filter Bottom Sheet / Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl p-6 space-y-5 z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E5E9]">
              <h3 className="font-bold text-sm text-[#17202A]">Filter Products</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-[#5F6368] hover:text-[#17202A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-[#17202A] mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.map((cat) => {
                  const isSelected =
                    currentCategory === cat || (cat === 'All' && !searchParams.get('category'));
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-[#17202A] hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#17202A] mb-2">Availability</p>
              <label className="flex items-center gap-2 text-xs text-[#17202A]">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <span>In Stock Only</span>
              </label>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 border border-[#E1E5E9] rounded-lg text-xs font-semibold text-[#17202A]"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

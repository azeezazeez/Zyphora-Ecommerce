import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from '../common/Skeleton';
import { PackageSearch } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  emptyActionLink?: string;
}

export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your search terms or category filters to find what you need.',
  emptyActionText = 'Browse All Products',
  emptyActionLink = '/shop',
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <ProductSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription}
        actionText={emptyActionText}
        actionLink={emptyActionLink}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

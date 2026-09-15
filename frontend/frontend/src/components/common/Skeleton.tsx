import React from 'react';

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E1E5E9] p-4 flex flex-col h-full animate-pulse">
      <div className="w-full aspect-square bg-gray-100 rounded-lg mb-4" />
      <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-4/5 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="h-5 w-20 bg-gray-200 rounded" />
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function MetricSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 animate-pulse">
      <div className="h-3.5 w-28 bg-gray-200 rounded mb-3" />
      <div className="h-7 w-20 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-36 bg-gray-100 rounded" />
    </div>
  );
}

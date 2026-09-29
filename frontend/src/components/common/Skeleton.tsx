import React from 'react';

export function ProductSkeleton() {
  return (
    <div
      className="
        bg-white
        rounded-xl
        border
        border-[#E1E5E9]
        p-3
        sm:p-4
        flex
        flex-col
        h-full
        min-w-0
        overflow-hidden
        animate-pulse
      "
    >
      {/* Image */}
      <div
        className="
          w-full
          aspect-square
          bg-gray-100
          rounded-lg
          mb-4
          shrink-0
        "
      />

      {/* Text */}
      <div className="h-3 w-16 max-w-full bg-gray-200 rounded mb-2" />

      <div className="h-4 w-4/5 max-w-full bg-gray-200 rounded mb-2" />

      <div className="h-4 w-1/2 max-w-full bg-gray-200 rounded mb-4" />

      {/* Bottom */}
      <div className="mt-auto pt-2 border-t border-gray-100 min-w-0">
        <div className="h-3 w-12 bg-gray-200 rounded mb-1.5" />

        <div className="h-5 w-20 max-w-[60%] bg-gray-200 rounded mb-2" />

        <div className="h-9 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({
  cols = 5,
}: {
  cols?: number;
}) {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td
          key={i}
          className="py-3.5 px-4"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 max-w-full" />
        </td>
      ))}
    </tr>
  );
}

export function MetricSkeleton() {
  return (
    <div
      className="
        bg-white
        rounded-xl
        border
        border-[#E1E5E9]
        p-5
        min-w-0
        overflow-hidden
        animate-pulse
      "
    >
      <div className="h-3.5 w-28 max-w-full bg-gray-200 rounded mb-3" />

      <div className="h-7 w-20 max-w-full bg-gray-200 rounded mb-2" />

      <div className="h-3 w-36 max-w-full bg-gray-100 rounded" />
    </div>
  );
}
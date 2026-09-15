import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Store } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E1E5E9] p-8 text-center shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            404 • Page Not Found
          </span>
          <h1 className="text-2xl font-bold text-[#17202A] mt-1">Looking For Something?</h1>
          <p className="text-xs text-[#5F6368] mt-2 leading-relaxed">
            We couldn't locate the page or product you requested. It might have been moved or doesn't exist.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Store className="w-4 h-4" /> Go to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

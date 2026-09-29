import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export function EmptyState({
  id = 'empty-state-card',
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      id={id}
      className="bg-white rounded-xl border border-[#E1E5E9] p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8 shadow-xs"
    >
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-semibold text-[#17202A] mb-1">{title}</h3>
      <p className="text-sm text-[#5F6368] mb-6 leading-relaxed max-w-xs">{description}</p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-xs"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-xs"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
}

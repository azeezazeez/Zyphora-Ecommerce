import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/90 text-emerald-900';
      case 'error':
        return 'border-rose-200 bg-rose-50/90 text-rose-900';
      case 'warning':
        return 'border-amber-200 bg-amber-50/90 text-amber-900';
      default:
        return 'border-blue-200 bg-blue-50/90 text-blue-900';
    }
  };

  return (
    <div
      id="zyphora-toast-portal"
      className="
        fixed
        z-50
        pointer-events-none

        /* Mobile responsive bounds: pinned symmetrically to left & right with proper margins */
        bottom-4
        left-3
        right-3
        w-auto
        max-w-full

        /* Tablet & Desktop: cleanly anchored to the bottom-right corner */
        sm:bottom-5
        sm:left-auto
        sm:right-5
        sm:w-full
        sm:max-w-md
        sm:px-0

        flex
        flex-col
        gap-2.5

        /* Mobile safe-area inset protection */
        mb-[env(safe-area-inset-bottom,0px)]
      "
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              pointer-events-auto
              flex
              items-start
              gap-3
              p-3.5
              rounded-xl
              border
              shadow-md
              backdrop-blur-sm
              w-full
              max-w-full
              min-w-0
              box-border
              ${getBorderColor(toast.type)}
            `}
          >
            {getIcon(toast.type)}

            {/* Message area with min-w-0, overflow-wrap, and word break to guarantee fit on any screen */}
            <div
              className="
                flex-1
                min-w-0
                text-sm
                font-medium
                leading-snug
                break-words
                whitespace-pre-wrap
                [overflow-wrap:anywhere]
              "
            >
              {toast.message}
            </div>

            <button
              id={`toast-close-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="
                shrink-0
                text-gray-400
                hover:text-gray-700
                transition-colors
                p-1
                -mr-1
                -mt-0.5
                rounded-md
                hover:bg-black/5
                focus:outline-none
              "
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

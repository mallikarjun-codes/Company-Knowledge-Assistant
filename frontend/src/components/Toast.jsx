import { useEffect } from 'react';

/**
 * Toast component — renders a single toast notification.
 * Positioned fixed at bottom-right, auto-dismisses after 3s.
 *
 * Props:
 *   toasts  – array of { id, message, type: 'success' | 'error' }
 *   remove  – fn(id) called when a toast should be removed
 */
export default function Toast({ toasts, remove }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} remove={remove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, remove }) {
  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, remove]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto flex items-start gap-3 min-w-[260px] max-w-sm
        rounded-xl px-4 py-3 shadow-xl text-sm font-medium
        border backdrop-blur-sm
        animate-toast-in
        ${
          isSuccess
            ? 'bg-green-500/15 border-green-500/30 text-green-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'
        }
      `}
    >
      {/* Icon */}
      <span className="mt-0.5 flex-shrink-0 text-base">
        {isSuccess ? '✓' : '✕'}
      </span>

      {/* Message */}
      <span className="flex-1 leading-snug">{toast.message}</span>

      {/* Close button */}
      <button
        onClick={() => remove(toast.id)}
        aria-label="Dismiss"
        className={`flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ${
          isSuccess ? 'text-green-300' : 'text-red-300'
        }`}
      >
        ✕
      </button>
    </div>
  );
}

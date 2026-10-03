import { useState, useCallback } from 'react';

let _nextId = 0;

/**
 * useToast — lightweight toast notification hook.
 *
 * Returns:
 *   toasts  – array of active toasts (pass to <Toast>)
 *   toast   – fn({ message, type }) to add a toast
 *   remove  – fn(id) to manually remove a toast (also used by <Toast> internally)
 *
 * Convenience helpers:
 *   toastSuccess(message)
 *   toastError(message)
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ message, type = 'success' }) => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const toastSuccess = useCallback(
    (message) => toast({ message, type: 'success' }),
    [toast]
  );

  const toastError = useCallback(
    (message) => toast({ message, type: 'error' }),
    [toast]
  );

  return { toasts, toast, remove, toastSuccess, toastError };
}

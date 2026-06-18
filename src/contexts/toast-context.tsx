/**
 * src/contexts/toast-context.tsx
 * Toast notification context and provider
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastContainer, type ToastType, type ToastProps } from "@/components/ui/toast";

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 5000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const toast: ToastProps = {
        id,
        type,
        message,
        duration,
        onClose: removeToast,
      };
      setToasts((prev) => [...prev, toast]);
    },
    [removeToast]
  );

  const success = useCallback((message: string, duration = 5000) => {
    showToast(message, "success", duration);
  }, [showToast]);

  const error = useCallback((message: string, duration = 6000) => {
    showToast(message, "error", duration);
  }, [showToast]);

  const info = useCallback((message: string, duration = 4000) => {
    showToast(message, "info", duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration = 5000) => {
    showToast(message, "warning", duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

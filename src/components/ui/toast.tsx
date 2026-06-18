/**
 * src/components/ui/toast.tsx
 * Toast notification component with fixed positioning
 */

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const styles = {
    success: {
      bg: "bg-green-50 dark:bg-green-500/10",
      border: "border-green-200 dark:border-green-500/30",
      text: "text-green-800 dark:text-green-300",
      icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
    },
    error: {
      bg: "bg-red-50 dark:bg-red-500/10",
      border: "border-red-200 dark:border-red-500/30",
      text: "text-red-800 dark:text-red-300",
      icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
      border: "border-yellow-200 dark:border-yellow-500/30",
      text: "text-yellow-800 dark:text-yellow-300",
      icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-500/30",
      text: "text-blue-800 dark:text-blue-300",
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
  };

  const style = styles[type];

  return (
    <div
      className={`
        animate-in fade-in slide-in-from-top-4 duration-300
        flex items-start gap-3 rounded-lg border p-4
        ${style.bg} ${style.border} ${style.text}
        shadow-lg backdrop-blur-sm
      `}
    >
      <div className="mt-0.5 flex-shrink-0">{style.icon}</div>
      <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="ml-2 flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

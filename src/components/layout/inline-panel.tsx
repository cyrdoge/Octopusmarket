/**
 * src/components/layout/inline-panel.tsx
 * Reusable overlay panel component
 * Extracted from octopus-market-page.tsx for reuse
 */

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InlinePanelProps = {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
};

export function InlinePanel({
  open,
  onClose,
  side = "right",
  title,
  description,
  badge,
  children,
  className,
}: InlinePanelProps) {
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {side === "left" ? (
        <div
          className={`flex h-full w-full max-w-[96vw] flex-col overflow-hidden border-r border-orange-200 bg-white text-zinc-950 shadow-2xl dark:border-white/10 dark:bg-zinc-950 dark:text-white sm:max-w-sm animate-in slide-in-from-left duration-300 ${className ?? ""}`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-orange-100 bg-white/90 px-5 py-5 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/85">
            <div>
              <h2 className="text-left text-xl font-semibold text-zinc-950 dark:text-white">{title}</h2>
              {description ? (
                <p className="mt-1 text-left text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-2xl border-orange-200 bg-white text-zinc-950 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
              onClick={onClose}
            >
              <X className="size-4" />
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      ) : null}

      <button type="button" className="flex-1 cursor-default" aria-label="Close panel overlay" onClick={onClose} />

      {side === "right" ? (
        <div
          className={`ml-auto flex h-full w-full max-w-[96vw] flex-col overflow-hidden border-l border-orange-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_12%,#fff7ed_100%)] text-zinc-950 shadow-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,#09090b_0%,#18181b_18%,#09090b_100%)] dark:text-white lg:max-w-[1320px] animate-in slide-in-from-right duration-300 ${className ?? ""}`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-orange-100 bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5 dark:border-white/10 dark:bg-zinc-950/85">
            <div>
              <h2 className="text-left text-xl font-semibold text-zinc-950 dark:text-white">{title}</h2>
              {description ? (
                <p className="mt-1 text-left text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {badge ? (
                <Badge className="border border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/15">
                  {badge}
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-2xl border-orange-200 bg-white text-zinc-950 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                onClick={onClose}
              >
                <X className="size-4" />
                Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

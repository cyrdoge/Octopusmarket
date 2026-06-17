/**
 * src/components/layout/aido-launcher.tsx
 * Floating Aido agent launcher button
 */

import { Button } from "@/components/ui/button";
import { ArrowUpToLine } from "lucide-react";

type AidoLauncherProps = {
  onOpenAido: () => void;
  onScrollTop: () => void;
};

export function AidoLauncher({ onOpenAido, onScrollTop }: AidoLauncherProps) {
  return (
    <>
      {/* Scroll to top button */}
      <Button
        type="button"
        size="icon"
        className="fixed bottom-24 right-3 z-40 size-11 rounded-full border border-orange-300/70 bg-white/95 text-zinc-950 shadow-[0_18px_40px_rgba(249,115,22,0.22)] backdrop-blur-md hover:bg-white sm:bottom-28 sm:right-4 sm:size-12 dark:border-white/10 dark:bg-zinc-950/95 dark:text-white dark:hover:bg-zinc-900"
        onClick={onScrollTop}
        aria-label="Back to top"
      >
        <ArrowUpToLine className="size-5" />
      </Button>

      {/* Aido agent floating button */}
      <Button
        type="button"
        onClick={onOpenAido}
        className="fixed bottom-3 right-3 z-40 h-auto rounded-[1.5rem] border border-orange-300/70 bg-white/95 px-3 py-2.5 text-zinc-950 shadow-[0_20px_40px_rgba(249,115,22,0.16)] backdrop-blur-md hover:bg-white sm:bottom-4 sm:right-4 sm:rounded-[1.75rem] sm:px-4 sm:py-3 dark:border-orange-400/25 dark:bg-zinc-950/95 dark:text-white dark:hover:bg-zinc-900"
      >
        <span className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(249,115,22,0.14))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(249,115,22,0.2))]" />
        <span className="pointer-events-none absolute -right-2 -top-2 size-4 rounded-full bg-orange-400 dark:bg-orange-300" />
        <span className="relative flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-white/60 bg-white/80 shadow-[0_10px_25px_rgba(249,115,22,0.22)] dark:border-white/10 dark:bg-zinc-900/90 dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
            🤖
          </span>
          <span className="flex flex-col items-start">
            <span className="text-sm font-semibold leading-none">Aido Agent</span>
            <span className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Floating assistant</span>
          </span>
        </span>
      </Button>
    </>
  );
}

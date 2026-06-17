/**
 * src/components/layout/market-header.tsx
 * Market header component
 * To be gradually filled with actual header implementation from octopus-market-page.tsx
 */

import { OctopusBrand } from "@/components/octopus-market/octopus-brand";
import { ThemeToggle } from "@/components/octopus-market/theme-toggle";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Menu } from "lucide-react";

type MarketHeaderProps = {
  isWalletConnected: boolean;
  walletLabel?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenMobileMenu: () => void;
};

export function MarketHeader({
  isWalletConnected,
  walletLabel = "Connect wallet",
  isDark,
  onToggleTheme,
  onConnectWallet,
  onDisconnectWallet,
  onOpenMobileMenu,
}: MarketHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-white backdrop-blur-xl dark:border-white/10 dark:bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:gap-4 lg:px-8">
        {/* Left: Brand */}
        <div className="flex min-w-0 items-center gap-3">
          <OctopusBrand compact />
        </div>

        {/* Center: Navigation (hidden on mobile) */}
        <nav className="hidden flex-1 xl:flex" />

        {/* Right: Wallet + Theme + Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Desktop wallet controls */}
          <div className="hidden gap-3 xl:flex">
            <Button variant="outline" size="sm" onClick={onConnectWallet}>
              <Wallet className="mr-2 size-4" />
              {walletLabel}
            </Button>
            {isWalletConnected && (
              <Button variant="outline" size="sm" onClick={onDisconnectWallet}>
                <LogOut className="mr-2 size-4" />
                Disconnect
              </Button>
            )}
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          </div>

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="xl:hidden" onClick={onOpenMobileMenu}>
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

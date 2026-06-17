/**
 * src/components/layout/market-header.tsx
 * Market header with responsive navigation
 * Desktop: Home | Explore | Predictions | List AI | Connect Wallet / Menu
 * Mobile: Connect Wallet | Menu
 */

import { OctopusBrand } from "@/components/octopus-market/octopus-brand";
import { ThemeToggle } from "@/components/octopus-market/theme-toggle";
import { Button } from "@/components/ui/button";
import { Wallet, Menu } from "lucide-react";

type MarketHeaderProps = {
  isWalletConnected: boolean;
  walletLabel?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onConnectWallet: () => void;
  onOpenMobileMenu: () => void;
};

const navItems = [
  { label: "Home", path: "#/" },
  { label: "Explore", path: "#/explore" },
  { label: "Predictions", path: "#/prediction-market" },
  { label: "List My AI", path: "#/list-my-ai" },
];

export function MarketHeader({
  isWalletConnected,
  walletLabel = "Connect Wallet",
  isDark,
  onToggleTheme,
  onConnectWallet,
  onOpenMobileMenu,
}: MarketHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-white backdrop-blur-xl dark:border-white/10 dark:bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">

        {/* Left: Brand */}
        <div className="flex-shrink-0">
          <OctopusBrand compact />
        </div>

        {/* Center: Desktop Navigation (hidden on mobile/tablet) */}
        <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="text-sm font-medium text-zinc-700 transition-colors hover:text-orange-600 dark:text-zinc-300 dark:hover:text-orange-400"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Desktop Actions (hidden on mobile/tablet) */}
        <div className="hidden gap-3 lg:flex lg:items-center lg:flex-shrink-0">
          {/* Connect Wallet Button (shown when NOT connected) */}
          {!isWalletConnected && (
            <>
              <Button
                size="sm"
                onClick={onConnectWallet}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Wallet className="mr-2 size-4" />
                {walletLabel}
              </Button>
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            </>
          )}

          {/* Menu Button (shown when connected on desktop) */}
          {isWalletConnected && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileMenu}
            >
              <Menu className="size-5" />
            </Button>
          )}
        </div>

        {/* Mobile: Only Connect Wallet + Menu */}
        <div className="flex lg:hidden items-center gap-2">
          {!isWalletConnected && (
            <Button
              size="sm"
              onClick={onConnectWallet}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Wallet className="size-4" />
            </Button>
          )}

          {/* Mobile Menu (always visible on mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileMenu}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * src/components/layout/market-header.tsx
 * Market header with Radix UI components
 * Desktop: Navigation Menu (Home / Explore / Predictions) + Connect Wallet / Account Dropdown
 * Mobile: Brand + Hamburger only — nav items & wallet controls live in the mobile drawer
 */

import { OctopusBrand } from "@/components/octopus-market/octopus-brand";
import { Button } from "@/components/ui/button";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/wallet-context";
import { SignIn, List, CaretDown } from "@phosphor-icons/react";

type MarketHeaderProps = {
  isWalletConnected: boolean;
  walletLabel?: string;
  onConnectWallet: () => void;
  onOpenMobileMenu: () => void;
};

const navItems = [
  { label: "Home", path: "/" },
  { label: "Explore", path: "/explore" },
  { label: "Predictions", path: "/predictions" },
  { label: "List My AI", path: "/list-my-ai" },
];

export function MarketHeader({
  isWalletConnected,
  walletLabel = "Connect Wallet",
  onConnectWallet,
  onOpenMobileMenu,
}: MarketHeaderProps) {
  const navigate = useNavigate();
  const wallet = useWallet();

  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-white backdrop-blur-xl dark:border-white/10 dark:bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">

        {/* Left: Brand */}
        <div className="flex-shrink-0">
          <OctopusBrand compact />
        </div>

        {/* Center: Desktop Navigation (hidden on mobile/tablet) */}
        <NavigationMenu.Root className="hidden lg:block">
          <NavigationMenu.List className="flex gap-8">
            {navItems.map((item) => (
              <NavigationMenu.Item key={item.path}>
                <NavigationMenu.Link asChild>
                  <a
                    href={item.path}
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-orange-600 dark:text-zinc-300 dark:hover:text-orange-400"
                  >
                    {item.label}
                  </a>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        {/* Right: Desktop Actions (hidden on mobile/tablet) */}
        <div className="hidden gap-3 lg:flex lg:items-center lg:flex-shrink-0">
          {/* Connect Wallet Button (shown when NOT connected) */}
          {!isWalletConnected && (
            <Button
              size="sm"
              onClick={onConnectWallet}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            >
              <SignIn size={16} weight="bold" />
              {walletLabel}
            </Button>
          )}

          {/* Account Dropdown (shown when connected) — shows the connected address */}
          {isWalletConnected && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {walletLabel}
                  <CaretDown size={14} />
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content
                className="min-w-48 rounded-lg border border-orange-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-950"
                align="end"
                sideOffset={8}
              >
                <DropdownMenu.Item
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2 text-sm text-zinc-700 hover:bg-orange-50 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Dashboard
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 border-orange-100 dark:border-white/10" />

                <DropdownMenu.Item
                  onClick={() => wallet.disconnect()}
                  className="px-4 py-2 text-sm text-zinc-700 hover:bg-orange-50 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Disconnect
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </div>

        {/* Mobile: Hamburger only */}
        <div className="flex lg:hidden items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileMenu}
            className="text-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            <List size={24} weight="bold" />
          </Button>
        </div>
      </div>
    </header>
  );
}

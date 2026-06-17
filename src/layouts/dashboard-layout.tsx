/**
 * src/layouts/dashboard-layout.tsx
 * Dashboard layout for user pages (My Bets, My Winnings, Wallet)
 */

import { Outlet } from "react-router-dom";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { useWallet } from "@/contexts/wallet-context";
import { useNavigation } from "@/contexts/navigation-context";
import { MarketHeader } from "@/components/layout/market-header";
import { MarketFooter } from "@/components/layout/market-footer";

export function DashboardLayout() {
  const { isDark, toggleTheme } = useThemeMode();
  const wallet = useWallet();
  const nav = useNavigation();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <MarketHeader
        isWalletConnected={wallet.isConnected}
        walletLabel={wallet.walletDisplayLabel}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onConnectWallet={wallet.connect}
        onOpenMobileMenu={() => nav.openOverlay("mobile-menu")}
      />

      {/* Main content */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <MarketFooter
        onListMyAI={() => nav.navigateToPath("/list-my-ai")}
        onBrowseMarkets={() => nav.navigateToPath("/explore")}
      />
    </div>
  );
}

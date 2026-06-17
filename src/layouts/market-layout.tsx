/**
 * src/layouts/market-layout.tsx
 * Market layout - wraps market pages with shared chrome
 * Chrome = Header + Footer + AidoLauncher + Overlays
 * Uses NavigationContext for state management
 */

import { Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { useWallet } from "@/contexts/wallet-context";
import { useNavigation } from "@/contexts/navigation-context";
import { useChat } from "@/contexts/chat-provider";
import { MarketHeader } from "@/components/layout/market-header";
import { MarketFooter } from "@/components/layout/market-footer";
import { AidoLauncher } from "@/components/layout/aido-launcher";
import { InlinePanel } from "@/components/layout/inline-panel";

const LazyCyrDogeChat = lazy(() =>
  import("@/components/octopus-market/cyrdoge-chat").then((m) => ({
    default: m.CyrDogeChat,
  }))
);

export function MarketLayout() {
  const { isDark, toggleTheme } = useThemeMode();
  const wallet = useWallet();
  const nav = useNavigation();
  const chat = useChat();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <MarketHeader
        isWalletConnected={wallet.isConnected}
        walletLabel={wallet.walletDisplayLabel}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onConnectWallet={wallet.connect}
        onDisconnectWallet={wallet.disconnect}
        onOpenMobileMenu={() => nav.openOverlay("mobile-menu")}
      />

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <MarketFooter
        onListMyAI={() => nav.navigateToPath("#/list-my-ai")}
        onBrowseMarkets={() => nav.navigateToPath("#/explore")}
      />

      {/* Aido Launcher (floating buttons) */}
      <AidoLauncher
        onOpenAido={() => nav.openOverlay("aido")}
        onScrollTop={nav.scrollToTop}
      />

      {/* Mobile Menu Overlay */}
      <InlinePanel
        open={nav.activeOverlay === "mobile-menu"}
        onClose={nav.closeOverlay}
        side="left"
        title="Octopus Market"
      >
        <div className="mt-5 space-y-2.5 px-4 pb-6">
          <MobileMenuContent onNavigate={(path) => {
            nav.navigateToPath(path);
            nav.closeOverlay();
          }} />
        </div>
      </InlinePanel>

      {/* Explore Overlay */}
      <InlinePanel
        open={nav.activeOverlay === "explore"}
        onClose={nav.closeOverlay}
        side="right"
        title="Explore AI"
        description="Browse community-created AI tools"
        badge="Dedicated view"
        className="lg:max-w-[1260px]"
      >
        <div className="p-6">
          <button
            onClick={() => nav.navigateToPath("#/explore")}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Open Full Explorer →
          </button>
        </div>
      </InlinePanel>

      {/* Predictions Overlay */}
      <InlinePanel
        open={nav.activeOverlay === "predictions"}
        onClose={nav.closeOverlay}
        side="right"
        title="Prediction Market"
        description="Predict events and place bets"
        badge="Dedicated view"
      >
        <div className="p-6">
          <button
            onClick={() => nav.navigateToPath("#/prediction-market")}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Open Full Market →
          </button>
        </div>
      </InlinePanel>

      {/* Launch Token Overlay */}
      <InlinePanel
        open={nav.activeOverlay === "launch-token"}
        onClose={nav.closeOverlay}
        side="right"
        title="Launch Token"
        description="Create and launch your Solana token"
        badge="Studio"
      >
        <div className="p-6">
          <button
            onClick={() => nav.navigateToPath("#/launch-token")}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Open Studio →
          </button>
        </div>
      </InlinePanel>

      {/* List AI Overlay */}
      <InlinePanel
        open={nav.activeOverlay === "list-ai"}
        onClose={nav.closeOverlay}
        side="right"
        title="List Your AI"
        description="Submit your AI product to Octopus Market"
        badge="Studio"
      >
        <div className="p-6">
          <button
            onClick={() => nav.navigateToPath("#/list-my-ai")}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Open Studio →
          </button>
        </div>
      </InlinePanel>

      {/* Aido Chat Overlay */}
      <InlinePanel
        open={nav.activeOverlay === "aido"}
        onClose={nav.closeOverlay}
        side="right"
        title="Aido Agent"
        description="The assistant is now available from this floating entry point."
        className="lg:max-w-[1260px]"
      >
        <div className="p-4">
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading chat...</div>}>
            <LazyCyrDogeChat
              isWalletConnected={wallet.isConnected}
              walletAddress={wallet.walletAddress}
              onConnectWallet={async () => {
                const result = await wallet.connect();
                return result?.address ?? null;
              }}
            />
          </Suspense>
        </div>
      </InlinePanel>
    </div>
  );
}

// Mobile menu navigation
function MobileMenuContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  const wallet = useWallet();
  const { isDark, toggleTheme } = useThemeMode();

  const menuItems = [
    { label: "Home", path: "#/", icon: "🏠" },
    { label: "Explore AI", path: "#/explore", icon: "🔍" },
    { label: "Predictions", path: "#/prediction-market", icon: "📊" },
    { label: "Launch Token", path: "#/launch-token", icon: "🚀" },
    { label: "Pricing", path: "#/listing-price", icon: "💰" },
  ];

  return (
    <>
      {/* Wallet Controls */}
      <div className="space-y-2 border-b border-orange-200 pb-4 dark:border-white/10">
        {wallet.isConnected ? (
          <>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs dark:border-white/10 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">Connected</p>
              <p className="mt-1 font-mono font-semibold">{wallet.walletDisplayLabel}</p>
            </div>
            <button
              onClick={() => wallet.disconnect()}
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => wallet.connect()}
            className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className="flex w-full items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm hover:border-orange-300 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20 dark:hover:bg-zinc-800"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="border-t border-orange-200 pt-4 dark:border-white/10">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span>{isDark ? "☀️" : "🌙"}</span>
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </>
  );
}

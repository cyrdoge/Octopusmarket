/**
 * src/layouts/market-layout.tsx
 * Market layout - wraps market pages with shared chrome
 * Chrome = Header + Footer + AidoLauncher + Overlays
 * Uses NavigationContext for state management
 */

import { Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import { useWallet } from "@/contexts/wallet-context";
import { useNavigation } from "@/contexts/navigation-context";
import { useChat } from "@/contexts/chat-provider";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { MarketHeader } from "@/components/layout/market-header";
import { MarketFooter } from "@/components/layout/market-footer";
import { AidoLauncher } from "@/components/layout/aido-launcher";
import { InlinePanel } from "@/components/layout/inline-panel";
import { SignIn, SignOut, Moon, Sun } from "@phosphor-icons/react";

const LazyCyrDogeChat = lazy(() =>
  import("@/components/octopus-market/cyrdoge-chat").then((m) => ({
    default: m.CyrDogeChat,
  }))
);

export function MarketLayout() {
  const wallet = useWallet();
  const nav = useNavigation();
  const chat = useChat();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <MarketHeader
        isWalletConnected={wallet.isConnected}
        walletLabel={wallet.walletDisplayLabel}
        onConnectWallet={wallet.connect}
        onOpenMobileMenu={() => nav.openOverlay("mobile-menu")}
      />

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <MarketFooter/>

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
            onClick={() => nav.navigateToPath("/explore")}
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
            onClick={() => nav.navigateToPath("/prediction-market")}
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
            onClick={() => nav.navigateToPath("/launch-token")}
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
            onClick={() => nav.navigateToPath("/list-my-ai")}
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

  // Same items as the desktop nav (Home / Explore / Predictions), plus
  // Dashboard (account, replaces the old Wallet / My Bets / My Winnings group)
  // and List My AI (no longer a separate CTA in the header on mobile).
  const mainItems = [
    ...(wallet.isConnected ? [{ label: "Dashboard", path: "/dashboard" }] : []),
    { label: "Home", path: "/" },
    { label: "Explore", path: "/explore" },
    { label: "Predictions", path: "/predictions" },
    { label: "List My AI", path: "/list-my-ai" },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Wallet Controls */}
      <div className="space-y-2 border-b border-orange-200 pb-4 dark:border-white/10">
        {!wallet.isConnected ? (
          <button
            onClick={() => wallet.connect()}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <SignIn size={18} weight="bold" />
            Connect Wallet
          </button>
        ) : (
          <>
            <div className="w-full rounded-lg border border-orange-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
              {wallet.walletDisplayLabel}
            </div>
            <button
              onClick={() => wallet.disconnect()}
              className="w-full rounded-lg border border-orange-200 bg-white px-4 py-3 text-sm font-medium hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <SignOut size={18} weight="bold" />
              Disconnect
            </button>
          </>
        )}
      </div>

      {/* Main navigation */}
      <div className="space-y-1">
        {mainItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className="flex w-full items-center rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm hover:border-orange-300 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20 dark:hover:bg-zinc-800 transition-colors"
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="border-t border-orange-200 pt-3 dark:border-white/10">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
        >
          {isDark ? (
            <>
              <Sun size={18} weight="bold" className="text-orange-600 dark:text-orange-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={18} weight="bold" className="text-orange-600 dark:text-orange-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

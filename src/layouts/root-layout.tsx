/**
 * src/layouts/root-layout.tsx
 * Root layout - wraps entire app with global providers
 * - OctopusLocaleProvider (existing)
 * - SnErrorBoundary (existing)
 * - WalletProvider (wallet state)
 * - NavigationProvider (overlay & navigation state)
 * - Outlet for child routes
 */

import { Outlet } from "react-router-dom";
import { SnErrorBoundary } from "../../supernova/helpers/snErrorBoundary";
import { OctopusLocaleProvider } from "@/components/octopus-market/octopus-locale";
import { WalletProvider } from "@/contexts/wallet-context";
import { NavigationProvider } from "@/contexts/navigation-context";

export function RootLayout() {
  return (
    <SnErrorBoundary>
      <OctopusLocaleProvider>
        <WalletProvider>
          <NavigationProvider>
            <div id="root" className="min-h-screen bg-background text-foreground">
              <Outlet />
            </div>
          </NavigationProvider>
        </WalletProvider>
      </OctopusLocaleProvider>
    </SnErrorBoundary>
  );
}

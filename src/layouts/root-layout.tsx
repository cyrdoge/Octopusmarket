/**
 * src/layouts/root-layout.tsx
 * Root layout - wraps entire app with global providers
 * - OctopusLocaleProvider (existing)
 * - SnErrorBoundary (existing)
 * - WalletProvider (wallet state)
 * - NavigationProvider (overlay & navigation state)
 * - PredictionProvider (prediction market state)
 * - MarketProvider (AI market state)
 * - ChatProvider (Aido chat state)
 * - ToastProvider (toast notifications)
 * - Outlet for child routes
 */

import { Outlet } from "react-router-dom";
import { SnErrorBoundary } from "../../supernova/helpers/snErrorBoundary";
import { OctopusLocaleProvider } from "@/components/octopus-market/octopus-locale";
import { WalletProvider } from "@/contexts/wallet-context";
import { NavigationProvider } from "@/contexts/navigation-context";
import { PredictionProvider } from "@/contexts/prediction-provider";
import { MarketProvider } from "@/contexts/market-provider";
import { ChatProvider } from "@/contexts/chat-provider";
import { ToastProvider } from "@/contexts/toast-context";

export function RootLayout() {
  return (
    <SnErrorBoundary>
      <OctopusLocaleProvider>
        <WalletProvider>
          <NavigationProvider>
            <PredictionProvider>
              <MarketProvider>
                <ChatProvider>
                  <ToastProvider>
                    <div className="min-h-screen bg-background text-foreground">
                      <Outlet />
                    </div>
                  </ToastProvider>
                </ChatProvider>
              </MarketProvider>
            </PredictionProvider>
          </NavigationProvider>
        </WalletProvider>
      </OctopusLocaleProvider>
    </SnErrorBoundary>
  );
}

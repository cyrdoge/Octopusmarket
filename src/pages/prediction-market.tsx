/**
 * src/pages/prediction-market.tsx
 * Prediction market page
 */

import { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";

const LazyBinaryPredictionStudio = lazy(() =>
  import("@/components/octopus-market/binary-prediction-studio").then((m) => ({
    default: m.BinaryPredictionStudio,
  }))
);

export function PredictionMarketPage() {
  const wallet = useWallet();

  // Convert wallet context result to match component expectations
  const handleConnect = async () => {
    return wallet.connect().then(result => result?.address ?? null);
  };

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">Prediction Market</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Predict events, place bets, and compete with the community.
        </p>
      </div>

      {/* Prediction Studio */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">Loading prediction market...</CardContent>
            </Card>
          }
        >
          <LazyBinaryPredictionStudio
            isWalletConnected={wallet.isConnected}
            walletAddress={wallet.walletAddress}
            walletUsername={wallet.walletDisplayLabel}
            onConnectWallet={handleConnect}
            selectedCategoryId="sports"
            selectedMarketId=""
          />
        </Suspense>
      </div>
    </div>
  );
}

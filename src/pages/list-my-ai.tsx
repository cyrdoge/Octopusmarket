/**
 * src/pages/list-my-ai.tsx
 * List my AI page - same as launch studio but for listing
 */

import { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";

const LazyOctopusAIListingDialog = lazy(() =>
  import("@/components/octopus-market/octopus-ai-listing-dialog").then((m) => ({
    default: m.OctopusAIListingDialog,
  }))
);

export function ListMyAIPage() {
  const wallet = useWallet();

  const handleConnect = async () => {
    const result = await wallet.connect();
    return result?.address ?? null;
  };

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">List Your AI</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Submit your AI product to Octopus Market for community discovery.
        </p>
      </div>

      {/* Listing Form */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">Loading listing form...</CardContent>
            </Card>
          }
        >
          <LazyOctopusAIListingDialog
            walletAddress={wallet.walletAddress}
            walletRecord={null}
            onConnectWallet={handleConnect}
          />
        </Suspense>
      </div>
    </div>
  );
}
/**
 * src/pages/launch-studio.tsx
 * Launch studio - for launching tokens and listing AI
 */

import { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";

const LazySolfairLaunchStudio = lazy(() =>
  import("@/components/octopus-market/solfair-launch-studio").then((m) => ({
    default: m.SolfairLaunchStudio,
  }))
);

const LazyOctopusAIListingDialog = lazy(() =>
  import("@/components/octopus-market/octopus-ai-listing-dialog").then((m) => ({
    default: m.OctopusAIListingDialog,
  }))
);

type LaunchStudioPageProps = {
  mode?: "launch" | "list";
};

export function LaunchStudioPage({ mode = "launch" }: LaunchStudioPageProps) {
  const wallet = useWallet();

  const handleConnect = async () => {
    const result = await wallet.connect();
    return result?.address ?? null;
  };

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">
          {mode === "launch" ? "Launch Token" : "List Your AI"}
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          {mode === "launch"
            ? "Create and launch a Solana token for your AI project."
            : "Submit your AI product to Octopus Market for community discovery."}
        </p>
      </div>

      {/* Studio Content */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">Loading studio...</CardContent>
            </Card>
          }
        >
          {mode === "launch" ? (
            <LazySolfairLaunchStudio
              walletAddress={wallet.walletAddress}
              isWalletConnected={wallet.isConnected}
              onConnectWallet={handleConnect}
            />
          ) : (
            <LazyOctopusAIListingDialog
              walletAddress={wallet.walletAddress}
              walletRecord={null}
              onConnectWallet={handleConnect}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
/**
 * src/pages/explore.tsx
 * Explore page - Browse AI tools
 */

import { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";
import { useMarket } from "@/contexts/market-provider";

const LazyCommunityAIMarket = lazy(() =>
  import("@/components/octopus-market/community-ai-market").then((m) => ({
    default: m.CommunityAIMarket,
  }))
);

export function ExplorePage() {
  const wallet = useWallet();
  const market = useMarket();
  const guestActorId = `guest-${Math.random().toString(36).slice(2, 10)}`;

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">Explore AI Tools</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Discover and interact with community-created AI products on Octopus Market.
        </p>
      </div>

      {/* AI Market Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<Card><CardContent className="p-6">Loading AI tools...</CardContent></Card>}>
          <LazyCommunityAIMarket actorKey={wallet.walletAddress || guestActorId} actorLabel={wallet.walletDisplayLabel} />
        </Suspense>
      </div>
    </div>
  );
}
/**
 * src/pages/prediction-market.tsx
 * Page de création d'un événement de prédiction (admin uniquement)
 */

import { useWallet } from "@/contexts/wallet-context";
import { AdminPanel } from "@/components/octopus-market/binary-prediction-studio/AdminPanel";

export function PredictionMarketPage() {
  const wallet = useWallet();

  return (
    <div className="space-y-8 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">
          Create Market
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Create a new prediction event for users to bet on.
        </p>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <AdminPanel walletAddress={wallet.walletAddress} />
      </div>
    </div>
  );
}

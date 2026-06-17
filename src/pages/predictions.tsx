/**
 * src/pages/predictions.tsx
 * Predictions listing page - Browse and place bets on prediction events
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";
import {
  predictionMarketCategories,
  predictionMarketQuestions,
  type PredictionMarketQuestion,
} from "@/components/octopus-market/octopus-market-data";
import {
  readAdminCreatedPredictionMarkets,
  subscribeToPredictionMarketStorage,
  type AdminCreatedPredictionMarket,
} from "@/components/octopus-market/prediction-market-store";
import { EventsListEnhanced } from "@/components/octopus-market/binary-prediction-studio/index";

export function PredictionsPage() {
  const wallet = useWallet();
  const [activeCategoryId, setActiveCategoryId] = useState(predictionMarketCategories[0]?.id ?? "crypto");
  const [adminCreatedMarkets, setAdminCreatedMarkets] = useState<AdminCreatedPredictionMarket[]>(() =>
    readAdminCreatedPredictionMarkets()
  );

  // Subscribe to storage updates
  useEffect(() => {
    return subscribeToPredictionMarketStorage(() => {
      setAdminCreatedMarkets(readAdminCreatedPredictionMarkets());
    });
  }, []);

  // Combine default questions with admin-created markets
  const allQuestions = useMemo(() => {
    return [...predictionMarketQuestions, ...adminCreatedMarkets];
  }, [adminCreatedMarkets]);

  // Filter by category
  const questions = useMemo(() => {
    return allQuestions.filter((q) => {
      // For admin created markets, categoryId is a direct property
      if ("categoryId" in q && typeof q.categoryId === "string") {
        return q.categoryId === activeCategoryId;
      }
      // For default questions, they should have categoryId
      return (q as any).categoryId === activeCategoryId;
    });
  }, [allQuestions, activeCategoryId]);

  const handleSelectEvent = useCallback((eventId: string) => {
    console.log("Selected event:", eventId);
    // TODO: Navigate to event details or open betting modal
  }, []);

  const handleConnect = useCallback(async () => {
    return wallet.connect().then((result) => result?.address ?? null);
  }, [wallet]);

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">Prediction Events</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Browse all prediction events and place your bets.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {predictionMarketCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  activeCategoryId === category.id
                    ? "bg-orange-500 text-white"
                    : "border border-orange-200 bg-white text-zinc-700 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Events ({questions.length})</h2>
          <EventsListEnhanced
            events={questions}
            onSelectEvent={handleSelectEvent}
            isLoading={false}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <strong>How it works:</strong> Select a prediction event, choose your outcome, place a bet using Solana, and win if your prediction is correct.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

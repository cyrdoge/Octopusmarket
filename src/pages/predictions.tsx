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
  appendPredictionHistoryEntry,
  type AdminCreatedPredictionMarket,
  type PredictionHistoryEntry,
} from "@/components/octopus-market/prediction-market-store";
import { EventsList } from "@/components/octopus-market/binary-prediction-studio/index";

export function PredictionsPage() {
  const wallet = useWallet();
  const [activeCategoryId, setActiveCategoryId] = useState(predictionMarketCategories[0]?.id ?? "crypto");
  const [adminCreatedMarkets, setAdminCreatedMarkets] = useState<AdminCreatedPredictionMarket[]>(() =>
    readAdminCreatedPredictionMarkets()
  );
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const handleConfirmBet = useCallback(
    (params: {
      eventId: string;
      optionId: string;
      optionLabel: string;
      amount: number;
      potentialReturn: number;
    }) => {
      // Verify wallet is connected
      if (!wallet.isConnected || !wallet.walletAddress) {
        setNotification({
          type: "error",
          message: "Wallet not connected. Please connect your wallet first.",
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      // Verify amount is valid
      if (params.amount < 2 || params.amount > 50) {
        setNotification({
          type: "error",
          message: "Bet amount must be between $2 and $50 USDC",
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      try {
        // Find the event to get title and category
        const event = allQuestions.find((q) => q.id === params.eventId);
        if (!event) {
          throw new Error("Event not found");
        }

        // Create prediction history entry
        const entry: PredictionHistoryEntry = {
          id: `bet_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          marketId: params.eventId,
          marketTitle: event.title,
          categoryLabel: (event as any).categoryId ?? "Unknown",
          selectionId: params.optionId,
          selectionLabel: params.optionLabel,
          amount: params.amount,
          reserveFee: params.amount * 0.01, // 1% reserve fee
          totalCharged: params.amount * 1.01,
          claimFeeRate: 0.05, // 5% claim fee
          payoutMultiple: (event.options?.find((o) => o.id === params.optionId)?.oddsMultiplier ?? 1),
          grossReward: params.potentialReturn,
          netReward: params.potentialReturn * 0.95, // After 5% claim fee
          walletAddress: wallet.walletAddress,
          paymentReference: "",
          paymentRequestId: "",
          createdAt: Date.now(),
          reportedAt: Date.now(),
          resolutionOutcomeId: undefined,
          resolvedAt: undefined,
          resolvedByWallet: undefined,
          resultStatus: undefined,
          winningChoiceLabel: undefined,
          payoutRecordedAt: undefined,
        };

        // Save to local storage
        appendPredictionHistoryEntry(entry);

        // Show success notification
        setNotification({
          type: "success",
          message: `Bet placed! $${params.amount} on "${params.optionLabel}" - Potential return: $${params.potentialReturn.toFixed(2)}`,
        });
        setTimeout(() => setNotification(null), 5000);

        console.log("✅ Bet confirmed and saved:", entry);
      } catch (error) {
        console.error("❌ Bet confirmation failed:", error);
        setNotification({
          type: "error",
          message: `Bet failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
        setTimeout(() => setNotification(null), 5000);
      }
    },
    [wallet.isConnected, wallet.walletAddress, allQuestions]
  );

  const handleConnect = useCallback(async () => {
    return wallet.connect().then((result) => result?.address ?? null);
  }, [wallet]);

  return (
    <div className="space-y-8 py-8">
      {/* Notification */}
      {notification && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`rounded-lg border p-4 ${
              notification.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

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
          <EventsList
            events={questions}
            onConfirmBet={handleConfirmBet}
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

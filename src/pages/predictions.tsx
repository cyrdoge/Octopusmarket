/**
 * src/pages/predictions.tsx
 * Predictions listing page - Browse and place bets on prediction events
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/contexts/toast-context";
import {
  predictionMarketCategories,
  predictionMarketQuestions,
  predictionMarketFeeRate,
  predictionMarketReserveFeeRate,
  predictionMarketTreasuryAddress,
  predictionMarketMinBetAmount,
  predictionMarketMaxBetAmount,
  solanaUsdcMintAddress,
  type PredictionMarketQuestion,
} from "@/components/octopus-market/octopus-market-data";
import {
  readAdminCreatedPredictionMarkets,
  subscribeToPredictionMarketStorage,
  appendPredictionHistoryEntry,
  type AdminCreatedPredictionMarket,
  type PredictionHistoryEntry,
} from "@/components/octopus-market/prediction-market-store";
import { EventsList } from "@/components/octopus-market/binary-prediction-studio/EventsList";

export function PredictionsPage() {
  const wallet = useWallet();
  const toast = useToast();
  const [activeCategoryId, setActiveCategoryId] = useState(predictionMarketCategories[0]?.id ?? "crypto");
  const [adminCreatedMarkets, setAdminCreatedMarkets] = useState<AdminCreatedPredictionMarket[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true);

  // Load admin-created markets from Supabase on mount
  useEffect(() => {
    const loadMarkets = async () => {
      setIsLoadingMarkets(true);
      try {
        const markets = await readAdminCreatedPredictionMarkets();
        setAdminCreatedMarkets(markets);
      } catch (error) {
        console.error("Failed to load markets:", error);
        toast.error("Failed to load prediction markets");
      } finally {
        setIsLoadingMarkets(false);
      }
    };

    loadMarkets();
  }, [toast]);

  // Subscribe to Supabase realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToPredictionMarketStorage(async () => {
      try {
        const updated = await readAdminCreatedPredictionMarkets();
        setAdminCreatedMarkets(updated);
      } catch (error) {
        console.error("Failed to refresh markets:", error);
      }
    });

    return unsubscribe;
  }, []);

  // Combine default questions with admin-created markets
  const allQuestions = useMemo(() => {
    return [...predictionMarketQuestions, ...adminCreatedMarkets];
  }, [adminCreatedMarkets]);

  // Filter by category
  const questions = useMemo(() => {
    return allQuestions.filter((q) => {
      if ("categoryId" in q && typeof q.categoryId === "string") {
        return q.categoryId === activeCategoryId;
      }
      return (q as any).categoryId === activeCategoryId;
    });
  }, [allQuestions, activeCategoryId]);

  const handleConfirmBet = useCallback(
    async (params: {
      eventId: string;
      optionId: string;
      optionLabel: string;
      amount: number;
      potentialReturn: number;
    }) => {
      try {
        // Step 1: Check if wallet is connected and get address
        let walletAddress = wallet.walletAddress;
        if (!wallet.isConnected || !walletAddress) {
          toast.info("Connecting wallet...");

          const result = await wallet.connect();
          if (!result || !result.address) {
            toast.error("Wallet connection cancelled. Please connect your wallet to place bets.");
            return;
          }
          walletAddress = result.address;
          await wallet.refreshBalance(walletAddress);
        }

        // Step 2: Verify amount is valid
        if (params.amount < predictionMarketMinBetAmount || params.amount > predictionMarketMaxBetAmount) {
          toast.error(`Bet amount must be between $${predictionMarketMinBetAmount} and $${predictionMarketMaxBetAmount} USDC`);
          return;
        }

        // Step 3: Check wallet balance
        if (!wallet.balanceSnapshot) {
          toast.info("Checking balance...");
          await wallet.refreshBalance(walletAddress);
        }

        const reserveFee = params.amount * predictionMarketReserveFeeRate;
        const totalChargeUsd = params.amount + reserveFee;

        if (!wallet.balanceSnapshot || wallet.balanceSnapshot.usdcBalance < totalChargeUsd) {
          const availableBalance = wallet.balanceSnapshot?.usdcBalance ?? 0;
          toast.error(`Insufficient balance. Required: $${totalChargeUsd.toFixed(2)} USDC, Available: $${availableBalance.toFixed(2)} USDC`);
          return;
        }

        // Step 4: Find the event
        const event = allQuestions.find((q) => q.id === params.eventId);
        if (!event) {
          throw new Error("Event not found");
        }

        // Step 5: Calculate fees
        const claimFeeRate = predictionMarketFeeRate / 100;
        const netReward = params.potentialReturn * (1 - claimFeeRate);

        // Step 6: Load payment module
        toast.info(`Processing payment of $${params.amount} USDC...`);

        const paymentModule = await import("@/components/octopus-market/solana-payment");

        // Step 7: Build transaction
        const transferRequest = await paymentModule.buildTransaction({
          kind: "prediction",
          recipient: predictionMarketTreasuryAddress,
          amount: totalChargeUsd,
          walletAddress,
          currency: "USDC",
          tokenMint: solanaUsdcMintAddress,
          tokenDecimals: 6,
          label: "Octopus Market prediction",
          message: `${event.title} · ${params.optionLabel}`,
          memo: `Prediction market bet`,
          metadata: {
            marketId: params.eventId,
            marketTitle: event.title,
            selectionId: params.optionId,
            selectionLabel: params.optionLabel,
            stake: params.amount,
            reserveFee,
            totalChargeUsd,
            payoutMultiple: event.options?.find(o => o.id === params.optionId)?.oddsMultiplier ?? 1,
            grossReward: params.potentialReturn,
            netReward,
            claimFeeRate: predictionMarketFeeRate,
          },
        });

        // Step 8: Submit transaction to wallet (Phantom popup)
        toast.info(`Opening wallet for payment confirmation...`);

        await paymentModule.submitSolanaTransfer(transferRequest);

        // Step 9: Wait for blockchain confirmation
        toast.info(`Waiting for blockchain confirmation...`);

        const foundReference = await paymentModule.findReference(transferRequest.reference);
        if (!foundReference?.signature) {
          throw new Error("Payment not confirmed on blockchain");
        }

        // Step 10: Validate transfer on-chain
        await paymentModule.validateTransfer(foundReference.signature, {
          recipient: predictionMarketTreasuryAddress,
          amount: totalChargeUsd,
          reference: transferRequest.reference,
          currency: "USDC",
          tokenMint: solanaUsdcMintAddress,
          tokenDecimals: 6,
        });

        // Step 11: Create and save prediction history entry
        const entry: PredictionHistoryEntry = {
          id: `bet_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          marketId: params.eventId,
          marketTitle: event.title,
          categoryLabel: (event as any).categoryId ?? "Unknown",
          selectionId: params.optionId,
          selectionLabel: params.optionLabel,
          amount: params.amount,
          reserveFee,
          totalCharged: totalChargeUsd,
          claimFeeRate: predictionMarketFeeRate,
          payoutMultiple: event.options?.find((o) => o.id === params.optionId)?.oddsMultiplier ?? 1,
          grossReward: params.potentialReturn,
          netReward,
          walletAddress,
          paymentReference: transferRequest.reference,
          paymentRequestId: transferRequest.id,
          createdAt: Date.now(),
          reportedAt: Date.now(),
          resolutionOutcomeId: undefined,
          resolvedAt: undefined,
          resolvedByWallet: undefined,
          resultStatus: undefined,
          winningChoiceLabel: undefined,
          payoutRecordedAt: undefined,
        };

        appendPredictionHistoryEntry(entry);

        // Step 12: Show success notification
        toast.success(`✅ Bet placed! $${params.amount} on "${params.optionLabel}" - Potential return: $${params.potentialReturn.toFixed(2)}`);

        console.log("✅ Bet confirmed and paid:", entry);
      } catch (error) {
        console.error("❌ Bet confirmation failed:", error);

        let errorMessage = "Unknown error";
        const errorStr = error instanceof Error ? error.message : String(error);

        if (errorStr.includes("user rejected")) {
          errorMessage = "Payment cancelled. You rejected the transaction in your wallet.";
        } else if (errorStr.includes("wallet") && errorStr.includes("unavailable")) {
          errorMessage = "Wallet not available. Please install Phantom or another Solana wallet.";
        } else if (errorStr.includes("insufficient")) {
          errorMessage = "Insufficient balance to complete this transaction.";
        } else if (errorStr.includes("blockhash")) {
          errorMessage = "Network error: Unable to get blockhash. Please try again.";
        } else if (errorStr.includes("403") || errorStr.includes("forbidden")) {
          errorMessage = "RPC endpoint blocked. Try again in a few moments.";
        } else if (errorStr.includes("timeout")) {
          errorMessage = "Transaction timed out. The wallet may not have signed quickly enough.";
        } else if (errorStr.includes("confirmation")) {
          errorMessage = "Payment not confirmed on blockchain. Please check your wallet history.";
        } else {
          errorMessage = errorStr;
        }

        toast.error(`❌ Bet failed: ${errorMessage}`);
      }
    },
    [wallet, toast, allQuestions]
  );

  const handleConnect = useCallback(async () => {
    return wallet.connect().then((result) => result?.address ?? null);
  }, [wallet]);

  return (
    <div className="space-y-4 py-6">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-950 dark:text-white">Prediction Events</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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

      {/* Info Card
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <strong>How it works:</strong> Select a prediction event, choose your outcome, place a bet using Solana, and win if your prediction is correct.
            </p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}

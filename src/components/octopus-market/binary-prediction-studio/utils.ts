/**
 * utils.ts
 * Fonctions utilitaires partagées par tous les sous-composants
 * du Binary Prediction Studio.
 */

import {
  predictionMarketFeeRate,
} from "@/components/octopus-market/octopus-market-data";
import type {
  PredictionMarketOption,
  PredictionMarketQuestion,
} from "@/components/octopus-market/octopus-market-data";
import type { PaymentRequest } from "@/components/octopus-market/solana-payment";
import type { PredictionHistoryEntry } from "@/components/octopus-market/prediction-market-store";
import type { MarketOptionSummary, DemandSplit } from "./types";

// ─── Module singleton ─────────────────────────────────────────────────────────

let paymentModulePromise: Promise<typeof import("@/components/octopus-market/solana-payment")> | null = null;

/**
 * Charge le module solana-pay une seule fois (singleton).
 * Évite des imports dynamiques répétés sur chaque paiement.
 */
export function loadPaymentModule() {
  if (!paymentModulePromise) {
    paymentModulePromise = import("@/components/octopus-market/solana-payment");
  }
  return paymentModulePromise;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMoment(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

export function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildClaimReference() {
  return `CLAIM-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

// ─── Metadata readers ─────────────────────────────────────────────────────────

export function readStringMetadataValue(
  value: string | number | boolean | undefined,
  fallback = ""
) {
  return typeof value === "string" ? value : fallback;
}

export function readNumberMetadataValue(
  value: string | number | boolean | undefined,
  fallback = 0
) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export function redirectToPredictionHistory() {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", "#prediction-player-history");
  window.setTimeout(() => {
    window.document
      .getElementById("prediction-player-history")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

// ─── Market options ───────────────────────────────────────────────────────────

export function getDemandSplit(index: number): DemandSplit {
  const yesShare = 52 + ((index * 7) % 21);
  return {
    yesShare,
    noShare: 100 - yesShare,
    volume: 240 + index * 42,
  };
}

export function getDefaultMarketOptions(index: number): PredictionMarketOption[] {
  const demand = getDemandSplit(index);
  const yesOdds = Number(clampValue(0.96 / (demand.yesShare / 100), 1.18, 3.2).toFixed(2));
  const noOdds = Number(clampValue(0.96 / (demand.noShare / 100), 1.18, 3.4).toFixed(2));
  return [
    {
      id: "yes",
      label: "Yes",
      oddsMultiplier: yesOdds,
      initialVolumeUsd: (demand.volume * demand.yesShare) / 100,
    },
    {
      id: "no",
      label: "No",
      oddsMultiplier: noOdds,
      initialVolumeUsd: (demand.volume * demand.noShare) / 100,
    },
  ];
}

export function getMarketOptions(question: PredictionMarketQuestion, index: number) {
  return question.options && question.options.length > 0
    ? question.options
    : getDefaultMarketOptions(index);
}

export function buildOptionSummaries(
  market: PredictionMarketQuestion,
  options: PredictionMarketOption[],
  history: PredictionHistoryEntry[],
  adminNotifications: Array<{ paymentReference: string; status: string }>,
  stakePreviewAmount: number
): MarketOptionSummary[] {
  return options.map((option) => {
    const approvedEntries = history.filter((entry) => {
      const notification = adminNotifications.find(
        (n) => n.paymentReference === entry.paymentReference
      );
      return (
        entry.marketId === market.id &&
        entry.selectionId === option.id &&
        notification?.status === "approved"
      );
    });

    const liveVolumeUsd =
      option.initialVolumeUsd +
      approvedEntries.reduce((total, entry) => total + entry.amount, 0);

    const grossReturnUsd = stakePreviewAmount * option.oddsMultiplier;
    const netReturnUsd = grossReturnUsd * (1 - predictionMarketFeeRate / 100);

    return {
      ...option,
      liveVolumeUsd,
      grossReturnUsd,
      netReturnUsd,
    };
  });
}

// ─── Selection styles ─────────────────────────────────────────────────────────

export function getSelectionTone(optionId: string) {
  if (optionId === "yes") return "success";
  if (optionId === "no") return "destructive";
  return "default";
}

export function getSelectionClasses(optionId: string, isActive: boolean) {
  const base = "rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer transition-all";
  if (!isActive) {
    return `${base} border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white/20`;
  }
  if (optionId === "yes") {
    return `${base} border-green-500 bg-green-50 text-green-700 dark:border-green-500/50 dark:bg-green-500/10 dark:text-green-300`;
  }
  if (optionId === "no") {
    return `${base} border-red-500 bg-red-50 text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300`;
  }
  return `${base} border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/10 dark:text-orange-300`;
}

// ─── History helpers ──────────────────────────────────────────────────────────

export function getEntryStatusLabel(params: {
  isHistoryResolved: boolean;
  didUserWin: boolean;
  isClaimable: boolean;
  isClaimed: boolean;
}): string {
  const { isHistoryResolved, didUserWin, isClaimable, isClaimed } = params;
  if (isClaimed) return "Claimed";
  if (isClaimable) return "Ready to Claim";
  if (isHistoryResolved && didUserWin) return "Won · Pending Admin Approval";
  if (isHistoryResolved) return "Lost";
  return "Pending Resolution";
}

/**
 * Construit une entrée d'historique depuis un PaymentRequest validé on-chain.
 * Appelé après finalizeValidatedPredictionPayment dans l'orchestrateur.
 */
export function buildPredictionHistoryEntryFromPaymentRequest(
  paymentRequest: PaymentRequest
): PredictionHistoryEntry {
  const metadata = paymentRequest.metadata ?? {};
  const paymentReference = paymentRequest.reference;

  return {
    id: `${readStringMetadataValue(metadata.marketId, paymentRequest.id)}-${paymentReference}`,
    marketId: readStringMetadataValue(metadata.marketId, paymentRequest.id),
    marketTitle: readStringMetadataValue(
      metadata.marketTitle,
      paymentRequest.message || "Prediction market"
    ),
    categoryLabel: readStringMetadataValue(metadata.categoryLabel, "Prediction market"),
    selectionId: readStringMetadataValue(metadata.selectionId),
    selectionLabel: readStringMetadataValue(
      metadata.selectionLabel,
      paymentRequest.memo || "Market side"
    ),
    amount: readNumberMetadataValue(metadata.stake, paymentRequest.amount),
    reserveFee: readNumberMetadataValue(metadata.reserveFee),
    totalCharged: readNumberMetadataValue(metadata.totalChargeUsdc, paymentRequest.amount),
    claimFeeRate: readNumberMetadataValue(metadata.claimFeeRate, predictionMarketFeeRate),
    payoutMultiple: readNumberMetadataValue(metadata.payoutMultiple, 1),
    grossReward: readNumberMetadataValue(metadata.grossReward),
    netReward: readNumberMetadataValue(metadata.netReward),
    walletAddress: paymentRequest.walletAddress,
    paymentReference,
    paymentRequestId: paymentRequest.id,
    createdAt: paymentRequest.validatedAt ?? paymentRequest.createdAt,
    reportedAt: Date.now(),
    adminDecisionStatus: "pending",
    resultStatus: "pending_review",
  } satisfies PredictionHistoryEntry;
}

import type { AdminPaymentStatus } from "@/components/octopus-market/octopus-admin";
import type { PredictionMarketQuestion } from "@/components/octopus-market/octopus-market-data";

export type PredictionResultStatus =
  | "open"
  | "pending_review"
  | "approved_pending_result"
  | "win"
  | "lose"
  | "claimed"
  | "rejected";

export type PredictionHistoryEntry = {
  id: string;
  marketId: string;
  marketTitle: string;
  categoryLabel: string;
  selectionId: string;
  selectionLabel: string;
  amount: number;
  reserveFee: number;
  totalCharged: number;
  claimFeeRate: number;
  payoutMultiple: number;
  grossReward: number;
  netReward: number;
  walletAddress: string;
  paymentReference: string;
  paymentRequestId: string;
  createdAt: number;
  reportedAt: number;
  adminDecisionStatus?: AdminPaymentStatus;
  resolutionOutcomeId?: string;
  resolvedAt?: number;
  resolvedByWallet?: string;
  resultStatus?: PredictionResultStatus;
  winningChoiceLabel?: string;
  payoutRecordedAt?: number;
  claimedAt?: number;
  claimReference?: string;
};

export type PredictionResolutionRecord = {
  outcomeId: string;
  resolvedAt: number;
  resolvedByWallet: string;
};

export type AdminCreatedPredictionMarket = PredictionMarketQuestion & {
  createdAt: number;
  createdByWallet: string;
  isAdminCreated: true;
};

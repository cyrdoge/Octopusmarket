import type { PredictionMarketOption, PredictionMarketQuestion } from "../octopus-market-data";
import type { AdminCreatedPredictionMarket, PredictionHistoryEntry, PredictionResolutionRecord } from "../prediction-market-store";
import type { AdminPaymentNotification } from "../octopus-admin";
import type { PaymentRequest } from "../solana-payment";

export type BinaryPredictionStudioProps = {
  isWalletConnected: boolean;
  walletAddress: string | null;
  walletUsername?: string | null;
  onConnectWallet: () => Promise<string | null>;
  selectedCategoryId?: string;
  selectedMarketId?: string | null;
};

export type MarketDraftStatus = "idle" | "success" | "error";

export type MarketOptionSummary = PredictionMarketOption & {
  liveVolumeUsd: number;
  grossReturnUsd: number;
  netReturnUsd: number;
};

export type AdminMarketCreationMode = "vs" | "simple";

export type AdminMarketDraft = {
  title: string;
  description: string;
  categoryId: string;
  mode: AdminMarketCreationMode;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  options: AdminMarketOption[];
};

export type AdminMarketOption = {
  label: string;
  oddsMultiplier: number;
};

export type DemandSplit = {
  yesShare: number;
  noShare: number;
  volume: number;
};

// Re-exports for convenience
export type { AdminCreatedPredictionMarket, PredictionHistoryEntry, PredictionResolutionRecord, AdminPaymentNotification, PaymentRequest };

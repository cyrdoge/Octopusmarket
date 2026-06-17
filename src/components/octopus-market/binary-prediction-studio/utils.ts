import type { PredictionMarketOption, PredictionMarketQuestion } from "../octopus-market-data";
import type { AdminMarketDraft, AdminMarketOption, DemandSplit, MarketOptionSummary, MarketDraftStatus } from "./types";
import type { PaymentRequest } from "../solana-pay";
import type { PredictionHistoryEntry } from "../prediction-market-store";

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

export function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildClaimReference() {
  return `CLAIM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

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
  return question.options && question.options.length > 0 ? question.options : getDefaultMarketOptions(index);
}

export function buildOptionSummaries(
  options: PredictionMarketOption[],
  totalStakes: Record<string, number>
): MarketOptionSummary[] {
  const totalVolume = Object.values(totalStakes).reduce((a, b) => a + b, 0);

  return options.map((option) => {
    const liveVolumeUsd = totalStakes[option.id] ?? 0;
    const grossReturnUsd = liveVolumeUsd * option.oddsMultiplier;
    const netReturnUsd = grossReturnUsd - liveVolumeUsd;

    return {
      ...option,
      liveVolumeUsd,
      grossReturnUsd,
      netReturnUsd,
    };
  });
}

export function getSelectionTone(optionId: string) {
  if (optionId === "yes") return "success";
  if (optionId === "no") return "destructive";
  return "default";
}

export function getSelectionClasses(optionId: string, isActive: boolean) {
  const baseClasses = "rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer transition-all";

  if (!isActive) {
    return `${baseClasses} border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white/20`;
  }

  if (optionId === "yes") {
    return `${baseClasses} border-green-500 bg-green-50 text-green-700 dark:border-green-500/50 dark:bg-green-500/10 dark:text-green-300`;
  }

  if (optionId === "no") {
    return `${baseClasses} border-red-500 bg-red-50 text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300`;
  }

  return `${baseClasses} border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/10 dark:text-orange-300`;
}

export function getEntryStatusLabel(params: {
  isHistoryResolved: boolean;
  didUserWin: boolean;
  isClaimable: boolean;
  isClaimed: boolean;
}): string {
  const { isHistoryResolved, didUserWin, isClaimable, isClaimed } = params;

  if (isClaimed) return "Claimed";
  if (isClaimable) return "Ready to Claim";
  if (isHistoryResolved && didUserWin) return "Won • Pending Admin Approval";
  if (isHistoryResolved) return "Lost";
  return "Pending Resolution";
}

export function readStringMetadataValue(value: string | number | boolean | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function readNumberMetadataValue(value: string | number | boolean | undefined, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

export function buildAdminCreatedMarketId(title: string) {
  return `admin-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}-${Date.now()}`;
}

export function buildAdminCreatedMarketOptions(draft: AdminMarketDraft): PredictionMarketOption[] {
  return draft.options.map((option, index) => ({
    id: `option-${index}`,
    label: option.label,
    oddsMultiplier: option.oddsMultiplier,
  }));
}

export function createInitialAdminMarketDraft(): AdminMarketDraft {
  return {
    title: "",
    description: "",
    categoryId: "crypto",
    mode: "vs",
    imageFile: null,
    imagePreviewUrl: null,
    options: [
      { label: "Option A", oddsMultiplier: 1.5 },
      { label: "Option B", oddsMultiplier: 1.5 },
    ],
  };
}

export async function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function loadPaymentModule() {
  return import("../solana-pay");
}

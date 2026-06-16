import type { AdminPaymentStatus } from "@/components/octopus-market/octopus-admin";
import { syncPredictionHistoryToCentralRegistry } from "@/components/octopus-market/octopus-central-registry";
import { buildStoredAdminAuthHeaders } from "@/components/octopus-market/octopus-admin-auth";
import type { PredictionMarketQuestion } from "@/components/octopus-market/octopus-market-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Json } from "@/lib/supabase-types";

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

const predictionHistoryStorageKey = "octopus-market-prediction-history-v4";
const predictionResolutionStorageKey = "octopus-market-prediction-resolutions-v3";
const adminCreatedPredictionMarketsStorageKey = "octopus-market-admin-created-markets-v2";
const predictionMarketStorageEventName = "octopus-market-prediction-storage";
const predictionMarketChannelName = "octopus-market-prediction-channel";
const predictionMarketApiBase = "/api/prediction-markets";

let predictionMarketBroadcastChannel: BroadcastChannel | null = null;
let predictionMarketEventSource: EventSource | null = null;
let predictionMarketSyncTimer: number | null = null;
let hasStartedPredictionServerSync = false;
let predictionMarketsCache: AdminCreatedPredictionMarket[] = [];
let predictionResolutionsCache: Record<string, PredictionResolutionRecord> = {};
let hasHydratedPredictionCache = false;
const predictionMarketServerPollMs = 1000;

function shouldAttemptPredictionMarketServerSync() {
  if (typeof window === "undefined") {
    return false;
  }

  if (import.meta.env.VITE_ENABLE_SERVER_SYNC === "false") {
    return false;
  }

  return true;
}

function getPredictionMarketBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!predictionMarketBroadcastChannel) {
    predictionMarketBroadcastChannel = new BroadcastChannel(predictionMarketChannelName);
  }

  return predictionMarketBroadcastChannel;
}

function emitPredictionMarketStorageUpdate(_source: "local" | "server" = "local") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(predictionMarketStorageEventName));
  getPredictionMarketBroadcastChannel()?.postMessage({ type: "prediction-market-update" });
}

function safeParseArray<T>(rawValue: string | null): T[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as T[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function safeParseRecord<T extends Record<string, unknown>>(rawValue: string | null) {
  if (!rawValue) {
    return {} as T;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as T;
    return parsedValue && typeof parsedValue === "object" ? parsedValue : ({} as T);
  } catch {
    return {} as T;
  }
}

function hydratePredictionMarketCache(force = false) {
  if (typeof window === "undefined" || (hasHydratedPredictionCache && !force)) {
    return;
  }

  predictionMarketsCache = safeParseArray<AdminCreatedPredictionMarket>(
    window.localStorage.getItem(adminCreatedPredictionMarketsStorageKey)
  );
  predictionResolutionsCache = safeParseRecord<Record<string, PredictionResolutionRecord>>(
    window.localStorage.getItem(predictionResolutionStorageKey)
  );
  hasHydratedPredictionCache = true;
}

function refreshPredictionMarketCache() {
  if (typeof window === "undefined") {
    return false;
  }

  const nextMarkets = safeParseArray<AdminCreatedPredictionMarket>(
    window.localStorage.getItem(adminCreatedPredictionMarketsStorageKey)
  );
  const nextResolutions = safeParseRecord<Record<string, PredictionResolutionRecord>>(
    window.localStorage.getItem(predictionResolutionStorageKey)
  );

  const currentSerialized = serializePredictionMarketState({
    markets: predictionMarketsCache,
    resolutions: predictionResolutionsCache,
  });
  const nextSerialized = serializePredictionMarketState({
    markets: nextMarkets,
    resolutions: nextResolutions,
  });

  if (currentSerialized === nextSerialized) {
    return false;
  }

  predictionMarketsCache = nextMarkets;
  predictionResolutionsCache = nextResolutions;
  return true;
}

function serializePredictionMarketState(payload: {
  markets: AdminCreatedPredictionMarket[];
  resolutions: Record<string, PredictionResolutionRecord>;
}) {
  try {
    return JSON.stringify(payload);
  } catch {
    return "";
  }
}

function persistPredictionMarketCache() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(adminCreatedPredictionMarketsStorageKey, JSON.stringify(predictionMarketsCache));
    window.localStorage.setItem(predictionResolutionStorageKey, JSON.stringify(predictionResolutionsCache));
  } catch {
    return;
  }
}

function replacePredictionMarketState(
  payload: {
    markets?: AdminCreatedPredictionMarket[];
    resolutions?: Record<string, PredictionResolutionRecord>;
  },
  source: "local" | "server" = "local"
) {
  const nextMarkets = Array.isArray(payload.markets) ? payload.markets : predictionMarketsCache;
  const nextResolutions = payload.resolutions && typeof payload.resolutions === "object"
    ? payload.resolutions
    : predictionResolutionsCache;

  const currentSerializedState = serializePredictionMarketState({
    markets: predictionMarketsCache,
    resolutions: predictionResolutionsCache,
  });
  const nextSerializedState = serializePredictionMarketState({
    markets: nextMarkets,
    resolutions: nextResolutions,
  });

  if (currentSerializedState === nextSerializedState) {
    hasHydratedPredictionCache = true;
    return;
  }

  predictionMarketsCache = nextMarkets;
  predictionResolutionsCache = nextResolutions;

  hasHydratedPredictionCache = true;
  persistPredictionMarketCache();
  emitPredictionMarketStorageUpdate(source);
}

async function fetchPredictionMarketStateFromServer() {
  if (typeof window === "undefined" || !shouldAttemptPredictionMarketServerSync()) {
    hasStartedPredictionServerSync = true;
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const [marketsResult, resolutionsResult] = await Promise.all([
        supabase.from("prediction_markets").select("*").order("created_at", { ascending: false }),
        supabase.from("prediction_resolutions").select("*"),
      ]);

      const markets: AdminCreatedPredictionMarket[] = (marketsResult.data ?? []).map((row) => ({
        id: row.id,
        categoryId: row.category_id,
        title: row.title,
        marketType: (row.market_type === "binary" ? "yes-no" : row.market_type) as "yes-no" | "threshold" | "three-way",
        visualType: (row.visual_type as "vs" | "simple" | undefined) ?? undefined,
        resolutionLabel: row.resolution_label,
        eventDateLabel: row.event_date_label ?? undefined,
        leftCompetitorName: row.left_competitor_name ?? undefined,
        leftCompetitorImageSrc: row.left_competitor_image ?? undefined,
        rightCompetitorName: row.right_competitor_name ?? undefined,
        rightCompetitorImageSrc: row.right_competitor_image ?? undefined,
        singleName: row.single_name ?? undefined,
        singleImageSrc: row.single_image ?? undefined,
        options: Array.isArray(row.options) ? row.options as AdminCreatedPredictionMarket["options"] : undefined,
        createdAt: new Date(row.created_at).getTime(),
        createdByWallet: row.created_by_wallet,
        isAdminCreated: true as const,
      }));

      const resolutions: Record<string, PredictionResolutionRecord> = {};
      for (const row of resolutionsResult.data ?? []) {
        resolutions[row.market_id] = {
          outcomeId: row.outcome_id,
          resolvedAt: new Date(row.resolved_at).getTime(),
          resolvedByWallet: row.resolved_by_wallet,
        };
      }

      replacePredictionMarketState({ markets, resolutions }, "server");
    } catch {
      return;
    }
    return;
  }

  try {
    const response = await fetch(predictionMarketApiBase, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      markets?: AdminCreatedPredictionMarket[];
      resolutions?: Record<string, PredictionResolutionRecord>;
    };

    replacePredictionMarketState(payload, "server");
  } catch {
    return;
  }
}

function startPredictionMarketServerSync() {
  if (typeof window === "undefined" || hasStartedPredictionServerSync) {
    return;
  }

  if (!shouldAttemptPredictionMarketServerSync()) {
    hasStartedPredictionServerSync = true;
    return;
  }

  hasStartedPredictionServerSync = true;
  void fetchPredictionMarketStateFromServer();

  if (isSupabaseConfigured()) {
    supabase
      .channel("prediction-markets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_markets" }, () => {
        void fetchPredictionMarketStateFromServer();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_resolutions" }, () => {
        void fetchPredictionMarketStateFromServer();
      })
      .subscribe();
    return;
  }

  if (predictionMarketSyncTimer === null) {
    predictionMarketSyncTimer = window.setInterval(() => {
      void fetchPredictionMarketStateFromServer();
    }, predictionMarketServerPollMs);
  }

  if (typeof EventSource === "undefined") {
    return;
  }

  try {
    predictionMarketEventSource = new EventSource(`${predictionMarketApiBase}/stream`);
    predictionMarketEventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          markets?: AdminCreatedPredictionMarket[];
          resolutions?: Record<string, PredictionResolutionRecord>;
        };
        replacePredictionMarketState(payload, "server");
      } catch {
        return;
      }
    };

    predictionMarketEventSource.onerror = () => {
      predictionMarketEventSource?.close();
      predictionMarketEventSource = null;
      hasStartedPredictionServerSync = true;
    };
  } catch {
    hasStartedPredictionServerSync = false;
  }
}

async function postPredictionMarketStateToServer(adminWalletAddress?: string | null) {
  if (typeof window === "undefined") {
    return false;
  }

  if (isSupabaseConfigured()) {
    try {
      const walletAddresses = Array.from(
        new Set(predictionMarketsCache.map((m) => m.createdByWallet).filter(Boolean))
      );
      if (walletAddresses.length > 0) {
        const walletRows = walletAddresses.map((addr) => ({ address: addr }));
        const { error: walletErr } = await supabase
          .from("wallets")
          .upsert(walletRows, { onConflict: "address", ignoreDuplicates: true });
        if (walletErr) {
          console.error("[supabase] wallet pre-flight upsert failed:", walletErr.message, walletErr.details);
        }
      }

      const marketRows = predictionMarketsCache.map((m) => ({
        id: m.id,
        category_id: m.categoryId,
        title: m.title,
        market_type: m.marketType ?? "binary",
        visual_type: m.visualType ?? null,
        resolution_label: m.resolutionLabel ?? "",
        event_date_label: m.eventDateLabel ?? null,
        left_competitor_name: m.leftCompetitorName ?? null,
        left_competitor_image: m.leftCompetitorImageSrc ?? null,
        right_competitor_name: m.rightCompetitorName ?? null,
        right_competitor_image: m.rightCompetitorImageSrc ?? null,
        single_name: m.singleName ?? null,
        single_image: m.singleImageSrc ?? null,
        options: (m.options ?? []) as Json,
        created_by_wallet: m.createdByWallet,
        created_at: new Date(m.createdAt).toISOString(),
        is_admin_created: true,
      }));

      if (marketRows.length > 0) {
        const { error: marketErr } = await supabase.from("prediction_markets").upsert(marketRows, { onConflict: "id" });
        if (marketErr) {
          console.error("[supabase] prediction_markets upsert failed:", marketErr.message, marketErr.details);
          return false;
        }
      }

      const resolutionWallets = Array.from(
        new Set(Object.values(predictionResolutionsCache).map((r) => r.resolvedByWallet).filter(Boolean))
      );
      if (resolutionWallets.length > 0) {
        const rw = resolutionWallets.map((addr) => ({ address: addr }));
        await supabase.from("wallets").upsert(rw, { onConflict: "address", ignoreDuplicates: true });
      }

      const resolutionRows = Object.entries(predictionResolutionsCache).map(([marketId, r]) => ({
        market_id: marketId,
        outcome_id: r.outcomeId,
        resolved_at: new Date(r.resolvedAt).toISOString(),
        resolved_by_wallet: r.resolvedByWallet,
      }));

      if (resolutionRows.length > 0) {
        const { error: resErr } = await supabase.from("prediction_resolutions").upsert(resolutionRows, { onConflict: "market_id" });
        if (resErr) {
          console.error("[supabase] prediction_resolutions upsert failed:", resErr.message, resErr.details);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("[supabase] postPredictionMarketStateToServer exception:", err);
      return false;
    }
  }

  const fallbackAdminWalletAddress =
    predictionMarketsCache.find((market) => market.createdByWallet)?.createdByWallet ??
    Object.values(predictionResolutionsCache)[0]?.resolvedByWallet ??
    null;
  const adminAuthHeaders = buildStoredAdminAuthHeaders(adminWalletAddress ?? fallbackAdminWalletAddress);

  if (!adminAuthHeaders) {
    return false;
  }

  try {
    const response = await fetch(`${predictionMarketApiBase}/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...adminAuthHeaders,
      },
      body: JSON.stringify({
        markets: predictionMarketsCache,
        resolutions: predictionResolutionsCache,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      markets?: AdminCreatedPredictionMarket[];
      resolutions?: Record<string, PredictionResolutionRecord>;
    };

    replacePredictionMarketState(payload, "server");
    return true;
  } catch {
    return false;
  }
}

function schedulePredictionMarketServerPersist(adminWalletAddress?: string | null) {
  void postPredictionMarketStateToServer(adminWalletAddress);
}

export async function persistPredictionMarketStateToServer(adminWalletAddress?: string | null) {
  return postPredictionMarketStateToServer(adminWalletAddress);
}

function resolvePredictionEntryStatus(entry: PredictionHistoryEntry): PredictionResultStatus {
  if (entry.claimedAt) {
    return "claimed";
  }

  if (entry.adminDecisionStatus === "rejected") {
    return "rejected";
  }

  if (entry.adminDecisionStatus !== "approved") {
    return "pending_review";
  }

  if (!entry.resolutionOutcomeId) {
    return "approved_pending_result";
  }

  return entry.resolutionOutcomeId === entry.selectionId ? "win" : "lose";
}

function decoratePredictionEntry(entry: PredictionHistoryEntry): PredictionHistoryEntry {
  const resultStatus = resolvePredictionEntryStatus(entry);
  const isWinningEntry = resultStatus === "win" || resultStatus === "claimed";

  return {
    ...entry,
    adminDecisionStatus: entry.adminDecisionStatus ?? "pending",
    resultStatus,
    winningChoiceLabel: isWinningEntry ? entry.selectionLabel : undefined,
    payoutRecordedAt: isWinningEntry ? entry.payoutRecordedAt ?? entry.claimedAt ?? entry.resolvedAt : undefined,
  };
}

export function readPredictionHistory() {
  if (typeof window === "undefined") {
    return [] as PredictionHistoryEntry[];
  }

  return safeParseArray<PredictionHistoryEntry>(window.localStorage.getItem(predictionHistoryStorageKey)).map(
    decoratePredictionEntry
  );
}

export function writePredictionHistory(history: PredictionHistoryEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalizedHistory = history.map(decoratePredictionEntry);
    window.localStorage.setItem(predictionHistoryStorageKey, JSON.stringify(normalizedHistory));
    emitPredictionMarketStorageUpdate();
    normalizedHistory.forEach((entry) => {
      void syncPredictionHistoryToCentralRegistry(entry);
    });
  } catch {
    return;
  }
}

export function appendPredictionHistoryEntry(entry: PredictionHistoryEntry) {
  const currentHistory = readPredictionHistory();

  if (currentHistory.some((currentEntry) => currentEntry.paymentReference === entry.paymentReference)) {
    return currentHistory;
  }

  const nextHistory = [entry, ...currentHistory].slice(0, 400);
  writePredictionHistory(nextHistory);
  void syncPredictionHistoryToCentralRegistry(entry);
  return nextHistory;
}

export function updatePredictionHistoryEntry(
  entryId: string,
  updater: (entry: PredictionHistoryEntry) => PredictionHistoryEntry
) {
  const nextHistory = updatePredictionHistoryEntryByFilter((entry) => entry.id === entryId, updater);
  const updatedEntry = nextHistory.find((entry) => entry.id === entryId);

  if (updatedEntry) {
    void syncPredictionHistoryToCentralRegistry(updatedEntry);
  }

  return nextHistory;
}

export function syncPredictionEntriesForAdminDecision(paymentReference: string, status: AdminPaymentStatus) {
  if (!paymentReference) {
    return readPredictionHistory();
  }

  return updatePredictionHistoryEntryByFilter(
    (entry) => entry.paymentReference === paymentReference,
    (entry) => ({
      ...entry,
      adminDecisionStatus: status,
    })
  );
}

export function syncPredictionEntriesForResolvedMarket(params: PredictionResolutionRecord & { marketId: string }) {
  if (!params.marketId) {
    return readPredictionHistory();
  }

  return updatePredictionHistoryEntryByFilter(
    (entry) => entry.marketId === params.marketId,
    (entry) => ({
      ...entry,
      resolutionOutcomeId: params.outcomeId,
      resolvedAt: params.resolvedAt,
      resolvedByWallet: params.resolvedByWallet,
      payoutRecordedAt: params.outcomeId === entry.selectionId ? params.resolvedAt : entry.payoutRecordedAt,
    })
  );
}

function updatePredictionHistoryEntryByFilter(
  matcher: (entry: PredictionHistoryEntry) => boolean,
  updater: (entry: PredictionHistoryEntry) => PredictionHistoryEntry
) {
  const currentHistory = readPredictionHistory();
  const nextHistory = currentHistory.map((entry) => (matcher(entry) ? updater(entry) : entry));
  writePredictionHistory(nextHistory);
  return nextHistory;
}

export function readPredictionResolutions() {
  hydratePredictionMarketCache();
  refreshPredictionMarketCache();
  startPredictionMarketServerSync();
  return predictionResolutionsCache;
}

export function writePredictionResolutions(
  resolutions: Record<string, PredictionResolutionRecord>,
  adminWalletAddress?: string | null
) {
  if (typeof window === "undefined") {
    return;
  }

  replacePredictionMarketState({ resolutions }, "local");
  schedulePredictionMarketServerPersist(adminWalletAddress);
}

export function readAdminCreatedPredictionMarkets() {
  hydratePredictionMarketCache();
  refreshPredictionMarketCache();
  startPredictionMarketServerSync();
  return predictionMarketsCache;
}

export function writeAdminCreatedPredictionMarkets(
  markets: AdminCreatedPredictionMarket[],
  adminWalletAddress?: string | null
) {
  if (typeof window === "undefined") {
    return;
  }

  replacePredictionMarketState({ markets }, "local");
  schedulePredictionMarketServerPersist(adminWalletAddress);
}

export function appendAdminCreatedPredictionMarket(
  market: AdminCreatedPredictionMarket,
  adminWalletAddress?: string | null
) {
  const currentMarkets = readAdminCreatedPredictionMarkets();

  if (currentMarkets.some((currentMarket) => currentMarket.id === market.id)) {
    return currentMarkets;
  }

  const nextMarkets = [market, ...currentMarkets].slice(0, 100);
  writeAdminCreatedPredictionMarkets(nextMarkets, adminWalletAddress ?? market.createdByWallet);
  return nextMarkets;
}

export function removeAdminCreatedPredictionMarket(marketId: string, adminWalletAddress?: string | null) {
  if (!marketId) {
    return readAdminCreatedPredictionMarkets();
  }

  const nextMarkets = readAdminCreatedPredictionMarkets().filter((market) => market.id !== marketId);
  writeAdminCreatedPredictionMarkets(nextMarkets, adminWalletAddress);

  if (predictionResolutionsCache[marketId]) {
    const nextResolutions = { ...predictionResolutionsCache };
    delete nextResolutions[marketId];
    writePredictionResolutions(nextResolutions, adminWalletAddress);
  }

  return nextMarkets;
}

export function subscribeToPredictionMarketStorage(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  hydratePredictionMarketCache();
  startPredictionMarketServerSync();

  const handleStorageChange = () => {
    const changed = refreshPredictionMarketCache();
    if (changed) {
      listener();
    }

    if (shouldAttemptPredictionMarketServerSync()) {
      void fetchPredictionMarketStateFromServer();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && shouldAttemptPredictionMarketServerSync()) {
      void fetchPredictionMarketStateFromServer();
    }
  };

  const channel = getPredictionMarketBroadcastChannel();

  window.addEventListener(predictionMarketStorageEventName, handleStorageChange);
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("visibilitychange", handleVisibilityChange);

  if (channel) {
    channel.addEventListener("message", handleStorageChange);
  }

  return () => {
    window.removeEventListener(predictionMarketStorageEventName, handleStorageChange);
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("visibilitychange", handleVisibilityChange);

    if (channel) {
      channel.removeEventListener("message", handleStorageChange);
    }
  };
}

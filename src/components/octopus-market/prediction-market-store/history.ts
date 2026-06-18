import { syncPredictionHistoryToCentralRegistry } from "@/components/octopus-market/octopus-central-registry";
import type { AdminPaymentStatus } from "@/components/octopus-market/octopus-admin";
import { predictionHistoryStorageKey } from "./constants";
import type { PredictionHistoryEntry, PredictionResultStatus } from "./types";
import { safeParseArray, emitPredictionMarketStorageUpdate } from "./storage";

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

export function syncPredictionEntriesForResolvedMarket(params: {
  marketId: string;
  outcomeId: string;
  resolvedAt: number;
  resolvedByWallet: string;
}) {
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

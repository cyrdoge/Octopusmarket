/**
 * prediction-market-store/index.ts
 * Central export point for all prediction market storage operations
 */

// Type exports
export type {
  PredictionHistoryEntry,
  PredictionResultStatus,
  PredictionResolutionRecord,
  AdminCreatedPredictionMarket,
} from "./types";

// History exports
export {
  readPredictionHistory,
  writePredictionHistory,
  appendPredictionHistoryEntry,
  updatePredictionHistoryEntry,
  syncPredictionEntriesForAdminDecision,
  syncPredictionEntriesForResolvedMarket,
} from "./history";

// Cache and sync exports
export {
  readPredictionResolutions,
  writePredictionResolutions,
  readAdminCreatedPredictionMarkets,
  writeAdminCreatedPredictionMarkets,
  appendAdminCreatedPredictionMarket,
  updateAdminCreatedPredictionMarket,
  removeAdminCreatedPredictionMarket,
  subscribeToPredictionMarketStorage,
  persistPredictionMarketStateToServer,
} from "./cache";

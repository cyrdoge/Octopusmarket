export const predictionHistoryStorageKey = "octopus-market-prediction-history-v4";
export const predictionResolutionStorageKey = "octopus-market-prediction-resolutions-v3";
export const adminCreatedPredictionMarketsStorageKey = "octopus-market-admin-created-markets-v2";
export const predictionMarketStorageEventName = "octopus-market-prediction-storage";
export const predictionMarketChannelName = "octopus-market-prediction-channel";
export const predictionMarketApiBase = "/api/prediction-markets";
export const predictionMarketServerPollMs = 1000;

// Global state
export let predictionMarketBroadcastChannel: BroadcastChannel | null = null;
export let predictionMarketEventSource: EventSource | null = null;
export let predictionMarketSyncTimer: number | null = null;
export let hasStartedPredictionServerSync = false;
export let predictionMarketsCache: any[] = [];
export let predictionResolutionsCache: Record<string, any> = {};
export let hasHydratedPredictionCache = false;

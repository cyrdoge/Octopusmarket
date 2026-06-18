import {
  predictionMarketChannelName,
  predictionHistoryStorageKey,
  predictionResolutionStorageKey,
  adminCreatedPredictionMarketsStorageKey,
  predictionMarketStorageEventName,
} from "./constants";

export function safeParseArray<T>(rawValue: string | null): T[] {
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

export function safeParseRecord<T extends Record<string, unknown>>(rawValue: string | null) {
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

export function getPredictionMarketBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  // Broadcast channel state is managed in constants.ts
  return new BroadcastChannel(predictionMarketChannelName);
}

export function emitPredictionMarketStorageUpdate(_source: "local" | "server" = "local") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(predictionMarketStorageEventName));
  getPredictionMarketBroadcastChannel()?.postMessage({ type: "prediction-market-update" });
}

export function serializePredictionMarketState(payload: {
  markets: any[];
  resolutions: Record<string, any>;
}) {
  try {
    return JSON.stringify(payload);
  } catch {
    return "";
  }
}

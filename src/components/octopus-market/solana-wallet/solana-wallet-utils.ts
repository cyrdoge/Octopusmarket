/**
 * solana-wallet-utils.ts
 * Utility functions for wallet formatting and parsing
 */

export function formatWalletAddress(address?: string | null): string {
  if (!address) {
    return "Not connected";
  }

  if (address.length <= 8) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function parseUsdAmount(price: string): number {
  const parsed = parseFloat(price);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeUiTokenAmount(tokenAmount: {
  amount?: string;
  decimals?: number;
  uiAmount?: number | null;
  uiAmountString?: string;
}): number {
  if (typeof tokenAmount.uiAmountString === "string") {
    const parsedAmount = Number(tokenAmount.uiAmountString);

    if (Number.isFinite(parsedAmount)) {
      return parsedAmount;
    }
  }

  if (typeof tokenAmount.uiAmount === "number" && Number.isFinite(tokenAmount.uiAmount)) {
    return tokenAmount.uiAmount;
  }

  const rawAmount = Number(tokenAmount.amount ?? 0);
  const decimals = typeof tokenAmount.decimals === "number" ? tokenAmount.decimals : 6;

  if (!Number.isFinite(rawAmount)) {
    return 0;
  }

  return rawAmount / 10 ** decimals;
}

export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
}

export function buildRpcErrorLabel(rpcUrl: string): string {
  try {
    const url = new URL(rpcUrl);
    return url.hostname || rpcUrl;
  } catch {
    return rpcUrl;
  }
}

export function formatSolBalance(balance?: number | null): string {
  if (typeof balance !== "number" || Number.isNaN(balance)) {
    return "Syncing...";
  }

  if (balance >= 1000) {
    return `${balance.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} SOL`;
  }

  if (balance >= 1) {
    return `${balance.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} SOL`;
  }

  return `${balance.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  })} SOL`;
}

export function formatUsdcBalance(balance?: number | null): string {
  if (typeof balance !== "number" || Number.isNaN(balance)) {
    return "Syncing...";
  }

  return `${balance.toLocaleString("en-US", {
    minimumFractionDigits: balance >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  })} USDC`;
}

export function calculatePercentageAmount(amount: number, rate: number) {
  return Number(((amount * rate) / 100).toFixed(2));
}

/**
 * solana-wallet-constants.ts
 * Solana configuration and constants
 */

// RPC Configuration
const configuredSingleRpcUrl = import.meta.env.VITE_SOLANA_RPC_URL?.trim();
const configuredRpcUrls = (import.meta.env.VITE_SOLANA_RPC_URLS ?? "")
  .split(",")
  .map((rpcUrl) => rpcUrl.trim())
  .filter(Boolean);
const defaultProductionRpcProxyUrl = import.meta.env.PROD ? "/api/solana-rpc" : "";
const fallbackRpcUrl = "https://api.mainnet-beta.solana.com";

export const SOLANA_MAINNET_RPC_URLS = configuredRpcUrls.length > 0
  ? configuredRpcUrls
  : configuredSingleRpcUrl
    ? [configuredSingleRpcUrl]
    : defaultProductionRpcProxyUrl
      ? [defaultProductionRpcProxyUrl]
      : [fallbackRpcUrl];

// Tokens
export const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Timeouts
export const SOLANA_RPC_TIMEOUT_MS = 5000;
export const WALLET_CONNECT_TIMEOUT_MS = 9000;

// Storage Keys
export const WALLET_SNAPSHOT_CACHE_KEY = "octopus-market-wallet-snapshot-cache-v1";
export const WALLET_AUTO_RESTORE_BLOCKED_KEY = "octopus-market-wallet-auto-restore-blocked-v1";

// Cache
export const WALLET_SNAPSHOT_FRESHNESS_MS = 20_000;

// Network
export const SOLANA_LAMPORTS_PER_SOL = 1_000_000_000;

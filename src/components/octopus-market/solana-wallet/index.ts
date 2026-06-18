/**
 * solana-wallet/index.ts
 * Public API for Solana wallet module
 */

// Types
export type { SolanaPublicKey, SolanaSignatureResponse, SolanaProvider, SolanaWalletBalanceSnapshot, SolanaWalletProviderType } from "./solana-wallet-types";

// Constants
export { SOLANA_MAINNET_RPC_URLS, SOLANA_USDC_MINT, SOLANA_RPC_TIMEOUT_MS, WALLET_CONNECT_TIMEOUT_MS } from "./solana-wallet-constants";

// Provider
export { getAvailableSolanaProviders, getSolanaProvider, connectSolanaWallet, disconnectSolanaWallet, restoreSolanaWalletConnection, isWalletAutoRestoreBlocked, setWalletAutoRestoreBlocked } from "./solana-wallet-provider";

// Utils
export { formatWalletAddress, parseUsdAmount, normalizeUiTokenAmount, isMobileBrowser, buildRpcErrorLabel, formatSolBalance, formatUsdcBalance, calculatePercentageAmount } from "./solana-wallet-utils";

// Balance
export { readCachedWalletSnapshot, writeCachedWalletSnapshot, isWalletSnapshotFresh, fetchSolanaWalletBalanceSnapshot } from "./solana-wallet-balance";

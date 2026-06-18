/**
 * solana-wallet-types.ts
 * Solana wallet related types
 */

export type SolanaPublicKey = {
  toString(): string;
};

export type SolanaSignatureResponse = {
  signature: string;
};

export type SolanaProvider = {
  publicKey?: SolanaPublicKey | null;
  isConnected?: boolean;
  isPhantom?: boolean;
  signTransaction?: <T = unknown>(transaction: T) => Promise<T>;
  signAndSendTransaction?: <T = unknown>(
    transaction: T,
    options?: { skipPreflight?: boolean; preflightCommitment?: "processed" | "confirmed" | "finalized"; maxRetries?: number }
  ) => Promise<{ signature: string }>;
  signMessage?: (message: Uint8Array, display?: "hex" | "utf8") => Promise<SolanaSignatureResponse>;
  connect?: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: SolanaPublicKey }>;
  disconnect?: () => Promise<void>;
  on?: (event: "accountChanged" | "connect" | "disconnect", handler: (publicKey?: SolanaPublicKey | null) => void) => void;
  off?: (event: "accountChanged" | "connect" | "disconnect", handler: (publicKey?: SolanaPublicKey | null) => void) => void;
  removeListener?: (event: "accountChanged" | "connect" | "disconnect", handler: (publicKey?: SolanaPublicKey | null) => void) => void;
  request?: (method: string, params?: unknown) => Promise<unknown>;
};

export type SolanaWalletBalanceSnapshot = {
  address: string;
  lamports: number;
  balanceSol: number;
  usdcBalance: number;
  usdcRawAmount: string;
  usdcDecimals: number;
  slot: number | null;
  rpcUrl: string;
  fetchedAt: number;
};

export type SolanaWalletProviderType =
  | "phantom"
  | "backpack"
  | "solflare"
  | "ledger"
  | "keystone"
  | "magic-eden"
  | "unknown";

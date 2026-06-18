/**
 * lib/constants/pricing/config.ts
 * Payment and pricing configuration
 */

/**
 * Payment configuration
 */
export const PAYMENT_CONFIG = {
  // Default currency for payments
  defaultCurrency: "USDC" as const,

  // Token symbols
  tokenSymbols: {
    USDC: "USDC",
    SOL: "SOL",
  },

  // Fee configuration
  fees: {
    listingFeeRate: 0, // No listing fee
    claimFeeRate: 5, // 5% claim fee for prediction markets
    reserveFeeRate: 0, // No reserve fee
  },

  // Blockchain configuration
  solana: {
    network: import.meta.env.VITE_SOLANA_NETWORK || "mainnet-beta",
    rpcEndpoint: import.meta.env.VITE_SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
    commitment: "confirmed" as const,
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },

  // Timeout configuration
  timeout: {
    transactionSignatureMs: 60000, // 60 seconds
    transactionConfirmationMs: 120000, // 2 minutes
    totalPaymentFlowMs: 300000, // 5 minutes
  },
} as const;

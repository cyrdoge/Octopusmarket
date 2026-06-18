/**
 * solana-payment/index.ts
 * Public API for Solana payment module
 */

// Types
export type {
  PaymentRequestKind,
  PaymentRequestStatus,
  PaymentCurrency,
  PaymentRequestMetadata,
  EncodedTransferRequest,
  PaymentRequest,
  BuildTransactionInput,
  TransferValidationCriteria,
  DirectTransferResult,
  ReferenceCheckResult,
} from "./solana-payment-types";

// Storage
export { readStoredTransactions, writeStoredTransactions, updateStoredTransaction, listStoredTransactions, fetchTransaction } from "./solana-payment-storage";

// Encoding
export { decodeBase58, encodeBase58, randomHex, extractSignerWalletAddress } from "./solana-payment-encoding";

// RPC
export { requestSolanaRpc } from "./solana-payment-rpc";

// References
export { isValidReference, pollReferenceOnChain, findReference } from "./solana-payment-references";

// Builder
export { createPaymentReference, normalizeAmount, createTransfer, buildTransaction } from "./solana-payment-builder";

// Re-export remaining functions from solana-payment-impl.ts
export { submitSolanaTransfer, fetchLiveSolPriceUsd, convertUsdAmountToSol, buildOnChainMemo, scanIncomingTreasuryPayments, validateTransfer } from "./solana-payment-impl";


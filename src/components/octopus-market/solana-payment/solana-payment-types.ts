/**
 * solana-payment-types.ts
 * Shared types and constants for Solana payment processing
 */

export type PaymentRequestKind = "listing" | "launch" | "prediction";
export type PaymentRequestStatus = "created" | "signed" | "validated";
export type PaymentCurrency = "SOL" | "USDC";
export type PaymentRequestMetadata = Record<string, string | number | boolean>;

export type EncodedTransferRequest = {
  recipient: string;
  amount: number;
  reference: string;
  currency: PaymentCurrency;
  tokenMint?: string;
  tokenDecimals?: number;
  label?: string;
  message?: string;
  memo?: string;
};

export type PaymentRequest = EncodedTransferRequest & {
  id: string;
  kind: PaymentRequestKind;
  walletAddress: string;
  metadata?: PaymentRequestMetadata;
  encodedUrl: string;
  qrCodeSrc: string;
  signature: string | null;
  status: PaymentRequestStatus;
  createdAt: number;
  rpcUrl?: string;
  validatedAt?: number;
};

export type BuildTransactionInput = {
  kind: PaymentRequestKind;
  recipient: string;
  amount: number;
  walletAddress: string;
  currency?: PaymentCurrency;
  tokenMint?: string;
  tokenDecimals?: number;
  label?: string;
  message?: string;
  memo?: string;
  reference?: string;
  metadata?: PaymentRequestMetadata;
};

export type TransferValidationCriteria = {
  recipient: string;
  amount: number;
  reference: string;
  currency?: PaymentCurrency;
  tokenMint?: string;
  tokenDecimals?: number;
};

export type DirectTransferResult = {
  signature: string;
  rpcUrl: string;
};

export type ReferenceCheckResult = {
  signature: string;
  rpcUrl: string;
};

// Constants
export const PAYMENT_STORAGE_KEY = "octopus-market-payment-requests-v1";
export const SOLANA_RPC_TIMEOUT_MS = 10000;
export const SOLANA_LAMPORTS_PER_SOL = 1_000_000_000;
export const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111112";
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

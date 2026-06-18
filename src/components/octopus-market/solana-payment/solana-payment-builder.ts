/**
 * solana-payment-builder.ts
 * Transaction building and creation
 */

import { SOLANA_USDC_MINT } from "@/components/octopus-market/solana-wallet";
import { readStoredTransactions, writeStoredTransactions, updateStoredTransaction } from "./solana-payment-storage";
import { randomHex } from "./solana-payment-encoding";
import {
  type PaymentRequest,
  type BuildTransactionInput,
  type EncodedTransferRequest,
} from "./solana-payment-types";

// Import functions from solana-payment-impl for complex logic
import { buildOnChainMemo, encodeURL, createQR } from "./solana-payment-impl";

export function createPaymentReference(): string {
  return randomHex(32);
}

export function normalizeAmount(amount: number, decimals: number): number {
  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function createTransfer(input: BuildTransactionInput): EncodedTransferRequest {
  const reference = input.reference ?? createPaymentReference();
  const currency = input.currency ?? "SOL";
  const tokenMint = currency === "USDC" ? input.tokenMint ?? SOLANA_USDC_MINT : undefined;
  const tokenDecimals = currency === "USDC" ? input.tokenDecimals ?? 6 : 9;
  const amount = normalizeAmount(input.amount, tokenDecimals);

  return {
    recipient: input.recipient,
    amount,
    reference,
    currency,
    tokenMint,
    tokenDecimals,
    label: input.label,
    message: input.message,
    memo: input.memo,
  };
}

export function buildTransaction(input: BuildTransactionInput): PaymentRequest {
  const transfer = createTransfer(input);
  const id = `tx-${Date.now().toString(36).toUpperCase()}-${randomHex(5).toUpperCase()}`;

  // Build memo first (needed for request object)
  const tempRequest = {
    id,
    kind: input.kind,
    reference: transfer.reference,
    walletAddress: input.walletAddress,
    recipient: transfer.recipient,
    amount: transfer.amount,
    metadata: input.metadata,
    message: input.message,
  };
  const memo = buildOnChainMemo(tempRequest as Parameters<typeof buildOnChainMemo>[0]);

  // Build encoded URL with memo
  const encodedUrl = encodeURL({
    recipient: transfer.recipient,
    amount: transfer.amount,
    reference: transfer.reference,
    currency: transfer.currency,
    tokenMint: transfer.tokenMint,
    tokenDecimals: transfer.tokenDecimals,
    label: transfer.label,
    message: transfer.message,
    memo,
  });

  const request: PaymentRequest = {
    id,
    kind: input.kind,
    walletAddress: input.walletAddress,
    metadata: input.metadata,
    encodedUrl,
    qrCodeSrc: createQR(encodedUrl),
    signature: null,
    status: "created",
    createdAt: Date.now(),
    ...transfer,
    memo,
  };

  const nextTransactions = [request, ...readStoredTransactions()].slice(0, 120);
  writeStoredTransactions(nextTransactions);

  return request;
}

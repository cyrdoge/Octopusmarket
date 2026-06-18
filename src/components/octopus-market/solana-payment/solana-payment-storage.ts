/**
 * solana-payment-storage.ts
 * Storage and retrieval of payment requests
 */

import { PAYMENT_STORAGE_KEY, type PaymentRequest } from "./solana-payment-types";

export function readStoredTransactions(): PaymentRequest[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as PaymentRequest[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function writeStoredTransactions(transactions: PaymentRequest[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    return;
  }
}

export function updateStoredTransaction(
  transactionId: string,
  updater: (transaction: PaymentRequest) => PaymentRequest
): PaymentRequest | null {
  const transactions = readStoredTransactions();
  const nextTransactions = transactions.map((transaction) =>
    transaction.id === transactionId ? updater(transaction) : transaction
  );

  writeStoredTransactions(nextTransactions);

  return nextTransactions.find((transaction) => transaction.id === transactionId) ?? null;
}

export function listStoredTransactions(): PaymentRequest[] {
  return readStoredTransactions();
}

export async function fetchTransaction(transactionId: string): Promise<PaymentRequest | null> {
  return readStoredTransactions().find((transaction) => transaction.id === transactionId) ?? null;
}

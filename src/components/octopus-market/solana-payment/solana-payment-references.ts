/**
 * solana-payment-references.ts
 * Polling and checking payment references on-chain
 */

import { SOLANA_MAINNET_RPC_URLS } from "@/components/octopus-market/solana-wallet";
import { readStoredTransactions } from "./solana-payment-storage";
import { requestSolanaRpc } from "./solana-payment-rpc";
import type { ReferenceCheckResult } from "./solana-payment-types";

const POLL_REFERENCE_TIMEOUT_MS = 45000;
const POLL_REFERENCE_INTERVAL_MS = 2500;

export function isValidReference(reference: string): boolean {
  try {
    return reference.length === 44; // Solana public key base58 length
  } catch {
    return false;
  }
}

export async function pollReferenceOnChain(
  reference: string,
  timeoutMs = POLL_REFERENCE_TIMEOUT_MS,
  intervalMs = POLL_REFERENCE_INTERVAL_MS
): Promise<ReferenceCheckResult> {
  const startedAt = Date.now();
  const rpcErrors: string[] = [];

  while (Date.now() - startedAt < timeoutMs) {
    for (const rpcUrl of SOLANA_MAINNET_RPC_URLS) {
      try {
        const signatures = await requestSolanaRpc<Array<{ signature?: string }>>(
          rpcUrl,
          "getSignaturesForAddress",
          [reference, { limit: 5 }]
        );

        if (signatures?.[0]?.signature) {
          return {
            signature: signatures[0].signature,
            rpcUrl,
          };
        }
      } catch (error) {
        rpcErrors.push(error instanceof Error ? error.message : `scan failed on ${rpcUrl}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(rpcErrors.length > 0 ? rpcErrors.join(" · ") : "reference-poll-timeout");
}

export async function findReference(reference: string): Promise<ReferenceCheckResult | null> {
  const storedRequest = readStoredTransactions().find((transaction) => transaction.reference === reference) ?? null;
  const shouldUseChainLookup = storedRequest?.metadata?.onChainTransfer === true || !storedRequest;

  if (shouldUseChainLookup && isValidReference(reference)) {
    try {
      return await pollReferenceOnChain(reference, 18000, 2000);
    } catch {
      return null;
    }
  }

  if (storedRequest?.signature) {
    return {
      signature: storedRequest.signature,
      rpcUrl: storedRequest.rpcUrl || SOLANA_MAINNET_RPC_URLS[0] || "",
    };
  }

  return null;
}

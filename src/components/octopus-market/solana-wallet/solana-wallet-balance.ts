/**
 * solana-wallet-balance.ts
 * Wallet balance fetching and caching
 */

import { WALLET_SNAPSHOT_CACHE_KEY, WALLET_SNAPSHOT_FRESHNESS_MS, SOLANA_RPC_TIMEOUT_MS, SOLANA_MAINNET_RPC_URLS, SOLANA_USDC_MINT } from "./solana-wallet-constants";
import type { SolanaWalletBalanceSnapshot } from "./solana-wallet-types";
import { buildRpcErrorLabel, normalizeUiTokenAmount } from "./solana-wallet-utils";

type RpcResult<T> = {
  result?: T;
  error?: {
    message?: string;
  };
};

type GetParsedTokenAccountsByOwnerResult = {
  context?: {
    slot?: number;
  };
  value?: Array<{
    account?: {
      data?: {
        parsed?: {
          info?: {
            tokenAmount?: {
              amount?: string;
              decimals?: number;
              uiAmount?: number | null;
              uiAmountString?: string;
            };
          };
        };
      };
    };
  }>;
};

let solanaWeb3ModulePromise: Promise<typeof import("@solana/web3.js")> | null = null;

function loadSolanaWeb3() {
  if (!solanaWeb3ModulePromise) {
    solanaWeb3ModulePromise = import("@solana/web3.js");
  }

  return solanaWeb3ModulePromise;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

    promise
      .then((value) => {
        globalThis.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        globalThis.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function readWalletSnapshotCache() {
  if (typeof window === "undefined") {
    return {} as Record<string, SolanaWalletBalanceSnapshot>;
  }

  try {
    const rawValue = window.localStorage.getItem(WALLET_SNAPSHOT_CACHE_KEY);

    if (!rawValue) {
      return {} as Record<string, SolanaWalletBalanceSnapshot>;
    }

    const parsedValue = JSON.parse(rawValue) as Record<string, SolanaWalletBalanceSnapshot>;
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {} as Record<string, SolanaWalletBalanceSnapshot>;
  }
}

function writeWalletSnapshotCache(snapshot: SolanaWalletBalanceSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const nextCache = {
      ...readWalletSnapshotCache(),
      [snapshot.address]: snapshot,
    };

    window.localStorage.setItem(WALLET_SNAPSHOT_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    return;
  }
}

export function readCachedWalletSnapshot(address: string): SolanaWalletBalanceSnapshot | null {
  if (!address) {
    return null;
  }

  return readWalletSnapshotCache()[address] ?? null;
}

export function writeCachedWalletSnapshot(snapshot: SolanaWalletBalanceSnapshot): void {
  writeWalletSnapshotCache(snapshot);
}

export function isWalletSnapshotFresh(snapshot: SolanaWalletBalanceSnapshot | null): boolean {
  if (!snapshot) {
    return false;
  }

  return Date.now() - snapshot.fetchedAt < WALLET_SNAPSHOT_FRESHNESS_MS;
}

async function fetchSnapshotFromRpc(rpcUrl: string, address: string): Promise<SolanaWalletBalanceSnapshot> {
  const { Connection, PublicKey } = await loadSolanaWeb3();
  const ownerPublicKey = new PublicKey(address);
  const usdcMintPublicKey = new PublicKey(SOLANA_USDC_MINT);
  const connection = new Connection(rpcUrl, "confirmed");

  const [lamports, tokenAccountsResponse, slot] = await Promise.all([
    withTimeout(connection.getBalance(ownerPublicKey, "confirmed"), SOLANA_RPC_TIMEOUT_MS, `balance-timeout-${rpcUrl}`),
    withTimeout(
      connection.getParsedTokenAccountsByOwner(ownerPublicKey, { mint: usdcMintPublicKey }, "confirmed"),
      SOLANA_RPC_TIMEOUT_MS,
      `usdc-timeout-${rpcUrl}`
    ),
    withTimeout(connection.getSlot("confirmed"), SOLANA_RPC_TIMEOUT_MS, `slot-timeout-${rpcUrl}`),
  ]);

  const parsedTokenAccounts = Array.isArray(tokenAccountsResponse.value) ? tokenAccountsResponse.value : [];

  let usdcBalance = 0;
  let usdcRawAmount = 0;
  let usdcDecimals = 6;

  for (const tokenAccount of parsedTokenAccounts) {
    const tokenAmount = tokenAccount.account?.data?.parsed?.info?.tokenAmount;

    if (!tokenAmount) {
      continue;
    }

    const normalizedBalance = normalizeUiTokenAmount(tokenAmount);
    const normalizedRawAmount = Number(tokenAmount.amount ?? 0);

    usdcBalance += normalizedBalance;

    if (Number.isFinite(normalizedRawAmount)) {
      usdcRawAmount += normalizedRawAmount;
    }

    if (typeof tokenAmount.decimals === "number") {
      usdcDecimals = tokenAmount.decimals;
    }
  }

  return {
    address,
    lamports,
    balanceSol: lamports / 1_000_000_000,
    usdcBalance: Number(usdcBalance.toFixed(usdcDecimals > 4 ? 4 : usdcDecimals)),
    usdcRawAmount: String(Math.max(0, Math.round(usdcRawAmount))),
    usdcDecimals,
    slot: Number.isFinite(slot) ? slot : tokenAccountsResponse.context?.slot ?? null,
    rpcUrl,
    fetchedAt: Date.now(),
  };
}

export async function fetchSolanaWalletBalanceSnapshot(address: string): Promise<SolanaWalletBalanceSnapshot> {
  if (SOLANA_MAINNET_RPC_URLS.length === 0) {
    const cachedSnapshot = readCachedWalletSnapshot(address);

    if (cachedSnapshot) {
      return cachedSnapshot;
    }

    const fallbackSnapshot: SolanaWalletBalanceSnapshot = {
      address,
      lamports: 0,
      balanceSol: 0,
      usdcBalance: 0,
      usdcRawAmount: "0",
      usdcDecimals: 6,
      slot: null,
      rpcUrl: "local-fallback",
      fetchedAt: Date.now(),
    };

    writeWalletSnapshotCache(fallbackSnapshot);
    return fallbackSnapshot;
  }

  const endpointErrors: string[] = [];

  return new Promise<SolanaWalletBalanceSnapshot>((resolve, reject) => {
    let settled = false;
    let pendingCount = SOLANA_MAINNET_RPC_URLS.length;

    for (const rpcUrl of SOLANA_MAINNET_RPC_URLS) {
      void fetchSnapshotFromRpc(rpcUrl, address)
        .then((snapshot) => {
          if (settled) {
            return;
          }

          settled = true;
          writeWalletSnapshotCache(snapshot);
          resolve(snapshot);
        })
        .catch((error) => {
          endpointErrors.push(error instanceof Error ? error.message : `${buildRpcErrorLabel(rpcUrl)} failed`);
          pendingCount -= 1;

          if (!settled && pendingCount === 0) {
            reject(
              new Error(
                endpointErrors.length > 0
                  ? `Live SOL and USDC balances are still syncing. ${endpointErrors.join(" · ")}`
                  : "Live SOL and USDC balances are still syncing."
              )
            );
          }
        });
    }
  });
}

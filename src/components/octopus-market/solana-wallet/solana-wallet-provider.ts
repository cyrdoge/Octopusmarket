/**
 * solana-wallet-provider.ts
 * Wallet provider detection and connection management
 */

import { WALLET_CONNECT_TIMEOUT_MS } from "./solana-wallet-constants";
import type { SolanaProvider, SolanaWalletProviderType } from "./solana-wallet-types";

type WindowWithSolana = Window & {
  solana?: SolanaProvider;
  phantom?: { solana?: SolanaProvider };
  backpack?: SolanaProvider;
  solflare?: SolanaProvider;
  wallets?: { solana?: SolanaProvider };
};

const WALLET_AUTO_RESTORE_BLOCKED_KEY = "octopus-market-wallet-auto-restore-blocked-v1";

export function isWalletAutoRestoreBlocked(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(WALLET_AUTO_RESTORE_BLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWalletAutoRestoreBlocked(blocked: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (blocked) {
      window.localStorage.setItem(WALLET_AUTO_RESTORE_BLOCKED_KEY, "1");
    } else {
      window.localStorage.removeItem(WALLET_AUTO_RESTORE_BLOCKED_KEY);
    }
  } catch {
    return;
  }
}

export function getAvailableSolanaProviders(): Array<[SolanaWalletProviderType, SolanaProvider]> {
  if (typeof window === "undefined") {
    return [];
  }

  const w = window as unknown as WindowWithSolana;
  const providers: Array<[SolanaWalletProviderType, SolanaProvider]> = [];

  if (w.phantom?.solana) {
    providers.push(["phantom", w.phantom.solana]);
  }

  if (w.backpack) {
    providers.push(["backpack", w.backpack]);
  }

  if (w.solflare) {
    providers.push(["solflare", w.solflare]);
  }

  if (w.wallets?.solana) {
    providers.push(["magic-eden", w.wallets.solana]);
  }

  if (w.solana && !w.phantom?.solana) {
    providers.push(["unknown", w.solana]);
  }

  return providers;
}

export function getSolanaProvider(): SolanaProvider | null {
  const providers = getAvailableSolanaProviders();
  return providers.length > 0 ? providers[0][1] : null;
}

export async function connectSolanaWallet(): Promise<{ address: string; provider: SolanaProvider } | null> {
  setWalletAutoRestoreBlocked(false);

  const providers = getAvailableSolanaProviders();

  if (providers.length === 0) {
    throw new Error("wallet-unavailable");
  }

  for (const [, provider] of providers) {
    const existingAddress = provider.publicKey?.toString();

    if (existingAddress) {
      return { address: existingAddress, provider };
    }

    try {
      const result = await Promise.race([
        provider.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("wallet-connect-timeout")), WALLET_CONNECT_TIMEOUT_MS)
        ),
      ]);

      const address = result.publicKey?.toString() ?? provider.publicKey?.toString();

      if (address) {
        return { address, provider };
      }

      if (provider.isConnected && provider.publicKey?.toString()) {
        return { address: provider.publicKey.toString(), provider };
      }
    } catch {
      continue;
    }
  }

  throw new Error("wallet-address-unavailable");
}

export async function restoreSolanaWalletConnection(): Promise<{ address: string; provider: SolanaProvider } | null> {
  if (isWalletAutoRestoreBlocked()) {
    return null;
  }

  const provider = getSolanaProvider();

  if (!provider) {
    return null;
  }

  const existingAddress = provider.publicKey?.toString();

  if (existingAddress) {
    return { address: existingAddress, provider };
  }

  try {
    const result = await Promise.race([
      provider.connect({ onlyIfTrusted: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("wallet-restore-timeout")), WALLET_CONNECT_TIMEOUT_MS)
      ),
    ]);

    const address = result.publicKey?.toString() ?? provider.publicKey?.toString();

    if (address) {
      return { address, provider };
    }

    if (provider.isConnected && provider.publicKey?.toString()) {
      return { address: provider.publicKey.toString(), provider };
    }
  } catch {
    if (provider.isConnected && provider.publicKey?.toString()) {
      return { address: provider.publicKey.toString(), provider };
    }
  }

  return null;
}

export async function disconnectSolanaWallet(): Promise<void> {
  setWalletAutoRestoreBlocked(true);

  const provider = getSolanaProvider();

  if (!provider?.disconnect) {
    return;
  }

  try {
    await provider.disconnect();
  } catch {
    return;
  }
}

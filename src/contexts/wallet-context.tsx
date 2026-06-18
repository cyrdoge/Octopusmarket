/**
 * src/contexts/wallet-context.tsx
 * Wallet context - wraps Solana wallet functions
 * Provides wallet state and methods to all pages/components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  connectSolanaWallet,
  disconnectSolanaWallet,
  fetchSolanaWalletBalanceSnapshot,
  readCachedWalletSnapshot,
  restoreSolanaWalletConnection,
  type SolanaWalletBalanceSnapshot,
  type SolanaProvider,
  formatWalletAddress,
  formatSolBalance,
  formatUsdcBalance,
} from "@/components/octopus-market/solana-wallet";

export type WalletContextType = {
  isConnected: boolean;
  walletAddress: string | null;
  walletDisplayLabel: string;
  balanceSnapshot: SolanaWalletBalanceSnapshot | null;
  isLoading: boolean;
  connect: () => Promise<{ address: string; provider: SolanaProvider } | null>;
  disconnect: () => Promise<void>;
  refreshBalance: (address?: string) => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balanceSnapshot, setBalanceSnapshot] = useState<SolanaWalletBalanceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize wallet on mount
  useEffect(() => {
    const initWallet = async () => {
      try {
        const restored = await restoreSolanaWalletConnection();
        if (restored) {
          setIsConnected(true);
          setWalletAddress(restored.address);
          await refreshBalance(restored.address);
        }
      } catch (error) {
        console.warn("Wallet auto-restore failed:", error);
      }
    };

    initWallet();
  }, []);

  const connect = async () => {
    setIsLoading(true);
    try {
      const result = await connectSolanaWallet();
      if (result) {
        setWalletAddress(result.address);
        setIsConnected(true);
        await refreshBalance(result.address);
      } else {
        console.warn("Wallet connection returned null");
        alert("Wallet connection was cancelled or failed. Please try again.");
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Wallet connection error:", errorMsg);

      // User-friendly error messages
      if (errorMsg.includes("wallet-unavailable")) {
        alert("Phantom wallet not found. Please install Phantom extension.");
      } else if (errorMsg.includes("wallet-connect-timeout")) {
        alert("Wallet connection timeout. Please try again.");
      } else if (errorMsg.includes("user-rejected")) {
        alert("You rejected the connection. Please try again if you'd like to connect.");
      } else {
        alert("Failed to connect wallet: " + errorMsg);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      await disconnectSolanaWallet();
      setWalletAddress(null);
      setIsConnected(false);
      setBalanceSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async (address?: string) => {
    const targetAddress = address || walletAddress;
    if (targetAddress) {
      try {
        const snapshot = await fetchSolanaWalletBalanceSnapshot(targetAddress);
        setBalanceSnapshot(snapshot);
      } catch (error) {
        console.warn("Failed to fetch balance:", error);
      }
    }
  };

  const walletDisplayLabel = walletAddress ? formatWalletAddress(walletAddress) : "Connect wallet";

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        walletDisplayLabel,
        balanceSnapshot,
        isLoading,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

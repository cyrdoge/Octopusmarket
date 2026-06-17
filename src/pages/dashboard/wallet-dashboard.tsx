/**
 * src/pages/dashboard/wallet-dashboard.tsx
 * Wallet dashboard - Shows wallet info and balances
 */

import { useWallet } from "@/contexts/wallet-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function WalletDashboardPage() {
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (wallet.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <h3 className="text-lg font-semibold">Connect Wallet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Please connect your Solana wallet to view your dashboard.</p>
        <Button onClick={() => wallet.connect()} className="mt-4">
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Address</CardTitle>
          <CardDescription>Your connected Solana wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 font-mono text-sm dark:border-white/10 dark:bg-zinc-900">
              {wallet.walletAddress}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyAddress}>
              {copied ? (
                <>
                  <Check className="mr-2 size-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Balances */}
      {wallet.balanceSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle>Account Balances</CardTitle>
            <CardDescription>Your current Solana and USDC balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-white/10 dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">SOL Balance</p>
                <p className="mt-2 text-2xl font-bold">{wallet.balanceSnapshot.balanceSol.toFixed(2)}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {wallet.balanceSnapshot.lamports.toLocaleString()} lamports
                </p>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-white/10 dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">USDC Balance</p>
                <p className="mt-2 text-2xl font-bold">${wallet.balanceSnapshot.usdcBalance.toFixed(2)}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {wallet.balanceSnapshot.usdcRawAmount} raw
                </p>
              </div>
            </div>
            <Button onClick={() => wallet.refreshBalance()} variant="outline" className="mt-4 w-full">
              Refresh Balances
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">
            View on Solana Explorer
          </Button>
          <Button variant="outline" className="w-full" onClick={wallet.disconnect}>
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

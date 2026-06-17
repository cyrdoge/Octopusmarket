/**
 * src/pages/dashboard/admin-dashboard.tsx
 * Admin dashboard - Shows admin-specific information and controls
 */

import { useWallet } from "@/contexts/wallet-context";
import { ADMIN_WALLET_ADDRESS } from "@/components/octopus-market/octopus-market-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ChartLine, Gift, Database, Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function AdminDashboardPage() {
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);

  const isAdmin = wallet.isConnected && wallet.walletAddress === ADMIN_WALLET_ADDRESS;

  if (!wallet.isConnected) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <h3 className="text-lg font-semibold">Connect Wallet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Please connect your Solana wallet to view admin dashboard.</p>
        <Button onClick={() => wallet.connect()} className="mt-4">
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <Badge className="inline-block bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          Admin Access Only
        </Badge>
        <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to be connected with an admin wallet to access this dashboard.
        </p>
      </div>
    );
  }

  const handleCopyAddress = () => {
    if (wallet.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Admin Tools - Top */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Tools</CardTitle>
          <CardDescription>Access administrative controls and monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/prediction-market">
              <div className="flex items-center justify-center gap-2 h-auto py-4 px-4 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <ChartLine size={24} weight="bold" />
                <span className="text-center text-sm font-medium">Create Prediction Events</span>
              </div>
            </Link>
            <Link to="/list-my-ai">
              <div className="flex items-center justify-center gap-2 h-auto py-4 px-4 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <Gift size={24} weight="bold" />
                <span className="text-center text-sm font-medium">Free AI Listing</span>
              </div>
            </Link>
            <Link to="/dashboard/user-data">
              <div className="flex items-center justify-center gap-2 h-auto py-4 px-4 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <Database size={24} weight="bold" />
                <span className="text-center text-sm font-medium">User Data</span>
              </div>
            </Link>
            <Link to="/dashboard/all-ai">
              <div className="flex items-center justify-center gap-2 h-auto py-4 px-4 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <Sparkle size={24} weight="bold" />
                <span className="text-center text-sm font-medium">All AI Database</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Admin Badge */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-400/30 dark:bg-orange-500/10">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="bg-orange-500 text-white">Admin Access</Badge>
            <h2 className="mt-2 text-xl font-bold">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Full administrative control and monitoring</p>
          </div>
        </div>
      </div>

      {/* Admin Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Wallet Address</CardTitle>
          <CardDescription>Your admin wallet on the Solana blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 font-mono text-sm dark:border-white/10 dark:bg-zinc-900">
              {wallet.walletAddress}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyAddress}>
              {copied ? (
                <>
                  <Check size={16} weight="bold" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} weight="bold" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Account Balances */}
      {wallet.balanceSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle>Account Balances</CardTitle>
            <CardDescription>Admin wallet balances</CardDescription>
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
                <p className="mt-2 text-2xl font-bold">{wallet.balanceSnapshot?.usdcBalance?.toFixed(2) || "0.00"}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {wallet.balanceSnapshot?.usdcRawAmount ? Number(wallet.balanceSnapshot.usdcRawAmount).toLocaleString() : "0"} USDC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

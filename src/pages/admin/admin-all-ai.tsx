/**
 * src/pages/admin/admin-all-ai.tsx
 * Admin page - View all AI tools registered in database
 */

import { Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/wallet-context";
import { ADMIN_WALLET_ADDRESS } from "@/components/octopus-market/octopus-market-data";
import { Download, Eye } from "@phosphor-icons/react";

const LazyCommunityAIMarket = lazy(() =>
  import("@/components/octopus-market/community-ai-market").then((m) => ({
    default: m.CommunityAIMarket,
  }))
);

export function AdminAllAIPage() {
  const wallet = useWallet();
  const guestActorId = `guest-${Math.random().toString(36).slice(2, 10)}`;

  const isAdmin = wallet.isConnected && wallet.walletAddress === ADMIN_WALLET_ADDRESS;

  if (!wallet.isConnected) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <h3 className="text-lg font-semibold">Connect Wallet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Please connect your wallet to view AI database.</p>
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
          You need to be connected with an admin wallet to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-400/30 dark:bg-orange-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">All AI Tools Database</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              View and manage all AI tools registered in the system
            </p>
          </div>
          <Button className="w-full sm:w-auto gap-2 bg-orange-500 hover:bg-orange-600">
            <Download size={18} weight="bold" />
            Export Data
          </Button>
        </div>
      </div>

      {/* AI Grid with CommunityAIMarket */}
      <Card>
        <CardHeader>
          <CardTitle>Registered AI Tools</CardTitle>
          <CardDescription>All AI products currently in the database</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12">
                <div className="space-y-4 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"></div>
                  <p className="text-sm text-muted-foreground">Loading AI tools...</p>
                </div>
              </div>
            }
          >
            <LazyCommunityAIMarket
              actorKey={wallet.walletAddress || guestActorId}
              actorLabel={wallet.walletDisplayLabel}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Tools for managing AI products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="w-full gap-2">
              <Eye size={18} weight="bold" />
              View Statistics
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Download size={18} weight="bold" />
              Export CSV
            </Button>
            <Button variant="outline" className="w-full gap-2">
              Filter Tools
            </Button>
            <Button variant="outline" className="w-full gap-2">
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-500/10">
        <CardContent className="pt-6">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <strong>Note:</strong> This view shows all AI tools registered in the database. You can manage, approve, or remove tools from this admin dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * src/pages/admin/admin-center.tsx
 * Admin control center
 */

import { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";
import { Badge } from "@/components/ui/badge";

const LazyAdminControlCenter = lazy(() =>
  import("@/components/octopus-market/admin-control-center").then((m) => ({
    default: m.AdminControlCenter,
  }))
);

export function AdminCenterPage() {
  const wallet = useWallet();

  const adminWalletAddress = "EsR6usyjCzhgL6dZFqHRsw6pDh7CgvfHtkQzCybJMuCZ";
  const isAdmin = wallet.walletAddress === adminWalletAddress;

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <Badge className="inline-block bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          Admin Access Only
        </Badge>
        <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to be connected with an admin wallet to access this area.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<Card><CardContent className="p-6">Loading admin center...</CardContent></Card>}>
      <LazyAdminControlCenter walletAddress={wallet.walletAddress} />
    </Suspense>
  );
}

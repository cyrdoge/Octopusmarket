/**
 * src/pages/dashboard/index.tsx
 * Dashboard redirect - Routes users to correct dashboard based on role
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/wallet-context";
import { ADMIN_WALLET_ADDRESS } from "@/components/octopus-market/octopus-market-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const navigate = useNavigate();
  const wallet = useWallet();

  useEffect(() => {
    if (!wallet.isConnected) {
      return;
    }

    // Redirect to admin dashboard if admin wallet
    if (wallet.walletAddress === ADMIN_WALLET_ADDRESS) {
      navigate("/dashboard/admin", { replace: true });
    } else {
      // Redirect to user dashboard for regular wallets
      navigate("/dashboard/user", { replace: true });
    }
  }, [wallet.isConnected, wallet.walletAddress, navigate]);

  if (!wallet.isConnected) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <h3 className="text-lg font-semibold">Connect Wallet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Please connect your wallet to access your dashboard.</p>
        <Button onClick={() => wallet.connect()} className="mt-4">
          Connect Wallet
        </Button>
      </div>
    );
  }

  // Loading state while redirect happens
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"></div>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </CardContent>
    </Card>
  );
}

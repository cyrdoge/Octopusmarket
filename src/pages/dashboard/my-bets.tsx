/**
 * src/pages/dashboard/my-bets.tsx
 * My Bets page - Shows user's active prediction bets
 */

import { useWallet } from "@/contexts/wallet-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MyBetsPage() {
  const wallet = useWallet();

  if (!wallet.isConnected) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <h3 className="text-lg font-semibold">Connect Wallet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Please connect your wallet to view your active bets.</p>
      </div>
    );
  }

  // Placeholder - will integrate with prediction market store
  const bets: any[] = [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Active Bets</CardTitle>
          <CardDescription>Your prediction market positions</CardDescription>
        </CardHeader>
        <CardContent>
          {bets.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">No active bets. Start predicting in the Prediction Market!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bets.map((bet, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{bet.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{bet.description}</p>
                    </div>
                    <Badge>{bet.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bet Statistics</CardTitle>
          <CardDescription>Your overall performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Bets</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold">$0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

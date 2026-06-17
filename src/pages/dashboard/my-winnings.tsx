/**
 * src/pages/dashboard/my-winnings.tsx
 * My Winnings page - Shows user's profits and winning bets
 */

import { useWallet } from "@/contexts/wallet-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export function MyWinningsPage() {
  const wallet = useWallet();

  if (!wallet.isConnected) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <h3 className="text-lg font-semibold">Connect Wallet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Please connect your wallet to view your winnings.</p>
      </div>
    );
  }

  // Placeholder - will integrate with prediction market store
  const winnings: any[] = [];

  return (
    <div className="space-y-6">
      {/* Winnings Summary */}
      <Card className="border-green-200 bg-green-50 dark:border-green-400/20 dark:bg-green-500/5">
        <CardHeader>
          <CardTitle>Total Winnings</CardTitle>
          <CardDescription>Your lifetime profits on Octopus Market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-green-600 dark:text-green-400">$0</span>
            <div className="mb-2 flex items-center gap-1 text-green-600 dark:text-green-400">
              <TrendingUp className="size-4" />
              <span className="text-sm">0% ROI</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winning Bets */}
      <Card>
        <CardHeader>
          <CardTitle>Winning Predictions</CardTitle>
          <CardDescription>Your successful prediction history</CardDescription>
        </CardHeader>
        <CardContent>
          {winnings.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">No winning predictions yet. Keep predicting to win!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {winnings.map((win, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{win.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{win.outcome}</p>
                    </div>
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-400/20 dark:bg-green-500/5 dark:text-green-300">
                      +{win.profit}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Your prediction statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Correct Predictions</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Payout</p>
              <p className="text-2xl font-bold">$0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Trade</p>
              <p className="text-2xl font-bold">$0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

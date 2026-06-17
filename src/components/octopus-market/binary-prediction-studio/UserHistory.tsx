/**
 * UserHistory.tsx
 * Displays user's betting history and results
 */

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PredictionHistoryEntry } from "../prediction-market-store";
import { formatCurrency, formatMoment, getEntryStatusLabel } from "./utils";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface UserHistoryProps {
  history: PredictionHistoryEntry[];
  onClaim?: (entryId: string) => void;
  isLoading?: boolean;
}

export const UserHistory = memo(function UserHistory({ history, onClaim, isLoading = false }: UserHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Betting History</CardTitle>
          <CardDescription>Your bets will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">No bets yet. Start betting to see your history!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Betting History</CardTitle>
        <CardDescription>{history.length} bet(s) placed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((entry: any) => {
            const isResolved = entry.resolutionId;
            const didWin = entry.selectionId === entry.resolutionId;
            const isClaimed = entry.claimReference;
            const isClaimable = didWin && !isClaimed;

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {/* Status Icon */}
                <div className="mr-4">
                  {isClaimed ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : didWin && isResolved ? (
                    <CheckCircle2 size={20} className="text-blue-500" />
                  ) : isResolved && !didWin ? (
                    <XCircle size={20} className="text-red-500" />
                  ) : (
                    <Clock size={20} className="text-amber-500" />
                  )}
                </div>

                {/* Entry Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.selectionId || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{formatMoment(entry.createdAtTimestamp)}</p>
                </div>

                {/* Amount */}
                <div className="text-right mr-4">
                  <p className="text-sm font-medium">{formatCurrency(Number(entry.amountUsd) || 0)}</p>
                  {entry.potentialReturnUsd && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(entry.potentialReturnUsd)}</p>
                  )}
                </div>

                {/* Status Badge */}
                <div>
                  <Badge
                    variant={isClaimable ? "default" : "outline"}
                    className="text-xs"
                  >
                    {getEntryStatusLabel({
                      isHistoryResolved: !!isResolved,
                      didUserWin: didWin,
                      isClaimable,
                      isClaimed,
                    })}
                  </Badge>
                </div>

                {/* Claim Button */}
                {isClaimable && onClaim && (
                  <Button
                    onClick={() => onClaim(entry.id)}
                    size="sm"
                    className="ml-4 bg-green-500 hover:bg-green-600"
                  >
                    Claim
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

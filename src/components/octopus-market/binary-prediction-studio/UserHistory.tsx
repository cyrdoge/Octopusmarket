/**
 * UserHistory.tsx
 * Affiche l'historique des paris de l'utilisateur avec statuts,
 * gains potentiels, et logique de claim intégrée.
 */

import { memo, useState } from "react";
import { CheckCircle2, XCircle, Clock, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  readPredictionHistory,
  updatePredictionHistoryEntry,
  type PredictionHistoryEntry,
} from "@/components/octopus-market/prediction-market-store";
import { formatCurrency, formatMoment, getEntryStatusLabel, buildClaimReference } from "./utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DerivedHistoryEntry = PredictionHistoryEntry & {
  resolution?: { outcomeId: string; resolvedAt: number; resolvedByWallet: string };
  adminStatus: string;
  isResolved: boolean;
  isWinner: boolean;
  isLoser: boolean;
  canClaim: boolean;
};

interface UserHistoryProps {
  history: DerivedHistoryEntry[];
  walletAddress: string | null;
  onConnectWallet: () => Promise<string | null>;
  onHistoryUpdate: () => void;
  isLoading?: boolean;
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusIcon({ entry }: { entry: DerivedHistoryEntry }) {
  if (entry.claimedAt) return <Trophy size={18} className="text-orange-500" />;
  if (entry.canClaim) return <CheckCircle2 size={18} className="text-green-500" />;
  if (entry.isWinner) return <CheckCircle2 size={18} className="text-blue-500" />;
  if (entry.isLoser) return <XCircle size={18} className="text-red-500" />;
  return <Clock size={18} className="text-amber-500" />;
}

// ─── Badge variant ────────────────────────────────────────────────────────────

function statusBadgeClass(entry: DerivedHistoryEntry): string {
  if (entry.claimedAt) return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300";
  if (entry.canClaim) return "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300";
  if (entry.isLoser) return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";
  return "border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400";
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UserHistory = memo(function UserHistory({
  history,
  walletAddress,
  onConnectWallet,
  onHistoryUpdate,
  isLoading = false,
}: UserHistoryProps) {
  const [claimingEntryId, setClaimingEntryId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // ── handleClaimReward ──
  async function handleClaimReward(entry: DerivedHistoryEntry) {
    let connectedWallet = walletAddress;
    if (!connectedWallet) connectedWallet = await onConnectWallet();

    if (!connectedWallet) {
      setClaimError("Connect the winning wallet first to claim a reward.");
      return;
    }

    if (!entry.isResolved) {
      setClaimError("This prediction has not been resolved by the admin yet.");
      return;
    }

    if (entry.adminStatus !== "approved") {
      setClaimError("The payment for this position must be approved by the admin before a reward can be claimed.");
      return;
    }

    if (connectedWallet !== entry.walletAddress) {
      setClaimError("Use the same wallet that placed the winning position to claim the reward.");
      return;
    }

    if (entry.resolution?.outcomeId !== entry.selectionId) {
      setClaimError("This position is not on the winning side, so there is no reward to claim.");
      return;
    }

    if (entry.claimedAt) {
      setClaimError("This reward has already been claimed.");
      return;
    }

    try {
      setClaimingEntryId(entry.id);
      setClaimError(null);

      await new Promise((resolve) => window.setTimeout(resolve, 800));

      const claimReference = buildClaimReference();
      updatePredictionHistoryEntry(entry.id, (current) => ({
        ...current,
        claimedAt: Date.now(),
        claimReference,
        payoutRecordedAt: Date.now(),
        resultStatus: "claimed",
      }));

      onHistoryUpdate();
    } finally {
      setClaimingEntryId(null);
    }
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-white dark:border-white/10 dark:bg-white/5">
        <CardContent className="flex items-center justify-center p-12">
          <div className="space-y-3 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Empty ──
  if (!history || history.length === 0) {
    return (
      <Card className="border-orange-200 bg-white dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle>Betting History</CardTitle>
          <CardDescription>Your bets will appear here after your first position.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <TrendingUp size={32} className="mb-3 text-orange-300" />
            <p className="text-sm text-muted-foreground">
              No bets yet. Place your first position to see your history here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── List ──
  return (
    <Card
      id="prediction-player-history"
      className="scroll-mt-32 border-orange-200 bg-white dark:border-white/10 dark:bg-white/5"
    >
      <CardHeader>
        <CardTitle>Betting History</CardTitle>
        <CardDescription>{history.length} position{history.length !== 1 ? "s" : ""} placed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {claimError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {claimError}
          </div>
        )}

        {history.map((entry) => {
          const isClaiming = claimingEntryId === entry.id;

          return (
            <div
              key={entry.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-4 dark:border-white/10 dark:bg-black/20"
            >
              {/* Status icon */}
              <StatusIcon entry={entry} />

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950 dark:text-white">
                  {entry.marketTitle}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.selectionLabel} · {formatMoment(entry.createdAt)}
                </p>
              </div>

              {/* Amounts */}
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {formatCurrency(entry.amount)}
                </p>
                {entry.netReward > 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    → {formatCurrency(entry.netReward)} net
                  </p>
                )}
              </div>

              {/* Status badge */}
              <Badge
                className={`border text-xs ${statusBadgeClass(entry)}`}
                variant="outline"
              >
                {getEntryStatusLabel({
                  isHistoryResolved: entry.isResolved,
                  didUserWin: entry.isWinner,
                  isClaimable: entry.canClaim,
                  isClaimed: Boolean(entry.claimedAt),
                })}
              </Badge>

              {/* Claim button */}
              {entry.canClaim && (
                <Button
                  size="sm"
                  disabled={isClaiming}
                  onClick={() => void handleClaimReward(entry)}
                  className="rounded-xl bg-orange-500 text-white hover:bg-orange-400"
                >
                  {isClaiming ? "Claiming..." : `Claim ${formatCurrency(entry.netReward)}`}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

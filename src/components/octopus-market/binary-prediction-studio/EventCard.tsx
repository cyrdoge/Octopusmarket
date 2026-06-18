/**
 * EventCard.tsx
 * Single prediction event card with inline bet simulator.
 * Supports two display modes:
 *   - "vs"     → team vs team header (football, basketball…)
 *   - "simple" → title + category header (crypto, politics…)
 */

import { memo, useState, useCallback } from "react";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "./utils";
import type { AdminMarketCreationMode } from "./types";
import type { PredictionMarketOption } from "../octopus-market-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventCardProps {
  id: string;
  title: string;
  categoryLabel?: string;
  /** "vs" renders a team-vs-team header; "simple" renders a plain title */
  mode?: AdminMarketCreationMode;
  /** Required when mode === "vs": the two competing sides */
  homeTeam?: { name: string; emoji?: string; imageSrc?: string };
  awayTeam?: { name: string; emoji?: string; imageSrc?: string };
  /** Single image for "simple" mode */
  singleImageSrc?: string;
  options: PredictionMarketOption[];
  onConfirmBet: (params: {
    eventId: string;
    optionId: string;
    optionLabel: string;
    amount: number;
    potentialReturn: number;
  }) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VsHeader({
  homeTeam,
  awayTeam,
}: {
  homeTeam: EventCardProps["homeTeam"];
  awayTeam: EventCardProps["awayTeam"];
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {/* Home */}
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-orange-500/30 bg-orange-500/10 text-2xl font-bold overflow-hidden">
          {homeTeam?.imageSrc ? (
            <img src={homeTeam.imageSrc} alt={homeTeam.name} className="h-full w-full object-cover" />
          ) : (
            homeTeam?.emoji ?? "🏠"
          )}
        </div>
        <span className="line-clamp-2 text-center text-xs font-semibold text-foreground">
          {homeTeam?.name ?? "Home"}
        </span>
      </div>

      {/* VS badge */}
      <span className="shrink-0 rounded-lg border border-orange-500/40 bg-orange-500/15 px-2 py-1 text-[10px] font-bold text-orange-500">
        VS
      </span>

      {/* Away */}
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-orange-500/30 bg-orange-500/10 text-2xl font-bold overflow-hidden">
          {awayTeam?.imageSrc ? (
            <img src={awayTeam.imageSrc} alt={awayTeam.name} className="h-full w-full object-cover" />
          ) : (
            awayTeam?.emoji ?? "✈️"
          )}
        </div>
        <span className="line-clamp-2 text-center text-xs font-semibold text-foreground">
          {awayTeam?.name ?? "Away"}
        </span>
      </div>
    </div>
  );
}

function SimpleHeader({
  title,
  categoryLabel,
  singleImageSrc,
}: {
  title: string;
  categoryLabel?: string;
  singleImageSrc?: string;
}) {
  return (
    // min-h forces all cards to reserve the same header height regardless of title length
    <div className="min-h-[52px] space-y-2">
      {singleImageSrc && (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/5 overflow-hidden">
          <img src={singleImageSrc} alt={title} className="h-full w-full object-cover" />
        </div>
      )}
      {categoryLabel && (
        <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {categoryLabel}
        </p>
      )}
      <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
        {title}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const EventCard = memo(function EventCard({
  id,
  title,
  categoryLabel,
  mode = "simple",
  homeTeam,
  awayTeam,
  singleImageSrc,
  options,
  onConfirmBet,
}: EventCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    options[0]?.id ?? ""
  );
  const [betAmount, setBetAmount] = useState<string>("10");

  const selectedOption = options.find((o) => o.id === selectedOptionId);
  const amount = parseFloat(betAmount) || 0;
  const potentialReturn = amount * (selectedOption?.oddsMultiplier ?? 1);
  const profit = potentialReturn - amount;

  const handleConfirm = useCallback(() => {
    if (!selectedOption || amount <= 0) return;
    onConfirmBet({
      eventId: id,
      optionId: selectedOption.id,
      optionLabel: selectedOption.label,
      amount,
      potentialReturn,
    });
  }, [id, selectedOption, amount, potentialReturn, onConfirmBet]);

  return (
    // Removed min-h-96 — card height is now driven by content, keeping all sections aligned
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-3 transition-colors hover:border-orange-500 hover:bg-card/70">

      {/* ── Header ── */}
      {mode === "vs" ? (
        // min-h accounts for categoryLabel line + VsHeader so vs-mode cards stay aligned too
        <div className="min-h-[52px]">
          {categoryLabel && (
            <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {categoryLabel}
            </p>
          )}
          <VsHeader homeTeam={homeTeam} awayTeam={awayTeam} />
        </div>
      ) : (
        <SimpleHeader title={title} categoryLabel={categoryLabel} singleImageSrc={singleImageSrc} />
      )}

      {/* ── Options ── */}
      {/* min-h ensures option buttons zone never collapses when there's only 1 option */}
      <div className="flex min-h-[56px] flex-wrap gap-1">
        {options.map((option) => {
          const isSelected = option.id === selectedOptionId;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedOptionId(option.id)}
              className={[
                "flex flex-1 flex-col items-center rounded-lg border px-2 py-2 transition-all",
                isSelected
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-border bg-muted hover:border-orange-400",
              ].join(" ")}
            >
              <span className="line-clamp-2 text-center text-[11px] text-muted-foreground">
                {option.label}
              </span>
              <span className="mt-0.5 text-base font-medium text-orange-500">
                {option.oddsMultiplier.toFixed(2)}x
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Bet simulator ── */}
      <div className="flex flex-col gap-2 rounded-lg bg-muted/10 p-2.5">
        {/* Amount input */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs text-muted-foreground">Mon pari</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              step="1"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-sm font-medium text-foreground focus:border-orange-500 focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">USDC</span>
          </div>
        </div>

        {/* Gain display */}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Gain potentiel</p>
            <p className="text-[11px] text-muted-foreground">
              +{formatCurrency(profit)} de profit
            </p>
          </div>
          <p className="text-xl font-medium text-green-500">
            {formatCurrency(potentialReturn)}
          </p>
        </div>
      </div>

      {/* ── Confirm button ── */}
      <button
        onClick={handleConfirm}
        disabled={amount <= 0 || !selectedOption}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        <TrendingUp size={15} />
        Confirmer le pari
      </button>
    </div>
  );
});

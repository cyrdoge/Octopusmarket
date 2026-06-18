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
  /** For simple mode: single image */
  singleImageSrc?: string;
  options: PredictionMarketOption[];
  onConfirmBet: (params: {
    eventId: string;
    optionId: string;
    optionLabel: string;
    amount: number;
    potentialReturn: number;
  }) => void | Promise<void>;
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
    <div className="flex items-center justify-between gap-2">
      {/* Home */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {homeTeam?.imageSrc ? (
          <img
            src={homeTeam.imageSrc}
            alt={homeTeam.name}
            className="h-10 w-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-full border border-border bg-muted" />
        )}
        <span className="text-center text-xs font-medium text-foreground line-clamp-1">
          {homeTeam?.name ?? "Home"}
        </span>
      </div>

      {/* VS badge */}
      <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground flex-shrink-0">
        VS
      </span>

      {/* Away */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {awayTeam?.imageSrc ? (
          <img
            src={awayTeam.imageSrc}
            alt={awayTeam.name}
            className="h-10 w-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-full border border-border bg-muted" />
        )}
        <span className="text-center text-xs font-medium text-foreground line-clamp-1">
          {awayTeam?.name ?? "Away"}
        </span>
      </div>
    </div>
  );
}

function SimpleHeader({
  title,
  categoryLabel,
  imageSrc,
}: {
  title: string;
  categoryLabel?: string;
  imageSrc?: string;
}) {
  return (
    <div className="flex gap-2">
      {imageSrc && (
        <img
          src={imageSrc}
          alt={title}
          className="h-12 w-12 rounded-md object-cover flex-shrink-0 border border-border"
        />
      )}
      <div className="flex-1 min-w-0">
        {categoryLabel && (
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            {categoryLabel}
          </p>
        )}
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {title}
        </p>
      </div>
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
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-orange-500">

      {/* ── Header ── */}
      {mode === "vs" ? (
        <>
          {categoryLabel && (
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {categoryLabel}
            </p>
          )}
          <VsHeader homeTeam={homeTeam} awayTeam={awayTeam} />
        </>
      ) : (
        <SimpleHeader title={title} categoryLabel={categoryLabel} imageSrc={singleImageSrc} />
      )}

      {/* ── Options ── */}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = option.id === selectedOptionId;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedOptionId(option.id)}
              className={[
                "flex flex-1 flex-col items-center rounded-lg border px-2 py-2 transition-all",
                isSelected
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-border bg-background/50 hover:border-orange-400",
              ].join(" ")}
            >
              {option.logoSrc && (
                <img
                  src={option.logoSrc}
                  alt={option.label}
                  className="h-5 w-5 rounded-full object-cover mb-1"
                />
              )}
              <span className="text-[11px] text-muted-foreground">
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
      <div className="flex flex-col gap-2 rounded-lg bg-background/40 p-2.5">
        {/* Amount input */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Mon pari</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              step="1"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-right text-xs font-medium text-foreground focus:border-orange-500 focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">USDC</span>
          </div>
        </div>

        {/* Gain display */}
        <div className="flex items-center justify-between border-t border-border/30 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Gain potentiel</p>
            <p className="text-[10px] text-muted-foreground">
              +{formatCurrency(profit)} de profit
            </p>
          </div>
          <p className="text-lg font-medium text-green-500">
            {formatCurrency(potentialReturn)}
          </p>
        </div>
      </div>

      {/* ── Confirm button ── */}
      <button
        onClick={handleConfirm}
        disabled={amount <= 0 || !selectedOption}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        <TrendingUp size={14} />
        Confirmer le pari
      </button>
    </div>
  );
});

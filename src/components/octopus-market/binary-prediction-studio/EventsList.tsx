/**
 * EventsList.tsx
 * Displays prediction events in a responsive grid.
 * Each event is rendered by EventCard.
 */

import { memo, useCallback } from "react";
import { EventCard } from "./EventCard";
import type { EventCardProps } from "./EventCard";
import type { PredictionMarketQuestion } from "../octopus-market-data";
import type { AdminCreatedPredictionMarket } from "../prediction-market-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BetConfirmParams {
  eventId: string;
  optionId: string;
  optionLabel: string;
  amount: number;
  potentialReturn: number;
}

interface EventsListProps {
  events: (PredictionMarketQuestion | AdminCreatedPredictionMarket)[];
  onConfirmBet: (params: BetConfirmParams) => void | Promise<void>;
  isLoading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps a raw event (static or admin-created) to EventCard props.
 * Detects "vs" mode when the event has exactly a home/away team structure
 * or when mode === "vs" is set on admin-created markets.
 */
function toEventCardProps(
  event: PredictionMarketQuestion | AdminCreatedPredictionMarket
): Omit<EventCardProps, "onConfirmBet"> {
  const isAdminMarket = "mode" in event;
  const mode = isAdminMarket ? (event as any).mode ?? "simple" : "simple";

  // Get visual metadata
  const visualType = (event as any).visualType ?? "simple";
  const leftImage = (event as any).leftCompetitorImageSrc;
  const rightImage = (event as any).rightCompetitorImageSrc;
  const singleImage = (event as any).singleImageSrc;

  // VS mode: extract home/away from first two options with images
  const homeTeam =
    (visualType === "vs" || mode === "vs") && event.options?.[0]
      ? { name: event.options[0].label, imageSrc: leftImage }
      : undefined;
  const awayTeam =
    (visualType === "vs" || mode === "vs") && event.options?.[1]
      ? { name: event.options[1].label, imageSrc: rightImage }
      : undefined;

  return {
    id: event.id,
    title: event.title,
    categoryLabel: (event as any).categoryId ?? (event as any).resolutionLabel,
    mode: visualType === "vs" ? "vs" : "simple",
    homeTeam,
    awayTeam,
    singleImageSrc: singleImage,
    options: event.options ?? [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EventsList = memo(function EventsList({
  events,
  onConfirmBet,
  isLoading = false,
}: EventsListProps) {

  const handleConfirmBet = useCallback(
    (params: BetConfirmParams) => {
      onConfirmBet(params);
    },
    [onConfirmBet]
  );

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border p-12">
        <p className="text-sm text-muted-foreground">
          No events available in this category.
        </p>
      </div>
    );
  }

  // ── Grid ──
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const cardProps = toEventCardProps(event);
        return (
          <EventCard
            key={event.id}
            {...cardProps}
            onConfirmBet={handleConfirmBet}
          />
        );
      })}
    </div>
  );
});

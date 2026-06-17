/**
 * EventsList.tsx
 * Displays prediction events in a grid with betting options
 */

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PredictionMarketQuestion } from "../octopus-market-data";
import type { AdminCreatedPredictionMarket } from "../prediction-market-store";

interface EventsListProps {
  events: (PredictionMarketQuestion | AdminCreatedPredictionMarket)[];
  onSelectEvent: (eventId: string) => void;
  isLoading?: boolean;
}

export const EventsList = memo(function EventsList({
  events,
  onSelectEvent,
  isLoading = false,
}: EventsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"></div>
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <p className="text-muted-foreground">No events available in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event: any) => (
        <Card
          key={event.id}
          className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelectEvent(event.id)}
        >
          <CardHeader>
            <CardTitle className="line-clamp-2 text-base">{event.title}</CardTitle>
            <CardDescription className="line-clamp-1">
              {event.resolutionLabel || "Event Resolution"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {/* Options Display */}
            {event.options && event.options.length > 0 ? (
              <div className="space-y-2">
                {event.options.map((option: any, idx: number) => (
                  <div
                    key={option.id || idx}
                    className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-white/10 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {option.oddsMultiplier?.toFixed(2) || "1.00"}x
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No options available</div>
            )}

            {/* View Details Button */}
            <button className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
              View Details
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

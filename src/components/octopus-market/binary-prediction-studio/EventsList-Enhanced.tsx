/**
 * EventsList-Enhanced.tsx
 * Modern event display inspired by Polymarket
 */

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap } from "lucide-react";

interface EnhancedEventsListProps {
  events: any[];
  onSelectEvent: (eventId: string) => void;
  isLoading?: boolean;
}

export const EventsListEnhanced = memo(function EventsListEnhanced({
  events,
  onSelectEvent,
  isLoading = false,
}: EnhancedEventsListProps) {
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
          <p className="text-muted-foreground">No events available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event: any) => {
        // Calculer les probabilités (exemple)
        const totalVolume = event.options?.reduce((sum: number, opt: any) => sum + (opt.initialVolumeUsd || 0), 0) || 0;
        const probabilities = event.options?.map((opt: any) => ({
          label: opt.label,
          probability: totalVolume > 0 ? ((opt.initialVolumeUsd || 0) / totalVolume * 100).toFixed(0) : 0,
          oddsMultiplier: opt.oddsMultiplier,
          color: opt.id === "yes" ? "bg-green-500" : opt.id === "no" ? "bg-red-500" : "bg-blue-500",
        })) || [];

        return (
          <Card
            key={event.id}
            className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800"
            onClick={() => onSelectEvent(event.id)}
          >
            {/* Image Banner */}
            <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
              <div className="text-center text-white">
                <TrendingUp size={32} className="mx-auto mb-2" />
                <p className="text-xs font-semibold opacity-80">{event.categoryId?.toUpperCase()}</p>
              </div>
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base line-clamp-2 mb-1">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-1">{event.resolutionLabel || "Resolves on outcome"}</CardDescription>
                </div>
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 whitespace-nowrap">
                  Active
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Statistics Row */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-white/50 dark:bg-white/10 p-2 text-center">
                  <p className="text-muted-foreground">Volume</p>
                  <p className="font-bold text-sm">${(totalVolume / 1000).toFixed(0)}K</p>
                </div>
                <div className="rounded-lg bg-white/50 dark:bg-white/10 p-2 text-center">
                  <p className="text-muted-foreground">Traders</p>
                  <p className="font-bold text-sm">{Math.floor(Math.random() * 1000) + 100}</p>
                </div>
                <div className="rounded-lg bg-white/50 dark:bg-white/10 p-2 text-center">
                  <p className="text-muted-foreground">Liquidity</p>
                  <p className="font-bold text-sm">${(totalVolume * 0.1).toFixed(0)}K</p>
                </div>
              </div>

              {/* Probability Bars */}
              {probabilities.length > 0 && (
                <div className="space-y-2">
                  {probabilities.map((prob, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{prob.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground">{prob.probability}%</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">{prob.oddsMultiplier.toFixed(2)}x</span>
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${prob.color} transition-all duration-300`}
                          style={{ width: `${prob.probability}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <button className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                <Zap size={16} />
                Place Bet
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

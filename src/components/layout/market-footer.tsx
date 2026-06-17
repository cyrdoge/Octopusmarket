/**
 * src/components/layout/market-footer.tsx
 * Market footer component
 * Shows CTA and contact info
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Rocket, ExternalLink } from "lucide-react";

type MarketFooterProps = {
  onListMyAI: () => void;
  onBrowseMarkets: () => void;
  contactItems?: Array<{
    label: string;
    href?: string;
    icon: any;
  }>;
};

export function MarketFooter({
  onListMyAI,
  onBrowseMarkets,
  contactItems = [],
}: MarketFooterProps) {
  return (
    <footer className="relative z-20 border-t border-orange-200 bg-white/95 py-12 shadow-[0_-18px_40px_rgba(249,115,22,0.08)] dark:border-white/10 dark:bg-zinc-900/95 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          {/* CTA Section */}
          <div className="min-w-0 overflow-hidden rounded-[2rem] border border-orange-200 bg-white/96 p-5 shadow-[0_18px_45px_rgba(249,115,22,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/92 sm:p-7 lg:p-8">
            <Badge className="border border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-500/15 dark:text-orange-300">
              Ready to become an AI reference?
            </Badge>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl lg:text-5xl">
              Launch your presence on Octopus Market now.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base lg:text-lg">
              Launch Token, Prediction Market, AI listing, official platform references, and wallet validation all work together in one flow.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Button
                onClick={onListMyAI}
                className="h-11 rounded-2xl bg-orange-500 px-8 text-white hover:bg-orange-400"
              >
                <Rocket className="mr-2 size-4" />
                List my AI
              </Button>
              <Button variant="outline" onClick={onBrowseMarkets} className="h-11 rounded-2xl px-8">
                Browse open markets
              </Button>
            </div>
          </div>

          {/* Key Info Section */}
          {contactItems.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/95 dark:border-white/10 dark:bg-zinc-800/95">
              <CardHeader>
                <CardTitle>Key information</CardTitle>
                <CardDescription>Important platform references at a glance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {contactItems.map((item, idx) => (
                  <div key={idx}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-white px-4 py-3 transition hover:border-orange-300 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20 dark:hover:bg-zinc-800"
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                          <item.icon className="size-4" />
                        </div>
                        <span className="text-sm text-zinc-700 dark:text-zinc-200">{item.label}</span>
                        <ExternalLink className="ml-auto size-4 text-zinc-400 dark:text-zinc-500" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                          <item.icon className="size-4" />
                        </div>
                        <span className="text-sm text-zinc-700 dark:text-zinc-200">{item.label}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-10 bg-orange-200 dark:bg-white/10" />

        <div className="flex flex-col gap-4 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-300">
          <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-200">
            <Globe className="size-4" />
            <span>© 2026 Octopus Market · All rights reserved</span>
          </div>
          <div className="text-zinc-600 dark:text-zinc-300">
            Designed to showcase, launch, and grow premium AI products on the market.
          </div>
        </div>
      </div>
    </footer>
  );
}

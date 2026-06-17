/**
 * src/pages/home.tsx
 * Home page - Hero section with key stats
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 py-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-8 dark:border-white/10 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black lg:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Badge className="border border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-500/15 dark:text-orange-300">
                  Welcome to Octopus Market
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
                  AI Products, Predictions & Community
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Showcase, launch, and grow premium AI products on the most dynamic marketplace for AI tools, predictions, and community engagement.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => navigate("/explore")}
                  className="h-11 rounded-2xl bg-orange-500 px-6 text-white hover:bg-orange-600"
                >
                  <TrendingUp className="mr-2 size-4" />
                  Explore AI Tools
                </Button>
                <Button
                  onClick={() => navigate("/prediction-market")}
                  variant="outline"
                  className="h-11 rounded-2xl px-6"
                >
                  View Predictions
                </Button>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              {[
                { label: "AI Tools", value: "50+" },
                { label: "Predictions", value: "200+" },
                { label: "Users Active", value: "1K+" },
                { label: "Community Bets", value: "$100K+" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-orange-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:p-6"
                >
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stat.value}</div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-orange-200 bg-white p-8 dark:border-white/10 dark:bg-zinc-900 lg:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-zinc-950 dark:text-white">Ready to launch?</h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Get your AI product on Octopus Market with our comprehensive launch platform.
            </p>
            <Button
              onClick={() => navigate("/launch-token")}
              className="mt-6 h-11 rounded-2xl bg-orange-500 px-8 text-white hover:bg-orange-600"
            >
              <Rocket className="mr-2 size-4" />
              Launch Your AI
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

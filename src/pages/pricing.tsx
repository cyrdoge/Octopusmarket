/**
 * src/pages/pricing.tsx
 * Pricing page - shows available plans
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "Free",
    description: "Get started with basic features",
    features: ["5 listings", "Community feedback", "Basic analytics"],
  },
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For growing AI projects",
    features: ["20 listings", "Premium badge", "Advanced analytics", "Priority support"],
    highlighted: true,
  },
  {
    name: "Builder",
    price: "$99",
    period: "/month",
    description: "For established platforms",
    features: ["Unlimited listings", "Gold verification", "Custom branding", "Dedicated support"],
  },
];

export function PricingPage() {
  return (
    <div className="space-y-12 py-12">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">Simple, Transparent Pricing</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Choose the perfect plan for your AI product launch and growth.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-8 transition ${
              plan.highlighted
                ? "border-orange-500 bg-orange-50 shadow-xl dark:border-orange-400 dark:bg-orange-500/10"
                : "border-orange-200 bg-white dark:border-white/10 dark:bg-zinc-900"
            }`}
          >
            {plan.highlighted && (
              <Badge className="mb-4 border-orange-500 bg-orange-100 text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/15 dark:text-orange-300">
                Most Popular
              </Badge>
            )}

            <h3 className="text-2xl font-bold text-zinc-950 dark:text-white">{plan.name}</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{plan.description}</p>

            <div className="mt-6">
              <span className="text-5xl font-bold text-zinc-950 dark:text-white">{plan.price}</span>
              {plan.period && <span className="text-zinc-600 dark:text-zinc-400">{plan.period}</span>}
            </div>

            <Button className="mt-6 w-full rounded-2xl" variant={plan.highlighted ? "default" : "outline"}>
              Get Started
            </Button>

            <div className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className="size-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

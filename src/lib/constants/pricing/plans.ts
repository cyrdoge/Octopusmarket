/**
 * lib/constants/pricing/plans.ts
 * Pricing plans definition
 */

export const LISTING_PLANS = {
  free: {
    id: "free" as const,
    label: "Free",
    description: "Free listing with admin review",
    amountUsd: 0,
    amountUsdc: 0,
    billingLabel: "$0 / free",
    billingPeriod: null,
    features: [
      "Immediate listing visibility",
      "Admin review required",
      "No badge by default",
    ],
  },
  starter: {
    id: "starter" as const,
    label: "Starter",
    description: "Monthly subscription",
    amountUsd: 10,
    amountUsdc: 10,
    billingLabel: "$10 / month",
    billingPeriod: "monthly",
    features: [
      "Priority listing visibility",
      "Faster admin review",
      "Eligible for blue badge",
    ],
  },
  builder: {
    id: "builder" as const,
    label: "Builder",
    description: "Annual subscription with discount",
    amountUsd: 100,
    amountUsdc: 100,
    billingLabel: "$100 / year · 22% off",
    billingPeriod: "annual",
    features: [
      "Premium listing visibility",
      "Fast-track review",
      "Eligible for gold badge",
      "22% discount compared to monthly",
    ],
  },
} as const;

export type ListingPlanId = keyof typeof LISTING_PLANS;

export const LAUNCH_PLANS = {
  free: {
    id: "free" as const,
    label: "Free",
    description: "Free launch with admin review",
    amountUsd: 0,
    amountUsdc: 0,
    billingLabel: "$0 / free",
  },
  starter: {
    id: "starter" as const,
    label: "Starter",
    description: "Premium launch",
    amountUsd: 25,
    amountUsdc: 25,
    billingLabel: "$25 / launch",
  },
  pro: {
    id: "pro" as const,
    label: "Pro",
    description: "Professional launch with promotion",
    amountUsd: 100,
    amountUsdc: 100,
    billingLabel: "$100 / launch",
  },
} as const;

export type LaunchPlanId = keyof typeof LAUNCH_PLANS;

/**
 * Get plan by ID
 */
export function getListingPlan(id: ListingPlanId) {
  return LISTING_PLANS[id];
}

/**
 * Get all listing plans
 */
export function getAllListingPlans() {
  return Object.values(LISTING_PLANS);
}

/**
 * Get plan by ID
 */
export function getLaunchPlan(id: LaunchPlanId) {
  return LAUNCH_PLANS[id];
}

/**
 * Get all launch plans
 */
export function getAllLaunchPlans() {
  return Object.values(LAUNCH_PLANS);
}

/**
 * lib/constants/pricing.ts
 * Pricing plans and payment configuration
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
 * Payment configuration
 */
export const PAYMENT_CONFIG = {
  // Default currency for payments
  defaultCurrency: "USDC" as const,

  // Token symbols
  tokenSymbols: {
    USDC: "USDC",
    SOL: "SOL",
  },

  // Fee configuration
  fees: {
    listingFeeRate: 0, // No listing fee
    claimFeeRate: 5, // 5% claim fee for prediction markets
    reserveFeeRate: 0, // No reserve fee
  },

  // Blockchain configuration
  solana: {
    network: import.meta.env.VITE_SOLANA_NETWORK || "mainnet-beta",
    rpcEndpoint: import.meta.env.VITE_SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
    commitment: "confirmed" as const,
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },

  // Timeout configuration
  timeout: {
    transactionSignatureMs: 60000, // 60 seconds
    transactionConfirmationMs: 120000, // 2 minutes
    totalPaymentFlowMs: 300000, // 5 minutes
  },
} as const;

/**
 * Plan descriptions for UI
 */
export const PLAN_DESCRIPTIONS = {
  listing: {
    free: "Your listing appears immediately but requires admin review. No badge included.",
    starter: "Faster review process with higher visibility. Eligible for premium badges.",
    builder: "Priority treatment with guaranteed fast review and premium badge eligibility.",
  },
  launch: {
    free: "Standard token launch with basic visibility.",
    starter: "Enhanced launch with promotional support.",
    pro: "Premium launch with full promotional campaign.",
  },
} as const;

/**
 * Status messages for payment flow
 */
export const PAYMENT_MESSAGES = {
  initial: "Submit your details first, then verify the USDC payment.",
  submitting: "Processing your submission...",
  building: "Creating payment transaction...",
  signing: "Opening Phantom wallet for you to sign the transaction.",
  confirming: "Waiting for blockchain confirmation...",
  validating: "Validating USDC transfer...",
  success: "Your listing is now visible and waiting for admin review.",
  error: {
    walletRequired: "Connect a Phantom wallet to continue with paid plan.",
    walletNotSupported: "This wallet cannot complete the payment yet.",
    "reference-not-found": "Transaction not confirmed. Please try again.",
    "validated-transfer-required": "Payment validation failed. Please try again.",
    "insufficient-balance": "Insufficient USDC balance. Please top up your wallet.",
    networkError: "Network error. Please check your connection.",
  },
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  listing: {
    icon: {
      required: true,
      maxSizeKB: 500,
      formats: ["image/jpeg", "image/png", "image/webp"],
    },
    websiteUrl: {
      required: true,
      pattern: /^https?:\/\/.+/i,
    },
    description: {
      required: true,
      minWords: 1,
      maxWords: 500,
    },
    socialUrl: {
      required: true,
      pattern: /^https?:\/\/.+/i,
    },
    guide: {
      required: true,
      maxSizeKB: 100,
      formats: ["application/pdf"],
    },
  },
} as const;

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

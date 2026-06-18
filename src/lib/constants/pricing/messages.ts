/**
 * lib/constants/pricing/messages.ts
 * User-facing messages for pricing and payments
 */

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
 * Validation rule descriptions
 */
export const VALIDATION_MESSAGES = {
  icon: {
    required: "Icon is required",
    invalidSize: "Icon must be less than 500KB",
    invalidFormat: "Icon must be an image (JPG, PNG, WebP)",
  },
  websiteUrl: {
    required: "Website URL is required",
    invalid: "Invalid website URL format",
  },
  description: {
    required: "Description is required",
    tooShort: "Description must be at least 1 word",
    tooLong: "Description must be no more than 500 words",
  },
  socialUrl: {
    required: "Social media URL is required",
    invalid: "Invalid social media URL format",
  },
  guide: {
    required: "PDF guide is required",
    invalidSize: "PDF must be less than 100KB",
    invalidFormat: "File must be a PDF",
  },
} as const;

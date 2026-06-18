/**
 * lib/constants/pricing/validation.ts
 * Validation rules for pricing and listings
 */

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

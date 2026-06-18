/**
 * lib/validators/url/types.ts
 * URL validation types
 */

export type UrlValidationResult = {
  valid: boolean;
  error?: string;
};

export type SocialMediaPlatform = "twitter" | "discord" | "telegram" | "github" | "linkedin";

export const SOCIAL_MEDIA_PATTERNS: Record<SocialMediaPlatform, RegExp> = {
  twitter: /twitter\.com|x\.com/i,
  discord: /discord\.com|discord\.gg/i,
  telegram: /t\.me|telegram\.org/i,
  github: /github\.com/i,
  linkedin: /linkedin\.com/i,
};

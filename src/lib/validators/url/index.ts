/**
 * lib/validators/url/index.ts
 * URL validation and normalization utilities
 */

import type { UrlValidationResult, SocialMediaPlatform } from "./types";
import { SOCIAL_MEDIA_PATTERNS } from "./types";

/**
 * Normalize URL by ensuring protocol
 * Handles: "example.com" → "https://example.com"
 */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Validate URL format using URL API
 */
export function validateUrl(value: string): UrlValidationResult {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return { valid: false, error: "URL is required" };
  }

  try {
    new URL(normalized);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate if URL has expected protocol
 */
export function validateUrlProtocol(
  value: string,
  allowedProtocols: string[] = ["http", "https"]
): UrlValidationResult {
  const normalized = normalizeUrl(value);

  try {
    const url = new URL(normalized);
    const protocol = url.protocol.replace(":", "");

    if (!allowedProtocols.includes(protocol)) {
      return {
        valid: false,
        error: `Only ${allowedProtocols.join(", ")} protocols allowed`,
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}

/**
 * Validate social media URLs (Twitter, Discord, Telegram, etc)
 */
export function validateSocialUrl(value: string): UrlValidationResult {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return { valid: false, error: "Social URL is required" };
  }

  const isValidSocial = Object.values(SOCIAL_MEDIA_PATTERNS).some((pattern) =>
    pattern.test(normalized)
  );

  if (!isValidSocial) {
    const platforms = Object.keys(SOCIAL_MEDIA_PATTERNS).join(", ");
    return {
      valid: false,
      error: `Please use a valid social media URL (${platforms})`,
    };
  }

  try {
    new URL(normalized);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid social URL format" };
  }
}

/**
 * Validate email format
 */
export function validateEmail(value: string): UrlValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

/**
 * Validate Twitter/X handle
 */
export function validateTwitterHandle(value: string): UrlValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: "Twitter handle is required" };
  }

  // Remove @ if present
  const handle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;

  // Twitter handles: 1-15 chars, alphanumeric + underscore
  if (!/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
    return {
      valid: false,
      error: "Twitter handle must be 1-15 characters (alphanumeric + underscore)",
    };
  }

  return { valid: true };
}

/**
 * Validate username
 */
export function validateUsername(value: string): UrlValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: "Username is required" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "Username must be at least 2 characters" };
  }

  if (trimmed.length > 32) {
    return { valid: false, error: "Username must be max 32 characters" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Username can only contain alphanumeric characters, underscores, and hyphens",
    };
  }

  return { valid: true };
}

/**
 * Normalize username (lowercase, trim)
 */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Check if URL matches a specific social platform
 */
export function isSocialMediaUrl(value: string, platform: SocialMediaPlatform): boolean {
  const normalized = normalizeUrl(value);
  return SOCIAL_MEDIA_PATTERNS[platform].test(normalized);
}

/**
 * Detect which platform a social URL belongs to
 */
export function detectSocialPlatform(value: string): SocialMediaPlatform | null {
  const normalized = normalizeUrl(value);

  for (const [platform, pattern] of Object.entries(SOCIAL_MEDIA_PATTERNS)) {
    if (pattern.test(normalized)) {
      return platform as SocialMediaPlatform;
    }
  }

  return null;
}

// Re-export types
export type { UrlValidationResult, SocialMediaPlatform } from "./types";
export { SOCIAL_MEDIA_PATTERNS } from "./types";

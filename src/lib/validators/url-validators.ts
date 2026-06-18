/**
 * lib/validators/url-validators.ts
 * URL validation and normalization utilities
 */

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
export function validateUrl(value: string): { valid: boolean; error?: string } {
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
): { valid: boolean; error?: string } {
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
export function validateSocialUrl(value: string): { valid: boolean; error?: string } {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return { valid: false, error: "Social URL is required" };
  }

  const socialPatterns = {
    twitter: /twitter\.com|x\.com/i,
    discord: /discord\.com|discord\.gg/i,
    telegram: /t\.me|telegram\.org/i,
    github: /github\.com/i,
    linkedin: /linkedin\.com/i,
  };

  const isValidSocial = Object.values(socialPatterns).some((pattern) =>
    pattern.test(normalized)
  );

  if (!isValidSocial) {
    return {
      valid: false,
      error: "Please use a valid social media URL (Twitter, Discord, Telegram, GitHub, LinkedIn)",
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
export function validateEmail(value: string): { valid: boolean; error?: string } {
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
export function validateTwitterHandle(value: string): { valid: boolean; error?: string } {
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
export function validateUsername(value: string): { valid: boolean; error?: string } {
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

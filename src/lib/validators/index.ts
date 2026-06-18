/**
 * lib/validators/index.ts
 * Barrel export for all validators
 */

// URL validators
export {
  normalizeUrl,
  validateUrl,
  validateUrlProtocol,
  validateSocialUrl,
  validateEmail,
  validateTwitterHandle,
  validateUsername,
  normalizeUsername,
  isSocialMediaUrl,
  detectSocialPlatform,
  type UrlValidationResult,
  type SocialMediaPlatform,
  SOCIAL_MEDIA_PATTERNS,
} from "./url";

// File validators
export {
  validateFileSize,
  validateFileMimeType,
  validateFileExtension,
  validateImage,
  validatePDF,
  fileToBase64,
  imageToBase64,
  pdfToBase64,
  calculateFileHash,
  getFileInfo,
  type FileValidationResult,
  type FileConversionResult,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
} from "./file";

/**
 * lib/validators/file/types.ts
 * File validation types and constants
 */

export type FileValidationResult = {
  valid: boolean;
  error?: string;
};

export type FileConversionResult<T = string> = {
  data: T;
  error?: string;
};

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 500 * 1024, // 500 KB
  PDF: 100 * 1024, // 100 KB
  DOCUMENT: 2 * 1024 * 1024, // 2 MB
  VIDEO: 50 * 1024 * 1024, // 50 MB
} as const;

/**
 * MIME types for validation
 */
export const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  PDF: ["application/pdf"],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

/**
 * File extension patterns
 */
export const ALLOWED_EXTENSIONS = {
  IMAGE: ["jpg", "jpeg", "png", "webp", "gif"],
  PDF: ["pdf"],
  DOCUMENT: ["pdf", "doc", "docx"],
} as const;

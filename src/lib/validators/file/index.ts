/**
 * lib/validators/file/index.ts
 * File validation and conversion utilities
 */

import type {
  FileValidationResult,
  FileConversionResult,
} from "./types";
import {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
} from "./types";

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number = FILE_SIZE_LIMITS.IMAGE
): FileValidationResult {
  if (!file) {
    return { valid: false, error: "File is required" };
  }

  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `File size must be less than ${maxMB}MB (your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validate file MIME type
 */
export function validateFileMimeType(
  file: File,
  allowedMimes: readonly string[]
): FileValidationResult {
  if (!file) {
    return { valid: false, error: "File is required" };
  }

  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedMimes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  file: File,
  allowedExtensions: readonly string[]
): FileValidationResult {
  if (!file) {
    return { valid: false, error: "File is required" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed: ${allowedExtensions.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validate image file (MIME + size + extension)
 */
export function validateImage(file: File): FileValidationResult {
  // Check MIME type
  const mimeCheck = validateFileMimeType(file, ALLOWED_MIME_TYPES.IMAGE);
  if (!mimeCheck.valid) {
    return mimeCheck;
  }

  // Check file size
  const sizeCheck = validateFileSize(file, FILE_SIZE_LIMITS.IMAGE);
  if (!sizeCheck.valid) {
    return sizeCheck;
  }

  // Check file extension
  const extCheck = validateFileExtension(file, ALLOWED_EXTENSIONS.IMAGE);
  if (!extCheck.valid) {
    return extCheck;
  }

  return { valid: true };
}

/**
 * Validate PDF file (MIME + size + extension)
 */
export function validatePDF(file: File): FileValidationResult {
  // Check MIME type
  const mimeCheck = validateFileMimeType(file, ALLOWED_MIME_TYPES.PDF);
  if (!mimeCheck.valid) {
    return mimeCheck;
  }

  // Check file size
  const sizeCheck = validateFileSize(file, FILE_SIZE_LIMITS.PDF);
  if (!sizeCheck.valid) {
    return sizeCheck;
  }

  // Check file extension
  const extCheck = validateFileExtension(file, ALLOWED_EXTENSIONS.PDF);
  if (!extCheck.valid) {
    return extCheck;
  }

  return { valid: true };
}

/**
 * Convert file to base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate and convert image to base64
 */
export async function imageToBase64(
  file: File
): Promise<FileConversionResult> {
  const validation = validateImage(file);

  if (!validation.valid) {
    return { data: "", error: validation.error };
  }

  try {
    const base64 = await fileToBase64(file);
    return { data: base64 };
  } catch (error) {
    return {
      data: "",
      error: error instanceof Error ? error.message : "Failed to convert image",
    };
  }
}

/**
 * Validate and convert PDF to base64
 */
export async function pdfToBase64(
  file: File
): Promise<FileConversionResult> {
  const validation = validatePDF(file);

  if (!validation.valid) {
    return { data: "", error: validation.error };
  }

  try {
    const base64 = await fileToBase64(file);
    return { data: base64 };
  } catch (error) {
    return {
      data: "",
      error: error instanceof Error ? error.message : "Failed to convert PDF",
    };
  }
}

/**
 * Calculate file hash (simple SHA-256)
 * Useful for integrity checking
 */
export async function calculateFileHash(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to calculate file hash"
    );
  }
}

/**
 * Get file info
 */
export function getFileInfo(file: File) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeKB: file.size / 1024,
    sizeMB: file.size / 1024 / 1024,
  };
}

// Re-export types and constants
export type { FileValidationResult, FileConversionResult } from "./types";
export { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from "./types";

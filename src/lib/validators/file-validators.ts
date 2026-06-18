/**
 * lib/validators/file-validators.ts
 * File validation utilities for uploads
 */

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
  DOCUMENT: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
} as const;

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number = FILE_SIZE_LIMITS.IMAGE
): { valid: boolean; error?: string } {
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
): { valid: boolean; error?: string } {
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
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
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
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
    return { valid: false, error: "Invalid image format" };
  }

  return { valid: true };
}

/**
 * Validate PDF file
 */
export function validatePDF(file: File): { valid: boolean; error?: string } {
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
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: "File must be a PDF" };
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
export async function imageToBase64(file: File): Promise<{ data: string; error?: string }> {
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
export async function pdfToBase64(file: File): Promise<{ data: string; error?: string }> {
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
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get file info
 */
export function getFileInfo(file: File): {
  name: string;
  type: string;
  size: number;
  sizeKB: number;
  sizeMB: number;
} {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeKB: file.size / 1024,
    sizeMB: file.size / 1024 / 1024,
  };
}

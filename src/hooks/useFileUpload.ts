/**
 * hooks/useFileUpload.ts
 * File upload handling with validation and conversion
 */

import { useState } from "react";
import {
  validateImage,
  validatePDF,
  imageToBase64,
  pdfToBase64,
  getFileInfo,
} from "@/lib/validators";

export interface FileUploadState {
  base64: string;
  fileName: string;
  error: string | null;
  isLoading: boolean;
  fileInfo: ReturnType<typeof getFileInfo> | null;
}

export interface UseFileUploadReturn {
  icon: FileUploadState;
  guide: FileUploadState;
  handleIconChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleGuideChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  clearIcon: () => void;
  clearGuide: () => void;
}

/**
 * Hook to manage file uploads with validation
 */
export function useFileUpload(): UseFileUploadReturn {
  const [icon, setIcon] = useState<FileUploadState>({
    base64: "",
    fileName: "",
    error: null,
    isLoading: false,
    fileInfo: null,
  });

  const [guide, setGuide] = useState<FileUploadState>({
    base64: "",
    fileName: "",
    error: null,
    isLoading: false,
    fileInfo: null,
  });

  const handleIconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIcon((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const validation = await imageToBase64(file);

      if (validation.error) {
        setIcon((prev) => ({
          ...prev,
          isLoading: false,
          error: validation.error,
          base64: "",
          fileName: "",
          fileInfo: null,
        }));
      } else {
        setIcon({
          base64: validation.data,
          fileName: file.name,
          error: null,
          isLoading: false,
          fileInfo: getFileInfo(file),
        });
      }
    } catch (error) {
      setIcon((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to process image",
        base64: "",
        fileName: "",
        fileInfo: null,
      }));
    }
  };

  const handleGuideChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setGuide((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const validation = await pdfToBase64(file);

      if (validation.error) {
        setGuide((prev) => ({
          ...prev,
          isLoading: false,
          error: validation.error,
          base64: "",
          fileName: "",
          fileInfo: null,
        }));
      } else {
        setGuide({
          base64: validation.data,
          fileName: file.name,
          error: null,
          isLoading: false,
          fileInfo: getFileInfo(file),
        });
      }
    } catch (error) {
      setGuide((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to process PDF",
        base64: "",
        fileName: "",
        fileInfo: null,
      }));
    }
  };

  const clearIcon = () => {
    setIcon({
      base64: "",
      fileName: "",
      error: null,
      isLoading: false,
      fileInfo: null,
    });
  };

  const clearGuide = () => {
    setGuide({
      base64: "",
      fileName: "",
      error: null,
      isLoading: false,
      fileInfo: null,
    });
  };

  return {
    icon,
    guide,
    handleIconChange,
    handleGuideChange,
    clearIcon,
    clearGuide,
  };
}

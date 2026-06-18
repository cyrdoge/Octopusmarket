/**
 * hooks/useTokenFileUpload.ts
 * Manage token logo and whitepaper file uploads
 */

import { useState, useCallback } from "react";

export interface TokenFileUploadState {
  logoPreview: string;
  logoName: string;
  logoError: string | null;
  whitepaperName: string;
  whitepaperError: string | null;
}

export interface UseTokenFileUploadReturn {
  files: TokenFileUploadState;
  handleLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleWhitepaperChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearLogo: () => void;
  clearWhitepaper: () => void;
  clearAll: () => void;
}

const MAX_LOGO_SIZE_MB = 5;
const MAX_WHITEPAPER_SIZE_MB = 25;

export function useTokenFileUpload(): UseTokenFileUploadReturn {
  const [files, setFiles] = useState<TokenFileUploadState>({
    logoPreview: "",
    logoName: "",
    logoError: null,
    whitepaperName: "",
    whitepaperError: null,
  });

  const handleLogoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const maxBytes = MAX_LOGO_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setFiles((prev) => ({
        ...prev,
        logoError: `Logo must be smaller than ${MAX_LOGO_SIZE_MB}MB`,
        logoName: "",
        logoPreview: "",
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFiles((prev) => ({
        ...prev,
        logoError: "Logo must be an image file",
        logoName: "",
        logoPreview: "",
      }));
      return;
    }

    setFiles((prev) => ({
      ...prev,
      logoName: file.name,
      logoError: null,
    }));

    const reader = new FileReader();
    reader.onload = () => {
      const preview = typeof reader.result === "string" ? reader.result : "";
      setFiles((prev) => ({
        ...prev,
        logoPreview: preview,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleWhitepaperChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const maxBytes = MAX_WHITEPAPER_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setFiles((prev) => ({
        ...prev,
        whitepaperError: `Whitepaper must be smaller than ${MAX_WHITEPAPER_SIZE_MB}MB`,
        whitepaperName: "",
      }));
      return;
    }

    if (file.type !== "application/pdf") {
      setFiles((prev) => ({
        ...prev,
        whitepaperError: "Whitepaper must be a PDF file",
        whitepaperName: "",
      }));
      return;
    }

    setFiles((prev) => ({
      ...prev,
      whitepaperName: file.name,
      whitepaperError: null,
    }));
  }, []);

  const clearLogo = useCallback(() => {
    setFiles((prev) => ({
      ...prev,
      logoPreview: "",
      logoName: "",
      logoError: null,
    }));
  }, []);

  const clearWhitepaper = useCallback(() => {
    setFiles((prev) => ({
      ...prev,
      whitepaperName: "",
      whitepaperError: null,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFiles({
      logoPreview: "",
      logoName: "",
      logoError: null,
      whitepaperName: "",
      whitepaperError: null,
    });
  }, []);

  return {
    files,
    handleLogoChange,
    handleWhitepaperChange,
    clearLogo,
    clearWhitepaper,
    clearAll,
  };
}

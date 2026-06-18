/**
 * hooks/useLaunchTokenForm.ts
 * Token launch form state and validation
 */

import { useState, useCallback, useMemo } from "react";
import { normalizeUrl, validateUrl } from "@/lib/validators";

export type LaunchOption = "free" | "standard";

export interface LaunchTokenFormState {
  launchOption: LaunchOption;
  holderDiscountEnabled: boolean;
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  mintAddress: string;
  websiteUrl: string;
  projectXUrl: string;
  projectTelegramUrl: string;
  projectDiscordUrl: string;
  devWallets: string[];
  lockWallet: string;
  initialBuyEnabled: boolean;
  initialBuyPercent: number;
  validationErrors: Record<string, string | null>;
}

export interface UseLaunchTokenFormReturn {
  form: LaunchTokenFormState;
  handleLaunchOptionChange: (option: LaunchOption) => void;
  handleHolderDiscountChange: (enabled: boolean) => void;
  handleTokenNameChange: (name: string) => void;
  handleTokenSymbolChange: (symbol: string) => void;
  handleTokenDescriptionChange: (description: string) => void;
  handleMintAddressChange: (address: string) => void;
  handleWebsiteUrlChange: (url: string) => void;
  handleProjectXUrlChange: (url: string) => void;
  handleProjectTelegramUrlChange: (url: string) => void;
  handleProjectDiscordUrlChange: (url: string) => void;
  handleDevWalletChange: (index: number, wallet: string) => void;
  handleAddDevWallet: () => void;
  handleRemoveDevWallet: (index: number) => void;
  handleLockWalletChange: (wallet: string) => void;
  handleInitialBuyEnabledChange: (enabled: boolean) => void;
  handleInitialBuyPercentChange: (percent: number) => void;
  clearForm: () => void;
  validation: {
    isValid: boolean;
    errors: Record<string, string>;
  };
}

const clampInitialBuyPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
};

/**
 * Hook to manage token launch form state and validation
 */
export function useLaunchTokenForm(): UseLaunchTokenFormReturn {
  const [form, setForm] = useState<LaunchTokenFormState>({
    launchOption: "free",
    holderDiscountEnabled: false,
    tokenName: "",
    tokenSymbol: "",
    tokenDescription: "",
    mintAddress: "",
    websiteUrl: "",
    projectXUrl: "",
    projectTelegramUrl: "",
    projectDiscordUrl: "",
    devWallets: [""],
    lockWallet: "",
    initialBuyEnabled: true,
    initialBuyPercent: 1,
    validationErrors: {},
  });

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};

    // Validate token name
    if (!form.tokenName.trim()) {
      errors.tokenName = "Token name is required";
    } else if (form.tokenName.length > 32) {
      errors.tokenName = "Token name must be max 32 characters";
    }

    // Validate token symbol
    if (!form.tokenSymbol.trim()) {
      errors.tokenSymbol = "Token symbol is required";
    } else if (form.tokenSymbol.length > 10) {
      errors.tokenSymbol = "Token symbol must be max 10 characters";
    } else if (!/^[A-Z0-9]+$/.test(form.tokenSymbol)) {
      errors.tokenSymbol = "Token symbol must be uppercase alphanumeric";
    }

    // Validate description
    if (!form.tokenDescription.trim()) {
      errors.tokenDescription = "Description is required";
    }

    // Validate mint address
    if (!form.mintAddress.trim()) {
      errors.mintAddress = "Mint address is required";
    }

    // Validate website URL
    if (!form.websiteUrl.trim()) {
      errors.websiteUrl = "Website URL is required";
    } else {
      const urlValidation = validateUrl(form.websiteUrl);
      if (!urlValidation.valid) {
        errors.websiteUrl = urlValidation.error || "Invalid URL";
      }
    }

    // Validate project URLs (optional)
    if (form.projectXUrl.trim()) {
      const urlValidation = validateUrl(form.projectXUrl);
      if (!urlValidation.valid) {
        errors.projectXUrl = urlValidation.error || "Invalid URL";
      }
    }

    if (form.projectTelegramUrl.trim()) {
      const urlValidation = validateUrl(form.projectTelegramUrl);
      if (!urlValidation.valid) {
        errors.projectTelegramUrl = urlValidation.error || "Invalid URL";
      }
    }

    if (form.projectDiscordUrl.trim()) {
      const urlValidation = validateUrl(form.projectDiscordUrl);
      if (!urlValidation.valid) {
        errors.projectDiscordUrl = urlValidation.error || "Invalid URL";
      }
    }

    // Validate initial buy percent if enabled
    if (form.initialBuyEnabled) {
      if (form.initialBuyPercent < 1 || form.initialBuyPercent > 5) {
        errors.initialBuyPercent = "Initial buy percent must be between 1% and 5%";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [form]);

  const handleLaunchOptionChange = useCallback((option: LaunchOption) => {
    setForm((prev) => ({
      ...prev,
      launchOption: option,
      holderDiscountEnabled: option === "free" ? false : prev.holderDiscountEnabled,
    }));
  }, []);

  const handleHolderDiscountChange = useCallback((enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      holderDiscountEnabled: prev.launchOption === "free" ? false : enabled,
    }));
  }, []);

  const handleTokenNameChange = useCallback((name: string) => {
    setForm((prev) => ({
      ...prev,
      tokenName: name,
    }));
  }, []);

  const handleTokenSymbolChange = useCallback((symbol: string) => {
    setForm((prev) => ({
      ...prev,
      tokenSymbol: symbol.toUpperCase(),
    }));
  }, []);

  const handleTokenDescriptionChange = useCallback((description: string) => {
    setForm((prev) => ({
      ...prev,
      tokenDescription: description,
    }));
  }, []);

  const handleMintAddressChange = useCallback((address: string) => {
    setForm((prev) => ({
      ...prev,
      mintAddress: address,
    }));
  }, []);

  const handleWebsiteUrlChange = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      websiteUrl: url,
    }));
  }, []);

  const handleProjectXUrlChange = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      projectXUrl: url,
    }));
  }, []);

  const handleProjectTelegramUrlChange = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      projectTelegramUrl: url,
    }));
  }, []);

  const handleProjectDiscordUrlChange = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      projectDiscordUrl: url,
    }));
  }, []);

  const handleDevWalletChange = useCallback((index: number, wallet: string) => {
    setForm((prev) => ({
      ...prev,
      devWallets: prev.devWallets.map((w, i) => (i === index ? wallet : w)),
    }));
  }, []);

  const handleAddDevWallet = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      devWallets: [...prev.devWallets, ""],
    }));
  }, []);

  const handleRemoveDevWallet = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      devWallets: prev.devWallets.filter((_, i) => i !== index),
    }));
  }, []);

  const handleLockWalletChange = useCallback((wallet: string) => {
    setForm((prev) => ({
      ...prev,
      lockWallet: wallet,
    }));
  }, []);

  const handleInitialBuyEnabledChange = useCallback((enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      initialBuyEnabled: enabled,
    }));
  }, []);

  const handleInitialBuyPercentChange = useCallback((percent: number) => {
    setForm((prev) => ({
      ...prev,
      initialBuyPercent: clampInitialBuyPercent(percent),
    }));
  }, []);

  const clearForm = useCallback(() => {
    setForm({
      launchOption: "free",
      holderDiscountEnabled: false,
      tokenName: "",
      tokenSymbol: "",
      tokenDescription: "",
      mintAddress: "",
      websiteUrl: "",
      projectXUrl: "",
      projectTelegramUrl: "",
      projectDiscordUrl: "",
      devWallets: [""],
      lockWallet: "",
      initialBuyEnabled: true,
      initialBuyPercent: 1,
      validationErrors: {},
    });
  }, []);

  return {
    form,
    handleLaunchOptionChange,
    handleHolderDiscountChange,
    handleTokenNameChange,
    handleTokenSymbolChange,
    handleTokenDescriptionChange,
    handleMintAddressChange,
    handleWebsiteUrlChange,
    handleProjectXUrlChange,
    handleProjectTelegramUrlChange,
    handleProjectDiscordUrlChange,
    handleDevWalletChange,
    handleAddDevWallet,
    handleRemoveDevWallet,
    handleLockWalletChange,
    handleInitialBuyEnabledChange,
    handleInitialBuyPercentChange,
    clearForm,
    validation,
  };
}

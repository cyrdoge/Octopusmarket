/**
 * hooks/useAIListingForm.ts
 * Complete AI listing form state and logic
 */

import { useState, useCallback, useMemo } from "react";
import { normalizeUrl, validateUrl, validateSocialUrl } from "@/lib/validators";
import { LISTING_PLANS, type ListingPlanId } from "@/lib/constants";
import { appendAIListingSubmission, getDefaultListingSubmissionProfile } from "@/components/octopus-market/ai-listing-store";
import type { RegistryWalletRecord } from "@/components/octopus-market/octopus-central-registry";

export interface AIListingFormState {
  planId: ListingPlanId;
  autoRenewEnabled: boolean;
  websiteUrl: string;
  description: string;
  socialUrl: string;
  validationErrors: Record<string, string | null>;
}

export interface AIListingFormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface UseAIListingFormReturn {
  form: AIListingFormState;
  selectedPlan: typeof LISTING_PLANS[ListingPlanId];
  currentAmount: number;
  detailWordCount: number;
  validation: AIListingFormValidation;
  canAdvanceToPayment: boolean;
  handlePlanChange: (planId: ListingPlanId) => void;
  handleAutoRenewChange: (enabled: boolean) => void;
  handleWebsiteUrlChange: (url: string) => void;
  handleDescriptionChange: (description: string) => void;
  handleSocialUrlChange: (url: string) => void;
  clearForm: () => void;
  submitListing: (params: {
    iconSrc: string;
    iconName: string;
    guideFileName: string;
    guideFileUrl: string;
    walletAddress: string;
    walletRecord: RegistryWalletRecord | null;
    paymentReference?: string;
    paymentRequestId?: string;
  }) => Promise<void>;
}

/**
 * Hook to manage AI listing form state and validation
 */
export function useAIListingForm(): UseAIListingFormReturn {
  const [form, setForm] = useState<AIListingFormState>({
    planId: "free",
    autoRenewEnabled: false,
    websiteUrl: "",
    description: "",
    socialUrl: "",
    validationErrors: {},
  });

  const selectedPlan = useMemo(() => LISTING_PLANS[form.planId], [form.planId]);
  const currentAmount = useMemo(() => selectedPlan.amountUsd, [selectedPlan.amountUsd]);

  const detailWordCount = useMemo(
    () => form.description.trim().split(/\s+/).filter(Boolean).length,
    [form.description]
  );

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};

    // Validate website URL
    const websiteValidation = validateUrl(form.websiteUrl);
    if (!websiteValidation.valid) {
      errors.websiteUrl = websiteValidation.error || "Invalid website URL";
    }

    // Validate description
    if (!form.description.trim()) {
      errors.description = "Description is required";
    } else if (detailWordCount > 500) {
      errors.description = "Description must be no more than 500 words";
    }

    // Validate social URL
    const socialValidation = validateSocialUrl(form.socialUrl);
    if (!socialValidation.valid) {
      errors.socialUrl = socialValidation.error || "Invalid social URL";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [form.websiteUrl, form.description, form.socialUrl, detailWordCount]);

  const canAdvanceToPayment = useMemo(() => {
    return validation.isValid;
  }, [validation.isValid]);

  const handlePlanChange = useCallback((planId: ListingPlanId) => {
    setForm((prev) => ({
      ...prev,
      planId,
      autoRenewEnabled: planId === "free" ? false : prev.autoRenewEnabled,
    }));
  }, []);

  const handleAutoRenewChange = useCallback((enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      autoRenewEnabled: form.planId !== "free" ? enabled : false,
    }));
  }, [form.planId]);

  const handleWebsiteUrlChange = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      websiteUrl: url,
    }));
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setForm((prev) => ({
      ...prev,
      description,
    }));
  }, []);

  const handleSocialUrlChange = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      socialUrl: url,
    }));
  }, []);

  const clearForm = useCallback(() => {
    setForm({
      planId: "free",
      autoRenewEnabled: false,
      websiteUrl: "",
      description: "",
      socialUrl: "",
      validationErrors: {},
    });
  }, []);

  const submitListing = useCallback(
    async (params: {
      iconSrc: string;
      iconName: string;
      guideFileName: string;
      guideFileUrl: string;
      walletAddress: string;
      walletRecord: RegistryWalletRecord | null;
      paymentReference?: string;
      paymentRequestId?: string;
    }) => {
      const profileDefaults = getDefaultListingSubmissionProfile(params.walletRecord);

      await appendAIListingSubmission({
        id: `listing-${Date.now()}`,
        walletAddress: params.walletAddress || "anonymous",
        displayName: params.walletRecord?.displayName || profileDefaults.displayName,
        twitterHandle: params.walletRecord?.twitterHandle || profileDefaults.twitterHandle,
        iconSrc: params.iconSrc,
        iconName: params.iconName,
        websiteUrl: normalizeUrl(form.websiteUrl),
        description: form.description.trim(),
        socialUrl: normalizeUrl(form.socialUrl),
        guideFileName: params.guideFileName,
        guideFileUrl: params.guideFileUrl,
        planId: form.planId,
        billingLabel: selectedPlan.billingLabel,
        amountUsd: currentAmount,
        autoRenewEnabled: form.autoRenewEnabled,
        submittedAt: Date.now(),
        updatedAt: Date.now(),
        status: "pending",
        badge: "none",
        visibleInExplore: true,
        visitorCount: 0,
        uniqueVisitorKeys: [],
        paymentReference: params.paymentReference,
        paymentRequestId: params.paymentRequestId,
      });
    },
    [form, selectedPlan, currentAmount]
  );

  return {
    form,
    selectedPlan,
    currentAmount,
    detailWordCount,
    validation,
    canAdvanceToPayment,
    handlePlanChange,
    handleAutoRenewChange,
    handleWebsiteUrlChange,
    handleDescriptionChange,
    handleSocialUrlChange,
    clearForm,
    submitListing,
  };
}

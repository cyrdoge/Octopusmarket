/**
 * hooks/useListingPlanSelector.ts
 * Manage listing plan selection and pricing calculations
 */

import { useState, useMemo, useCallback } from "react";
import { parseUsdAmount, calculatePercentageAmount } from "@/components/octopus-market/solana-wallet";
import { pricingPlans, platformReserveFeeRate } from "@/components/octopus-market/octopus-market-data";

type PricingPlan = (typeof pricingPlans)[number];

export interface UseListingPlanSelectorReturn {
  selectedPlan: PricingPlan;
  holderDiscountEnabled: boolean;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  reserveFee: number;
  totalCharge: number;
  handlePlanChange: (planName: string) => void;
  handleHolderDiscountChange: (enabled: boolean) => void;
  resetToDefault: () => void;
}

export function useListingPlanSelector(): UseListingPlanSelectorReturn {
  const defaultPlan = useMemo(() => pricingPlans.find((plan) => plan.featured) ?? pricingPlans[0], []);
  const [selectedPlanName, setSelectedPlanName] = useState(defaultPlan.name);
  const [holderDiscountEnabled, setHolderDiscountEnabled] = useState(false);

  const selectedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.name === selectedPlanName) ?? defaultPlan,
    [selectedPlanName, defaultPlan]
  );

  const baseAmount = useMemo(() => parseUsdAmount(selectedPlan.price), [selectedPlan.price]);
  const discountAmount = useMemo(
    () => (holderDiscountEnabled ? Number((baseAmount * 0.3).toFixed(2)) : 0),
    [baseAmount, holderDiscountEnabled]
  );
  const finalAmount = useMemo(() => Number((baseAmount - discountAmount).toFixed(2)), [baseAmount, discountAmount]);
  const reserveFee = useMemo(() => calculatePercentageAmount(finalAmount, platformReserveFeeRate), [finalAmount]);
  const totalCharge = useMemo(() => Number((finalAmount + reserveFee).toFixed(2)), [finalAmount, reserveFee]);

  const handlePlanChange = useCallback((planName: string) => {
    setSelectedPlanName(planName);
    setHolderDiscountEnabled(false);
  }, []);

  const handleHolderDiscountChange = useCallback((enabled: boolean) => {
    setHolderDiscountEnabled(enabled);
  }, []);

  const resetToDefault = useCallback(() => {
    setSelectedPlanName(defaultPlan.name);
    setHolderDiscountEnabled(false);
  }, [defaultPlan.name]);

  return {
    selectedPlan,
    holderDiscountEnabled,
    baseAmount,
    discountAmount,
    finalAmount,
    reserveFee,
    totalCharge,
    handlePlanChange,
    handleHolderDiscountChange,
    resetToDefault,
  };
}

/**
 * hooks/useFormWizard.ts
 * Multi-step form management
 */

import { useState, useCallback } from "react";

export type StepId = number;

export interface UseFormWizardReturn<T extends StepId = number> {
  currentStep: T;
  goToStep: (step: T) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoToStep: (step: T) => boolean;
  resetToStep: (step: T) => void;
}

/**
 * Hook to manage multi-step wizard form
 * @param initialStep - Starting step (default: 1)
 * @param totalSteps - Total number of steps
 * @param canAdvance - Optional function to determine if user can advance
 */
export function useFormWizard<T extends StepId = number>(
  initialStep: T = 1 as T,
  totalSteps: number = 2,
  canAdvance?: (step: T) => boolean
): UseFormWizardReturn<T> {
  const [currentStep, setCurrentStep] = useState<T>(initialStep);

  const goToStep = useCallback(
    (step: T) => {
      if (step >= (1 as T) && step <= (totalSteps as T)) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = (prev + 1) as T;
      if (next <= (totalSteps as T)) {
        if (canAdvance && !canAdvance(prev)) {
          return prev;
        }
        return next;
      }
      return prev;
    });
  }, [totalSteps, canAdvance]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const prev_step = (prev - 1) as T;
      return prev_step >= (1 as T) ? prev_step : prev;
    });
  }, []);

  const resetToStep = useCallback(
    (step: T) => {
      if (step >= (1 as T) && step <= (totalSteps as T)) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const canGoToStep = useCallback(
    (step: T): boolean => {
      return step >= (1 as T) && step <= (totalSteps as T);
    },
    [totalSteps]
  );

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep: currentStep === (1 as T),
    isLastStep: currentStep === (totalSteps as T),
    canGoToStep,
    resetToStep,
  };
}

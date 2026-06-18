/**
 * hooks/useSolanaPaymentFlow.ts
 * Solana payment orchestration with retry logic and error handling
 */

import { useState, useCallback } from "react";
import {
  buildTransaction,
  findReference,
  submitSolanaTransfer,
  validateTransfer,
  fetchTransaction,
} from "@/components/octopus-market/solana-payment";
import { PAYMENT_CONFIG, PAYMENT_MESSAGES } from "@/lib/constants";

export type PaymentStatus = "idle" | "building" | "signing" | "confirming" | "validating" | "success" | "error";

export interface PaymentFlowState {
  status: PaymentStatus;
  message: string;
  error: string | null;
  progress: number; // 0-100
  paymentReference: string | null;
  paymentRequestId: string | null;
}

export interface PaymentFlowParams {
  recipient: string;
  amount: number;
  currency: "USDC";
  tokenMint: string;
  tokenDecimals: number;
  label: string;
  message: string;
  memo: string;
  metadata: Record<string, unknown>;
  walletAddress: string;
}

export interface UseSolanaPaymentFlowReturn {
  state: PaymentFlowState;
  executePayment: (params: PaymentFlowParams) => Promise<void>;
  reset: () => void;
  isProcessing: boolean;
}

/**
 * Hook to manage Solana payment flow with retries and error handling
 */
export function useSolanaPaymentFlow(): UseSolanaPaymentFlowReturn {
  const [state, setState] = useState<PaymentFlowState>({
    status: "idle",
    message: PAYMENT_MESSAGES.initial,
    error: null,
    progress: 0,
    paymentReference: null,
    paymentRequestId: null,
  });

  const updateState = useCallback((partial: Partial<PaymentFlowState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const exponentialBackoff = async (attempt: number): Promise<void> => {
    if (attempt >= PAYMENT_CONFIG.retry.maxAttempts) {
      throw new Error("Max retry attempts exceeded");
    }

    const delay = Math.min(
      PAYMENT_CONFIG.retry.initialDelayMs * Math.pow(PAYMENT_CONFIG.retry.backoffMultiplier, attempt),
      PAYMENT_CONFIG.retry.maxDelayMs
    );

    await sleep(delay);
  };

  const executePayment = useCallback(
    async (params: PaymentFlowParams) => {
      try {
        // Step 1: Build transaction
        updateState({
          status: "building",
          message: PAYMENT_MESSAGES.building,
          progress: 20,
          error: null,
        });

        const paymentRequest = await buildTransaction({
          kind: "listing",
          recipient: params.recipient,
          amount: params.amount,
          currency: params.currency,
          tokenMint: params.tokenMint,
          tokenDecimals: params.tokenDecimals,
          label: params.label,
          message: params.message,
          memo: params.memo,
          metadata: params.metadata,
          walletAddress: params.walletAddress,
        });

        // Step 2: Submit to Phantom
        updateState({
          status: "signing",
          message: PAYMENT_MESSAGES.signing,
          progress: 40,
        });

        await submitSolanaTransfer(paymentRequest);

        // Step 3: Find reference with retries
        updateState({
          status: "confirming",
          message: PAYMENT_MESSAGES.confirming,
          progress: 60,
        });

        let foundReference = null;
        let lastError = null;

        for (let attempt = 0; attempt < PAYMENT_CONFIG.retry.maxAttempts; attempt++) {
          try {
            foundReference = await findReference(paymentRequest.reference);
            if (foundReference?.signature) {
              break;
            }
          } catch (error) {
            lastError = error;
            if (attempt < PAYMENT_CONFIG.retry.maxAttempts - 1) {
              await exponentialBackoff(attempt);
            }
          }
        }

        if (!foundReference?.signature) {
          throw new Error(lastError instanceof Error ? lastError.message : "reference-not-found");
        }

        // Step 4: Validate transfer
        updateState({
          status: "validating",
          message: PAYMENT_MESSAGES.validating,
          progress: 80,
        });

        await validateTransfer(foundReference.signature, {
          recipient: params.recipient,
          amount: params.amount,
          reference: paymentRequest.reference,
          currency: params.currency,
          tokenMint: params.tokenMint,
          tokenDecimals: params.tokenDecimals,
        });

        // Step 5: Fetch validated payment
        const validatedPayment = await fetchTransaction(paymentRequest.id);

        if (!validatedPayment || validatedPayment.status !== "validated") {
          throw new Error("validated-transfer-required");
        }

        // Success!
        updateState({
          status: "success",
          message: PAYMENT_MESSAGES.success,
          progress: 100,
          paymentReference: validatedPayment.reference,
          paymentRequestId: validatedPayment.id,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const userMessage =
          PAYMENT_MESSAGES.error[errorMessage as keyof typeof PAYMENT_MESSAGES.error] ||
          `Payment failed: ${errorMessage}`;

        updateState({
          status: "error",
          message: userMessage,
          error: errorMessage,
          progress: 0,
        });
      }
    },
    [updateState]
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      message: PAYMENT_MESSAGES.initial,
      error: null,
      progress: 0,
      paymentReference: null,
      paymentRequestId: null,
    });
  }, []);

  return {
    state,
    executePayment,
    reset,
    isProcessing: state.status !== "idle" && state.status !== "success" && state.status !== "error",
  };
}

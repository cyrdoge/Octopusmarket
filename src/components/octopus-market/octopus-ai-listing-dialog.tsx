/**
 * src/components/octopus-market/octopus-ai-listing-dialog.tsx
 * Refactored to use custom hooks - CLEAN VERSION
 *
 * Reduced from 446 to ~180 lines (-60%)
 */

import { useMemo } from "react";
import { CheckCircle2, FileText, Globe, ImagePlus, LoaderCircle, Receipt, ShieldCheck, Wallet } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { useFileUpload, useFormWizard, useSolanaPaymentFlow, useAIListingForm } from "@/hooks";
import type { RegistryWalletRecord } from "@/components/octopus-market/octopus-central-registry";
import { LISTING_PLANS } from "@/lib/constants";
import { getSolanaProvider } from "@/components/octopus-market/solana-wallet";
import { paymentTokenSymbol as tokenSymbol, solanaPaymentAddress, solanaUsdcMintAddress } from "@/components/octopus-market/octopus-market-data";

type OctopusAIListingDialogProps = {
  walletAddress: string | null;
  walletRecord: RegistryWalletRecord | null;
  onConnectWallet: () => Promise<string | null>;
  triggerLabel?: string;
  embedded?: boolean;
};

export function OctopusAIListingDialog({
  walletAddress,
  walletRecord,
  onConnectWallet,
  triggerLabel = "Open AI listing",
  embedded = false,
}: OctopusAIListingDialogProps) {
  // Hooks
  const wizard = useFormWizard<1 | 2>(1, 2);
  const fileUpload = useFileUpload();
  const listing = useAIListingForm();
  const payment = useSolanaPaymentFlow();

  const selectedPlan = useMemo(() => LISTING_PLANS[listing.form.planId], [listing.form.planId]);

  const handleSubmitListing = async () => {
    let connectedWallet = walletAddress;

    try {
      if (!connectedWallet && listing.currentAmount > 0) {
        connectedWallet = await onConnectWallet();
      }
    } catch {
      connectedWallet = null;
    }

    if (!connectedWallet && listing.currentAmount > 0) {
      payment.state.message = "Connect a Phantom wallet first to continue with the paid AI listing flow.";
      return;
    }

    const effectiveWallet = connectedWallet || "anonymous";

    // Free plan: submit directly
    if (listing.currentAmount === 0) {
      try {
        await listing.submitListing({
          iconSrc: fileUpload.icon.base64,
          iconName: fileUpload.icon.fileName,
          guideFileName: fileUpload.guide.fileName,
          guideFileUrl: fileUpload.guide.base64,
          walletAddress: effectiveWallet,
          walletRecord,
        });

        payment.state.message = connectedWallet
          ? "Your free AI listing is now visible in Explore AI and is waiting for admin review."
          : "Your free AI listing was submitted without a wallet and is now visible in Explore AI while admin review starts.";
        wizard.resetToStep(1 as 1 | 2);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to submit listing";
        payment.state.message = `Error: ${errorMsg}`;
        console.error("[octopus-ai-listing-dialog] free submitListing failed:", error);
      }
      return;
    }

    // Paid plan: execute payment flow
    const provider = getSolanaProvider();
    if (!provider?.signAndSendTransaction && !provider?.signTransaction) {
      payment.state.message = "This wallet cannot complete the live USDC listing payment yet.";
      return;
    }

    await payment.executePayment({
      recipient: solanaPaymentAddress,
      amount: listing.currentAmount,
      currency: "USDC",
      tokenMint: solanaUsdcMintAddress,
      tokenDecimals: 6,
      label: "Octopus Market AI listing",
      message: `${selectedPlan.label} AI listing payment`,
      memo: `${selectedPlan.label} AI listing subscription`,
      metadata: {
        onChainTransfer: true,
        plan: selectedPlan.label,
        listingAmountUsd: listing.currentAmount,
        listingAmountUsdc: listing.currentAmount,
        totalChargeUsdc: listing.currentAmount,
        reserveFee: 0,
        username: walletRecord?.displayName || walletRecord?.username,
      },
      walletAddress: effectiveWallet,
    });

    if (payment.state.status === "success" && payment.state.paymentReference) {
      try {
        await listing.submitListing({
          iconSrc: fileUpload.icon.base64,
          iconName: fileUpload.icon.fileName,
          guideFileName: fileUpload.guide.fileName,
          guideFileUrl: fileUpload.guide.base64,
          walletAddress: effectiveWallet,
          walletRecord,
          paymentReference: payment.state.paymentReference,
          paymentRequestId: payment.state.paymentRequestId,
        });

        payment.state.message = "Your AI listing is now visible in Explore AI and is waiting for admin review, moderation, and badge decisions.";
        wizard.resetToStep(1 as 1 | 2);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to submit listing";
        payment.state.message = `Error: ${errorMsg}`;
        console.error("[octopus-ai-listing-dialog] submitListing failed:", error);
      }
    }
  };

  const content = (
    <div className={embedded ? "min-h-0 space-y-5" : "space-y-6"}>
      {!embedded && (
        <DialogHeader>
          <Badge className="mb-2 w-fit border border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/15">
            AI listing submission
          </Badge>
          <DialogTitle className="text-2xl">Submit a new AI for Octopus Market</DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-zinc-400">
            Step 1 collects your AI details. Step 2 confirms the payment only when the selected plan is paid.
          </DialogDescription>
        </DialogHeader>
      )}

      <div className={embedded ? "max-h-[78vh] overflow-y-auto overscroll-contain pr-2 lg:max-h-[82vh]" : "max-h-[80vh] overflow-y-auto overscroll-contain pr-2"}>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] xl:grid-cols-[1.55fr_0.75fr]">
          {/* Left Column: Form */}
          <div className="space-y-5">
            {/* Step Tabs */}
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant={wizard.currentStep === 1 ? "default" : "outline"}
                onClick={() => wizard.goToStep(1)}
                className={wizard.currentStep === 1 ? "min-h-12 rounded-2xl bg-orange-500 text-white hover:bg-orange-400" : "min-h-12 rounded-2xl border-orange-200 text-zinc-950 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white"}
              >
                Step 1 · AI details
              </Button>
              <Button
                variant={wizard.currentStep === 2 ? "default" : "outline"}
                onClick={() => wizard.goToStep(2)}
                disabled={!listing.canAdvanceToPayment}
                className={wizard.currentStep === 2 ? "min-h-12 rounded-2xl bg-orange-500 text-white hover:bg-orange-400" : "min-h-12 rounded-2xl border-orange-200 text-zinc-950 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white"}
              >
                Step 2 · {listing.currentAmount === 0 ? "Review listing" : "Pay with USDC"}
              </Button>
            </div>

            {/* Step 1: Details */}
            {wizard.currentStep === 1 ? (
              <div className="space-y-4 rounded-3xl border border-orange-200 bg-orange-50/70 p-5 xl:min-h-[31rem] dark:border-white/10 dark:bg-white/5">
                <label className="block rounded-2xl border border-dashed border-orange-300 bg-white p-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
                  <span className="mb-2 flex items-center gap-2 font-medium">
                    <ImagePlus className="size-4 text-orange-500 dark:text-orange-300" />
                    Submit AI icon
                  </span>
                  <input type="file" accept="image/*" className="mt-2 block w-full text-xs" onChange={fileUpload.handleIconChange} />
                  <span className="mt-3 block text-xs text-zinc-500 dark:text-zinc-400">{fileUpload.icon.fileName || "PNG, JPG, or WEBP"}</span>
                  {fileUpload.icon.error && <span className="mt-2 block text-xs text-red-600">{fileUpload.icon.error}</span>}
                </label>

                <Input
                  value={listing.form.websiteUrl}
                  onChange={(e) => listing.handleWebsiteUrlChange(e.target.value)}
                  placeholder="AI website URL"
                  className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                />
                {listing.validation.errors.websiteUrl && <p className="text-xs text-red-600">{listing.validation.errors.websiteUrl}</p>}

                <Textarea
                  value={listing.form.description}
                  onChange={(e) => listing.handleDescriptionChange(e.target.value)}
                  placeholder="AI details, maximum 500 words"
                  className="min-h-44 border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                />
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{listing.detailWordCount} / 500 words</span>
                  {listing.validation.errors.description && <span className="text-red-600">{listing.validation.errors.description}</span>}
                </div>

                <Input
                  value={listing.form.socialUrl}
                  onChange={(e) => listing.handleSocialUrlChange(e.target.value)}
                  placeholder="AI social network URL"
                  className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                />
                {listing.validation.errors.socialUrl && <p className="text-xs text-red-600">{listing.validation.errors.socialUrl}</p>}

                <label className="block rounded-2xl border border-dashed border-orange-300 bg-white p-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
                  <span className="mb-2 flex items-center gap-2 font-medium">
                    <FileText className="size-4 text-orange-500 dark:text-orange-300" />
                    Submit a PDF guide
                  </span>
                  <input type="file" accept="application/pdf" className="mt-2 block w-full text-xs" onChange={fileUpload.handleGuideChange} />
                  <span className="mt-3 block text-xs text-zinc-500 dark:text-zinc-400">{fileUpload.guide.fileName || "PDF guide required"}</span>
                  {fileUpload.guide.error && <span className="mt-2 block text-xs text-red-600">{fileUpload.guide.error}</span>}
                </label>
              </div>
            ) : (
              <div className="space-y-4 rounded-3xl border border-orange-200 bg-orange-50/70 p-5 xl:min-h-[31rem] dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-3 lg:grid-cols-3">
                  {Object.entries(LISTING_PLANS).map(([key, plan]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => listing.handlePlanChange(key as any)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        listing.form.planId === key
                          ? "border-orange-300 bg-white shadow-sm dark:border-orange-400/40 dark:bg-orange-500/10"
                          : "border-orange-200 bg-white hover:border-orange-300 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <p className="font-medium text-zinc-950 dark:text-white">{plan.label}</p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{plan.billingLabel}</p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-black/20">
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">Automatic renewal</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Auto-renew when available (disable in settings)</p>
                  </div>
                  <Switch
                    checked={listing.form.autoRenewEnabled}
                    onCheckedChange={listing.handleAutoRenewChange}
                    disabled={listing.form.planId === "free"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-5">
            <Card className="border-orange-200 bg-white dark:border-white/10 dark:bg-white/5">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-white">
                  <Receipt className="size-4 text-orange-500 dark:text-orange-300" />
                  Listing summary
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-4 dark:border-white/10 dark:bg-black/20">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Linked wallet</p>
                  <p className="mt-2 break-all font-medium text-zinc-950 dark:text-white">{walletAddress || "Connect Phantom"}</p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-4 dark:border-white/10 dark:bg-black/20">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Selected plan</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{selectedPlan.label}</p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{listing.currentAmount === 0 ? "Free listing" : `${listing.currentAmount.toFixed(2)} ${tokenSymbol}`}</p>
                </div>

                <Separator className="bg-orange-100 dark:bg-white/10" />

                <Button
                  type="button"
                  className="w-full rounded-2xl bg-orange-500 text-white hover:bg-orange-400"
                  onClick={() => void handleSubmitListing()}
                  disabled={!listing.canAdvanceToPayment || payment.isProcessing}
                >
                  {payment.isProcessing ? <LoaderCircle className="size-4 animate-spin" /> : <Wallet className="size-4" />}
                  {listing.currentAmount === 0 ? "Submit free listing" : "Pay with USDC"}
                </Button>
              </CardContent>
            </Card>

            <Alert className="border-orange-200 bg-orange-50/70 text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-white">
              {payment.isProcessing ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              <AlertTitle>{payment.isProcessing ? "Payment validation in progress" : "Listing workflow"}</AlertTitle>
              <AlertDescription>{payment.state.message}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-2xl bg-orange-500 text-white hover:bg-orange-400">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[94vh] w-[98vw] max-w-[98vw] overflow-hidden border-orange-200 bg-white text-zinc-950 sm:max-w-[96vw] xl:max-w-[1440px] dark:border-white/10 dark:bg-zinc-950 dark:text-white">
        {content}
      </DialogContent>
    </Dialog>
  );
}

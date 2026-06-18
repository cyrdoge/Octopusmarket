/**
 * src/components/octopus-market/binary-prediction-studio/index.tsx
 * Orchestrateur principal du Binary Prediction Studio.
 * Gère tous les états globaux, souscriptions temps réel, et logic de paiement Solana.
 * Les sous-composants (EventsList, BettingInterface, UserHistory, AdminPanel) reçoivent
 * leurs données via props — aucun état ne vit dans les feuilles.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Wallet,
  History,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  notifyAdminForValidatedPayment,
  readAdminPaymentNotifications,
  subscribeToAdminStorage,
  type AdminPaymentNotification,
} from "@/components/octopus-market/octopus-admin";
import {
  appendPredictionHistoryEntry,
  readAdminCreatedPredictionMarkets,
  readPredictionHistory,
  readPredictionResolutions,
  subscribeToPredictionMarketStorage,
  type AdminCreatedPredictionMarket,
  type PredictionHistoryEntry,
  type PredictionResolutionRecord,
} from "@/components/octopus-market/prediction-market-store";
import {
  paymentTokenSymbol,
  predictionMarketCategories,
  predictionMarketFeeRate,
  predictionMarketMaxStakeUsd,
  predictionMarketMinStakeUsd,
  predictionMarketQuestions,
  predictionMarketReserveFeeRate,
  predictionMarketTreasuryAddress,
  solanaUsdcMintAddress,
  type PredictionMarketQuestion,
} from "@/components/octopus-market/octopus-market-data";
import {
  calculatePercentageAmount,
  formatWalletAddress,
  getSolanaProvider,
} from "@/components/octopus-market/solana-wallet";
import type { PaymentRequest } from "@/components/octopus-market/solana-payment";
import { readCachedCentralWalletRecord } from "@/components/octopus-market/octopus-central-registry";

import { CategoryFilter } from "./CategoryFilter";
import { EventsList } from "./EventsList";
import { AdminPanel } from "./AdminPanel";
import { UserHistory } from "./UserHistory";
import {
  formatCurrency,
  formatMoment,
  buildClaimReference,
  redirectToPredictionHistory,
  buildPredictionHistoryEntryFromPaymentRequest,
  loadPaymentModule,
  getMarketOptions,
  buildOptionSummaries,
} from "./utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MarketDraftStatus = "idle" | "success" | "error";

export type BinaryPredictionStudioProps = {
  isWalletConnected: boolean;
  walletAddress: string | null;
  walletUsername?: string | null;
  onConnectWallet: () => Promise<string | null>;
  selectedCategoryId?: string;
  selectedMarketId?: string | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BinaryPredictionStudio({
  isWalletConnected,
  walletAddress,
  walletUsername,
  onConnectWallet,
  selectedCategoryId,
  selectedMarketId,
}: BinaryPredictionStudioProps) {

  // ── Global state ──
  const [activeCategoryId, setActiveCategoryId] = useState(
    predictionMarketCategories[0]?.id ?? "crypto"
  );
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [selections, setSelections] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState<MarketDraftStatus>("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Connect a wallet, choose the live sports market, confirm the payment in Phantom, then click Payment made to notify admin and save your history."
  );
  const [history, setHistory] = useState<PredictionHistoryEntry[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, PredictionResolutionRecord>>({});
  const [adminNotifications, setAdminNotifications] = useState<AdminPaymentNotification[]>(
    () => readAdminPaymentNotifications()
  );
  const [adminCreatedMarkets, setAdminCreatedMarkets] = useState<AdminCreatedPredictionMarket[]>([]);
  const [signingMarketId, setSigningMarketId] = useState<string | null>(null);
  const [latestPaymentRequest, setLatestPaymentRequest] = useState<PaymentRequest | null>(null);
  const [isRecoveringPendingPayments, setIsRecoveringPendingPayments] = useState(false);

  // Load async data on mount
  useEffect(() => {
    const loadAsyncData = async () => {
      const [nextHistory, nextResolutions, nextMarkets] = await Promise.all([
        readPredictionHistory(),
        readPredictionResolutions(),
        readAdminCreatedPredictionMarkets(),
      ]);
      setHistory(nextHistory);
      setResolutions(nextResolutions);
      setAdminCreatedMarkets(nextMarkets);
    };
    void loadAsyncData();
  }, []);

  // ── Realtime subscriptions ──
  useEffect(() => {
    return subscribeToAdminStorage(() => {
      setAdminNotifications(readAdminPaymentNotifications());
    });
  }, []);

  useEffect(() => {
    return subscribeToPredictionMarketStorage(async () => {
      const [nextMarkets, nextHistory, nextResolutions] = await Promise.all([
        readAdminCreatedPredictionMarkets(),
        readPredictionHistory(),
        readPredictionResolutions(),
      ]);
      setAdminCreatedMarkets(nextMarkets);
      setHistory(nextHistory);
      setResolutions(nextResolutions);
    });
  }, []);

  // ── Sync selectedCategoryId prop ──
  useEffect(() => {
    if (!selectedCategoryId) return;
    setActiveCategoryId(selectedCategoryId);
  }, [selectedCategoryId]);

  // ── Scroll to selectedMarketId ──
  useEffect(() => {
    if (!selectedMarketId || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      window.document
        .getElementById(`prediction-market-card-${selectedMarketId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedMarketId, activeCategoryId]);

  // ── Derived data ──
  const activeCategory =
    predictionMarketCategories.find((c) => c.id === activeCategoryId) ??
    predictionMarketCategories[0];

  const allPredictionMarkets = useMemo(
    () => [...predictionMarketQuestions, ...adminCreatedMarkets],
    [adminCreatedMarkets]
  );

  const visibleQuestions = useMemo(
    () => allPredictionMarkets.filter((q) => q.categoryId === activeCategoryId),
    [activeCategoryId, allPredictionMarkets]
  );

  const ownerWalletConnected = walletAddress === predictionMarketTreasuryAddress;

  const derivedHistory = useMemo(
    () =>
      history.map((entry) => {
        const resolution = resolutions[entry.marketId];
        const paymentNotification = adminNotifications.find(
          (n) => n.paymentReference === entry.paymentReference
        );
        const adminStatus = paymentNotification?.status ?? "pending";
        const isResolved = Boolean(resolution);
        const isWinner = isResolved && resolution.outcomeId === entry.selectionId && adminStatus === "approved";
        const isLoser = isResolved && resolution.outcomeId !== entry.selectionId && adminStatus === "approved";
        const canClaim = isWinner && !entry.claimedAt;
        return { ...entry, resolution, adminStatus, isResolved, isWinner, isLoser, canClaim };
      }),
    [adminNotifications, history, resolutions]
  );

  const totalPositioned = useMemo(
    () => history.reduce((t, e) => t + e.amount, 0),
    [history]
  );

  const totalReserveFees = useMemo(
    () => history.reduce((t, e) => t + e.reserveFee, 0),
    [history]
  );

  const totalClaimable = useMemo(
    () =>
      derivedHistory.reduce((t, e) => {
        if (!e.canClaim || walletAddress !== e.walletAddress) return t;
        return t + e.netReward;
      }, 0),
    [derivedHistory, walletAddress]
  );

  const latestReportablePaymentRequest = useMemo(() => {
    if (
      latestPaymentRequest?.status === "validated" &&
      !history.some((e) => e.paymentReference === latestPaymentRequest.reference)
    ) {
      return latestPaymentRequest;
    }
    return null;
  }, [history, latestPaymentRequest]);

  // ── Payment handlers ──
  const finalizeValidatedPredictionPayment = useCallback(
    (paymentRequest: PaymentRequest, options?: { redirect?: boolean }) => {
      setLatestPaymentRequest(paymentRequest);
      setStatus("success");
      setStatusMessage(
        `${paymentRequest.message ?? "Prediction payment"} was validated on-chain. Click Payment made to notify the admin wallet and add this position to your history.`
      );
      if (options?.redirect !== false) redirectToPredictionHistory();
    },
    []
  );

  const handleReportValidatedPayment = useCallback(
    async (paymentRequest: PaymentRequest) => {
      const historyEntry = buildPredictionHistoryEntryFromPaymentRequest(paymentRequest);
      await appendPredictionHistoryEntry(historyEntry);
      notifyAdminForValidatedPayment(paymentRequest);
      const nextHistory = await readPredictionHistory();
      setHistory(nextHistory);
      setAdminNotifications(readAdminPaymentNotifications());
      setLatestPaymentRequest(paymentRequest);
      setStatus("success");
      setStatusMessage(
        `Payment reported to admin for ${historyEntry.marketTitle}. The position is now visible in your history and in the admin approval queue.`
      );
      redirectToPredictionHistory();
    },
    []
  );

  const recoverPredictionPayments = useCallback(async () => {
    if (isRecoveringPendingPayments || !latestPaymentRequest || latestPaymentRequest.kind !== "prediction") return;
    if (history.some((e) => e.paymentReference === latestPaymentRequest.reference)) return;

    try {
      setIsRecoveringPendingPayments(true);
      const paymentModule = await loadPaymentModule();
      const foundReference = await paymentModule.findReference(latestPaymentRequest.reference);
      if (!foundReference?.signature) return;

      await paymentModule.validateTransfer(foundReference.signature, {
        recipient: latestPaymentRequest.recipient,
        amount: latestPaymentRequest.amount,
        reference: latestPaymentRequest.reference,
        currency: latestPaymentRequest.currency,
        tokenMint: latestPaymentRequest.tokenMint,
        tokenDecimals: latestPaymentRequest.tokenDecimals,
      });

      const validatedPaymentRequest = await paymentModule.fetchTransaction(latestPaymentRequest.id);
      if (validatedPaymentRequest?.status === "validated") {
        finalizeValidatedPredictionPayment(validatedPaymentRequest, { redirect: false });
      }
    } catch {
      return;
    } finally {
      setIsRecoveringPendingPayments(false);
    }
  }, [finalizeValidatedPredictionPayment, history, isRecoveringPendingPayments, latestPaymentRequest]);

  // ── Recovery effects ──
  useEffect(() => {
    void recoverPredictionPayments();
  }, [recoverPredictionPayments]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleVisibilityChange = () => {
      if (!document.hidden) void recoverPredictionPayments();
    };
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [recoverPredictionPayments]);

  // ── Bet handlers ──
  const handleChooseSelection = (marketId: string, selectionId: string) => {
    setSelections((prev) => ({ ...prev, [marketId]: selectionId }));
  };

  const handleAmountChange = (marketId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [marketId]: value }));
  };

  const handleConfirmPosition = async (market: PredictionMarketQuestion, marketIndex: number) => {
    if (walletAddress && readCachedCentralWalletRecord(walletAddress)?.status === "suspended") {
      setStatus("error");
      setStatusMessage("This wallet is suspended and cannot place new bets right now.");
      return;
    }

    const rawAmount = amounts[market.id] ?? "";
    const amount = Number(rawAmount);
    const selectedOptionId = selections[market.id];
    const marketOptions = getMarketOptions(market, marketIndex);
    const selectedOption = marketOptions.find((o) => o.id === selectedOptionId);

    if (!selectedOption) {
      setStatus("error");
      setStatusMessage(`Choose one market option for ${market.title}.`);
      return;
    }

    if (!Number.isFinite(amount) || amount < predictionMarketMinStakeUsd || amount > predictionMarketMaxStakeUsd) {
      setStatus("error");
      setStatusMessage(
        `Enter an amount between ${formatCurrency(predictionMarketMinStakeUsd)} and ${formatCurrency(predictionMarketMaxStakeUsd)}.`
      );
      return;
    }

    let connectedWallet = walletAddress;
    if (!connectedWallet) connectedWallet = await onConnectWallet();
    if (!connectedWallet) {
      setStatus("error");
      setStatusMessage("Connect a Solana wallet first to confirm a prediction market position.");
      return;
    }

    const provider = getSolanaProvider();
    if (!provider?.signAndSendTransaction && !provider?.signTransaction) {
      setStatus("error");
      setStatusMessage(`This wallet cannot send a real ${paymentTokenSymbol} transfer for the prediction market yet.`);
      return;
    }

    const reserveFee = calculatePercentageAmount(amount, predictionMarketReserveFeeRate);
    const totalChargeUsd = Number((amount + reserveFee).toFixed(2));
    const grossReward = Number((amount * selectedOption.oddsMultiplier).toFixed(2));
    const netReward = Number((grossReward * (1 - predictionMarketFeeRate / 100)).toFixed(2));

    const paymentModule = await loadPaymentModule();
    const transferRequest = await paymentModule.buildTransaction({
      kind: "prediction",
      recipient: predictionMarketTreasuryAddress,
      amount: totalChargeUsd,
      walletAddress: connectedWallet,
      currency: "USDC",
      tokenMint: solanaUsdcMintAddress,
      tokenDecimals: 6,
      label: "Octopus Market prediction market",
      message: `${market.title} · ${selectedOption.label}`,
      memo: `${activeCategory.label} market position`,
      metadata: {
        onChainTransfer: true,
        marketId: market.id,
        marketTitle: market.title,
        categoryLabel: activeCategory.label,
        selectionId: selectedOption.id,
        selectionLabel: selectedOption.label,
        payoutMultiple: selectedOption.oddsMultiplier,
        grossReward,
        netReward,
        claimFeeRate: predictionMarketFeeRate,
        stake: amount,
        reserveFee,
        totalChargeUsd,
        totalChargeUsdc: totalChargeUsd,
        ...(walletUsername?.trim() ? { username: walletUsername.trim() } : {}),
      },
    });

    setLatestPaymentRequest(transferRequest);

    try {
      setSigningMarketId(market.id);
      setStatus("idle");
      setStatusMessage(`A real transfer request is ready. Phantom is now asking for the on-chain ${paymentTokenSymbol} prediction payment.`);

      await paymentModule.submitSolanaTransfer(transferRequest);
      const foundReference = await paymentModule.findReference(transferRequest.reference);

      if (!foundReference?.signature) throw new Error("reference-not-found");

      await paymentModule.validateTransfer(foundReference.signature, {
        recipient: predictionMarketTreasuryAddress,
        amount: totalChargeUsd,
        reference: transferRequest.reference,
        currency: "USDC",
        tokenMint: solanaUsdcMintAddress,
        tokenDecimals: 6,
      });

      const storedValidatedTransfer = await paymentModule.fetchTransaction(transferRequest.id);
      if (!storedValidatedTransfer || storedValidatedTransfer.status !== "validated") {
        throw new Error("validated-transfer-required");
      }

      finalizeValidatedPredictionPayment(storedValidatedTransfer, { redirect: true });
    } catch (error) {
      setStatus("error");
      setStatusMessage(
        error instanceof Error
          ? `The Phantom transfer could not be completed: ${error.message}`
          : "The Phantom transfer was cancelled, failed, or could not be validated on-chain."
      );
    } finally {
      setSigningMarketId(null);
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      <div id="prediction-market-studio" className="scroll-mt-32" />

      {/* Status alert */}
      {status !== "idle" && statusMessage && (
        <Alert
          className={
            status === "error"
              ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
              : "border-orange-200 bg-orange-50 dark:border-white/10 dark:bg-white/5"
          }
        >
          {status === "success" ? <CheckCircle2 className="size-4" /> : <ShieldCheck className="size-4" />}
          <AlertTitle>{status === "success" ? "Update" : "Action required"}</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      {/* Wallet connection alert */}
      <Alert className="border-orange-200 bg-orange-50/70 dark:border-white/10 dark:bg-white/5">
        {isWalletConnected ? <CheckCircle2 className="size-4" /> : <Wallet className="size-4" />}
        <AlertTitle>
          {isWalletConnected ? "Wallet unlocked for utilities" : "Browse predictions without a wallet"}
        </AlertTitle>
        <AlertDescription>
          {isWalletConnected
            ? `Connected wallet: ${formatWalletAddress(walletAddress)}${
                readCachedCentralWalletRecord(walletAddress ?? "")?.status === "suspended" ? " · suspended" : ""
              }`
            : "Anyone can view active prediction markets. Connect a Solana wallet to place or claim positions."}
        </AlertDescription>
      </Alert>

      {/* Category filter */}
      <CategoryFilter
        activeCategoryId={activeCategoryId}
        onCategoryChange={setActiveCategoryId}
      />

      {/* Active category description */}
      {activeCategory && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm leading-6 dark:border-white/10 dark:bg-black/20">
          <p className="font-medium text-zinc-950 dark:text-white">{activeCategory.label}</p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{activeCategory.description}</p>
        </div>
      )}

      {/* Events grid */}
      <EventsList
        events={visibleQuestions}
        onConfirmBet={({ eventId, optionId, amount }) => {
          const market = visibleQuestions.find((q) => q.id === eventId);
          const marketIndex = visibleQuestions.findIndex((q) => q.id === eventId);
          if (!market) return;
          setSelections((prev) => ({ ...prev, [eventId]: optionId }));
          setAmounts((prev) => ({ ...prev, [eventId]: String(amount) }));
          void handleConfirmPosition(market, marketIndex);
        }}
        isLoading={false}
      />

      {/* Payment QR + report */}
      {latestPaymentRequest && (
        <Card className="border-orange-200 bg-white dark:border-white/10 dark:bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <QrCode className="size-5 text-orange-500" />
              Latest transfer request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="break-all text-sm text-zinc-600 dark:text-zinc-400">
              {latestPaymentRequest.encodedUrl}
            </p>
            {latestPaymentRequest.signature && (
              <p className="break-all text-xs text-zinc-500 dark:text-zinc-400">
                Transaction signature: {latestPaymentRequest.signature}
              </p>
            )}
            <img
              src={latestPaymentRequest.qrCodeSrc}
              alt="Prediction market payment QR"
              className="mx-auto w-full max-w-44 rounded-2xl border border-orange-200 bg-white p-2 dark:border-white/10 dark:bg-zinc-950"
            />
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              Reference {latestPaymentRequest.reference} is linked to the latest request.
            </p>

            {latestReportablePaymentRequest?.signature &&
              !history.some((e) => e.paymentReference === latestReportablePaymentRequest.reference) && (
                <Button
                  type="button"
                  className="w-full rounded-2xl bg-orange-500 text-white hover:bg-orange-400"
                  onClick={() => handleReportValidatedPayment(latestReportablePaymentRequest)}
                >
                  <CheckCircle2 className="size-4" />
                  {`Payment made · ${latestReportablePaymentRequest.amount.toFixed(2)} ${paymentTokenSymbol}`}
                </Button>
              )}
          </CardContent>
        </Card>
      )}

      {/* History summary stats */}
      <Card className="border-orange-200 bg-white dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <History className="size-5 text-orange-500" />
            History and claims
          </CardTitle>
          <CardDescription>
            Payment history, active predictions, validation state, total win, total loss, and claims.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 dark:border-white/10 dark:bg-black/20">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total positioned</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
                {formatCurrency(totalPositioned)}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 dark:border-white/10 dark:bg-black/20">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Reserve fees</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
                {formatCurrency(totalReserveFees)}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 dark:border-white/10 dark:bg-black/20">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Claimable now</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
                {formatCurrency(totalClaimable)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User history */}
      <UserHistory
        history={derivedHistory}
        walletAddress={walletAddress}
        onConnectWallet={onConnectWallet}
        onHistoryUpdate={async () => {
          const nextHistory = await readPredictionHistory();
          setHistory(nextHistory);
        }}
        isLoading={false}
      />

      {/* Admin panel — owner only */}
      {ownerWalletConnected && (
        <AdminPanel walletAddress={walletAddress} />
      )}
    </div>
  );
}

/**
 * AdminPanel.tsx
 * Formulaire autonome de création de marchés de prédiction.
 * Toute la logique métier (validation, persistance, auth admin) vit ici.
 */

import { memo, useEffect, useState } from "react";
import { Plus, CheckCircle2, AlertCircle, Sparkles, Pencil, Trash2, Lock, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureAdminSession } from "@/components/octopus-market/octopus-admin-auth";
import { appendCentralAdminLog } from "@/components/octopus-market/octopus-central-registry";
import {
  appendAdminCreatedPredictionMarket,
  updateAdminCreatedPredictionMarket,
  removeAdminCreatedPredictionMarket,
  readAdminCreatedPredictionMarkets,
  readPredictionHistory,
  subscribeToPredictionMarketStorage,
  persistPredictionMarketStateToServer,
  type AdminCreatedPredictionMarket,
} from "@/components/octopus-market/prediction-market-store";
import {
  predictionMarketCategories,
  type PredictionMarketOption,
} from "@/components/octopus-market/octopus-market-data";
import { predictionMarketTreasuryAddress } from "@/components/octopus-market/octopus-market-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminMarketCreationMode = "vs" | "simple";
type DraftStatus = "idle" | "success" | "error";

type AdminMarketDraft = {
  categoryId: string;
  title: string;
  resolutionLabel: string;
  eventDateLabel: string;
  mode: AdminMarketCreationMode;
  enableThirdOption: boolean;
  leftCompetitorName: string;
  leftCompetitorImageSrc: string;
  rightCompetitorName: string;
  rightCompetitorImageSrc: string;
  singleName: string;
  singleImageSrc: string;
  firstOdds: string;
  secondOdds: string;
  thirdOptionLabel: string;
  thirdOptionOdds: string;
  thirdOptionImageSrc: string;
  extraNotes: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createInitialDraft(): AdminMarketDraft {
  return {
    categoryId: predictionMarketCategories[0]?.id ?? "crypto",
    title: "",
    resolutionLabel: "Resolved by Octopus Market admin after the event result is confirmed",
    eventDateLabel: "",
    mode: "vs",
    enableThirdOption: false,
    leftCompetitorName: "",
    leftCompetitorImageSrc: "",
    rightCompetitorName: "",
    rightCompetitorImageSrc: "",
    singleName: "",
    singleImageSrc: "",
    firstOdds: "1.8",
    secondOdds: "1.8",
    thirdOptionLabel: "X",
    thirdOptionOdds: "3.2",
    thirdOptionImageSrc: "",
    extraNotes: "",
  };
}

function buildMarketId(title: string) {
  return `admin-market-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${Date.now().toString(36)}`;
}

function draftFromMarket(market: AdminCreatedPredictionMarket): AdminMarketDraft {
  const mode: AdminMarketCreationMode = market.visualType === "simple" ? "simple" : "vs";
  const options = market.options ?? [];
  const thirdOpt = options.find((o) => o.id === "third-option");

  const base = {
    categoryId: market.categoryId,
    title: market.title,
    resolutionLabel: market.resolutionLabel ?? "",
    eventDateLabel: market.eventDateLabel ?? "",
    mode,
    enableThirdOption: Boolean(thirdOpt),
    thirdOptionLabel: thirdOpt?.label ?? (mode === "vs" ? "X" : "Third option"),
    thirdOptionOdds: thirdOpt ? String(thirdOpt.oddsMultiplier) : "3.2",
    thirdOptionImageSrc: thirdOpt?.logoSrc ?? "",
  };

  if (mode === "vs") {
    const leftOpt = options.find((o) => o.id === "left-win");
    const rightOpt = options.find((o) => o.id === "right-win");
    return {
      ...base,
      leftCompetitorName: market.leftCompetitorName ?? "",
      leftCompetitorImageSrc: market.leftCompetitorImageSrc ?? "",
      rightCompetitorName: market.rightCompetitorName ?? "",
      rightCompetitorImageSrc: market.rightCompetitorImageSrc ?? "",
      singleName: "",
      singleImageSrc: "",
      firstOdds: leftOpt ? String(leftOpt.oddsMultiplier) : "1.8",
      secondOdds: rightOpt ? String(rightOpt.oddsMultiplier) : "1.8",
      extraNotes: leftOpt?.description ?? "",
    };
  }

  const yesOpt = options.find((o) => o.id === "yes");
  const noOpt = options.find((o) => o.id === "no");
  return {
    ...base,
    leftCompetitorName: "",
    leftCompetitorImageSrc: "",
    rightCompetitorName: "",
    rightCompetitorImageSrc: "",
    singleName: market.singleName ?? "",
    singleImageSrc: market.singleImageSrc ?? "",
    firstOdds: yesOpt ? String(yesOpt.oddsMultiplier) : "1.8",
    secondOdds: noOpt ? String(noOpt.oddsMultiplier) : "1.8",
    extraNotes: yesOpt?.description ?? "",
  };
}

function buildMarketOptions(draft: AdminMarketDraft): PredictionMarketOption[] {
  if (draft.mode === "vs") {
    const options: PredictionMarketOption[] = [
      {
        id: "left-win",
        label: `${draft.leftCompetitorName.trim() || "Team A"} Win`,
        oddsMultiplier: Number(draft.firstOdds),
        description: draft.extraNotes.trim() || "Admin-created left team side.",
        logoSrc: draft.leftCompetitorImageSrc.trim() || undefined,
        initialVolumeUsd: 0,
      },
      {
        id: "right-win",
        label: `${draft.rightCompetitorName.trim() || "Team B"} Win`,
        oddsMultiplier: Number(draft.secondOdds),
        description: draft.extraNotes.trim() || "Admin-created right team side.",
        logoSrc: draft.rightCompetitorImageSrc.trim() || undefined,
        initialVolumeUsd: 0,
      },
    ];

    if (draft.enableThirdOption) {
      options.splice(1, 0, {
        id: "third-option",
        label: draft.thirdOptionLabel.trim() || "X",
        oddsMultiplier: Number(draft.thirdOptionOdds),
        description: draft.extraNotes.trim() || "Admin-created third option.",
        logoSrc: draft.thirdOptionImageSrc.trim() || undefined,
        initialVolumeUsd: 0,
      });
    }

    return options;
  }

  const options: PredictionMarketOption[] = [
    {
      id: "yes",
      label: "Yes",
      oddsMultiplier: Number(draft.firstOdds),
      description: draft.extraNotes.trim() || "Admin-created yes side.",
      initialVolumeUsd: 0,
    },
    {
      id: "no",
      label: "No",
      oddsMultiplier: Number(draft.secondOdds),
      description: draft.extraNotes.trim() || "Admin-created no side.",
      initialVolumeUsd: 0,
    },
  ];

  if (draft.enableThirdOption) {
    options.push({
      id: "third-option",
      label: draft.thirdOptionLabel.trim() || "Third option",
      oddsMultiplier: Number(draft.thirdOptionOdds),
      description: draft.extraNotes.trim() || "Admin-created third option.",
      logoSrc: draft.thirdOptionImageSrc.trim() || undefined,
      initialVolumeUsd: 0,
    });
  }

  return options;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("image-read-failed"));
    };
    reader.onerror = () => reject(new Error("image-read-failed"));
    reader.readAsDataURL(file);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminPanelProps {
  walletAddress: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminPanel = memo(function AdminPanel({ walletAddress }: AdminPanelProps) {
  const [draft, setDraft] = useState<AdminMarketDraft>(createInitialDraft);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [markets, setMarkets] = useState<AdminCreatedPredictionMarket[]>([]);
  const [marketIdsWithPositions, setMarketIdsWithPositions] = useState<Set<string>>(new Set());
  const [editingMarketId, setEditingMarketId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isOwner = walletAddress === predictionMarketTreasuryAddress;

  const refreshMarketsAndPositions = () => {
    setMarkets(readAdminCreatedPredictionMarkets());
    setMarketIdsWithPositions(new Set(readPredictionHistory().map((entry) => entry.marketId)));
  };

  useEffect(() => {
    if (!isOwner) return;
    refreshMarketsAndPositions();
    return subscribeToPredictionMarketStorage(() => refreshMarketsAndPositions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  // ── Guard ──
  if (!isOwner) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Access Required</AlertTitle>
        <AlertDescription>You need admin privileges to access this panel.</AlertDescription>
      </Alert>
    );
  }

  // ── Draft helpers ──
  function set<K extends keyof AdminMarketDraft>(key: K, value: AdminMarketDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleStartEdit(market: AdminCreatedPredictionMarket) {
    setDraft(draftFromMarket(market));
    setEditingMarketId(market.id);
    setShowForm(true);
    setStatus("idle");
    setStatusMessage("");
  }

  function handleOpenCreateForm() {
    setDraft(createInitialDraft());
    setEditingMarketId(null);
    setShowForm(true);
    setStatus("idle");
    setStatusMessage("");
  }

  function handleCancelForm() {
    setDraft(createInitialDraft());
    setEditingMarketId(null);
    setShowForm(false);
    setStatus("idle");
    setStatusMessage("");
  }

  async function handleDeleteMarket(marketId: string) {
    if (!walletAddress) return;
    removeAdminCreatedPredictionMarket(marketId, walletAddress);
    setConfirmDeleteId(null);
    refreshMarketsAndPositions();
    const persisted = await persistPredictionMarketStateToServer(walletAddress);
    void appendCentralAdminLog({
      adminWallet: walletAddress,
      action: "delete_prediction",
      targetId: marketId,
      details: JSON.stringify({ persisted }),
    });
    if (editingMarketId === marketId) {
      handleCancelForm();
    }
  }

  async function handleImageUpload(
    key: "leftCompetitorImageSrc" | "rightCompetitorImageSrc" | "singleImageSrc" | "thirdOptionImageSrc",
    files: FileList | null
  ) {
    const file = files?.[0];
    if (!file) return;
    try {
      const src = await readImageFile(file);
      set(key, src);
    } catch {
      setStatus("error");
      setStatusMessage("The image could not be loaded. Please try another file.");
    }
  }

  // ── Submit ──
  async function handleSubmit() {
    if (!walletAddress) return;

    const trimmedTitle = draft.title.trim();
    const trimmedResolution = draft.resolutionLabel.trim();

    if (!trimmedTitle || !trimmedResolution) {
      setStatus("error");
      setStatusMessage("Add at least a title and a resolution rule before creating a market.");
      return;
    }

    if (draft.mode === "vs") {
      if (!draft.leftCompetitorName.trim() || !draft.rightCompetitorName.trim()) {
        setStatus("error");
        setStatusMessage("Add both team names for a VS market before publishing it.");
        return;
      }
    }

    if (draft.mode === "simple" && !draft.singleName.trim()) {
      setStatus("error");
      setStatusMessage("Add the subject name for a simple market before publishing it.");
      return;
    }

    try {
      await ensureAdminSession(walletAddress);
    } catch {
      setStatus("error");
      setStatusMessage("Admin authentication is required before publishing a market to the shared database.");
      return;
    }

    const nextOptions = buildMarketOptions(draft);

    if (nextOptions.some((o) => !Number.isFinite(o.oddsMultiplier) || o.oddsMultiplier <= 1)) {
      setStatus("error");
      setStatusMessage("Each market option must have a valid odds value above 1.");
      return;
    }

    const sharedFields = {
      categoryId: draft.categoryId,
      title: trimmedTitle,
      marketType: (draft.enableThirdOption
        ? "three-way"
        : draft.mode === "vs"
          ? "threshold"
          : "yes-no") as AdminCreatedPredictionMarket["marketType"],
      visualType: draft.mode,
      leftCompetitorName: draft.mode === "vs" ? draft.leftCompetitorName.trim() : undefined,
      leftCompetitorImageSrc: draft.mode === "vs" && draft.leftCompetitorImageSrc.trim()
        ? draft.leftCompetitorImageSrc.trim()
        : undefined,
      rightCompetitorName: draft.mode === "vs" ? draft.rightCompetitorName.trim() : undefined,
      rightCompetitorImageSrc: draft.mode === "vs" && draft.rightCompetitorImageSrc.trim()
        ? draft.rightCompetitorImageSrc.trim()
        : undefined,
      singleName: draft.mode === "simple" ? draft.singleName.trim() : undefined,
      singleImageSrc: draft.mode === "simple" && draft.singleImageSrc.trim()
        ? draft.singleImageSrc.trim()
        : undefined,
      resolutionLabel: trimmedResolution,
      eventDateLabel: draft.eventDateLabel.trim() || undefined,
      options: nextOptions,
    };

    // ── Update an existing market ──
    if (editingMarketId) {
      if (marketIdsWithPositions.has(editingMarketId)) {
        setStatus("error");
        setStatusMessage("This market already has positions and can no longer be edited.");
        return;
      }

      const nextMarkets = updateAdminCreatedPredictionMarket(
        editingMarketId,
        (market) => ({ ...market, ...sharedFields }),
        walletAddress
      );
      setMarkets(nextMarkets);

      const persisted = await persistPredictionMarketStateToServer(walletAddress);
      setStatus("success");
      setStatusMessage(
        persisted
          ? `${sharedFields.title} has been updated.`
          : "The market was updated locally. Shared database sync is unavailable right now."
      );

      void appendCentralAdminLog({
        adminWallet: walletAddress,
        action: "update_prediction",
        targetId: editingMarketId,
        details: JSON.stringify({ categoryId: sharedFields.categoryId, title: sharedFields.title }),
      });

      handleCancelForm();
      return;
    }

    // ── Create a new market ──
    const nextMarket: AdminCreatedPredictionMarket = {
      id: buildMarketId(trimmedTitle),
      ...sharedFields,
      createdAt: Date.now(),
      createdByWallet: walletAddress,
      isAdminCreated: true,
    };

    const nextMarkets = appendAdminCreatedPredictionMarket(nextMarket, walletAddress);
    setMarkets(nextMarkets);
    const persistedToServer = await persistPredictionMarketStateToServer(walletAddress);

    if (!persistedToServer) {
      setStatus("success");
      setStatusMessage("The market is live locally. Shared database sync is unavailable right now.");
    } else {
      setStatus("success");
      const categoryLabel = predictionMarketCategories.find((c) => c.id === nextMarket.categoryId)?.label ?? "selected";
      setStatusMessage(`${nextMarket.title} is now live inside the ${categoryLabel} section.`);
    }

    void appendCentralAdminLog({
      adminWallet: walletAddress,
      action: "create_prediction",
      targetId: nextMarket.id,
      details: JSON.stringify({
        categoryId: nextMarket.categoryId,
        title: nextMarket.title,
        marketType: nextMarket.marketType,
        visualType: nextMarket.visualType,
        options: nextMarket.options?.map((o) => ({
          id: o.id,
          label: o.label,
          oddsMultiplier: o.oddsMultiplier,
        })),
      }),
    });

    setDraft(createInitialDraft());
    setShowForm(false);
  }

  // ── JSX ──
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingMarketId ? "Edit Prediction Market" : "Create Prediction Market"}</CardTitle>
              <CardDescription>
                {editingMarketId
                  ? "Update the details of this prediction event"
                  : "Add a new prediction event for users to bet on"}
              </CardDescription>
            </div>
            <Button
              onClick={() => (showForm ? handleCancelForm() : handleOpenCreateForm())}
              variant={showForm ? "secondary" : "default"}
              size="sm"
              className="gap-2"
            >
              <Plus size={16} />
              {showForm ? "Cancel" : "New Market"}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="space-y-6 border-t pt-6">

            {/* Status alert */}
            {status !== "idle" && (
              <Alert variant={status === "error" ? "destructive" : "default"}>
                {status === "success"
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{status === "success" ? "Market published" : "Action required"}</AlertTitle>
                <AlertDescription>{statusMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-2">

              {/* ── Left column: basics ── */}
              <div className="space-y-4 rounded-2xl border border-orange-100 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
                <div>
                  <p className="text-sm font-semibold text-zinc-950 dark:text-white">Market basics</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Choose the section, set the market title, then add the date and resolution rule users will see.
                  </p>
                </div>

                <label className="block text-xs uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Section</label>
                <select
                  value={draft.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  className="flex h-10 w-full rounded-2xl border border-orange-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-orange-300 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                >
                  {predictionMarketCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <Input
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Market title"
                  className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                />

                <Input
                  value={draft.eventDateLabel}
                  onChange={(e) => set("eventDateLabel", e.target.value)}
                  placeholder="Visible event date"
                  className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                />

                <Textarea
                  value={draft.resolutionLabel}
                  onChange={(e) => set("resolutionLabel", e.target.value)}
                  placeholder="Resolution details"
                  className="min-h-24 border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                />

                {/* Market format */}
                <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 dark:border-white/10 dark:bg-black/20">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white">Market format</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      Pick the market structure first, then activate a third outcome only if this event needs three choices.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {(["vs", "simple"] as AdminMarketCreationMode[]).map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant={draft.mode === m ? "default" : "outline"}
                        className={
                          draft.mode === m
                            ? "min-h-14 w-full justify-start rounded-2xl bg-orange-500 px-4 py-3 text-left text-white hover:bg-orange-400"
                            : "min-h-14 w-full justify-start rounded-2xl border-orange-200 bg-white px-4 py-3 text-left text-zinc-950 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                        }
                        onClick={() => set("mode", m)}
                      >
                        <span className="block text-sm font-semibold">{m === "vs" ? "VS market" : "Simple market"}</span>
                        <span className="mt-1 block text-xs opacity-80">
                          {m === "vs" ? "Two teams, two logos, head-to-head event." : "One subject, one circular logo, simple outcome flow."}
                        </span>
                      </Button>
                    ))}

                    <Button
                      type="button"
                      variant={draft.enableThirdOption ? "default" : "outline"}
                      className={
                        draft.enableThirdOption
                          ? "min-h-14 w-full justify-start rounded-2xl bg-orange-500 px-4 py-3 text-left text-white hover:bg-orange-400"
                          : "min-h-14 w-full justify-start rounded-2xl border-orange-200 bg-white px-4 py-3 text-left text-zinc-950 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                      }
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          enableThirdOption: !prev.enableThirdOption,
                          thirdOptionLabel: prev.thirdOptionLabel || (prev.mode === "vs" ? "X" : "Third option"),
                        }))
                      }
                    >
                      <span className="block text-sm font-semibold">
                        {draft.enableThirdOption ? "3 choices active" : "Enable 3 choices"}
                      </span>
                      <span className="mt-1 block text-xs opacity-80">Add a third outcome like X, draw, or a custom side.</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Right column: options ── */}
              <div className="space-y-4 rounded-2xl border border-orange-100 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
                <div>
                  <p className="text-sm font-semibold text-zinc-950 dark:text-white">Market options</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Add the names, circular images, and odds that will appear on the live market card.
                  </p>
                </div>

                {draft.mode === "vs" ? (
                  <>
                    {/* Left competitor */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={draft.leftCompetitorName}
                        onChange={(e) => set("leftCompetitorName", e.target.value)}
                        placeholder="First team name"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                      />
                      <Input
                        type="file" accept="image/*"
                        onChange={(e) => void handleImageUpload("leftCompetitorImageSrc", e.target.files)}
                        className="border-orange-200 bg-white text-zinc-950 file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-orange-700 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:file:bg-orange-500/15 dark:file:text-orange-300"
                      />
                    </div>
                    {draft.leftCompetitorImageSrc && (
                      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-3 py-3 dark:border-white/10 dark:bg-zinc-950/80">
                        <img src={draft.leftCompetitorImageSrc} alt="First team preview" className="size-12 rounded-full object-cover" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">First team circular preview</span>
                      </div>
                    )}

                    {/* Right competitor */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={draft.rightCompetitorName}
                        onChange={(e) => set("rightCompetitorName", e.target.value)}
                        placeholder="Second team name"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                      />
                      <Input
                        type="file" accept="image/*"
                        onChange={(e) => void handleImageUpload("rightCompetitorImageSrc", e.target.files)}
                        className="border-orange-200 bg-white text-zinc-950 file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-orange-700 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:file:bg-orange-500/15 dark:file:text-orange-300"
                      />
                    </div>
                    {draft.rightCompetitorImageSrc && (
                      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-3 py-3 dark:border-white/10 dark:bg-zinc-950/80">
                        <img src={draft.rightCompetitorImageSrc} alt="Second team preview" className="size-12 rounded-full object-cover" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Second team circular preview</span>
                      </div>
                    )}

                    {/* Odds */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input type="number" min="1.01" step="0.01" value={draft.firstOdds}
                        onChange={(e) => set("firstOdds", e.target.value)} placeholder="First team odds"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                      <Input type="number" min="1.01" step="0.01" value={draft.secondOdds}
                        onChange={(e) => set("secondOdds", e.target.value)} placeholder="Second team odds"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Simple mode */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input value={draft.singleName}
                        onChange={(e) => set("singleName", e.target.value)} placeholder="Single market name"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                      <Input type="file" accept="image/*"
                        onChange={(e) => void handleImageUpload("singleImageSrc", e.target.files)}
                        className="border-orange-200 bg-white text-zinc-950 file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-orange-700 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:file:bg-orange-500/15 dark:file:text-orange-300"
                      />
                    </div>
                    {draft.singleImageSrc && (
                      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-3 py-3 dark:border-white/10 dark:bg-zinc-950/80">
                        <img src={draft.singleImageSrc} alt="Single market preview" className="size-12 rounded-full object-cover" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Single logo circular preview</span>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input type="number" min="1.01" step="0.01" value={draft.firstOdds}
                        onChange={(e) => set("firstOdds", e.target.value)} placeholder="Yes odds"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                      <Input type="number" min="1.01" step="0.01" value={draft.secondOdds}
                        onChange={(e) => set("secondOdds", e.target.value)} placeholder="No odds"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                    </div>
                  </>
                )}

                {/* Third option */}
                {draft.enableThirdOption && (
                  <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/80 p-4 dark:border-white/10 dark:bg-black/20">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Third option details</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input value={draft.thirdOptionLabel}
                        onChange={(e) => set("thirdOptionLabel", e.target.value)}
                        placeholder={draft.mode === "vs" ? "Draw label, for example X" : "Third choice label"}
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                      <Input type="number" min="1.01" step="0.01" value={draft.thirdOptionOdds}
                        onChange={(e) => set("thirdOptionOdds", e.target.value)} placeholder="Third option odds"
                        className="border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                    </div>
                    <Input type="file" accept="image/*"
                      onChange={(e) => void handleImageUpload("thirdOptionImageSrc", e.target.files)}
                      className="border-orange-200 bg-white text-zinc-950 file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-orange-700 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:file:bg-orange-500/15 dark:file:text-orange-300"
                    />
                    {draft.thirdOptionImageSrc && (
                      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-3 py-3 dark:border-white/10 dark:bg-zinc-950/80">
                        <img src={draft.thirdOptionImageSrc} alt="Third option preview" className="size-12 rounded-full object-cover" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Third option circular preview</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Extra notes */}
                <Textarea value={draft.extraNotes}
                  onChange={(e) => set("extraNotes", e.target.value)}
                  placeholder="Optional option notes shown inside the market"
                  className="min-h-24 border-orange-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                />

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    type="button"
                    className="h-11 rounded-2xl bg-orange-500 px-4 text-white hover:bg-orange-400"
                    onClick={() => void handleSubmit()}
                  >
                    {editingMarketId ? <CheckCircle2 className="size-4" /> : <Plus className="size-4" />}
                    {editingMarketId ? "Save changes" : "Publish market"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-orange-200 bg-white px-4 text-zinc-950 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Existing markets (Read / Update / Delete) ── */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Markets</CardTitle>
          <CardDescription>
            {markets.length === 0
              ? "No admin-created markets yet."
              : `${markets.length} market${markets.length > 1 ? "s" : ""} created from this panel.`}
          </CardDescription>
        </CardHeader>
        {markets.length > 0 && (
          <CardContent className="space-y-3 border-t pt-6">
            {markets.map((market) => {
              const hasPositions = marketIdsWithPositions.has(market.id);
              const categoryLabel = predictionMarketCategories.find((c) => c.id === market.categoryId)?.label ?? market.categoryId;

              return (
                <div
                  key={market.id}
                  className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-zinc-950/70"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">{market.title}</p>
                      <Badge variant="secondary" className="shrink-0 text-xs">{categoryLabel}</Badge>
                      {hasPositions && (
                        <Badge variant="outline" className="shrink-0 gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <Lock size={11} /> Has positions
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {market.visualType === "vs"
                        ? `${market.leftCompetitorName ?? "Team A"} vs ${market.rightCompetitorName ?? "Team B"}`
                        : market.singleName ?? "Single market"}
                      {" · "}
                      Created {new Date(market.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {confirmDeleteId === market.id ? (
                      <>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Delete this market?</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-8 gap-1 rounded-xl px-3"
                          onClick={() => void handleDeleteMarket(market.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 rounded-xl px-3"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          <X size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={hasPositions}
                          title={hasPositions ? "This market has positions and can no longer be edited." : undefined}
                          className="h-8 gap-1 rounded-xl px-3"
                          onClick={() => handleStartEdit(market)}
                        >
                          <Pencil size={14} /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={hasPositions}
                          title={hasPositions ? "This market has positions and can no longer be deleted." : undefined}
                          className="h-8 gap-1 rounded-xl px-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          onClick={() => setConfirmDeleteId(market.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
});

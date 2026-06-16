import type { RegistryWalletRecord } from "@/components/octopus-market/octopus-central-registry";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type AIListingPlanId = "free" | "starter" | "builder";
export type AIListingStatus = "pending" | "approved" | "rejected";
export type AIListingBadge = "none" | "blue" | "gold";

export type AIListingSubmission = {
  id: string;
  walletAddress: string;
  displayName: string;
  twitterHandle: string;
  iconSrc: string;
  iconName: string;
  websiteUrl: string;
  description: string;
  socialUrl: string;
  guideFileName: string;
  guideFileUrl: string;
  planId: AIListingPlanId;
  billingLabel: string;
  amountUsd: number;
  autoRenewEnabled: boolean;
  submittedAt: number;
  updatedAt: number;
  status: AIListingStatus;
  badge: AIListingBadge;
  adminNotes?: string;
  paymentReference?: string;
  paymentRequestId?: string;
  visibleInExplore: boolean;
  visitorCount: number;
  uniqueVisitorKeys: string[];
};

const aiListingStorageKey = "octopus-market-ai-listings-v2";
const aiListingResetVersionKey = "octopus-market-ai-listings-reset-version";
const aiListingResetVersion = "octopus-market-ai-listings-reset-v3";
const aiListingEventName = "octopus-market-ai-listings-updated";
const aiListingStorageEventName = "octopus-market-ai-listings-storage";
const aiListingChannelName = "octopus-market-ai-listings-channel";
const aiListingApiBase = "/api/ai-listings";

let aiListingBroadcastChannel: BroadcastChannel | null = null;
let aiListingEventSource: EventSource | null = null;
let hasStartedAIListingServerSync = false;
let aiListingsCache: AIListingSubmission[] = [];
let hasHydratedAIListingCache = false;

function shouldAttemptAIListingServerSync() {
  if (typeof window === "undefined") {
    return false;
  }

  if (import.meta.env.VITE_ENABLE_SERVER_SYNC === "false") {
    return false;
  }

  return true;
}

function getAIListingBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!aiListingBroadcastChannel) {
    aiListingBroadcastChannel = new BroadcastChannel(aiListingChannelName);
  }

  return aiListingBroadcastChannel;
}

function normalizeAIListingSubmission(listing: Partial<AIListingSubmission> | AIListingSubmission): AIListingSubmission {
  return {
    id: listing.id || `listing-${Date.now()}`,
    walletAddress: listing.walletAddress || "",
    displayName: listing.displayName || "",
    twitterHandle: listing.twitterHandle || "",
    iconSrc: listing.iconSrc || "",
    iconName: listing.iconName || "",
    websiteUrl: listing.websiteUrl || "",
    description: listing.description || "",
    socialUrl: listing.socialUrl || "",
    guideFileName: listing.guideFileName || "",
    guideFileUrl: listing.guideFileUrl || "",
    planId: listing.planId ?? "starter",
    billingLabel: listing.billingLabel || "$0 / free",
    amountUsd: typeof listing.amountUsd === "number" ? listing.amountUsd : 0,
    autoRenewEnabled: Boolean(listing.autoRenewEnabled),
    submittedAt: typeof listing.submittedAt === "number" ? listing.submittedAt : Date.now(),
    updatedAt: typeof listing.updatedAt === "number" ? listing.updatedAt : Date.now(),
    status: listing.status ?? "pending",
    badge: listing.badge ?? "none",
    adminNotes: listing.adminNotes,
    paymentReference: listing.paymentReference,
    paymentRequestId: listing.paymentRequestId,
    visibleInExplore: listing.visibleInExplore ?? true,
    visitorCount: typeof listing.visitorCount === "number" ? listing.visitorCount : 0,
    uniqueVisitorKeys: Array.isArray(listing.uniqueVisitorKeys) ? listing.uniqueVisitorKeys : [],
  };
}

function getAIListingStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

function emitAIListingUpdate(source: "local" | "server" = "local") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(aiListingEventName, { detail: source }));

  if (source === "local") {
    getAIListingBroadcastChannel()?.postMessage({ type: aiListingStorageEventName, source });
  }
}

function safeParseListings(rawValue: string | null) {
  if (!rawValue) {
    return [] as AIListingSubmission[];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as AIListingSubmission[];
    return Array.isArray(parsedValue) ? parsedValue.map(normalizeAIListingSubmission) : [];
  } catch {
    return [] as AIListingSubmission[];
  }
}

function hydrateAIListingCache() {
  if (typeof window === "undefined" || hasHydratedAIListingCache) {
    return;
  }

  const storage = getAIListingStorage();
  aiListingsCache = safeParseListings(storage?.getItem(aiListingStorageKey) ?? null);
  hasHydratedAIListingCache = true;
}

function serializeAIListingState(listings: AIListingSubmission[]) {
  try {
    return JSON.stringify(listings);
  } catch {
    return "";
  }
}

function persistAIListingCache(listings: AIListingSubmission[]) {
  if (typeof window === "undefined") {
    return;
  }

  const storage = getAIListingStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(aiListingStorageKey, JSON.stringify(listings));
  } catch {
    return;
  }
}

function replaceAIListingState(nextListings: AIListingSubmission[], source: "local" | "server" = "local") {
  const normalizedListings = nextListings.map(normalizeAIListingSubmission).slice(0, 300).sort(
    (left, right) => right.submittedAt - left.submittedAt
  );
  const currentSerializedState = serializeAIListingState(aiListingsCache);
  const nextSerializedState = serializeAIListingState(normalizedListings);

  if (currentSerializedState === nextSerializedState) {
    hasHydratedAIListingCache = true;
    return;
  }

  aiListingsCache = normalizedListings;
  hasHydratedAIListingCache = true;
  persistAIListingCache(normalizedListings);
  emitAIListingUpdate(source);
}

function mapRowToListing(row: Record<string, unknown>): AIListingSubmission {
  return normalizeAIListingSubmission({
    id: row.id as string,
    walletAddress: row.wallet_address as string,
    displayName: row.display_name as string,
    twitterHandle: row.twitter_handle as string,
    iconSrc: row.icon_src as string,
    iconName: row.icon_name as string,
    websiteUrl: row.website_url as string,
    description: row.description as string,
    socialUrl: row.social_url as string,
    guideFileName: row.guide_file_name as string,
    guideFileUrl: row.guide_file_url as string,
    planId: row.plan_id as AIListingPlanId,
    billingLabel: row.billing_label as string,
    amountUsd: row.amount_usd as number,
    autoRenewEnabled: row.auto_renew_enabled as boolean,
    submittedAt: new Date(row.submitted_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
    status: row.status as AIListingStatus,
    badge: row.badge as AIListingBadge,
    adminNotes: (row.admin_notes as string) ?? undefined,
    paymentReference: (row.payment_reference as string) ?? undefined,
    paymentRequestId: (row.payment_request_id as string) ?? undefined,
    visibleInExplore: row.visible_in_explore as boolean,
    visitorCount: row.visitor_count as number,
    uniqueVisitorKeys: row.unique_visitor_keys as string[],
  });
}

async function fetchAIListingStateFromServer() {
  if (typeof window === "undefined" || !shouldAttemptAIListingServerSync()) {
    hasStartedAIListingServerSync = true;
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from("ai_listings")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (data) {
        replaceAIListingState(data.map((row) => mapRowToListing(row as unknown as Record<string, unknown>)), "server");
      }
    } catch {
      return;
    }
    return;
  }

  try {
    const response = await fetch(aiListingApiBase, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { listings?: AIListingSubmission[] };
    replaceAIListingState(Array.isArray(payload.listings) ? payload.listings : [], "server");
  } catch {
    return;
  }
}

function startAIListingServerSync() {
  if (typeof window === "undefined" || hasStartedAIListingServerSync) {
    return;
  }

  if (!shouldAttemptAIListingServerSync()) {
    hasStartedAIListingServerSync = true;
    return;
  }

  hasStartedAIListingServerSync = true;
  void fetchAIListingStateFromServer();

  if (isSupabaseConfigured()) {
    supabase
      .channel("ai-listings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_listings" }, () => {
        void fetchAIListingStateFromServer();
      })
      .subscribe();
    return;
  }

  if (typeof EventSource === "undefined") {
    return;
  }

  try {
    aiListingEventSource = new EventSource(`${aiListingApiBase}/stream`);
    aiListingEventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { listings?: AIListingSubmission[] };
        replaceAIListingState(Array.isArray(payload.listings) ? payload.listings : [], "server");
      } catch {
        return;
      }
    };
  } catch {
    return;
  }
}

async function postAIListingStateToServer(listings: AIListingSubmission[]) {
  if (typeof window === "undefined" || !shouldAttemptAIListingServerSync()) {
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const rows = listings.map((l) => ({
        id: l.id,
        wallet_address: l.walletAddress,
        display_name: l.displayName,
        twitter_handle: l.twitterHandle,
        icon_src: l.iconSrc,
        icon_name: l.iconName,
        website_url: l.websiteUrl,
        description: l.description,
        social_url: l.socialUrl,
        guide_file_name: l.guideFileName,
        guide_file_url: l.guideFileUrl,
        plan_id: l.planId,
        billing_label: l.billingLabel,
        amount_usd: l.amountUsd,
        auto_renew_enabled: l.autoRenewEnabled,
        submitted_at: new Date(l.submittedAt).toISOString(),
        updated_at: new Date(l.updatedAt).toISOString(),
        status: l.status,
        badge: l.badge,
        admin_notes: l.adminNotes ?? null,
        payment_reference: l.paymentReference ?? null,
        payment_request_id: l.paymentRequestId ?? null,
        visible_in_explore: l.visibleInExplore,
        visitor_count: l.visitorCount,
        unique_visitor_keys: l.uniqueVisitorKeys,
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from("ai_listings").upsert(rows, { onConflict: "id" });
        if (error) {
          console.error("[supabase] ai_listings upsert failed:", error.message, error.details);
        }
      }
    } catch (err) {
      console.error("[supabase] postAIListingStateToServer exception:", err);
      return;
    }
    return;
  }

  try {
    await fetch(`${aiListingApiBase}/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ listings: listings.map(normalizeAIListingSubmission) }),
    });
  } catch {
    return;
  }
}

function ensureAIListingStoreReset() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentResetVersion = window.localStorage.getItem(aiListingResetVersionKey);

    if (currentResetVersion === aiListingResetVersion) {
      return;
    }

    window.localStorage.removeItem(aiListingStorageKey);
    window.localStorage.setItem(aiListingResetVersionKey, aiListingResetVersion);
    emitAIListingUpdate();
  } catch {
    return;
  }
}

export function readAIListings() {
  if (typeof window === "undefined") {
    return [] as AIListingSubmission[];
  }

  ensureAIListingStoreReset();
  hydrateAIListingCache();
  startAIListingServerSync();

  const storage = getAIListingStorage();
  const storedListings = aiListingsCache.length > 0 ? aiListingsCache : safeParseListings(storage?.getItem(aiListingStorageKey) ?? null);
  return storedListings.slice().sort((left, right) => right.submittedAt - left.submittedAt);
}

export function writeAIListings(listings: AIListingSubmission[]) {
  if (typeof window === "undefined") {
    return;
  }

  ensureAIListingStoreReset();

  const normalizedListings = listings.map(normalizeAIListingSubmission).slice(0, 300).sort(
    (left, right) => right.submittedAt - left.submittedAt
  );

  replaceAIListingState(normalizedListings, "local");
  void postAIListingStateToServer(normalizedListings);
}

export function appendAIListingSubmission(submission: AIListingSubmission) {
  const currentListings = readAIListings();
  const nextListings = [submission, ...currentListings.filter((item) => item.id !== submission.id)].slice(0, 300);
  writeAIListings(nextListings);
  return nextListings;
}

export function updateAIListingSubmission(
  submissionId: string,
  updater: (submission: AIListingSubmission) => AIListingSubmission
) {
  const nextListings = readAIListings().map((submission) =>
    submission.id === submissionId ? updater(submission) : submission
  );

  writeAIListings(nextListings);
  return nextListings;
}

export function trackAIListingVisit(submissionId: string, visitorKey: string) {
  if (!visitorKey.trim()) {
    return readAIListings().find((listing) => listing.id === submissionId) ?? null;
  }

  let updatedListing: AIListingSubmission | null = null;

  updateAIListingSubmission(submissionId, (submission) => {
    if (submission.uniqueVisitorKeys.includes(visitorKey)) {
      updatedListing = submission;
      return submission;
    }

    updatedListing = {
      ...submission,
      visitorCount: submission.visitorCount + 1,
      uniqueVisitorKeys: [...submission.uniqueVisitorKeys, visitorKey].slice(-2000),
      updatedAt: Date.now(),
    };

    return updatedListing;
  });

  return updatedListing;
}

export function subscribeToAIListings(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => {
    listener();
  };

  window.addEventListener(aiListingEventName, handleChange);
  window.addEventListener("storage", handleChange);

  const broadcastChannel = getAIListingBroadcastChannel();
  broadcastChannel?.addEventListener("message", handleChange);

  return () => {
    window.removeEventListener(aiListingEventName, handleChange);
    window.removeEventListener("storage", handleChange);
    broadcastChannel?.removeEventListener("message", handleChange);
  };
}

export function countApprovedListingsForWallet(walletAddress: string) {
  return readAIListings().filter(
    (listing) => listing.walletAddress === walletAddress && listing.status === "approved"
  ).length;
}

export function getDefaultListingSubmissionProfile(walletRecord: RegistryWalletRecord | null) {
  return {
    displayName: walletRecord?.displayName || walletRecord?.username || "",
    twitterHandle: walletRecord?.twitterHandle || "",
  };
}

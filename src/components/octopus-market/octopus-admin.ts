import {
  appendCentralAdminLog,
  clearCentralAdminControlData,
  syncPaymentRecordToCentralRegistry,
  trackCentralWalletConnection,
  trackCentralWalletActivity,
} from "@/components/octopus-market/octopus-central-registry";
import { syncPredictionEntriesForAdminDecision } from "@/components/octopus-market/prediction-market-store";
import { scanIncomingTreasuryPayments } from "@/components/octopus-market/solana-pay";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type AdminPaymentFlow = "prediction" | "launch" | "listing";
export type AdminPaymentStatus = "pending" | "approved" | "rejected";

export type AdminPaymentNotification = {
  id: string;
  paymentRequestId: string;
  paymentReference: string;
  flow: AdminPaymentFlow;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  marketId?: string;
  selectionId?: string;
  selectionLabel?: string;
  username?: string;
  userWallet: string;
  recipientWallet: string;
  amountUsdc: number;
  reserveFeeUsdc: number;
  totalPaidUsdc: number;
  createdAt: number;
  status: AdminPaymentStatus;
  reviewedAt?: number;
  reviewedByWallet?: string;
};

export type ConnectedWalletSession = {
  address: string;
  firstSeenAt: number;
  lastSeenAt: number;
};

type TrackConnectedWalletOptions = {
  isAdminWallet?: boolean;
  activityLabel?: string;
};

const adminNotificationsStorageKey = "octopus-market-admin-notifications-v2";
const connectedWalletsStorageKey = "octopus-market-connected-wallets-v1";
const adminStorageEventName = "octopus-market-admin-storage";
const adminStorageChannelName = "octopus-market-admin-storage";
const adminNotificationsApiBase = "/api/admin-notifications";

let adminStorageBroadcastChannel: BroadcastChannel | null = null;
let adminNotificationsEventSource: EventSource | null = null;
let hasStartedAdminNotificationsServerSync = false;
let hasHydratedAdminNotificationsCache = false;
let adminNotificationsCache: AdminPaymentNotification[] = [];

function shouldAttemptAdminNotificationsServerSync() {
  if (typeof window === "undefined") {
    return false;
  }

  if (import.meta.env.DEV) {
    return true;
  }

  return import.meta.env.VITE_ENABLE_SERVER_SYNC === "true";
}

function getAdminStorageBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!adminStorageBroadcastChannel) {
    adminStorageBroadcastChannel = new BroadcastChannel(adminStorageChannelName);
  }

  return adminStorageBroadcastChannel;
}

function emitAdminStorageUpdate() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(adminStorageEventName));
  getAdminStorageBroadcastChannel()?.postMessage({ type: "admin-storage-update" });
}

function safeParseArray<T>(rawValue: string | null): T[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as T[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function readStringMetadataValue(value: string | number | boolean | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumberMetadataValue(value: string | number | boolean | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function hydrateAdminNotificationsCache() {
  if (typeof window === "undefined" || hasHydratedAdminNotificationsCache) {
    return;
  }

  adminNotificationsCache = safeParseArray<AdminPaymentNotification>(window.localStorage.getItem(adminNotificationsStorageKey));
  hasHydratedAdminNotificationsCache = true;
}

function persistAdminNotificationsCache() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(adminNotificationsStorageKey, JSON.stringify(adminNotificationsCache));
  } catch {
    return;
  }
}

function replaceAdminNotificationsState(notifications: AdminPaymentNotification[], source: "local" | "server" = "local") {
  adminNotificationsCache = notifications;
  hasHydratedAdminNotificationsCache = true;
  persistAdminNotificationsCache();
  emitAdminStorageUpdate();

  if (source === "local") {
    void postAdminNotificationsStateToServer();
  }
}

async function fetchAdminNotificationsStateFromServer() {
  if (typeof window === "undefined" || !shouldAttemptAdminNotificationsServerSync()) {
    hasStartedAdminNotificationsServerSync = true;
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const notifications: AdminPaymentNotification[] = data.map((row) => ({
          id: row.id,
          paymentRequestId: row.payment_request_id,
          paymentReference: row.payment_reference,
          flow: row.flow,
          title: row.title,
          subtitle: row.subtitle ?? undefined,
          categoryLabel: row.category_label ?? undefined,
          marketId: row.market_id ?? undefined,
          selectionId: row.selection_id ?? undefined,
          selectionLabel: row.selection_label ?? undefined,
          username: row.username ?? undefined,
          userWallet: row.user_wallet,
          recipientWallet: row.recipient_wallet,
          amountUsdc: Number(row.amount_usdc),
          reserveFeeUsdc: Number(row.reserve_fee_usdc),
          totalPaidUsdc: Number(row.total_paid_usdc),
          createdAt: new Date(row.created_at).getTime(),
          status: row.status,
          reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).getTime() : undefined,
          reviewedByWallet: row.reviewed_by_wallet ?? undefined,
        }));
        replaceAdminNotificationsState(notifications, "server");
      }
    } catch {
      return;
    }
    return;
  }

  try {
    const response = await fetch(adminNotificationsApiBase, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { notifications?: AdminPaymentNotification[] };
    replaceAdminNotificationsState(Array.isArray(payload.notifications) ? payload.notifications : [], "server");
  } catch {
    return;
  }
}

function startAdminNotificationsServerSync() {
  if (typeof window === "undefined" || hasStartedAdminNotificationsServerSync) {
    return;
  }

  if (!shouldAttemptAdminNotificationsServerSync()) {
    hasStartedAdminNotificationsServerSync = true;
    return;
  }

  hasStartedAdminNotificationsServerSync = true;
  void fetchAdminNotificationsStateFromServer();

  if (isSupabaseConfigured()) {
    supabase
      .channel("admin-notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_notifications" }, () => {
        void fetchAdminNotificationsStateFromServer();
      })
      .subscribe();
    return;
  }

  if (typeof EventSource === "undefined") {
    return;
  }

  try {
    adminNotificationsEventSource = new EventSource(`${adminNotificationsApiBase}/stream`);
    adminNotificationsEventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { notifications?: AdminPaymentNotification[] };
        replaceAdminNotificationsState(Array.isArray(payload.notifications) ? payload.notifications : [], "server");
      } catch {
        return;
      }
    };

    adminNotificationsEventSource.onerror = () => {
      adminNotificationsEventSource?.close();
      adminNotificationsEventSource = null;
      hasStartedAdminNotificationsServerSync = true;
    };
  } catch {
    hasStartedAdminNotificationsServerSync = false;
  }
}

async function postAdminNotificationsStateToServer() {
  if (typeof window === "undefined") {
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const rows = adminNotificationsCache.map((n) => ({
        id: n.id,
        payment_request_id: n.paymentRequestId,
        payment_reference: n.paymentReference,
        flow: n.flow,
        title: n.title,
        subtitle: n.subtitle ?? null,
        category_label: n.categoryLabel ?? null,
        market_id: n.marketId ?? null,
        selection_id: n.selectionId ?? null,
        selection_label: n.selectionLabel ?? null,
        username: n.username ?? null,
        user_wallet: n.userWallet,
        recipient_wallet: n.recipientWallet,
        amount_usdc: n.amountUsdc,
        reserve_fee_usdc: n.reserveFeeUsdc,
        total_paid_usdc: n.totalPaidUsdc,
        created_at: new Date(n.createdAt).toISOString(),
        status: n.status,
        reviewed_at: n.reviewedAt ? new Date(n.reviewedAt).toISOString() : null,
        reviewed_by_wallet: n.reviewedByWallet ?? null,
      }));

      if (rows.length > 0) {
        await supabase.from("admin_notifications").upsert(rows, { onConflict: "id" });
      }
    } catch {
      return;
    }
    return;
  }

  try {
    await fetch(`${adminNotificationsApiBase}/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        notifications: adminNotificationsCache,
      }),
    });
  } catch {
    return;
  }
}

export function readAdminPaymentNotifications() {
  if (typeof window === "undefined") {
    return [] as AdminPaymentNotification[];
  }

  hydrateAdminNotificationsCache();
  startAdminNotificationsServerSync();
  return adminNotificationsCache;
}

export function writeAdminPaymentNotifications(notifications: AdminPaymentNotification[]) {
  if (typeof window === "undefined") {
    return;
  }

  replaceAdminNotificationsState(notifications);
  notifications.forEach((notification) => {
    void syncPaymentRecordToCentralRegistry(notification);
  });
}

export async function clearAdminControlHistory() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(adminNotificationsStorageKey);
    } catch {
      // noop
    }
  }

  writeAdminPaymentNotifications([]);
  await clearCentralAdminControlData();
}

export function upsertAdminPaymentNotification(notification: AdminPaymentNotification) {
  const currentNotifications = readAdminPaymentNotifications();
  const existingIndex = currentNotifications.findIndex(
    (currentNotification) =>
      currentNotification.paymentRequestId === notification.paymentRequestId ||
      currentNotification.paymentReference === notification.paymentReference
  );

  const nextNotifications = [...currentNotifications];

  if (existingIndex >= 0) {
    nextNotifications[existingIndex] = {
      ...nextNotifications[existingIndex],
      ...notification,
    };
  } else {
    nextNotifications.unshift(notification);
  }

  writeAdminPaymentNotifications(nextNotifications.slice(0, 250));
  void trackCentralWalletActivity(notification.userWallet, `${notification.flow} payment ${notification.status}`, {
    role: "user",
    timestamp: notification.reviewedAt ?? notification.createdAt,
  });
  void trackCentralWalletActivity(notification.recipientWallet, `${notification.flow} payment received`, {
    role: "admin",
    timestamp: notification.reviewedAt ?? notification.createdAt,
  });
}

export function createAdminPaymentNotificationFromRequest(
  paymentRequest: import("@/components/octopus-market/solana-pay").PaymentRequest
) {
  const metadata = paymentRequest.metadata ?? {};
  const reserveFeeUsdc = readNumberMetadataValue(metadata.reserveFee, 0);
  const totalPaidUsdc = readNumberMetadataValue(metadata.totalChargeUsdc, paymentRequest.amount);
  const createdAt = paymentRequest.validatedAt ?? paymentRequest.createdAt ?? Date.now();

  if (paymentRequest.kind === "prediction") {
    const amountUsdc = readNumberMetadataValue(metadata.stake, Math.max(0, totalPaidUsdc - reserveFeeUsdc));
    const categoryLabel = readStringMetadataValue(metadata.categoryLabel);
    const selectionLabel = readStringMetadataValue(metadata.selectionLabel);
    const username = readStringMetadataValue(metadata.username) || undefined;

    return {
      id: `admin-${paymentRequest.reference}`,
      paymentRequestId: paymentRequest.id,
      paymentReference: paymentRequest.reference,
      flow: "prediction",
      title: readStringMetadataValue(metadata.marketTitle, paymentRequest.message || "Prediction market payment"),
      subtitle: [selectionLabel, categoryLabel].filter(Boolean).join(" · ") || paymentRequest.memo || "Prediction position",
      categoryLabel: categoryLabel || undefined,
      marketId: readStringMetadataValue(metadata.marketId) || undefined,
      selectionId: readStringMetadataValue(metadata.selectionId) || undefined,
      selectionLabel: selectionLabel || undefined,
      username,
      userWallet: paymentRequest.walletAddress,
      recipientWallet: paymentRequest.recipient,
      amountUsdc,
      reserveFeeUsdc,
      totalPaidUsdc,
      createdAt,
      status: "pending",
    } satisfies AdminPaymentNotification;
  }

  if (paymentRequest.kind === "launch") {
    const tokenName = readStringMetadataValue(metadata.tokenName, paymentRequest.message || "Token");
    const symbol = readStringMetadataValue(metadata.symbol);
    const launchOption = readStringMetadataValue(metadata.launchOption, "Launch option");
    const amountUsdc = readNumberMetadataValue(metadata.feeAmountUsdc, Math.max(0, totalPaidUsdc - reserveFeeUsdc));
    const username = readStringMetadataValue(metadata.username) || undefined;

    return {
      id: `admin-${paymentRequest.reference}`,
      paymentRequestId: paymentRequest.id,
      paymentReference: paymentRequest.reference,
      flow: "launch",
      title: `${tokenName} launch payment`,
      subtitle: [launchOption, symbol].filter(Boolean).join(" · ") || paymentRequest.memo || "Launch flow",
      username,
      userWallet: paymentRequest.walletAddress,
      recipientWallet: paymentRequest.recipient,
      amountUsdc,
      reserveFeeUsdc,
      totalPaidUsdc,
      createdAt,
      status: "pending",
    } satisfies AdminPaymentNotification;
  }

  const plan = readStringMetadataValue(metadata.plan, paymentRequest.message || "AI listing");
  const amountUsdc = readNumberMetadataValue(metadata.listingAmountUsdc, Math.max(0, totalPaidUsdc - reserveFeeUsdc));
  const holderDiscount = metadata.holderDiscount === true;
  const username = readStringMetadataValue(metadata.username) || undefined;

  return {
    id: `admin-${paymentRequest.reference}`,
    paymentRequestId: paymentRequest.id,
    paymentReference: paymentRequest.reference,
    flow: "listing",
    title: `${plan} AI listing payment`,
    subtitle: holderDiscount ? "Holder discount applied" : paymentRequest.memo || "Standard listing flow",
    username,
    userWallet: paymentRequest.walletAddress,
    recipientWallet: paymentRequest.recipient,
    amountUsdc,
    reserveFeeUsdc,
    totalPaidUsdc,
    createdAt,
    status: "pending",
  } satisfies AdminPaymentNotification;
}

export function notifyAdminForValidatedPayment(
  paymentRequest: import("@/components/octopus-market/solana-pay").PaymentRequest
) {
  const notification = createAdminPaymentNotificationFromRequest(paymentRequest);
  upsertAdminPaymentNotification(notification);
  return notification;
}

export function updateAdminPaymentNotificationStatus(
  paymentReference: string,
  status: AdminPaymentStatus,
  reviewedByWallet: string
) {
  const currentNotifications = readAdminPaymentNotifications();
  const nextNotifications = currentNotifications.map((notification) =>
    notification.paymentReference === paymentReference
      ? {
          ...notification,
          status,
          reviewedAt: Date.now(),
          reviewedByWallet,
        }
      : notification
  );

  writeAdminPaymentNotifications(nextNotifications);
  const updatedNotification = nextNotifications.find((notification) => notification.paymentReference === paymentReference);

  if (updatedNotification) {
    syncPredictionEntriesForAdminDecision(paymentReference, status);
    void syncPaymentRecordToCentralRegistry(updatedNotification);
    void appendCentralAdminLog({
      adminWallet: reviewedByWallet,
      action: status === "approved" ? "approve_payment" : "reject_payment",
      targetId: paymentReference,
      details: `${updatedNotification.flow} payment ${status} for ${updatedNotification.userWallet}`,
    });
    void trackCentralWalletActivity(updatedNotification.userWallet, `${updatedNotification.flow} payment ${status}`, {
      role: "user",
      timestamp: updatedNotification.reviewedAt ?? Date.now(),
    });
    void trackCentralWalletActivity(reviewedByWallet, `${updatedNotification.flow} payment ${status} by admin`, {
      role: "admin",
      timestamp: updatedNotification.reviewedAt ?? Date.now(),
    });
  }
}

export async function syncAdminNotificationsFromTreasury(recipientWallet: string) {
  if (typeof window === "undefined" || !recipientWallet) {
    return [] as AdminPaymentNotification[];
  }

  try {
    const discoveredPayments = await scanIncomingTreasuryPayments(recipientWallet, { limit: 60 });

    discoveredPayments.forEach((payment) => {
      upsertAdminPaymentNotification({
        id: `admin-${payment.reference}`,
        paymentRequestId: payment.paymentRequestId,
        paymentReference: payment.reference,
        flow: payment.flow,
        title: payment.title,
        subtitle: payment.subtitle,
        categoryLabel: payment.categoryLabel,
        marketId: payment.marketId,
        selectionId: payment.selectionId,
        selectionLabel: payment.selectionLabel,
        username: payment.username,
        userWallet: payment.userWallet,
        recipientWallet: payment.recipientWallet,
        amountUsdc: payment.amountUsdc,
        reserveFeeUsdc: payment.reserveFeeUsdc,
        totalPaidUsdc: payment.totalPaidUsdc,
        createdAt: payment.createdAt,
        status: readAdminPaymentNotifications().find(
          (notification) => notification.paymentReference === payment.reference
        )?.status ?? "pending",
        reviewedAt: readAdminPaymentNotifications().find(
          (notification) => notification.paymentReference === payment.reference
        )?.reviewedAt,
        reviewedByWallet: readAdminPaymentNotifications().find(
          (notification) => notification.paymentReference === payment.reference
        )?.reviewedByWallet,
      });
    });

    return readAdminPaymentNotifications();
  } catch {
    return readAdminPaymentNotifications();
  }
}

export function readConnectedWalletSessions() {
  if (typeof window === "undefined") {
    return [] as ConnectedWalletSession[];
  }

  return safeParseArray<ConnectedWalletSession>(window.localStorage.getItem(connectedWalletsStorageKey));
}

export function trackConnectedWalletSession(address: string, options?: TrackConnectedWalletOptions) {
  if (typeof window === "undefined" || !address) {
    return;
  }

  const currentSessions = readConnectedWalletSessions();
  const nextSessions = [...currentSessions];
  const existingIndex = nextSessions.findIndex((session) => session.address === address);
  const now = Date.now();

  if (existingIndex >= 0) {
    nextSessions[existingIndex] = {
      ...nextSessions[existingIndex],
      lastSeenAt: now,
    };
  } else {
    nextSessions.unshift({
      address,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  try {
    window.localStorage.setItem(connectedWalletsStorageKey, JSON.stringify(nextSessions.slice(0, 500)));
    emitAdminStorageUpdate();
    const syncTimestamp = now;
    void trackCentralWalletConnection(address, {
      role: options?.isAdminWallet ? "admin" : "user",
      timestamp: syncTimestamp,
      latestActivityLabel: options?.activityLabel ?? "Wallet connected to Octopus Market",
    });
    void trackCentralWalletActivity(address, options?.activityLabel ?? "Wallet connected to Octopus Market", {
      role: options?.isAdminWallet ? "admin" : "user",
      timestamp: syncTimestamp,
    });
  } catch {
    return;
  }
}

export function subscribeToAdminStorage(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  hydrateAdminNotificationsCache();
  startAdminNotificationsServerSync();

  const handleStorageChange = () => {
    listener();
  };

  const channel = getAdminStorageBroadcastChannel();
  const handleChannelMessage = () => {
    listener();
  };

  window.addEventListener(adminStorageEventName, handleStorageChange);
  window.addEventListener("storage", handleStorageChange);

  if (channel) {
    channel.addEventListener("message", handleChannelMessage);
  }

  return () => {
    window.removeEventListener(adminStorageEventName, handleStorageChange);
    window.removeEventListener("storage", handleStorageChange);

    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
    }
  };
}

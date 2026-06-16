import type { AdminPaymentNotification, ConnectedWalletSession } from "@/components/octopus-market/octopus-admin";
import type { PredictionHistoryEntry } from "@/components/octopus-market/prediction-market-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type RegistryDatabase = {
  wallets: RegistryWalletRecord;
  payments: RegistryPaymentRecord;
  bets: RegistryBetRecord;
  history: RegistryHistoryRecord;
  adminLogs: RegistryAdminLogRecord;
};

export type RegistryWalletRole = "user" | "admin";
export type RegistryWalletStatus = "active" | "suspended";

export type RegistryWalletRecord = {
  address: string;
  role: RegistryWalletRole;
  status: RegistryWalletStatus;
  username?: string;
  displayName?: string;
  twitterHandle?: string;
  avatarSrc?: string;
  registeredAt?: number;
  firstConnectedAt: number;
  lastConnectedAt: number;
  connectionCount: number;
  latestActivityAt: number;
  latestActivityLabel: string;
  paymentCount: number;
  approvedPaymentCount: number;
  pendingPaymentCount: number;
  rejectedPaymentCount: number;
  totalPaidUsdc: number;
  totalWonUsdc: number;
  totalLostUsdc: number;
  totalClaimedUsdc: number;
};

export type RegistryPaymentRecord = AdminPaymentNotification & {
  updatedAt: number;
};

export type RegistryBetRecord = PredictionHistoryEntry & {
  updatedAt: number;
};

export type RegistryHistoryRecord = PredictionHistoryEntry & {
  updatedAt: number;
};

export type RegistryAdminLogRecord = {
  id: string;
  adminWallet: string;
  action:
    | "create_prediction"
    | "remove_prediction"
    | "resolve_prediction"
    | "remove_ai"
    | "approve_listing"
    | "reject_listing"
    | "suspend_user"
    | "reactivate_user"
    | "approve_payment"
    | "reject_payment"
    | "add_ai";
  targetId: string;
  details: string;
  createdAt: number;
};

type RegistryStoreName = keyof RegistryDatabase;

type HydrationPayload = {
  wallets?: ConnectedWalletSession[];
  payments?: AdminPaymentNotification[];
  history?: PredictionHistoryEntry[];
};

type WalletActivityOptions = {
  role?: RegistryWalletRole;
  timestamp?: number;
  latestActivityLabel?: string;
};

const databaseName = "octopus-market-central-registry";
const databaseVersion = 4;
const walletStoreName = "wallets";
const paymentStoreName = "payments";
const betStoreName = "bets";
const historyStoreName = "history";
const adminLogStoreName = "adminLogs";
const registryEventName = "octopus-market-central-registry-update";
const registryChannelName = "octopus-market-central-registry";
const centralRegistryApiBase = "/api/central-registry";
const fallbackStorageKeys: Record<RegistryStoreName, string> = {
  wallets: "octopus-market-central-wallets-fallback-v3",
  payments: "octopus-market-central-payments-fallback-v3",
  bets: "octopus-market-central-bets-fallback-v1",
  history: "octopus-market-central-history-fallback-v3",
  adminLogs: "octopus-market-central-admin-logs-fallback-v1",
};

let registryBroadcastChannel: BroadcastChannel | null = null;
let centralRegistryEventSource: EventSource | null = null;
let hasStartedCentralRegistryServerSync = false;

function shouldAttemptCentralRegistryServerSync() {
  if (typeof window === "undefined") {
    return false;
  }

  if (import.meta.env.DEV) {
    return true;
  }

  return import.meta.env.VITE_ENABLE_SERVER_SYNC === "true";
}

function getBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!registryBroadcastChannel) {
    registryBroadcastChannel = new BroadcastChannel(registryChannelName);
  }

  return registryBroadcastChannel;
}

function emitRegistryUpdate() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(registryEventName));
  getBroadcastChannel()?.postMessage({ type: "registry-update" });
}

function readFallbackStore<T>(storeName: RegistryStoreName) {
  if (typeof window === "undefined") {
    return [] as T[];
  }

  try {
    const rawValue = window.localStorage.getItem(fallbackStorageKeys[storeName]);

    if (!rawValue) {
      return [] as T[];
    }

    const parsedValue = JSON.parse(rawValue) as T[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [] as T[];
  }
}

function readFallbackWalletRecord(address: string) {
  if (!address) {
    return null;
  }

  const fallbackWallets = readFallbackStore<RegistryWalletRecord>(walletStoreName);
  return fallbackWallets.find((wallet) => wallet.address === address) ?? null;
}

export function readCachedCentralWalletRecord(address: string) {
  return readFallbackWalletRecord(address);
}

function writeFallbackStore<T extends { id?: string; address?: string }>(storeName: RegistryStoreName, nextRecord: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentRecords = readFallbackStore<T>(storeName);
    const recordKey = typeof nextRecord.id === "string" ? nextRecord.id : nextRecord.address;
    const nextRecords = recordKey
      ? [nextRecord, ...currentRecords.filter((record) => (typeof record.id === "string" ? record.id : record.address) !== recordKey)]
      : [nextRecord, ...currentRecords];

    window.localStorage.setItem(fallbackStorageKeys[storeName], JSON.stringify(nextRecords.slice(0, 2000)));
  } catch {
    return;
  }
}

function getRecordKey(value: { id?: string; address?: string }) {
  return typeof value.id === "string" ? value.id : value.address ?? "";
}

function mergeRecordsByKey<T extends { id?: string; address?: string }>(primary: T[], fallback: T[]) {
  const mergedMap = new Map<string, T>();

  [...fallback, ...primary].forEach((record) => {
    const key = getRecordKey(record);

    if (key) {
      mergedMap.set(key, record);
    }
  });

  return Array.from(mergedMap.values());
}

function openRegistryDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return Promise.reject(new Error("indexeddb-unavailable"));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);

    request.onerror = () => {
      reject(request.error ?? new Error("registry-open-failed"));
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(walletStoreName)) {
        database.createObjectStore(walletStoreName, { keyPath: "address" });
      }

      if (!database.objectStoreNames.contains(paymentStoreName)) {
        database.createObjectStore(paymentStoreName, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(betStoreName)) {
        database.createObjectStore(betStoreName, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(historyStoreName)) {
        database.createObjectStore(historyStoreName, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(adminLogStoreName)) {
        database.createObjectStore(adminLogStoreName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function runTransaction<T>(
  storeName: RegistryStoreName,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openRegistryDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = executor(store);

        request.onerror = () => {
          reject(request.error ?? new Error(`registry-${storeName}-request-failed`));
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        transaction.onerror = () => {
          reject(transaction.error ?? new Error(`registry-${storeName}-transaction-failed`));
        };

        transaction.oncomplete = () => {
          database.close();
        };
      })
  );
}

async function getAllFromStore<T extends { id?: string; address?: string }>(storeName: RegistryStoreName) {
  const fallbackRecords = readFallbackStore<T>(storeName);

  try {
    const result = await runTransaction<T[]>(storeName, "readonly", (store) => store.getAll());
    const indexedDbRecords = Array.isArray(result) ? result : [];
    return mergeRecordsByKey(indexedDbRecords, fallbackRecords);
  } catch {
    return fallbackRecords;
  }
}

async function getFromStore<T extends { id?: string; address?: string }>(storeName: RegistryStoreName, key: IDBValidKey) {
  try {
    const result = await runTransaction<T | undefined>(storeName, "readonly", (store) => store.get(key));

    if (result) {
      return result;
    }
  } catch {
    const fallbackRecords = readFallbackStore<T>(storeName);
    const stringKey = String(key);
    return fallbackRecords.find((record) => getRecordKey(record) === stringKey) ?? null;
  }

  const fallbackRecords = readFallbackStore<T>(storeName);
  const stringKey = String(key);
  return fallbackRecords.find((record) => getRecordKey(record) === stringKey) ?? null;
}

async function putInStore<T extends { id?: string; address?: string }>(storeName: RegistryStoreName, value: T) {
  writeFallbackStore(storeName, value);
  void postCentralRegistryUpsertToServer(storeName, value);

  try {
    await runTransaction(storeName, "readwrite", (store) => store.put(value));
  } catch {
    emitRegistryUpdate();
    return;
  }

  emitRegistryUpdate();
}

async function clearStore(storeName: RegistryStoreName) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(fallbackStorageKeys[storeName]);
    } catch {
      // noop
    }
  }

  void postCentralRegistryClearToServer(storeName);

  try {
    await runTransaction(storeName, "readwrite", (store) => store.clear());
  } catch {
    emitRegistryUpdate();
    return;
  }

  emitRegistryUpdate();
}

function persistStoreValueInBackground<T extends { id?: string; address?: string }>(storeName: RegistryStoreName, value: T) {
  writeFallbackStore(storeName, value);
  void postCentralRegistryUpsertToServer(storeName, value);
  emitRegistryUpdate();

  void runTransaction(storeName, "readwrite", (store) => store.put(value))
    .catch(() => undefined)
    .finally(() => {
      emitRegistryUpdate();
    });
}

type CentralRegistryServerPayload = {
  wallets?: RegistryWalletRecord[];
  payments?: RegistryPaymentRecord[];
  bets?: RegistryBetRecord[];
  history?: RegistryHistoryRecord[];
  adminLogs?: RegistryAdminLogRecord[];
};

async function postCentralRegistryUpsertToServer<T extends { id?: string; address?: string }>(storeName: RegistryStoreName, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      if (storeName === walletStoreName) {
        const w = value as unknown as RegistryWalletRecord;
        const { error } = await supabase.from("wallets").upsert({
          address: w.address,
          role: w.role ?? "user",
          status: w.status ?? "active",
          username: w.username ?? null,
          display_name: (w as Record<string, unknown>).displayName as string ?? null,
          twitter_handle: (w as Record<string, unknown>).twitterHandle as string ?? null,
          avatar_src: (w as Record<string, unknown>).avatarSrc as string ?? null,
          registered_at: w.registeredAt ? new Date(w.registeredAt).toISOString() : null,
          first_connected_at: new Date(w.firstConnectedAt).toISOString(),
          last_connected_at: new Date(w.lastConnectedAt).toISOString(),
          connection_count: w.connectionCount ?? 1,
          latest_activity_at: new Date(w.latestActivityAt).toISOString(),
          latest_activity_label: w.latestActivityLabel ?? "",
          payment_count: w.paymentCount ?? 0,
          approved_payment_count: w.approvedPaymentCount ?? 0,
          pending_payment_count: w.pendingPaymentCount ?? 0,
          rejected_payment_count: w.rejectedPaymentCount ?? 0,
          total_paid_usdc: w.totalPaidUsdc ?? 0,
          total_won_usdc: w.totalWonUsdc ?? 0,
          total_lost_usdc: w.totalLostUsdc ?? 0,
          total_claimed_usdc: w.totalClaimedUsdc ?? 0,
        }, { onConflict: "address" });
        if (error) {
          console.error("[supabase] wallets upsert failed:", error.message, error.details);
        }
      } else if (storeName === betStoreName || storeName === historyStoreName) {
        const b = value as unknown as RegistryBetRecord;
        const { error } = await supabase.from("prediction_bets").upsert({
          id: b.id,
          market_id: b.marketId,
          market_title: b.marketTitle,
          category_label: b.categoryLabel ?? "",
          selection_id: b.selectionId,
          selection_label: b.selectionLabel,
          amount: b.amount,
          reserve_fee: b.reserveFee ?? 0,
          total_charged: b.totalCharged ?? 0,
          claim_fee_rate: b.claimFeeRate ?? 5,
          payout_multiple: b.payoutMultiple ?? 1,
          gross_reward: b.grossReward ?? 0,
          net_reward: b.netReward ?? 0,
          wallet_address: b.walletAddress,
          payment_reference: b.paymentReference,
          payment_request_id: b.paymentRequestId,
          created_at: new Date(b.createdAt).toISOString(),
          reported_at: new Date(b.reportedAt).toISOString(),
          admin_decision_status: b.adminDecisionStatus ?? "pending",
          resolution_outcome_id: b.resolutionOutcomeId ?? null,
          resolved_at: b.resolvedAt ? new Date(b.resolvedAt).toISOString() : null,
          resolved_by_wallet: b.resolvedByWallet ?? null,
          result_status: b.resultStatus ?? "open",
          winning_choice_label: b.winningChoiceLabel ?? null,
          payout_recorded_at: b.payoutRecordedAt ? new Date(b.payoutRecordedAt).toISOString() : null,
          claimed_at: b.claimedAt ? new Date(b.claimedAt).toISOString() : null,
          claim_reference: b.claimReference ?? null,
        }, { onConflict: "id" });
        if (error) {
          console.error("[supabase] prediction_bets upsert failed:", error.message, error.details);
        }
      } else if (storeName === adminLogStoreName) {
        const l = value as unknown as RegistryAdminLogRecord;
        const { error } = await supabase.from("admin_logs").upsert({
          id: l.id,
          admin_wallet: l.adminWallet,
          action: l.action,
          target_id: l.targetId,
          details: l.details ?? "",
          created_at: new Date(l.createdAt).toISOString(),
        }, { onConflict: "id" });
        if (error) {
          console.error("[supabase] admin_logs upsert failed:", error.message, error.details);
        }
      }
    } catch (err) {
      console.error("[supabase] postCentralRegistryUpsertToServer exception:", err);
      return;
    }
    return;
  }

  try {
    await fetch(`${centralRegistryApiBase}/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ storeName, value }),
    });
  } catch {
    return;
  }
}

async function postCentralRegistryClearToServer(storeName: RegistryStoreName) {
  if (typeof window === "undefined") {
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      if (storeName === walletStoreName) {
        const { error } = await supabase.from("wallets").delete().neq("address", "");
        if (error) console.error("[supabase] wallets delete failed:", error.message);
      } else if (storeName === betStoreName || storeName === historyStoreName) {
        const { error } = await supabase.from("prediction_bets").delete().neq("id", "");
        if (error) console.error("[supabase] prediction_bets delete failed:", error.message);
      } else if (storeName === adminLogStoreName) {
        const { error } = await supabase.from("admin_logs").delete().neq("id", "");
        if (error) console.error("[supabase] admin_logs delete failed:", error.message);
      }
    } catch (err) {
      console.error("[supabase] postCentralRegistryClearToServer exception:", err);
      return;
    }
    return;
  }

  try {
    await fetch(`${centralRegistryApiBase}/clear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ storeName }),
    });
  } catch {
    return;
  }
}

async function applyCentralRegistryServerPayload(payload: CentralRegistryServerPayload) {
  const tasks: Promise<unknown>[] = [];

  for (const wallet of payload.wallets ?? []) {
    writeFallbackStore(walletStoreName, wallet);
    tasks.push(runTransaction(walletStoreName, "readwrite", (store) => store.put(wallet)).catch(() => undefined));
  }

  for (const payment of payload.payments ?? []) {
    writeFallbackStore(paymentStoreName, payment);
    tasks.push(runTransaction(paymentStoreName, "readwrite", (store) => store.put(payment)).catch(() => undefined));
  }

  for (const bet of payload.bets ?? []) {
    writeFallbackStore(betStoreName, bet);
    tasks.push(runTransaction(betStoreName, "readwrite", (store) => store.put(bet)).catch(() => undefined));
  }

  for (const historyEntry of payload.history ?? []) {
    writeFallbackStore(historyStoreName, historyEntry);
    tasks.push(runTransaction(historyStoreName, "readwrite", (store) => store.put(historyEntry)).catch(() => undefined));
  }

  for (const adminLog of payload.adminLogs ?? []) {
    writeFallbackStore(adminLogStoreName, adminLog);
    tasks.push(runTransaction(adminLogStoreName, "readwrite", (store) => store.put(adminLog)).catch(() => undefined));
  }

  await Promise.all(tasks);
  emitRegistryUpdate();
}

async function fetchCentralRegistryStateFromServer() {
  if (typeof window === "undefined" || !shouldAttemptCentralRegistryServerSync()) {
    hasStartedCentralRegistryServerSync = true;
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const [walletsRes, betsRes, logsRes] = await Promise.all([
        supabase.from("wallets").select("*"),
        supabase.from("prediction_bets").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_logs").select("*").order("created_at", { ascending: false }),
      ]);

      const wallets: RegistryWalletRecord[] = (walletsRes.data ?? []).map((w) => ({
        address: w.address,
        role: w.role as RegistryWalletRole,
        status: w.status as RegistryWalletStatus,
        username: w.username ?? undefined,
        registeredAt: w.registered_at ? new Date(w.registered_at).getTime() : undefined,
        firstConnectedAt: new Date(w.first_connected_at).getTime(),
        lastConnectedAt: new Date(w.last_connected_at).getTime(),
        connectionCount: w.connection_count,
        latestActivityAt: new Date(w.latest_activity_at).getTime(),
        latestActivityLabel: w.latest_activity_label,
        paymentCount: w.payment_count,
        approvedPaymentCount: w.approved_payment_count,
        pendingPaymentCount: w.pending_payment_count,
        rejectedPaymentCount: w.rejected_payment_count,
        totalPaidUsdc: Number(w.total_paid_usdc),
        totalWonUsdc: Number(w.total_won_usdc),
        totalLostUsdc: Number(w.total_lost_usdc),
        totalClaimedUsdc: Number(w.total_claimed_usdc),
      }));

      const bets: RegistryBetRecord[] = (betsRes.data ?? []).map((b) => ({
        id: b.id,
        marketId: b.market_id,
        marketTitle: b.market_title,
        categoryLabel: b.category_label,
        selectionId: b.selection_id,
        selectionLabel: b.selection_label,
        amount: Number(b.amount),
        reserveFee: Number(b.reserve_fee),
        totalCharged: Number(b.total_charged),
        claimFeeRate: Number(b.claim_fee_rate),
        payoutMultiple: Number(b.payout_multiple),
        grossReward: Number(b.gross_reward),
        netReward: Number(b.net_reward),
        walletAddress: b.wallet_address,
        paymentReference: b.payment_reference,
        paymentRequestId: b.payment_request_id,
        createdAt: new Date(b.created_at).getTime(),
        reportedAt: new Date(b.reported_at).getTime(),
        adminDecisionStatus: b.admin_decision_status as "pending" | "approved" | "rejected" | undefined,
        resolutionOutcomeId: b.resolution_outcome_id ?? undefined,
        resolvedAt: b.resolved_at ? new Date(b.resolved_at).getTime() : undefined,
        resolvedByWallet: b.resolved_by_wallet ?? undefined,
        resultStatus: (b.result_status as RegistryBetRecord["resultStatus"]) ?? undefined,
        winningChoiceLabel: b.winning_choice_label ?? undefined,
        payoutRecordedAt: b.payout_recorded_at ? new Date(b.payout_recorded_at).getTime() : undefined,
        claimedAt: b.claimed_at ? new Date(b.claimed_at).getTime() : undefined,
        claimReference: b.claim_reference ?? undefined,
        updatedAt: Date.now(),
      }));

      const adminLogs: RegistryAdminLogRecord[] = (logsRes.data ?? []).map((l) => ({
        id: l.id,
        adminWallet: l.admin_wallet,
        action: l.action as RegistryAdminLogRecord["action"],
        targetId: l.target_id,
        details: l.details,
        createdAt: new Date(l.created_at).getTime(),
      }));

      await applyCentralRegistryServerPayload({ wallets, bets, history: bets, adminLogs });
    } catch {
      return;
    }
    return;
  }

  try {
    const response = await fetch(centralRegistryApiBase, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as CentralRegistryServerPayload;
    await applyCentralRegistryServerPayload(payload);
  } catch {
    return;
  }
}

function startCentralRegistryServerSync() {
  if (typeof window === "undefined" || hasStartedCentralRegistryServerSync) {
    return;
  }

  if (!shouldAttemptCentralRegistryServerSync()) {
    hasStartedCentralRegistryServerSync = true;
    return;
  }

  hasStartedCentralRegistryServerSync = true;
  void fetchCentralRegistryStateFromServer();

  if (isSupabaseConfigured()) {
    supabase
      .channel("central-registry-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => {
        void fetchCentralRegistryStateFromServer();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_bets" }, () => {
        void fetchCentralRegistryStateFromServer();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_logs" }, () => {
        void fetchCentralRegistryStateFromServer();
      })
      .subscribe();
    return;
  }

  if (typeof EventSource === "undefined") {
    return;
  }

  try {
    centralRegistryEventSource = new EventSource(`${centralRegistryApiBase}/stream`);
    centralRegistryEventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as CentralRegistryServerPayload;
        void applyCentralRegistryServerPayload(payload);
      } catch {
        return;
      }
    };

    centralRegistryEventSource.onerror = () => {
      centralRegistryEventSource?.close();
      centralRegistryEventSource = null;
      hasStartedCentralRegistryServerSync = true;
    };
  } catch {
    hasStartedCentralRegistryServerSync = false;
  }
}

function createDefaultWalletRecord(address: string, options?: WalletActivityOptions): RegistryWalletRecord {
  const timestamp = options?.timestamp ?? Date.now();
  const role = options?.role ?? "user";

  return {
    address,
    role,
    status: "active",
    username: undefined,
    registeredAt: undefined,
    firstConnectedAt: timestamp,
    lastConnectedAt: timestamp,
    connectionCount: 1,
    latestActivityAt: timestamp,
    latestActivityLabel: options?.latestActivityLabel ?? "Wallet connected to Octopus Market",
    paymentCount: 0,
    approvedPaymentCount: 0,
    pendingPaymentCount: 0,
    rejectedPaymentCount: 0,
    totalPaidUsdc: 0,
    totalWonUsdc: 0,
    totalLostUsdc: 0,
    totalClaimedUsdc: 0,
  };
}

async function upsertWalletRecord(
  address: string,
  updater: (current: RegistryWalletRecord | null) => RegistryWalletRecord
) {
  if (!address) {
    return null;
  }

  const currentRecord = await getFromStore<RegistryWalletRecord>(walletStoreName, address);
  const nextRecord = updater(currentRecord);
  await putInStore(walletStoreName, nextRecord);
  return nextRecord;
}

async function upsertHistoryRecord(entry: PredictionHistoryEntry) {
  const nextRecord: RegistryHistoryRecord = {
    ...entry,
    updatedAt: Date.now(),
  };

  await putInStore(historyStoreName, nextRecord);
  return nextRecord;
}

async function upsertBetRecord(entry: PredictionHistoryEntry) {
  const nextRecord: RegistryBetRecord = {
    ...entry,
    updatedAt: Date.now(),
  };

  await putInStore(betStoreName, nextRecord);
  return nextRecord;
}

function buildWalletPaymentSnapshot(
  walletAddress: string,
  payments: RegistryPaymentRecord[],
  historyEntries: RegistryHistoryRecord[]
) {
  const relatedPayments = payments.filter((payment) => payment.userWallet === walletAddress);
  const relatedHistory = historyEntries.filter((entry) => entry.walletAddress === walletAddress);
  const approvedReferences = new Set(
    relatedPayments.filter((payment) => payment.status === "approved").map((payment) => payment.paymentReference)
  );
  const rejectedReferences = new Set(
    relatedPayments.filter((payment) => payment.status === "rejected").map((payment) => payment.paymentReference)
  );

  const totalWonUsdc = relatedHistory.reduce((total, entry) => {
    if ((entry.resultStatus === "win" || entry.resultStatus === "claimed") && approvedReferences.has(entry.paymentReference)) {
      return total + entry.netReward;
    }

    return total;
  }, 0);

  const totalClaimedUsdc = relatedHistory.reduce((total, entry) => total + (entry.resultStatus === "claimed" ? entry.netReward : 0), 0);
  const totalLostUsdc = relatedHistory.reduce((total, entry) => {
    if (entry.resultStatus === "lose" || entry.resultStatus === "rejected" || rejectedReferences.has(entry.paymentReference)) {
      return total + entry.totalCharged;
    }

    return total;
  }, 0);

  return {
    paymentCount: relatedPayments.length,
    approvedPaymentCount: relatedPayments.filter((payment) => payment.status === "approved").length,
    pendingPaymentCount: relatedPayments.filter((payment) => payment.status === "pending").length,
    rejectedPaymentCount: relatedPayments.filter((payment) => payment.status === "rejected").length,
    totalPaidUsdc: relatedPayments.reduce((total, payment) => total + payment.totalPaidUsdc, 0),
    totalWonUsdc,
    totalLostUsdc,
    totalClaimedUsdc,
  };
}

async function refreshWalletSnapshots(addresses?: string[]) {
  const payments = await readCentralPaymentRecords();
  const historyEntries = await readCentralHistoryRecords();
  const targetAddresses = addresses && addresses.length > 0
    ? addresses
    : Array.from(
        new Set([
          ...payments.map((payment) => payment.userWallet),
          ...payments.map((payment) => payment.recipientWallet),
          ...historyEntries.map((entry) => entry.walletAddress),
        ].filter(Boolean))
      );

  await Promise.all(
    targetAddresses.map(async (address) => {
      await upsertWalletRecord(address, (currentRecord) => {
        const baseRecord = currentRecord ?? createDefaultWalletRecord(address, { latestActivityLabel: "Wallet synced with Octopus Market" });
        const paymentSnapshot = buildWalletPaymentSnapshot(address, payments, historyEntries);

        return {
          ...baseRecord,
          ...paymentSnapshot,
          latestActivityAt: Math.max(
            baseRecord.latestActivityAt,
            ...payments
              .filter((payment) => payment.userWallet === address || payment.recipientWallet === address)
              .map((payment) => payment.updatedAt || payment.createdAt),
            ...historyEntries.filter((entry) => entry.walletAddress === address).map((entry) => entry.updatedAt || entry.reportedAt || entry.createdAt)
          ),
        };
      });
    })
  );
}

function normalizeRegistryUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function readCentralWalletRecords() {
  startCentralRegistryServerSync();
  const wallets = await getAllFromStore<RegistryWalletRecord>(walletStoreName);
  return wallets.sort((left, right) => right.latestActivityAt - left.latestActivityAt);
}

export async function readCentralWalletRecord(address: string) {
  if (!address) {
    return null;
  }

  startCentralRegistryServerSync();
  return getFromStore<RegistryWalletRecord>(walletStoreName, address);
}

export async function readCentralPaymentRecords() {
  startCentralRegistryServerSync();
  const payments = await getAllFromStore<RegistryPaymentRecord>(paymentStoreName);
  return payments.sort((left, right) => right.createdAt - left.createdAt);
}

export async function readCentralBetRecords() {
  startCentralRegistryServerSync();
  const bets = await getAllFromStore<RegistryBetRecord>(betStoreName);
  return bets.sort((left, right) => right.createdAt - left.createdAt);
}

export async function readCentralHistoryRecords() {
  startCentralRegistryServerSync();
  const history = await getAllFromStore<RegistryHistoryRecord>(historyStoreName);
  return history.sort((left, right) => right.createdAt - left.createdAt);
}

export async function readCentralAdminLogs() {
  startCentralRegistryServerSync();
  const logs = await getAllFromStore<RegistryAdminLogRecord>(adminLogStoreName);
  return logs.sort((left, right) => right.createdAt - left.createdAt);
}

export async function appendCentralAdminLog(log: Omit<RegistryAdminLogRecord, "id" | "createdAt"> & { id?: string; createdAt?: number }) {
  const nextLog: RegistryAdminLogRecord = {
    id: log.id ?? `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: log.createdAt ?? Date.now(),
    adminWallet: log.adminWallet,
    action: log.action,
    targetId: log.targetId,
    details: log.details,
  };

  await putInStore(adminLogStoreName, nextLog);
  return nextLog;
}

export async function clearCentralAdminControlData() {
  await Promise.all([clearStore(paymentStoreName), clearStore(adminLogStoreName)]);
}

export async function trackCentralWalletConnection(address: string, options?: WalletActivityOptions) {
  const timestamp = options?.timestamp ?? Date.now();

  try {
    return await upsertWalletRecord(address, (currentRecord) => {
      if (!currentRecord) {
        return createDefaultWalletRecord(address, options);
      }

      return {
        ...currentRecord,
        role: options?.role ?? currentRecord.role,
        status: currentRecord.status ?? "active",
        lastConnectedAt: timestamp,
        latestActivityAt: timestamp,
        latestActivityLabel: options?.latestActivityLabel ?? currentRecord.latestActivityLabel,
        connectionCount: currentRecord.connectionCount + 1,
      };
    });
  } catch {
    return null;
  }
}

export async function registerCentralWalletIdentity(address: string, username: string, role: RegistryWalletRole = "user") {
  const trimmedUsername = username.trim();

  if (!address || trimmedUsername.length < 2) {
    return null;
  }

  const timestamp = Date.now();

  const currentRecord = await readCentralWalletRecord(address);

  if (currentRecord?.username?.trim()) {
    const currentUsername = currentRecord.username.trim();

    if (normalizeRegistryUsername(currentUsername) !== normalizeRegistryUsername(trimmedUsername)) {
      throw new Error("username-locked");
    }

    const lockedRecord: RegistryWalletRecord = {
      ...currentRecord,
      role,
      status: currentRecord.status ?? "active",
      username: currentUsername,
      registeredAt: currentRecord.registeredAt ?? timestamp,
      latestActivityAt: timestamp,
      lastConnectedAt: Math.max(currentRecord.lastConnectedAt, timestamp),
      latestActivityLabel: `Username locked as ${currentUsername}`,
    };

    persistStoreValueInBackground(walletStoreName, lockedRecord);
    return lockedRecord;
  }

  const allWallets = await readCentralWalletRecords();
  const matchingWallet = allWallets.find(
    (wallet) =>
      wallet.address !== address &&
      typeof wallet.username === "string" &&
      normalizeRegistryUsername(wallet.username) === normalizeRegistryUsername(trimmedUsername)
  );

  if (matchingWallet) {
    throw new Error("username-taken");
  }

  const baseRecord = currentRecord ?? createDefaultWalletRecord(address, {
    role,
    timestamp,
    latestActivityLabel: `Profile registered as ${trimmedUsername}`,
  });

  const nextRecord: RegistryWalletRecord = {
    ...baseRecord,
    role,
    status: baseRecord.status ?? "active",
    username: trimmedUsername,
    registeredAt: baseRecord.registeredAt ?? timestamp,
    latestActivityAt: timestamp,
    lastConnectedAt: Math.max(baseRecord.lastConnectedAt, timestamp),
    latestActivityLabel: `Profile registered as ${trimmedUsername}`,
  };

  persistStoreValueInBackground(walletStoreName, nextRecord);
  return nextRecord;
}

type RegisterCentralWalletProfileInput = {
  displayName: string;
  twitterHandle: string;
  role?: RegistryWalletRole;
};

export async function registerCentralWalletProfile(
  address: string,
  input: RegisterCentralWalletProfileInput
) {
  const trimmedDisplayName = input.displayName.trim();
  const trimmedTwitterHandle = input.twitterHandle.trim();
  const role = input.role ?? "user";

  if (!address || trimmedDisplayName.length < 2 || !trimmedTwitterHandle) {
    return null;
  }

  const nextRecord = await registerCentralWalletIdentity(address, trimmedDisplayName, role);

  if (!nextRecord) {
    return null;
  }

  const mergedRecord: RegistryWalletRecord = {
    ...nextRecord,
    status: nextRecord.status ?? "active",
    username: nextRecord.username ?? trimmedDisplayName,
    displayName: nextRecord.displayName ?? trimmedDisplayName,
    twitterHandle: nextRecord.twitterHandle ?? trimmedTwitterHandle,
    latestActivityLabel: `Profile registered as ${trimmedDisplayName}`,
  };

  persistStoreValueInBackground(walletStoreName, mergedRecord);
  return mergedRecord;
}

export async function updateCentralWalletAvatar(address: string, avatarSrc: string) {
  if (!address || !avatarSrc) {
    return null;
  }

  const timestamp = Date.now();

  return upsertWalletRecord(address, (currentRecord) => {
    const baseRecord = currentRecord ?? createDefaultWalletRecord(address, {
      timestamp,
      latestActivityLabel: "Profile photo updated",
    });

    const nextRecord: RegistryWalletRecord = {
      ...baseRecord,
      status: baseRecord.status ?? "active",
      avatarSrc,
      latestActivityAt: timestamp,
      lastConnectedAt: Math.max(baseRecord.lastConnectedAt, timestamp),
      latestActivityLabel: "Profile photo updated",
    };

    persistStoreValueInBackground(walletStoreName, nextRecord);
    return nextRecord;
  });
}

export async function trackCentralWalletActivity(address: string, activityLabel: string, options?: WalletActivityOptions) {
  const timestamp = options?.timestamp ?? Date.now();

  try {
    return await upsertWalletRecord(address, (currentRecord) => {
      const baseRecord = currentRecord ?? createDefaultWalletRecord(address, { ...options, timestamp, latestActivityLabel: activityLabel });

      return {
        ...baseRecord,
        role: options?.role ?? baseRecord.role,
        status: baseRecord.status ?? "active",
        latestActivityAt: timestamp,
        latestActivityLabel: activityLabel,
        lastConnectedAt: Math.max(baseRecord.lastConnectedAt, timestamp),
      };
    });
  } catch {
    return null;
  }
}

export async function setCentralWalletStatus(
  address: string,
  status: RegistryWalletStatus,
  adminWallet: string,
  details?: string
) {
  const updatedRecord = await upsertWalletRecord(address, (currentRecord) => {
    const baseRecord = currentRecord ?? createDefaultWalletRecord(address, {
      latestActivityLabel: status === "suspended" ? "User suspended" : "User reactivated",
      timestamp: Date.now(),
    });

    return {
      ...baseRecord,
      status,
      latestActivityAt: Date.now(),
      latestActivityLabel: status === "suspended" ? "User suspended" : "User reactivated",
    };
  });

  if (updatedRecord) {
    await appendCentralAdminLog({
      adminWallet,
      action: status === "suspended" ? "suspend_user" : "reactivate_user",
      targetId: address,
      details: details || `${address} is now ${status}`,
    });
  }

  return updatedRecord;
}

export async function syncPaymentRecordToCentralRegistry(notification: AdminPaymentNotification) {
  try {
    const nextRecord: RegistryPaymentRecord = {
      ...notification,
      updatedAt: Date.now(),
    };

    await putInStore(paymentStoreName, nextRecord);
    if (typeof notification.username === "string" && notification.username.trim()) {
      await upsertWalletRecord(notification.userWallet, (currentRecord) => {
        const baseRecord = currentRecord ?? createDefaultWalletRecord(notification.userWallet, {
          role: "user",
          timestamp: nextRecord.updatedAt,
          latestActivityLabel: `${notification.flow} payment pending review`,
        });

        return {
          ...baseRecord,
          status: baseRecord.status ?? "active",
          username: baseRecord.username?.trim() || notification.username?.trim(),
          displayName: baseRecord.displayName?.trim() || notification.username?.trim(),
          registeredAt: baseRecord.registeredAt ?? nextRecord.updatedAt,
        };
      });
    }
    await trackCentralWalletActivity(notification.userWallet, `${notification.flow} payment ${notification.status}`, {
      timestamp: nextRecord.updatedAt,
      role: "user",
    });
    await trackCentralWalletActivity(notification.recipientWallet, `${notification.flow} payment received`, {
      timestamp: nextRecord.updatedAt,
      role: "admin",
    });
    await refreshWalletSnapshots([notification.userWallet, notification.recipientWallet]);
    return nextRecord;
  } catch {
    return null;
  }
}

export async function syncPredictionHistoryToCentralRegistry(entry: PredictionHistoryEntry) {
  try {
    await upsertBetRecord(entry);
    await upsertHistoryRecord(entry);
    await trackCentralWalletActivity(entry.walletAddress, `Prediction history synced for ${entry.marketTitle}`, {
      timestamp: entry.reportedAt || entry.createdAt,
      role: "user",
    });
    await refreshWalletSnapshots([entry.walletAddress]);
  } catch {
    return;
  }
}

export async function hydrateCentralRegistry(payload: HydrationPayload) {
  try {
    const walletTasks = (payload.wallets ?? []).map((session) =>
      upsertWalletRecord(session.address, (currentRecord) => {
        const baseRecord = currentRecord ?? createDefaultWalletRecord(session.address, {
          timestamp: session.firstSeenAt,
          latestActivityLabel: "Wallet connected to Octopus Market",
        });

        return {
          ...baseRecord,
          role: baseRecord.role,
          status: baseRecord.status ?? "active",
          firstConnectedAt: Math.min(baseRecord.firstConnectedAt, session.firstSeenAt),
          lastConnectedAt: Math.max(baseRecord.lastConnectedAt, session.lastSeenAt),
          latestActivityAt: Math.max(baseRecord.latestActivityAt, session.lastSeenAt),
          latestActivityLabel: baseRecord.latestActivityLabel || "Wallet connected to Octopus Market",
        };
      })
    );

    const paymentTasks = (payload.payments ?? []).map((payment) => syncPaymentRecordToCentralRegistry(payment));
    const historyTasks = (payload.history ?? []).map((entry) => syncPredictionHistoryToCentralRegistry(entry));

    await Promise.all([...walletTasks, ...paymentTasks, ...historyTasks]);
  } catch {
    return;
  }
}

export function subscribeToCentralRegistry(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  startCentralRegistryServerSync();

  const handleRegistryChange = () => {
    listener();
  };

  const channel = getBroadcastChannel();
  const handleChannelMessage = () => {
    listener();
  };

  window.addEventListener(registryEventName, handleRegistryChange);
  window.addEventListener("storage", handleRegistryChange);

  if (channel) {
    channel.addEventListener("message", handleChannelMessage);
  }

  return () => {
    window.removeEventListener(registryEventName, handleRegistryChange);
    window.removeEventListener("storage", handleRegistryChange);

    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
    }
  };
}

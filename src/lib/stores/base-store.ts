/**
 * lib/stores/base-store.ts
 * Generic client store with localStorage, BroadcastChannel, and server sync
 * Used by: ai-listing-store, ai-market-social-store, prediction-market-store
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface BaseStoreConfig {
  storageKey: string;
  eventName: string;
  channelName: string;
  apiBase: string;
  table?: string; // Supabase table name
  enableServerSync?: boolean;
}

export interface ServerSyncResult<T> {
  data?: T[];
  error?: Error;
}

export abstract class BaseClientStore<T extends { id?: string }> {
  protected storageKey: string;
  protected eventName: string;
  protected channelName: string;
  protected apiBase: string;
  protected table: string | null;
  protected enableServerSync: boolean;

  protected broadcastChannel: BroadcastChannel | null = null;
  protected cache: T[] = [];
  protected hasHydrated = false;
  protected hasStartedServerSync = false;
  protected eventSource: EventSource | null = null;

  constructor(config: BaseStoreConfig) {
    this.storageKey = config.storageKey;
    this.eventName = config.eventName;
    this.channelName = config.channelName;
    this.apiBase = config.apiBase;
    this.table = config.table ?? null;
    this.enableServerSync = config.enableServerSync ?? true;
  }

  /**
   * Get or create BroadcastChannel for cross-tab communication
   */
  protected getBroadcastChannel(): BroadcastChannel | null {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return null;
    }

    if (!this.broadcastChannel) {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
    }

    return this.broadcastChannel;
  }

  /**
   * Safe JSON parse with fallback
   */
  protected safeParse(rawValue: string | null, defaultValue: T[] = []): T[] {
    if (!rawValue) {
      return defaultValue;
    }

    try {
      const parsed = JSON.parse(rawValue) as T[];
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get storage (localStorage or sessionStorage as fallback)
   */
  protected getStorage(): Storage | null {
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

  /**
   * Hydrate cache from storage
   */
  protected hydrateCache(): void {
    if (typeof window === "undefined" || this.hasHydrated) {
      return;
    }

    const storage = this.getStorage();
    this.cache = this.safeParse(storage?.getItem(this.storageKey) ?? null);
    this.hasHydrated = true;
  }

  /**
   * Persist cache to storage
   */
  protected persistCache(items: T[]): void {
    if (typeof window === "undefined") {
      return;
    }

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      return;
    }
  }

  /**
   * Emit update event for listeners
   */
  protected emitUpdate(source: "local" | "server" = "local"): void {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(this.eventName, { detail: source }));

    if (source === "local") {
      this.getBroadcastChannel()?.postMessage({ type: "store-update", source });
    }
  }

  /**
   * Override this to map server rows to local format
   */
  protected mapServerRowToItem(row: Record<string, unknown>): T {
    return row as T;
  }

  /**
   * Override this to transform items before sending to server
   */
  protected mapItemToServerRow(item: T): Record<string, unknown> {
    return item as Record<string, unknown>;
  }

  /**
   * Fetch state from server (Supabase or REST API)
   */
  protected async fetchStateFromServer(): Promise<void> {
    if (typeof window === "undefined" || !this.shouldAttemptServerSync()) {
      this.hasStartedServerSync = true;
      return;
    }

    if (isSupabaseConfigured() && this.table) {
      try {
        const { data } = await supabase
          .from(this.table)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300);

        if (data) {
          this.replaceCache(
            data.map((row) => this.mapServerRowToItem(row as Record<string, unknown>)),
            "server"
          );
        }
      } catch {
        return;
      }
      return;
    }

    try {
      const response = await fetch(this.apiBase, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { items?: T[] };
      this.replaceCache(Array.isArray(payload.items) ? payload.items : [], "server");
    } catch {
      return;
    }
  }

  /**
   * Post state to server
   */
  protected async postStateToServer(items: T[]): Promise<void> {
    if (typeof window === "undefined" || !this.shouldAttemptServerSync()) {
      return;
    }

    if (isSupabaseConfigured() && this.table) {
      try {
        const rows = items.map((item) => this.mapItemToServerRow(item));

        if (rows.length > 0) {
          const { error } = await supabase.from(this.table).upsert(rows, { onConflict: "id" });
          if (error) {
            console.error(`[supabase] ${this.table} upsert failed:`, error.message);
          }
        }
      } catch (err) {
        console.error(`[supabase] postStateToServer exception:`, err);
        return;
      }
      return;
    }

    try {
      await fetch(`${this.apiBase}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    } catch {
      return;
    }
  }

  /**
   * Start server sync
   */
  protected startServerSync(): void {
    if (typeof window === "undefined" || this.hasStartedServerSync) {
      return;
    }

    if (!this.shouldAttemptServerSync()) {
      this.hasStartedServerSync = true;
      return;
    }

    this.hasStartedServerSync = true;
    void this.fetchStateFromServer();

    if (isSupabaseConfigured() && this.table) {
      supabase
        .channel(`${this.table}-realtime`)
        .on("postgres_changes", { event: "*", schema: "public", table: this.table }, () => {
          void this.fetchStateFromServer();
        })
        .subscribe();
      return;
    }

    if (typeof EventSource === "undefined") {
      return;
    }

    try {
      this.eventSource = new EventSource(`${this.apiBase}/stream`);
      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { items?: T[] };
          this.replaceCache(Array.isArray(payload.items) ? payload.items : [], "server");
        } catch {
          return;
        }
      };
    } catch {
      return;
    }
  }

  /**
   * Check if server sync is enabled
   */
  protected shouldAttemptServerSync(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    if (!this.enableServerSync) {
      return false;
    }

    if (import.meta.env.VITE_ENABLE_SERVER_SYNC === "false") {
      return false;
    }

    return true;
  }

  /**
   * Replace entire cache
   */
  protected replaceCache(items: T[], source: "local" | "server" = "local"): void {
    const normalized = items.slice(0, 300).sort((a, b) => {
      const timeA = (a as any).createdAt || (a as any).submittedAt || 0;
      const timeB = (b as any).createdAt || (b as any).submittedAt || 0;
      return timeB - timeA;
    });

    const currentSerialized = JSON.stringify(this.cache);
    const nextSerialized = JSON.stringify(normalized);

    if (currentSerialized === nextSerialized) {
      this.hasHydrated = true;
      return;
    }

    this.cache = normalized;
    this.hasHydrated = true;
    this.persistCache(normalized);
    this.emitUpdate(source);
  }

  /**
   * Read all items
   */
  public readAll(): T[] {
    if (typeof window === "undefined") {
      return [];
    }

    this.hydrateCache();
    this.startServerSync();

    return this.cache.slice().sort((a, b) => {
      const timeA = (a as any).createdAt || (a as any).submittedAt || 0;
      const timeB = (b as any).createdAt || (b as any).submittedAt || 0;
      return timeB - timeA;
    });
  }

  /**
   * Write items
   */
  public write(items: T[]): void {
    if (typeof window === "undefined") {
      return;
    }

    this.replaceCache(items, "local");
    void this.postStateToServer(items);
  }

  /**
   * Append item
   */
  public append(item: T): T[] {
    const current = this.readAll();
    const next = [item, ...current.filter((i) => i.id !== item.id)].slice(0, 300);
    this.write(next);
    return next;
  }

  /**
   * Update item
   */
  public update(id: string | undefined, updater: (item: T) => T): T[] {
    const next = this.readAll().map((item) => (item.id === id ? updater(item) : item));
    this.write(next);
    return next;
  }

  /**
   * Subscribe to changes
   */
  public subscribe(listener: () => void): () => void {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleChange = () => {
      listener();
    };

    window.addEventListener(this.eventName, handleChange);
    window.addEventListener("storage", handleChange);

    const channel = this.getBroadcastChannel();
    channel?.addEventListener("message", handleChange);

    return () => {
      window.removeEventListener(this.eventName, handleChange);
      window.removeEventListener("storage", handleChange);
      channel?.removeEventListener("message", handleChange);
    };
  }
}

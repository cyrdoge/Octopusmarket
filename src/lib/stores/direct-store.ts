/**
 * lib/stores/direct-store.ts
 * Direct Supabase store without localStorage or BroadcastChannel
 * Replaces BaseClientStore with direct database calls and realtime sync
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface DirectStoreConfig {
  table: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export abstract class DirectClientStore<T extends { id?: string }> {
  protected supabaseTable: string;
  protected realtimeChannel: RealtimeChannel | null = null;
  protected realtimeSubscribed = false;
  protected listeners: ((items: T[]) => void)[] = [];

  constructor(config: DirectStoreConfig) {
    this.supabaseTable = config.table;
  }

  /**
   * Validation hook - override in subclasses
   */
  protected validate(item: T): ValidationResult {
    return { valid: true, errors: {} };
  }

  /**
   * Map server row to client item
   */
  protected mapServerRowToItem(row: Record<string, unknown>): T {
    return row as T;
  }

  /**
   * Map client item to server row
   */
  protected mapItemToServerRow(item: T): Record<string, unknown> {
    return item as Record<string, unknown>;
  }

  /**
   * Create a new item in database
   */
  async create(item: T): Promise<T | null> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase not configured");
    }

    const validation = this.validate(item);
    if (!validation.valid) {
      const errors = Object.entries(validation.errors)
        .map(([key, msg]) => `${key}: ${msg}`)
        .join("; ");
      throw new Error(`Validation failed: ${errors}`);
    }

    const row = this.mapItemToServerRow(item);

    const { data, error } = await supabase
      .from(this.supabaseTable)
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error(`[supabase] ${this.supabaseTable} insert failed:`, error.message);
      throw new Error(`Failed to create ${this.supabaseTable}: ${error.message}`);
    }

    return data ? this.mapServerRowToItem(data) : null;
  }

  /**
   * Read all items from database
   */
  async readAll(): Promise<T[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from(this.supabaseTable)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      console.error(`[supabase] ${this.supabaseTable} select failed:`, error.message);
      return [];
    }

    return (data ?? []).map((row) => this.mapServerRowToItem(row as Record<string, unknown>));
  }

  /**
   * Update item in database
   */
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase not configured");
    }

    if (!id) {
      throw new Error("ID is required for update");
    }

    const row = this.mapItemToServerRow(updates as T);

    const { data, error } = await supabase
      .from(this.supabaseTable)
      .update(row)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`[supabase] ${this.supabaseTable} update failed:`, error.message);
      throw new Error(`Failed to update ${this.supabaseTable}: ${error.message}`);
    }

    return data ? this.mapServerRowToItem(data) : null;
  }

  /**
   * Delete item from database
   */
  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase not configured");
    }

    if (!id) {
      throw new Error("ID is required for delete");
    }

    const { error } = await supabase.from(this.supabaseTable).delete().eq("id", id);

    if (error) {
      console.error(`[supabase] ${this.supabaseTable} delete failed:`, error.message);
      throw new Error(`Failed to delete ${this.supabaseTable}: ${error.message}`);
    }

    return true;
  }

  /**
   * Subscribe to realtime changes
   */
  async subscribeToChanges(callback: (items: T[]) => void): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    if (this.realtimeSubscribed) {
      this.listeners.push(callback);
      return;
    }

    this.listeners.push(callback);

    const channel = supabase
      .channel(`${this.supabaseTable}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: this.supabaseTable },
        async () => {
          const items = await this.readAll();
          this.listeners.forEach((listener) => listener(items));
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.realtimeSubscribed = true;
        }
      });

    this.realtimeChannel = channel;
  }

  /**
   * Unsubscribe from realtime changes
   */
  unsubscribeFromChanges(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    this.realtimeSubscribed = false;
    this.listeners = [];
  }
}

/**
 * src/components/octopus-market/ai-listing-store.ts
 * Refactored to use DirectClientStore (direct Supabase, no localStorage)
 * Stores AI listing submissions with payment validation
 */

import { DirectClientStore, type DirectStoreConfig, type ValidationResult } from "@/lib/stores/direct-store";
import type { RegistryWalletRecord } from "@/components/octopus-market/octopus-central-registry";

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

const storeConfig: DirectStoreConfig = {
  table: "ai_listings",
};

class AIListingStore extends DirectClientStore<AIListingSubmission> {
  protected validate(item: AIListingSubmission): ValidationResult {
    const errors: Record<string, string> = {};

    if (!item.walletAddress?.trim()) {
      errors.walletAddress = "Wallet address is required";
    }

    if (!item.displayName?.trim()) {
      errors.displayName = "Display name is required";
    }

    if (!item.websiteUrl?.trim()) {
      errors.websiteUrl = "Website URL is required";
    }

    // If listing is paid (amountUsd > 0), payment reference is mandatory
    if (item.amountUsd > 0) {
      if (!item.paymentReference?.trim()) {
        errors.paymentReference = "Payment not confirmed for paid listing";
      }
      if (!item.paymentRequestId?.trim()) {
        errors.paymentRequestId = "Payment request ID is required";
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  protected mapServerRowToItem(row: Record<string, unknown>): AIListingSubmission {
    return {
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
    };
  }

  protected mapItemToServerRow(item: AIListingSubmission): Record<string, unknown> {
    return {
      id: item.id,
      wallet_address: item.walletAddress,
      display_name: item.displayName,
      twitter_handle: item.twitterHandle,
      icon_src: item.iconSrc,
      icon_name: item.iconName,
      website_url: item.websiteUrl,
      description: item.description,
      social_url: item.socialUrl,
      guide_file_name: item.guideFileName,
      guide_file_url: item.guideFileUrl,
      plan_id: item.planId,
      billing_label: item.billingLabel,
      amount_usd: item.amountUsd,
      auto_renew_enabled: item.autoRenewEnabled,
      submitted_at: new Date(item.submittedAt).toISOString(),
      updated_at: new Date(item.updatedAt).toISOString(),
      status: item.status,
      badge: item.badge,
      admin_notes: item.adminNotes ?? null,
      payment_reference: item.paymentReference ?? null,
      payment_request_id: item.paymentRequestId ?? null,
      visible_in_explore: item.visibleInExplore,
      visitor_count: item.visitorCount,
      unique_visitor_keys: item.uniqueVisitorKeys,
    };
  }

  public countApprovedListingsForWallet(walletAddress: string, items: AIListingSubmission[]): number {
    return items.filter(
      (listing) => listing.walletAddress === walletAddress && listing.status === "approved"
    ).length;
  }

  public trackVisit(
    submissionId: string,
    visitorKey: string,
    items: AIListingSubmission[]
  ): AIListingSubmission | null {
    if (!visitorKey.trim()) {
      return items.find((listing) => listing.id === submissionId) ?? null;
    }

    const listing = items.find((listing) => listing.id === submissionId);
    if (!listing) {
      return null;
    }

    if (listing.uniqueVisitorKeys.includes(visitorKey)) {
      return listing;
    }

    return {
      ...listing,
      visitorCount: listing.visitorCount + 1,
      uniqueVisitorKeys: [...listing.uniqueVisitorKeys, visitorKey].slice(-2000),
      updatedAt: Date.now(),
    };
  }

  public normalize(submission: Partial<AIListingSubmission> | AIListingSubmission): AIListingSubmission {
    return {
      id: submission.id || `listing-${Date.now()}`,
      walletAddress: submission.walletAddress || "",
      displayName: submission.displayName || "",
      twitterHandle: submission.twitterHandle || "",
      iconSrc: submission.iconSrc || "",
      iconName: submission.iconName || "",
      websiteUrl: submission.websiteUrl || "",
      description: submission.description || "",
      socialUrl: submission.socialUrl || "",
      guideFileName: submission.guideFileName || "",
      guideFileUrl: submission.guideFileUrl || "",
      planId: submission.planId ?? "starter",
      billingLabel: submission.billingLabel || "$0 / free",
      amountUsd: typeof submission.amountUsd === "number" ? submission.amountUsd : 0,
      autoRenewEnabled: Boolean(submission.autoRenewEnabled),
      submittedAt: typeof submission.submittedAt === "number" ? submission.submittedAt : Date.now(),
      updatedAt: typeof submission.updatedAt === "number" ? submission.updatedAt : Date.now(),
      status: submission.status ?? "pending",
      badge: submission.badge ?? "none",
      adminNotes: submission.adminNotes,
      paymentReference: submission.paymentReference,
      paymentRequestId: submission.paymentRequestId,
      visibleInExplore: submission.visibleInExplore ?? true,
      visitorCount: typeof submission.visitorCount === "number" ? submission.visitorCount : 0,
      uniqueVisitorKeys: Array.isArray(submission.uniqueVisitorKeys) ? submission.uniqueVisitorKeys : [],
    };
  }
}

let store: AIListingStore | null = null;

function getStore(): AIListingStore {
  if (!store) {
    store = new AIListingStore(storeConfig);
  }
  return store;
}

export async function readAIListings(): Promise<AIListingSubmission[]> {
  const s = getStore();
  return s.readAll();
}

export function writeAIListings(listings: AIListingSubmission[]): void {
  console.warn("[ai-listing-store] writeAIListings is deprecated. Use create() with DirectClientStore instead.");
}

export async function appendAIListingSubmission(
  submission: AIListingSubmission
): Promise<AIListingSubmission | null> {
  const s = getStore();
  const normalized = s.normalize(submission);
  return s.create(normalized);
}

export async function updateAIListingSubmission(
  submissionId: string,
  updates: Partial<AIListingSubmission>
): Promise<AIListingSubmission | null> {
  const s = getStore();
  return s.update(submissionId, updates);
}

export async function trackAIListingVisit(
  submissionId: string,
  visitorKey: string
): Promise<AIListingSubmission | null> {
  const s = getStore();
  const items = await s.readAll();
  const updated = s.trackVisit(submissionId, visitorKey, items);

  if (updated && updated.id === submissionId) {
    return s.update(submissionId, {
      visitorCount: updated.visitorCount,
      uniqueVisitorKeys: updated.uniqueVisitorKeys,
      updatedAt: updated.updatedAt,
    } as Partial<AIListingSubmission>);
  }

  return updated;
}

export function countApprovedListingsForWallet(walletAddress: string, items: AIListingSubmission[]): number {
  const s = getStore();
  return s.countApprovedListingsForWallet(walletAddress, items);
}

export function subscribeToAIListings(callback: (listings: AIListingSubmission[]) => void): () => void {
  const s = getStore();

  let unsubscribed = false;

  void s.subscribeToChanges((listings) => {
    if (!unsubscribed) {
      callback(listings);
    }
  });

  // Also trigger initial fetch
  void s.readAll().then((listings) => {
    if (!unsubscribed) {
      callback(listings);
    }
  });

  return () => {
    unsubscribed = true;
    s.unsubscribeFromChanges();
  };
}

export function getDefaultListingSubmissionProfile(walletRecord: RegistryWalletRecord | null) {
  return {
    displayName: walletRecord?.displayName || walletRecord?.username || "",
    twitterHandle: walletRecord?.twitterHandle || "",
  };
}

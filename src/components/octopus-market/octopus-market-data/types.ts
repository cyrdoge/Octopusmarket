/**
 * octopus-market-data/types.ts
 * Type definitions for Octopus Market
 */

import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
};

export type HighlightItem = {
  icon: LucideIcon;
  label: string;
  href?: string;
};

export type CategoryItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type ToolTab = {
  value: string;
  label: string;
};

export type ToolVerificationTone = "blue" | "gold";

export type ToolItem = {
  name: string;
  price: string;
  category: string;
  description: string;
  badge: string;
  rating: string;
  users: string;
  url?: string;
  imageSrc?: string;
  logoSrc?: string;
  verificationLabel: string;
  verificationTone: ToolVerificationTone;
};

export type StepItem = {
  step: string;
  title: string;
  description: string;
};

export type PlanItem = {
  name: string;
  price: string;
  billing: string;
  description: string;
  savings?: string;
  featured?: boolean;
  cta: string;
  perks: string[];
};

export type BonusItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type StatItem = {
  value: string;
  label: string;
};

export type PredictionMarketCategory = {
  id: string;
  label: string;
  description: string;
};

export type PredictionMarketOption = {
  id: string;
  label: string;
  oddsMultiplier: number;
  description?: string;
  logoSrc?: string;
  initialVolumeUsd?: number;
};

export type PredictionMarketVisualType = "vs" | "simple";

export type PredictionMarketVisualMeta = {
  visualType: PredictionMarketVisualType;
  singleName?: string;
  singleImageSrc?: string;
  leftCompetitorName?: string;
  leftCompetitorImageSrc?: string;
  rightCompetitorName?: string;
  rightCompetitorImageSrc?: string;
};

export type PredictionMarketQuestion = {
  id: string;
  categoryId: string;
  title: string;
  marketType: "yes-no" | "threshold" | "three-way";
  resolutionLabel: string;
  eventDateLabel?: string;
  options?: PredictionMarketOption[];
} & PredictionMarketVisualMeta;

export type AidoAgentFaqItem = {
  question: string;
  answer: string;
};

export type OctopusTokenBoardItem = {
  id: string;
  name: string;
  ticker: string;
  logoSrc?: string;
  price: string;
  volume24h: string;
  marketCap: string;
  holders: string;
  status: string;
  launchedByWallet?: string;
  launchedByName?: string;
  contractAddress?: string;
  poolAddress?: string;
  solscanUrl?: string;
  dexScreenerUrl?: string;
  birdEyeUrl?: string;
  geckoTerminalUrl?: string;
  bagsFmUrl?: string;
  initialBuyPercent?: number;
  chartPoints?: Array<{
    timestamp: number;
    label: string;
    close: number;
    high: number;
    low: number;
    volume: number;
  }>;
  lastUpdatedLabel?: string;
};

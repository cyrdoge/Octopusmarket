/**
 * octopus-market-data/ui.ts
 * UI data and components information
 */

import type { LucideIcon } from "lucide-react";
import {
  AudioWaveform,
  Bot,
  ChartLine,
  Code,
  Coins,
  Database,
  Globe,
  Image,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Star,
  Users,
  Video,
  Wallet,
} from "lucide-react";

import type { CategoryItem, ToolItem, StepItem, PlanItem, BonusItem, HighlightItem, ToolTab } from "./types";
import { officialTokenName, officialTokenAddress } from "./constants";

export const promiseCards: BonusItem[] = [
  {
    icon: Globe,
    title: "Global project tokenization",
    description: "Turn a project into a visible Web3 asset with guided launch preparation and smarter execution support.",
  },
  {
    icon: Search,
    title: "AI discovery and listing",
    description: "Help users discover trusted AI products faster while giving teams a clear path to publish and grow.",
  },
  {
    icon: Shield,
    title: "Prediction market + monitoring",
    description:
      "Trade major events and run launch flows with visible wallet validation, team guidance, and intelligent monitoring.",
  },
];

export const categories: CategoryItem[] = [
  {
    icon: Bot,
    title: "Chatbots & Agents",
    description: "Assistants, copilots, customer support, autonomous workflows, and on-chain agents.",
  },
  {
    icon: Image,
    title: "Image generation",
    description: "Visual creation, product rendering, branding, and concept art.",
  },
  {
    icon: Video,
    title: "Video & Animation",
    description: "Editing, avatars, motion design, and ad content.",
  },
  {
    icon: ChartLine,
    title: "Trading & Finance",
    description: "Signals, analysis, portfolio tracking, and trading automation.",
  },
  {
    icon: Sparkles,
    title: "Writing & Marketing",
    description: "SEO, email, ad scripts, and campaign generation.",
  },
  {
    icon: Code,
    title: "Code & Development",
    description: "Pair programming, review, code generation, and debugging.",
  },
  {
    icon: Database,
    title: "Data & Analytics",
    description: "Dashboards, summaries, exploration, and smart reporting.",
  },
  {
    icon: AudioWaveform,
    title: "Voice & Audio",
    description: "Speech synthesis, voice cloning, podcasts, and assisted mixing.",
  },
];

export const toolTabs: ToolTab[] = [
  { value: "all", label: "All" },
  { value: "agents", label: "Agents" },
  { value: "image", label: "Images" },
  { value: "finance", label: "Finance" },
  { value: "code", label: "Code" },
];

export const featuredTools: ToolItem[] = [
  {
    name: "ClawdTrust",
    price: "Free/month",
    category: "agents",
    description: "Prediction market agent and rug control for Solana, currently available for free.",
    badge: "Solana agent",
    rating: "4.9/5",
    users: "492 users",
    url: "https://clawdtrust.com",
    imageSrc:
      "https://studio-assets.supernova.io/files/ws/757243/067fd6681a8d123b6eeb9991c1922285b1b2eed6e55f0de25fda0a9d0e92f233.jpeg",
    logoSrc:
      "https://studio-assets.supernova.io/files/ws/757243/922fd25daca69e8f633021e9bfd2d46e24302685b31272da4458bae196cb2ee6.jpeg",
    verificationLabel: "Gold verified",
    verificationTone: "gold",
  },
  {
    name: "Claude 3.5 Sonnet",
    price: "$29/month",
    category: "agents",
    description: "Premium reasoning model for support, strategy, and advanced writing.",
    badge: "Top reasoning",
    rating: "4.9/5",
    users: "32k users",
    url: "https://claude.ai",
    logoSrc:
      "https://studio-assets.supernova.io/files/ws/757243/3bc2547fed21883ed52a5488d06faafd83d27417455977757e6925d821cd9706.jpeg",
    verificationLabel: "Verified",
    verificationTone: "blue",
  },
  {
    name: "Midjourney V7",
    price: "$10/month",
    category: "image",
    description: "Ultra-realistic image generation for creators, agencies, and brands.",
    badge: "Top image",
    rating: "4.8/5",
    users: "48k users",
    verificationLabel: "Verified",
    verificationTone: "blue",
  },
  {
    name: "TradeGPT Pro",
    price: "$49/month",
    category: "finance",
    description: "Market signals, macro insights, and AI-assisted crypto and stock scenarios.",
    badge: "Top trading",
    rating: "4.7/5",
    users: "12k users",
    verificationLabel: "Verified",
    verificationTone: "blue",
  },
  {
    name: "Cursor Teams",
    price: "$20/month",
    category: "code",
    description: "Accelerated development environment with generation, editing, and refactoring.",
    badge: "Top code",
    rating: "4.9/5",
    users: "27k users",
    verificationLabel: "Verified",
    verificationTone: "blue",
  },
  {
    name: "Runway Studio",
    price: "$15/month",
    category: "image",
    description: "Generative video, smart editing, and creative assets for campaigns.",
    badge: "Creator pick",
    rating: "4.6/5",
    users: "19k users",
    verificationLabel: "Verified",
    verificationTone: "blue",
  },
  {
    name: "AutoAgent CRM",
    price: "$39/month",
    category: "agents",
    description: "AI agent for lead qualification, responses, and automated sales follow-up.",
    badge: "Growth pick",
    rating: "4.8/5",
    users: "9k users",
    verificationLabel: "Verified",
    verificationTone: "blue",
  },
];

export const steps: StepItem[] = [
  {
    step: "1",
    title: "Connect and register your wallet",
    description: "A Solana wallet connection and a saved profile are required before using payment-based platform actions.",
  },
  {
    step: "2",
    title: "Choose your flow",
    description: "Open Prediction Market, Launch Token, Explore AI, or List My AI depending on whether you want to trade, tokenize, discover, or publish.",
  },
  {
    step: "3",
    title: "Verify payments on-chain",
    description: "Octopus Market creates a Solana payment request, adds the 1% reserve fee on bets, checks the signature, recipient, and amount on-chain, then only records valid activity.",
  },
  {
    step: "4",
    title: "Track your activity from the dashboard",
    description: "Use My Bets, My Winnings, My Listed AI, and Wallet Dashboard from the navigation after wallet connection.",
  },
];

export const pricingPlans: PlanItem[] = [
  {
    name: "Builder",
    price: "100$",
    billing: "/year",
    description: "A one-year listing plan with 22% reduction and stronger long-term visibility for your AI product.",
    savings: "22% off",
    featured: true,
    cta: "Choose Builder",
    perks: [
      "Priority listing",
      "Featured badge included",
      "7-day spotlight placement",
      "Simplified performance dashboard",
    ],
  },
  {
    name: "Starter",
    price: "10$",
    billing: "/month",
    description: "A monthly entry plan to list your AI faster and start gathering visibility on Octopus Market.",
    cta: "Choose Starter",
    perks: [
      "Fast publication",
      "Marketplace visibility",
      "Product page editing",
      "Listing support access",
    ],
  },
];

export const bonusItems: BonusItem[] = [
  {
    icon: Rocket,
    title: "7-day spotlight",
    description: "Stronger visibility in the Trending section from the moment you go live.",
  },
  {
    icon: ChartLine,
    title: "Real-time analytics",
    description: "Track views, interest, and conversions directly from your page.",
  },
  {
    icon: Users,
    title: "VIP community access",
    description: "Join a privileged circle for exchanges, feedback, and opportunities.",
  },
  {
    icon: Star,
    title: "Featured badge",
    description: "Boost credibility with an instant visual trust marker on the platform.",
  },
];

export const contactItems: HighlightItem[] = [
  { icon: Globe, label: "Website · octopusmarket.fun", href: "#hero" },
  { icon: Globe, label: "X / Twitter · @octopusmarketai", href: "https://x.com/octopusmarketai" },
  { icon: Wallet, label: `Official token · $${officialTokenName} on BagsApp` },
  { icon: Shield, label: `CA · ${officialTokenAddress}` },
];

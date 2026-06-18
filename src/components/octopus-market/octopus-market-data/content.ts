/**
 * octopus-market-data/content.ts
 * Marketing content, FAQ, and feature descriptions
 */

import type { StatItem, AidoAgentFaqItem } from "./types";

export const navigationItems = [
  { label: "Home", href: "#hero" },
  { label: "Prediction Market", href: "#prediction-market" },
  { label: "Launch Token", href: "#launch-token" },
  { label: "Explore AI", href: "#explore" },
];

export const highlightItems: any[] = [];

export const heroStats: StatItem[] = [];

export const predictionMarketFeaturePoints = [
  "Prediction sections stay ready for future markets, and new markets appear as soon as the admin publishes them.",
  "Users connect a Solana wallet before using utility flows and approve USDC on Solana in Phantom.",
  "Each position supports a minimum of $2 and a maximum of $50 in USDC, with a 1% reserve fee preview.",
  "No default market stays visible anymore, so every live market shown on the platform now comes directly from admin publication.",
  "History, treasury routing, admin approval, estimated outcomes, and the 5% claim fee stay visible directly inside the studio.",
];

export const aidoAgentAccessAreas = [
  "Octopus Market home",
  "Launch token flow",
  "Prediction market sections",
  "Prediction history",
  "Explore catalog",
  "ClawdTrust feature",
  "AI listing",
  "Octopus Tokens board",
  "Pricing and contact",
  "Wallet-required utility gate",
  "Official token information",
  "Official website and X account",
];

export const aidoAgentFaqs: AidoAgentFaqItem[] = [
  {
    question: "What is Octopus Market (OM)?",
    answer:
      "Octopus Market (OM) is a global platform for project tokenization, a leading AI reference in Web3, and an innovative prediction market built on Solana.",
  },
  {
    question: "Which blockchain does Octopus Market use?",
    answer:
      "Octopus Market is fully built on Solana, which supports fast, low-cost, and highly scalable transactions.",
  },
  {
    question: "What is the main mission of Octopus Market?",
    answer:
      "The mission of Octopus Market is to support project creators with tokenization tools, AI expertise, and prediction market utilities so they can turn strong ideas into real outcomes.",
  },
  {
    question: "What does project tokenization mean on Octopus Market?",
    answer:
      "Project tokenization means turning a startup, business, initiative, intellectual property, or community project into blockchain-based digital assets on Solana to improve funding, governance, and liquidity.",
  },
  {
    question: "Why is Octopus Market considered an AI reference in Web3?",
    answer:
      "Octopus Market integrates advanced AI to analyze projects, improve tokenization decisions, guide creators, detect risk, and support better visibility and execution across Web3 flows.",
  },
  {
    question: "What does the prediction market on Octopus Market offer?",
    answer:
      "The prediction market lets users take positions on live events with Solana wallet approval, visible fee logic, admin review, and claim access for approved winners.",
  },
  {
    question: "What kind of support does Octopus Market provide to project creators?",
    answer:
      "Octopus Market provides personalized guidance across tokenization strategy, AI support, Web3 marketing, creator onboarding, launch preparation, and post-launch follow-through.",
  },
  {
    question: "Who can use Octopus Market?",
    answer:
      "Entrepreneurs, startups, content creators, communities, institutions, and innovators can use Octopus Market to tokenize projects, list AI products, or join prediction market flows.",
  },
  {
    question: "What is the official token of the platform?",
    answer: "The official token of the platform is ClawdTrust. Its contract address is DjdyfQGdtiejPhaSgraS1qaiWVhgrEFTSnd9bVnYBAGS.",
  },
  {
    question: "What is the official website of Octopus Market?",
    answer: "The official website is https://octopusmarket.fun.",
  },
];

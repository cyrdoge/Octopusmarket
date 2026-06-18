/**
 * octopus-market-data/predictions.ts
 * Prediction market categories and questions data
 */

import type { PredictionMarketCategory, PredictionMarketQuestion } from "./types";

export const predictionMarketCategories: PredictionMarketCategory[] = [
  {
    id: "crypto",
    label: "Crypto",
    description: "Reserved for upcoming crypto markets.",
  },
  {
    id: "politics",
    label: "Politics",
    description: "Reserved for upcoming politics markets.",
  },
  {
    id: "sports",
    label: "Sports",
    description: "Live sports markets appear here only after the admin publishes them.",
  },
  {
    id: "cinema",
    label: "Cinema",
    description: "Reserved for upcoming cinema markets.",
  },
  {
    id: "technology",
    label: "Technology",
    description: "Reserved for upcoming technology markets.",
  },
  {
    id: "gaming",
    label: "Gaming",
    description: "Reserved for upcoming gaming markets.",
  },
];

export const predictionMarketQuestions: PredictionMarketQuestion[] = [
  {
    id: "btc-50k",
    categoryId: "crypto",
    title: "Will Bitcoin reach $50,000 by end of 2024?",
    marketType: "yes-no",
    resolutionLabel: "Resolved by Chainlink Oracle",
    eventDateLabel: "Dec 31, 2024",
    visualType: "simple",
    singleName: "Bitcoin $50K",
    options: [
      { id: "yes", label: "Yes", oddsMultiplier: 1.8, description: "Bitcoin reaches $50k+" },
      { id: "no", label: "No", oddsMultiplier: 2.2, description: "Bitcoin stays below $50k" },
    ],
  },
  {
    id: "sol-price",
    categoryId: "crypto",
    title: "Will Solana reach $200 in 2024?",
    marketType: "yes-no",
    resolutionLabel: "Resolved by price feed",
    eventDateLabel: "Dec 31, 2024",
    visualType: "simple",
    singleName: "Solana $200",
    options: [
      { id: "yes", label: "Yes", oddsMultiplier: 2.0 },
      { id: "no", label: "No", oddsMultiplier: 1.9 },
    ],
  },
  {
    id: "eth-flippening",
    categoryId: "crypto",
    title: "Will ETH flip BTC by market cap?",
    marketType: "yes-no",
    resolutionLabel: "Based on CoinGecko data",
    eventDateLabel: "Jun 30, 2024",
    visualType: "vs",
    leftCompetitorName: "Ethereum",
    rightCompetitorName: "Bitcoin",
    options: [
      { id: "yes", label: "ETH flips BTC", oddsMultiplier: 3.5 },
      { id: "no", label: "BTC stays #1", oddsMultiplier: 1.3 },
    ],
  },
];

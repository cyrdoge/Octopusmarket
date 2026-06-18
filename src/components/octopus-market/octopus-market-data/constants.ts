/**
 * octopus-market-data/constants.ts
 * Global constants and configuration
 */

export const officialTokenName = "ClawdTrust";
export const officialTokenAddress = "DjdyfQGdtiejPhaSgraS1qaiWVhgrEFTSnd9bVnYBAGS";
export const officialTokenLogoSrc =
  "https://studio-assets.supernova.io/files/ws/757243/922fd25daca69e8f633021e9bfd2d46e24302685b31272da4458bae196cb2ee6.jpeg";

export const websiteUrl = "https://octopusmarket.fun";

export const mexicoRoundFlagLogoSrc =
  "https://studio-assets.supernova.io/files/ws/757243/9167b3c7185479c478773533173c0cdbdfe5f022855a076a44885c812a103341.png";

export const southAfricaRoundFlagLogoSrc =
  "https://studio-assets.supernova.io/files/ws/757243/dd40c0089f6efc0f8e2d09ff5e91c2941f0bb56fdf729945632c091767548f02.png";

// Prediction Market Configuration
export const predictionMarketTreasuryAddress = "EsR6usyjCzhgL6dZFqHRsw6pDh7CgvfHtkQzCybJMuCZ";
export const solanaUsdcMintAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Fee Configuration
export const predictionMarketFeeRate = 5;
export const platformReserveFeeRate = 1;
export const predictionMarketReserveFeeRate = platformReserveFeeRate;

// Bet Amount Limits (aliases for consistency)
export const predictionMarketMinBetAmount = 0.1;
export const predictionMarketMaxBetAmount = 50;

// Admin and payment configuration
export const ADMIN_WALLET_ADDRESS = "EsR6usyjCzhgL6dZFqHRsw6pDh7CgvfHtkQzCybJMuCZ";
export const solanaPaymentAddress = "EsR6usyjCzhgL6dZFqHRsw6pDh7CgvfHtkQzCybJMuCZ";
export const paymentTokenSymbol = "USDC";
export const clawdTrustDiscountAddress = officialTokenAddress;
export const clawdTrustThresholdUsd = 100;
export const predictionMarketMinStakeUsd = predictionMarketMinBetAmount;
export const predictionMarketMaxStakeUsd = predictionMarketMaxBetAmount;

/**
 * octopus-market-data/tokens.ts
 * Token and featured tools data
 */

import type { OctopusTokenBoardItem } from "./types";
import {
  officialTokenName,
  officialTokenAddress,
  officialTokenLogoSrc,
} from "./constants";

export const octopusTokensSeed: OctopusTokenBoardItem[] = [
  {
    id: "clawdtrust",
    name: officialTokenName,
    ticker: "ClawdTrust",
    logoSrc: officialTokenLogoSrc,
    price: "Loading live price",
    volume24h: "Loading live volume",
    marketCap: "Loading live market cap",
    holders: "28",
    status: "Tracked",
    contractAddress: officialTokenAddress,
    poolAddress: "EGi97Rat7zrxRQVVV7EDb5TvxzZXwGDh8vwVKgpfZdFC",
    solscanUrl: `https://solscan.io/token/${officialTokenAddress}`,
    dexScreenerUrl: "https://dexscreener.com/solana/egi97rat7zrxrqvvv7edb5tvxzzxwgdh8vwvkgpfzdfc",
    birdEyeUrl: `https://birdeye.so/solana/token/${officialTokenAddress}`,
    bagsFmUrl: `https://bags.fm/${officialTokenAddress}`,
    initialBuyPercent: 0,
  },
];

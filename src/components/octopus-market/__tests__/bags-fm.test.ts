import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBagsLaunchRequest,
  bagsFmEndpoint,
  type BagsLaunchPayload,
} from "../bags-fm";

function createTestPayload(overrides: Partial<BagsLaunchPayload> = {}): BagsLaunchPayload {
  return {
    tokenName: "TestToken",
    symbol: "TST",
    description: "A test token",
    mintAddress: "So11111111111111111111111111111111111111112",
    logoName: "logo.png",
    whitepaperName: "whitepaper.pdf",
    projectXUrl: "https://x.com/test",
    projectTelegramUrl: "https://t.me/test",
    projectDiscordUrl: "https://discord.gg/test",
    developerWallets: ["wallet1"],
    lockWallet: "lockWallet1",
    walletAddress: "walletAddress1",
    launchOption: "free",
    feeAmountUsdc: 0,
    hasDiscount: false,
    initialBuyEnabled: false,
    initialBuyPercent: 0,
    ...overrides,
  };
}

describe("bagsFmEndpoint", () => {
  it("is a valid URL string", () => {
    expect(typeof bagsFmEndpoint).toBe("string");
    expect(bagsFmEndpoint.startsWith("https://")).toBe(true);
  });
});

describe("createBagsLaunchRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok: true and parsed data on successful response", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          requestId: "REQ-123",
          launchUrl: "https://bags.fm/token/abc",
          birdEyeUrl: "https://birdeye.so/solana/token/abc",
          poolAddress: "pool-abc",
        }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const payload = createTestPayload();
    const result = await createBagsLaunchRequest(payload);

    expect(result.ok).toBe(true);
    expect(result.requestId).toBe("REQ-123");
    expect(result.launchUrl).toBe("https://bags.fm/token/abc");
    expect(result.birdEyeUrl).toBe("https://birdeye.so/solana/token/abc");
    expect(result.poolAddress).toBe("pool-abc");
    expect(result.usedFallback).toBe(false);
  });

  it("uses fallback values when response is not ok", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({}),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const payload = createTestPayload();
    const result = await createBagsLaunchRequest(payload);

    expect(result.ok).toBe(false);
    expect(result.usedFallback).toBe(true);
    expect(result.launchUrl).toContain(payload.mintAddress);
    expect(result.birdEyeUrl).toContain(payload.mintAddress);
  });

  it("falls back to alternate field names (id, url, pool, birdeyeUrl)", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          id: "ALT-ID",
          url: "https://alt.url",
          pool: "alt-pool",
          birdeyeUrl: "https://alt.birdeye",
        }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await createBagsLaunchRequest(createTestPayload());

    expect(result.requestId).toBe("ALT-ID");
    expect(result.launchUrl).toBe("https://alt.url");
    expect(result.poolAddress).toBe("alt-pool");
    expect(result.birdEyeUrl).toBe("https://alt.birdeye");
  });

  it("returns fallback result when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const payload = createTestPayload();
    const result = await createBagsLaunchRequest(payload);

    expect(result.ok).toBe(false);
    expect(result.usedFallback).toBe(true);
    expect(result.launchUrl).toContain(payload.mintAddress);
    expect(result.birdEyeUrl).toContain(payload.mintAddress);
    expect(result.poolAddress).toBe("");
    expect(result.requestId).toMatch(/^BAGS-/);
  });

  it("handles response with unparsable JSON", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const payload = createTestPayload();
    const result = await createBagsLaunchRequest(payload);

    expect(result.ok).toBe(true);
    expect(result.requestId).toMatch(/^BAGS-/);
    expect(result.launchUrl).toContain(payload.mintAddress);
  });

  it("sends POST request to the correct endpoint with proper headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const payload = createTestPayload();
    await createBagsLaunchRequest(payload);

    expect(fetchMock).toHaveBeenCalledWith(bagsFmEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": expect.any(String),
      },
      body: JSON.stringify(payload),
    });
  });

  it("uses fallback requestId format BAGS-<base36>", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));

    const result = await createBagsLaunchRequest(createTestPayload());
    expect(result.requestId).toMatch(/^BAGS-[A-Z0-9]+$/);
  });
});

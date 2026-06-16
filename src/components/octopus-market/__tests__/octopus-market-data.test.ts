import { describe, it, expect } from "vitest";
import {
  officialTokenName,
  officialTokenAddress,
  websiteUrl,
  navigationItems,
  predictionMarketCategories,
  aidoAgentFaqs,
  featuredTools,
  steps,
  pricingPlans,
  categories,
  toolTabs,
  bonusItems,
  contactItems,
  octopusTokensSeed,
  solanaPaymentAddress,
  solanaUsdcMintAddress,
  clawdTrustThresholdUsd,
  predictionMarketFeeRate,
  platformReserveFeeRate,
  predictionMarketMinStakeUsd,
  predictionMarketMaxStakeUsd,
  promiseCards,
  aidoAgentAccessAreas,
} from "../octopus-market-data";

describe("officialTokenName and officialTokenAddress", () => {
  it("officialTokenName is a non-empty string", () => {
    expect(typeof officialTokenName).toBe("string");
    expect(officialTokenName.length).toBeGreaterThan(0);
  });

  it("officialTokenAddress looks like a Solana address", () => {
    expect(typeof officialTokenAddress).toBe("string");
    expect(officialTokenAddress.length).toBeGreaterThanOrEqual(32);
  });
});

describe("websiteUrl", () => {
  it("starts with https", () => {
    expect(websiteUrl.startsWith("https://")).toBe(true);
  });
});

describe("navigationItems", () => {
  it("is a non-empty array with label and href", () => {
    expect(navigationItems.length).toBeGreaterThan(0);
    navigationItems.forEach((item) => {
      expect(typeof item.label).toBe("string");
      expect(typeof item.href).toBe("string");
    });
  });

  it("contains a Home entry", () => {
    expect(navigationItems.some((item) => item.label === "Home")).toBe(true);
  });
});

describe("predictionMarketCategories", () => {
  it("has at least one category", () => {
    expect(predictionMarketCategories.length).toBeGreaterThan(0);
  });

  it("each category has id, label, and description", () => {
    predictionMarketCategories.forEach((cat) => {
      expect(typeof cat.id).toBe("string");
      expect(typeof cat.label).toBe("string");
      expect(typeof cat.description).toBe("string");
    });
  });

  it("contains expected categories", () => {
    const ids = predictionMarketCategories.map((c) => c.id);
    expect(ids).toContain("crypto");
    expect(ids).toContain("sports");
  });
});

describe("aidoAgentFaqs", () => {
  it("has at least 5 FAQs", () => {
    expect(aidoAgentFaqs.length).toBeGreaterThanOrEqual(5);
  });

  it("each FAQ has question and answer", () => {
    aidoAgentFaqs.forEach((faq) => {
      expect(typeof faq.question).toBe("string");
      expect(faq.question.length).toBeGreaterThan(0);
      expect(typeof faq.answer).toBe("string");
      expect(faq.answer.length).toBeGreaterThan(0);
    });
  });

  it("FAQ about official token contains token name", () => {
    const tokenFaq = aidoAgentFaqs.find((f) => f.question.includes("official token"));
    expect(tokenFaq).toBeDefined();
    expect(tokenFaq!.answer).toContain(officialTokenName);
  });
});

describe("featuredTools", () => {
  it("has at least one tool", () => {
    expect(featuredTools.length).toBeGreaterThan(0);
  });

  it("each tool has required fields", () => {
    featuredTools.forEach((tool) => {
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.price).toBe("string");
      expect(typeof tool.category).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(typeof tool.badge).toBe("string");
      expect(typeof tool.rating).toBe("string");
      expect(typeof tool.users).toBe("string");
      expect(["blue", "gold"]).toContain(tool.verificationTone);
    });
  });

  it("contains ClawdTrust tool", () => {
    expect(featuredTools.some((t) => t.name === "ClawdTrust")).toBe(true);
  });
});

describe("steps", () => {
  it("has 4 steps", () => {
    expect(steps.length).toBe(4);
  });

  it("steps are numbered sequentially", () => {
    steps.forEach((s, i) => {
      expect(s.step).toBe(String(i + 1));
    });
  });
});

describe("pricingPlans", () => {
  it("has at least 2 plans", () => {
    expect(pricingPlans.length).toBeGreaterThanOrEqual(2);
  });

  it("each plan has name, price, and perks", () => {
    pricingPlans.forEach((plan) => {
      expect(typeof plan.name).toBe("string");
      expect(typeof plan.price).toBe("string");
      expect(Array.isArray(plan.perks)).toBe(true);
      expect(plan.perks.length).toBeGreaterThan(0);
    });
  });

  it("has at most one featured plan", () => {
    const featuredCount = pricingPlans.filter((p) => p.featured).length;
    expect(featuredCount).toBeLessThanOrEqual(1);
  });
});

describe("categories", () => {
  it("is a non-empty array", () => {
    expect(categories.length).toBeGreaterThan(0);
  });

  it("each category has icon, title, and description", () => {
    categories.forEach((cat) => {
      expect(cat.icon).toBeDefined();
      expect(typeof cat.title).toBe("string");
      expect(typeof cat.description).toBe("string");
    });
  });
});

describe("toolTabs", () => {
  it("includes an 'all' tab", () => {
    expect(toolTabs.some((tab) => tab.value === "all")).toBe(true);
  });
});

describe("bonusItems", () => {
  it("is a non-empty array", () => {
    expect(bonusItems.length).toBeGreaterThan(0);
  });
});

describe("contactItems", () => {
  it("includes official token reference", () => {
    expect(contactItems.some((c) => c.label.includes(officialTokenName))).toBe(true);
  });
});

describe("octopusTokensSeed", () => {
  it("has at least one token", () => {
    expect(octopusTokensSeed.length).toBeGreaterThanOrEqual(1);
  });

  it("first token is ClawdTrust", () => {
    expect(octopusTokensSeed[0].name).toBe(officialTokenName);
  });
});

describe("platform constants", () => {
  it("solanaPaymentAddress is a valid-length Solana address", () => {
    expect(solanaPaymentAddress.length).toBeGreaterThanOrEqual(32);
  });

  it("solanaUsdcMintAddress is a valid-length Solana address", () => {
    expect(solanaUsdcMintAddress.length).toBeGreaterThanOrEqual(32);
  });

  it("clawdTrustThresholdUsd is a positive number", () => {
    expect(clawdTrustThresholdUsd).toBeGreaterThan(0);
  });

  it("predictionMarketFeeRate is between 0 and 100", () => {
    expect(predictionMarketFeeRate).toBeGreaterThan(0);
    expect(predictionMarketFeeRate).toBeLessThanOrEqual(100);
  });

  it("platformReserveFeeRate is between 0 and 100", () => {
    expect(platformReserveFeeRate).toBeGreaterThan(0);
    expect(platformReserveFeeRate).toBeLessThanOrEqual(100);
  });

  it("min stake is less than max stake", () => {
    expect(predictionMarketMinStakeUsd).toBeLessThan(predictionMarketMaxStakeUsd);
  });
});

describe("promiseCards", () => {
  it("is a non-empty array", () => {
    expect(promiseCards.length).toBeGreaterThan(0);
  });
});

describe("aidoAgentAccessAreas", () => {
  it("has at least 5 access areas", () => {
    expect(aidoAgentAccessAreas.length).toBeGreaterThanOrEqual(5);
  });

  it("each area is a non-empty string", () => {
    aidoAgentAccessAreas.forEach((area) => {
      expect(typeof area).toBe("string");
      expect(area.length).toBeGreaterThan(0);
    });
  });
});

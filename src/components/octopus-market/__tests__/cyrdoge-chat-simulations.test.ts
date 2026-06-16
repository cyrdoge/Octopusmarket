import { describe, it, expect } from "vitest";
import {
  createCyrDogeSimulation,
  type CyrDogeSimulation,
} from "../cyrdoge-chat-simulations";

function assertValidSimulation(sim: CyrDogeSimulation) {
  expect(typeof sim.badge).toBe("string");
  expect(sim.badge.length).toBeGreaterThan(0);
  expect(typeof sim.title).toBe("string");
  expect(typeof sim.summary).toBe("string");
  expect(Array.isArray(sim.metrics)).toBe(true);
  expect(sim.metrics.length).toBeGreaterThan(0);
  expect(Array.isArray(sim.bullets)).toBe(true);
  expect(sim.bullets.length).toBeGreaterThan(0);
  expect(typeof sim.footer).toBe("string");
}

describe("createCyrDogeSimulation – English", () => {
  it("returns Social push for tweet-related prompt", () => {
    const sim = createCyrDogeSimulation("I want to write a tweet about my product", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Social push");
  });

  it("returns Revenue lens for sales-related prompt", () => {
    const sim = createCyrDogeSimulation("How can I increase my sales and revenue?", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Revenue lens");
  });

  it("returns Visibility scan for analytics prompt", () => {
    const sim = createCyrDogeSimulation("Analyze my visibility stats", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Visibility scan");
  });

  it("returns Launch mode for token launch prompt", () => {
    const sim = createCyrDogeSimulation("I want to launch a new token", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Launch mode");
  });

  it("returns Listing flow for wallet/listing prompt", () => {
    const sim = createCyrDogeSimulation("How do I set up my listing on Solana?", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Listing flow");
  });

  it("returns Featured agent for ClawdTrust prompt", () => {
    const sim = createCyrDogeSimulation("Tell me about ClawdTrust", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Featured agent");
  });

  it("returns Featured agent for prediction prompt", () => {
    const sim = createCyrDogeSimulation("How does the prediction market work?", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Featured agent");
  });

  it("returns Autonomous mode for generic prompt", () => {
    const sim = createCyrDogeSimulation("Help me with something random", "en");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Autonomous mode");
  });
});

describe("createCyrDogeSimulation – French", () => {
  it("returns Social push for tweet-related prompt", () => {
    const sim = createCyrDogeSimulation("Je veux écrire un tweet", "fr");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Social push");
  });

  it("returns Revenue lens for monetization prompt", () => {
    const sim = createCyrDogeSimulation("Comment augmenter mes ventes sur shopify?", "fr");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Revenue lens");
  });

  it("returns Visibility scan for French analytics prompt", () => {
    const sim = createCyrDogeSimulation("Fais une analyse de ma visibilité", "fr");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Visibility scan");
  });

  it("returns Launch mode for token launch in French", () => {
    const sim = createCyrDogeSimulation("Je souhaite lancer un token via bags", "fr");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Launch mode");
  });

  it("returns Listing flow for wallet prompt in French", () => {
    const sim = createCyrDogeSimulation("Comment faire un paiement par wallet?", "fr");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Listing flow");
  });

  it("returns Featured agent for clawdtrust in French", () => {
    const sim = createCyrDogeSimulation("Parle-moi de ClawdTrust", "fr");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Featured agent");
  });

  it("returns Autonomous mode for generic French prompt", () => {
    const sim = createCyrDogeSimulation("Aide-moi avec quelque chose", "fr");
    assertValidSimulation(sim);
    expect(sim.badge).toBe("Autonomous mode");
  });
});

describe("createCyrDogeSimulation – metrics structure", () => {
  it("each metric has label and value", () => {
    const sim = createCyrDogeSimulation("random prompt", "en");
    sim.metrics.forEach((metric) => {
      expect(typeof metric.label).toBe("string");
      expect(typeof metric.value).toBe("string");
    });
  });

  it("has exactly 3 metrics", () => {
    const sim = createCyrDogeSimulation("analyze growth", "en");
    expect(sim.metrics.length).toBe(3);
  });
});

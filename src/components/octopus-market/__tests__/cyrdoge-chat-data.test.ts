import { describe, it, expect } from "vitest";
import {
  detectChatLanguage,
  createWelcomeMessage,
  cyrDogeStorageKey,
  cyrDogeQuickPrompts,
} from "../cyrdoge-chat-data";

describe("detectChatLanguage", () => {
  it("returns 'en' for empty string", () => {
    expect(detectChatLanguage("")).toBe("en");
  });

  it("returns 'en' for whitespace-only string", () => {
    expect(detectChatLanguage("   ")).toBe("en");
  });

  it("returns 'fr' for French text", () => {
    expect(detectChatLanguage("Bonjour, comment ça va?")).toBe("fr");
  });

  it("returns 'fr' for text with multiple French signals", () => {
    expect(detectChatLanguage("Je veux lancer mon projet sur la plateforme")).toBe("fr");
  });

  it("returns 'en' for English text", () => {
    expect(detectChatLanguage("Hello, how does wallet validation work?")).toBe("en");
  });

  it("returns 'en' for text with multiple English signals", () => {
    expect(detectChatLanguage("I want to launch my token on the market")).toBe("en");
  });

  it("returns 'en' for ambiguous text (default)", () => {
    expect(detectChatLanguage("ok")).toBe("en");
  });

  it("handles mixed-language text by counting signals", () => {
    const frenchHeavy = "Bonjour, je veux faire un lancement de mon produit gratuit";
    expect(detectChatLanguage(frenchHeavy)).toBe("fr");
  });

  it("is case-insensitive", () => {
    expect(detectChatLanguage("BONJOUR JE SUIS SALUT")).toBe("fr");
  });
});

describe("createWelcomeMessage", () => {
  it("returns a message with id 'welcome-message'", () => {
    const msg = createWelcomeMessage();
    expect(msg.id).toBe("welcome-message");
  });

  it("has role 'assistant'", () => {
    const msg = createWelcomeMessage();
    expect(msg.role).toBe("assistant");
  });

  it("has language 'en'", () => {
    const msg = createWelcomeMessage();
    expect(msg.language).toBe("en");
  });

  it("has a recent createdAt timestamp", () => {
    const before = Date.now();
    const msg = createWelcomeMessage();
    expect(msg.createdAt).toBeGreaterThanOrEqual(before);
    expect(msg.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it("contains non-empty content", () => {
    const msg = createWelcomeMessage();
    expect(msg.content.length).toBeGreaterThan(0);
    expect(msg.content).toContain("Aido Agent");
  });
});

describe("cyrDogeStorageKey", () => {
  it("is a non-empty string starting with 'octopus-market-'", () => {
    expect(typeof cyrDogeStorageKey).toBe("string");
    expect(cyrDogeStorageKey.startsWith("octopus-market-")).toBe(true);
  });
});

describe("cyrDogeQuickPrompts", () => {
  it("is a non-empty array of strings", () => {
    expect(Array.isArray(cyrDogeQuickPrompts)).toBe(true);
    expect(cyrDogeQuickPrompts.length).toBeGreaterThan(0);
    cyrDogeQuickPrompts.forEach((prompt) => {
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });
  });
});

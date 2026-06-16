import { describe, it, expect } from "vitest";
import {
  createEmptyCyrDogeMemory,
  updateCyrDogeMemory,
  countKnownMemoryItems,
  getCyrDogeMemoryHighlights,
} from "../cyrdoge-memory";

describe("createEmptyCyrDogeMemory", () => {
  it("returns a memory object with null user fields", () => {
    const memory = createEmptyCyrDogeMemory();
    expect(memory.user.name).toBeNull();
    expect(memory.user.age).toBeNull();
    expect(memory.user.location).toBeNull();
    expect(memory.user.profession).toBeNull();
  });

  it("returns default preferences", () => {
    const memory = createEmptyCyrDogeMemory();
    expect(memory.preferences.languagePreference).toBe("en");
    expect(memory.preferences.responseStyle).toBe("concise and helpful");
    expect(memory.preferences.tonePreference).toBe("professional and friendly");
    expect(memory.preferences.humorPreference).toBe("light humor");
  });

  it("returns empty arrays for collections", () => {
    const memory = createEmptyCyrDogeMemory();
    expect(memory.projectsInProgress).toEqual([]);
    expect(memory.currentGoals).toEqual([]);
    expect(memory.importantInformation).toEqual([]);
  });

  it("sets updatedAt to a recent timestamp", () => {
    const before = Date.now();
    const memory = createEmptyCyrDogeMemory();
    expect(memory.updatedAt).toBeGreaterThanOrEqual(before);
  });
});

describe("updateCyrDogeMemory – name extraction", () => {
  it("extracts name from English input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "My name is Alice");
    expect(result.memory.user.name).toBe("Alice");
    expect(result.learnedFacts).toContain("name: Alice");
  });

  it("extracts name from French input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "Je m'appelle Jean-Pierre");
    expect(result.memory.user.name).toBe("Jean-Pierre");
    expect(result.learnedFacts).toContain("name: Jean-Pierre");
  });

  it("does not overwrite name with identical value", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.user.name = "Alice";
    const result = updateCyrDogeMemory(memory, "My name is Alice");
    expect(result.learnedFacts).not.toContain("name: Alice");
  });

  it("does not extract name when absent", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "I want to launch a token");
    expect(result.memory.user.name).toBeNull();
  });
});

describe("updateCyrDogeMemory – age extraction", () => {
  it("extracts age from English input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "I am 25 years old");
    expect(result.memory.user.age).toBe("25");
    expect(result.learnedFacts).toContain("age: 25");
  });

  it("extracts age from French input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "J'ai 30 ans");
    expect(result.memory.user.age).toBe("30");
  });
});

describe("updateCyrDogeMemory – location extraction", () => {
  it("extracts location from English input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "I live in Paris");
    expect(result.memory.user.location).toBe("Paris");
    expect(result.learnedFacts).toContain("location: Paris");
  });

  it("extracts location from French input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "J'habite à Lyon");
    expect(result.memory.user.location).toBe("Lyon");
  });
});

describe("updateCyrDogeMemory – profession extraction", () => {
  it("extracts profession from English input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "I'm a software developer");
    expect(result.memory.user.profession).toBe("software developer");
    expect(result.learnedFacts).toContain("profession: software developer");
  });

  it("extracts profession from French input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "Je suis un développeur");
    expect(result.memory.user.profession).toBe("développeur");
  });
});

describe("updateCyrDogeMemory – language preference extraction", () => {
  it("detects French preference", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "Réponds en français");
    expect(result.memory.preferences.languagePreference).toBe("fr");
    expect(result.learnedFacts).toContain("language: French");
  });

  it("detects English preference", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.preferences.languagePreference = "fr";
    const result = updateCyrDogeMemory(memory, "Reply in english please");
    expect(result.memory.preferences.languagePreference).toBe("en");
    expect(result.learnedFacts).toContain("language: English");
  });
});

describe("updateCyrDogeMemory – response style extraction", () => {
  it("detects concise style", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.preferences.responseStyle = null;
    const result = updateCyrDogeMemory(memory, "Keep it short please");
    expect(result.memory.preferences.responseStyle).toBe("concise and direct");
  });

  it("detects detailed style", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.preferences.responseStyle = null;
    const result = updateCyrDogeMemory(memory, "I want a detailed answer");
    expect(result.memory.preferences.responseStyle).toBe("detailed");
  });
});

describe("updateCyrDogeMemory – tone preference extraction", () => {
  it("detects friendly tone", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.preferences.tonePreference = null;
    const result = updateCyrDogeMemory(memory, "Be friendly with me");
    expect(result.memory.preferences.tonePreference).toBe("friendly and warm");
  });

  it("detects professional tone", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.preferences.tonePreference = null;
    const result = updateCyrDogeMemory(memory, "Stay professional please");
    expect(result.memory.preferences.tonePreference).toBe("professional");
  });
});

describe("updateCyrDogeMemory – humor preference extraction", () => {
  it("detects humor preference", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.preferences.humorPreference = null;
    const result = updateCyrDogeMemory(memory, "Add some humor to your answers");
    expect(result.memory.preferences.humorPreference).toBe("light humor");
  });
});

describe("updateCyrDogeMemory – project extraction", () => {
  it("extracts project from English input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "I'm building a DeFi dashboard");
    expect(result.memory.projectsInProgress).toContain("a DeFi dashboard");
    expect(result.learnedFacts.some((f) => f.startsWith("project:"))).toBe(true);
  });

  it("extracts project from French input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "Je travaille sur un marketplace");
    expect(result.memory.projectsInProgress.length).toBe(1);
  });

  it("does not add duplicate projects", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.projectsInProgress = ["a DeFi dashboard"];
    const result = updateCyrDogeMemory(memory, "I'm building a DeFi dashboard");
    expect(result.memory.projectsInProgress.length).toBe(1);
  });
});

describe("updateCyrDogeMemory – goal extraction", () => {
  it("extracts goal from English input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "My goal is to reach 1000 users");
    expect(result.memory.currentGoals.length).toBe(1);
    expect(result.learnedFacts.some((f) => f.startsWith("goal:"))).toBe(true);
  });

  it("extracts goal from French input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "Mon objectif est de lancer mon token");
    expect(result.memory.currentGoals.length).toBe(1);
  });
});

describe("updateCyrDogeMemory – important preferences", () => {
  it("extracts preference from English input", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(memory, "I like clear documentation");
    expect(result.memory.importantInformation.length).toBe(1);
    expect(result.learnedFacts.some((f) => f.startsWith("important:"))).toBe(true);
  });
});

describe("updateCyrDogeMemory – combined extraction", () => {
  it("extracts multiple facts from a single message", () => {
    const memory = createEmptyCyrDogeMemory();
    const result = updateCyrDogeMemory(
      memory,
      "My name is Bob, I'm a designer, I live in Tokyo"
    );
    expect(result.memory.user.name).toBe("Bob");
    expect(result.memory.user.location).toBe("Tokyo");
    expect(result.learnedFacts.length).toBeGreaterThanOrEqual(2);
  });

  it("does not mutate the original memory", () => {
    const memory = createEmptyCyrDogeMemory();
    const originalName = memory.user.name;
    updateCyrDogeMemory(memory, "My name is Charlie");
    expect(memory.user.name).toBe(originalName);
  });
});

describe("countKnownMemoryItems", () => {
  it("returns 4 for a fresh memory (only default preferences)", () => {
    const memory = createEmptyCyrDogeMemory();
    expect(countKnownMemoryItems(memory)).toBe(4);
  });

  it("counts user fields and array items", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.user.name = "Alice";
    memory.user.age = "25";
    memory.projectsInProgress = ["my project"];
    expect(countKnownMemoryItems(memory)).toBe(7);
  });
});

describe("getCyrDogeMemoryHighlights", () => {
  it("returns empty array for fresh memory", () => {
    const memory = createEmptyCyrDogeMemory();
    const highlights = getCyrDogeMemoryHighlights(memory, "en");
    expect(highlights.some((h) => h.startsWith("Language:"))).toBe(true);
  });

  it("includes name in English highlights", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.user.name = "Alice";
    const highlights = getCyrDogeMemoryHighlights(memory, "en");
    expect(highlights).toContain("Name: Alice");
  });

  it("includes name in French highlights", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.user.name = "Alice";
    const highlights = getCyrDogeMemoryHighlights(memory, "fr");
    expect(highlights).toContain("Nom: Alice");
  });

  it("includes project highlight", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.projectsInProgress = ["My DeFi App"];
    const highlights = getCyrDogeMemoryHighlights(memory, "en");
    expect(highlights).toContain("Project: My DeFi App");
  });

  it("includes goal highlight", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.currentGoals = ["reach 1000 users"];
    const highlights = getCyrDogeMemoryHighlights(memory, "en");
    expect(highlights).toContain("Goal: reach 1000 users");
  });

  it("returns at most 5 highlights", () => {
    const memory = createEmptyCyrDogeMemory();
    memory.user.name = "Alice";
    memory.projectsInProgress = ["proj1"];
    memory.currentGoals = ["goal1"];
    memory.importantInformation = ["pref1"];
    const highlights = getCyrDogeMemoryHighlights(memory, "en");
    expect(highlights.length).toBeLessThanOrEqual(5);
  });
});

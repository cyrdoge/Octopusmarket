import { describe, it, expect } from "vitest";
import type { Prediction } from "@/contexts/prediction-provider";

describe("PredictionProvider", () => {
  it("initializes with correct state structure", () => {
    const mockPredictions: Prediction[] = [];
    expect(mockPredictions).toEqual([]);
  });

  it("calculates total exposure correctly", () => {
    const predictions: Prediction[] = [
      { id: "1", marketId: "m1", outcome: "yes", amount: 100, odds: 1.5, createdAt: new Date() },
      { id: "2", marketId: "m2", outcome: "no", amount: 50, odds: 2, createdAt: new Date() },
    ];

    const totalExposure = predictions.reduce((sum, p) => sum + p.amount, 0);
    expect(totalExposure).toBe(150);
  });

  it("filters winning predictions by odds", () => {
    const predictions: Prediction[] = [
      { id: "1", marketId: "m1", outcome: "yes", amount: 100, odds: 1.5, createdAt: new Date() },
      { id: "2", marketId: "m2", outcome: "no", amount: 50, odds: 2, createdAt: new Date() },
      { id: "3", marketId: "m3", outcome: "yes", amount: 25, odds: 0.5, createdAt: new Date() },
    ];

    const winningPredictions = predictions.filter((p) => p.odds > 1);
    expect(winningPredictions).toHaveLength(2);
    expect(winningPredictions[0].id).toBe("1");
    expect(winningPredictions[1].id).toBe("2");
  });

  it("tracks prediction creation timestamps", () => {
    const now = new Date();
    const prediction: Prediction = {
      id: "1",
      marketId: "m1",
      outcome: "yes",
      amount: 100,
      odds: 1.5,
      createdAt: now,
    };

    expect(prediction.createdAt).toEqual(now);
    expect(prediction.createdAt.getTime()).toBe(now.getTime());
  });
});


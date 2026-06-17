/**
 * src/contexts/prediction-provider.tsx
 * Prediction market state management
 * Manages active markets, user bets, filters, and predictions
 */

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type Prediction = {
  id: string;
  marketId: string;
  outcome: "yes" | "no";
  amount: number;
  odds: number;
  createdAt: Date;
};

export type Market = {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: Date;
  totalVolume: number;
  yesOdds: number;
  noOdds: number;
};

type PredictionContextType = {
  markets: Market[];
  userPredictions: Prediction[];
  selectedMarketId: string | null;
  filterCategory: string;

  setMarkets: (markets: Market[]) => void;
  setUserPredictions: (predictions: Prediction[]) => void;
  selectMarket: (marketId: string | null) => void;
  setFilterCategory: (category: string) => void;
  addPrediction: (prediction: Prediction) => void;
  getTotalExposure: () => number;
  getWinningPredictions: () => Prediction[];
};

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export function PredictionProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const selectMarket = useCallback((marketId: string | null) => {
    setSelectedMarketId(marketId);
  }, []);

  const addPrediction = useCallback((prediction: Prediction) => {
    setUserPredictions((prev) => [...prev, prediction]);
  }, []);

  const getTotalExposure = useCallback(() => {
    return userPredictions.reduce((sum, p) => sum + p.amount, 0);
  }, [userPredictions]);

  const getWinningPredictions = useCallback(() => {
    return userPredictions.filter((p) => p.odds > 1);
  }, [userPredictions]);

  return (
    <PredictionContext.Provider
      value={{
        markets,
        userPredictions,
        selectedMarketId,
        filterCategory,
        setMarkets,
        setUserPredictions,
        selectMarket,
        setFilterCategory,
        addPrediction,
        getTotalExposure,
        getWinningPredictions,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error("usePrediction must be used within PredictionProvider");
  }
  return context;
}

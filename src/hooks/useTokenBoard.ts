/**
 * hooks/useTokenBoard.ts
 * Manage token board state and chart data fetching
 */

import { useState, useCallback, useMemo } from "react";
import type { OctopusTokenBoardItem } from "@/components/octopus-market/octopus-market-data";

export type ChartRange = "1H" | "6H" | "24H" | "7D";

export interface UseTokenBoardReturn {
  tokens: OctopusTokenBoardItem[];
  selectedTokenId: string;
  isTokenDetailsOpen: boolean;
  copiedContractId: string | null;
  selectedChartRange: ChartRange;
  isChartRefreshing: boolean;
  selectedToken: OctopusTokenBoardItem | undefined;
  handleSelectToken: (tokenId: string) => void;
  handleOpenTokenDetails: (token: OctopusTokenBoardItem) => void;
  handleCloseTokenDetails: () => void;
  handleCopyContractId: (contractId: string) => void;
  handleSelectChartRange: (range: ChartRange) => void;
  handleRefreshChart: () => Promise<void>;
  handleAddToken: (token: OctopusTokenBoardItem) => void;
  handleUpdateToken: (tokenId: string, updates: Partial<OctopusTokenBoardItem>) => void;
  handleRemoveToken: (tokenId: string) => void;
}

export function useTokenBoard(initialTokens: OctopusTokenBoardItem[] = []): UseTokenBoardReturn {
  const [tokens, setTokens] = useState<OctopusTokenBoardItem[]>(initialTokens);
  const [selectedTokenId, setSelectedTokenId] = useState<string>(initialTokens[0]?.id ?? "");
  const [isTokenDetailsOpen, setIsTokenDetailsOpen] = useState(false);
  const [copiedContractId, setCopiedContractId] = useState<string | null>(null);
  const [selectedChartRange, setSelectedChartRange] = useState<ChartRange>("24H");
  const [isChartRefreshing, setIsChartRefreshing] = useState(false);

  const selectedToken = useMemo(
    () => tokens.find((t) => t.id === selectedTokenId),
    [tokens, selectedTokenId]
  );

  const handleSelectToken = useCallback((tokenId: string) => {
    setSelectedTokenId(tokenId);
  }, []);

  const handleOpenTokenDetails = useCallback((token: OctopusTokenBoardItem) => {
    setSelectedTokenId(token.id);
    setIsTokenDetailsOpen(true);
  }, []);

  const handleCloseTokenDetails = useCallback(() => {
    setIsTokenDetailsOpen(false);
  }, []);

  const handleCopyContractId = useCallback((contractId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(contractId);
      setCopiedContractId(contractId);
      setTimeout(() => {
        setCopiedContractId(null);
      }, 2000);
    }
  }, []);

  const handleSelectChartRange = useCallback((range: ChartRange) => {
    setSelectedChartRange(range);
  }, []);

  const handleRefreshChart = useCallback(async () => {
    setIsChartRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsChartRefreshing(false);
    }
  }, []);

  const handleAddToken = useCallback((token: OctopusTokenBoardItem) => {
    setTokens((prev) => [token, ...prev].slice(0, 12));
  }, []);

  const handleUpdateToken = useCallback((tokenId: string, updates: Partial<OctopusTokenBoardItem>) => {
    setTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, ...updates } : t))
    );
  }, []);

  const handleRemoveToken = useCallback((tokenId: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== tokenId));
  }, []);

  return {
    tokens,
    selectedTokenId,
    isTokenDetailsOpen,
    copiedContractId,
    selectedChartRange,
    isChartRefreshing,
    selectedToken,
    handleSelectToken,
    handleOpenTokenDetails,
    handleCloseTokenDetails,
    handleCopyContractId,
    handleSelectChartRange,
    handleRefreshChart,
    handleAddToken,
    handleUpdateToken,
    handleRemoveToken,
  };
}

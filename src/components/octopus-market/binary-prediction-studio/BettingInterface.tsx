/**
 * BettingInterface.tsx
 * Handles bet placement, amount input, and selection
 */

import { memo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp } from "lucide-react";
import type { MarketOptionSummary } from "./types";
import { formatCurrency, getSelectionClasses } from "./utils";

interface BettingInterfaceProps {
  selectedOption: string | undefined;
  betAmount: string;
  options: MarketOptionSummary[];
  isProcessing?: boolean;
  walletConnected?: boolean;
  onOptionSelect: (optionId: string) => void;
  onAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
  onConnectWallet?: () => void;
}

export const BettingInterface = memo(function BettingInterface({
  selectedOption,
  betAmount,
  options,
  isProcessing = false,
  walletConnected = false,
  onOptionSelect,
  onAmountChange,
  onPlaceBet,
  onConnectWallet,
}: BettingInterfaceProps) {
  const selectedOptionData = options.find((o) => o.id === selectedOption);
  const potentialReturn = selectedOptionData
    ? Number(betAmount || 0) * selectedOptionData.oddsMultiplier
    : 0;

  const handleMaxBet = useCallback(() => {
    onAmountChange("50"); // Example max
  }, [onAmountChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Your Bet</CardTitle>
        <CardDescription>Select an outcome and enter your stake</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Option Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Outcome</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => onOptionSelect(option.id)}
                className={getSelectionClasses(option.id, selectedOption === option.id)}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  <span className="text-xs opacity-75">{option.oddsMultiplier.toFixed(2)}x</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Stake (USD)</label>
            <button
              onClick={handleMaxBet}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Max
            </button>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={betAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            min="0"
            step="0.01"
            disabled={!walletConnected || isProcessing}
            className="text-lg"
          />
        </div>

        {/* Potential Return */}
        {selectedOption && betAmount && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
            <div className="space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If {options.find((o) => o.id === selectedOption)?.label} wins:
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(potentialReturn)}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Profit: {formatCurrency(potentialReturn - Number(betAmount || 0))}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={walletConnected ? onPlaceBet : onConnectWallet}
          disabled={isProcessing || (walletConnected && (!selectedOption || !betAmount))}
          className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
          size="lg"
        >
          <TrendingUp size={18} />
          {walletConnected ? `Place Bet ${betAmount ? `• ${formatCurrency(Number(betAmount))}` : ""}` : "Connect Wallet"}
        </Button>
      </CardContent>
    </Card>
  );
});

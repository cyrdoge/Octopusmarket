/**
 * AdminPanel.tsx
 * Admin controls for creating and managing prediction markets
 */

import { memo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import type { AdminMarketDraft, AdminMarketCreationMode } from "./types";
import { createInitialAdminMarketDraft } from "./utils";
import { predictionMarketCategories } from "../octopus-market-data";

interface AdminPanelProps {
  isAdmin?: boolean;
  draftStatus?: "idle" | "success" | "error";
  statusMessage?: string;
  onCreateMarket?: (draft: AdminMarketDraft) => void;
  adminNotifications?: Array<any>;
  onApproveNotification?: (notificationId: string) => void;
}

export const AdminPanel = memo(function AdminPanel({
  isAdmin = false,
  draftStatus = "idle",
  statusMessage = "",
  onCreateMarket,
  adminNotifications = [],
  onApproveNotification,
}: AdminPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<AdminMarketDraft>(createInitialAdminMarketDraft());

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Access Required</AlertTitle>
        <AlertDescription>You need admin privileges to access this panel.</AlertDescription>
      </Alert>
    );
  }

  const handleDraftChange = (field: keyof AdminMarketDraft, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    setDraft((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], [field]: value };
      return { ...prev, options };
    });
  };

  const handleAddOption = () => {
    setDraft((prev) => ({
      ...prev,
      options: [...prev.options, { label: `Option ${prev.options.length + 1}`, oddsMultiplier: 1.5 }],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (onCreateMarket) {
      onCreateMarket(draft);
      setDraft(createInitialAdminMarketDraft());
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {adminNotifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10">
          <CardHeader>
            <CardTitle className="text-base">Payment Notifications ({adminNotifications.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminNotifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-500/30 dark:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium">{notif.walletAddress}</p>
                  <p className="text-xs text-muted-foreground">{notif.amountUsd} USDC</p>
                </div>
                <Button
                  onClick={() => onApproveNotification?.(notif.id)}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Approve
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Market Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Prediction Market</CardTitle>
              <CardDescription>Add a new prediction event for users to bet on</CardDescription>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? "secondary" : "default"}
              size="sm"
              className="gap-2"
            >
              <Plus size={16} />
              {showForm ? "Cancel" : "New Market"}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="space-y-6 border-t pt-6">
            {/* Status Alert */}
            {draftStatus !== "idle" && (
              <Alert variant={draftStatus === "error" ? "destructive" : "default"}>
                <AlertDescription>{statusMessage}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Market Title</label>
              <Input
                placeholder="e.g., Bitcoin Price on 2024-12-31"
                value={draft.title}
                onChange={(e) => handleDraftChange("title", e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={draft.categoryId}
                onChange={(e) => handleDraftChange("categoryId", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {predictionMarketCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Detailed description of the prediction market"
                value={draft.description}
                onChange={(e) => handleDraftChange("description", e.target.value)}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Betting Options</label>
                <Button onClick={handleAddOption} size="sm" variant="outline" className="gap-1">
                  <Plus size={14} />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {draft.options.map((option, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      placeholder="Option label"
                      value={option.label}
                      onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Odds (e.g., 1.5)"
                      value={option.oddsMultiplier}
                      onChange={(e) => handleOptionChange(index, "oddsMultiplier", parseFloat(e.target.value))}
                      step="0.1"
                      min="1.0"
                      className="w-24"
                    />
                    <Button
                      onClick={() => handleRemoveOption(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={draftStatus === "success" || !draft.title || draft.options.length < 2}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              Create Market
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
});

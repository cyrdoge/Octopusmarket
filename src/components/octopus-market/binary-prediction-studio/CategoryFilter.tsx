/**
 * CategoryFilter.tsx
 * Displays prediction market categories as selectable buttons
 */

import { memo } from "react";
import { predictionMarketCategories } from "../octopus-market-data";

interface CategoryFilterProps {
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategoryFilter = memo(function CategoryFilter({
  activeCategoryId,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>
      <div className="flex flex-wrap gap-2">
        {predictionMarketCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              activeCategoryId === category.id
                ? "bg-orange-500 text-white"
                : "border border-orange-200 bg-white text-zinc-700 hover:bg-orange-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
});

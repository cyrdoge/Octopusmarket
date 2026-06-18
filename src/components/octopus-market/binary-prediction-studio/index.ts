/**
 * binary-prediction-studio/index.tsx
 * Main component - orchestrates sub-components
 *
 * This is the refactored version that will progressively
 * replace the old monolithic binary-prediction-studio.tsx
 */

// For now, import from the old file to maintain functionality
// This will be replaced with sub-components as refactoring progresses
export { BinaryPredictionStudio } from "../binary-prediction-studio";

// Export types and utils for sub-components
export * from "./types";
export * from "./utils";

// Export refactored sub-components
export { EventsList } from "./EventsList";
export { EventCard } from "./EventCard";
export { UserHistory } from "./UserHistory";
export { BettingInterface } from "./BettingInterface";
export { AdminPanel } from "./AdminPanel";
export { CategoryFilter } from "./CategoryFilter";

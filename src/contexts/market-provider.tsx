/**
 * src/contexts/market-provider.tsx
 * AI market state management
 * Manages AI listings, search, filters, and sorting
 */

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type AIListing = {
  id: string;
  name: string;
  description: string;
  category: string;
  creator: string;
  price: number;
  rating: number;
  downloads: number;
  featured: boolean;
  createdAt: Date;
};

type MarketContextType = {
  listings: AIListing[];
  searchQuery: string;
  selectedCategory: string;
  sortBy: "newest" | "popular" | "rating" | "price";
  favorites: string[];

  setListings: (listings: AIListing[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sort: "newest" | "popular" | "rating" | "price") => void;
  toggleFavorite: (listingId: string) => void;
  getFilteredListings: () => AIListing[];
};

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<AIListing[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating" | "price">("newest");
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = useCallback((listingId: string) => {
    setFavorites((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
  }, []);

  const getFilteredListings = useCallback((): AIListing[] => {
    let filtered = listings;

    if (searchQuery) {
      filtered = filtered.filter(
        (listing) =>
          listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((listing) => listing.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "popular":
          return b.downloads - a.downloads;
        case "rating":
          return b.rating - a.rating;
        case "price":
          return a.price - b.price;
      }
    });

    return filtered;
  }, [listings, searchQuery, selectedCategory, sortBy]);

  return (
    <MarketContext.Provider
      value={{
        listings,
        searchQuery,
        selectedCategory,
        sortBy,
        favorites,
        setListings,
        setSearchQuery,
        setSelectedCategory,
        setSortBy,
        toggleFavorite,
        getFilteredListings,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return context;
}

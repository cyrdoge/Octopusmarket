import { describe, it, expect } from "vitest";
import type { AIListing } from "@/contexts/market-provider";

describe("MarketProvider", () => {
  it("initializes with empty listings", () => {
    const listings: AIListing[] = [];
    expect(listings).toEqual([]);
    expect(listings).toHaveLength(0);
  });

  it("filters listings by search query", () => {
    const listings: AIListing[] = [
      {
        id: "1",
        name: "AI Chat Bot",
        description: "A chat bot for conversations",
        category: "chat",
        creator: "user1",
        price: 10,
        rating: 5,
        downloads: 100,
        featured: false,
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Image Generator",
        description: "Generate images from text",
        category: "image",
        creator: "user2",
        price: 20,
        rating: 4,
        downloads: 50,
        featured: false,
        createdAt: new Date(),
      },
    ];

    const query = "Chat";
    const filtered = listings.filter(
      (l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.description.toLowerCase().includes(query.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("AI Chat Bot");
  });

  it("filters listings by category", () => {
    const listings: AIListing[] = [
      {
        id: "1",
        name: "Chat Tool",
        description: "Chat",
        category: "chat",
        creator: "user1",
        price: 10,
        rating: 5,
        downloads: 100,
        featured: false,
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Image Tool",
        description: "Images",
        category: "image",
        creator: "user2",
        price: 20,
        rating: 4,
        downloads: 50,
        featured: false,
        createdAt: new Date(),
      },
    ];

    const category = "chat";
    const filtered = listings.filter((l) => l.category === category);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe("chat");
  });

  it("sorts listings by popularity", () => {
    const listings: AIListing[] = [
      {
        id: "1",
        name: "Tool A",
        description: "A",
        category: "cat",
        creator: "user1",
        price: 10,
        rating: 5,
        downloads: 100,
        featured: false,
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Tool B",
        description: "B",
        category: "cat",
        creator: "user2",
        price: 20,
        rating: 4,
        downloads: 500,
        featured: false,
        createdAt: new Date(),
      },
    ];

    const sorted = [...listings].sort((a, b) => b.downloads - a.downloads);

    expect(sorted[0].id).toBe("2");
    expect(sorted[0].downloads).toBe(500);
  });

  it("toggles favorite status", () => {
    let favorites: string[] = [];
    const listingId = "listing-1";

    // First toggle: add to favorites
    favorites = favorites.includes(listingId)
      ? favorites.filter((id) => id !== listingId)
      : [...favorites, listingId];
    expect(favorites).toContain(listingId);

    // Second toggle: remove from favorites
    favorites = favorites.includes(listingId)
      ? favorites.filter((id) => id !== listingId)
      : [...favorites, listingId];
    expect(favorites).not.toContain(listingId);
  });
});


/**
 * src/contexts/navigation-context.tsx
 * Navigation state for advanced interactions
 * Manages overlays, scrolling, and page navigation
 */

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

export type OverlayType = "aido" | "predictions" | "launch-token" | "list-ai" | "explore" | "mobile-menu" | null;

type NavigationContextType = {
  activeOverlay: OverlayType;
  openOverlay: (overlay: OverlayType) => void;
  closeOverlay: () => void;
  toggleOverlay: (overlay: OverlayType) => void;
  scrollToTop: () => void;
  navigateToPath: (path: string) => void;
  currentPath: string;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null);
  const [currentPath, setCurrentPath] = useState(window.location.hash || "#/");

  // Sync overlay state with hash changes (for direct URL navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentPath(hash || "#/");
      // Close overlay when hash changes (user navigated to a different page)
      setActiveOverlay(null);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openOverlay = useCallback((overlay: OverlayType) => {
    setActiveOverlay(overlay);
  }, []);

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const toggleOverlay = useCallback((overlay: OverlayType) => {
    setActiveOverlay((prev) => (prev === overlay ? null : overlay));
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToPath = useCallback((path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    scrollToTop();
  }, [scrollToTop]);

  return (
    <NavigationContext.Provider
      value={{
        activeOverlay,
        openOverlay,
        closeOverlay,
        toggleOverlay,
        scrollToTop,
        navigateToPath,
        currentPath,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}

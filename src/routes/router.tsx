/**
 * src/routes/router.tsx
 * Main application router with layout hierarchy
 * Uses BrowserRouter for clean URLs (without hash)
 */

import { createBrowserRouter, RouteObject } from "react-router-dom";
import { RootLayout } from "@/layouts/root-layout";
import { MarketLayout } from "@/layouts/market-layout";

// Pages - to be created
import { HomePage } from "@/pages/home";
import { PredictionMarketPage } from "@/pages/prediction-market";
import { LaunchStudioPage } from "@/pages/launch-studio";
import { ListMyAIPage } from "@/pages/list-my-ai";
import { ExplorePage } from "@/pages/explore";
import { PricingPage } from "@/pages/pricing";
import { WalletDashboardPage } from "@/pages/dashboard/wallet-dashboard";
import { MyBetsPage } from "@/pages/dashboard/my-bets";
import { MyWinningsPage } from "@/pages/dashboard/my-winnings";

// Layouts - to be created
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { AdminLayout } from "@/layouts/admin-layout";
import { AdminCenterPage } from "@/pages/admin/admin-center";
import { AdminDatabasePage } from "@/pages/admin/admin-database";

// Market routes (with shared chrome)
const marketRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
  {
    path: "hero",
    element: <HomePage />,
  },
  {
    path: "prediction-market",
    element: <PredictionMarketPage />,
  },
  {
    path: "launch-token",
    element: <LaunchStudioPage mode="launch" />,
  },
  {
    path: "list-my-ai",
    element: <ListMyAIPage />,
  },
  {
    path: "explore",
    element: <ExplorePage />,
  },
  {
    path: "listing-price",
    element: <PricingPage />,
  },
];

// Dashboard routes (My Bets, My Winnings, Wallet)
const dashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <WalletDashboardPage />,
  },
  {
    path: "wallet-dashboard",
    element: <WalletDashboardPage />,
  },
  {
    path: "my-bets",
    element: <MyBetsPage />,
  },
  {
    path: "my-winnings",
    element: <MyWinningsPage />,
  },
];

// Admin routes
const adminRoutes: RouteObject[] = [
  {
    index: true,
    element: <AdminCenterPage />,
  },
  {
    path: "control",
    element: <AdminCenterPage />,
  },
  {
    path: "database",
    element: <AdminDatabasePage />,
  },
];

// Main router configuration
const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <div>Error loading app</div>,
    children: [
      {
        element: <MarketLayout />,
        children: marketRoutes,
      },
      {
        path: "dashboard",
        element: <DashboardLayout />,
        children: dashboardRoutes,
      },
      {
        path: "admin",
        element: <AdminLayout />,
        children: adminRoutes,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

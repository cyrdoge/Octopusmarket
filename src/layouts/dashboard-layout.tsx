/**
 * src/layouts/dashboard-layout.tsx
 * Dashboard layout for user pages (My Bets, My Winnings, Wallet)
 */

import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Trophy } from "lucide-react";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen gap-6">
      {/* Sidebar navigation */}
      <aside className="w-48 border-r bg-sidebar p-4">
        <h2 className="mb-4 text-lg font-semibold">My Dashboard</h2>
        <nav className="space-y-2">
          <Link to="/dashboard/wallet-dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <Wallet className="mr-2 size-4" />
              Wallet
            </Button>
          </Link>
          <Link to="/dashboard/my-bets">
            <Button variant="ghost" className="w-full justify-start">
              <TrendingUp className="mr-2 size-4" />
              My Bets
            </Button>
          </Link>
          <Link to="/dashboard/my-winnings">
            <Button variant="ghost" className="w-full justify-start">
              <Trophy className="mr-2 size-4" />
              My Winnings
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 py-6">
        <Outlet />
      </main>
    </div>
  );
}

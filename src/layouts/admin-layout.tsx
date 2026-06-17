/**
 * src/layouts/admin-layout.tsx
 * Admin layout
 */

import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container py-4">Admin Interface</div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}

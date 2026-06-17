/**
 * src/app.tsx
 * NEW: Mount RouterProvider instead of OctopusMarketPage
 * RootLayout handles all providers
 * main.tsx remains UNCHANGED
 */

import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/router";

export default function App() {
  return <RouterProvider router={router} />;
}

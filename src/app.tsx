import { SnErrorBoundary } from "../supernova/helpers/snErrorBoundary";

import { OctopusLocaleProvider } from "@/components/octopus-market/octopus-locale";
import { OctopusMarketPage } from "@/components/octopus-market/octopus-market-page";

export default function App() {
  return (
    <OctopusLocaleProvider>
      <SnErrorBoundary>
        <OctopusMarketPage />
      </SnErrorBoundary>
    </OctopusLocaleProvider>
  );
}

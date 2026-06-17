# 📐 Best Practices - Architecture Layouts

## 1. Hiérarchie des Layouts

```
RootLayout (Global providers, error boundaries)
  └─ AppLayout (Navigation + header + sidebar)
      └─ FeatureLayout (Feature-specific wrapper)
          └─ PageContent (Actual page content)
```

**Règle**: Chaque layout a UNE responsabilité unique.

---

## 2. Props Patterns

### ✅ BON: Props explicites et typées

```typescript
type AppLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  navigation?: ReactNode;
  variant?: AppLayoutVariant;  // Explicit variant
  sidebarOpen?: boolean;       // Controlled state
  onSidebarOpenChange?: (open: boolean) => void;
};
```

### ❌ MAUVAIS: Props vagues et non typées

```typescript
type AppLayoutProps = {
  children: any;
  props?: any;           // Trop vague
  config?: any;          // Flou
  data?: any;            // On ne sait pas quoi
};
```

---

## 3. Composition vs Props Drilling

### ✅ BON: Composition avec children

```typescript
<AppLayout>
  <PageTemplate title="Market">
    <MarketContent />
  </PageTemplate>
</AppLayout>
```

### ❌ MAUVAIS: Props drilling (antipattern)

```typescript
<AppLayout
  title="Market"
  description="Browse AI"
  showNav={true}
  onNavClick={handler}
  walletConnected={connected}
  walletAddress={address}
  onConnect={connect}
  // ... 20+ props
/>
```

---

## 4. Context Organization

### Par Feature (Recommandé)

```typescript
// src/contexts/
├── market-context.tsx      // Market feature state
├── admin-context.tsx       // Admin feature state
├── chat-context.tsx        // Chat feature state
└── layout-context.tsx      // Global layout state
```

**Benefit**: Facile à tester, pas de couplage.

### Par Layer (À Éviter)

```typescript
// ❌ MAUVAIS
// src/contexts/
├── components/
├── pages/
├── hooks/
└── state/  // Trop générique
```

---

## 5. Naming Conventions

### Layouts

```typescript
// ✅ BON: Explicite
export function RootLayout() { }
export function AppLayout() { }
export function FeatureLayout() { }
export function PageTemplate() { }

// ❌ MAUVAIS: Vague
export function Layout() { }
export function Main() { }
export function Wrapper() { }
```

### Pages

```typescript
// ✅ BON
src/pages/market/explore.tsx        // MarketExplorePage
src/pages/admin/dashboard.tsx       // AdminDashboardPage
src/pages/chat/main.tsx             // ChatPage

// ❌ MAUVAIS
src/pages/market.tsx
src/pages/index.tsx
src/components/market-page.tsx      // Confu, c'est une page pas un component
```

### Components

```typescript
// ✅ BON
src/components/features/market/
├── market-listing-card.tsx
├── market-filters.tsx
└── market-grid.tsx

// ❌ MAUVAIS
src/components/
├── ListingCard.tsx                 // Manque context (pour market? admin?)
├── Card1.tsx
└── Component.tsx
```

---

## 6. State Management Pattern

### Isolation de l'état par feature

```typescript
// src/pages/market/explore.tsx
export function MarketExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");    // Local
  const [filters, setFilters] = useMarket();             // Feature context
  const { isConnected } = useAuth();                      // Global context
  const { listings } = useQuery(['listings'], ...) ;    // React Query

  // Composition
  return (
    <PageTemplate>
      <MarketSearch query={searchQuery} onChange={setSearchQuery} />
      <MarketGrid listings={listings} filters={filters} />
    </PageTemplate>
  );
}
```

### État Sharing Strategy

```
Local State (useState)
  └─ Pour: UI state (inputs, modals, tabs)
  └─ Lifecycle: Mount → Unmount

Feature Context (useMarket, useAdmin)
  └─ Pour: Feature state (filters, selections)
  └─ Lifecycle: While feature is used

Global Context (useAuth, useTheme)
  └─ Pour: Global state (user, theme)
  └─ Lifecycle: App-wide

React Query (useQuery)
  └─ Pour: Server state (listings, predictions)
  └─ Lifecycle: Cache managed by React Query
```

---

## 7. Error Handling Pattern

### Par Layout

```typescript
// RootLayout: Erreurs globales
export function RootLayout() {
  return (
    <SnErrorBoundary>
      <ErrorMonitor>
        {children}
      </ErrorMonitor>
    </SnErrorBoundary>
  );
}

// FeatureLayout: Erreurs feature-spécifiques
export function FeatureLayout() {
  return (
    <ErrorBoundary fallback={<FeatureError />}>
      {children}
    </ErrorBoundary>
  );
}
```

---

## 8. Mobile Responsive

### AppLayout responsif

```typescript
export function AppLayout({ children }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileAppLayout>{children}</MobileAppLayout>;
  }

  return <DesktopAppLayout>{children}</DesktopAppLayout>;
}

// Ou avec variant
<AppLayout variant={isMobile ? "mobile" : "desktop"}>
```

---

## 9. Performance Optimization

### Memo + Lazy Loading

```typescript
// Pages
export const MarketPage = lazy(() => import("./market-page"));
export const ChatPage = lazy(() => import("./chat-page"));

// Layouts (généralement pas besoin)
export const AppLayout = React.memo(AppLayoutComponent);

// Route avec Suspense
<Route
  path="/market"
  element={
    <Suspense fallback={<LoadingPage />}>
      <MarketPage />
    </Suspense>
  }
/>
```

---

## 10. Testing Pattern

### Tester les layouts en isolation

```typescript
// __tests__/app-layout.test.tsx
describe("AppLayout", () => {
  it("renders navigation when provided", () => {
    render(
      <AppLayout navigation={<nav>Nav</nav>}>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("toggles sidebar on mobile", async () => {
    render(<AppLayout {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    // Assertions...
  });
});
```

### Tester les pages intégrées

```typescript
// __tests__/pages/market-explore.test.tsx
describe("MarketExplorePage", () => {
  it("filters listings by search query", () => {
    render(<MarketExplorePage {...props} />);
    const input = screen.getByPlaceholderText(/search/i);
    
    fireEvent.change(input, { target: { value: "chat" } });
    expect(screen.getByText(/1 tool found/i)).toBeInTheDocument();
  });
});
```

---

## 📋 Checklist Quality

- [ ] Chaque layout a 1 responsabilité
- [ ] Props sont explicitement typées
- [ ] Pas de prop-drilling au-delà de 3 niveaux
- [ ] Contextes créés quand besoin de partager état
- [ ] Pages ≤ 200 lignes
- [ ] Layouts ≤ 150 lignes
- [ ] Components ≤ 100 lignes
- [ ] Tests couvrent layouts et pages critiques
- [ ] Mobile-responsive avec `useIsMobile`
- [ ] Error boundaries à chaque niveau

---

## 🚀 Résultat Final

```
App.tsx (50 lignes) → Routeur simple
├── pages/ (7+ pages, ~150 lignes chacune)
├── layouts/ (4 layouts, ~100 lignes chacune)
├── contexts/ (Feature-specific state)
├── hooks/ (Logique réutilisable)
└── components/features/ (Composants métier isolés)
```

**Résultat**: De 2432 lignes → ~1500 lignes distribuées intelligemment ✨

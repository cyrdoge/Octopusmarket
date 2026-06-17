# 🔄 Guide d'Implémentation - Passage aux Layouts

## Phase 1: Setup Initial (30 min)

### 1. Créer la structure des répertoires

```bash
mkdir -p src/layouts
mkdir -p src/pages/{market,admin,chat,predictions,onboarding}
```

### 2. Créer les layouts de base
✅ Déjà créés:
- `src/layouts/root-layout.tsx`
- `src/layouts/app-layout.tsx`
- `src/layouts/feature-layout.tsx`
- `src/layouts/page-template.tsx`

---

## Phase 2: Créer les Pages (1-2 heures)

### Template pour chaque page

```typescript
// src/pages/market/market-page.tsx
import { PageTemplate } from "@/layouts/page-template";

export function MarketPage() {
  return (
    <PageTemplate
      title="AI Market"
      description="Browse community AI tools"
      layoutVariant="default"
    >
      {/* Votre contenu */}
    </PageTemplate>
  );
}
```

### Pages à créer

| Page | Location | Responsabilité |
|---|---|---|
| Market Explore | `pages/market/explore.tsx` | Explorer AI tools |
| Market Listings | `pages/market/listings.tsx` | Gérer listings |
| Chat | `pages/chat/chat.tsx` | Chat avec Aido |
| Predictions | `pages/predictions/main.tsx` | Marchés de prédiction |
| Admin Dashboard | `pages/admin/dashboard.tsx` | Vue admin |
| Admin Database | `pages/admin/database.tsx` | Gestion BD |
| Onboarding | `pages/onboarding/welcome.tsx` | Onboarding flow |

---

## Phase 3: Navigation & Routing (1 heure)

### Créer une navigation centralisée

```typescript
// src/components/shared/main-navigation.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MainNavigation() {
  return (
    <nav className="space-y-2 p-4">
      <Link to="/market">
        <Button variant="ghost" className="w-full justify-start">
          🏪 Market
        </Button>
      </Link>
      <Link to="/chat">
        <Button variant="ghost" className="w-full justify-start">
          💬 Chat
        </Button>
      </Link>
      <Link to="/predictions">
        <Button variant="ghost" className="w-full justify-start">
          📊 Predictions
        </Button>
      </Link>
      <Link to="/admin">
        <Button variant="ghost" className="w-full justify-start">
          ⚙️ Admin
        </Button>
      </Link>
    </nav>
  );
}
```

### Setup React Router

```typescript
// src/app.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RootLayout } from "@/layouts/root-layout";
import { AppLayout } from "@/layouts/app-layout";
import { MainNavigation } from "@/components/shared/main-navigation";
import { MarketPage } from "@/pages/market/explore";
import { ChatPage } from "@/pages/chat/chat";
// ... autres pages

export default function App() {
  return (
    <RootLayout>
      <BrowserRouter>
        <Routes>
          {/* Pages sans sidebar */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Pages avec sidebar */}
          <Route
            element={
              <AppLayout navigation={<MainNavigation />} />
            }
          >
            <Route path="/market" element={<MarketPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RootLayout>
  );
}
```

---

## Phase 4: Migrer App.tsx (2-3 heures)

### Avant

```typescript
// 2432 lignes 😱
export default function App() {
  // Navigation + Market + Chat + Predictions + Admin
  // Tout mélangé...
}
```

### Après

```typescript
// ~50 lignes 🚀
import { RootLayout } from "@/layouts/root-layout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainNavigation } from "@/components/shared/main-navigation";

// Pages
import { MarketPage } from "@/pages/market/explore";
import { ChatPage } from "@/pages/chat/chat";
import { PredictionsPage } from "@/pages/predictions/main";
import { AdminPage } from "@/pages/admin/dashboard";

export default function App() {
  return (
    <RootLayout>
      <BrowserRouter>
        <Routes>
          <Route
            element={<AppLayout navigation={<MainNavigation />} />}
          >
            <Route path="/market" element={<MarketPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RootLayout>
  );
}
```

---

## Phase 5: Extraire Composants Métier (2-3 heures)

### Avant (tout mélangé)

```typescript
// octopus-market-page.tsx
- Navigation
- Wallet connection
- Theme toggle
- Market listing
- Chat interface
- Predictions grid
- Admin panel
```

### Après (séparation claire)

```typescript
// components/features/market/
├── market-section.tsx       // Juste la section market
├── market-listing-card.tsx  // Une carte listing
└── market-header.tsx        // Header market

// components/features/chat/
├── chat-container.tsx       // Juste le chat
├── message-list.tsx         // Liste des messages
└── input-area.tsx           // Zone de saisie

// components/shared/
├── wallet-button.tsx        // Bouton wallet réutilisable
├── theme-toggle.tsx         // Toggle thème
└── user-menu.tsx            // Menu utilisateur
```

---

## 🎯 Checklist d'Implémentation

- [ ] Phase 1: Structure + Layouts créés ✅
- [ ] Phase 2: Pages créées (7+ pages)
- [ ] Phase 3: Navigation + Routing
- [ ] Phase 4: App.tsx migré (de 2432 → ~50 lignes)
- [ ] Phase 5: Composants extraits
- [ ] Tests: Vérifier chaque page
- [ ] Perf: Vérifier les bundle sizes
- [ ] Cleanup: Supprimer octopus-market-page.tsx

---

## 📊 Avant/Après

| Métrique | Avant | Après |
|---|---|---|
| **Lines dans App** | 2432 | ~50 |
| **Nombre de fichiers** | 1 monolithe | 15+ modules |
| **Testabilité** | 😞 Difficile | 😊 Facile |
| **Réutilisabilité** | 🔴 Non | 🟢 Oui |
| **Onboarding dev** | 📖 Complexe | 🚀 Simple |
| **Time to feature** | ⏳ Lent | ⚡ Rapide |

---

## 💡 Tips

1. **Tester progressivement**: Créer pages une par une
2. **Garder App.tsx simple**: C'est juste un routeur
3. **Réutiliser PageTemplate**: Pour cohérence UX
4. **Contexte: Un par feature**: Pas de prop-drilling
5. **Hooks personnalisés**: Pour logique partagée

---

## 🔗 Prochaines Étapes

1. Créer la structure React Router
2. Migrer les pages progressivement
3. Extraire les contextes (Market, Admin, Chat)
4. Refactor les composants partagés
5. Tests E2E
6. Deploy et monitoring

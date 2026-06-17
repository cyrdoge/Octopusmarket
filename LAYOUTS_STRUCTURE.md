# 🏗️ Architecture des Layouts - Octopus

## Structure Proposée

```
src/
├── layouts/
│   ├── root/
│   │   ├── root-layout.tsx          # Layout racine (providers, Error Boundary)
│   │   ├── root-layout.context.tsx  # Context global (wallet, theme, locale)
│   │   └── root-layout.types.ts
│   │
│   ├── app/
│   │   ├── app-layout.tsx           # Navigation + Sidebar + Main content
│   │   ├── app-header.tsx           # Header/Topbar
│   │   ├── app-navigation.tsx       # Navigation principale
│   │   ├── app-sidebar.tsx          # Sidebar (collapsible)
│   │   └── app-layout.types.ts
│   │
│   ├── feature/
│   │   ├── market-layout.tsx        # Layout pour Market
│   │   ├── admin-layout.tsx         # Layout pour Admin
│   │   ├── chat-layout.tsx          # Layout pour Chat
│   │   ├── predictions-layout.tsx   # Layout pour Prédictions
│   │   └── feature-layout.types.ts
│   │
│   └── utils/
│       ├── layout-provider.tsx      # Composant wrapper réutilisable
│       └── use-layout-context.ts    # Hooks contexte
│
├── pages/
│   ├── market/
│   │   ├── market-page.tsx          # Page principale marché
│   │   ├── market-explore.tsx       # Page explorer
│   │   ├── market-listings.tsx      # Page listings
│   │   └── _layout.tsx              # Layout wrapper (optional)
│   │
│   ├── admin/
│   │   ├── admin-dashboard.tsx
│   │   ├── admin-payments.tsx
│   │   ├── admin-database.tsx
│   │   └── _layout.tsx
│   │
│   ├── chat/
│   │   ├── chat-page.tsx
│   │   └── _layout.tsx
│   │
│   ├── predictions/
│   │   ├── predictions-page.tsx
│   │   └── _layout.tsx
│   │
│   ├── onboarding/
│   │   ├── onboarding-page.tsx
│   │   └── _layout.tsx
│   │
│   └── app.tsx                      # App root
│
├── components/
│   ├── ui/                          # Composants Radix UI (inchangés)
│   ├── features/
│   │   ├── market/
│   │   ├── admin/
│   │   ├── chat/
│   │   └── predictions/
│   └── shared/                      # Composants réutilisables
│
└── hooks/
    ├── use-layout-context.ts
    ├── use-mobile.ts
    ├── use-theme-mode.ts
    └── ...
```

---

## 1️⃣ RootLayout

**Responsabilités:**
- Providers (Theme, Locale, Error Boundary)
- Gestion de l'authentification globale
- Contexte wallet/utilisateur

```typescript
// src/layouts/root/root-layout.tsx
```

---

## 2️⃣ AppLayout

**Responsabilités:**
- Navigation principal
- Sidebar (collapsible sur mobile)
- Header/Topbar
- Main content area

**Props:**
```typescript
type AppLayoutProps = {
  children: React.ReactNode;
  showNavigation?: boolean;
  variant?: 'default' | 'fullscreen' | 'minimal';
};
```

---

## 3️⃣ FeatureLayouts

Layouts **optionnels et spécifiques** à chaque feature:

### Market Layout
- Liste des AI tools
- Filtres/recherche
- Social panel

### Admin Layout
- Control center
- Database panel
- Notifications

### Chat Layout
- Chat messages
- Quick prompts
- Memory highlights

### Predictions Layout
- Market grid
- Category filters
- Resolution info

---

## 4️⃣ Pages

Chaque page est un **composant simple** qui utilise les layouts :

```typescript
// src/pages/market/market-page.tsx
export function MarketPage() {
  return (
    <AppLayout variant="default">
      <div className="space-y-6">
        {/* Contenu marché */}
      </div>
    </AppLayout>
  );
}
```

---

## ✅ Bénéfices

| Avantage | Description |
|---|---|
| **Modularité** | Chaque layout = une responsabilité |
| **Réutilisabilité** | Layouts appliqués à plusieurs pages |
| **Testabilité** | Facile de tester chaque layout isolé |
| **Performance** | Pas de re-render inutiles des layouts |
| **Scalabilité** | Facile d'ajouter de nouvelles pages |
| **Maintenabilité** | Code organisé et lisible |

---

## 🚀 Migration Progressive

1. **Phase 1**: Créer RootLayout + AppLayout
2. **Phase 2**: Créer Feature Layouts
3. **Phase 3**: Refactoriser octopus-market-page.tsx
4. **Phase 4**: Migrer tous les composants vers les pages
5. **Phase 5**: Tester et optimiser

---

## 🎯 Résumé

✨ **De monolithe (2432 lignes) → Architecture modulaire (150-200 lignes par fichier)**

## solana-wallet/ Module

Modular Solana wallet management extracted from monolithic `solana-wallet.ts` (637 → ~400 LOC).

### Structure

```
solana-wallet/
├── index.ts                        # Public API exports
├── solana-wallet-types.ts         # Types & interfaces (40 lines)
├── solana-wallet-constants.ts     # RPC, tokens, timeouts (30 lines)
├── solana-wallet-provider.ts      # Detection, connect/disconnect (100 lines)
├── solana-wallet-utils.ts         # Format, parse, mobile (80 lines)
└── solana-wallet-balance.ts       # Caching, persistence (60 lines)
```

### Usage

```typescript
// Import from the module package
import {
  getSolanaProvider,
  connectSolanaWallet,
  formatWalletAddress,
  SOLANA_MAINNET_RPC_URLS,
} from "@/components/octopus-market/solana-wallet";

// Detect available wallet
const provider = getSolanaProvider();

// Connect wallet
const result = await connectSolanaWallet();
if (result) {
  console.log("Connected:", formatWalletAddress(result.address));
}
```

### Module Responsibilities

| Module | Responsibility | Lines |
|--------|---|---|
| **types** | Wallet types, provider interface | 40 |
| **constants** | RPC URLs, USDC mint, timeouts | 30 |
| **provider** | Wallet detection, connect/disconnect | 100 |
| **utils** | Formatting, parsing, mobile helpers | 80 |
| **balance** | Cache management, persistence | 60 |

### Key Exports

- `getSolanaProvider()` - Get current wallet
- `connectSolanaWallet()` - Connect to wallet
- `disconnectSolanaWallet()` - Disconnect
- `formatWalletAddress()` - Pretty print address
- `SOLANA_MAINNET_RPC_URLS` - RPC endpoints

### Next Steps

1. Update imports in:
   - `solana-pay.ts`
   - `solana-payment/` modules
   - `wallet-context.tsx`

2. Keep `solana-wallet.ts` as-is for now (balance fetching is complex)

3. Gradually move balance fetching from `solana-wallet.ts` to `solana-wallet-balance.ts`

### Migration Timeline

- **Phase 1**: Exports from `solana-wallet/` work alongside old `solana-wallet.ts` ✅
- **Phase 2**: Update imports in payment modules (low risk)
- **Phase 3**: Move balance fetching (requires testing)

## solana-payment/ Module

Modular Solana payment processing utilities extracted from the monolithic `solana-pay.ts` (1342 → ~450 LOC).

### Structure

```
solana-payment/
├── index.ts                          # Public API exports
├── solana-payment-types.ts          # Types & constants (80 lines)
├── solana-payment-storage.ts        # localStorage CRUD (60 lines)
├── solana-payment-encoding.ts       # Base58, utilities (80 lines)
├── solana-payment-rpc.ts            # RPC calls, validation (100 lines)
├── solana-payment-references.ts     # Poll/find references (70 lines)
└── solana-payment-builder.ts        # Transaction building (50 lines)
```

### Usage

```typescript
// Import from the module package
import {
  PaymentRequest,
  readStoredTransactions,
  validateTransfer,
  findReference,
  randomHex,
} from "@/components/octopus-market/solana-payment";

// Use any of the exported utilities
const requests = readStoredTransactions();
const reference = await findReference(refId);
```

### Module Responsibilities

| Module | Responsibility | Lines |
|--------|---|---|
| **types** | Shared types, constants, interfaces | 80 |
| **storage** | LocalStorage persistence | 60 |
| **encoding** | Base58, random hex, utilities | 80 |
| **rpc** | Solana RPC calls, validation | 100 |
| **references** | On-chain reference polling | 70 |
| **builder** | Transaction creation stubs | 50 |

### Migration Path

To complete the refactoring:

1. **Replace** old imports in `solana-pay.ts`:
   ```typescript
   // Before
   import { readStoredTransactions } from "solana-pay";
   // After
   import { readStoredTransactions } from "./solana-payment";
   ```

2. **Remove** duplicated functions from `solana-pay.ts` once migrated

3. **Test** each migration step to ensure no breaking changes

### Future Improvements

- [ ] Extract wallet provider logic to `solana-provider/` module
- [ ] Extract balance fetching to `solana-balance/` module
- [ ] Create `solana-transactions/` for transaction building
- [ ] Full refactor of solana-wallet.ts (~600 LOC) into 3-4 focused modules

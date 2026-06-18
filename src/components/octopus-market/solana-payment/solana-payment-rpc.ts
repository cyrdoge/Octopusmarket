/**
 * solana-payment-rpc.ts
 * RPC utilities and on-chain validation
 */

import { SOLANA_RPC_TIMEOUT_MS, SOLANA_LAMPORTS_PER_SOL, type TransferValidationCriteria } from "./solana-payment-types";

type RpcResult<T> = {
  result?: T;
  error?: {
    message?: string;
  };
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        cleanup();
        resolve(result);
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
}

export async function requestSolanaRpc<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.statusText}`);
  }

  const result = (await response.json()) as RpcResult<T>;

  if (result.error) {
    throw new Error(result.error.message || "RPC error");
  }

  if (!result.result) {
    throw new Error(`No result from RPC method ${method}`);
  }

  return result.result;
}

export async function validateTransfer(
  signature: string,
  criteria: TransferValidationCriteria,
  rpcUrl: string
): Promise<void> {
  const confirmations = await withTimeout(
    requestSolanaRpc<{ confirmations: number | null; err: any } | null>(
      rpcUrl,
      "getSignatureStatus",
      [[signature]]
    ),
    SOLANA_RPC_TIMEOUT_MS,
    `signature-validation-timeout-${rpcUrl}`
  );

  if (!confirmations?.[0]?.result?.value) {
    throw new Error("signature-not-found");
  }

  if (confirmations[0].result.value.err) {
    throw new Error(`transaction-failed: ${JSON.stringify(confirmations[0].result.value.err)}`);
  }

  if (!confirmations[0].result.value.confirmations || confirmations[0].result.value.confirmations < 1) {
    throw new Error("signature-not-confirmed");
  }

  // Fetch and validate transaction details
  const transaction = await withTimeout(
    requestSolanaRpc<any>(rpcUrl, "getTransaction", [signature, { encoding: "json", maxSupportedTransactionVersion: 0 }]),
    SOLANA_RPC_TIMEOUT_MS,
    `transaction-fetch-timeout-${rpcUrl}`
  );

  if (!transaction?.transaction) {
    throw new Error("transaction-not-found");
  }

  // Verify recipient in transaction
  const found = transaction.transaction.message.instructions.some((instruction: any) => {
    const programId = transaction.transaction.message.accountKeys[instruction.programIdIndex]?.toString();
    const instructionData = instruction.data || instruction.parsed?.info;

    if (programId === "11111111111111111111111111111111" && instructionData?.destination === criteria.recipient) {
      const amountLamports = instructionData?.lamports;
      const amountSol = amountLamports / SOLANA_LAMPORTS_PER_SOL;
      return Math.abs(amountSol - criteria.amount) < 0.00001;
    }

    if (
      programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" &&
      (instructionData?.destination === criteria.recipient || instructionData?.destination_token_account)
    ) {
      const tokenAmount = instructionData?.tokenAmount?.amount || instructionData?.amount;
      if (tokenAmount) {
        const decimals = criteria.tokenDecimals ?? 6;
        const amount = Number(tokenAmount) / Math.pow(10, decimals);
        return Math.abs(amount - criteria.amount) < 0.001;
      }
    }

    return false;
  });

  if (!found) {
    throw new Error("transfer-amount-mismatch");
  }
}

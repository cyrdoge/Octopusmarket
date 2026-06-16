import { predictionMarketTreasuryAddress } from "@/components/octopus-market/octopus-market-data";
import { getSolanaProvider } from "@/components/octopus-market/solana-wallet";

type AdminSessionRecord = {
  token: string;
  walletAddress: string;
  expiresAt: number;
};

type AdminNoncePayload = {
  nonce: string;
  message: string;
  expiresAt: number;
};

const adminSessionStorageKey = "octopus-market-admin-session-v1";
const adminAuthEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN_AUTH === "true";

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return window.btoa(binary);
}

export function readAdminSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(adminSessionStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as AdminSessionRecord;

    if (!parsedValue?.token || !parsedValue?.walletAddress || !parsedValue?.expiresAt) {
      return null;
    }

    if (parsedValue.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(adminSessionStorageKey);
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(adminSessionStorageKey);
  } catch {
    return;
  }
}

function writeAdminSession(session: AdminSessionRecord) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(adminSessionStorageKey, JSON.stringify(session));
  } catch {
    return;
  }
}

export async function ensureAdminSession(walletAddress: string | null) {
  if (!adminAuthEnabled || !walletAddress || walletAddress !== predictionMarketTreasuryAddress) {
    return null;
  }

  const existingSession = readAdminSession();

  if (existingSession && existingSession.walletAddress === walletAddress) {
    return existingSession;
  }

  const provider = getSolanaProvider();

  if (!provider?.signMessage) {
    throw new Error("admin-signature-unavailable");
  }

  const nonceResponse = await fetch("/api/admin-auth/nonce", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!nonceResponse.ok) {
    throw new Error("admin-nonce-failed");
  }

  const noncePayload = (await nonceResponse.json()) as AdminNoncePayload;
  const encodedMessage = new TextEncoder().encode(noncePayload.message);
  const signatureResponse = await provider.signMessage(encodedMessage, "utf8");
  const signature = bytesToBase64(signatureResponse.signature);

  const verifyResponse = await fetch("/api/admin-auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      walletAddress,
      nonce: noncePayload.nonce,
      message: noncePayload.message,
      signature,
    }),
  });

  if (!verifyResponse.ok) {
    throw new Error("admin-auth-failed");
  }

  const session = (await verifyResponse.json()) as AdminSessionRecord;
  writeAdminSession(session);
  return session;
}

export function buildStoredAdminAuthHeaders(walletAddress: string | null) {
  const session = readAdminSession();

  if (!walletAddress || !session || session.walletAddress !== walletAddress || session.expiresAt <= Date.now()) {
    return null;
  }

  return {
    Authorization: `Bearer ${session.token}`,
    "x-octopus-admin-wallet": walletAddress,
  };
}

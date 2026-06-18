/**
 * solana-payment-encoding.ts
 * Base58 encoding/decoding and URL utilities
 */

import { BASE58_ALPHABET } from "./solana-payment-types";

const base58Map = new Map(BASE58_ALPHABET.split("").map((character, index) => [character, index]));

export function decodeBase58(encoded: string): Uint8Array {
  let bytes = new Uint8Array([0]);

  for (let i = 0; i < encoded.length; ++i) {
    const value = base58Map.get(encoded[i]);

    if (value === undefined) {
      throw new Error(`Invalid character in base58 string: ${encoded[i]}`);
    }

    let carry = value;
    for (let j = 0; j < bytes.length; ++j) {
      const byte = bytes[j];
      const result = byte * 58 + carry;
      bytes[j] = result & 0xff;
      carry = result >> 8;
    }

    if (carry > 0) {
      bytes = new Uint8Array([...bytes, carry & 0xff]);
    }
  }

  for (let i = 0; i < encoded.length && encoded[i] === "1"; ++i) {
    if (bytes.length === 0) {
      bytes = new Uint8Array([0]);
    } else if (bytes[0] !== 0) {
      bytes = new Uint8Array([0, ...bytes]);
    } else {
      bytes[0] = 0;
    }
  }

  return bytes.reverse();
}

export function encodeBase58(bytes: Uint8Array): string {
  let encoded = "";
  let num = 0n;

  for (const byte of bytes) {
    num = num * 256n + BigInt(byte);
  }

  if (num === 0n) {
    encoded = "1";
  } else {
    while (num > 0n) {
      const remainder = Number(num % 58n);
      encoded = BASE58_ALPHABET[remainder] + encoded;
      num = num / 58n;
    }
  }

  for (const byte of bytes) {
    if (byte === 0) {
      encoded = "1" + encoded;
    } else {
      break;
    }
  }

  return encoded;
}

export function randomHex(size: number): string {
  const randomBytes = new Uint8Array(size);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < size; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function extractSignerWalletAddress(transaction: any): string | null {
  try {
    if (transaction?.transaction?.message?.accountKeys?.[0]) {
      return transaction.transaction.message.accountKeys[0].toString();
    }
  } catch {
    return null;
  }
  return null;
}

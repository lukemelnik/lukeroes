import { randomBytes } from "node:crypto";

function byteToHex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

export function generateUuidV7(): string {
  const bytes = randomBytes(16);
  const timestamp = BigInt(Date.now());

  bytes[0] = Number((timestamp >> 40n) & 255n);
  bytes[1] = Number((timestamp >> 32n) & 255n);
  bytes[2] = Number((timestamp >> 24n) & 255n);
  bytes[3] = Number((timestamp >> 16n) & 255n);
  bytes[4] = Number((timestamp >> 8n) & 255n);
  bytes[5] = Number(timestamp & 255n);
  bytes[6] = (bytes[6] & 15) | 112;
  bytes[8] = (bytes[8] & 63) | 128;

  const hex = Array.from(bytes, byteToHex).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

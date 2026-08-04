import type { Address } from "viem";

/// Shorten an address to `0x1234…abcd` for display.
export function formatAddress(address: Address | string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/// Render a score/number with thousands separators.
export function formatScore(value: bigint | number): string {
  return value.toLocaleString("en-US");
}

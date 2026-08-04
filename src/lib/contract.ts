import type { Address } from "viem";
import { base, baseSepolia } from "./wagmi";

const ZERO: Address = "0x0000000000000000000000000000000000000000";

function normalize(value: string | undefined): Address {
  if (!value) return ZERO;
  const trimmed = value.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return ZERO;
  return trimmed as Address;
}

/// Contract address per supported chain, read from Vite env at build time.
export const CONTRACT_ADDRESSES: Record<number, Address> = {
  [base.id]: normalize(import.meta.env.VITE_CONTRACT_ADDRESS_BASE),
  [baseSepolia.id]: normalize(import.meta.env.VITE_CONTRACT_ADDRESS_BASE_SEPOLIA),
};

export function getContractAddress(chainId: number | undefined): Address | undefined {
  if (chainId === undefined) return undefined;
  const addr = CONTRACT_ADDRESSES[chainId];
  if (!addr || addr === ZERO) return undefined;
  return addr;
}

export function isSupportedChain(chainId: number | undefined): boolean {
  return chainId === base.id || chainId === baseSepolia.id;
}

/// The chain the app should default to, from env ("base" | "base-sepolia").
export function defaultChainId(): number {
  return import.meta.env.VITE_DEFAULT_CHAIN === "base" ? base.id : baseSepolia.id;
}

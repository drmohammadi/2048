import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

// Uses injected (MetaMask/Rabby/Brave) + Coinbase Wallet connectors only.
// No WalletConnect project ID is required, so the app works out of the box.

export const supportedChains = [base, baseSepolia] as const;

export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "On-Chain 2048",
    }),
  ],
  transports: {
    [base.id]: http(import.meta.env.VITE_RPC_URL_BASE ?? "https://mainnet.base.org"),
    [baseSepolia.id]: http(
      import.meta.env.VITE_RPC_URL_BASE_SEPOLIA ?? "https://sepolia.base.org",
    ),
  },
});

export { base, baseSepolia };

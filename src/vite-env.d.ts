/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS_BASE: string;
  readonly VITE_CONTRACT_ADDRESS_BASE_SEPOLIA: string;
  readonly VITE_DEFAULT_CHAIN: string;
  readonly VITE_RPC_URL_BASE?: string;
  readonly VITE_RPC_URL_BASE_SEPOLIA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

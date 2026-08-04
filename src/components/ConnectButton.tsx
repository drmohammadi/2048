import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { base, baseSepolia, supportedChains } from "../lib/wagmi";
import { isSupportedChain } from "../lib/contract";
import { formatAddress } from "../lib/format";

export function ConnectButton() {
  const { address, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!address) {
    return (
      <div className="connect-area">
        <div className="connect-buttons">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              className="btn btn-connect"
              disabled={isPending}
              onClick={() => connect({ connector })}
            >
              {connector.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="account">
      <span className={`badge ${isSupportedChain(chainId) ? "badge-ok" : "badge-warn"}`}>
        {chainId === base.id ? "Base" : chainId === baseSepolia.id ? "Base Sepolia" : "Unsupported"}
      </span>
      <span className="address" title={address}>
        {formatAddress(address)}
      </span>
      <button className="btn btn-ghost" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}

export function ChainSelector() {
  const { chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  return (
    <div className="chain-selector">
      <label htmlFor="chain">Network:</label>
      <select
        id="chain"
        value={chainId ?? ""}
        disabled={isPending}
        onChange={(e) => {
          const id = Number(e.target.value);
          const chain = supportedChains.find((c) => c.id === id);
          if (chain) switchChain({ chainId: chain.id });
        }}
      >
        <option value="" disabled>
          Select network
        </option>
        {supportedChains.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

import { useReadContract } from "wagmi";
import { game2048Abi } from "../lib/abi";
import { getContractAddress } from "../lib/contract";

/// Reads the player's best-ever score.
export function useBestScore(player: `0x${string}` | undefined, chainId: number | undefined) {
  const contract = getContractAddress(chainId);
  const read = useReadContract({
    abi: game2048Abi,
    address: contract,
    functionName: "bestScore",
    args: player ? [player] : undefined,
    query: { enabled: Boolean(player) && Boolean(contract) },
  });
  return { bestScore: read.data, refetch: read.refetch };
}

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";
import { game2048Abi } from "../lib/abi";
import { getContractAddress } from "../lib/contract";

export interface LeaderboardRow {
  rank: number;
  player: Address;
  score: bigint;
}

/// Reads the on-chain top-10 leaderboard, filtering out empty slots.
export function useLeaderboard() {
  const { chainId } = useAccount();
  const contract = getContractAddress(chainId);

  const read = useReadContract({
    abi: game2048Abi,
    address: contract,
    functionName: "getLeaderboard",
    query: { enabled: Boolean(contract) },
  });

  const rows: LeaderboardRow[] = useMemo(() => {
    if (!read.data) return [];
    return read.data
      .map((entry, i) => ({ rank: i + 1, player: entry.player, score: entry.score }))
      .filter((row) => row.player !== "0x0000000000000000000000000000000000000000");
  }, [read.data]);

  return { rows, isLoading: read.isLoading, refetch: read.refetch };
}

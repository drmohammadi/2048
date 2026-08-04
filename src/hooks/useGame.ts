import { useCallback, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { game2048Abi, Direction } from "../lib/abi";
import { getContractAddress } from "../lib/contract";

export interface GameState {
  board: bigint;
  score: bigint;
  moves: number;
  active: boolean;
  won: boolean;
}

/// Reads the caller's on-chain game and exposes newGame / play / endGame writers.
export function useGame() {
  const { address, chainId } = useAccount();
  const contract = getContractAddress(chainId);

  const enabled = Boolean(address) && Boolean(contract);

  const gameRead = useReadContract({
    abi: game2048Abi,
    address: contract,
    functionName: "getGame",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const game: GameState | undefined = useMemo(() => {
    if (!gameRead.data) return undefined;
    const [board, score, moves, active, won] = gameRead.data;
    return { board, score, moves: Number(moves), active, won };
  }, [gameRead.data]);

  const { writeContractAsync, data: txHash, isPending, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  const refetch = gameRead.refetch;

  const newGame = useCallback(async () => {
    if (!contract) throw new Error("Contract not configured for this network");
    const hash = await writeContractAsync({
      abi: game2048Abi,
      address: contract,
      functionName: "newGame",
    });
    return hash;
  }, [contract, writeContractAsync]);

  const play = useCallback(
    async (direction: Direction) => {
      if (!contract) throw new Error("Contract not configured for this network");
      const hash = await writeContractAsync({
        abi: game2048Abi,
        address: contract,
        functionName: "play",
        args: [direction],
      });
      return hash;
    },
    [contract, writeContractAsync],
  );

  const endGame = useCallback(async () => {
    if (!contract) throw new Error("Contract not configured for this network");
    const hash = await writeContractAsync({
      abi: game2048Abi,
      address: contract,
      functionName: "endGame",
    });
    return hash;
  }, [contract, writeContractAsync]);

  return {
    game,
    isLoading: gameRead.isLoading,
    isError: gameRead.isError,
    refetch,
    newGame,
    play,
    endGame,
    txHash,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    resetTx: reset,
    contract,
  };
}

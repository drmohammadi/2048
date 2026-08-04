import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Board } from "./components/Board";
import { ConnectButton, ChainSelector } from "./components/ConnectButton";
import { Leaderboard } from "./components/Leaderboard";
import { useGame } from "./hooks/useGame";
import { useBestScore } from "./hooks/useBestScore";
import { Direction, DIRECTION_LABELS } from "./lib/abi";
import { canMove } from "./lib/board";
import { getContractAddress, isSupportedChain } from "./lib/contract";
import { formatScore } from "./lib/format";

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: Direction.Up,
  ArrowDown: Direction.Down,
  ArrowLeft: Direction.Left,
  ArrowRight: Direction.Right,
  w: Direction.Up,
  s: Direction.Down,
  a: Direction.Left,
  d: Direction.Right,
};

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>On-Chain 2048</h1>
          <p className="tagline">Every move is a transaction. Every score is trustless.</p>
        </div>
        <div className="header-actions">
          <ChainSelector />
          <ConnectButton />
        </div>
      </header>

      <main className="app-main">
        <GamePanel />
        <Leaderboard />
      </main>

      <footer className="app-footer">
        <span>Fully on-chain · built on Base</span>
      </footer>
    </div>
  );
}

function GamePanel() {
  const { address, chainId, isConnected } = useAccount();

  // --- Disconnected: prompt to connect a wallet. ---
  if (!isConnected || !address) {
    return (
      <section className="game panel">
        <div className="empty-state">
          <h2>Connect to play</h2>
          <p className="muted">
            2048, but the board lives on-chain. Connect a wallet to start a game — each move
            is submitted as a transaction and validated by the contract.
          </p>
          <ConnectButton />
        </div>
      </section>
    );
  }

  // --- Connected to an unsupported network. ---
  if (!isSupportedChain(chainId)) {
    return (
      <section className="game panel">
        <div className="empty-state">
          <h2>Wrong network</h2>
          <p className="muted">
            This game runs on Base or Base Sepolia. Switch networks to continue.
          </p>
          <ChainSelector />
        </div>
      </section>
    );
  }

  // --- Contract not configured for this chain (missing env address). ---
  if (chainId === undefined || !getContractAddress(chainId)) {
    return (
      <section className="game panel">
        <div className="empty-state">
          <h2>Contract not configured</h2>
          <p className="muted">
            No contract address is set for this network. Deploy the contract and set the
            corresponding <code>VITE_CONTRACT_ADDRESS_*</code> variable.
          </p>
        </div>
      </section>
    );
  }

  return <ActiveGame address={address} chainId={chainId} />;
}

function ActiveGame({ address, chainId }: { address: `0x${string}`; chainId: number }) {
  const {
    game,
    isLoading,
    refetch,
    newGame,
    play,
    endGame,
    isPending,
    isConfirming,
    isConfirmed,
    resetTx,
  } = useGame();
  const { bestScore, refetch: refetchBest } = useBestScore(address, chainId);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const board = game?.board ?? 0n;
  const isActive = Boolean(game?.active);

  // Refetch game + best score once a transaction confirms.
  useEffect(() => {
    if (isConfirmed) {
      refetch();
      refetchBest();
      resetTx();
    }
  }, [isConfirmed, refetch, refetchBest, resetTx]);

  const runTx = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError(null);
      setBusy(true);
      try {
        await fn();
      } catch (err) {
        setError(humanizeError(err));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const doMove = useCallback(
    (direction: Direction) => {
      if (!isActive || !game) return;
      // Skip moves the contract would reject (no effect) to avoid wasted gas / reverts.
      if (!canMove(game.board, direction)) return;
      void runTx(() => play(direction));
    },
    [isActive, game, play, runTx],
  );

  // Keyboard controls (arrows + WASD).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const direction = KEY_TO_DIRECTION[e.key];
      if (direction === undefined) return;
      e.preventDefault();
      if (busy || isPending || isConfirming) return;
      doMove(direction);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove, busy, isPending, isConfirming]);

  const pending = busy || isPending || isConfirming;

  const statusLabel = useMemo(() => {
    if (isPending) return "Confirm in wallet…";
    if (isConfirming) return "Submitting move…";
    if (isLoading) return "Loading game…";
    return null;
  }, [isPending, isConfirming, isLoading]);

  const gameOver = game !== undefined && !isActive && game.moves > 0;
  const noGameYet = game === undefined || (!isActive && game.moves === 0);

  return (
    <section className="game panel">
      <div className="scorebar">
        <div className="score-box">
          <span className="score-label">Score</span>
          <span className="score-value">{formatScore(game?.score ?? 0n)}</span>
        </div>
        <div className="score-box">
          <span className="score-label">Best</span>
          <span className="score-value">{formatScore(bestScore ?? 0n)}</span>
        </div>
        <div className="score-box">
          <span className="score-label">Moves</span>
          <span className="score-value">{game?.moves ?? 0}</span>
        </div>
      </div>

      <Board board={board} />

      {game?.won && isActive ? (
        <p className="banner banner-win">You hit 2048! Keep going for a higher score.</p>
      ) : null}

      {gameOver ? (
        <p className="banner banner-over">
          Game over — final score {formatScore(game.score)}. Start a new game to play again.
        </p>
      ) : null}

      {statusLabel ? <p className="status muted">{statusLabel}</p> : null}
      {error ? <p className="status error">{error}</p> : null}

      <div className="controls">
        {isActive ? (
          <>
            <DirectionPad onMove={doMove} board={board} disabled={pending} />
            <button
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => void runTx(endGame)}
            >
              End game
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() => void runTx(newGame)}
          >
            {noGameYet ? "Start game" : "New game"}
          </button>
        )}
      </div>

      <p className="hint muted">Use arrow keys or WASD to move.</p>
    </section>
  );
}

function DirectionPad({
  onMove,
  board,
  disabled,
}: {
  onMove: (d: Direction) => void;
  board: bigint;
  disabled: boolean;
}) {
  const dirs: Direction[] = [Direction.Up, Direction.Left, Direction.Right, Direction.Down];
  return (
    <div className="dpad">
      {dirs.map((d) => (
        <button
          key={d}
          className={`btn btn-dir dir-${DIRECTION_LABELS[d].toLowerCase()}`}
          disabled={disabled || !canMove(board, d)}
          onClick={() => onMove(d)}
          aria-label={DIRECTION_LABELS[d]}
        >
          {ARROWS[d]}
        </button>
      ))}
    </div>
  );
}

const ARROWS: Record<Direction, string> = {
  [Direction.Up]: "↑",
  [Direction.Down]: "↓",
  [Direction.Left]: "←",
  [Direction.Right]: "→",
};

function humanizeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/User rejected|denied|rejected the request/i.test(message)) {
    return "Transaction rejected.";
  }
  if (/MoveHadNoEffect/i.test(message)) {
    return "That move doesn't change the board.";
  }
  if (/GameAlreadyActive/i.test(message)) {
    return "You already have an active game.";
  }
  if (/NoActiveGame/i.test(message)) {
    return "No active game — start a new one.";
  }
  // Trim overly long RPC error blobs to the first line.
  return message.split("\n")[0].slice(0, 200);
}

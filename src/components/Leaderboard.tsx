import { useLeaderboard } from "../hooks/useLeaderboard";
import { formatAddress, formatScore } from "../lib/format";
import { useAccount } from "wagmi";

/// The on-chain top-10 leaderboard.
export function Leaderboard() {
  const { rows, isLoading } = useLeaderboard();
  const { address } = useAccount();

  return (
    <div className="leaderboard panel">
      <h2>Leaderboard</h2>
      {isLoading && rows.length === 0 ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No scores yet — be the first!</p>
      ) : (
        <ol className="leaderboard-list">
          {rows.map((row) => {
            const isYou = address && row.player.toLowerCase() === address.toLowerCase();
            return (
              <li key={row.player} className={`leaderboard-row ${isYou ? "is-you" : ""}`}>
                <span className="rank">#{row.rank}</span>
                <span className="lb-address" title={row.player}>
                  {formatAddress(row.player)}
                  {isYou ? " (you)" : ""}
                </span>
                <span className="lb-score">{formatScore(row.score)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

import { unpack, tileValue } from "../lib/board";

/// Renders a packed on-chain board as a 4x4 grid of tiles.
export function Board({ board }: { board: bigint }) {
  const tiles = unpack(board);
  return (
    <div className="board" role="grid" aria-label="2048 board">
      {tiles.map((exponent, i) => {
        const value = tileValue(exponent);
        return (
          <div
            key={i}
            role="gridcell"
            className={`tile ${value === 0 ? "tile-empty" : `tile-${value}`}`}
            data-value={value}
          >
            {value === 0 ? "" : value}
          </div>
        );
      })}
    </div>
  );
}

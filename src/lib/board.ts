// A pure TypeScript mirror of the contract's board packing and slide/merge logic.
// The board is a bigint: 16 cells x 4 bits, cell (row r, col c) at bit ((r*4+c)*4).
// Each cell stores the tile *exponent* (0 = empty, 1 => 2, 2 => 4, ...).
//
// This is used to:
//   1. Unpack the on-chain board for rendering.
//   2. Predict the result of a move for optimistic UI (the merge result is deterministic;
//      only the newly spawned tile differs, and that is reconciled from chain state).

import { Direction } from "./abi";

export const CELLS = 16;
const CELL_MASK = 0xfn;
const MAX_EXPONENT = 15;

export type Tiles = number[]; // length 16, exponents

export function unpack(board: bigint): Tiles {
  const tiles: number[] = new Array(CELLS).fill(0);
  for (let i = 0; i < CELLS; i++) {
    tiles[i] = Number((board >> BigInt(i * 4)) & CELL_MASK);
  }
  return tiles;
}

export function pack(tiles: Tiles): bigint {
  let board = 0n;
  for (let i = 0; i < CELLS; i++) {
    board |= (BigInt(tiles[i]) & CELL_MASK) << BigInt(i * 4);
  }
  return board;
}

/// Tile *value* (2^e) from an exponent, or 0 for empty.
export function tileValue(exponent: number): number {
  return exponent === 0 ? 0 : 1 << exponent;
}

function lineIndices(direction: Direction, line: number): number[] {
  const idx: number[] = [];
  if (direction === Direction.Left) {
    for (let c = 0; c < 4; c++) idx.push(line * 4 + c);
  } else if (direction === Direction.Right) {
    for (let c = 0; c < 4; c++) idx.push(line * 4 + (3 - c));
  } else if (direction === Direction.Up) {
    for (let r = 0; r < 4; r++) idx.push(r * 4 + line);
  } else {
    for (let r = 0; r < 4; r++) idx.push((3 - r) * 4 + line);
  }
  return idx;
}

function collapseLine(vals: number[]): { out: number[]; gained: number; changed: boolean } {
  const packed: number[] = [];
  for (const v of vals) if (v !== 0) packed.push(v);

  const out: number[] = [0, 0, 0, 0];
  let w = 0;
  let gained = 0;
  for (let i = 0; i < packed.length; i++) {
    if (i + 1 < packed.length && packed[i] === packed[i + 1] && packed[i] < MAX_EXPONENT) {
      const merged = packed[i] + 1;
      out[w] = merged;
      gained += 1 << merged;
      w++;
      i++;
    } else {
      out[w] = packed[i];
      w++;
    }
  }

  let changed = false;
  for (let i = 0; i < 4; i++) {
    if (out[i] !== vals[i]) {
      changed = true;
      break;
    }
  }
  return { out, gained, changed };
}

/// Apply a slide + merge (no spawn). Mirrors Game2048._applyMove exactly.
export function applyMove(
  board: bigint,
  direction: Direction,
): { board: bigint; gained: number; changed: boolean } {
  const tiles = unpack(board);
  let changed = false;
  let gained = 0;

  for (let line = 0; line < 4; line++) {
    const idx = lineIndices(direction, line);
    const vals = idx.map((i) => tiles[i]);
    const res = collapseLine(vals);
    if (res.changed) {
      changed = true;
      gained += res.gained;
      idx.forEach((cellIndex, k) => {
        tiles[cellIndex] = res.out[k];
      });
    }
  }

  return { board: pack(tiles), gained, changed };
}

/// True if any direction changes the board (i.e. the game is not over).
export function anyMovePossible(board: bigint): boolean {
  const tiles = unpack(board);
  if (tiles.some((t) => t === 0)) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = tiles[r * 4 + c];
      if (c + 1 < 4 && v === tiles[r * 4 + c + 1]) return true;
      if (r + 1 < 4 && v === tiles[(r + 1) * 4 + c]) return true;
    }
  }
  return false;
}

export function canMove(board: bigint, direction: Direction): boolean {
  return applyMove(board, direction).changed;
}

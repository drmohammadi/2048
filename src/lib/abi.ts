import { parseAbi } from "viem";

/// ABI mirroring src/Game2048.sol exactly.
export const game2048Abi = parseAbi([
  // ---- Constants / views ----
  "function LEADERBOARD_SIZE() external view returns (uint256)",
  "function bestScore(address player) external view returns (uint64)",
  "function totalGamesStarted() external view returns (uint256)",
  "function totalGamesFinished() external view returns (uint256)",
  "function getGame(address player) external view returns (uint64 board, uint64 score, uint32 moves, bool active, bool won)",
  "function getTiles(uint64 board) external pure returns (uint16[16] tiles)",
  "function canMove(address player, uint8 direction) external view returns (bool)",
  "function getLeaderboard() external view returns ((address player, uint64 score)[10] entries)",

  // ---- State-changing ----
  "function newGame() external returns (uint64 board)",
  "function play(uint8 direction) external returns (uint64 board, bool over)",
  "function endGame() external",

  // ---- Events ----
  "event GameStarted(address indexed player, uint64 board, uint64 startBlock)",
  "event MovePlayed(address indexed player, uint8 direction, uint64 board, uint64 score, uint32 moves)",
  "event GameWon(address indexed player, uint64 score)",
  "event GameOver(address indexed player, uint64 score, uint32 moves)",
  "event NewBestScore(address indexed player, uint64 score)",
  "event LeaderboardUpdated(address indexed player, uint64 score, uint256 rank)",
]);

export enum Direction {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3,
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  [Direction.Up]: "Up",
  [Direction.Down]: "Down",
  [Direction.Left]: "Left",
  [Direction.Right]: "Right",
};

export const LEADERBOARD_SIZE = 10;

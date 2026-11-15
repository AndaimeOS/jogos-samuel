import type { MissionDefinition, ObstacleDefinition, TrackChunkDefinition } from "./types";

export const obstacleDefinitions: Record<string, ObstacleDefinition> = {
  low: { id: "low", kind: "low", response: "jump", color: 0xffb21c, difficulty: 1 },
  high: { id: "high", kind: "high", response: "roll", color: 0xff5b43, difficulty: 1 },
  block: { id: "block", kind: "block", response: "dodge", color: 0x2463eb, difficulty: 1 },
  train: { id: "train", kind: "train", response: "dodge", color: 0xf2f5f7, difficulty: 2 },
  signal: { id: "signal", kind: "signal", response: "dodge", color: 0xff334c, difficulty: 2 },
  crates: { id: "crates", kind: "crates", response: "jump", color: 0xbb6b34, difficulty: 2 },
  cones: { id: "cones", kind: "cones", response: "dodge", color: 0xff6b2c, difficulty: 2 },
  cart: { id: "cart", kind: "cart", response: "jump", color: 0x23e7ef, difficulty: 3 }
};

export const missions: MissionDefinition[] = [
  { id: "coins", title: "Collect 80 coins", metric: "coins", target: 80, reward: 100 },
  { id: "jumps", title: "Jump 15 times", metric: "jumps", target: 15, reward: 120 },
  { id: "rolls", title: "Roll under 8 gates", metric: "rolls", target: 8, reward: 120 },
  { id: "boards", title: "Use 2 hoverboards", metric: "boards", target: 2, reward: 150 },
  { id: "distance", title: "Run 1,500 m", metric: "distance", target: 1500, reward: 200 },
  { id: "score", title: "Score 12,000", metric: "score", target: 12000, reward: 250 }
];

export const trackChunks: TrackChunkDefinition[] = [
  { id: "warmup", difficulty: 1, rows: [{ z: 12, coins: [-1, 0, 1] }, { z: 24, obstacles: { 0: "low" }, coins: [-1, 1] }, { z: 38, obstacles: { [-1]: "block" }, coins: [0, 1] }] },
  { id: "split", difficulty: 1, rows: [{ z: 12, obstacles: { 1: "train" }, coins: [-1, 0] }, { z: 28, obstacles: { [-1]: "low", 0: "high" }, coins: [1] }, { z: 44, power: { lane: 1, kind: "magnet" } }] },
  { id: "gates", difficulty: 1, rows: [{ z: 10, obstacles: { [-1]: "high" }, coins: [-1] }, { z: 24, obstacles: { 0: "low" }, coins: [0] }, { z: 38, obstacles: { 1: "block" }, coins: [-1, 0] }] },
  { id: "train-hop", difficulty: 2, rows: [{ z: 10, obstacles: { 0: "train" }, coins: [-1, 1] }, { z: 26, obstacles: { [-1]: "crates", 1: "signal" }, coins: [0] }, { z: 42, power: { lane: 0, kind: "shield" } }] },
  { id: "zigzag", difficulty: 2, rows: [{ z: 8, obstacles: { [-1]: "block", 0: "block" }, coins: [1] }, { z: 22, obstacles: { 0: "block", 1: "block" }, coins: [-1] }, { z: 36, obstacles: { [-1]: "cones", 1: "cones" }, coins: [0] }] },
  { id: "construction", difficulty: 2, rows: [{ z: 10, obstacles: { [-1]: "crates", 1: "cart" }, coins: [0] }, { z: 25, obstacles: { 0: "high" }, coins: [0] }, { z: 40, power: { lane: -1, kind: "multiplier" } }] },
  { id: "rush", difficulty: 3, rows: [{ z: 8, obstacles: { [-1]: "train", 1: "train" }, coins: [0] }, { z: 24, obstacles: { 0: "low", 1: "high" }, coins: [-1] }, { z: 40, obstacles: { [-1]: "signal", 0: "train" }, coins: [1] }] },
  { id: "reward", difficulty: 1, rows: [{ z: 8, coins: [-1, 0, 1] }, { z: 18, coins: [-1, 0, 1] }, { z: 30, power: { lane: 0, kind: "board" } }, { z: 42, coins: [-1, 0, 1] }] }
];

export const cosmetics = [
  { id: "rook", name: "Rook Classic", type: "runner", price: 0, color: "#ff5b43" },
  { id: "cyan-jacket", name: "Signal Blue", type: "outfit", price: 450, color: "#23e7ef" },
  { id: "gold-kicks", name: "Rush Gold", type: "shoes", price: 700, color: "#ffcc34" },
  { id: "pulse", name: "Pulse Board", type: "board", price: 0, color: "#23e7ef" },
  { id: "ember", name: "Ember Board", type: "board", price: 900, color: "#ff5b43" }
];

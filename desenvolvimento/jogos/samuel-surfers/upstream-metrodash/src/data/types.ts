export type Lane = -1 | 0 | 1;
export type ObstacleKind = "low" | "high" | "block" | "train" | "signal" | "crates" | "cones" | "cart";

export interface UserSettings {
  music: number;
  sfx: number;
  reducedMotion: boolean;
  leftHanded: boolean;
  tapControls: boolean;
  screenShake: boolean;
  highContrast: boolean;
  sensitivity: number;
}

export interface MissionDefinition {
  id: string;
  title: string;
  metric: "coins" | "jumps" | "rolls" | "boards" | "score" | "distance" | "magnets";
  target: number;
  reward: number;
}

export interface MissionProgress {
  id: string;
  value: number;
  complete: boolean;
}

export interface ObstacleDefinition {
  id: string;
  kind: ObstacleKind;
  response: "jump" | "roll" | "dodge";
  color: number;
  difficulty: number;
}

export interface ChunkRow {
  z: number;
  obstacles?: Partial<Record<Lane, ObstacleKind>>;
  coins?: Lane[];
  power?: { lane: Lane; kind: "magnet" | "shield" | "multiplier" | "sneakers" | "board" };
}

export interface TrackChunkDefinition {
  id: string;
  difficulty: number;
  rows: ChunkRow[];
}

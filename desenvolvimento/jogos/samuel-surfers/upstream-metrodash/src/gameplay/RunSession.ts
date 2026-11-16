import type { InputAction } from "../core/EventBus";
import { trackChunks } from "../data/gameData";
import type { Lane, MissionDefinition, TrackChunkDefinition } from "../data/types";

export type EntityKind =
  | "coin" | "magnet" | "shield" | "multiplier" | "sneakers" | "board"
  | "low" | "high" | "block" | "train" | "signal" | "crates" | "cones" | "cart";

export interface WorldEntity {
  id: number;
  kind: EntityKind;
  lane: Lane;
  z: number;
  active: boolean;
}

export interface RunHooks {
  cue(name: "coin" | "jump" | "roll" | "lane" | "power" | "board" | "crash" | "mission"): void;
  toast(message: string): void;
  gameOver(): void;
  shake(): void;
}

export interface RunSnapshot {
  score: number;
  coins: number;
  distance: number;
  multiplier: number;
  boards: number;
  lane: Lane;
  playerX: number;
  playerY: number;
  rolling: boolean;
  jumping: boolean;
  protected: boolean;
  speed: number;
  powerups: Record<string, number>;
  missionValue: number;
  missionTarget: number;
}

export class RunSession {
  readonly entities: WorldEntity[] = [];
  private nextId = 1;
  private nextChunkZ = 30;
  private elapsed = 0;
  private jumpVelocity = 0;
  private targetLane: Lane = 0;
  private lanePosition = 0;
  private rollTime = 0;
  private invulnerableTime = 0;
  private stumbleWindow = 0;
  private metrics: Record<string, number> = { coins: 0, jumps: 0, rolls: 0, boards: 0, score: 0, distance: 0, magnets: 0 };
  private completedMission = false;
  private activeMission: MissionDefinition;
  private activePowers: Record<string, number> = {};

  score = 0;
  coins = 0;
  distance = 0;
  multiplier = 1;
  boards = 2;
  playerY = 0;
  speed = 16;
  ended = false;

  constructor(private hooks: RunHooks, mission: MissionDefinition) {
    this.activeMission = mission;
    for (let i = 0; i < 3; i++) this.spawnChunk();
  }

  update(dt: number): void {
    if (this.ended) return;
    this.elapsed += dt;
    this.speed = Math.min(34, 16 + this.elapsed * 0.075);
    const traveled = this.speed * dt;
    this.distance += traveled;
    this.score = Math.floor(this.distance * 12 * this.multiplier + this.coins * 40);
    this.metrics.distance = this.distance;
    this.metrics.score = this.score;
    this.lanePosition += (this.targetLane - this.lanePosition) * Math.min(1, dt * 13);

    if (this.playerY > 0 || this.jumpVelocity > 0) {
      this.jumpVelocity -= 27 * dt;
      this.playerY = Math.max(0, this.playerY + this.jumpVelocity * dt);
      if (this.playerY === 0) this.jumpVelocity = 0;
    }
    this.rollTime = Math.max(0, this.rollTime - dt);
    this.invulnerableTime = Math.max(0, this.invulnerableTime - dt);
    this.stumbleWindow = Math.max(0, this.stumbleWindow - dt);
    Object.keys(this.activePowers).forEach((key) => {
      this.activePowers[key] = Math.max(0, this.activePowers[key] - dt);
      if (this.activePowers[key] <= 0) delete this.activePowers[key];
    });
    this.multiplier = 1 + Math.min(4, Math.floor(this.distance / 500)) + (this.activePowers.multiplier ? 2 : 0);

    for (const entity of this.entities) {
      if (!entity.active) continue;
      entity.z -= traveled;
      if (entity.kind === "cart") entity.lane = Math.sin((entity.z + entity.id) * 0.06) > 0 ? 1 : -1;
      if (this.activePowers.magnet && entity.kind === "coin" && entity.z < 13) {
        entity.lane = this.currentLane();
        entity.z -= traveled * 1.8;
      }
      if (entity.z < 1.5 && entity.z > -1.2 && entity.lane === this.currentLane()) this.collide(entity);
      if (entity.z < -5) entity.active = false;
    }
    while (this.nextChunkZ < 150) this.spawnChunk();
    this.nextChunkZ -= traveled;
    this.checkMission();
  }

  action(action: InputAction): void {
    if (this.ended) return;
    if (action === "left" && this.targetLane > -1) {
      this.targetLane = (this.targetLane - 1) as Lane;
      this.hooks.cue("lane");
    } else if (action === "right" && this.targetLane < 1) {
      this.targetLane = (this.targetLane + 1) as Lane;
      this.hooks.cue("lane");
    } else if (action === "jump" && this.playerY === 0 && this.rollTime <= 0) {
      this.jumpVelocity = this.activePowers.sneakers ? 12.5 : 9.4;
      this.metrics.jumps += 1;
      this.hooks.cue("jump");
    } else if (action === "roll" && this.playerY === 0) {
      this.rollTime = 0.75;
      this.metrics.rolls += 1;
      this.hooks.cue("roll");
    } else if (action === "board" && this.boards > 0 && !this.activePowers.board) {
      this.boards -= 1;
      this.metrics.boards += 1;
      this.activePowers.board = 12;
      this.hooks.cue("board");
      this.hooks.toast("HOVERBOARD READY");
    }
  }

  snapshot(): RunSnapshot {
    return {
      score: this.score,
      coins: this.coins,
      distance: Math.floor(this.distance),
      multiplier: this.multiplier,
      boards: this.boards,
      lane: this.targetLane,
      playerX: this.lanePosition,
      playerY: this.playerY,
      rolling: this.rollTime > 0,
      jumping: this.playerY > 0,
      protected: Boolean(this.activePowers.shield || this.activePowers.board || this.invulnerableTime),
      speed: this.speed,
      powerups: { ...this.activePowers },
      missionValue: Math.floor(this.metrics[this.activeMission.metric] ?? 0),
      missionTarget: this.activeMission.target
    };
  }

  missionXp(): number {
    return this.completedMission ? this.activeMission.reward : 0;
  }

  private currentLane(): Lane {
    return Math.round(this.lanePosition) as Lane;
  }

  private collide(entity: WorldEntity): void {
    if (!entity.active) return;
    if (entity.kind === "coin") {
      entity.active = false;
      const amount = this.activePowers.doubler ? 2 : 1;
      this.coins += amount;
      this.metrics.coins += amount;
      this.hooks.cue("coin");
      return;
    }
    if (["magnet", "shield", "multiplier", "sneakers", "board"].includes(entity.kind)) {
      entity.active = false;
      if (entity.kind === "board") {
        this.boards += 1;
        this.hooks.toast("+1 HOVERBOARD");
      } else {
        this.activePowers[entity.kind] = entity.kind === "shield" ? 18 : 12;
        if (entity.kind === "magnet") this.metrics.magnets += 1;
        this.hooks.toast(`${entity.kind.toUpperCase()} ACTIVE`);
      }
      this.hooks.cue("power");
      return;
    }

    const avoided =
      (["low", "crates", "cart"].includes(entity.kind) && this.playerY > 1.05) ||
      (entity.kind === "high" && this.rollTime > 0) ||
      (this.invulnerableTime > 0);
    if (avoided) return;
    entity.active = false;
    if (this.activePowers.board || this.activePowers.shield) {
      delete this.activePowers.board;
      delete this.activePowers.shield;
      this.invulnerableTime = 1.4;
      this.hooks.cue("crash");
      this.hooks.toast("PROTECTION SAVED YOU");
      this.hooks.shake();
      return;
    }
    if (this.stumbleWindow <= 0 && !["train", "signal"].includes(entity.kind)) {
      this.stumbleWindow = 6;
      this.invulnerableTime = 1.2;
      this.speed = Math.max(13, this.speed - 3);
      this.hooks.cue("crash");
      this.hooks.toast("GUARD IS CLOSING IN");
      this.hooks.shake();
      return;
    }
    this.ended = true;
    this.hooks.cue("crash");
    this.hooks.shake();
    this.hooks.gameOver();
  }

  private checkMission(): void {
    if (this.completedMission) return;
    if ((this.metrics[this.activeMission.metric] ?? 0) >= this.activeMission.target) {
      this.completedMission = true;
      this.hooks.cue("mission");
      this.hooks.toast(`MISSION COMPLETE  +${this.activeMission.reward} XP`);
    }
  }

  private spawnChunk(): void {
    const difficulty = Math.min(3, 1 + Math.floor(this.elapsed / 35));
    const options = trackChunks.filter((chunk) => chunk.difficulty <= difficulty);
    const chunk: TrackChunkDefinition = options[Math.floor(Math.random() * options.length)];
    const base = this.nextChunkZ;
    for (const row of chunk.rows) {
      if (row.coins) {
        row.coins.forEach((lane) => {
          for (let i = 0; i < 4; i++) this.entities.push({ id: this.nextId++, kind: "coin", lane, z: base + row.z + i * 2.2, active: true });
        });
      }
      if (row.obstacles) {
        ([-1, 0, 1] as Lane[]).forEach((lane) => {
          const kind = row.obstacles?.[lane];
          if (kind) this.entities.push({ id: this.nextId++, kind, lane, z: base + row.z, active: true });
        });
      }
      if (row.power) this.entities.push({ id: this.nextId++, kind: row.power.kind, lane: row.power.lane, z: base + row.z, active: true });
    }
    this.nextChunkZ += 58;
    if (this.entities.length > 450) {
      const active = this.entities.filter((entity) => entity.active);
      this.entities.splice(0, this.entities.length, ...active);
    }
  }
}

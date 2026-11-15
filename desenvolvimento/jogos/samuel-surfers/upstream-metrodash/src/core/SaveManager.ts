import type { UserSettings, MissionProgress } from "../data/types";

export interface SaveData {
  version: number;
  highScore: number;
  totalCoins: number;
  lifetimeDistance: number;
  xp: number;
  level: number;
  selectedCharacterId: string;
  selectedBoardId: string;
  unlockedCosmetics: string[];
  missions: MissionProgress[];
  lastDailyKey: string;
  dailyLetters: string[];
  settings: UserSettings;
}

const defaultSettings: UserSettings = {
  music: 0.45,
  sfx: 0.75,
  reducedMotion: false,
  leftHanded: false,
  tapControls: true,
  screenShake: true,
  highContrast: false,
  sensitivity: 1
};

const defaults: SaveData = {
  version: 1,
  highScore: 0,
  totalCoins: 120,
  lifetimeDistance: 0,
  xp: 0,
  level: 1,
  selectedCharacterId: "rook",
  selectedBoardId: "pulse",
  unlockedCosmetics: ["rook", "pulse"],
  missions: [],
  lastDailyKey: "",
  dailyLetters: [],
  settings: defaultSettings
};

export class SaveManager {
  private readonly key = "metro-dash-save-v1";
  data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        ...structuredClone(defaults),
        ...parsed,
        settings: { ...defaultSettings, ...parsed.settings }
      };
    } catch {
      return structuredClone(defaults);
    }
  }

  save(): void {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  }

  commitRun(score: number, coins: number, distance: number, missionXp: number): boolean {
    const isHigh = score > this.data.highScore;
    this.data.highScore = Math.max(this.data.highScore, score);
    this.data.totalCoins += coins;
    this.data.lifetimeDistance += distance;
    this.data.xp += missionXp + Math.floor(distance / 50);
    while (this.data.xp >= this.data.level * 250) {
      this.data.xp -= this.data.level * 250;
      this.data.level += 1;
    }
    this.save();
    return isHigh;
  }

  reset(): void {
    this.data = structuredClone(defaults);
    this.save();
  }
}

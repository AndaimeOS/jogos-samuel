export class AudioManager {
  private context?: AudioContext;
  private musicTimer?: number;
  private step = 0;

  constructor(private musicVolume = 0.45, private sfxVolume = 0.75) {}

  unlock(): void {
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVolume = music;
    this.sfxVolume = sfx;
  }

  startMusic(mode: "menu" | "run"): void {
    this.unlock();
    this.stopMusic();
    const bpm = mode === "run" ? 142 : 108;
    const notes = mode === "run" ? [110, 165, 196, 147, 220, 165, 247, 196] : [110, 147, 165, 220];
    const tick = () => {
      const frequency = notes[this.step++ % notes.length];
      this.tone(frequency, 0.12, "triangle", this.musicVolume * 0.22);
      if (this.step % 4 === 0) this.tone(55, 0.08, "sine", this.musicVolume * 0.2);
    };
    tick();
    this.musicTimer = window.setInterval(tick, 60_000 / bpm / 2);
  }

  stopMusic(): void {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }

  cue(name: "ui" | "coin" | "jump" | "roll" | "lane" | "power" | "board" | "crash" | "mission" | "high"): void {
    const presets: Record<typeof name, [number, number, OscillatorType]> = {
      ui: [420, 0.045, "sine"],
      coin: [880, 0.055, "square"],
      jump: [260, 0.1, "triangle"],
      roll: [130, 0.1, "sawtooth"],
      lane: [190, 0.04, "triangle"],
      power: [660, 0.22, "sine"],
      board: [330, 0.25, "sawtooth"],
      crash: [75, 0.35, "sawtooth"],
      mission: [990, 0.35, "triangle"],
      high: [1320, 0.5, "square"]
    };
    const [frequency, duration, type] = presets[name];
    this.tone(frequency, duration, type, this.sfxVolume * 0.18);
    if (name === "coin" || name === "mission" || name === "high") {
      window.setTimeout(() => this.tone(frequency * 1.5, duration, type, this.sfxVolume * 0.12), 55);
    }
  }

  private tone(frequency: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.context || volume <= 0.001) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}

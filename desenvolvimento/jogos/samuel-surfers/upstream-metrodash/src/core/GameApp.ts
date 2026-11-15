import { registerSW } from "virtual:pwa-register";
import { AudioManager } from "./AudioManager";
import { InputManager } from "./InputManager";
import { SaveManager } from "./SaveManager";
import { RunSession } from "../gameplay/RunSession";
import { GameScene } from "../world/GameScene";
import { cosmetics, missions } from "../data/gameData";
import type { InputAction } from "./EventBus";

type AppState = "menu" | "missions" | "shop" | "settings" | "tutorial" | "countdown" | "running" | "paused" | "gameover";

export class GameApp {
  private save = new SaveManager();
  private audio = new AudioManager(this.save.data.settings.music, this.save.data.settings.sfx);
  private sceneHost: HTMLElement;
  private uiHost: HTMLElement;
  private scene: GameScene;
  private input: InputManager;
  private session?: RunSession;
  private state: AppState = "menu";
  private raf = 0;
  private previous = performance.now();
  private accumulator = 0;
  private readonly fixedStep = 1 / 120;
  private toastTimer?: number;
  private deferredInstall?: Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
  private currentMission = missions[0];
  private resultCommitted = false;

  constructor(private root: HTMLElement) {
    this.root.innerHTML = `
      <main class="app-shell">
        <div id="scene" class="scene-host" aria-label="Metro Dash 3D game world"></div>
        <div id="ui" class="ui-host" aria-live="polite"></div>
        <div id="toast" class="toast" role="status"></div>
      </main>`;
    this.sceneHost = this.requireElement("#scene");
    this.uiHost = this.requireElement("#ui");
    this.scene = new GameScene(this.sceneHost);
    this.input = new InputManager(this.root, (action) => this.handleAction(action));
    this.applySettings();
    this.bindInstall();
    this.renderState();
    this.audio.startMusic("menu");
    registerSW({ immediate: true });
    this.raf = requestAnimationFrame(this.loop);
  }

  private requireElement(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  }

  private loop = (now: number): void => {
    const frame = Math.min(0.05, (now - this.previous) / 1000);
    this.previous = now;
    if (this.state === "running" && this.session) {
      this.accumulator += frame;
      while (this.accumulator >= this.fixedStep) {
        this.session.update(this.fixedStep);
        this.accumulator -= this.fixedStep;
      }
      this.updateHud();
    }
    this.scene.render(this.session?.snapshot(), this.session?.entities ?? [], frame);
    this.raf = requestAnimationFrame(this.loop);
  };

  private setState(state: AppState): void {
    this.state = state;
    this.scene.setRunning(state === "running");
    this.renderState();
  }

  private renderState(): void {
    this.uiHost.className = `ui-host state-${this.state} ${this.save.data.settings.leftHanded ? "left-handed" : ""}`;
    if (this.state === "menu") this.renderMenu();
    else if (this.state === "missions") this.renderMissions();
    else if (this.state === "shop") this.renderShop();
    else if (this.state === "settings") this.renderSettings();
    else if (this.state === "tutorial") this.renderTutorial();
    else if (this.state === "countdown") this.renderCountdown();
    else if (this.state === "running") this.renderHud();
    else if (this.state === "paused") this.renderPause();
    else if (this.state === "gameover") this.renderGameOver();
    this.bindButtons();
  }

  private renderMenu(): void {
    const today = new Date().toISOString().slice(0, 10);
    const newDaily = this.save.data.lastDailyKey !== today;
    this.uiHost.innerHTML = `
      <section class="menu-screen">
        <div class="menu-art" aria-hidden="true"></div>
        <div class="menu-vignette"></div>
        <header class="topbar">
          <div class="brand"><span class="brand-mark">M</span><span>METRO<br>DASH</span></div>
          <div class="wallet" aria-label="${this.save.data.totalCoins} coins"><span class="coin-icon">◆</span>${this.format(this.save.data.totalCoins)}</div>
          <button class="icon-button" data-action="settings" aria-label="Settings">⚙</button>
        </header>
        <div class="menu-content">
          <div class="menu-copy">
            <h1>RUN THE CITY.</h1>
            <p>Switch lanes. Catch the line. Leave the guard in the dust.</p>
            <button class="primary play-button" data-action="play"><span>PLAY</span><small>BEST ${this.format(this.save.data.highScore)}</small></button>
            <button class="secondary install-button" data-action="install">INSTALL APP</button>
          </div>
          <nav class="menu-rail" aria-label="Game menu">
            <button data-action="missions"><span class="rail-icon">✓</span><span>MISSIONS</span><small>${this.currentMission.title}</small></button>
            <button data-action="shop"><span class="rail-icon">◈</span><span>LOCKER</span><small>Boards &amp; style</small></button>
            <button data-action="daily"><span class="rail-icon">M</span><span>DAILY RUN</span><small>${newDaily ? "New route ready" : "METRO hunt active"}</small></button>
          </nav>
        </div>
        <footer class="menu-footer"><span>ROOK · LEVEL ${this.save.data.level}</span><span>${navigator.onLine ? "ONLINE" : "OFFLINE READY"} · v1.0</span></footer>
      </section>`;
  }

  private renderHud(): void {
    const snapshot = this.session?.snapshot();
    this.uiHost.innerHTML = `
      <section class="hud" aria-label="Gameplay heads-up display">
        <div class="hud-top">
          <div class="hud-stat score"><strong id="score">${this.format(snapshot?.score ?? 0)}</strong><span>SCORE</span></div>
          <div class="hud-stat multiplier"><strong id="multiplier">x${snapshot?.multiplier ?? 1}</strong><span>MULTIPLIER</span></div>
          <div class="hud-cluster">
            <div class="hud-stat coins"><strong><i class="coin-icon">◆</i><span id="coins">${snapshot?.coins ?? 0}</span></strong></div>
            <button class="icon-button pause-button" data-action="pause" aria-label="Pause">Ⅱ</button>
          </div>
        </div>
        <div id="power-timers" class="power-timers"></div>
        <div class="mission-chip"><span>MISSION</span><strong id="mission-progress">${snapshot?.missionValue ?? 0} / ${snapshot?.missionTarget ?? 0}</strong></div>
        <div class="board-chip" data-action="board" role="button" tabindex="0" aria-label="Activate hoverboard">
          <span class="board-icon">▰</span><strong id="boards">${snapshot?.boards ?? 0}</strong>
        </div>
        <div class="touch-controls" aria-label="Touch controls">
          <button data-input="left" aria-label="Move left">‹</button>
          <button data-input="jump" aria-label="Jump">⌃</button>
          <button data-input="roll" aria-label="Roll">⌄</button>
          <button data-input="right" aria-label="Move right">›</button>
        </div>
      </section>`;
  }

  private updateHud(): void {
    const snapshot = this.session?.snapshot();
    if (!snapshot) return;
    this.text("#score", this.format(snapshot.score));
    this.text("#multiplier", `x${snapshot.multiplier}`);
    this.text("#coins", String(snapshot.coins));
    this.text("#boards", String(snapshot.boards));
    this.text("#mission-progress", `${Math.min(snapshot.missionValue, snapshot.missionTarget)} / ${snapshot.missionTarget}`);
    const powers = Object.entries(snapshot.powerups)
      .filter(([, time]) => time > 0)
      .map(([name, time]) => `<div class="power-timer"><span>${name.toUpperCase()}</span><strong>${Math.ceil(time).toString().padStart(2, "0")}</strong></div>`)
      .join("");
    const timerHost = this.uiHost.querySelector("#power-timers");
    if (timerHost && timerHost.innerHTML !== powers) timerHost.innerHTML = powers;
  }

  private renderPause(): void {
    this.uiHost.innerHTML = this.overlay("PAUSED", "Take a breath. The rails will wait.", `
      <button class="primary" data-action="resume">RESUME</button>
      <button class="secondary" data-action="restart">RESTART</button>
      <button class="secondary" data-action="settings">SETTINGS</button>
      <button class="text-button" data-action="menu">QUIT TO MENU</button>`);
  }

  private renderGameOver(): void {
    const snapshot = this.session?.snapshot();
    if (!snapshot) return;
    if (!this.resultCommitted) {
      const high = this.save.commitRun(snapshot.score, snapshot.coins, snapshot.distance, this.session?.missionXp() ?? 0);
      this.resultCommitted = true;
      window.embedAnalytics?.endRun("lose", snapshot.score);
      if (high) window.setTimeout(() => this.audio.cue("high"), 250);
    }
    const isHigh = snapshot.score >= this.save.data.highScore && snapshot.score > 0;
    this.uiHost.innerHTML = this.overlay(isHigh ? "NEW HIGH SCORE!" : "RUN COMPLETE", isHigh ? "The city has a new number to chase." : "Every run moves Rook forward.", `
      <div class="results-grid">
        <div><span>SCORE</span><strong>${this.format(snapshot.score)}</strong></div>
        <div><span>COINS</span><strong>${snapshot.coins}</strong></div>
        <div><span>DISTANCE</span><strong>${snapshot.distance} m</strong></div>
        <div><span>XP</span><strong>+${Math.floor(snapshot.distance / 50) + (this.session?.missionXp() ?? 0)}</strong></div>
      </div>
      <div class="xp-bar"><span style="width:${Math.min(100, (this.save.data.xp / (this.save.data.level * 250)) * 100)}%"></span></div>
      <p class="level-copy">LEVEL ${this.save.data.level} · ${this.save.data.xp} / ${this.save.data.level * 250} XP</p>
      <button class="primary" data-action="restart">PLAY AGAIN</button>
      <button class="secondary" data-action="menu">MAIN MENU</button>`);
  }

  private renderMissions(): void {
    this.uiHost.innerHTML = this.panel("MISSIONS", "Pick a goal. Rewards land after the run.", `
      <div class="mission-list">${missions.map((mission, index) => `
        <button class="mission-row ${mission.id === this.currentMission.id ? "selected" : ""}" data-mission="${index}">
          <span class="mission-symbol">${mission.metric === "coins" ? "◆" : mission.metric === "distance" ? "➜" : "✓"}</span>
          <span><strong>${mission.title}</strong><small>+${mission.reward} XP</small></span>
          <span class="select-dot"></span>
        </button>`).join("")}</div>
      <button class="secondary" data-action="menu">BACK</button>`);
  }

  private renderShop(): void {
    this.uiHost.innerHTML = this.panel("ROOK'S LOCKER", "Style earns no speed. It does make the getaway look better.", `
      <div class="shop-balance"><span class="coin-icon">◆</span>${this.save.data.totalCoins}</div>
      <div class="shop-grid">${cosmetics.map((item) => {
        const unlocked = this.save.data.unlockedCosmetics.includes(item.id);
        const selected = item.id === this.save.data.selectedBoardId || item.id === this.save.data.selectedCharacterId;
        return `<article class="shop-item ${selected ? "selected" : ""}" style="--item-color:${item.color}">
          <div class="item-preview"><span>${item.type === "board" ? "▰" : "♟"}</span></div>
          <h3>${item.name}</h3><p>${item.type.toUpperCase()}</p>
          <button data-buy="${item.id}" ${!unlocked && this.save.data.totalCoins < item.price ? "disabled" : ""}>${selected ? "EQUIPPED" : unlocked ? "EQUIP" : `◆ ${item.price}`}</button>
        </article>`;
      }).join("")}</div>
      <button class="secondary" data-action="menu">BACK</button>`);
  }

  private renderSettings(): void {
    const s = this.save.data.settings;
    this.uiHost.innerHTML = this.panel("SETTINGS", "Tune the run to fit how you play.", `
      <div class="settings-list">
        ${this.slider("music", "Music", s.music)}
        ${this.slider("sfx", "Sound effects", s.sfx)}
        ${this.slider("sensitivity", "Swipe sensitivity", (s.sensitivity - 0.5) / 1.5)}
        ${this.toggle("reducedMotion", "Reduced motion", s.reducedMotion)}
        ${this.toggle("screenShake", "Screen shake", s.screenShake)}
        ${this.toggle("highContrast", "High-contrast obstacles", s.highContrast)}
        ${this.toggle("leftHanded", "Left-handed controls", s.leftHanded)}
        ${this.toggle("tapControls", "On-screen buttons", s.tapControls)}
      </div>
      <button class="secondary" data-action="${this.session && !this.session.ended ? "pause" : "menu"}">DONE</button>
      <button class="text-button danger" data-action="reset-save">RESET SAVE DATA</button>`);
  }

  private renderTutorial(): void {
    this.uiHost.innerHTML = this.overlay("READY, ROOK?", "Keep your line clean. One stumble brings the guard closer.", `
      <div class="tutorial-grid">
        <div><span>‹ ›</span><strong>SWITCH</strong><small>Swipe or arrows</small></div>
        <div><span>⌃</span><strong>JUMP</strong><small>Swipe up or Space</small></div>
        <div><span>⌄</span><strong>ROLL</strong><small>Swipe down or S</small></div>
        <div><span>×2</span><strong>BOARD</strong><small>Double tap or Shift</small></div>
      </div>
      <button class="primary" data-action="start-countdown">GOT IT</button>`);
  }

  private renderCountdown(): void {
    this.uiHost.innerHTML = `<section class="countdown-screen"><strong id="countdown">3</strong><span>GET READY</span></section>`;
    let count = 3;
    const timer = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        window.clearInterval(timer);
        this.startRun();
      } else this.text("#countdown", String(count));
    }, 650);
  }

  private panel(title: string, subtitle: string, content: string): string {
    return `<section class="panel-screen"><div class="panel">
      <header><button class="icon-button back" data-action="menu" aria-label="Back">‹</button><div><h2>${title}</h2><p>${subtitle}</p></div></header>
      ${content}</div></section>`;
  }

  private overlay(title: string, subtitle: string, content: string): string {
    return `<section class="overlay-screen"><div class="overlay-panel"><h2>${title}</h2><p>${subtitle}</p>${content}</div></section>`;
  }

  private slider(key: string, label: string, value: number): string {
    return `<label class="setting-row"><span>${label}</span><input type="range" min="0" max="1" step="0.05" value="${value}" data-setting="${key}"></label>`;
  }

  private toggle(key: string, label: string, checked: boolean): string {
    return `<label class="setting-row"><span>${label}</span><input type="checkbox" ${checked ? "checked" : ""} data-setting="${key}"><i></i></label>`;
  }

  private bindButtons(): void {
    this.uiHost.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
      element.addEventListener("click", () => this.perform(element.dataset.action ?? ""));
    });
    this.uiHost.querySelectorAll<HTMLElement>("[data-input]").forEach((element) => {
      element.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.handleAction(element.dataset.input as InputAction);
      });
    });
    this.uiHost.querySelectorAll<HTMLInputElement>("[data-setting]").forEach((input) => {
      input.addEventListener("input", () => this.updateSetting(input));
    });
    this.uiHost.querySelectorAll<HTMLElement>("[data-mission]").forEach((element) => {
      element.addEventListener("click", () => {
        this.currentMission = missions[Number(element.dataset.mission)];
        this.audio.cue("ui");
        this.renderMissions();
        this.bindButtons();
      });
    });
    this.uiHost.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach((button) => {
      button.addEventListener("click", () => this.buyOrEquip(button.dataset.buy ?? ""));
    });
  }

  private perform(action: string): void {
    this.audio.unlock();
    this.audio.cue("ui");
    if (action === "play") {
      this.setState(localStorage.getItem("metro-dash-tutorial-seen") ? "countdown" : "tutorial");
    } else if (action === "start-countdown") {
      localStorage.setItem("metro-dash-tutorial-seen", "1");
      this.setState("countdown");
    } else if (action === "missions" || action === "shop" || action === "settings" || action === "menu") {
      if (action === "menu") {
        this.session = undefined;
        this.resultCommitted = false;
        this.audio.startMusic("menu");
      }
      this.setState(action as AppState);
    } else if (action === "pause") {
      this.setState(this.state === "settings" ? "paused" : "paused");
    } else if (action === "resume") {
      this.previous = performance.now();
      this.setState("running");
    } else if (action === "restart") {
      this.setState("countdown");
    } else if (action === "board") {
      this.handleAction("board");
    } else if (action === "daily") {
      this.save.data.lastDailyKey = new Date().toISOString().slice(0, 10);
      this.save.save();
      this.currentMission = missions[4];
      this.showToast("DAILY ROUTE SET · FIND M E T R O");
      this.setState("missions");
    } else if (action === "install") {
      void this.install();
    } else if (action === "reset-save") {
      if (window.confirm("Reset all Metro Dash progress and settings?")) {
        this.save.reset();
        this.applySettings();
        this.setState("menu");
      }
    }
  }

  private startRun(): void {
    this.resultCommitted = false;
    this.session = new RunSession({
      cue: (name) => this.audio.cue(name),
      toast: (message) => this.showToast(message),
      gameOver: () => window.setTimeout(() => this.setState("gameover"), 360),
      shake: () => this.scene.triggerShake()
    }, this.currentMission);
    this.audio.startMusic("run");
    this.accumulator = 0;
    this.previous = performance.now();
    this.setState("running");
    window.embedAnalytics?.startRun("MetroDash", () => this.session?.score);
  }

  private handleAction(action: InputAction): void {
    if (action === "pause") {
      if (this.state === "running") this.setState("paused");
      else if (this.state === "paused") this.setState("running");
      return;
    }
    if (this.state === "running") this.session?.action(action);
  }

  private updateSetting(input: HTMLInputElement): void {
    const key = input.dataset.setting as keyof typeof this.save.data.settings;
    let value: number | boolean = input.type === "checkbox" ? input.checked : Number(input.value);
    if (key === "sensitivity") value = 0.5 + Number(input.value) * 1.5;
    (this.save.data.settings as unknown as Record<string, number | boolean>)[key] = value;
    this.save.save();
    this.applySettings();
  }

  private applySettings(): void {
    const s = this.save.data.settings;
    this.root.classList.toggle("reduced-motion", s.reducedMotion);
    this.root.classList.toggle("tap-controls-off", !s.tapControls);
    this.input?.setSensitivity(s.sensitivity);
    this.audio.setVolumes(s.music, s.sfx);
    this.scene?.setSettings(s.reducedMotion, s.highContrast, s.screenShake);
  }

  private buyOrEquip(id: string): void {
    const item = cosmetics.find((candidate) => candidate.id === id);
    if (!item) return;
    const unlocked = this.save.data.unlockedCosmetics.includes(id);
    if (!unlocked) {
      if (this.save.data.totalCoins < item.price) return;
      this.save.data.totalCoins -= item.price;
      this.save.data.unlockedCosmetics.push(id);
      this.showToast(`${item.name.toUpperCase()} UNLOCKED`);
    }
    if (item.type === "board") this.save.data.selectedBoardId = id;
    else if (item.type === "runner") this.save.data.selectedCharacterId = id;
    this.save.save();
    this.audio.cue("power");
    this.renderShop();
    this.bindButtons();
  }

  private showToast(message: string): void {
    const toast = this.requireElement("#toast");
    toast.textContent = message;
    toast.classList.add("visible");
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2200);
  }

  private text(selector: string, value: string): void {
    const element = this.uiHost.querySelector(selector);
    if (element && element.textContent !== value) element.textContent = value;
  }

  private format(value: number): string {
    return Math.floor(value).toLocaleString("en-US");
  }

  private bindInstall(): void {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredInstall = event as typeof this.deferredInstall;
    });
  }

  private async install(): Promise<void> {
    if (this.deferredInstall) {
      await this.deferredInstall.prompt();
      const choice = await this.deferredInstall.userChoice;
      this.showToast(choice.outcome === "accepted" ? "METRO DASH INSTALLED" : "INSTALL AVAILABLE ANYTIME");
      this.deferredInstall = undefined;
    } else {
      this.showToast("USE YOUR BROWSER MENU · ADD TO HOME SCREEN");
    }
  }
}

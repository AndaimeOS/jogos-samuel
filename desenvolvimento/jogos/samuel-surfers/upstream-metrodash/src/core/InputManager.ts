import type { InputAction } from "./EventBus";

export class InputManager {
  private start?: { x: number; y: number; time: number };
  private lastTap = 0;
  private sensitivity = 1;

  constructor(private target: HTMLElement, private dispatch: (action: InputAction) => void) {
    window.addEventListener("keydown", this.onKey, { passive: false });
    target.addEventListener("pointerdown", this.onPointerDown);
    target.addEventListener("pointerup", this.onPointerUp);
  }

  setSensitivity(value: number): void {
    this.sensitivity = value;
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKey);
    this.target.removeEventListener("pointerdown", this.onPointerDown);
    this.target.removeEventListener("pointerup", this.onPointerUp);
  }

  private onKey = (event: KeyboardEvent): void => {
    const map: Record<string, InputAction | undefined> = {
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      ArrowUp: "jump", w: "jump", W: "jump", " ": "jump",
      ArrowDown: "roll", s: "roll", S: "roll",
      Shift: "board", Escape: "pause"
    };
    const action = map[event.key];
    if (action) {
      event.preventDefault();
      this.dispatch(action);
    }
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.start = { x: event.clientX, y: event.clientY, time: performance.now() };
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.start) return;
    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;
    const threshold = 34 / this.sensitivity;
    const now = performance.now();
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      this.dispatch(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "roll" : "jump"));
    } else if (now - this.lastTap < 330) {
      this.dispatch("board");
      this.lastTap = 0;
    } else {
      this.lastTap = now;
    }
    this.start = undefined;
  };
}

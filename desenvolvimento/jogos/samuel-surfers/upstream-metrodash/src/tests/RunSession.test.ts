import { describe, expect, it, vi } from "vitest";
import { RunSession } from "../gameplay/RunSession";
import { missions } from "../data/gameData";

const hooks = () => ({
  cue: vi.fn(),
  toast: vi.fn(),
  gameOver: vi.fn(),
  shake: vi.fn()
});

describe("RunSession", () => {
  it("advances with a fixed simulation step and increases score", () => {
    const run = new RunSession(hooks(), missions[0]);
    for (let i = 0; i < 120; i++) run.update(1 / 120);
    expect(run.distance).toBeGreaterThan(15);
    expect(run.score).toBeGreaterThan(150);
  });

  it("keeps lane changes bounded to three lanes", () => {
    const run = new RunSession(hooks(), missions[0]);
    run.action("left");
    run.action("left");
    run.action("left");
    for (let i = 0; i < 30; i++) run.update(1 / 120);
    expect(run.snapshot().lane).toBe(-1);
    expect(run.snapshot().playerX).toBeGreaterThanOrEqual(-1);
  });

  it("consumes a hoverboard only when one is available", () => {
    const run = new RunSession(hooks(), missions[0]);
    run.action("board");
    run.action("board");
    expect(run.snapshot().boards).toBe(1);
    expect(run.snapshot().powerups.board).toBeGreaterThan(0);
  });

  it("clamps large difficulty growth to the speed cap", () => {
    const run = new RunSession(hooks(), missions[0]);
    for (let i = 0; i < 1000; i++) run.update(0.05);
    expect(run.speed).toBeLessThanOrEqual(34);
  });
});

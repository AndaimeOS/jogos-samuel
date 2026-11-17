import { describe, expect, it } from 'vitest';
import { dir8 } from '../../../../_privado/jogos/planeta-do-samuel/motor/math.js';
import { joystickFixo, RAIO_STICK } from '../../../../_privado/jogos/planeta-do-samuel/motor/joystick.js';
import { encaixarVista, vistaQueCabe } from '../../../../_privado/jogos/planeta-do-samuel/motor/viewport.js';
import { indiceQuadro } from '../../../../_privado/jogos/planeta-do-samuel/motor/sprites.js';

describe('motor reescrito', () => {
  it('dir8 segue a ordem da folha', () => {
    expect(dir8(0, 1)).toBe(0);
    expect(dir8(1, 1)).toBe(1);
    expect(dir8(1, 0)).toBe(2);
    expect(dir8(0, -1)).toBe(4);
    expect(dir8(-1, 0)).toBe(6);
  });

  it('o stick fixo fica parado na zona morta e chega a 1 antes da borda', () => {
    const centro = { x: 0, y: 0 };
    expect(joystickFixo(centro, centro).vec).toEqual({ x: 0, y: 0 });
    expect(joystickFixo(centro, { x: 4, y: 0 }).vec.x).toBe(0);
    const cheio = joystickFixo(centro, { x: RAIO_STICK, y: 0 });
    expect(cheio.vec.x).toBe(1);
    expect(cheio.knob.x).toBe(RAIO_STICK);
  });

  it('a vista do tablet cabe na tela e o lado é par', () => {
    const fit = encaixarVista(1024, 768, 1);
    expect(fit.w % 2).toBe(0);
    expect(fit.h % 2).toBe(0);
    const vista = vistaQueCabe(1024, 768, 1);
    expect(vista.w % 2).toBe(0);
    expect(vista.h % 2).toBe(0);
    expect(vista.w * vista.cssScale).toBeLessThanOrEqual(1024);
    expect(vista.h * vista.cssScale).toBeLessThanOrEqual(768);
  });

  it('o quadro anda em ticks de 1/60', () => {
    const dur = [4, 4, 4, 4];
    expect(indiceQuadro(dur, 0, true)).toBe(0);
    expect(indiceQuadro(dur, 4 / 60, true)).toBe(1);
    expect(indiceQuadro(dur, 16 / 60, true)).toBe(0);
  });
});

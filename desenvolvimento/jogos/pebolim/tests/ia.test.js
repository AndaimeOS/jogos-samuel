import './sat.js';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../../../_privado/jogos/pebolim/js/config.js';
import { decidirAlvo, passoIA } from '../../../../_privado/jogos/pebolim/js/ia.js';
import { avancar, comecar, criarPartida, mulberry32 } from '../../../../_privado/jogos/pebolim/js/partida.js';

describe('computador', () => {
  it('no Fácil é mais lento e erra mais vezes', () => {
    expect(CONFIG.ia.facil.vel).toBeLessThan(CONFIG.ia.normal.vel);
    expect(CONFIG.ia.facil.erroChance).toBeGreaterThan(CONFIG.ia.normal.erroChance);
    expect(CONFIG.ia.facil.pausa).toBeGreaterThan(CONFIG.ia.normal.pausa);

    const amostras = 300;
    function erros(nivel, semente) {
      const rng = mulberry32(semente);
      let n = 0;
      for (let i = 0; i < amostras; i++) {
        if (decidirAlvo(240, CONFIG.ia[nivel], rng).errou) n += 1;
      }
      return n;
    }
    expect(erros('facil', 11)).toBeGreaterThan(erros('normal', 11) * 3);

    function anda(dificuldade) {
      const cfg = structuredClone(CONFIG);
      cfg.ia[dificuldade].erroChance = 0;
      cfg.ia[dificuldade].chuteChance = 0;
      const p = criarPartida({ modo: '1', dificuldade, semente: 5, config: cfg });
      comecar(p);
      p.bola.y = 70;
      p.bola.vy = 0;
      p.bola.vx = 0;
      for (let t = 0; t < 1; t += 1 / 60) {
        p.bola.x = CONFIG.campo.comprimento / 2;
        p.bola.y = 70;
        p.bola.vx = 0;
        p.bola.vy = 0;
        passoIA(p, 1 / 60);
      }
      const centro = CONFIG.campo.largura / 2 + p.deslize.azul;
      return Math.abs(centro - 70);
    }
    expect(anda('facil')).toBeGreaterThan(anda('normal') + 40);
  });

  it('com dois jogadores o computador não mexe nas barras', () => {
    const p = criarPartida({ modo: '2', dificuldade: 'normal', semente: 1 });
    comecar(p);
    p.bola.y = 40;
    for (let t = 0; t < 1; t += 1 / 60) avancar(p, 1 / 60);
    expect(p.deslize.azul).toBe(0);
    expect(p.deslize.vermelho).toBe(0);
  });
});

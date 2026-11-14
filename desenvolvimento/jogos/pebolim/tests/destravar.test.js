import './sat.js';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../../../_privado/jogos/pebolim/js/config.js';
import { bolaPresaNumSolido, travesDe } from '../../../../_privado/jogos/pebolim/js/fisica.js';
import { avancar, comecar, criarPartida } from '../../../../_privado/jogos/pebolim/js/partida.js';

const PASSO = 1 / 60;

function partidaParada() {
  const p = criarPartida({ modo: '2', dificuldade: 'normal', semente: 1 });
  comecar(p);
  return p;
}

function simular(p, segundos, pararNoDestravar = false) {
  const eventos = [];
  const n = Math.round(segundos / PASSO);
  for (let i = 0; i < n; i++) {
    const novos = avancar(p, PASSO);
    eventos.push(...novos);
    if (pararNoDestravar && novos.some((e) => e.tipo === 'destravou')) break;
  }
  return eventos;
}

function colocar(p, x, y, vx = 0, vy = 0) {
  p.bola.x = x;
  p.bola.y = y;
  p.bola.vx = vx;
  p.bola.vy = vy;
  p.trava.x = x;
  p.trava.y = y;
  p.trava.janela = 0;
  p.trava.acumulado = 0;
}

describe('destravar a bola', () => {
  it('bola parada no canto volta para o meio, já com um saque leve', () => {
    const p = partidaParada();
    const raio = CONFIG.bola.raio;
    colocar(p, raio, raio);
    const eventos = simular(p, CONFIG.bola.segundosParada + 0.6, true);
    expect(eventos.some((e) => e.tipo === 'destravou')).toBe(true);
    expect(p.bola.x).toBe(CONFIG.campo.comprimento / 2);
    expect(p.bola.y).toBe(CONFIG.campo.largura / 2);
    expect(Math.hypot(p.bola.vx, p.bola.vy)).toBeCloseTo(p.ajustes.destravar, 6);
    expect(p.placar).toEqual({ vermelho: 0, azul: 0 });
  });

  it('bola encostada na trave, quase parada, volta para o meio e não fica presa', () => {
    const p = partidaParada();
    const trave = travesDe(CONFIG, p.ajustes.abertura)[0];
    const x = trave.x + trave.w + CONFIG.bola.raio + 2;
    const y = trave.y + trave.h / 2;
    colocar(p, x, y, 0, 0);
    expect(bolaPresaNumSolido(p)).toBe(false);
    const eventos = simular(p, CONFIG.bola.segundosParada + 0.6, true);
    expect(eventos.some((e) => e.tipo === 'destravou')).toBe(true);
    expect(p.bola.x).toBe(CONFIG.campo.comprimento / 2);
    expect(p.bola.y).toBe(CONFIG.campo.largura / 2);
    expect(bolaPresaNumSolido(p)).toBe(false);
  });

  it('bola largada dentro da trave é empurrada para fora no primeiro passo', () => {
    const p = partidaParada();
    const trave = travesDe(CONFIG, p.ajustes.abertura)[0];
    colocar(p, trave.x + trave.w / 2, trave.y + trave.h / 2);
    expect(bolaPresaNumSolido(p)).toBe(true);
    avancar(p, PASSO);
    expect(p.placar).toEqual({ vermelho: 0, azul: 0 });
    expect(bolaPresaNumSolido(p)).toBe(false);
    const dentro = p.bola.x > trave.x && p.bola.x < trave.x + trave.w
      && p.bola.y > trave.y && p.bola.y < trave.y + trave.h;
    expect(dentro).toBe(false);
  });

  it('bola em movimento não volta para o meio', () => {
    const p = partidaParada();
    colocar(p, CONFIG.campo.comprimento / 2, CONFIG.campo.largura / 2, 0, 420);
    const eventos = simular(p, 1.2);
    expect(eventos.some((e) => e.tipo === 'destravou')).toBe(false);
    expect(Math.hypot(p.bola.vx, p.bola.vy)).toBeGreaterThan(CONFIG.bola.velQuaseParada);
  });

  it('se a bola anda de novo, a contagem de parada recomeça', () => {
    const p = partidaParada();
    const raio = CONFIG.bola.raio;
    colocar(p, raio, CONFIG.campo.largura / 2);
    simular(p, CONFIG.bola.segundosParada * 0.7);
    expect(p.bola.x).toBe(raio);
    colocar(p, 400, 300, 360, 40);
    const eventos = simular(p, CONFIG.bola.segundosParada * 0.7);
    expect(eventos.some((e) => e.tipo === 'destravou')).toBe(false);
    expect(p.bola.x).not.toBe(CONFIG.campo.comprimento / 2);
  });
});

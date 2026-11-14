// Computador do modo 1 jogador. No Fácil ele anda menos e erra de propósito.

import { jogadoresDe, chutar, travarDeslize } from './fisica.js';

export function decidirAlvo(bolaY, ia, rng) {
  if (rng() < ia.erroChance) {
    const lado = rng() < 0.5 ? -1 : 1;
    return { y: bolaY + lado * ia.erroPixels, pausa: ia.pausa, errou: true };
  }
  return { y: bolaY, pausa: 0, errou: false };
}

export function passoIA(partida, dt) {
  const ia = partida.ajustes.ia;
  const bola = partida.bola;
  partida.ia.espera -= dt;
  partida.ia.pausa = Math.max(0, partida.ia.pausa - dt);
  partida.ia.recarga = Math.max(0, partida.ia.recarga - dt);
  if (partida.ia.espera <= 0) {
    partida.ia.espera = ia.intervaloDecisao;
    const decisao = decidirAlvo(bola.y, ia, partida.rng);
    partida.ia.alvo = decisao.y;
    if (decisao.pausa) partida.ia.pausa = decisao.pausa;
  }
  if (partida.ia.pausa <= 0) {
    const centro = partida.cfg.campo.largura / 2 + partida.deslize.azul;
    const diff = partida.ia.alvo - centro;
    const passo = Math.max(-ia.vel * dt, Math.min(ia.vel * dt, diff));
    const antes = partida.deslize.azul;
    partida.deslize.azul = travarDeslize(partida.cfg, antes + passo);
    partida.velBarra.azul = (partida.deslize.azul - antes) / dt;
  }
  if (partida.ia.recarga > 0) return;
  const alcance = ia.alcanceChute;
  const perto = jogadoresDe(partida.cfg, partida.deslize).some((j) => {
    if (j.time !== 'azul') return false;
    const dx = bola.x - j.x;
    return dx < partida.cfg.jogador.largura && Math.hypot(dx, bola.y - j.y) <= alcance;
  });
  if (perto && partida.rng() < ia.chuteChance) {
    chutar(partida, 'azul');
    partida.ia.recarga = ia.recarga;
  }
}

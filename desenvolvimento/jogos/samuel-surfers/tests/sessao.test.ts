import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { BLOCOS, ESTILO_V1, LISTA_GLB, PIXEL, UI } from '../src/contrato-arte';
import { TRECHOS } from '../src/pista';
import { gravarRecorde } from '../src/recorde';
import { semente, Sessao } from '../src/sessao';
import type { Ganchos } from '../src/tipos';

const ganchos = (): Ganchos => ({ som() {}, aviso() {}, fim() {}, particulas() {} });

function robo(s: Sessao): void {
  const foto = s.foto();
  const obstaculos = s.entidades.filter((e) => e.ativa && e.z > -1 && e.z < 20 && e.tipo !== 'moeda' && e.tipo !== 'ima' && e.tipo !== 'prancha');
  const naFrente = obstaculos.filter((e) => e.faixa === foto.faixa).sort((a, b) => a.z - b.z)[0];
  if (!naFrente) return;
  if (naFrente.tipo === 'barreira' || naFrente.tipo === 'cone') {
    if (naFrente.z < 6) s.acao('pular');
    return;
  }
  if (naFrente.tipo === 'placa') {
    if (naFrente.z < 6) s.acao('rolar');
    return;
  }
  const ocupadas = new Set(obstaculos.filter((e) => Math.abs(e.z - naFrente.z) < 8).map((e) => e.faixa));
  const livre = ([-1, 0, 1] as const).find((faixa) => faixa !== foto.faixa && !ocupadas.has(faixa));
  if (livre === undefined) return;
  s.acao(livre < foto.faixa ? 'esquerda' : 'direita');
}

describe('corrida', () => {
  it('deixa uma faixa livre em cada linha', () => {
    for (const trecho of TRECHOS) {
      for (const linha of trecho.linhas) {
        expect(Object.keys(linha.obstaculos ?? {}).length).toBeLessThan(3);
      }
    }
  });

  it('no fácil um tropeço não acaba a corrida e freia', () => {
    const s = new Sessao(ganchos(), { modo: 'facil', rng: () => 0 });
    const antes = s.foto().velocidade;
    for (let i = 0; i < 20 * 60 && s.foto().tropecos === 0; i++) s.atualizar(CONFIG.passo);
    expect(s.foto().tropecos).toBeGreaterThan(0);
    expect(s.acabou).toBe(false);
    expect(s.foto().velocidade).toBeLessThan(antes);
    for (let i = 0; i < 30 * 60; i++) s.atualizar(CONFIG.passo);
    expect(s.acabou).toBe(false);
  });

  it('no normal a batida acaba a corrida', () => {
    const s = new Sessao(ganchos(), { modo: 'normal', rng: () => 0 });
    for (let i = 0; i < 30 * 60 && !s.acabou; i++) s.atualizar(CONFIG.passo);
    expect(s.acabou).toBe(true);
    expect(s.continuar()).toBe(true);
    expect(s.continuar()).toBe(false);
  });

  it('pular passa a barreira e rolar passa a placa', () => {
    const barreira = new Sessao(ganchos(), {
      modo: 'normal', rng: () => 0, zInicial: 4,
      trechos: [{ id: 't', nivel: 1, linhas: [{ z: 0, obstaculos: { 0: 'barreira' } }] }],
    });
    while (barreira.entidades[0].z > 5.5) barreira.atualizar(CONFIG.passo);
    barreira.acao('pular');
    for (let i = 0; i < 50; i++) barreira.atualizar(CONFIG.passo);
    expect(barreira.acabou).toBe(false);

    const placa = new Sessao(ganchos(), {
      modo: 'normal', rng: () => 0, zInicial: 4,
      trechos: [{ id: 't', nivel: 1, linhas: [{ z: 0, obstaculos: { 0: 'placa' } }] }],
    });
    while (placa.entidades[0].z > 5.5) placa.atualizar(CONFIG.passo);
    placa.acao('rolar');
    for (let i = 0; i < 90; i++) placa.atualizar(CONFIG.passo);
    expect(placa.acabou).toBe(false);
  });

  it('muda de faixa e a velocidade cresce até o teto', () => {
    const s = new Sessao(ganchos(), { modo: 'facil', rng: () => 0, trechos: [{ id: 'vazio', nivel: 1, linhas: [{ z: 8, moedas: [0] }] }] });
    s.acao('esquerda');
    s.acao('esquerda');
    s.acao('esquerda');
    expect(s.foto().faixa).toBe(-1);
    const v0 = s.foto().velocidade;
    for (let i = 0; i < 10 * 60; i++) s.atualizar(CONFIG.passo);
    expect(s.foto().velocidade).toBeGreaterThan(v0);
    for (let i = 0; i < 4000; i++) s.atualizar(0.2);
    expect(s.foto().velocidade).toBeLessThanOrEqual(CONFIG.velocidadeMaxima + 0.001);
  });

  it('um robô atravessa 60 s no normal', () => {
    for (const seed of [1, 2, 7, 99]) {
      const s = new Sessao(ganchos(), { modo: 'normal', rng: semente(seed) });
      for (let i = 0; i < 60 * 60 && !s.acabou; i++) {
        robo(s);
        s.atualizar(CONFIG.passo);
      }
      expect(s.acabou, 'semente ' + seed).toBe(false);
      expect(s.foto().distancia).toBeGreaterThan(400);
    }
  });

  it('guarda o recorde e a moeda toca partícula', () => {
    const partes: number[] = [];
    const s = new Sessao({
      som() {}, aviso() {}, fim() {}, particulas() { partes.push(1); },
    }, {
      modo: 'facil', rng: () => 0, zInicial: 2,
      trechos: [{ id: 't', nivel: 1, linhas: [{ z: 0, moedas: [0] }] }],
    });
    for (let i = 0; i < 60 && s.foto().moedas === 0; i++) s.atualizar(CONFIG.passo);
    expect(s.foto().moedas).toBeGreaterThan(0);
    expect(partes.length).toBeGreaterThan(0);
    const mem = new Map<string, string>();
    const arm = { ler: (k: string) => mem.get(k) ?? null, gravar: (k: string, v: string) => { mem.set(k, v); } };
    const rec = gravarRecorde(arm, s.foto());
    expect(gravarRecorde(arm, { moedas: 1, pontos: 1, distancia: 1 }).moedas).toBe(rec.moedas);
  });
});

describe('contrato da arte', () => {
  it('a v1 é o 3D em código, sem GLB, com botões de 76', () => {
    expect(ESTILO_V1).toBe('blocos');
    expect(LISTA_GLB).toEqual([]);
    expect(BLOCOS.compressao).toBe('nenhuma');
    expect(BLOCOS.formato).toBe('glb');
    expect(CONFIG.faixa).toBe(3.1);
    expect(CONFIG.samuelAltura).toBe(2.3);
    expect(CONFIG.cameraZ).toBeLessThan(-14);
    expect(CONFIG.pistaRecuo).toBeLessThanOrEqual(-12);
    const perto = CONFIG.pistaRecuo - 5;
    for (const [aspecto, fov] of [[1024 / 768, 57], [768 / 1024, 68]] as const) {
      const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.1, 180);
      cam.position.set(0, CONFIG.cameraY, CONFIG.cameraZ);
      cam.lookAt(0, CONFIG.olharY, CONFIG.olharZ);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld(true);
      const canto = new THREE.Vector3(aspecto < 1 ? 1 : 1, -1, 0.5).unproject(cam);
      const dir = canto.sub(cam.position).normalize();
      const t = (0 - cam.position.y) / dir.y;
      const chao = cam.position.clone().add(dir.multiplyScalar(t));
      expect(perto).toBeLessThan(chao.z);
    }
    const aFrente = CONFIG.velocidadeInicial * 1.5;
    for (const [aspecto, fov] of [[1024 / 768, 57], [768 / 1024, 68]] as const) {
      const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.1, 180);
      cam.position.set(0, CONFIG.cameraY, CONFIG.cameraZ);
      cam.lookAt(0, CONFIG.olharY, CONFIG.olharZ);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld(true);
      const frente = new THREE.Vector3(0, 1, aFrente).project(cam);
      const samuel = new THREE.Vector3(0, 1.2, 0).project(cam);
      expect(Math.abs(frente.x)).toBeLessThan(1);
      expect(Math.abs(frente.y)).toBeLessThan(0.85);
      expect(frente.z).toBeGreaterThan(-1);
      expect(frente.z).toBeLessThan(1);
      expect(samuel.y).toBeLessThan(frente.y);
    }
    expect(CONFIG.dogOffsetX).toBe(-1.9);
    expect(UI.botaoAcao).toBe(76);
    expect(UI.botaoMiudo).toBe(76);
    expect(PIXEL.samuel.quadros).toContain('correr_0');
    expect(PIXEL.samuel.quadros).toContain('rolar_0');
    expect(BLOCOS.clipes).toEqual(['idle', 'correr', 'pular', 'rolar', 'tropecar']);
  });
});

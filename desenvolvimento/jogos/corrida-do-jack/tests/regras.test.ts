// Regras da Corrida do Jack: pista sempre passável, ações e colisões coerentes, determinismo por semente.
import { describe, expect, it } from 'vitest';
import { AJUSTES, Corrida, FAIXAS, FORMA, type Tipo } from '../src/core/regras';

const DT = 1 / 60;
function correr(c: Corrida, seg: number) { const ev: string[] = []; for (let t = 0; t < seg; t += DT) ev.push(...c.passo(DT)); return ev; }
/** Põe um único obstáculo na frente do jogador, na faixa dele, e limpa o resto. */
function soUm(c: Corrida, tipo: Tipo, distancia = 6) {
  c.obstaculos = [{ id: 999, faixa: c.jogador.faixa, z: c.z + distancia, tipo }];
  c.moedasMundo = [];
  (c as unknown as { proximaFileira: number }).proximaFileira = c.z + 1e6;   // sem novas fileiras no teste
}

describe('Corrida — pista gerada', () => {
  it('mesma semente gera a mesma pista; outra semente muda', () => {
    const a = new Corrida('desafio', 7), b = new Corrida('desafio', 7), c = new Corrida('desafio', 8);
    const resumo = (k: Corrida) => k.obstaculos.map((o) => `${o.faixa}${o.tipo}${o.z.toFixed(1)}`).join('|');
    expect(resumo(a)).toBe(resumo(b));
    expect(resumo(a)).not.toBe(resumo(c));
  });

  it('nenhuma fileira tem três carrinhos lado a lado (sempre dá para passar)', () => {
    for (let semente = 1; semente <= 200; semente++) {
      const c = new Corrida('desafio', semente);
      const porZ = new Map<number, Tipo[]>();
      for (const o of c.obstaculos) porZ.set(o.z, [...(porZ.get(o.z) ?? []), o.tipo]);
      for (const tipos of porZ.values()) expect(tipos.filter((t) => t === 'bloco').length).toBeLessThan(3);
    }
  });

  it('dois carrinhos nunca em faixas vizinhas: de qualquer faixa basta uma troca', () => {
    for (let semente = 1; semente <= 300; semente++) {
      const c = new Corrida('desafio', semente);
      const porZ = new Map<number, (Tipo | null)[]>();
      for (const o of c.obstaculos) { const f = porZ.get(o.z) ?? [null, null, null]; f[o.faixa] = o.tipo; porZ.set(o.z, f); }
      for (const f of porZ.values()) expect(f[1] === 'bloco' && (f[0] === 'bloco' || f[2] === 'bloco')).toBe(false);
    }
  });

  it('começo livre e espaço mínimo entre fileiras', () => {
    const c = new Corrida('ajuda', 3);
    const zs = [...new Set(c.obstaculos.map((o) => o.z))].sort((a, b) => a - b);
    expect(zs[0]).toBeGreaterThanOrEqual(40);
    for (let i = 1; i < zs.length; i++) expect(zs[i] - zs[i - 1]).toBeGreaterThanOrEqual(14);
  });
});

describe('Corrida — ações', () => {
  it('não corre antes de começar e não sai das 3 faixas', () => {
    const c = new Corrida();
    expect(c.passo(DT)).toEqual([]);
    expect(c.esquerda()).toEqual([]);
    c.comecar();
    c.esquerda(); c.esquerda(); c.esquerda();
    expect(c.jogador.faixa).toBe(0);
    correr(c, 0.3);
    expect(c.jogador.x).toBeCloseTo(FAIXAS[0], 5);
    c.direita(); c.direita(); c.direita();
    expect(c.jogador.faixa).toBe(2);
  });

  it('pulo sobe e volta ao chão; não pula no ar', () => {
    const c = new Corrida(); c.comecar(); soUm(c, 'baixo', 999);
    expect(c.pular()).toEqual(['pulo']);
    expect(c.pular()).toEqual([]);
    let pico = 0;
    for (let t = 0; t < 1; t += DT) { c.passo(DT); pico = Math.max(pico, c.jogador.y); }
    expect(pico).toBeGreaterThan(1.8);
    expect(c.jogador.noChao).toBe(true);
  });

  it('abaixar no ar desce mais rápido', () => {
    const a = new Corrida(), b = new Corrida();
    for (const c of [a, b]) { c.comecar(); soUm(c, 'baixo', 999); c.pular(); correr(c, 0.15); }
    b.abaixar();
    let ta = 0, tb = 0;
    while (!a.jogador.noChao) { a.passo(DT); ta += DT; }
    while (!b.jogador.noChao) { b.passo(DT); tb += DT; }
    expect(tb).toBeLessThan(ta);
  });
});

describe('Corrida — colisões', () => {
  const casos: [Tipo, 'nada' | 'pular' | 'abaixar' | 'trocar', boolean][] = [
    ['baixo', 'nada', true], ['baixo', 'pular', false], ['baixo', 'abaixar', true],
    ['alto', 'nada', true], ['alto', 'abaixar', false], ['alto', 'pular', true],
    ['bloco', 'nada', true], ['bloco', 'pular', true], ['bloco', 'trocar', false],
  ];
  for (const [tipo, acao, bate] of casos) {
    it(`${tipo} + ${acao} → ${bate ? 'bate' : 'passa'}`, () => {
      const c = new Corrida('desafio'); c.comecar(); soUm(c, tipo, 7);
      // age quando falta ~0,35 s para chegar (tempo de reação de criança)
      while (c.z < 7 - c.vel * 0.35 - 0.1) c.passo(DT);
      if (acao === 'pular') c.pular(); else if (acao === 'abaixar') c.abaixar(); else if (acao === 'trocar') c.esquerda();
      while (c.estado === 'correndo' && c.z < 7 + FORMA[tipo].comprimento + 1) c.passo(DT);
      expect(c.estado === 'caiu').toBe(bate);
    });
  }

  it('modo com ajuda tem um escudo: a primeira batida não para a corrida', () => {
    const c = new Corrida('ajuda'); c.comecar(); soUm(c, 'bloco', 6);
    const ev = correr(c, 1.5);
    expect(ev).toContain('escudo');
    expect(c.estado).toBe('correndo');
    expect(c.escudos).toBe(0);
    correr(c, 1);                     // passam os 2 s de invencibilidade depois do escudo
    soUm(c, 'bloco', 6);
    correr(c, 1.5);
    expect(c.estado).toBe('caiu');
  });

  it('moedas: pega passando por elas, conta uma vez só', () => {
    const c = new Corrida('desafio'); c.comecar(); soUm(c, 'baixo', 999);
    c.moedasMundo = [0, 1, 2].map((i) => ({ id: i, faixa: 1, z: 3 + i * 2, y: 0.8, pega: false }));
    const ev = correr(c, 1);
    expect(c.moedas).toBe(3);
    expect(ev.filter((e) => e === 'moeda').length).toBe(3);
    expect(c.pontos).toBe(c.distancia + 15);
  });

  it('velocidade sobe até o máximo do modo e marca a cada 100 m', () => {
    const c = new Corrida('desafio'); c.comecar(); soUm(c, 'baixo', 1e6);
    const ev = correr(c, 60);
    expect(c.vel).toBeCloseTo(AJUSTES.desafio.velMax, 5);
    expect(ev.filter((e) => e === 'marco').length).toBe(Math.floor(c.z / 100));
  });
});

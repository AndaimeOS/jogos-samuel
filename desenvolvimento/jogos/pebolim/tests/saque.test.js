import './sat.js';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../../../_privado/jogos/pebolim/js/config.js';
import { jogadoresDe } from '../../../../_privado/jogos/pebolim/js/fisica.js';
import {
  aplicarGol, avancar, comecar, criarPartida, mulberry32, soltarBola,
} from '../../../../_privado/jogos/pebolim/js/partida.js';

const PASSO = 1 / 60;
const MEIO = { x: CONFIG.campo.comprimento / 2, y: CONFIG.campo.largura / 2 };
const MODOS = [
  { modo: '1', dificuldade: 'facil' },
  { modo: '1', dificuldade: 'normal' },
  { modo: '2', dificuldade: 'facil' },
  { modo: '2', dificuldade: 'normal' },
];
const nome = (m) => `${m.modo} jogador(es), ${m.dificuldade}`;

function nova(m, extra = {}) {
  const p = criarPartida({ ...m, semente: 3, ...extra });
  comecar(p);
  return p;
}

const distMeio = (p) => Math.hypot(p.bola.x - MEIO.x, p.bola.y - MEIO.y);
const vel = (p) => Math.hypot(p.bola.vx, p.bola.vy);

// Mesma regra de alcance do chutar(): bola perto e na frente do boneco.
function alguemAlcanca(p) {
  const cfg = p.cfg;
  const alcance = cfg.bola.raio + cfg.jogador.altura / 2 + cfg.jogador.alcanceChute;
  return jogadoresDe(cfg, p.deslize).some((j) => {
    const dir = j.time === 'vermelho' ? 1 : -1;
    const dx = p.bola.x - j.x;
    const dy = p.bola.y - j.y;
    return dx * dir > -cfg.jogador.largura && Math.hypot(dx, dy) <= alcance;
  });
}

describe('saque', () => {
  for (const m of MODOS) {
    it(`no começo a bola sai do meio sozinha (${nome(m)})`, () => {
      const p = nova(m);
      expect(vel(p)).toBeGreaterThan(CONFIG.bola.velQuaseParada);
      for (let i = 0; i < 30; i++) avancar(p, PASSO);
      expect(distMeio(p)).toBeGreaterThan(20);
    });

    it(`o saque chega até um boneco (${nome(m)})`, () => {
      for (const lado of [0.1, 0.9]) {
        const p = nova(m, { sorteio: () => lado });
        let chegou = false;
        for (let i = 0; i < 120 && !chegou; i++) {
          avancar(p, PASSO);
          chegou = alguemAlcanca(p);
        }
        expect(chegou).toBe(true);
      }
    });
  }

  it('o lado do saque é sorteado, e o sorteio pode ser fixado', () => {
    const esquerda = nova(MODOS[3], { sorteio: () => 0.1 });
    const direita = nova(MODOS[3], { sorteio: () => 0.9 });
    expect(esquerda.bola.vx).toBeLessThan(0);
    expect(direita.bola.vx).toBeGreaterThan(0);
    const lados = new Set();
    for (let s = 1; s <= 20; s++) lados.add(Math.sign(nova(MODOS[3], { semente: s }).bola.vx));
    expect(lados).toEqual(new Set([-1, 1]));
    // Mesma semente, mesmo saque.
    expect(nova(MODOS[3], { semente: 9 }).bola).toEqual(nova(MODOS[3], { semente: 9 }).bola);
  });

  it('o Fácil saca mais devagar que o Normal, e a bola não passa do limite', () => {
    const facil = nova(MODOS[0]);
    const normal = nova(MODOS[1]);
    expect(vel(facil)).toBeLessThan(vel(normal));
    expect(vel(facil)).toBeLessThanOrEqual(facil.ajustes.velMax);
    expect(vel(normal)).toBeLessThanOrEqual(normal.ajustes.velMax);
  });

  it('depois do gol a bola sai para o lado de quem sofreu', () => {
    // Vermelho defende a esquerda e o Azul a direita.
    const a = nova(MODOS[3]);
    aplicarGol(a, 'vermelho');
    expect(a.seta).toBe(1);
    soltarBola(a);
    expect(a.bola.vx).toBeGreaterThan(0);
    const b = nova(MODOS[3]);
    aplicarGol(b, 'azul');
    expect(b.seta).toBe(-1);
    soltarBola(b);
    expect(b.bola.vx).toBeLessThan(0);
  });

  it('bola presa volta para o meio já andando, com um saque leve', () => {
    for (const m of MODOS) {
      const p = nova(m);
      p.bola.x = CONFIG.bola.raio;
      p.bola.y = CONFIG.bola.raio;
      p.bola.vx = 0;
      p.bola.vy = 0;
      p.trava.x = p.bola.x;
      p.trava.y = p.bola.y;
      let destravou = false;
      for (let i = 0; i < Math.round((CONFIG.bola.segundosParada + 0.6) / PASSO) && !destravou; i++) {
        destravou = avancar(p, PASSO).some((e) => e.tipo === 'destravou');
      }
      expect(destravou).toBe(true);
      expect(distMeio(p)).toBeLessThan(1);
      expect(vel(p)).toBeGreaterThan(CONFIG.bola.velQuaseParada);
      expect(vel(p)).toBeLessThan(vel(nova(m)) + 1e-9);
    }
  });

  // Critério de "não fica travado": em 120 s sem ninguém mexer (5 sementes por modo), a bola
  // nunca fica parada (vel < velQuaseParada) mais que o tempo do destravar + uma janela + 0,5 s.
  // No Normal com o computador (1 jogador), cada partida também precisa ter pelo menos um gol.
  // Sem ninguém mexendo no Vermelho, o computador do Fácil (lento, chuta pouco, de propósito) e
  // o modo de 2 jogadores (ninguém chuta) podem acabar 0 × 0; aí só vale a regra da bola parada.
  for (const m of MODOS) {
    it(`partida sem ninguém mexer não fica parada (${nome(m)})`, () => {
      const limite = CONFIG.bola.segundosParada + CONFIG.bola.janelaParada + 0.5;
      for (const semente of [1, 2, 3, 4, 5]) {
        const p = criarPartida({ ...m, semente, sorteio: mulberry32(semente * 7919) });
        comecar(p);
        let parada = 0;
        let maiorParada = 0;
        let passos = 0;
        let gols = 0;
        while (p.fase !== 'fim' && passos < 120 / PASSO) {
          if (p.fase === 'gol') soltarBola(p);
          gols += avancar(p, PASSO).filter((e) => e.tipo === 'gol').length;
          passos += 1;
          if (vel(p) < CONFIG.bola.velQuaseParada) parada += PASSO;
          else parada = 0;
          maiorParada = Math.max(maiorParada, parada);
        }
        expect(maiorParada).toBeLessThan(limite);
        if (m.modo === '1' && m.dificuldade === 'normal') expect(gols).toBeGreaterThan(0);
      }
    });
  }
});

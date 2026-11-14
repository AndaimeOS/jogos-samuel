import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  BALANCO, FASES, TEXTO_FACIL, TEXTO_NORMAL, TILES_CONHECIDOS, TILES_PERIGO,
  ajustarParaModo, aplicarQueda, bonusAberto, contarTiles, deveTocarLatido,
  gravarFase, parametros, planejarPista, totalCristais,
} from '../../../../_privado/jogos/reino-dos-blocos/regras.js';

/* Valores do modo Normal na versão 1.0, travados depois do playtest de 14/11/2026. */
const NORMAL_HOJE = {
  MAX: 118, ACEL: 950, ACEL_AR: 700, ATRITO: 1250,
  GRAV_SOBE: 1050, GRAV_CAI: 1850, PULO: 392, PULO2: 340,
  QUEDA_MAX: 420, COIOTE: 0.1, BUFFER: 0.13, CORTE: 0.45,
  FLUTUA_FAIXA: 45, FLUTUA_FATOR: 0.5,
  geleiaVel: 28,
  abelhaRitmo: 1.1, abelhaRitmoY: 2.6, abelhaAmpX: 30, abelhaAmpY: 10,
  vidas: 3, coracaoMax: 4, estrelasPorCoracao: 50,
  pistaBlocos: 6, buscaBlocos: 3, apontaSegundos: 2.6, moedaEspera: 8, caoVel: 70,
  buscaQueda: false,
  inimigoManterACada: 1, plataformaExtra: 0, bandeiraIntervalo: 0,
};

const MAPA_HISTORIA_SHA256 = '6ebd4ae8d4ffb996115fb985bfe399b546d6c632f2b35b2c14350cca14ad2dd3';

function historia() {
  return FASES.slice(0, 3).map((f) => f.mapa.join('\n')).join('\n--\n');
}

describe('modo Normal permanece o de hoje', () => {
  it('trava os números do Normal', () => {
    expect(BALANCO.normal).toEqual(NORMAL_HOJE);
    expect(parametros('normal')).toBe(BALANCO.normal);
    expect(parametros('outro')).toBe(BALANCO.normal);
    expect(TEXTO_NORMAL).toBe('3 corações');
  });

  it('não altera o desenho das 3 fases', () => {
    expect(FASES.slice(0, 3).map((f) => f.mapa[0].length)).toEqual([206, 214, 232]);
    expect(FASES.slice(0, 3).map((f) => contarTiles(f.mapa, 'g'))).toEqual([7, 10, 10]);
    expect(FASES.slice(0, 3).map((f) => contarTiles(f.mapa, 'z'))).toEqual([2, 3, 4]);
    expect(FASES.slice(0, 3).map((f) => contarTiles(f.mapa, 'K'))).toEqual([3, 3, 3]);
    expect(FASES.slice(0, 3).map((f) => contarTiles(f.mapa, '*'))).toEqual([59, 36, 49]);
    expect(createHash('sha256').update(historia()).digest('hex')).toBe(MAPA_HISTORIA_SHA256);
    for (const f of FASES.slice(0, 3)) {
      expect(ajustarParaModo(f.mapa, BALANCO.normal)).toEqual(f.mapa);
    }
  });
});

describe('modo Fácil (valores provisórios)', () => {
  it('facilita inimigo, pulo, pista, queda, plataforma e bandeira', () => {
    const f = BALANCO.facil;
    expect(f.geleiaVel).toBe(18);
    expect(f.abelhaRitmo).toBe(0.75);
    expect(f.abelhaRitmoY).toBeLessThan(BALANCO.normal.abelhaRitmoY);
    expect(f.COIOTE).toBe(0.16);
    expect(f.BUFFER).toBe(0.20);
    expect(f.GRAV_SOBE).toBeLessThan(BALANCO.normal.GRAV_SOBE);
    expect(f.GRAV_CAI).toBeLessThan(BALANCO.normal.GRAV_CAI);
    expect(f.FLUTUA_FAIXA).toBeGreaterThan(BALANCO.normal.FLUTUA_FAIXA);
    expect(f.FLUTUA_FATOR).toBeLessThan(BALANCO.normal.FLUTUA_FATOR);
    expect(f.PULO).toBe(BALANCO.normal.PULO);
    expect(f.vidas).toBe(5);
    expect(f.coracaoMax).toBe(6);
    expect(f.pistaBlocos).toBeGreaterThan(BALANCO.normal.pistaBlocos);
    expect(f.buscaBlocos).toBeGreaterThan(BALANCO.normal.buscaBlocos);
    expect(f.moedaEspera).toBeLessThan(BALANCO.normal.moedaEspera);
    expect(f.buscaQueda).toBe(true);
    expect(f.inimigoManterACada).toBe(2);
    expect(f.plataformaExtra).toBe(1);
    expect(f.bandeiraIntervalo).toBe(40);
    expect(TEXTO_FACIL).toMatch(/mais lentos/i);
    expect(TEXTO_FACIL).toMatch(/menor número/);
    expect(TEXTO_FACIL).toMatch(/tempo no ar/);
    expect(TEXTO_FACIL).toMatch(/coiote/i);
    expect(TEXTO_FACIL).toMatch(/plataformas mais largas/);
    expect(TEXTO_FACIL).toMatch(/Bandeiras mais perto/);
    expect(TEXTO_FACIL).toMatch(/mais pistas/);
    expect(TEXTO_FACIL).toMatch(/queda/);
    expect(TEXTO_FACIL).toMatch(/sem tirar coração/);
  });

  it('deixa o mapa da fase 1 mais largo, com menos inimigos e mais bandeiras', () => {
    const bruto = FASES[0].mapa;
    const facil = ajustarParaModo(bruto, BALANCO.facil);
    expect(contarTiles(facil, 'g')).toBeLessThan(contarTiles(bruto, 'g'));
    expect(contarTiles(facil, 'z')).toBeLessThan(contarTiles(bruto, 'z'));
    expect(contarTiles(facil, '=')).toBeGreaterThan(contarTiles(bruto, '='));
    expect(contarTiles(facil, 'F')).toBeGreaterThan(contarTiles(bruto, 'F'));
    expect(contarTiles(facil, 'K')).toBe(contarTiles(bruto, 'K'));
  });

  it('na queda do Fácil não tira coração; no Normal tira', () => {
    expect(aplicarQueda({ modo: 'normal', vidas: 3, cfg: BALANCO.normal })).toEqual({ vidas: 2, tiraCoracao: true, resgate: false });
    expect(aplicarQueda({ modo: 'facil', vidas: 5, cfg: BALANCO.facil })).toEqual({ vidas: 5, tiraCoracao: false, resgate: true });
  });
});

describe('Doguinho', () => {
  const cfg = BALANCO.normal;
  const base = { avisados: new Set(), moedasAvisadas: new Set(), moedaEspera: 0, cfg, bloco: 16 };

  it('late uma vez para o cristal perto e não repete', () => {
    const cristal = { tipo: 'cristal', idx: 1, x: 5 * 16, y: 0, pego: false };
    const plano = planejarPista({ ...base, x: 0, itens: [cristal] });
    expect(plano.latir).toBe(true);
    expect(plano.alvo.id).toBe('c1');
    expect(plano.coleta).toBe(false);
    expect(plano.moveHeroi).toBe(false);
    expect(plano.derrotaInimigo).toBe(false);
    expect(plano.completaFase).toBe(false);
    const deNovo = planejarPista({ ...base, x: 0, itens: [cristal], avisados: new Set(['c1']) });
    expect(deNovo).toBeNull();
  });

  it('não late para cristal já pego, longe demais, nem em loop de moeda', () => {
    const longe = { tipo: 'cristal', idx: 0, x: 6 * 16 + 1, y: 0, pego: false };
    expect(planejarPista({ ...base, x: 0, itens: [longe] })).toBeNull();
    const naBorda = { tipo: 'cristal', idx: 2, x: 6 * 16, y: 80, pego: false };
    expect(planejarPista({ ...base, x: 0, itens: [naBorda] }).latir).toBe(true);
    const pego = { tipo: 'cristal', idx: 2, x: 16, y: 0, pego: true };
    expect(planejarPista({ ...base, x: 0, itens: [pego] })).toBeNull();
    const moeda = { tipo: 'estrela', x: 2 * 16, y: 0, pego: false };
    const id = 'e32:0';
    expect(planejarPista({ ...base, x: 0, itens: [moeda] }).latir).toBe(false);
    expect(planejarPista({ ...base, x: 0, itens: [moeda], moedasAvisadas: new Set([id]) })).toBeNull();
    expect(planejarPista({ ...base, x: 0, itens: [moeda], moedaEspera: 4 })).toBeNull();
  });

  it('prefere o cristal e, no Fácil, aponta mais longe', () => {
    const cristal = { tipo: 'cristal', idx: 0, x: 4 * 16, y: 0, pego: false };
    const moeda = { tipo: 'estrela', x: 16, y: 0, pego: false };
    const perto = planejarPista({ ...base, x: 0, itens: [moeda, cristal] });
    expect(perto.alvo.tipo).toBe('cristal');
    expect(perto.latir).toBe(true);
    const longe = { tipo: 'cristal', idx: 4, x: 8 * 16, y: 0, pego: false };
    expect(planejarPista({ ...base, x: 0, itens: [longe] })).toBeNull();
    const noFacil = planejarPista({ ...base, x: 0, itens: [longe], cfg: BALANCO.facil });
    expect(noFacil.alvo.tipo).toBe('cristal');
    expect(noFacil.latir).toBe(true);
  });

  it('ignora portal e inimigo: não completa a fase nem derrota ninguém', () => {
    const itens = [
      { tipo: 'portal', x: 10, y: 10, pego: false },
      { tipo: 'geleia', x: 12, y: 10, pego: false },
    ];
    expect(planejarPista({ ...base, x: 0, itens })).toBeNull();
  });

  it('o latido respeita o botão de som', () => {
    expect(deveTocarLatido(true, true)).toBe(true);
    expect(deveTocarLatido(true, false)).toBe(false);
    expect(deveTocarLatido(false, true)).toBe(false);
  });
});

describe('9 cristais e fase bônus', () => {
  it('soma só as 3 fases e aceita o save antigo', () => {
    const antigo = {
      0: { completou: true, cristais: [true, true, false], tempo: 40, estrelas: 10 },
      1: { completou: true, cristais: [true, false, false], tempo: 50, estrelas: 8 },
      2: { completou: true, cristais: [true, true, false], tempo: 60, estrelas: 12 },
    };
    expect(totalCristais(antigo)).toBe(5);
    expect(bonusAberto(antigo)).toBe(false);
    const cheio = {
      0: { cristais: [true, true, true] },
      1: { cristais: [true, true, true] },
      2: { cristais: [true, true, true] },
      3: { cristais: [true, true, true] },
    };
    expect(totalCristais(cheio)).toBe(9);
    expect(bonusAberto(cheio)).toBe(true);
  });

  it('ao salvar de novo, cristal antigo continua valendo', () => {
    const salvo = gravarFase(
      { completou: true, cristais: [true, false, true], tempo: 30, estrelas: 20 },
      { cristais: [false, false, true], tempo: 40, estrelas: 5 },
    );
    expect(salvo.cristais).toEqual([true, false, true]);
    expect(salvo.tempo).toBe(30);
    expect(salvo.estrelas).toBe(20);
    expect(salvo.completou).toBe(true);
  });

  it('a fase bônus é curta, sem perigo e com o Gatinho no portal', () => {
    const bonus = FASES[3];
    expect(bonus.bonus).toBe(true);
    expect(bonus.nome).toBe('Festa do Gatinho');
    expect(bonus.mapa[0].length).toBe(BALANCO.bonusLargura);
    expect(bonus.mapa).toHaveLength(15);
    const texto = bonus.mapa.join('');
    for (const ch of TILES_PERIGO) expect(texto.includes(ch)).toBe(false);
    expect(texto.includes('-')).toBe(false);
    expect(texto.includes('|')).toBe(false);
    for (const ch of texto) expect(TILES_CONHECIDOS.has(ch)).toBe(true);
    expect(contarTiles(bonus.mapa, 'G')).toBe(1);
    expect(contarTiles(bonus.mapa, '@')).toBe(1);
    expect(contarTiles(bonus.mapa, '*')).toBeGreaterThan(10);
    for (let x = 0; x < bonus.mapa[0].length; x++) {
      expect(bonus.mapa.some((linha) => linha[x] === '#')).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  CONFIG, ERAS, PROPOSTA, TEXTOS,
  escolherCarta, faixaXp, ganharXp, receberDano, restaurar, serializar, tick, criarPartida, xpPara,
} from '../../../../_privado/jogos/planeta-do-samuel/regras.js';

function partida() {
  return criarPartida();
}

function avancar(estado, segundos) {
  const n = Math.max(1, Math.round(segundos / 0.05));
  for (let i = 0; i < n; i++) tick(estado, segundos / n, { x: 0, y: 0 });
}

describe('proposta', () => {
  it('marca os números como provisórios e o Fácil sem morte', () => {
    expect(PROPOSTA).toBe(true);
    expect(CONFIG.proposta).toBe(true);
    expect(CONFIG.rotulo).toBe('PROPOSTA');
    expect(CONFIG.modo).toBe('facil');
    expect(CONFIG.semMorte).toBe(true);
    expect(CONFIG.invulneravelSegundos).toBeGreaterThan(0);
    expect(CONFIG.eras.pedra.taxa).toBeGreaterThan(0);
    expect(CONFIG.eras.pedra.max).toBeLessThan(CONFIG.eras.bronze.max);
    expect(CONFIG.eras.ferro.max).toBeGreaterThan(CONFIG.eras.bronze.max);
    const e = partida();
    expect(e.modo).toBe('facil');
    expect(e.era).toBe('pedra');
    expect(e.morte).toBe(false);
    expect(e.armas.lasca).toBeTruthy();
    expect(TEXTOS.proposta).toBe('PROPOSTA');
    expect(TEXTOS.fim).toBe('O farol está aceso. O planetinha ficou visível.');
    expect(TEXTOS.dica.pedra).toBe('A Pedra chegou. A lasca gira sozinha.');
    expect(JSON.stringify(TEXTOS.dica)).not.toMatch(/PROPOSTA/);
    expect(TEXTOS.cartas.lasca.texto).not.toMatch(/PROPOSTA/);
  });
});

describe('ondas', () => {
  it('a Pedra enche de inimigos e o anel e o bando só acontecem uma vez', () => {
    const e = partida();
    avancar(e, 3);
    expect(e.inimigos.length).toBeGreaterThan(0);
    expect(e.inimigos.every((i) => CONFIG.eras.pedra.horda.includes(i.tipo))).toBe(true);
    e.tempo = CONFIG.marcos.pedraBando.em - 0.02;
    avancar(e, 0.1);
    const nEnxame = () => e.inimigos.filter((i) => i.tipo === 'enxame').length;
    const primeiro = nEnxame();
    expect(primeiro).toBe(CONFIG.marcos.pedraBando.n);
    avancar(e, 1);
    expect(nEnxame()).toBeLessThanOrEqual(primeiro);
    expect(e.eventosFeitos.pedraBando).toBe(true);
  });

  it('no fim da Pedra nasce o urso, e na metade da vida ele entra na fase 2', () => {
    const e = partida();
    e.tempo = CONFIG.marcos.pedraChefe.em - 0.02;
    avancar(e, 0.1);
    expect(e.chefe).toBeTruthy();
    expect(e.chefe.tipo).toBe('urso-da-caverna');
    expect(e.chefe.fase).toBe(1);
    e.chefe.hp = e.chefe.hpMax * CONFIG.chefeMeia - 1;
    avancar(e, 0.1);
    expect(e.chefe.fase).toBe(2);
  });
});

describe('acontecimentos', () => {
  it('a chuva de meteoros abre telegraph na Pedra', () => {
    const e = partida();
    e.tempo = CONFIG.marcos.pedraMeteoros.em - 0.02;
    avancar(e, 0.1);
    const zonas = e.zonas.filter((z) => z.evento === 'meteoros');
    expect(e.eventosFeitos.pedraMeteoros).toBe(true);
    expect(zonas).toHaveLength(CONFIG.meteoros.n);
    expect(zonas.every((z) => z.sprite === 'telegraph' && z.dano === CONFIG.meteoros.dano)).toBe(true);
  });

  it('a enchente cobre uma área no Bronze e deixa o passo lento', () => {
    const e = partida();
    e.tempo = CONFIG.marcos.bronzeEnchente.em - 0.02;
    for (const chave of Object.keys(CONFIG.marcos)) {
      if (chave !== 'bronzeEnchente') e.eventosFeitos[chave] = true;
    }
    avancar(e, 0.1);
    expect(e.enchente).toBeTruthy();
    expect(e.enchente.raio).toBe(CONFIG.enchente.raio);
    expect(e.enchente.resta).toBeGreaterThan(0);
    const x0 = e.x;
    tick(e, 0.2, { x: 1, y: 0 });
    const comAgua = e.x - x0;
    e.enchente = null;
    const x1 = e.x;
    tick(e, 0.2, { x: 1, y: 0 });
    expect(comAgua).toBeLessThan(e.x - x1);
  });

  it('a tempestade de raios abre telegraph no Ferro', () => {
    const e = partida();
    e.chefesMortos.pedra = true;
    e.chefesMortos.bronze = true;
    e.era = 'ferro';
    e.tempo = CONFIG.marcos.ferroRaios.em - 0.02;
    for (const chave of Object.keys(CONFIG.marcos)) {
      if (chave !== 'ferroRaios') e.eventosFeitos[chave] = true;
    }
    avancar(e, 0.1);
    const zonas = e.zonas.filter((z) => z.evento === 'raios');
    expect(e.eventosFeitos.ferroRaios).toBe(true);
    expect(zonas).toHaveLength(CONFIG.raios.n);
    expect(zonas.every((z) => z.sprite === 'telegraph')).toBe(true);
    expect(e.tempestade.resta).toBeGreaterThan(0);
  });
});

describe('XP e level-up', () => {
  it('a gema tem três faixas e o nível abre três cartas', () => {
    expect(faixaXp(1)).toBe(1);
    expect(faixaXp(CONFIG.xpFaixa[1])).toBe(2);
    expect(faixaXp(CONFIG.xpFaixa[2])).toBe(3);
    const e = partida();
    expect(xpPara(1)).toBeGreaterThan(0);
    ganharXp(e, xpPara(1));
    expect(e.nivel).toBe(2);
    expect(e.pausa).toBe(true);
    expect(e.cartas).toHaveLength(3);
    expect(e.cartas.every((c) => c.proposta && !/PROPOSTA/.test(c.texto) && !/PROPOSTA/.test(c.nome))).toBe(true);
    const antes = e.tempo;
    avancar(e, 2);
    expect(e.tempo).toBe(antes);
    const r = escolherCarta(e, 0);
    expect(r.ok).toBe(true);
    expect(e.pausa).toBe(false);
    expect(e.nivel).toBe(2);
  });

  it('a carta de vida aumenta a vida e não troca a era', () => {
    const e = partida();
    ganharXp(e, xpPara(1));
    const i = e.cartas.findIndex((c) => c.id === 'vida');
    expect(i).toBeGreaterThanOrEqual(0);
    const max = e.vidaMax;
    escolherCarta(e, i);
    expect(e.vidaMax).toBe(max + CONFIG.vidaCarta);
    expect(e.era).toBe('pedra');
  });
});

describe('Fácil sem morte', () => {
  it('vida em zero devolve o Samuel ao centro sem perder progresso', () => {
    const e = partida();
    e.armas.lanca = { nivel: 1 };
    e.xp = 3;
    e.x = e.inicio.x + 40;
    e.y = e.inicio.y;
    receberDano(e, 999);
    expect(e.morte).toBe(false);
    expect(e.vida).toBe(e.vidaMax);
    expect(e.x).toBe(e.inicio.x);
    expect(e.y).toBe(e.inicio.y);
    expect(e.xp).toBe(3);
    expect(e.nivel).toBe(1);
    expect(e.armas.lanca).toBeTruthy();
    expect(e.era).toBe('pedra');
    expect(e.invulneravel).toBe(CONFIG.invulneravelSegundos);
  });
});

describe('chefes e farol', () => {
  it('derrubar o urso abre o Bronze e o colosso acende o farol', () => {
    const e = partida();
    e.tempo = CONFIG.marcos.pedraChefe.em - 0.02;
    avancar(e, 0.1);
    e.chefe.hp = 0;
    avancar(e, 0.1);
    expect(e.chefe).toBeNull();
    expect(e.chefesMortos.pedra).toBe(true);
    expect(e.era).toBe('bronze');
    expect(e.farol).toBe(false);
    expect(e.vitoria).toBe(false);

    e.chefesMortos.pedra = true;
    e.chefesMortos.bronze = true;
    e.era = 'ferro';
    e.tempo = CONFIG.marcos.ferroChefe.em - 0.02;
    e.eventosFeitos.ferroChefe = false;
    for (const chave of Object.keys(CONFIG.marcos)) {
      if (chave !== 'ferroChefe') e.eventosFeitos[chave] = true;
    }
    avancar(e, 0.1);
    expect(e.chefe?.tipo).toBe('colosso-de-ferro');
    const nivel = e.nivel;
    e.chefe.hp = 0;
    avancar(e, 0.1);
    expect(e.farol).toBe(true);
    expect(e.vitoria).toBe(true);
    expect(e.morte).toBe(false);
    expect(e.inimigos).toEqual([]);
    expect(e.nivel).toBeGreaterThanOrEqual(nivel);
    expect(ERAS[e.era].nome).toMatch(/Ferro/);
    avancar(e, 5);
    expect(e.inimigos).toEqual([]);
  });
});

describe('save', () => {
  it('grava o progresso e recusa save antigo ou lixo', () => {
    const e = partida();
    e.era = 'bronze';
    e.nivel = 4;
    e.armas.lanca = { nivel: 1 };
    e.fogueira = false;
    const cru = JSON.stringify(serializar(e));
    const deVolta = restaurar(cru);
    expect(deVolta.era).toBe('bronze');
    expect(deVolta.nivel).toBe(4);
    expect(deVolta.armas.lanca).toBeTruthy();
    expect(deVolta.morte).toBe(false);
    expect(restaurar('{')).toBeNull();
    expect(restaurar('{"schemaVersion":1,"modo":"facil","era":"pedra"}')).toBeNull();
  });
});

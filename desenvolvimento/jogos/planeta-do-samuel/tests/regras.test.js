import { describe, expect, it } from 'vitest';
import { CHAO, NO } from '../../../../_privado/jogos/planeta-do-samuel/ilha.js';
import {
  CONFIG, ERAS, PROPOSTA, TEXTOS,
  escolherCarta, escuridao, faixaXp, ganharXp, limiteCamera, receberDano, restaurar, serializar,
  tempoDeTravessia, tick, criarPartida, xpPara,
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

describe('ilha grande', () => {
  it('gera 128×128 com praia, mato, rocha e vulcão, e a travessia passa de 25 s', () => {
    const e = partida();
    expect(e.colunas).toBe(128);
    expect(e.linhas).toBe(128);
    expect(CONFIG.bloco).toBe(32);
    expect(e.colunas * CONFIG.bloco).toBe(4096);
    expect(e.geracaoMs).toBeLessThan(150);
    expect(tempoDeTravessia(e)).toBeGreaterThanOrEqual(25);
    const tipos = new Set(e.terreno);
    expect(tipos.has(CHAO.PRAIA)).toBe(true);
    expect(tipos.has(CHAO.MATO)).toBe(true);
    expect(tipos.has(CHAO.ROCHA)).toBe(true);
    expect(e.terreno[64 * 128 + 64]).toBe(CHAO.BRASA);
    expect(e.terreno[e.inicio.lin * 128 + e.inicio.col]).toBeGreaterThanOrEqual(CHAO.GRAMA);
    const quadrantes = [0, 0, 0, 0];
    for (const no of e.lista) {
      if (!e.recursos[no.i]) continue;
      quadrantes[(no.col < 64 ? 0 : 1) + (no.lin < 64 ? 0 : 2)] += 1;
    }
    expect(quadrantes.every((n) => n > 20)).toBe(true);
    expect(Math.hypot(e.farolPos.x - e.inicio.x, e.farolPos.y - e.inicio.y)).toBeGreaterThan(800);
  });

  it('água funda e recurso seguram o passo; o arbusto cura', () => {
    const e = partida();
    e.x = 8;
    e.y = 8;
    tick(e, 0.2, { x: -1, y: -1 });
    expect(e.x).toBe(8);
    expect(e.y).toBe(8);
    const arvore = e.lista.find((no) => e.recursos[no.i] === NO.ARVORE);
    e.x = (arvore.col + 0.5) * CONFIG.bloco;
    e.y = (arvore.lin + 0.5) * CONFIG.bloco;
    const preso = e.x;
    tick(e, 0.2, { x: 1, y: 0 });
    expect(e.x).toBe(preso);
    const mato = e.lista.find((no) => e.recursos[no.i] === NO.ARBUSTO);
    e.x = (mato.col + 0.5) * CONFIG.bloco;
    e.y = (mato.lin + 0.5) * CONFIG.bloco;
    e.vida = 40;
    tick(e, 0.05, { x: 0, y: 0 });
    expect(e.recursos[mato.i]).toBe(NO.NENHUM);
    expect(e.vida).toBe(40 + CONFIG.curaArbusto);
  });

  it('a câmera para na borda do mundo', () => {
    const e = partida();
    e.x = 4;
    e.y = 4;
    const perto = limiteCamera(e, 320, 240);
    expect(perto.x).toBe(0);
    expect(perto.y).toBe(0);
    e.x = 4000;
    e.y = 4000;
    const longe = limiteCamera(e, 320, 240);
    expect(longe.x + longe.w).toBeLessThanOrEqual(4096);
    expect(longe.y + longe.h).toBeLessThanOrEqual(4096);
    expect(longe.x).toBeGreaterThan(3000);
  });
});

describe('dia e chefes da ilha', () => {
  it('a noite dura o trecho 0,66–0,97 de um dia de 240 s', () => {
    const e = partida();
    expect(CONFIG.duracaoDia).toBe(240);
    e.tempo = 20;
    expect(escuridao(e)).toBe(0);
    e.tempo = 0.8 * CONFIG.duracaoDia;
    expect(escuridao(e)).toBeCloseTo(CONFIG.escuridaoNoite, 5);
    e.vitoria = true;
    expect(escuridao(e)).toBe(0);
  });

  it('o urso investe, bate e fica atordoado, levando o dobro', () => {
    const e = partida();
    e.tempo = CONFIG.marcos.pedraChefe.em - 0.02;
    avancar(e, 0.1);
    expect(e.chefe.tipo).toBe('urso-da-caverna');
    e.chefe.x = 12;
    e.chefe.y = e.inicio.y;
    e.chefe.modo = 'investe';
    e.chefe.vx = -400;
    e.chefe.vy = 0;
    e.chefe.investida = 0.6;
    avancar(e, 0.1);
    expect(e.chefe.modo).toBe('atordoado');
    e.anguloLasca = 0;
    e.chefe.x = e.x + CONFIG.armas.lasca.orbita;
    e.chefe.y = e.y;
    e.chefe.lascaEm = 0;
    e.chefe.hp = 80;
    avancar(e, 0.05);
    const comStun = 80 - e.chefe.hp;
    const outro = partida();
    outro.tempo = CONFIG.marcos.pedraChefe.em - 0.02;
    avancar(outro, 0.1);
    outro.chefe.modo = 'anda';
    outro.chefe.ataqueEm = 5;
    outro.anguloLasca = 0;
    outro.chefe.x = outro.x + CONFIG.armas.lasca.orbita;
    outro.chefe.y = outro.y;
    outro.chefe.lascaEm = 0;
    outro.chefe.hp = 80;
    avancar(outro, 0.05);
    expect(comStun).toBeGreaterThan(80 - outro.chefe.hp);
  });

  it('a sentinela voa e cospe na direção do Samuel', () => {
    const e = partida();
    e.chefesMortos.pedra = true;
    e.era = 'bronze';
    e.tempo = CONFIG.marcos.bronzeChefe.em - 0.02;
    for (const chave of Object.keys(CONFIG.marcos)) {
      if (chave !== 'bronzeChefe') e.eventosFeitos[chave] = true;
    }
    avancar(e, 0.1);
    expect(e.chefe.tipo).toBe('sentinela-de-bronze');
    e.chefe.x = e.x + 90;
    e.chefe.y = e.y;
    e.chefe.casa = { x: e.chefe.x, y: e.chefe.y };
    e.chefe.ataqueEm = 0.01;
    const antes = e.projeteis.length;
    avancar(e, 0.1);
    expect(e.projeteis.length).toBeGreaterThan(antes);
    expect(e.projeteis.some((p) => p.sprite === 'faisca' && !p.aliado)).toBe(true);
    const x = e.chefe.x;
    avancar(e, 0.3);
    expect(e.chefe.x).not.toBe(x);
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
    expect(restaurar('{"schemaVersion":2,"modo":"facil","era":"pedra","x":1,"y":1,"vida":1,"nivel":1}')).toBeNull();
  });
});

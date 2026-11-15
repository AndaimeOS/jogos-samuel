import { describe, expect, it } from 'vitest';
import {
  CONFIG, ERAS, ESTACOES, PROPOSTA, TEXTOS,
  comer, contador, custoCampanha, desbloqueada, entregar, escuridao,
  estacaoPronta, fatorVelocidade, faltando, fundir, interagir, juntar, ofertaDoMapa,
  podeJuntar, proximoPasso, restaurar, serializar, tick, criarPartida,
} from '../../../../_privado/jogos/planeta-do-samuel/regras.js';

function partida() {
  return criarPartida();
}

function ir(estado, id) {
  const p = estado.postos[id];
  estado.x = p.x;
  estado.y = p.y;
}

function noDe(estado, tipo) {
  return estado.nos.find((n) => n.tipo === tipo && n.restante > 0);
}

describe('proposta', () => {
  it('marca os números como provisórios e sem combate', () => {
    expect(PROPOSTA).toBe(true);
    expect(CONFIG.proposta).toBe(true);
    expect(CONFIG.rotulo).toBe('PROPOSTA');
    expect(CONFIG.versao).toBe('0.1.0');
    expect(CONFIG.modo).toBe('facil');
    expect(CONFIG.semInimigos).toBe(true);
    expect(CONFIG.semArmas).toBe(true);
    expect(CONFIG.fatorLentidao).toBeGreaterThan(0);
    expect(CONFIG.fatorLentidao).toBeLessThan(1);
    expect(CONFIG.fomePorSegundo).toBeGreaterThan(0);
    expect(CONFIG.fomePorSegundo).toBeLessThan(2);
    const e = partida();
    expect(e.modo).toBe('facil');
    expect(e.era).toBe('pedra');
    expect(e.morte).toBe(false);
    expect(e.inimigos).toBeUndefined();
    expect(TEXTOS.fim).toMatch(/PROPOSTA/);
    expect(TEXTOS.estacao.farol).toMatch(/PROPOSTA/);
  });

  it('o mapa oferece o bastante para a campanha', () => {
    const e = partida();
    const oferta = ofertaDoMapa(e);
    const custo = custoCampanha();
    expect(oferta.madeira).toBeGreaterThanOrEqual(custo.madeira);
    expect(oferta.pedra).toBeGreaterThanOrEqual(custo.pedra);
    expect(oferta.minerio).toBeGreaterThanOrEqual(custo.minerio);
    expect(oferta.fruta).toBeGreaterThanOrEqual(custo.fruta);
    for (const est of ESTACOES) {
      expect(e.postos[est.id]).toBeTruthy();
      expect(desbloqueada(e, est)).toBe(est.id === 'toca');
    }
  });
});

describe('juntar', () => {
  it('colhe fruta, graveto e seixo com a mão e recusa a árvore sem machado', () => {
    const e = partida();
    for (const tipo of ['fruta', 'graveto', 'seixo']) {
      const no = noDe(e, tipo);
      const antes = e.inventario[no.item];
      e.x = no.x;
      e.y = no.y;
      const r = juntar(e, no.id);
      expect(r.ok).toBe(true);
      expect(r.ganho).toBe(no.rendimento);
      expect(e.inventario[no.item]).toBe(antes + no.rendimento);
      expect(no.restante).toBe(0);
      expect(juntar(e, no.id).motivo).toBe('vazio');
    }
    const arvore = noDe(e, 'arvore');
    e.x = arvore.x;
    e.y = arvore.y;
    expect(podeJuntar(e, arvore).motivo).toBe('precisa-machado');
    expect(juntar(e, arvore.id).ok).toBe(false);
    expect(arvore.restante).toBe(arvore.rendimento);
    const veio = noDe(e, 'veio');
    e.x = veio.x;
    e.y = veio.y;
    expect(juntar(e, veio.id).motivo).toBe('precisa-machado');
  });

  it('com o machado, árvore, rocha e veio enchem o inventário', () => {
    const e = partida();
    e.efeitos.machado = true;
    for (const tipo of ['arvore', 'rocha', 'veio']) {
      const no = noDe(e, tipo);
      e.x = no.x;
      e.y = no.y;
      const r = interagir(e);
      expect(r.ok).toBe(true);
      expect(r.item).toBe(no.item);
      expect(e.inventario[no.item]).toBeGreaterThan(0);
    }
  });

  it('não junta de longe', () => {
    const e = partida();
    const no = noDe(e, 'graveto');
    expect(juntar(e, no.id).motivo).toBe('longe');
    expect(no.restante).toBeGreaterThan(0);
  });
});

describe('fabricar e pesquisar', () => {
  it('entrega na toca com contador x/N e só então libera o machado', () => {
    const e = partida();
    ir(e, 'toca');
    expect(contador(e, 'toca').texto).toBe('0/4');
    expect(interagir(e).motivo).toBe('sem-item');
    e.inventario.madeira = 2;
    e.inventario.pedra = 2;
    expect(interagir(e)).toMatchObject({ ok: true, x: 1, n: 4 });
    expect(contador(e, 'toca').texto).toBe('1/4');
    expect(e.efeitos.machado).toBeUndefined();
    expect(interagir(e).x).toBe(2);
    expect(interagir(e).x).toBe(3);
    const fim = interagir(e);
    expect(fim).toMatchObject({ ok: true, x: 4, n: 4, efeito: 'machado' });
    expect(contador(e, 'toca').pronto).toBe(true);
    expect(e.efeitos.machado).toBe(true);
    expect(e.inventario.madeira).toBe(0);
    expect(e.inventario.pedra).toBe(0);
  });

  it('a bancada fica fechada na Pedra e abre depois da pesquisa', () => {
    const e = partida();
    ir(e, 'bancada');
    e.inventario.madeira = 9;
    expect(entregar(e, 'bancada').motivo).toBe('era-cedo');
    expect(e.era).toBe('pedra');
    expect(estacaoPronta(e, 'bancada')).toBe(false);
    ir(e, 'pesquisaBronze');
    expect(entregar(e, 'pesquisaBronze').motivo).toBe('precisa-passo');
  });

  it('percorre as três idades e acende o farol sem atalho', () => {
    const e = partida();
    const ordem = ['toca', 'fogueira', 'pesquisaBronze', 'bancada', 'fornalha', 'canteiro', 'pesquisaFerro', 'ferramentas', 'casinha', 'farol'];
    for (const id of ordem) {
      let guarda = 0;
      while (!estacaoPronta(e, id)) {
        const falta = faltando(e, id);
        if (falta === 'barra') {
          e.inventario.minerio += 1;
          ir(e, 'fornalha');
          expect(fundir(e).ok).toBe(true);
        } else {
          e.inventario[falta] += 1;
        }
        ir(e, id);
        const passo = proximoPasso(e);
        expect(passo.proposta).toBe(true);
        const r = interagir(e);
        expect(r.ok, `${id} ${falta} ${r.motivo}`).toBe(true);
        if (++guarda > 20) throw new Error('laço em ' + id);
      }
      expect(contador(e, id).texto.endsWith('/' + contador(e, id).n)).toBe(true);
    }
    expect(e.era).toBe('ferro');
    expect(ERAS[e.era].ordem).toBe(2);
    expect(e.efeitos.ferro).toBe(true);
    expect(e.efeitos.casa).toBe(true);
    expect(e.efeitos.farol).toBe(true);
    expect(e.farol).toBe(true);
    expect(proximoPasso(e).id).toBe('fim');
    expect(proximoPasso(e).texto).toMatch(/farol/i);
  });
});

describe('fome e calor no Fácil', () => {
  it('a noite só escurece e o frio é maior longe da fogueira', () => {
    expect(escuridao(CONFIG.horaInicial)).toBe(0);
    expect(escuridao(0.5)).toBe(0);
    const pico = (CONFIG.noiteInicio + CONFIG.noiteFim) / 2;
    expect(escuridao(pico)).toBeCloseTo(CONFIG.escuridaoMax, 5);
    expect(escuridao(CONFIG.noiteInicio)).toBe(0);
    expect(escuridao(CONFIG.noiteFim)).toBe(0);

    const longe = partida();
    longe.hora = pico;
    longe.x = longe.postos.farol.x;
    longe.y = longe.postos.farol.y;
    const calorLonge = longe.calor;
    tick(longe, 4, { x: 0, y: 0 });
    const dia = partida();
    dia.x = dia.postos.farol.x;
    dia.y = dia.postos.farol.y;
    const calorDia = dia.calor;
    tick(dia, 4, { x: 0, y: 0 });
    expect(calorLonge - longe.calor).toBeGreaterThan(calorDia - dia.calor);

    const perto = partida();
    perto.efeitos.fogueira = true;
    perto.hora = pico;
    ir(perto, 'fogueira');
    const antes = perto.calor;
    tick(perto, 2, { x: 0, y: 0 });
    expect(perto.calor).toBeGreaterThan(antes);
  });

  it('no zero só fica lento: não há derrota', () => {
    const e = partida();
    e.fome = 0;
    e.calor = 0;
    const x0 = e.x;
    tick(e, 1, { x: 1, y: 0 });
    expect(e.morte).toBe(false);
    expect(e.lentidao).toBe(true);
    expect(fatorVelocidade(e)).toBe(CONFIG.fatorLentidao);
    expect(e.x - x0).toBeCloseTo(CONFIG.velocidade * CONFIG.fatorLentidao, 1);
    expect(e.inimigos).toBeUndefined();

    const cheio = partida();
    const x1 = cheio.x;
    tick(cheio, 1, { x: 1, y: 0 });
    expect(cheio.x - x1).toBeCloseTo(CONFIG.velocidade, 1);
    expect(fatorVelocidade(cheio)).toBe(1);

    const fome = partida();
    tick(fome, CONFIG.fomeInicial / CONFIG.fomePorSegundo + 5, { x: 0, y: 0 });
    expect(fome.fome).toBe(0);
    expect(fome.morte).toBe(false);
    expect(fome.lentidao).toBe(true);
    fome.inventario.fruta = 1;
    expect(comer(fome).ok).toBe(true);
    expect(fome.fome).toBeCloseTo(CONFIG.frutaRecupera, 5);
    expect(fatorVelocidade(fome)).toBe(1);
  });

  it('a seta inicial aponta um recurso da mão, com texto de proposta', () => {
    const e = partida();
    const passo = proximoPasso(e);
    expect(passo.proposta).toBe(true);
    expect(passo.texto).toMatch(/PROPOSTA/);
    expect(passo.id.startsWith('graveto') || passo.id === 'toca').toBe(true);
  });
});

describe('save', () => {
  it('volta igual e recusa dado inválido', () => {
    const e = partida();
    const graveto = noDe(e, 'graveto');
    e.x = graveto.x;
    e.y = graveto.y;
    juntar(e, graveto.id);
    ir(e, 'toca');
    e.inventario.pedra = 1;
    interagir(e);
    e.hora = 0.4;
    e.fome = 55;
    e.calor = 40;
    const bruto = serializar(e);
    expect(bruto.schemaVersion).toBe(1);
    expect(bruto.proposta).toBe(true);
    expect(bruto.morte).toBe(false);
    expect(bruto.modo).toBe('facil');
    const deNovo = restaurar(JSON.stringify(bruto));
    expect(deNovo.inventario).toEqual(e.inventario);
    expect(deNovo.progresso).toEqual(e.progresso);
    expect(deNovo.x).toBeCloseTo(e.x, 5);
    expect(deNovo.y).toBeCloseTo(e.y, 5);
    expect(deNovo.fome).toBe(55);
    expect(deNovo.calor).toBe(40);
    expect(deNovo.hora).toBeCloseTo(0.4, 5);
    expect(deNovo.nos.find((n) => n.id === graveto.id).restante).toBe(0);
    expect(deNovo.morte).toBe(false);

    expect(restaurar(null)).toBeNull();
    expect(restaurar('não é json')).toBeNull();
    expect(restaurar({})).toBeNull();
    expect(restaurar({ ...bruto, schemaVersion: 2 })).toBeNull();
    expect(restaurar({ ...bruto, era: 'ouro' })).toBeNull();
    expect(restaurar({ ...bruto, modo: 'normal' })).toBeNull();
    expect(restaurar({ ...bruto, inventario: { ...bruto.inventario, madeira: -1 } })).toBeNull();
  });

  it('a fruta do canteiro volta ao inventário', () => {
    const e = partida();
    e.efeitos.canteiro = true;
    e.era = 'bronze';
    e.progresso.canteiro = contador(e, 'canteiro').n;
    ir(e, 'canteiro');
    tick(e, 1 / CONFIG.canteiroPorSegundo + 0.1, { x: 0, y: 0 });
    expect(e.canteiroFruta).toBeGreaterThanOrEqual(1);
    const r = interagir(e);
    expect(r.ok).toBe(true);
    expect(r.item).toBe('fruta');
    expect(e.inventario.fruta).toBeGreaterThan(0);
  });
});

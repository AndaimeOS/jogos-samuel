import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { TEXTO_FACIL, TEXTO_NORMAL } from '../../../../_privado/jogos/reino-dos-blocos/regras.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const jogo = path.resolve(aqui, '../../../../_privado/jogos/reino-dos-blocos');
const arte = '/opt/cursor/artifacts';
const porta = 8766;
const url = `http://127.0.0.1:${porta}/index.html`;

let servidor;
let browser;

function faseSalva(cristais) {
  return { completou: true, cristais, tempo: 40, estrelas: 12 };
}

async function portaAberta() {
  for (let i = 0; i < 50; i++) {
    const ok = await new Promise((resolve) => {
      const s = createConnection({ port: porta, host: '127.0.0.1' }, () => { s.end(); resolve(true); });
      s.on('error', () => resolve(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('o servidor do jogo não subiu');
}

async function abrir(progresso, modo = 'normal') {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.addInitScript(({ progresso, modo }) => {
    localStorage.setItem('reino:progresso', JSON.stringify(progresso));
    localStorage.setItem('reino:modo', JSON.stringify(modo));
    localStorage.setItem('reino:som', JSON.stringify(true));
  }, { progresso, modo });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__reino && window.__reino.estado.fase === 'menu');
  return page;
}

async function quadro(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true });
  servidor = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'], { cwd: jogo, stdio: 'ignore' });
  await portaAberta();
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
});

afterAll(async () => {
  await browser?.close();
  servidor?.kill();
});

describe('jogo no navegador', () => {
  it('mostra o contador x/9 e o cartão trancado', async () => {
    const page = await abrir({
      0: faseSalva([true, true, false]),
      1: faseSalva([true, false, false]),
      2: faseSalva([true, true, false]),
    });
    expect(await page.locator('#contadorCristais').textContent()).toBe('💎 5/9 cristais');
    const cartao = page.locator('[data-fase="3"]');
    expect(await cartao.isDisabled()).toBe(true);
    expect(await cartao.textContent()).toMatch(/abre com 9\/9/);
    expect(await cartao.textContent()).toMatch(/Festa do Gatinho/);
    await cartao.click({ force: true });
    expect(await page.evaluate(() => window.__reino.estado.fase)).toBe('menu');
    expect(await page.evaluate(() => window.__reino.estado.nivel)).not.toBe(3);
    await page.locator('#contadorCristais').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(arte, 'reino-menu-cristais.png') });
    await page.close();
  });

  it('descreve o Fácil no botão e mostra a cena', async () => {
    const page = await abrir({}, 'facil');
    expect(await page.locator('#txtFacil').textContent()).toBe(TEXTO_FACIL);
    expect(await page.locator('#txtNormal').textContent()).toBe(TEXTO_NORMAL);
    expect(await page.locator('[data-modo="facil"]').getAttribute('aria-pressed')).toBe('true');
    await page.locator('#txtFacil').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(arte, 'reino-modo-facil-botao.png') });
    const cena = await page.evaluate(() => {
      const r = window.__reino;
      r.comecar(0);
      r.simular(0.4);
      document.getElementById('aviso').innerHTML = '';
      return {
        hud: document.getElementById('hFase').textContent,
        vidas: r.estado.vidas,
        coiote: r.fisica.COIOTE,
        geleias: r.inimigos.filter((e) => e.tipo === 'geleia').map((e) => Math.abs(e.vel)),
        abelhas: r.inimigos.filter((e) => e.tipo === 'abelha').map((e) => e.ritmo),
        bandeiras: r.itens.filter((i) => i.tipo === 'bandeira').length,
      };
    });
    expect(cena.hud.startsWith('FÁCIL')).toBe(true);
    expect(cena.vidas).toBe(5);
    expect(cena.coiote).toBe(0.16);
    expect(cena.geleias.length).toBeLessThan(7);
    expect(cena.geleias.every((v) => v === 18)).toBe(true);
    expect(cena.abelhas.every((v) => v === 0.75)).toBe(true);
    expect(cena.bandeiras).toBeGreaterThan(1);
    await quadro(page);
    await page.screenshot({ path: path.join(arte, 'reino-modo-facil-cena.png') });
    await page.close();
  });

  it('no Normal a geleia continua a 28 e o mapa não encolhe', async () => {
    const page = await abrir({});
    const medido = await page.evaluate(() => {
      const r = window.__reino;
      r.estado.modo = 'normal';
      r.carregarFase(0);
      r.comecar(0);
      const largas = r.plataformas.map((p) => p.w);
      return {
        coiote: r.fisica.COIOTE,
        buffer: r.fisica.BUFFER,
        gravSobe: r.fisica.GRAV_SOBE,
        pulo: r.fisica.PULO,
        vidas: r.estado.vidas,
        largura: r.estado.largura,
        geleias: r.inimigos.filter((e) => e.tipo === 'geleia').length,
        vel: r.inimigos.filter((e) => e.tipo === 'geleia').map((e) => Math.abs(e.vx)),
        abelhas: r.inimigos.filter((e) => e.tipo === 'abelha').length,
        ritmo: r.inimigos.find((e) => e.tipo === 'abelha')?.ritmo,
        bandeiras: r.itens.filter((i) => i.tipo === 'bandeira').length,
        plataformas: largas,
      };
    });
    expect(medido.coiote).toBe(0.1);
    expect(medido.buffer).toBe(0.13);
    expect(medido.gravSobe).toBe(1050);
    expect(medido.pulo).toBe(392);
    expect(medido.vidas).toBe(3);
    expect(medido.largura).toBe(206);
    expect(medido.geleias).toBe(7);
    expect(medido.vel.every((v) => v === 28)).toBe(true);
    expect(medido.abelhas).toBe(2);
    expect(medido.ritmo).toBe(1.1);
    expect(medido.bandeiras).toBe(1);
    expect(medido.plataformas.every((w) => w === 48)).toBe(true);
    await page.close();
  });

  it('o Doguinho aponta o cristal uma vez, sem jogar pela criança, e cala com o som desligado', async () => {
    const page = await abrir({});
    const pista = await page.evaluate(() => {
      const r = window.__reino;
      r.comecar(0);
      const cristal = r.itens.find((i) => i.tipo === 'cristal');
      const x0 = cristal.x - 3 * 16;
      r.jogador.x = x0;
      r.jogador.y = 178;
      r.jogador.vx = 0;
      r.jogador.vy = 0;
      r.cachorro.x = x0 - 8;
      r.cachorro.y = 192;
      r.cachorro.acao = 'segue';
      r.Som.ligado = true;
      const antes = { x: r.jogador.x, vidas: r.estado.vidas, estrelas: r.estado.estrelas, vivos: r.inimigos.filter((e) => e.vivo).length };
      r.simular(0.5);
      const durante = {
        acao: r.cachorro.acao,
        tipo: r.cachorro.alvo && r.cachorro.alvo.tipo,
        latidos: r.cachorro.latidos,
        tocou: r.cachorro.tocouLatido,
        cristalPego: r.itens.filter((i) => i.tipo === 'cristal' && i.pego).length,
        x: r.jogador.x,
        vidas: r.estado.vidas,
        estrelas: r.estado.estrelas,
        fase: r.estado.fase,
        vivos: r.inimigos.filter((e) => e.vivo).length,
      };
      r.cachorro.pistaT = 30;
      document.getElementById('aviso').innerHTML = '';
      return { antes, durante, cristal };
    });
    expect(pista.durante.acao).toBe('pista');
    expect(pista.durante.tipo).toBe('cristal');
    expect(pista.durante.latidos).toBe(1);
    expect(pista.durante.tocou).toBe(true);
    expect(pista.durante.cristalPego).toBe(0);
    expect(pista.durante.estrelas).toBe(pista.antes.estrelas);
    expect(pista.durante.vidas).toBe(pista.antes.vidas);
    expect(pista.durante.x).toBe(pista.antes.x);
    expect(pista.durante.vivos).toBe(pista.antes.vivos);
    expect(pista.durante.fase).toBe('jogando');
    await quadro(page);
    await page.screenshot({ path: path.join(arte, 'reino-doguinho-pista.png') });
    const depois = await page.evaluate(() => {
      const r = window.__reino;
      r.cachorro.pistaT = 0.05;
      r.simular(4);
      return { latidos: r.cachorro.latidos, fase: r.estado.fase };
    });
    expect(depois.latidos).toBe(1);
    expect(depois.fase).toBe('jogando');

    const mudo = await page.evaluate(() => {
      const r = window.__reino;
      r.carregarFase(0);
      r.estado.fase = 'jogando';
      r.Som.ligado = false;
      const cristal = r.itens.find((i) => i.tipo === 'cristal');
      r.jogador.x = cristal.x - 32;
      r.jogador.y = 178;
      r.jogador.vx = 0;
      r.jogador.vy = 0;
      r.cachorro.x = r.jogador.x;
      r.cachorro.y = 192;
      r.simular(0.4);
      return { latidos: r.cachorro.latidos, tocou: r.cachorro.tocouLatido, acao: r.cachorro.acao };
    });
    expect(mudo.latidos).toBe(1);
    expect(mudo.tocou).toBe(false);
    expect(mudo.acao).toBe('pista');
    await page.close();
  });

  it('com 9 de 9 abre a fase bônus e o robô chega na festa sem perder coração', async () => {
    const page = await abrir({
      0: faseSalva([true, true, true]),
      1: faseSalva([true, true, true]),
      2: faseSalva([true, true, true]),
    });
    expect(await page.locator('#contadorCristais').textContent()).toMatch(/9\/9/);
    expect(await page.locator('[data-fase="3"]').isEnabled()).toBe(true);
    const meio = await page.evaluate(() => {
      const r = window.__reino;
      r.estado.modo = 'normal';
      r.comecar(3);
      r.simular(0.3);
      document.getElementById('aviso').innerHTML = '';
      return {
        nome: r.FASES[3].nome,
        largura: r.estado.largura,
        vidas: r.estado.vidas,
        inimigos: r.inimigos.length,
        hud: document.getElementById('hFase').textContent,
        gato: true,
      };
    });
    expect(meio.nome).toBe('Festa do Gatinho');
    expect(meio.largura).toBe(120);
    expect(meio.vidas).toBe(3);
    expect(meio.inimigos).toBe(0);
    expect(meio.hud).toContain('FESTA DO GATINHO');
    await quadro(page);
    await page.screenshot({ path: path.join(arte, 'reino-fase-bonus.png') });

    const fim = await page.evaluate(() => {
      const r = window.__reino;
      r.robo = true;
      r.simular(90);
      return {
        fase: r.estado.fase,
        vidas: r.estado.vidas,
        x: r.jogador.x,
        completou: !!(r.progresso[3] && r.progresso[3].completou),
        total: r.totalCristais(),
        festa: document.getElementById('fimFesta').hidden,
        info: document.getElementById('fimInfo').textContent,
        titulo: document.getElementById('fimTitulo').textContent,
      };
    });
    expect(fim.fase).toBe('resultado');
    expect(fim.vidas).toBeGreaterThanOrEqual(3);
    expect(fim.completou).toBe(true);
    expect(fim.total).toBe(9);
    expect(fim.festa).toBe(false);
    expect(fim.titulo).toBe('Festa do Gatinho');
    expect(fim.info).toMatch(/festa/i);
    await page.screenshot({ path: path.join(arte, 'reino-tela-festa.png') });
    await page.close();
  });
});

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const jogo = path.resolve(aqui, '../../../../_privado/jogos/planeta-do-samuel');
const arte = '/opt/cursor/artifacts';
const porta = 8773;
const url = `http://127.0.0.1:${porta}/index.html`;

let servidor;
let browser;
let context;

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

async function alvos(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-alvo]')].flatMap((el) => {
    if (el.closest('[hidden]')) return [];
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return [];
    return [{ id: el.id || el.getAttribute('aria-label') || el.textContent.trim(), w: r.width, h: r.height }];
  }));
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true });
  servidor = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'], { cwd: jogo, stdio: 'ignore' });
  await portaAberta();
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
});

afterAll(async () => {
  await context?.close();
  await browser?.close();
  servidor?.kill();
});

describe('tablet deitado 1024×768', () => {
  it('abre com botões grandes, horda, cartas, chefe, noite e farol', async () => {
    const page = await context.newPage();
    const erros = [];
    page.on('pageerror', (e) => erros.push(String(e)));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__planeta && window.__planeta.estado);
    expect(await page.locator('#btnContinuar').isHidden()).toBe(true);
    await page.evaluate(() => localStorage.setItem(window.__planeta.CONFIG.chaveSave, '{'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__planeta && window.__planeta.saveUtil);
    expect(await page.locator('#btnContinuar').isHidden()).toBe(true);

    const titulo = await alvos(page);
    expect(titulo.map((b) => b.id)).toContain('btnComecar');
    for (const b of titulo) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    await page.screenshot({ path: path.join(arte, 'planeta-v2-titulo.png') });

    await page.locator('#btnComecar').click();
    await page.waitForFunction(() => window.__planeta.atlasPronto());
    await page.waitForFunction(() => document.getElementById('titulo').hidden);
    const jogo = await alvos(page);
    const ids = jogo.map((b) => b.id);
    for (const id of ['joystick', 'btnPausa', 'btnTela']) expect(ids).toContain(id);
    expect(ids).not.toContain('btnInteragir');
    expect(ids).not.toContain('btnComer');
    for (const b of jogo) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    const rolagem = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      sh: document.documentElement.scrollHeight,
      ch: document.documentElement.clientHeight,
    }));
    expect(rolagem.sw).toBeLessThanOrEqual(rolagem.cw + 1);
    expect(rolagem.sh).toBeLessThanOrEqual(rolagem.ch + 1);
    expect(await page.locator('#dica').textContent()).toBe('A Pedra chegou. A lasca gira sozinha.');
    expect(await page.locator('.selo').count()).toBe(0);
    expect(await page.locator('body').innerText()).not.toMatch(/PROPOSTA/);
    expect(await page.locator('#nivel').textContent()).toMatch(/^\d+$/);
    expect(await page.locator('#vidas canvas').count()).toBeGreaterThan(0);

    const caixa = await page.locator('#joystick').boundingBox();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: caixa.x + caixa.width / 2 + 50, y: caixa.y + caixa.height / 2, id: 1 }] });
    const antes = await page.evaluate(() => window.__planeta.estado.x);
    await page.evaluate(() => window.__planeta.simular(0.8));
    const depois = await page.evaluate(() => window.__planeta.estado.x);
    expect(depois).toBeGreaterThan(antes + 8);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      p.definirEixo(0, 0);
      p.simular(2.5);
      const def = p.CONFIG.inimigos.mamute;
      e.inimigos = e.inimigos.filter((i) => Math.hypot(i.x - e.x, i.y - e.y) > 100);
      e.inimigos.push({
        id: 9001, tipo: 'mamute', sprite: 'mamute', x: e.x + 64, y: e.y + 4,
        hp: def.hp, hpMax: def.hp, raio: def.raio, direcao: 0, comportamento: 'chase',
        contatoEm: 0, lascaEm: 0, auraEm: 0,
      });
      p.travar(true);
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.inimigos.some((i) => i.tipo === 'mamute'))).toBe(true);
    expect(await page.evaluate(() => window.__planeta.estado.era)).toBe('pedra');
    await page.screenshot({ path: path.join(arte, 'planeta-v2-pedra-chromium.png') });
    await page.evaluate(() => window.__planeta.travar(false));

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.tempo = p.CONFIG.marcos.pedraMeteoros.em - 0.02;
      e.eventosFeitos.pedraMeteoros = false;
      e.zonas = [];
      p.simular(0.12);
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.zonas.some((z) => z.evento === 'meteoros'))).toBe(true);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-meteoros.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.zonas = [];
      e.inimigos = [];
      e.tempo = p.CONFIG.marcos.bronzeEnchente.em - 0.02;
      e.era = 'bronze';
      e.chefesMortos.pedra = true;
      for (const k of Object.keys(p.CONFIG.marcos)) if (k !== 'bronzeEnchente') e.eventosFeitos[k] = true;
      e.eventosFeitos.bronzeEnchente = false;
      e.enchente = null;
      p.simular(0.12);
      p.desenhar();
    });
    expect(await page.evaluate(() => !!window.__planeta.estado.enchente)).toBe(true);
    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.enchente = null;
      e.zonas = [];
      e.inimigos = [];
      e.era = 'bronze';
      const por = (tipo, ox, oy) => {
        const def = p.CONFIG.inimigos[tipo];
        e.inimigos.push({
          id: e.seq++, tipo, sprite: def.sprite, x: e.x + ox, y: e.y + oy,
          hp: def.hp, hpMax: def.hp, raio: def.raio, direcao: 0, comportamento: 'chase',
        });
      };
      por('guerreiro-de-bronze', 58, 8);
      por('caranguejo-gigante', -52, 16);
      p.travar(true);
      p.desenhar();
    });
    await page.screenshot({ path: path.join(arte, 'planeta-v2-bronze-chromium.png') });
    await page.evaluate(() => window.__planeta.travar(false));

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.enchente = null;
      e.zonas = [];
      e.inimigos = [];
      e.tempo = p.CONFIG.marcos.ferroRaios.em - 0.02;
      e.era = 'ferro';
      e.chefesMortos.bronze = true;
      for (const k of Object.keys(p.CONFIG.marcos)) if (k !== 'ferroRaios') e.eventosFeitos[k] = true;
      e.eventosFeitos.ferroRaios = false;
      e.tempestade = null;
      p.simular(0.12);
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.zonas.some((z) => z.evento === 'raios'))).toBe(true);
    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.tempestade = null;
      e.zonas = [];
      e.enchente = null;
      e.inimigos = [];
      e.era = 'ferro';
      e.fogueira = true;
      const por = (tipo, ox, oy) => {
        const def = p.CONFIG.inimigos[tipo];
        e.inimigos.push({
          id: e.seq++, tipo, sprite: def.sprite, x: e.x + ox, y: e.y + oy,
          hp: def.hp, hpMax: def.hp, raio: def.raio, direcao: 0, comportamento: 'chase',
        });
      };
      por('soldado-de-ferro', 54, 6);
      por('robo-enferrujado', -46, 18);
      p.travar(true);
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.escuridao(window.__planeta.estado))).toBeGreaterThan(0.5);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-ferro-chromium.png') });
    await page.evaluate(() => window.__planeta.travar(false));

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.zonas = [];
      e.enchente = null;
      e.tempestade = null;
      e.inimigos = [];
      p.ganharXp(e, e.xpProx);
      p.desenhar();
    });
    await page.waitForSelector('#levelup:not([hidden]) #carta-0');
    const cartas = await alvos(page);
    const idsCartas = cartas.map((b) => b.id);
    for (const id of ['carta-0', 'carta-1', 'carta-2']) expect(idsCartas).toContain(id);
    for (const b of cartas.filter((c) => c.id.startsWith('carta-'))) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    await page.screenshot({ path: path.join(arte, 'planeta-v2-levelup-chromium.png') });
    await page.evaluate(() => window.__planeta.escolherCarta(window.__planeta.estado, 0));

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.pausa = false;
      e.cartas = [];
      e.chefesMortos.pedra = true;
      e.chefesMortos.bronze = false;
      e.era = 'bronze';
      e.tempo = p.CONFIG.marcos.bronzeChefe.em - 0.02;
      for (const k of Object.keys(p.CONFIG.marcos)) if (k !== 'bronzeChefe') e.eventosFeitos[k] = true;
      e.eventosFeitos.bronzeChefe = false;
      e.chefe = null;
      p.simular(0.2);
      if (e.chefe) {
        e.chefe.x = e.x + 48;
        e.chefe.y = e.y - 8;
        e.chefe.telegrafo = 0;
        e.chefe.ataqueEm = 3;
        e.zonas = [];
      }
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.chefe && window.__planeta.estado.chefe.tipo)).toBe('sentinela-de-bronze');
    await page.screenshot({ path: path.join(arte, 'planeta-v2-chefe-chromium.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.chefe = null;
      e.inimigos = [];
      e.projeteis = [];
      e.zonas = [];
      e.enchente = null;
      e.tempestade = null;
      e.chefesMortos.bronze = true;
      e.era = 'ferro';
      e.fogueira = true;
      e.vitoria = false;
      e.x = e.inicio.x;
      e.y = e.inicio.y;
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.escuridao(window.__planeta.estado))).toBeGreaterThan(0.5);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-noite.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.farol = true;
      e.vitoria = true;
      e.era = 'ferro';
      e.x = e.farolPos.x + 36;
      e.y = e.farolPos.y + 24;
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.farol)).toBe(true);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-farol-chromium.png') });

    await page.locator('#btnPausa').click();
    await page.waitForSelector('#pausa:not([hidden])');
    const pausa = await alvos(page);
    const voltar = pausa.find((b) => b.id === 'btnVoltar');
    expect(voltar.w).toBeGreaterThanOrEqual(48);
    expect(voltar.h).toBeGreaterThanOrEqual(48);
    expect(await page.locator('#btnVoltar').getAttribute('href')).toBe('/jogos/');
    expect(await page.locator('#btnVoltar').getAttribute('target')).toBe('_top');
    expect(erros, erros.join('\n')).toEqual([]);
    await page.close();
  });
});

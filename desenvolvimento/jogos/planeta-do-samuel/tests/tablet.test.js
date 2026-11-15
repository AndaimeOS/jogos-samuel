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
  it('abre em paisagem, com botões grandes, joystick e as quatro cenas', async () => {
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

    await page.locator('#btnComecar').click();
    await page.waitForFunction(() => document.getElementById('titulo').hidden);
    const jogo = await alvos(page);
    const ids = jogo.map((b) => b.id);
    for (const id of ['joystick', 'btnInteragir', 'btnComer', 'btnPausa', 'btnTela', 'chip-fruta']) {
      expect(ids).toContain(id);
    }
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
    expect(await page.locator('#dica').textContent()).toMatch(/PROPOSTA/);
    expect(await page.locator('.selo').first().textContent()).toBe('PROPOSTA');
    await page.screenshot({ path: path.join(arte, 'planeta-idade-da-pedra.png') });

    const caixa = await page.locator('#joystick').boundingBox();
    const cx = caixa.x + caixa.width / 2;
    const cy = caixa.y + caixa.height / 2;
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 50, y: cy, id: 1 }] });
    const antes = await page.evaluate(() => window.__planeta.estado.x);
    await page.evaluate(() => window.__planeta.simular(0.8));
    const depois = await page.evaluate(() => ({
      x: window.__planeta.estado.x,
      eixo: document.getElementById('knob').style.left,
    }));
    expect(depois.x).toBeGreaterThan(antes + 8);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.inventario.madeira = 2;
      e.x = e.postos.toca.x;
      e.y = e.postos.toca.y;
      p.interagir(e);
      p.interagir(e);
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.contador(window.__planeta.estado, 'toca').texto)).toBe('2/4');
    await page.screenshot({ path: path.join(arte, 'planeta-craft.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      const n = p.contador(e, 'fogueira').n;
      e.progresso.fogueira = n;
      e.efeitos.fogueira = true;
      e.efeitos.machado = true;
      e.hora = (p.CONFIG.noiteInicio + p.CONFIG.noiteFim) / 2;
      e.x = e.postos.fogueira.x + 12;
      e.y = e.postos.fogueira.y + 6;
      p.desenhar();
    });
    const noite = await page.evaluate(() => window.__planeta.escuridao(window.__planeta.estado.hora));
    expect(noite).toBeGreaterThan(0.5);
    await page.screenshot({ path: path.join(arte, 'planeta-noite.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      const ordem = ['toca', 'fogueira', 'pesquisaBronze', 'bancada', 'fornalha', 'canteiro', 'pesquisaFerro', 'ferramentas', 'casinha', 'farol'];
      for (const id of ordem) {
        let guarda = 0;
        while (!p.estacaoPronta(e, id)) {
          const falta = p.faltando(e, id);
          if (falta === 'barra') {
            e.inventario.minerio += 1;
            e.x = e.postos.fornalha.x;
            e.y = e.postos.fornalha.y;
            if (!p.fundir(e).ok) throw new Error('fundir');
          } else {
            e.inventario[falta] += 1;
          }
          e.x = e.postos[id].x;
          e.y = e.postos[id].y;
          const r = p.interagir(e);
          if (!r.ok) throw new Error(id + ' ' + r.motivo);
          if (++guarda > 20) throw new Error('laço ' + id);
        }
      }
      e.hora = 0.7;
      e.x = e.postos.farol.x + 28;
      e.y = e.postos.farol.y + 8;
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.farol)).toBe(true);
    await page.screenshot({ path: path.join(arte, 'planeta-farol.png') });

    await page.evaluate(() => { window.__planeta.estado.desdeSave = window.__planeta.CONFIG.autosaveSegundos; });
    await page.waitForFunction(() => {
      const s = localStorage.getItem(window.__planeta.CONFIG.chaveSave);
      return !!s && JSON.parse(s).farol === true;
    });
    const save = await page.evaluate(() => localStorage.getItem(window.__planeta.CONFIG.chaveSave));
    const lido = JSON.parse(save);
    expect(lido.schemaVersion).toBe(1);
    expect(lido.farol).toBe(true);
    expect(lido.morte).toBe(false);

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

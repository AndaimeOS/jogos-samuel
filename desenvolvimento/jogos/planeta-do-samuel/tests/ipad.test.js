import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { webkit } from 'playwright';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../../..');
const arte = '/opt/cursor/artifacts';
const porta = 8775;
const origem = `http://127.0.0.1:${porta}`;
const jogoUrl = `${origem}/jogo/planeta-do-samuel/index.html`;
const jogarUrl = `${origem}/jogar/?jogo=planeta-do-samuel`;
const UA = 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';

let servidor;
let browser;

async function portaAberta() {
  for (let i = 0; i < 50; i++) {
    const ok = await new Promise((resolve) => {
      const s = createConnection({ port: porta, host: '127.0.0.1' }, () => { s.end(); resolve(true); });
      s.on('error', () => resolve(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('o portal PHP não subiu');
}

function contexto(largura, altura) {
  return browser.newContext({
    viewport: { width: largura, height: altura },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
    userAgent: UA,
  });
}

function ouvir(page, erros) {
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const texto = msg.text();
    if (/favicon/i.test(texto)) return;
    erros.push(texto);
  });
}

async function alvos(alvo) {
  return alvo.evaluate(() => [...document.querySelectorAll('[data-alvo]')].flatMap((el) => {
    if (el.closest('[hidden]')) return [];
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return [];
    return [{ id: el.id || el.getAttribute('aria-label') || el.textContent.trim(), w: r.width, h: r.height }];
  }));
}

async function semRolagem(alvo) {
  const r = await alvo.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    sh: document.documentElement.scrollHeight,
    ch: document.documentElement.clientHeight,
  }));
  expect(r.sw).toBeLessThanOrEqual(r.cw + 1);
  expect(r.sh).toBeLessThanOrEqual(r.ch + 1);
}

async function canvasVivo(alvo) {
  return alvo.evaluate(() => {
    const c = document.getElementById('tela');
    const w = c.width;
    const h = c.height;
    const dados = c.getContext('2d').getImageData(0, 0, Math.min(w, 80), Math.min(h, 80)).data;
    let n = 0;
    for (let i = 3; i < dados.length; i += 4) if (dados[i]) n++;
    return { w, h, n };
  });
}

async function tocarStick(alvo, dx) {
  await alvo.evaluate((deslocamento) => {
    const zona = document.getElementById('joystick');
    const r = zona.getBoundingClientRect();
    const x0 = r.left + r.width / 2;
    const y0 = r.top + r.height / 2;
    const x1 = x0 + deslocamento;
    const ponteiro = (tipo, x, y) => zona.dispatchEvent(new PointerEvent(tipo, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      buttons: tipo === 'pointerup' ? 0 : 1,
    }));
    const toque = (tipo, x, y) => {
      if (typeof Touch !== 'function' || typeof TouchEvent !== 'function') return;
      const t = new Touch({ identifier: 1, target: zona, clientX: x, clientY: y, pageX: x, pageY: y });
      const lista = tipo === 'touchend' ? [] : [t];
      zona.dispatchEvent(new TouchEvent(tipo, {
        bubbles: true,
        cancelable: true,
        touches: lista,
        targetTouches: lista,
        changedTouches: [t],
      }));
    };
    ponteiro('pointerdown', x0, y0);
    try { toque('touchstart', x0, y0); } catch { /* o WebKit do Playwright não constrói Touch */ }
    ponteiro('pointermove', x1, y0);
    try { toque('touchmove', x1, y0); } catch { /* segue no pointerType touch */ }
  }, dx);
}

async function soltarStick(alvo) {
  await alvo.evaluate(() => {
    const zona = document.getElementById('joystick');
    zona.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true,
    }));
    try {
      if (typeof Touch === 'function' && typeof TouchEvent === 'function') {
        const t = new Touch({ identifier: 1, target: zona, clientX: 0, clientY: 0 });
        zona.dispatchEvent(new TouchEvent('touchend', {
          bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t],
        }));
      }
    } catch { /* pointerup já soltou o stick */ }
  });
}

async function samuelAndou(alvo) {
  await tocarStick(alvo, 70);
  const antes = await alvo.evaluate(() => window.__planeta.estado.x);
  await alvo.evaluate(() => window.__planeta.simular(0.8));
  const depois = await alvo.evaluate(() => window.__planeta.estado.x);
  await soltarStick(alvo);
  expect(depois).toBeGreaterThan(antes + 8);
}

async function barraSemTexto(alvo) {
  expect(await alvo.locator('#dica').textContent()).toBe('A Pedra chegou. A lasca gira sozinha.');
  expect(await alvo.locator('.selo').count()).toBe(0);
  expect(await alvo.locator('body').innerText()).not.toMatch(/PROPOSTA/);
  expect(await alvo.locator('#hud').innerText()).not.toMatch(/Vida|XP|Nível|Idade/);
  expect(await alvo.locator('#nivel').textContent()).toMatch(/^\d+$/);
  expect(await alvo.locator('#relogio').textContent()).toMatch(/^\d{2}:\d{2}$/);
  expect(await alvo.locator('#vidas canvas').count()).toBe(5);
  expect(await alvo.locator('#armas canvas').count()).toBeGreaterThan(0);
  expect(await alvo.locator('#medXp #barraXp').count()).toBe(1);
}

async function escolherCartaNoToque(alvo) {
  await alvo.evaluate(() => {
    const p = window.__planeta;
    p.ganharXp(p.estado, p.estado.xpProx);
    p.desenhar();
  });
  await alvo.locator('#levelup:not([hidden]) #carta-0').waitFor();
  await new Promise((r) => setTimeout(r, 400));
  await alvo.locator('#carta-0').tap();
  await alvo.waitForFunction(() => window.__planeta.estado.pausa === false);
}

async function fallbackTela(alvo) {
  await alvo.evaluate(() => {
    const jogo = document.getElementById('jogo');
    window.__telaPedido = '';
    Object.defineProperty(jogo, 'requestFullscreen', { configurable: true, value: undefined });
    Object.defineProperty(jogo, 'webkitRequestFullscreen', {
      configurable: true,
      value() {
        window.__telaPedido = this.id;
        return Promise.resolve();
      },
    });
  });
  await alvo.locator('#btnTela').tap();
  expect(await alvo.evaluate(() => window.__telaPedido)).toBe('jogo');
}

async function comecar(alvo) {
  await alvo.locator('#btnComecar').tap();
  await alvo.waitForFunction(() => window.__planeta.atlasPronto() && document.getElementById('titulo').hidden);
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true });
  await writeFile('/tmp/samuel-ipad-config.php', "<?php\nreturn ['senha_hash' => 'teste', 'segredo' => 'teste-ipad', 'versao' => 1];\n");
  servidor = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    env: { ...process.env, SAMUEL_CONFIG: '/tmp/samuel-ipad-config.php' },
    stdio: 'ignore',
  });
  await portaAberta();
  browser = await webkit.launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
  servidor?.kill();
});

describe('iPad WebKit', () => {
  it('1024×768 paisagem: toque, barra e capturas', async () => {
    const context = await contexto(1024, 768);
    const page = await context.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.goto(jogoUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__planeta && window.__planeta.estado);
    expect(await page.evaluate(() => navigator.userAgent)).toMatch(/iPad/);
    expect(await page.evaluate(() => navigator.userAgent)).toMatch(/Safari/);
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0)).toBe(true);
    expect(page.viewportSize()).toEqual({ width: 1024, height: 768 });

    const titulo = await alvos(page);
    expect(titulo.map((b) => b.id)).toContain('btnComecar');
    for (const b of titulo) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    expect(await page.locator('body').innerText()).not.toMatch(/PROPOSTA/);

    await comecar(page);
    const jogo = await alvos(page);
    for (const id of ['joystick', 'btnPausa', 'btnTela']) expect(jogo.map((b) => b.id)).toContain(id);
    for (const b of jogo) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    await semRolagem(page);
    await barraSemTexto(page);
    const tela = await canvasVivo(page);
    expect(tela.w).toBeGreaterThan(0);
    expect(tela.h).toBeGreaterThan(0);
    expect(tela.n).toBeGreaterThan(20);
    await samuelAndou(page);

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      p.definirEixo(0, 0);
      const def = p.CONFIG.inimigos.mamute;
      e.inimigos = e.inimigos.filter((i) => Math.hypot(i.x - e.x, i.y - e.y) > 100);
      e.inimigos.push({
        id: 9001, tipo: 'mamute', sprite: 'mamute', x: e.x + 64, y: e.y + 4,
        hp: def.hp, hpMax: def.hp, raio: def.raio, direcao: 0, comportamento: 'chase',
        contatoEm: 0, lascaEm: 0, auraEm: 0,
      });
      e.vida = 80;
      e.xp = Math.floor(e.xpProx * 0.45);
      e.tempo = 72;
      p.travar(true);
      p.desenhar();
    });
    expect(await page.locator('#vidas canvas').count()).toBe(5);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-pedra.png') });
    await page.evaluate(() => window.__planeta.travar(false));

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.enchente = null;
      e.zonas = [];
      e.inimigos = [];
      e.chefesMortos.pedra = true;
      e.era = 'bronze';
      e.tempo = 100;
      e.armas.lanca = { nivel: 1 };
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
    expect(await page.locator('#armas canvas').count()).toBeGreaterThanOrEqual(2);
    expect(await page.locator('#dica').textContent()).toMatch(/Bronze/);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-bronze.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.tempestade = null;
      e.zonas = [];
      e.enchente = null;
      e.inimigos = [];
      e.chefesMortos.pedra = true;
      e.chefesMortos.bronze = true;
      e.era = 'ferro';
      e.vitoria = false;
      e.armas.faisca = { nivel: 1 };
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
    await page.screenshot({ path: path.join(arte, 'planeta-v2-ferro.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.zonas = [];
      e.inimigos = [];
      e.pausa = false;
      e.cartas = [];
      p.ganharXp(e, e.xpProx - e.xp);
      p.desenhar();
    });
    await page.locator('#levelup:not([hidden]) #carta-0').waitFor();
    await page.screenshot({ path: path.join(arte, 'planeta-v2-levelup.png') });
    const cartas = await alvos(page);
    for (const id of ['carta-0', 'carta-1', 'carta-2']) expect(cartas.map((b) => b.id)).toContain(id);
    for (const b of cartas.filter((c) => c.id.startsWith('carta-'))) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    expect(await page.locator('#hud').isVisible()).toBe(true);
    expect(await page.locator('#nivel').textContent()).toMatch(/^\d+$/);
    await new Promise((r) => setTimeout(r, 400));
    await page.locator('#carta-0').tap();
    await page.waitForFunction(() => window.__planeta.estado.pausa === false);

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
      e.inimigos = [];
      e.zonas = [];
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
    expect(await page.locator('#medChefe').isVisible()).toBe(true);
    expect(await page.locator('#medChefe').innerText()).toBe('');
    await page.screenshot({ path: path.join(arte, 'planeta-v2-chefe.png') });

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
      e.farol = true;
      e.vitoria = true;
      e.x = e.farolPos.x + 36;
      e.y = e.farolPos.y + 24;
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.farol)).toBe(true);
    expect(await page.locator('#dica').textContent()).toBe('O farol está aceso. O planetinha ficou visível.');
    await page.screenshot({ path: path.join(arte, 'planeta-v2-farol.png') });

    await fallbackTela(page);
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  });

  it('768×1024 retrato: toque, canvas e botões', async () => {
    const context = await contexto(768, 1024);
    const page = await context.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.goto(jogoUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__planeta && window.__planeta.estado);
    expect(page.viewportSize()).toEqual({ width: 768, height: 1024 });
    await comecar(page);
    const jogo = await alvos(page);
    for (const id of ['joystick', 'btnPausa', 'btnTela']) expect(jogo.map((b) => b.id)).toContain(id);
    for (const b of jogo) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    await semRolagem(page);
    await barraSemTexto(page);
    const tela = await canvasVivo(page);
    expect(tela.w).toBeGreaterThan(0);
    expect(tela.n).toBeGreaterThan(20);
    await samuelAndou(page);
    await escolherCartaNoToque(page);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-retrato.png') });
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  });

  it('iframe de /jogar/?jogo=planeta-do-samuel', async () => {
    const context = await contexto(1024, 768);
    const page = await context.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.goto(jogarUrl, { waitUntil: 'networkidle' });
    const iframe = page.locator('iframe#jogo');
    await iframe.waitFor();
    expect(await iframe.getAttribute('src')).toContain('/jogo/planeta-do-samuel/');
    const frame = page.frames().find((f) => f.url().includes('/jogo/planeta-do-samuel/'));
    expect(frame).toBeTruthy();
    await frame.waitForFunction(() => window.__planeta && window.__planeta.estado);
    await comecar(frame);
    const tela = await canvasVivo(frame);
    expect(tela.w).toBeGreaterThan(0);
    expect(tela.n).toBeGreaterThan(20);
    await semRolagem(frame);
    await barraSemTexto(frame);
    const botoes = await alvos(frame);
    for (const id of ['btnPausa', 'btnTela']) expect(botoes.map((b) => b.id)).toContain(id);
    for (const b of botoes) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(48);
      expect(b.h, b.id).toBeGreaterThanOrEqual(48);
    }
    await samuelAndou(frame);
    await escolherCartaNoToque(frame);
    await fallbackTela(frame);
    await page.screenshot({ path: path.join(arte, 'planeta-v2-iframe.png') });
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  });
});

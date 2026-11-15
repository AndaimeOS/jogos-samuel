import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { arrastar, habilitarArrasteWebKit } from './toque-webkit.js';

habilitarArrasteWebKit();

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../../..');
const arte = '/opt/cursor/artifacts';
const porta = 8796;
const origem = `http://127.0.0.1:${porta}`;
const direto = `${origem}/jogo/samuel-surfers/index.html`;
const UA = 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';

let php;
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

function ouvir(page, erros, prefixo = '') {
  page.on('pageerror', (e) => erros.push(prefixo + String(e)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const texto = msg.text();
    if (/favicon/i.test(texto)) return;
    erros.push(prefixo + texto);
  });
}

async function contexto(largura, altura, escala = 1) {
  return browser.newContext({
    viewport: { width: largura, height: altura },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: escala,
    userAgent: UA,
  });
}

async function deslizar(page, alvo, dx, dy) {
  const caixa = await alvo.locator('#cena').boundingBox();
  const x = caixa.x + caixa.width * 0.42;
  const y = caixa.y + caixa.height * 0.48;
  await arrastar(page, x, y, x + dx, y + dy);
}

async function abrir(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__surfers && window.__surfers.resumo().pronto);
}

async function jogar(alvo) {
  await alvo.locator('#bFacil').tap();
  await alvo.locator('#bJogar').tap();
  await alvo.waitForFunction(() => window.__surfers.resumo().estado === 'correndo');
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true });
  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/samuel-config-surfers.php', "<?php\nreturn ['senha_hash' => 'teste', 'segredo' => 'teste-surfers', 'versao' => 1];\n");
  php = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    env: { ...process.env, SAMUEL_CONFIG: '/tmp/samuel-config-surfers.php' },
    stdio: 'ignore',
  });
  await portaAberta();
  const { webkit } = await import('playwright');
  browser = await webkit.launch({ headless: true });
}, 30000);

afterAll(async () => {
  await browser?.close();
  php?.kill();
});

describe('Samuel Surfers no WebKit, iPad, só toque', () => {
  it('abre em 3D, sem GLB e sem a folha pixel', async () => {
    const ctx = await contexto(1024, 768);
    const page = await ctx.newPage();
    const erros = [];
    const pedidos = [];
    ouvir(page, erros);
    page.on('request', (r) => pedidos.push(r.url()));
    await abrir(page, direto);
    const resumo = await page.evaluate(() => window.__surfers.resumo());
    expect(resumo.webgl).toBe(true);
    expect(resumo.estilo).toBe('blocos');
    expect(resumo.sombras).toBe(false);
    expect(resumo.faixaMundo).toBe(3.1);
    expect(resumo.alturaSamuel).toBe(2.3);
    expect(pedidos.some((u) => u.includes('.glb') || u.includes('samuel-costas'))).toBe(false);
    expect(erros, erros.join('\n')).toEqual([]);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-inicio-1024x768.png') });
    await ctx.close();
  }, 30000);

  it('tutorial, moedas, pulo, rolar, tropeço e fim', async () => {
    const ctx = await contexto(1024, 768);
    const page = await ctx.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.addInitScript(() => localStorage.clear());
    await abrir(page, direto);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-inicio-1024x768.png') });
    await jogar(page);
    expect(await page.locator('#tutorial').isVisible()).toBe(true);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-tutorial-1024x768.png') });
    await provarAcoes(page, page, '1024x768');
    await conferirHud(page);
    await deslizar(page, page, -160, 0);
    await page.waitForFunction(() => window.__surfers.resumo().faixa === -1);
    await page.evaluate(() => window.__surfers.obstaculoNaFrente());
    await esperarTropeco(page);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-tropeco-1024x768.png') });
    expect(await page.locator('#aviso').textContent()).toMatch(/Tropeçou/);
    expect(await page.evaluate(() => window.__surfers.resumo().acabou)).toBe(false);
    await page.locator('#bPausa').tap();
    await page.locator('#bEncerrar').tap();
    await page.waitForFunction(() => window.__surfers.resumo().estado === 'fim');
    expect(await page.locator('#moedasFim').innerText()).toMatch(/^\d+ moeda(s)?$/);
    expect(await page.locator('#recordeFim').innerText()).toMatch(/^Recorde: \d+ m/);
    expect(await page.locator('#metrosFim').innerText()).toMatch(/\d+ m/);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-fim-1024x768.png') });
    const botoes = await page.locator('#hud button, #tFim button, #tMenu button').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.id, w: r.width, h: r.height, visivel: r.width > 0 };
    }));
    // o hud está escondido no fim; mede os botões da corrida de novo no retrato
    expect(erros, erros.join('\n')).toEqual([]);
    expect(botoes.filter((b) => b.visivel).every((b) => b.w >= 44 && b.h >= 44)).toBe(true);
    await ctx.close();
  }, 60000);

  it('retrato 768×1024: as mesmas telas e botões de 76', async () => {
    const ctx = await contexto(768, 1024);
    const page = await ctx.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.addInitScript(() => localStorage.clear());
    await abrir(page, direto);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-inicio-768x1024.png') });
    await jogar(page);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-tutorial-768x1024.png') });
    await provarAcoes(page, page, '768x1024');
    await conferirHud(page);
    const medidas = await page.locator('#bEsquerda, #bPular, #bRolar, #bDireita, #bPausa, #bTela').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.id, w: r.width, h: r.height };
    }));
    for (const botao of medidas) {
      expect(botao.w, botao.id).toBeGreaterThanOrEqual(76);
      expect(botao.h, botao.id).toBeGreaterThanOrEqual(76);
    }
    await deslizar(page, page, -150, 0);
    await page.waitForFunction(() => window.__surfers.resumo().faixa === -1);
    await page.evaluate(() => window.__surfers.obstaculoNaFrente());
    await esperarTropeco(page);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-tropeco-768x1024.png') });
    await page.locator('#bPausa').tap();
    await page.locator('#bEncerrar').tap();
    expect(await page.locator('#recordeFim').innerText()).toMatch(/^Recorde: \d+ m/);
    expect(await page.locator('#moedasFim').innerText()).toMatch(/moeda/);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-fim-768x1024.png') });
    const rolagem = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(rolagem.sw).toBeLessThanOrEqual(rolagem.cw + 1);
    expect(erros, erros.join('\n')).toEqual([]);
    await ctx.close();
  }, 60000);

  it('estilo pixel: menu e corrida, sem erro de console', async () => {
    const ctx = await contexto(1024, 768);
    const page = await ctx.newPage();
    const erros = [];
    ouvir(page, erros);
    await abrir(page, direto);
    await page.locator('#bPixel').tap();
    await page.waitForFunction(() => window.__surfers.resumo().estilo === 'pixel' && document.getElementById('carregando').hidden);
    const arquivos = await page.evaluate(() => window.__surfers.resumo().arquivos);
    expect(arquivos.some((a) => String(a).includes('samuel-costas'))).toBe(true);
    expect(erros, erros.join('\n')).toEqual([]);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-pixel-menu-1024x768.png') });
    await page.locator('#bJogar').tap();
    await page.waitForFunction(() => window.__surfers.resumo().estado === 'correndo');
    await page.evaluate(() => { document.getElementById('tutorial').hidden = true; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(arte, 'samuel-surfers-pixel-corrida-1024x768.png') });
    expect(await page.evaluate(() => window.__surfers.resumo().estilo)).toBe('pixel');
    expect(erros, erros.join('\n')).toEqual([]);
    await ctx.close();
  }, 30000);

  it('limita o pixel ratio e a tela cheia usa webkit', async () => {
    const ctx = await contexto(1024, 768, 2);
    const page = await ctx.newPage();
    const erros = [];
    ouvir(page, erros);
    await abrir(page, direto);
    const ratio = await page.evaluate(() => window.__surfers.resumo().pixelRatio);
    expect(ratio).toBeLessThanOrEqual(1.25);
    await page.evaluate(() => {
      const alvo = document.getElementById('app');
      window.__tela = '';
      Object.defineProperty(alvo, 'requestFullscreen', { configurable: true, value: undefined });
      Object.defineProperty(alvo, 'webkitRequestFullscreen', {
        configurable: true,
        value() { window.__tela = 'webkit'; return Promise.resolve(); },
      });
    });
    await page.locator('#bTelaMenu').tap();
    expect(await page.evaluate(() => window.__tela)).toBe('webkit');
    await page.evaluate(() => {
      const alvo = document.getElementById('app');
      Object.defineProperty(alvo, 'webkitRequestFullscreen', { configurable: true, value: undefined });
      Object.defineProperty(alvo, 'webkitRequestFullScreen', { configurable: true, value: undefined });
    });
    await page.locator('#bTelaMenu').tap();
    expect(await page.evaluate(() => document.body.classList.contains('tela-fallback'))).toBe(true);
    expect(erros, erros.join('\n')).toEqual([]);
    await ctx.close();
  });

  it('60 s deitado, na página', async () => {
    await minuto(1024, 768, direto, false);
  }, 120000);

  it('60 s em pé, na página', async () => {
    await minuto(768, 1024, direto, false);
  }, 120000);

  it('60 s deitado, no iframe', async () => {
    await minuto(1024, 768, `${origem}/jogar/?jogo=samuel-surfers`, true);
  }, 120000);

  it('60 s em pé, no iframe', async () => {
    await minuto(768, 1024, `${origem}/jogar/?jogo=samuel-surfers`, true);
  }, 120000);
});

async function quadros(alvo, n = 2) {
  await alvo.evaluate((faltam) => new Promise((resolve) => {
    const passo = () => {
      faltam -= 1;
      if (faltam <= 0) resolve(undefined);
      else requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }), n);
}

async function provarAcoes(page, alvo, sufixo) {
  await alvo.evaluate(() => { document.getElementById('tutorial').hidden = true; });
  const antes = await alvo.evaluate(() => window.__surfers.resumo().moedas);
  await alvo.waitForFunction((base) => {
    const s = window.__surfers.resumo();
    return s.moedas > base && s.particulas > 0;
  }, antes, { timeout: 15000 });
  await quadros(alvo);
  const moedas = await alvo.evaluate(() => window.__surfers.resumo());
  expect(moedas.moedas).toBeGreaterThan(antes);
  expect(moedas.particulas).toBeGreaterThan(0);
  await page.screenshot({ path: path.join(arte, `samuel-surfers-moedas-${sufixo}.png`) });
  await alvo.evaluate(() => window.__surfers.limparParticulas());
  await deslizar(page, alvo, 0, -170);
  await alvo.waitForFunction(() => {
    const s = window.__surfers.resumo();
    return s.pulando && s.y > 1 && s.pose === 'pular';
  });
  await quadros(alvo);
  await alvo.evaluate(() => {
    window.__surfers.limparParticulas();
    window.__surfers.congelar(true);
  });
  await quadros(alvo);
  const pulo = await alvo.evaluate(() => window.__surfers.resumo());
  expect(pulo.y).toBeGreaterThan(0);
  expect(pulo.pose).toBe('pular');
  await page.screenshot({ path: path.join(arte, `samuel-surfers-pulo-${sufixo}.png`) });
  await alvo.evaluate(() => window.__surfers.congelar(false));
  await alvo.waitForFunction(() => !window.__surfers.resumo().pulando && window.__surfers.resumo().y === 0);
  await alvo.evaluate(() => window.__surfers.limparParticulas());
  await deslizar(page, alvo, 0, 160);
  await alvo.waitForFunction(() => {
    const s = window.__surfers.resumo();
    return s.rolando && s.y === 0 && s.pose === 'rolar';
  });
  await quadros(alvo);
  await alvo.evaluate(() => window.__surfers.congelar(true));
  await quadros(alvo);
  const rola = await alvo.evaluate(() => window.__surfers.resumo());
  expect(rola.pose).toBe('rolar');
  expect(rola.rolando).toBe(true);
  await page.screenshot({ path: path.join(arte, `samuel-surfers-rola-${sufixo}.png`) });
  await alvo.evaluate(() => window.__surfers.congelar(false));
}

async function esperarTropeco(alvo) {
  await alvo.waitForFunction(() => {
    const s = window.__surfers.resumo();
    if (!s.tropecando || s.pose !== 'tropecar') return false;
    const p = window.__surfers.projetar(s.x * s.faixaMundo, 1.2, 0);
    return Math.abs(p.x) < 0.82 && p.y > -0.82 && p.y < 0.9;
  }, null, { timeout: 20000 });
  await quadros(alvo);
}

function cruza(a, b) {
  return a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1;
}

async function caixa(alvo, sel) {
  return alvo.locator(sel).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.id, x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

async function conferirHud(alvo) {
  const caixas = [];
  for (const id of ['#metros', '#moedas', '#bSom', '#bPausa', '#bTela']) caixas.push(await caixa(alvo, id));
  for (let i = 0; i < caixas.length; i++) {
    expect(caixas[i].w, caixas[i].id).toBeGreaterThan(20);
    for (let j = i + 1; j < caixas.length; j++) {
      expect(cruza(caixas[i], caixas[j]), `${caixas[i].id} sobre ${caixas[j].id}`).toBe(false);
    }
  }
  expect(await alvo.locator('#metros').innerText()).toMatch(/\d+\s*m/);
  const esq = await caixa(alvo, '#bEsquerda');
  const dir = await caixa(alvo, '#bDireita');
  const pulo = await caixa(alvo, '#bPular');
  const rola = await caixa(alvo, '#bRolar');
  for (const botao of [esq, dir, pulo, rola]) {
    expect(botao.w, botao.id).toBeGreaterThanOrEqual(76);
    expect(botao.h, botao.id).toBeGreaterThanOrEqual(76);
  }
  expect(Math.abs(esq.y - dir.y)).toBeLessThan(12);
  expect(dir.x).toBeGreaterThan(esq.x + 60);
  expect(esq.x).toBeLessThan(140);
  expect(Math.abs(pulo.y - rola.y)).toBeLessThan(12);
  expect(rola.x).toBeGreaterThan(pulo.x + 60);
  expect(pulo.x).toBeGreaterThan(dir.x + 80);
}

async function minuto(largura, altura, url, iframe) {
  const ctx = await contexto(largura, altura);
  const page = await ctx.newPage();
  const erros = [];
  ouvir(page, erros);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  let alvo = page;
  if (iframe) {
    await page.locator('#carregando').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const frame = page.frames().find((f) => /\/jogo\/samuel-surfers\//.test(f.url()));
    expect(frame).toBeTruthy();
    ouvir(frame, erros, 'iframe: ');
    await frame.waitForFunction(() => window.__surfers && window.__surfers.resumo().pronto);
    alvo = frame;
  } else {
    await page.waitForFunction(() => window.__surfers && window.__surfers.resumo().pronto);
  }
  await alvo.locator('#bJogar').tap();
  await alvo.waitForFunction(() => window.__surfers.resumo().estado === 'correndo');
  const t0 = Date.now();
  let n = 0;
  while (Date.now() - t0 < 60000) {
    const giro = n % 4;
    if (giro === 0) await deslizar(page, alvo, -150, 0);
    else if (giro === 1) await deslizar(page, alvo, 150, 0);
    else if (giro === 2) await deslizar(page, alvo, 0, -140);
    else await deslizar(page, alvo, 0, 130);
    n += 1;
    await page.waitForTimeout(2200);
    if (erros.length) break;
  }
  const resumo = await alvo.evaluate(() => window.__surfers.resumo());
  expect(resumo.estado, JSON.stringify(resumo)).toBe('correndo');
  expect(resumo.distancia).toBeGreaterThan(200);
  expect(resumo.chamadas).toBeGreaterThan(0);
  expect(resumo.chamadas).toBeLessThanOrEqual(120);
  expect(resumo.acabou).toBe(false);
  expect(erros, erros.join('\n')).toEqual([]);
  await ctx.close();
}

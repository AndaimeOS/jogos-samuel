import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { devices, webkit } from 'playwright';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../../..');
const arte = '/opt/cursor/artifacts';
const porta = 8784;
const origem = `http://127.0.0.1:${porta}`;
const jogoUrl = `${origem}/jogo/samuel-corredor/index.html`;
const jogarUrl = `${origem}/jogar/?jogo=samuel-corredor`;
const ipad = devices['iPad (gen 7)'];

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
    ...ipad,
    viewport: { width: largura, height: altura },
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

async function medir(alvo, ids) {
  return alvo.evaluate((lista) => lista.flatMap((id) => {
    const el = document.getElementById(id);
    if (!el || el.hidden || el.closest('[hidden]')) return [];
    const r = el.getBoundingClientRect();
    return [{ id, w: r.width, h: r.height }];
  }), ids);
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

async function exigirTamanho(alvo, ids) {
  const botoes = await medir(alvo, ids);
  expect(botoes.map((b) => b.id)).toEqual(expect.arrayContaining(ids));
  for (const b of botoes) {
    expect(b.w, b.id).toBeGreaterThanOrEqual(44);
    expect(b.h, b.id).toBeGreaterThanOrEqual(44);
  }
}

async function segurar(alvo, id, ligado) {
  await alvo.evaluate(({ id, ligado }) => {
    const btn = document.getElementById(id);
    btn.dispatchEvent(new PointerEvent(ligado ? 'pointerdown' : 'pointerup', {
      bubbles: true,
      cancelable: true,
      pointerId: id === 'btnPulo' ? 5 : 4,
      pointerType: 'touch',
      isPrimary: true,
      buttons: ligado ? 1 : 0,
    }));
  }, { id, ligado });
}

async function soltar(alvo) {
  await segurar(alvo, 'btnDir', false);
  await segurar(alvo, 'btnEsq', false);
  await segurar(alvo, 'btnPulo', false);
}

async function esperarPronto(alvo, erros) {
  try {
    await alvo.waitForFunction(() => window.__corredor && window.__corredor.pronto && window.__corredor.olhar, null, { timeout: 20000 });
  } catch (e) {
    throw new Error(`${e.message}\n${erros.join('\n')}`);
  }
}

async function jogar(alvo, page, ms, prefixo, fotos = true) {
  const t0 = Date.now();
  const fez = {};
  while (Date.now() - t0 < ms) {
    const o = await alvo.evaluate(() => window.__corredor.olhar());
    if (o.tela === 'mapa') {
      await soltar(alvo);
      const botao = await alvo.locator('#btnFloresta').isEnabled() ? '#btnFloresta' : '#btnCampo';
      const caverna = await alvo.locator('#btnCaverna').isEnabled();
      await alvo.locator(caverna && fez.vitoria ? '#btnCaverna' : botao).tap();
    } else if (o.tela === 'vitoria') {
      await soltar(alvo);
      if (!fez.vitoria) {
        expect(await alvo.locator('#vitoriaCristais .cristal').count()).toBe(3);
        expect(await alvo.locator('#vitoriaMoedaIcon').evaluate((c) => c.width)).toBe(16);
        const moedas = Number(await alvo.locator('#vitoriaMoedas').textContent());
        expect(moedas).toBeGreaterThan(0);
        fez.moedas = moedas;
        const cheios = await alvo.locator('#vitoriaCristais .cristal.cheio').count();
        expect(cheios).toBeGreaterThanOrEqual(1);
        expect(cheios).toBeLessThanOrEqual(3);
        if (fotos) await page.screenshot({ path: path.join(arte, `samuel-corredor-vitoria-${prefixo}.png`) });
        fez.vitoria = true;
      }
      await alvo.locator('#btnProxima').tap();
    } else if (o.tela === 'pausa') {
      await alvo.locator('#btnSeguir').tap();
    } else if (o.tela === 'fase') {
      if (!fez.fase) {
        await alvo.waitForTimeout(300);
        if (fotos) await page.screenshot({ path: path.join(arte, `samuel-corredor-fase-${prefixo}.png`) });
        fez.fase = true;
      }
      if (!fez.pulo && o.vy < -40) {
        if (fotos) await page.screenshot({ path: path.join(arte, `samuel-corredor-pulo-${prefixo}.png`) });
        fez.pulo = true;
      }
      if (!fez.inimigo && ((o.derrotados || 0) > 0 || (o.derrotadosTotal || 0) > (fez.derrotadosAntes || 0))) {
        if (fotos) await page.screenshot({ path: path.join(arte, `samuel-corredor-inimigo-${prefixo}.png`) });
        fez.inimigo = true;
      }
      if (!fez.derrotadosAntes && o.tela === 'fase') fez.derrotadosAntes = o.derrotadosTotal || 0;
      if (o.pular === 'alto') {
        await segurar(alvo, 'btnEsq', false);
        await segurar(alvo, 'btnDir', true);
        await segurar(alvo, 'btnPulo', true);
      } else if (o.pular === 'volta') {
        await segurar(alvo, 'btnDir', false);
        await segurar(alvo, 'btnEsq', true);
        await segurar(alvo, 'btnPulo', true);
        await alvo.waitForTimeout(20);
        await segurar(alvo, 'btnPulo', false);
      } else if (o.pular === 'curto') {
        await segurar(alvo, 'btnEsq', false);
        await segurar(alvo, 'btnDir', true);
        await segurar(alvo, 'btnPulo', true);
        await alvo.waitForTimeout(20);
        await segurar(alvo, 'btnPulo', false);
      } else {
        await segurar(alvo, 'btnEsq', false);
        await segurar(alvo, 'btnPulo', false);
        await segurar(alvo, 'btnDir', true);
      }
    }
    await alvo.waitForTimeout(70);
  }
  return fez;
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true });
  servidor = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    stdio: 'ignore',
  });
  await portaAberta();
  browser = await webkit.launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
  servidor?.kill();
});

describe('iPad WebKit (geração 7)', () => {
  it('o perfil tem toque e a biblioteca lista o jogo pronto', async () => {
    expect(ipad.hasTouch).toBe(true);
    expect(ipad.isMobile).toBe(true);
    expect(ipad.defaultBrowserType).toBe('webkit');
    const context = await contexto(1024, 768);
    const page = await context.newPage();
    expect((await page.request.get(jogoUrl)).status()).toBe(200);
    const html = await (await page.request.get(`${origem}/jogos/`)).text();
    expect(html).toContain('data-card="samuel-corredor"');
    expect(html).toContain('Samuel Corredor');
    expect(html).toContain('/jogar/?jogo=samuel-corredor');
    await context.close();
  });

  it('1024×768: 60 s de toque, sem erro no console', async () => {
    const context = await contexto(1024, 768);
    const page = await context.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.addInitScript(() => localStorage.clear());
    await page.goto(jogoUrl, { waitUntil: 'networkidle' });
    await esperarPronto(page, erros);
    expect(await page.evaluate(() => navigator.userAgent)).toMatch(/iPad/);
    expect(await page.evaluate(() => navigator.userAgent)).toMatch(/Safari/);
    expect(ipad.hasTouch).toBe(true);
    expect(ipad.isMobile).toBe(true);
    expect(await page.evaluate(() => (
      navigator.maxTouchPoints > 0 || 'ontouchstart' in window || matchMedia('(pointer: coarse)').matches
    ))).toBe(true);
    expect(page.viewportSize()).toEqual({ width: 1024, height: 768 });
    await page.waitForFunction(() => {
      const r = document.getElementById('btnCampo').getBoundingClientRect();
      return r.width >= 44 && r.height >= 44 && window.__corredor.olhar().tela === 'mapa';
    });
    await page.waitForTimeout(250);
    expect(await page.locator('#btnFacil').getAttribute('aria-pressed')).toBe('true');
    await page.screenshot({ path: path.join(arte, 'samuel-corredor-mapa-paisagem.png') });
    await exigirTamanho(page, ['btnCampo', 'btnFloresta', 'btnCaverna', 'btnNormal', 'btnFacil', 'btnSair', 'btnTela']);
    await semRolagem(page);
    expect(await page.locator('#tituloVitoria').textContent()).toBe('Fase vencida');
    expect(await page.locator('body').innerText()).not.toMatch(/PROPOSTA|Mario|Goomba/);

    await page.locator('#btnCampo').tap();
    await page.waitForFunction(() => window.__corredor.olhar().tela === 'fase');
    await exigirTamanho(page, ['btnEsq', 'btnDir', 'btnPulo', 'btnPausa', 'btnTela']);
    await semRolagem(page);
    await page.locator('#btnPausa').tap();
    await page.waitForFunction(() => window.__corredor.olhar().tela === 'pausa');
    expect((await medir(page, ['btnSeguir']))[0].h).toBeGreaterThanOrEqual(44);
    await page.locator('#btnSeguir').tap();
    await page.waitForFunction(() => {
      const o = window.__corredor.olhar();
      return o.tela === 'fase' && o.noChao && o.pe > 180;
    });
    const pe = await page.evaluate(() => window.__corredor.olhar().pe);
    expect(Math.abs(pe - 192), `pés em ${pe}`).toBeLessThan(2);

    const fez = await jogar(page, page, 60000, 'paisagem');
    expect(fez.fase, 'não mostrou a fase').toBe(true);
    expect(fez.pulo, 'não pulou').toBe(true);
    expect(fez.inimigo, 'não derrotou inimigo').toBe(true);
    expect(fez.vitoria, 'não venceu a fase').toBe(true);
    expect(fez.moedas || 0).toBeGreaterThan(0);

    await page.evaluate(() => {
      const jogo = document.getElementById('jogo');
      window.__telaPedido = '';
      Object.defineProperty(jogo, 'requestFullscreen', { configurable: true, value: undefined });
      Object.defineProperty(jogo, 'webkitRequestFullscreen', {
        configurable: true,
        value() { window.__telaPedido = this.id; return Promise.resolve(); },
      });
    });
    await page.locator('#btnTela').tap();
    expect(await page.evaluate(() => window.__telaPedido)).toBe('jogo');
    await page.evaluate(() => {
      const jogo = document.getElementById('jogo');
      Object.defineProperty(jogo, 'requestFullscreen', { configurable: true, value: undefined });
      Object.defineProperty(jogo, 'webkitRequestFullscreen', { configurable: true, value: undefined });
    });
    await page.locator('#btnTela').tap();
    expect(await page.evaluate(() => document.getElementById('jogo').classList.contains('cresceu'))).toBe(true);
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  });

  it('768×1024: toque, pulo, inimigo e vitória', async () => {
    const context = await contexto(768, 1024);
    const page = await context.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.addInitScript(() => localStorage.clear());
    await page.goto(jogoUrl, { waitUntil: 'domcontentloaded' });
    await esperarPronto(page, erros);
    expect(page.viewportSize()).toEqual({ width: 768, height: 1024 });
    await page.waitForFunction(() => document.getElementById('btnCampo').getBoundingClientRect().height >= 44);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(arte, 'samuel-corredor-mapa-retrato.png') });
    await exigirTamanho(page, ['btnCampo', 'btnNormal', 'btnFacil', 'btnSair', 'btnTela']);
    await semRolagem(page);
    await page.locator('#btnCampo').tap();
    await page.waitForFunction(() => window.__corredor.olhar().tela === 'fase');
    await exigirTamanho(page, ['btnEsq', 'btnDir', 'btnPulo', 'btnPausa', 'btnTela']);
    await semRolagem(page);
    const fez = await jogar(page, page, 60000, 'retrato');
    expect(fez.pulo).toBe(true);
    expect(fez.inimigo).toBe(true);
    expect(fez.vitoria).toBe(true);
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  });

  it('Fácil não perde e o Normal tira um coração', async () => {
    const context = await contexto(1024, 768);
    const page = await context.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.addInitScript(() => localStorage.clear());
    await page.goto(jogoUrl, { waitUntil: 'domcontentloaded' });
    await esperarPronto(page, erros);
    await page.locator('#btnFacil').tap();
    expect(await page.locator('#btnFacil').getAttribute('aria-pressed')).toBe('true');
    await page.locator('#btnCampo').tap();
    await page.waitForFunction(() => window.__corredor.olhar().tela === 'fase');
    await page.evaluate(() => window.__corredor.soltarNoBuraco());
    await page.waitForTimeout(400);
    let o = await page.evaluate(() => window.__corredor.olhar());
    expect(o.modo).toBe('facil');
    expect(o.vidas).toBe(3);
    expect(o.y).toBeLessThan(240);
    expect(await page.evaluate(() => window.__corredor.porNoInimigo())).toBe(true);
    await page.waitForTimeout(350);
    o = await page.evaluate(() => window.__corredor.olhar());
    expect(o.vidas).toBe(3);
    await page.evaluate(() => window.__corredor.definirModo('normal'));
    expect(await page.evaluate(() => window.__corredor.porNoInimigo())).toBe(true);
    await page.waitForTimeout(350);
    o = await page.evaluate(() => window.__corredor.olhar());
    expect(o.vidas).toBeLessThan(3);
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  });

  async function sessentaNoIframe(largura, altura, prefixo) {
    const context = await contexto(largura, altura);
    const page = await context.newPage();
    const erros = [];
    ouvir(page, erros);
    await page.addInitScript(() => localStorage.clear());
    await page.goto(jogarUrl, { waitUntil: 'domcontentloaded' });
    const iframe = page.locator('iframe#jogo');
    await iframe.waitFor();
    expect(await iframe.getAttribute('src')).toContain('/jogo/samuel-corredor/');
    const frame = page.frames().find((f) => f.url().includes('/jogo/samuel-corredor/'));
    expect(frame).toBeTruthy();
    await esperarPronto(frame, erros);
    await frame.waitForFunction(() => document.getElementById('btnCampo').getBoundingClientRect().height >= 44);
    await frame.locator('#btnCampo').tap();
    await frame.waitForFunction(() => window.__corredor.olhar().tela === 'fase');
    await exigirTamanho(frame, ['btnEsq', 'btnDir', 'btnPulo', 'btnPausa', 'btnTela']);
    await semRolagem(frame);
    const fez = await jogar(frame, page, 60000, `iframe-${prefixo}`, false);
    expect(fez.pulo).toBe(true);
    expect(fez.vitoria).toBe(true);
    await page.screenshot({ path: path.join(arte, `samuel-corredor-iframe-${prefixo}.png`) });
    await frame.evaluate(() => {
      const jogo = document.getElementById('jogo');
      window.__telaPedido = '';
      Object.defineProperty(jogo, 'requestFullscreen', { configurable: true, value: undefined });
      Object.defineProperty(jogo, 'webkitRequestFullscreen', {
        configurable: true,
        value() { window.__telaPedido = this.id; return Promise.resolve(); },
      });
    });
    await frame.locator('#btnTela').tap();
    expect(await frame.evaluate(() => window.__telaPedido)).toBe('jogo');
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  }

  it('iframe 1024×768: 60 s de toque', async () => {
    await sessentaNoIframe(1024, 768, 'paisagem');
  });

  it('iframe 768×1024: 60 s de toque', async () => {
    await sessentaNoIframe(768, 1024, 'retrato');
  });

  it('prova a floresta, a caverna e o mapa com fase vencida', async () => {
    for (const [largura, altura, prefixo] of [[1024, 768, 'paisagem'], [768, 1024, 'retrato']]) {
      const context = await contexto(largura, altura);
      const page = await context.newPage();
      const erros = [];
      ouvir(page, erros);
      await page.addInitScript(() => localStorage.clear());
      await page.goto(jogoUrl, { waitUntil: 'domcontentloaded' });
      await esperarPronto(page, erros);
      await page.waitForFunction(() => {
        const r = document.getElementById('btnCampo').getBoundingClientRect();
        return r.width >= 44 && window.__corredor.olhar().tela === 'mapa';
      });
      await page.evaluate(() => window.__corredor.provar('mola'));
      await page.waitForFunction(() => {
        const o = window.__corredor.olhar();
        if (o.prova === 'mola' && o.mola === true && o.y < 155 && o.vy < 0) {
          window.__corredor.congelar();
          return true;
        }
        return false;
      });
      await page.screenshot({ path: path.join(arte, `samuel-corredor-floresta-mola-${prefixo}.png`) });
      await page.evaluate(() => window.__corredor.provar('plataforma'));
      await page.waitForFunction(() => Math.abs(window.__corredor.olhar().plataformaDelta) > 6);
      await page.screenshot({ path: path.join(arte, `samuel-corredor-floresta-plataforma-${prefixo}.png`) });
      await page.evaluate(() => window.__corredor.provar('bloco'));
      await page.waitForFunction(() => {
        const o = window.__corredor.olhar();
        if (o.prova === 'bloco' && o.blocoCaindo === true && o.blocoQueda > 16 && o.noBloco) {
          window.__corredor.congelar();
          return true;
        }
        return false;
      }, null, { timeout: 8000 });
      await page.screenshot({ path: path.join(arte, `samuel-corredor-caverna-bloco-${prefixo}.png`) });
      await page.evaluate(() => window.__corredor.provar('inimigos'));
      await page.waitForFunction(() => {
        const o = window.__corredor.olhar();
        const tipos = o.tipos || [];
        const perto = o.prova === 'inimigos' && o.x > 180 && o.x < 260 && tipos.includes('lesma') && tipos.includes('besouro');
        if (perto) window.__corredor.congelar();
        return perto;
      });
      await page.screenshot({ path: path.join(arte, `samuel-corredor-caverna-inimigos-${prefixo}.png`) });
      const salvo = JSON.stringify({
        modo: 'facil', vencidas: ['campo'], estrelasPorFase: { campo: 2 }, schemaVersion: 1,
      });
      await page.addInitScript((raw) => localStorage.setItem('samuel-corredor:v1', raw), salvo);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await esperarPronto(page, erros);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(arte, `samuel-corredor-mapa-progresso-${prefixo}.png`) });
      expect(erros, erros.join('\n')).toEqual([]);
      await context.close();
    }
  });
});

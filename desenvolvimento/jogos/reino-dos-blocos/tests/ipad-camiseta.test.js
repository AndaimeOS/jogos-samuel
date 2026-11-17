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
const porta = 8794;
const origem = `http://127.0.0.1:${porta}`;
const ipad = devices['iPad (gen 7)'];
const CINZA = [0x8d, 0x93, 0x97];

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
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
}

function ouvir(page, erros) {
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const texto = msg.text();
    if (/favicon|Failed to load resource/i.test(texto)) return;
    erros.push(texto);
  });
}

async function corDaCamiseta(alvo) {
  return alvo.evaluate(() => {
    const tela = document.querySelector('#selHeroi [data-heroi="samuel"] canvas');
    const px = tela.getContext('2d').getImageData(6, 14, 1, 1).data;
    const centro = tela.getContext('2d').getImageData(10, 14, 1, 1).data;
    const sola = tela.getContext('2d').getImageData(6, 24, 1, 1).data;
    const ler = (d) => [d[0], d[1], d[2]];
    return { roupa: ler(px), blusa: ler(centro), sola: ler(sola) };
  });
}

async function tocar(page, alvo, seletor) {
  await alvo.evaluate((sel) => {
    document.querySelector(sel).scrollIntoView({ block: 'center', inline: 'center' });
  }, seletor);
  await page.waitForTimeout(100);
  const local = await alvo.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  }, seletor);
  expect(local.w, seletor).toBeGreaterThan(8);
  expect(local.h, seletor).toBeGreaterThan(8);
  if (alvo === page) {
    await page.touchscreen.tap(local.x, local.y);
    return;
  }
  const caixa = await page.locator('#jogo').boundingBox();
  await page.touchscreen.tap(caixa.x + local.x, caixa.y + local.y);
}

async function samuelNaTela(page, prefixo) {
  const caixa = await page.evaluate(() => {
    const r = window.__reino;
    const j = r.jogador;
    const escala = window.innerHeight / 240;
    return {
      x: Math.max(0, (j.x - r.estado.camX - 8) * escala),
      y: Math.max(0, (j.y - 12) * escala),
      w: 36 * escala,
      h: 40 * escala,
      fase: r.estado.fase,
    };
  }).catch(() => null);
  await page.screenshot({ path: path.join(arte, `${prefixo}.png`) });
  if (!caixa || caixa.fase !== 'jogando') return;
  const vista = page.viewportSize();
  const clip = {
    x: Math.max(0, Math.min(vista.width - 20, caixa.x)),
    y: Math.max(0, Math.min(vista.height - 20, caixa.y)),
    width: Math.min(caixa.w, vista.width),
    height: Math.min(caixa.h, vista.height),
  };
  if (clip.x + clip.width > vista.width) clip.width = vista.width - clip.x;
  if (clip.y + clip.height > vista.height) clip.height = vista.height - clip.y;
  if (clip.width > 20 && clip.height > 20) {
    await page.screenshot({ path: path.join(arte, `${prefixo}-samuel.png`), clip });
  }
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true });
  servidor = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    env: { ...process.env, SAMUEL_CONFIG: '/tmp/samuel-config-teste-reino.php' },
    stdio: 'ignore',
  });
  await portaAberta();
  browser = await webkit.launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
  servidor?.kill();
});

describe('iPad WebKit geração 7, só toque', () => {
  it('o perfil é iPad com toque', () => {
    expect(ipad.defaultBrowserType).toBe('webkit');
    expect(ipad.hasTouch).toBe(true);
    expect(ipad.isMobile).toBe(true);
  });

  it('a camiseta do Samuel é o cinza #8d9397 na página e no /jogar/', async () => {
    for (const [largura, altura, onde] of [[1024, 768, 'paisagem'], [768, 1024, 'retrato']]) {
      const ctx = await contexto(largura, altura);
      const page = await ctx.newPage();
      const erros = [];
      ouvir(page, erros);
      await page.goto(`${origem}/jogo/reino-dos-blocos/index.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__reino && window.__reino.estado.fase === 'menu');
      const cor = await corDaCamiseta(page);
      expect(cor.roupa, 'roupa').toEqual(CINZA);
      expect(cor.blusa, 'blusa').toEqual(CINZA);
      expect(cor.sola, 'sola do tênis').toEqual([0xff, 0x7a, 0x2e]);
      await tocar(page, page, '#btnJogar');
      await page.waitForFunction(() => window.__reino.estado.fase === 'jogando');
      await page.waitForTimeout(400);
      await samuelNaTela(page, `reino-cinza-direto-${largura}x${altura}`);
      expect(erros, erros.join('\n')).toEqual([]);
      await ctx.close();

      const ctx2 = await contexto(largura, altura);
      const pagina = await ctx2.newPage();
      const erros2 = [];
      ouvir(pagina, erros2);
      await pagina.goto(`${origem}/jogar/?jogo=reino-dos-blocos`, { waitUntil: 'domcontentloaded' });
      await pagina.waitForSelector('#jogo');
      const frame = pagina.frames().find((f) => f.url().includes('/jogo/reino-dos-blocos/'));
      await frame.waitForFunction(() => window.__reino && window.__reino.estado.fase === 'menu');
      const corIframe = await corDaCamiseta(frame);
      expect(corIframe.roupa).toEqual(CINZA);
      expect(corIframe.blusa).toEqual(CINZA);
      await pagina.locator('#moldura').scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(200);
      await tocar(pagina, frame, '#btnJogar');
      await frame.waitForFunction(() => window.__reino.estado.fase === 'jogando');
      await pagina.waitForTimeout(400);
      await pagina.screenshot({ path: path.join(arte, `reino-cinza-jogar-${largura}x${altura}.png`) });
      expect(erros2, erros2.join('\n')).toEqual([]);
      expect(onde).toMatch(/paisagem|retrato/);
      await ctx2.close();
    }
  });

  it('a biblioteca e a home mostram os selos, e em breve não abre', async () => {
    for (const [largura, altura] of [[1024, 768], [768, 1024]]) {
      const ctx = await contexto(largura, altura);
      const page = await ctx.newPage();
      const erros = [];
      ouvir(page, erros);
      await page.goto(`${origem}/jogos/`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-card="ilha-da-vida"]');

      const selos = await page.evaluate(() => {
        const ler = (slug) => {
          const card = document.querySelector(`[data-card="${slug}"]`);
          const texto = [...card.querySelectorAll('.selo-jogo')].map((n) => n.textContent.trim());
          const links = [...card.querySelectorAll('a')].map((a) => a.getAttribute('href'));
          return { status: card.dataset.status, texto, links };
        };
        return {
          ilha: ler('ilha-da-vida'),
          turma: ler('a-turma-dos-pets'),
          mestre: ler('mestre-do-cubo'),
        };
      });
      expect(selos.ilha.status).toBe('so-computador');
      expect(selos.ilha.texto).toContain('Só no computador');
      expect(selos.ilha.links).toContain('/jogar/?jogo=ilha-da-vida');
      expect(selos.turma.status).toBe('em-breve');
      expect(selos.turma.texto).toContain('Em breve');
      expect(selos.turma.links).toEqual([]);
      expect(selos.mestre.status).toBe('em-breve');
      expect(selos.mestre.texto).toContain('Em breve');
      expect(selos.mestre.links).toEqual([]);

      const antes = page.url();
      await tocar(page, page, '[data-card="mestre-do-cubo"] .selo-jogo');
      await page.waitForTimeout(200);
      expect(page.url()).toBe(antes);
      await tocar(page, page, '[data-card="a-turma-dos-pets"] h3');
      await page.waitForTimeout(200);
      expect(page.url()).toBe(antes);

      for (const slug of ['ilha-da-vida', 'a-turma-dos-pets', 'mestre-do-cubo']) {
        await page.locator(`[data-card="${slug}"]`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(arte, `biblioteca-${slug}-${largura}x${altura}.png`) });
      }
      await page.screenshot({ path: path.join(arte, `biblioteca-selos-${largura}x${altura}.png`), fullPage: true });

      const rolagem = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(rolagem.sw).toBeLessThanOrEqual(rolagem.cw + 1);

      await page.goto(`${origem}/`, { waitUntil: 'domcontentloaded' });
      await page.locator('#mundos').scrollIntoViewIfNeeded();
      const home = await page.evaluate(() => {
        const card = document.querySelector('[data-card="mestre-do-cubo"]');
        if (!card) return null;
        return {
          status: card.dataset.status,
          texto: [...card.querySelectorAll('.selo-jogo')].map((n) => n.textContent.trim()),
          links: [...card.querySelectorAll('a')].map((a) => a.getAttribute('href')),
        };
      });
      expect(home.status).toBe('em-breve');
      expect(home.texto).toContain('Em breve');
      expect(home.links).toEqual([]);
      await page.screenshot({ path: path.join(arte, `home-selos-${largura}x${altura}.png`) });
      expect(erros, erros.join('\n')).toEqual([]);
      await ctx.close();
    }

    const ctx = await contexto(1024, 768);
    const page = await ctx.newPage();
    expect((await page.request.get(`${origem}/jogar/?jogo=mestre-do-cubo`)).status()).toBe(404);
    expect((await page.request.get(`${origem}/jogar/?jogo=a-turma-dos-pets`)).status()).toBe(404);
    expect((await page.request.get(`${origem}/jogo/mestre-do-cubo/index.html`)).status()).toBe(404);
    expect((await page.request.get(`${origem}/jogar/?jogo=ilha-da-vida`)).status()).toBe(200);
    const biblioteca = await (await page.request.get(`${origem}/jogos/`)).text();
    expect(biblioteca).not.toContain('data-card="aventura-pula-pula"');
    expect(biblioteca).not.toContain('data-card="bichos-contra-a-gosma"');
    expect(biblioteca).not.toContain('data-card="lab"');
    await ctx.close();
  });
});

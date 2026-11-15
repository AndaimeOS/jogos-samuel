import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { arrastar, habilitarArrasteWebKit } from './toque-webkit.js';

habilitarArrasteWebKit();

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../../..');
const porta = 8791;
const base = `http://127.0.0.1:${porta}`;

let php;
let webkit;
let devices;

async function portaAberta() {
  for (let i = 0; i < 50; i++) {
    const ok = await new Promise((resolve) => {
      const s = createConnection({ port: porta, host: '127.0.0.1' }, () => {
        s.end();
        resolve(true);
      });
      s.on('error', () => resolve(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('o portal local não subiu');
}

function jogosProntos() {
  const catalogo = JSON.parse(readFileSync(path.join(raiz, '_app/jogos.json'), 'utf8'));
  return catalogo.games.filter((g) => g.status === 'pronto').map((g) => g.slug);
}

async function contexto(browser, largura, altura) {
  const perfil = devices['iPad (gen 7)'];
  return browser.newContext({
    ...perfil,
    userAgent: perfil.userAgent,
    viewport: { width: largura, height: altura },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
}

function ouvir(page) {
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text());
  });
  return erros;
}

async function tocarJogar(page, frame) {
  const alvo = frame ?? page.mainFrame();
  const local = await alvo.evaluate(() => {
    const r = document.getElementById('bJogar').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, top: r.top, bottom: r.bottom, h: r.height };
  });
  if (frame) {
    const caixa = await page.locator('#jogo').boundingBox();
    await page.touchscreen.tap(caixa.x + local.x, caixa.y + local.y);
  } else {
    await page.touchscreen.tap(local.x, local.y);
  }
  return local;
}

beforeAll(async () => {
  php = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    env: { ...process.env, SAMUEL_CONFIG: '/tmp/samuel-config-teste-pebolim.php' },
    stdio: 'ignore',
  });
  await portaAberta();
  ({ webkit, devices } = await import('playwright'));
  // o binário fica em cache; se faltar, o launch abaixo explica.
}, 30000);

afterAll(async () => {
  php?.kill();
});

describe('Pebolim no WebKit, iPad, só com toque', () => {
  async function partida(largura, altura, caminho) {
    const browser = await webkit.launch();
    const ctx = await contexto(browser, largura, altura);
    const page = await ctx.newPage();
    const erros = ouvir(page);
    await page.goto(base + caminho, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const frame = page.frames().find((f) => f !== page.mainFrame() && /\/jogo\/pebolim\//.test(f.url()));
    if (frame) {
      frame.on('pageerror', (e) => erros.push('iframe: ' + e.message));
      frame.on('console', (m) => {
        if (m.type() === 'error') erros.push('iframe: ' + m.text());
      });
    }
    const alvo = frame ?? page.mainFrame();
    await alvo.waitForSelector('#bJogar');
    return { browser, ctx, page, frame, erros, alvo };
  }

  async function fechar(sessao) {
    await sessao.ctx.close();
    await sessao.browser.close();
  }

  it('no player deitado 1024×768 o Jogar cabe na tela, o toque move as hastes e a bola sai', async () => {
    const s = await partida(1024, 768, '/jogar/?jogo=pebolim');
    try {
      const caixa = await s.page.locator('#jogo').boundingBox();
      const botao = await s.frame.locator('#bJogar').boundingBox();
      expect(botao.y).toBeGreaterThanOrEqual(0);
      expect(botao.y + botao.height).toBeLessThanOrEqual(768);
      expect(caixa.height).toBeGreaterThan(650);

      await tocarJogar(s.page, s.frame);
      await s.page.waitForTimeout(400);
      const saque = await s.frame.evaluate(() => {
        const p = window.__pebolim.estado;
        return { fase: p.fase, v: Math.hypot(p.bola.vx, p.bola.vy) };
      });
      expect(saque.fase).toBe('jogando');
      expect(saque.v).toBeGreaterThan(10);

      const y0 = caixa.y + caixa.height * 0.42;
      const y1 = caixa.y + caixa.height * 0.68;
      const x = caixa.x + caixa.width * 0.22;
      await arrastar(s.page, x, y0, x, y1);
      await s.page.waitForTimeout(200);
      const deslize = await s.frame.evaluate(() => window.__pebolim.estado.deslize.vermelho);
      expect(deslize).toBeGreaterThan(20);

      const tela = s.page.locator('[data-tela-cheia]');
      await tela.scrollIntoViewIfNeeded();
      const botaoTela = await tela.boundingBox();
      expect(botaoTela.y).toBeGreaterThanOrEqual(0);
      await s.page.touchscreen.tap(botaoTela.x + botaoTela.width / 2, botaoTela.y + botaoTela.height / 2);
      expect(await s.page.locator('#moldura').getAttribute('class')).toMatch(/player-cheia/);
      expect(await s.frame.evaluate(() => window.__pebolim.estado.fase)).toBe('jogando');
      const sair = await tela.boundingBox();
      await s.page.touchscreen.tap(sair.x + sair.width / 2, sair.y + sair.height / 2);
      expect(await s.page.locator('#moldura').getAttribute('class') || '').not.toMatch(/player-cheia/);
      expect(s.erros, s.erros.join('\n')).toEqual([]);
    } finally {
      await fechar(s);
    }
  }, 60000);

  it('retrato 768×1024 e a página direta também jogam só com toque', async () => {
    for (const [w, h, caminho] of [
      [768, 1024, '/jogar/?jogo=pebolim'],
      [1024, 768, '/jogo/pebolim/index.html'],
      [768, 1024, '/jogo/pebolim/index.html'],
    ]) {
      const s = await partida(w, h, caminho);
      try {
        const botao = await (s.frame ? s.frame.locator('#bJogar') : s.page.locator('#bJogar')).boundingBox();
        expect(botao.y, caminho).toBeGreaterThanOrEqual(0);
        expect(botao.y + botao.height, caminho).toBeLessThanOrEqual(h);
        await tocarJogar(s.page, s.frame);
        await s.page.waitForTimeout(400);
        const saque = await s.alvo.evaluate(() => {
          const p = window.__pebolim.estado;
          return { fase: p.fase, v: Math.hypot(p.bola.vx, p.bola.vy) };
        });
        expect(saque.fase, caminho).toBe('jogando');
        expect(saque.v, caminho).toBeGreaterThan(10);
        const origem = s.frame ? await s.page.locator('#jogo').boundingBox() : { x: 0, y: 0, width: w, height: h };
        const x = origem.x + origem.width * 0.22;
        await arrastar(s.page, x, origem.y + origem.height * 0.4, x, origem.y + origem.height * 0.65);
        await s.page.waitForTimeout(200);
        const deslize = await s.alvo.evaluate(() => window.__pebolim.estado.deslize.vermelho);
        expect(deslize, caminho).toBeGreaterThan(20);
        expect(s.erros, `${caminho}\n${s.erros.join('\n')}`).toEqual([]);
      } finally {
        await fechar(s);
      }
    }
  }, 90000);
});

const ARTE = '/opt/cursor/artifacts';

async function pararBolaNoCanto(alvo) {
  await alvo.evaluate(() => {
    const p = window.__pebolim.estado;
    p.bola.x = 500;
    p.bola.y = 90;
    p.bola.vx = 0;
    p.bola.vy = 0;
    p.trava.x = p.bola.x;
    p.trava.y = p.bola.y;
    p.trava.acumulado = 2.4;
    p.trava.janela = 0.45;
    p.aviso = '';
    p.avisoTempo = 0;
  });
  await alvo.waitForFunction(() => document.getElementById('aviso').textContent.includes('voltou para o meio'));
  await alvo.evaluate(() => { window.__pebolim.estado.avisoTempo = 8; });
}

async function medidaFaixa(alvo) {
  return alvo.evaluate(() => {
    const aviso = document.getElementById('aviso');
    const r = aviso.getBoundingClientRect();
    const mesaEl = document.getElementById('mesa');
    const mesa = mesaEl.getBoundingClientRect();
    const aspect = mesaEl.width / mesaEl.height;
    const box = mesa.width / Math.max(1, mesa.height);
    const larguraMesa = box > aspect ? mesa.height * aspect : mesa.width;
    const esquerda = mesa.left + (mesa.width - larguraMesa) / 2;
    return {
      texto: aviso.textContent,
      escondida: aviso.hidden,
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      vw: window.innerWidth,
      vh: window.innerHeight,
      esquerda,
      direita: esquerda + larguraMesa,
      scrollW: aviso.scrollWidth,
      clientW: aviso.clientWidth,
      fonte: parseFloat(getComputedStyle(aviso).fontSize),
    };
  });
}

async function hastesSemRotulo(alvo) {
  return alvo.evaluate(() => {
    const canvas = document.getElementById('mesa');
    const ctx = canvas.getContext('2d');
    const claros = (x, y, w, h) => {
      const dados = ctx.getImageData(x, y, w, h).data;
      let n = 0;
      for (let i = 0; i < dados.length; i += 4) {
        if (dados[i] > 210 && dados[i + 1] > 200 && dados[i + 2] > 180) n++;
      }
      return n;
    };
    return {
      vermelho: claros(168, 54, 60, 12),
      azul: claros(828, 54, 22, 12) + claros(866, 54, 18, 12),
      voce: claros(190, 72, 36, 16),
      computador: claros(810, 72, 36, 16) + claros(868, 72, 36, 16),
      haste: claros(233, 80, 6, 120),
    };
  });
}

describe('faixa da bola e rótulos das hastes', () => {
  it('cabe na mesa nos dois sentidos, direto e no iframe, e as hastes ficam sem VERMELHO/AZUL', async () => {
    mkdirSync(ARTE, { recursive: true });
    const browser = await webkit.launch();
    const casos = [
      [1024, 768, '/jogo/pebolim/index.html', 'pebolim-faixa-ipad-1024x768.png'],
      [768, 1024, '/jogo/pebolim/index.html', 'pebolim-faixa-ipad-768x1024.png'],
      [1024, 768, '/jogar/?jogo=pebolim', 'pebolim-faixa-ipad-iframe-1024x768.png'],
      [768, 1024, '/jogar/?jogo=pebolim', 'pebolim-faixa-ipad-iframe-768x1024.png'],
    ];
    try {
      for (const [w, h, caminho, arquivo] of casos) {
        const ctx = await contexto(browser, w, h);
        const page = await ctx.newPage();
        const erros = ouvir(page);
        await page.goto(base + caminho, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(400);
        const frame = page.frames().find((f) => f !== page.mainFrame() && /\/jogo\/pebolim\//.test(f.url()));
        if (frame) {
          frame.on('pageerror', (e) => erros.push('iframe: ' + e.message));
          frame.on('console', (m) => { if (m.type() === 'error') erros.push('iframe: ' + m.text()); });
        }
        const alvo = frame ?? page.mainFrame();
        await alvo.waitForSelector('#bJogar');
        await tocarJogar(page, frame);
        await page.waitForTimeout(300);
        const fase = await alvo.evaluate(() => window.__pebolim.estado.fase);
        expect(fase, caminho).toBe('jogando');
        await pararBolaNoCanto(alvo);
        const faixa = await medidaFaixa(alvo);
        expect(faixa.texto, caminho).toBe('A bola voltou para o meio!');
        expect(faixa.escondida, caminho).toBe(false);
        expect(faixa.left, caminho).toBeGreaterThanOrEqual(Math.max(0, faixa.esquerda) - 2);
        expect(faixa.right, caminho).toBeLessThanOrEqual(Math.min(faixa.vw, faixa.direita) + 2);
        expect(faixa.top, caminho).toBeGreaterThanOrEqual(-2);
        expect(faixa.bottom, caminho).toBeLessThanOrEqual(faixa.vh + 2);
        expect(faixa.scrollW, caminho).toBeLessThanOrEqual(faixa.clientW + 2);
        expect(faixa.fonte, caminho).toBeLessThanOrEqual(46);
        const pixels = await hastesSemRotulo(alvo);
        expect(pixels.vermelho, caminho).toBeLessThan(12);
        expect(pixels.azul, caminho).toBeLessThan(12);
        expect(pixels.voce, caminho).toBeLessThan(12);
        expect(pixels.computador, caminho).toBeLessThan(12);
        expect(pixels.haste, caminho).toBeGreaterThan(40);
        const destino = `${ARTE}/${arquivo}`;
        if (frame) await page.locator('#jogo').screenshot({ path: destino });
        else await page.screenshot({ path: destino });
        expect(erros, `${caminho}\n${erros.join('\n')}`).toEqual([]);
        await ctx.close();
      }
    } finally {
      await browser.close();
    }
  }, 120000);
});

describe('smoke WebKit/iPad dos jogos prontos', () => {
  it('cada jogo pronto abre no player sem erro de script', async () => {
    const browser = await webkit.launch();
    const ctx = await contexto(browser, 1024, 768);
    const falhas = [];
    try {
      for (const slug of jogosProntos()) {
        const page = await ctx.newPage();
        const erros = [];
        page.on('pageerror', (e) => erros.push(e.message));
        page.on('frameattached', (frame) => {
          frame.on('pageerror', (e) => erros.push(e.message));
        });
        const resposta = await page.goto(`${base}/jogar/?jogo=${slug}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1500);
        const frame = page.frames().find((f) => f.url().includes(`/jogo/${slug}/`));
        if (resposta?.status() !== 200 || !frame || erros.length) {
          falhas.push(`${slug}: http ${resposta?.status()} frame ${frame ? 'sim' : 'não'} ${erros.join(' | ')}`);
        }
        await page.close();
      }
    } finally {
      await ctx.close();
      await browser.close();
    }
    expect(falhas, falhas.join('\n')).toEqual([]);
  }, 180000);
});

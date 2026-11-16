import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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

async function gravarMedida(extra) {
  let atual = {};
  try { atual = JSON.parse(await readFile(path.join(arte, 'planeta-v04-medidas.json'), 'utf8')); } catch { /* primeiro registro */ }
  await writeFile(path.join(arte, 'planeta-v04-medidas.json'), `${JSON.stringify({ ...atual, ...extra }, null, 2)}\n`);
}

async function medirFpsLuta(alvo) {
  return alvo.evaluate(async () => {
    const p = window.__planeta;
    const e = p.estado;
    e.pausa = false;
    e.cartas = [];
    e.niveisPendentes = 0;
    e.chefe = null;
    e.projeteis = [];
    e.zonas = [];
    e.enchente = null;
    e.tempo = 60;
    e.inimigos = [];
    const tipos = p.CONFIG.eras.pedra.horda;
    for (let i = 0; i < 12; i++) {
      const tipo = tipos[i % tipos.length];
      const def = p.CONFIG.inimigos[tipo];
      const ang = (i / 12) * Math.PI * 2;
      e.inimigos.push({
        id: e.seq++, tipo, sprite: def.sprite,
        x: e.x + Math.cos(ang) * 72,
        y: e.y + Math.sin(ang) * 48,
        hp: def.hp, hpMax: def.hp, raio: def.raio,
        velocidade: def.velocidade, xp: def.xp, dano: def.dano,
        comportamento: 'chase', direcao: 0, andando: true,
        contatoEm: 0, lascaEm: 0, auraEm: 0, tiroEm: 2,
      });
    }
    p.definirEixo(1, 0);
    p.travar(false);
    p.desenhar();
    const q0 = p.quadros();
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, 2000));
    return {
      fps: Number(((p.quadros() - q0) / ((performance.now() - t0) / 1000)).toFixed(1)),
      inimigos: e.inimigos.length,
      tempo: Number(e.tempo.toFixed(1)),
    };
  });
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

    const medidas = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        cargaMs: nav ? Math.round(nav.responseEnd) : null,
        geracaoMs: Math.round(window.__planeta.estado.geracaoMs),
        travessiaSeg: Number(window.__planeta.tempoDeTravessia().toFixed(1)),
        mundoPx: window.__planeta.estado.colunas * window.__planeta.CONFIG.bloco,
        velocidade: window.__planeta.CONFIG.velocidade,
      };
    });
    expect(medidas.mundoPx).toBe(4096);
    expect(medidas.travessiaSeg).toBeGreaterThanOrEqual(25);
    expect(medidas.geracaoMs).toBeLessThan(200);
    const tFps = await page.evaluate(() => ({ q: window.__planeta.quadros(), t: performance.now() }));
    await page.waitForTimeout(2000);
    const tFps2 = await page.evaluate(() => ({ q: window.__planeta.quadros(), t: performance.now() }));
    medidas.fpsAndando = Number(((tFps2.q - tFps.q) / ((tFps2.t - tFps.t) / 1000)).toFixed(1));
    expect(medidas.fpsAndando).toBeGreaterThan(45);
    await gravarMedida(medidas);

    const mini = await page.locator('#minimapa').boundingBox();
    const joy = await page.locator('#joystick').boundingBox();
    const pausa = await page.locator('#btnPausa').boundingBox();
    const telaCheia = await page.locator('#btnTela').boundingBox();
    const encosta = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    expect(encosta(mini, joy)).toBe(false);
    expect(encosta(mini, pausa)).toBe(false);
    expect(encosta(mini, telaCheia)).toBe(false);

    async function area(nome, arquivo) {
      await page.evaluate((chave) => {
        const e = window.__planeta.estado;
        const p = e.amostras[chave];
        e.x = p.x;
        e.y = p.y;
        e.inimigos = [];
        e.chefe = null;
        e.projeteis = [];
        e.zonas = [];
        e.enchente = null;
        e.tempo = 20;
        window.__planeta.travar(true);
        window.__planeta.desenhar();
      }, nome);
      await page.screenshot({ path: path.join(arte, arquivo) });
    }
    await area('praia', 'planeta-v04-praia.png');
    await area('mato', 'planeta-v04-mato.png');
    await page.evaluate(() => {
      const e = window.__planeta.estado;
      e.x = e.inicio.x;
      e.y = e.inicio.y;
      e.inimigos = [];
      e.chefe = null;
      e.projeteis = [];
      e.zonas = [];
      e.tempo = 8;
      window.__planeta.travar(true);
      window.__planeta.desenhar();
    });
    await page.screenshot({ path: path.join(arte, 'planeta-v04-paisagem.png') });
    await area('vulcao', 'planeta-v04-vulcao.png');
    const naBrasa = await page.evaluate(() => {
      const e = window.__planeta.estado;
      const bloco = window.__planeta.CONFIG.bloco;
      const c = Math.floor(e.x / bloco);
      const l = Math.floor(e.y / bloco);
      return e.terreno[l * e.colunas + c];
    });
    expect(naBrasa).not.toBe(7);

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.x = e.inicio.x;
      e.y = e.inicio.y;
      e.inimigos = [];
      e.chefe = null;
      e.projeteis = [];
      e.zonas = [];
      e.pausa = false;
      e.cartas = [];
      p.travar(false);
      const L = e.colunas;
      const bloco = p.CONFIG.bloco;
      const anda = (c, l) => {
        if (c < 0 || l < 0 || c >= L || l >= L) return false;
        const t = e.terreno[l * L + c];
        return t !== 0 && t !== 7 && !e.recursos[l * L + c];
      };
      const meta = Math.max(8, e.inicio.lin - 24);
      const visto = new Uint8Array(L * L);
      const fila = [{ c: e.inicio.col, l: e.inicio.lin }];
      visto[e.inicio.lin * L + e.inicio.col] = 1;
      const veio = new Map();
      let fim = null;
      for (let k = 0; k < fila.length && !fim; k++) {
        const cur = fila[k];
        if (cur.l <= meta) { fim = cur; break; }
        for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = cur.c + dc;
          const nl = cur.l + dl;
          const id = nl * L + nc;
          if (!anda(nc, nl) || visto[id]) continue;
          visto[id] = 1;
          veio.set(id, cur);
          fila.push({ c: nc, l: nl });
        }
      }
      const rota = [];
      let cur = fim;
      while (cur) {
        rota.push(cur);
        cur = veio.get(cur.l * L + cur.c);
      }
      rota.reverse();
      for (const passo of rota) {
        const ax = (passo.c + 0.5) * bloco;
        const ay = (passo.l + 0.5) * bloco;
        let guard = 0;
        while (Math.hypot(e.x - ax, e.y - ay) > 8 && guard < 6) {
          if (e.pausa) p.escolherCarta(e, 0);
          p.definirEixo(ax - e.x, ay - e.y);
          p.simular(0.16);
          guard += 1;
        }
      }
      p.definirEixo(0, 0);
      e.inimigos = [];
      e.chefe = null;
      e.projeteis = [];
      e.zonas = [];
      e.pausa = false;
      p.travar(true);
      p.desenhar();
      window.__longe = Math.round(Math.hypot(e.x - e.inicio.x, e.y - e.inicio.y));
    });
    expect(await page.evaluate(() => window.__longe)).toBeGreaterThan(400);
    await page.screenshot({ path: path.join(arte, 'planeta-v04-longe.png') });
    await page.locator('#minimapa').screenshot({ path: path.join(arte, 'planeta-v04-minimapa-longe.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.tempo = 60;
      e.inimigos = [];
      e.chefe = null;
      e.projeteis = [];
      e.zonas = [];
      e.pausa = false;
      const tipos = p.CONFIG.eras.pedra.horda;
      for (let i = 0; i < 12; i++) {
        const tipo = tipos[i % tipos.length];
        const def = p.CONFIG.inimigos[tipo];
        const ang = (i / 12) * Math.PI * 2;
        e.inimigos.push({
          id: e.seq++, tipo, sprite: def.sprite,
          x: e.x + Math.cos(ang) * 78,
          y: e.y + Math.sin(ang) * 52,
          hp: def.hp, hpMax: def.hp, raio: def.raio,
          velocidade: def.velocidade, xp: def.xp, dano: def.dano,
          comportamento: 'chase', direcao: 2, andando: true,
          contatoEm: 1, lascaEm: 0, auraEm: 0, tiroEm: 2,
        });
      }
      p.travar(true);
      p.desenhar();
    });
    expect(await page.locator('#relogio').textContent()).toBe('01:00');
    expect(await page.evaluate(() => window.__planeta.estado.inimigos.length)).toBe(12);
    await page.screenshot({ path: path.join(arte, 'planeta-v04-horda.png') });
    const luta = await medirFpsLuta(page);
    expect(luta.inimigos).toBeGreaterThan(4);
    expect(luta.fps).toBeGreaterThan(45);
    await gravarMedida({ fpsLutaPaisagem: luta.fps, inimigosLuta: luta.inimigos, tempoLuta: luta.tempo });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.inimigos = [];
      e.projeteis = [];
      e.chefe = null;
      e.vitoria = false;
      e.fogueira = true;
      e.tempo = 0.8 * p.CONFIG.duracaoDia;
      p.travar(true);
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.escuridao(window.__planeta.estado))).toBeGreaterThan(0.7);
    await page.screenshot({ path: path.join(arte, 'planeta-v04-noite.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.tempo = 40;
      e.vitoria = false;
      e.fogueira = false;
      e.inimigos = [];
      e.projeteis = [];
      e.zonas = [];
      const def = p.CONFIG.inimigos['urso-da-caverna'];
      e.chefe = {
        id: e.seq++, tipo: 'urso-da-caverna', sprite: def.sprite,
        x: e.x + 64, y: e.y - 8,
        hp: def.hp * 0.4, hpMax: def.hp, raio: def.raio,
        velocidade: def.velocidade, xp: def.xp, dano: def.dano,
        comportamento: 'chefe', direcao: 6,
        modo: 'atordoado', telegrafo: 1.2, fase: 2,
        contatoEm: 1, lascaEm: 0, auraEm: 0,
      };
      e.zonas.push({ x: e.chefe.x, y: e.chefe.y, raio: def.raio + 14, resta: 0.5, dano: 0, sprite: 'telegraph' });
      p.travar(true);
      p.desenhar();
    });
    await page.screenshot({ path: path.join(arte, 'planeta-v04-urso.png') });

    await page.evaluate(() => {
      const p = window.__planeta;
      const e = p.estado;
      e.zonas = [];
      e.inimigos = [];
      const def = p.CONFIG.inimigos['sentinela-de-bronze'];
      e.chefe = {
        id: e.seq++, tipo: 'sentinela-de-bronze', sprite: def.sprite,
        x: e.x + 96, y: e.y - 20,
        hp: def.hp, hpMax: def.hp, raio: def.raio,
        velocidade: def.velocidade, xp: def.xp, dano: def.dano,
        comportamento: 'chefe', direcao: 6,
        modo: 'anda', fase: 1, ataqueEm: 0.01, casa: null,
        contatoEm: 1, lascaEm: 0, auraEm: 0,
      };
      e.projeteis = [];
      p.travar(false);
      p.simular(0.12);
      p.travar(true);
      p.desenhar();
    });
    expect(await page.evaluate(() => window.__planeta.estado.projeteis.filter((t) => t.sprite === 'faisca' && !t.aliado).length)).toBeGreaterThan(0);
    await page.screenshot({ path: path.join(arte, 'planeta-v04-sentinela.png') });
    await page.evaluate(() => window.__planeta.travar(false));

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
      e.tempo = 0.8 * p.CONFIG.duracaoDia;
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
    await page.screenshot({ path: path.join(arte, 'planeta-v04-retrato.png') });
    await page.screenshot({ path: path.join(arte, 'planeta-v2-retrato.png') });
    const lutaRetrato = await medirFpsLuta(page);
    expect(lutaRetrato.inimigos).toBeGreaterThan(4);
    expect(lutaRetrato.fps).toBeGreaterThan(45);
    await page.screenshot({ path: path.join(arte, 'planeta-v04-horda-retrato.png') });
    await gravarMedida({ fpsLutaRetrato: lutaRetrato.fps, inimigosRetrato: lutaRetrato.inimigos });
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
    const lutaIframe = await medirFpsLuta(frame);
    expect(lutaIframe.inimigos).toBeGreaterThan(4);
    expect(lutaIframe.fps).toBeGreaterThan(45);
    await frame.evaluate(() => window.__planeta.desenhar());
    await page.screenshot({ path: path.join(arte, 'planeta-v04-horda-iframe.png') });
    await gravarMedida({ fpsLutaIframe: lutaIframe.fps, inimigosIframe: lutaIframe.inimigos });
    await fallbackTela(frame);
    await page.screenshot({ path: path.join(arte, 'planeta-v04-iframe.png') });
    await page.screenshot({ path: path.join(arte, 'planeta-v2-iframe.png') });
    expect(erros, erros.join('\n')).toEqual([]);
    await context.close();
  });
});

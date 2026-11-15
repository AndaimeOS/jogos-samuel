/* Geometria de folha reescrita a partir de frameIndex e do pé em
   desenvolvimento/jogos/pokemon-survivors/src/render/sprites.ts
   (Copyright (c) 2026 Pedro Barretto, licença MIT).
   A imagem não é de Pokémon: ou é pixel desenhado em código, ou o atlas.webp
   gerado dos PNG mestres. Sem dex, shiny, Hurt, Fly, grito ou retrato. */

import manifesto from '../arte/manifesto.json' with { type: 'json' };
import { bufferParaCanvas } from './pixelart.js';
import { quadroCodigo } from './placeholders.js';

export { manifesto };

const ESPELHO = { 5: 3, 6: 2, 7: 1 };
const MAPA4 = [0, 1, 1, 2, 2, 1, 1, 0];
const ESPELHA4 = [false, false, false, false, false, true, true, true];

function celulaDir(s, direcao) {
  if (s.linhas <= 1) return { src: 0, espelhar: false };
  const dir = ((direcao % 8) + 8) % 8;
  if (s.origem === 'atlas') return { src: dir % s.linhas, espelhar: false };
  if (s.linhas === 8 && s.espelhoDaDireita && ESPELHO[dir] !== undefined) return { src: ESPELHO[dir], espelhar: true };
  if (s.linhas === 4 && s.espelhoDaDireita) return { src: MAPA4[dir], espelhar: ESPELHA4[dir] };
  return { src: dir % s.linhas, espelhar: false };
}
const cache = new Map();
let atlas = null;
let atlasOk = false;
const aoPronto = [];

export const indiceQuadro = (duracoes, segundos, loop) => {
  const total = duracoes.reduce((a, b) => a + b, 0) || 1;
  let tick = Math.floor(segundos * 60);
  tick = loop ? ((tick % total) + total) % total : Math.min(Math.max(0, tick), total - 1);
  for (let i = 0; i < duracoes.length; i++) {
    tick -= duracoes[i];
    if (tick < 0) return i;
  }
  return duracoes.length - 1;
};

export const ligarAtlas = () => {
  if (!Object.values(manifesto.sprites).some((s) => s.origem === 'atlas')) return;
  if (typeof Image === 'undefined') return;
  atlas = new Image();
  atlas.src = new URL('../arte/atlas.webp', import.meta.url).href;
  atlas.onload = () => {
    atlasOk = atlas.naturalWidth > 0;
    cache.clear();
    for (const fn of aoPronto) fn();
  };
  atlas.onerror = () => { atlasOk = false; };
};

export const quandoAtlas = (fn) => aoPronto.push(fn);

const usarAtlas = (s) => s.origem === 'atlas' && atlasOk && atlas;

const canvasCodigo = (id, coluna, src, espelhar) => {
  const chave = `${id}|${coluna}|${src}|${espelhar ? 1 : 0}`;
  let c = cache.get(chave);
  if (c) return c;
  c = bufferParaCanvas(quadroCodigo(id, coluna, src));
  if (espelhar) {
    const flip = document.createElement('canvas');
    flip.width = c.width;
    flip.height = c.height;
    const g = flip.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.translate(flip.width, 0);
    g.scale(-1, 1);
    g.drawImage(c, 0, 0);
    c = flip;
  }
  cache.set(chave, c);
  return c;
};

/**
 * Desenha o sprite com o pé no centro da base, em (x, y). `direcao` é o dir8
 * quando a folha tem 8 linhas. `coluna` força um quadro (o canteiro, o farol).
 */
export const desenharSprite = (ctx, id, segundos, x, y, opts = {}) => {
  const s = manifesto.sprites[id];
  if (!s) return;
  const coluna = opts.coluna != null
    ? ((opts.coluna % s.colunas) + s.colunas) % s.colunas
    : indiceQuadro(s.duracoes, segundos, !!s.loop);
  const { src, espelhar } = celulaDir(s, opts.direcao ?? 0);
  const dx = Math.round(x - s.frameW / 2);
  const dy = Math.round(y - s.frameH);
  const alfa = opts.alfa ?? 1;
  if (alfa !== 1) ctx.globalAlpha = alfa;
  if (usarAtlas(s)) {
    ctx.drawImage(atlas, s.x + coluna * s.frameW, s.y + src * s.frameH, s.frameW, s.frameH, dx, dy, s.frameW, s.frameH);
  } else {
    ctx.drawImage(canvasCodigo(id, coluna, src, espelhar), dx, dy);
  }
  if (alfa !== 1) ctx.globalAlpha = 1;
};

export const larguraSprite = (id) => manifesto.sprites[id]?.frameW ?? 16;
export const alturaSprite = (id) => manifesto.sprites[id]?.frameH ?? 16;

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

const MAPA4_ATLAS = [0, 1, 1, 2, 2, 3, 3, 0];

function celulaDir(s, direcao) {
  if (s.linhas <= 1) return { src: 0, espelhar: false };
  const dir = ((direcao % 8) + 8) % 8;
  if (s.origem === 'atlas') {
    if (s.linhas === 4 && s.espelhoDaDireita) return { src: MAPA4_ATLAS[dir], espelhar: false };
    return { src: dir % s.linhas, espelhar: false };
  }
  if (s.linhas === 8 && s.espelhoDaDireita && ESPELHO[dir] !== undefined) return { src: ESPELHO[dir], espelhar: true };
  if (s.linhas === 4 && s.espelhoDaDireita) return { src: MAPA4[dir], espelhar: ESPELHA4[dir] };
  return { src: dir % s.linhas, espelhar: false };
}

function pivoDe(s) {
  const px = Array.isArray(s.pivo) ? s.pivo[0] : s.frameW / 2;
  const py = Array.isArray(s.pivo) ? s.pivo[1] : (s.pe === 'centro' ? (s.frameH - 1) / 2 : s.frameH - 1);
  return { px, py };
}
const cache = new Map();
let atlas = null;
let atlasOk = false;
const aoPronto = [];

export const indiceQuadro = (duracoes, segundos, loop) => {
  if (!duracoes?.length) return 0;
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
export const atlasCarregado = () => atlasOk || !Object.values(manifesto.sprites).some((s) => s.origem === 'atlas');

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
 * Desenha o sprite com o pivô do manifesto em (x, y).
 * `pe: "base"` encosta o pé na linha do chão (o pixel do pivô fica logo acima).
 * `pe: "centro"` coloca o pivô em cima do ponto. `direcao` é o dir8.
 * `apontada: "direita"` gira pelo `angulo` (a lança aponta para a direita no PNG).
 */
export const desenharSprite = (ctx, id, segundos, x, y, opts = {}) => {
  const s = manifesto.sprites[id];
  if (!s) return;
  const coluna = opts.coluna != null
    ? ((opts.coluna % s.colunas) + s.colunas) % s.colunas
    : indiceQuadro(s.duracoes, segundos, !!s.loop);
  const { src, espelhar } = celulaDir(s, opts.direcao ?? 0);
  const { px, py } = pivoDe(s);
  const dx = Math.round(x - px);
  const dy = Math.round(s.pe === 'centro' ? y - py : y - (py + 1));
  const alfa = opts.alfa ?? 1;
  const girar = s.apontada === 'direita' && opts.angulo != null;
  if (alfa !== 1) ctx.globalAlpha = alfa;
  if (girar) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(opts.angulo);
    ctx.imageSmoothingEnabled = false;
  }
  const destX = girar ? Math.round(-px) : dx;
  const destY = girar ? Math.round(s.pe === 'centro' ? -py : -(py + 1)) : dy;
  if (usarAtlas(s)) {
    ctx.drawImage(atlas, s.x + coluna * s.frameW, s.y + src * s.frameH, s.frameW, s.frameH, destX, destY, s.frameW, s.frameH);
  } else {
    ctx.drawImage(canvasCodigo(id, coluna, src, espelhar), destX, destY);
  }
  if (girar) ctx.restore();
  if (alfa !== 1) ctx.globalAlpha = 1;
};

export const larguraSprite = (id) => manifesto.sprites[id]?.frameW ?? 16;
export const alturaSprite = (id) => manifesto.sprites[id]?.frameH ?? 16;

/** Primeiro quadro do sprite, no tamanho do manifesto, para ícone de HUD. */
export function quadroUi(id) {
  const s = manifesto.sprites[id];
  if (!s || typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = s.frameW;
  c.height = s.frameH;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const { px, py } = pivoDe(s);
  desenharSprite(g, id, 0, px, s.pe === 'centro' ? py : py + 1);
  return c;
}

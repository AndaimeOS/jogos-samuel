/* Chão em cache. O tile de 16 e o chunk de 256 vêm de
   desenvolvimento/jogos/pokemon-survivors/src/render/world.ts; o hash2, de
   src/engine/rng.ts (Copyright (c) 2026 Pedro Barretto, licença MIT).
   O mapa infinito de biomas não entra: a ilha continua o MAPA de regras.js.
   A paleta troca com a era. A água anima por cima do chunk. */

import { contexto2d, criarCanvas } from './pixelart.js';
import { desenharSprite } from './sprites.js';

const CHUNK = 256;
const TILE = 16;
const SEMENTE = 1996;

/** Hash inteiro estável → [0, 1). O mesmo de rng.ts. */
export const hash2 = (x, y, seed = 0) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const cache = new Map();

export const limparChao = () => cache.clear();

const agua = (estado, col, lin) => {
  if (lin < 0 || col < 0 || lin >= estado.linhas || col >= estado.colunas) return true;
  return estado.tiles[lin][col] === '~';
};

const chunkDe = (estado, era, cx, cy) => {
  const chave = `${era}:${cx}:${cy}`;
  const pronto = cache.get(chave);
  if (pronto) return pronto;
  const c = criarCanvas(CHUNK, CHUNK);
  const g = contexto2d(c);
  const ox = cx * CHUNK;
  const oy = cy * CHUNK;
  for (let ty = 0; ty < CHUNK / TILE; ty++) {
    for (let tx = 0; tx < CHUNK / TILE; tx++) {
      const col = Math.floor((ox + tx * TILE) / TILE);
      const lin = Math.floor((oy + ty * TILE) / TILE);
      if (agua(estado, col, lin)) continue;
      const praia = agua(estado, col - 1, lin) || agua(estado, col + 1, lin)
        || agua(estado, col, lin - 1) || agua(estado, col, lin + 1);
      let id = praia ? `chao-${era}-areia` : `chao-${era}-grama`;
      if (!praia && hash2(col, lin, SEMENTE) < 0.18) id = `chao-${era}-grama-var`;
      desenharSprite(g, id, 0, tx * TILE + TILE / 2, ty * TILE + TILE);
    }
  }
  cache.set(chave, c);
  return c;
};

export const desenharChao = (ctx, estado, cam, segundos) => {
  const era = estado.era === 'bronze' || estado.era === 'ferro' ? estado.era : 'pedra';
  const x0 = Math.floor(cam.x / CHUNK);
  const y0 = Math.floor(cam.y / CHUNK);
  const x1 = Math.floor((cam.x + cam.w - 1) / CHUNK);
  const y1 = Math.floor((cam.y + cam.h - 1) / CHUNK);
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      ctx.drawImage(chunkDe(estado, era, cx, cy), cx * CHUNK - cam.x, cy * CHUNK - cam.y);
    }
  }
  const col0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
  const lin0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
  const col1 = Math.min(estado.colunas - 1, Math.ceil((cam.x + cam.w) / TILE) + 1);
  const lin1 = Math.min(estado.linhas - 1, Math.ceil((cam.y + cam.h) / TILE) + 1);
  const idAgua = `chao-${era}-agua`;
  for (let lin = lin0; lin <= lin1; lin++) {
    for (let col = col0; col <= col1; col++) {
      if (!agua(estado, col, lin)) continue;
      desenharSprite(ctx, idAgua, segundos, col * TILE + TILE / 2 - cam.x, lin * TILE + TILE - cam.y);
    }
  }
};

/* Chão em cache, só dos pedaços que a câmera vê.
   O tile de 32 px cabe 8 vezes num chunk de 256. A grama, a areia e a água
   usam os sprites do jogo, desenhados em dobro. Mato, rocha, cinza e brasa
   são pintados com a paleta do portal. O hash2 veio de
   desenvolvimento/jogos/pokemon-survivors/src/engine/rng.ts
   (Copyright (c) 2026 Pedro Barretto, licença MIT). */

import { contexto2d, criarCanvas } from './pixelart.js';
import { desenharSprite } from './sprites.js';
import { CHAO, TILE } from '../ilha.js';

const CHUNK = 256;
const SEMENTE = 1996;

/** Hash inteiro estável → [0, 1). O mesmo de rng.ts. */
export const hash2 = (x, y, seed = 0) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const cache = new Map();

export const limparChao = () => cache.clear();

const terreno = (estado, col, lin) => {
  if (lin < 0 || col < 0 || lin >= estado.linhas || col >= estado.colunas) return CHAO.FUNDO;
  return estado.terreno[lin * estado.colunas + col];
};

function pintar(g, x, y, cor, variacao, semente) {
  g.fillStyle = cor;
  g.fillRect(x, y, TILE, TILE);
  g.fillStyle = variacao;
  for (let py = 0; py < TILE; py += 4) {
    for (let px = 0; px < TILE; px += 4) {
      if (hash2((x + px) >> 2, (y + py) >> 2, semente) < 0.4) g.fillRect(x + px, y + py, 4, 4);
    }
  }
}

function spriteNoTile(g, id, x, y) {
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(x, y);
  g.scale(2, 2);
  desenharSprite(g, id, 0, 8, 16);
  g.restore();
}

const chunkDe = (estado, era, cx, cy) => {
  const chave = `${era}:${cx}:${cy}`;
  const pronto = cache.get(chave);
  if (pronto) return pronto;
  const c = criarCanvas(CHUNK, CHUNK);
  const g = contexto2d(c);
  const ox = cx * CHUNK;
  const oy = cy * CHUNK;
  const n = CHUNK / TILE;
  for (let ty = 0; ty < n; ty++) {
    for (let tx = 0; tx < n; tx++) {
      const col = Math.floor((ox + tx * TILE) / TILE);
      const lin = Math.floor((oy + ty * TILE) / TILE);
      const t = terreno(estado, col, lin);
      const x = tx * TILE;
      const y = ty * TILE;
      if (t === CHAO.FUNDO || t === CHAO.RASO) continue;
      if (t === CHAO.ROCHA) {
        pintar(g, x, y, '#6E7C88', '#C5CED4', SEMENTE + 3);
      } else if (t === CHAO.CINZA) {
        pintar(g, x, y, '#5A463C', '#8A5A32', SEMENTE + 5);
      } else if (t === CHAO.BRASA) {
        pintar(g, x, y, '#8A3A22', hash2(col, lin, 9) < 0.5 ? '#FF9D52' : '#E2544A', SEMENTE + 7);
      } else if (t === CHAO.PRAIA) {
        spriteNoTile(g, `chao-${era}-areia`, x, y);
      } else {
        const varinha = hash2(col, lin, SEMENTE) < 0.18 || t === CHAO.MATO;
        spriteNoTile(g, varinha ? `chao-${era}-grama-var` : `chao-${era}-grama`, x, y);
        if (t === CHAO.MATO) {
          g.fillStyle = 'rgba(25, 80, 40, 0.35)';
          g.fillRect(x, y, TILE, TILE);
        }
      }
    }
  }
  cache.set(chave, c);
  return c;
};

export const desenharChao = (ctx, estado, cam, segundos = 0) => {
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
      if (terreno(estado, col, lin) !== CHAO.RASO) continue;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(col * TILE - cam.x, lin * TILE - cam.y);
      ctx.scale(2, 2);
      desenharSprite(ctx, idAgua, segundos, 8, 16);
      ctx.restore();
    }
  }
};

/* Noite em pixel duro, reescrita a partir de lightDisc e darkLayer em
   desenvolvimento/jogos/pokemon-survivors/src/render/places.ts
   (Copyright (c) 2026 Pedro Barretto, licença MIT).
   Sem caverna, sem olhos no escuro e sem tipo de Pokémon. */

import { contexto2d, criarCanvas } from './pixelart.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

const discos = new Map();

/** Raio desenhado: px inteiro de perto, par depois de 96 e de 4 em 4 depois de 160. */
const raioLuz = (r) => {
  const passo = r > 160 ? 4 : r > 96 ? 2 : 1;
  return Math.max(4, Math.round(r / passo) * passo);
};

/**
 * Recorte da luz: núcleo sólido e anéis que rareiam, para a noite acabar em
 * degrau de pixel. O preto opaco é o que o `destination-out` tira.
 */
export const discoDeLuz = (raio) => {
  const r = raioLuz(raio);
  const pronto = discos.get(r);
  if (pronto) return pronto;
  const tamanho = r * 2 + 1;
  const c = criarCanvas(tamanho, tamanho);
  const ctx = contexto2d(c);
  const img = ctx.createImageData(tamanho, tamanho);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y) / r;
      if (d > 1) continue;
      const fica = d < 0.62 ? 1 : d < 0.76 ? 0.75 : d < 0.88 ? 0.45 : 0.18;
      if (bayer(x + r, y + r) < fica) img.data[((y + r) * tamanho + x + r) * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  discos.set(r, c);
  return c;
};

let escuro = null;

export const camadaEscura = (w, h) => {
  if (!escuro || escuro.canvas.width !== w || escuro.canvas.height !== h) {
    const canvas = criarCanvas(w, h);
    escuro = { canvas, ctx: contexto2d(canvas) };
  }
  return escuro;
};

/**
 * Pinta a noite por cima do mundo já desenhado. `esc` é 0..1 (o jogo passa
 * `escuridao()`, que no pico vale `escuridaoMax`). `luzes` são {x, y, raio}
 * em pixel de mundo.
 */
export const desenharNoite = (ctx, cam, esc, luzes) => {
  if (esc <= 0) return;
  const { w, h } = cam;
  const camada = camadaEscura(w, h);
  const d = camada.ctx;
  d.setTransform(1, 0, 0, 1, 0, 0);
  d.clearRect(0, 0, w, h);
  d.globalCompositeOperation = 'source-over';
  d.fillStyle = `rgba(10, 18, 40, ${esc})`;
  d.fillRect(0, 0, w, h);
  d.globalCompositeOperation = 'destination-out';
  for (const luz of luzes) {
    const disco = discoDeLuz(luz.raio);
    const sx = Math.round(luz.x - cam.x) - (disco.width >> 1);
    const sy = Math.round(luz.y - cam.y) - (disco.height >> 1);
    d.drawImage(disco, sx, sy);
  }
  d.globalCompositeOperation = 'source-over';
  ctx.drawImage(camada.canvas, 0, 0);
};

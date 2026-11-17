/* Miolo reescrito a partir de desenvolvimento/jogos/pokemon-survivors/src/engine/pixelart.ts
   (fromStrings, canvas sem suavizar, elipse em pixel; Copyright (c) 2026 Pedro Barretto, MIT).
   A sombra vem de src/render/draw.ts (`shadow`). Sem atlas de silhueta, sem flash de dano
   e sem vestimenta. Sem Pokémon. */

const HEX = new Map();

export const rgba = (cor) => {
  let c = HEX.get(cor);
  if (c) return c;
  const n = parseInt(cor.slice(1), 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  HEX.set(cor, c);
  return c;
};

/** Pinta uma grade de letras. '.' e ' ' são transparentes. Devolve pixels, sem canvas. */
export const bufferDeLetras = (linhas, paleta, espelhar = false) => {
  const w = Math.max(...linhas.map((r) => r.length));
  const h = linhas.length;
  const data = new Uint8Array(w * h * 4);
  linhas.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) {
      const cor = paleta[linha[x]];
      if (!cor) continue;
      const px = espelhar ? w - 1 - x : x;
      const i = (y * w + px) * 4;
      const [r, g, b, a] = rgba(cor);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  });
  return { w, h, data };
};

export const criarCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
};

export const contexto2d = (canvas) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sem contexto 2d');
  ctx.imageSmoothingEnabled = false;
  return ctx;
};

/** Copia um buffer para um canvas. O canvas não existe no teste de nó. */
export const bufferParaCanvas = (buf) => {
  const c = criarCanvas(buf.w, buf.h);
  const ctx = contexto2d(c);
  const img = ctx.createImageData(buf.w, buf.h);
  img.data.set(buf.data);
  ctx.putImageData(img, 0, 0);
  return c;
};

/** Sprite escrito em letras, como no motor de origem. */
export const deLetras = (linhas, paleta, opts = {}) => bufferParaCanvas(bufferDeLetras(linhas, paleta, !!opts.espelhar));

/** Elipse de pixel duro, centrada em (x, y). Substitui o atlas de formas: aqui são poucas. */
export const blitElipse = (ctx, rx, ry, cor, x, y) => {
  const rxi = Math.max(1, Math.round(rx));
  const ryi = Math.max(1, Math.round(ry));
  ctx.fillStyle = cor;
  const cx = Math.round(x);
  const cy = Math.round(y);
  for (let py = -ryi; py <= ryi; py++) {
    for (let px = -rxi; px <= rxi; px++) {
      if ((px * px) / (rxi * rxi) + (py * py) / (ryi * ryi) <= 1) ctx.fillRect(cx + px, cy + py, 1, 1);
    }
  }
};

/** Elipse no pé. `largura` é a do corpo, como `shadow` em render/draw.ts. */
export const sombra = (ctx, x, y, largura) => {
  const rx = Math.max(3, Math.round(largura * 0.36));
  blitElipse(ctx, rx, Math.max(1, Math.round(rx * 0.4)), 'rgba(16,40,16,0.28)', x, y);
};

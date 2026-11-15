/* Monta as folhas que o empacotador espera a partir da arte proposta do Gerador
   (arte/origem/gerador). Quando /final/ trouxer folhas já no tamanho do manifesto,
   basta substituir os PNG em arte/<arquivo> e rodar npm run arte. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const origem = path.join(aqui, 'arte', 'origem', 'gerador');
const saida = path.join(aqui, 'arte');

async function cru(arquivo) {
  const { data, info } = await sharp(path.join(origem, arquivo)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function pintar(dst, dw, src, sw, sh, dx, dy) {
  for (let y = 0; y < sh; y++) src.data.copy(dst, ((dy + y) * dw + dx) * 4, (y * sw) * 4, ((y + 1) * sw) * 4);
}

async function gravar(rel, buffer, w, h) {
  const dest = path.join(saida, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(buffer, { raw: { width: w, height: h, channels: 4 } }).png().toFile(dest);
}

async function repetir(arquivo, fw, fh, cols, rows, rel) {
  const src = await cru(arquivo);
  const umQuadro = src.width === fw && src.height === fh;
  const umaFaixa = src.width === fw * cols && src.height === fh;
  if (!umQuadro && !umaFaixa) {
    throw new Error(`${arquivo}: ${src.width}×${src.height}, esperado ${fw}×${fh} ou ${fw * cols}×${fh}`);
  }
  const faixa = Buffer.alloc(fw * cols * fh * 4);
  if (umQuadro) {
    for (let c = 0; c < cols; c++) pintar(faixa, fw * cols, src, fw, fh, c * fw, 0);
  } else {
    src.data.copy(faixa);
  }
  const folha = Buffer.alloc(fw * cols * fh * rows * 4);
  for (let r = 0; r < rows; r++) faixa.copy(folha, r * fw * cols * fh * 4);
  await gravar(rel, folha, fw * cols, fh * rows);
}

async function samuel(poses, cols, rel) {
  const fw = 32;
  const fh = 48;
  const rows = poses.length;
  const folha = Buffer.alloc(fw * cols * fh * rows * 4);
  for (let r = 0; r < rows; r++) {
    const src = await cru(poses[r]);
    if (src.width !== fw || src.height !== fh) throw new Error(poses[r]);
    for (let c = 0; c < cols; c++) pintar(folha, fw * cols, src, fw, fh, c * fw, r * fh);
  }
  await gravar(rel, folha, fw * cols, fh * rows);
}

async function copiar(arquivo, rel) {
  const dest = path.join(saida, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(origem, arquivo), dest);
}

const frente = 'samuel/parado_frente.png';
const lado = 'samuel/parado_lado.png';
const costas = 'samuel/parado_costas.png';
const vistas = [frente, frente, lado, lado, costas];

await samuel(vistas, 2, 'samuel/idle.png');
await samuel(vistas, 4, 'samuel/walk.png');

await copiar('batalha/inimigos/seixo-vivo.png', 'inimigos/seixo-vivo.png');
await copiar('batalha/inimigos/enxame.png', 'inimigos/enxame.png');
await copiar('batalha/ataques/lasca.png', 'ataques/lasca.png');
await copiar('batalha/ataques/telegraph.png', 'ataques/telegraph.png');
await copiar('batalha/efeitos/acerto.png', 'efeitos/acerto.png');
await copiar('batalha/efeitos/morte.png', 'efeitos/morte.png');
await copiar('batalha/coleta/xp-1.png', 'coleta/xp-1.png');
await copiar('batalha/coleta/xp-2.png', 'coleta/xp-2.png');
await copiar('batalha/coleta/xp-3.png', 'coleta/xp-3.png');
await copiar('batalha/ui/lasca.png', 'ui/lasca.png');
await copiar('batalha/ui/vida.png', 'ui/vida.png');

const campo = await cru('batalha/chao/campo-pedra.png');
for (const [i, nome] of [[0, 'chao/pedra/grama.png'], [2, 'chao/pedra/grama-var.png']]) {
  const tile = Buffer.alloc(16 * 16 * 4);
  for (let y = 0; y < 16; y++) campo.data.copy(tile, y * 16 * 4, (y * campo.width + i * 16) * 4, (y * campo.width + i * 16 + 16) * 4);
  await gravar(nome, tile, 16, 16);
}

await repetir('batalha/inimigos/lobo-da-pedra.png', 32, 32, 4, 5, 'inimigos/lobo-da-pedra.png');
await repetir('ideias/pedra/urso-da-caverna.png', 64, 64, 4, 5, 'chefes/urso-da-caverna.png');
await repetir('ideias/bronze/guerreiro-de-bronze_v2.png', 32, 48, 4, 5, 'inimigos/guerreiro-de-bronze.png');
await repetir('ideias/bronze/escorpiao.png', 32, 32, 4, 5, 'inimigos/escorpiao.png');
await repetir('ideias/bronze/golem-de-barro.png', 48, 48, 4, 4, 'inimigos/golem-de-barro.png');
await repetir('ideias/bronze/sentinela-de-bronze.png', 48, 64, 4, 5, 'chefes/sentinela-de-bronze.png');
await repetir('ideias/ferro/soldado-de-ferro_v2.png', 32, 48, 4, 5, 'inimigos/soldado-de-ferro.png');
await repetir('ideias/ferro/catapulta.png', 48, 32, 2, 4, 'inimigos/catapulta.png');
await repetir('ideias/ferro/lobo-de-ferro.png', 32, 32, 4, 5, 'inimigos/lobo-de-ferro.png');
await repetir('ideias/ferro/colosso-de-ferro.png', 64, 80, 4, 4, 'chefes/colosso-de-ferro.png');
await repetir('ideias/pedra/mamute-de-la.png', 48, 48, 4, 4, 'inimigos/mamute.png');
await repetir('ideias/bronze/caranguejo-gigante.png', 48, 32, 4, 4, 'inimigos/caranguejo-gigante.png');
await repetir('ideias/ferro/robo-enferrujado.png', 32, 48, 4, 5, 'inimigos/robo-enferrujado.png');
{
  const src = await cru('batalha/inimigos/seixo-vivo.png');
  const frame = Buffer.alloc(32 * 32 * 4);
  for (let y = 0; y < 32; y++) src.data.copy(frame, y * 32 * 4, y * src.width * 4, y * src.width * 4 + 32 * 4);
  const pequeno = await sharp(frame, { raw: { width: 32, height: 32, channels: 4 } }).resize(16, 16, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
  const folha = Buffer.alloc(32 * 16 * 4);
  pequeno.copy(folha, 0);
  pequeno.copy(folha, 16 * 16 * 4);
  await gravar('ataques/meteoro.png', folha, 32, 16);
}
await copiar('ideias/bronze/enchente.png', 'ataques/enchente.png');
await copiar('ideias/ferro/tempestade-de-raios.png', 'ataques/tempestade-de-raios.png');

console.log('folhas montadas em arte/');

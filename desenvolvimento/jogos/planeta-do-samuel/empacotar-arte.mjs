/* Empacota os PNG mestres em arte/atlas.webp e aponta o manifesto para origem "atlas".
   Mestres: desenvolvimento/jogos/planeta-do-samuel/arte/<arquivo>
   Saída:   _privado/jogos/planeta-do-samuel/arte/atlas.webp e manifesto.json
   Sem PNG, o manifesto segue em "codigo" (placeholder). Ver README.md. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const JOGO_PADRAO = path.resolve(aqui, '../../../_privado/jogos/planeta-do-samuel');

const espelharLinha = (src, largura, fh, linhaSrc, linhaDst, destino) => {
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < largura; x++) {
      const sx = largura - 1 - x;
      const si = ((linhaSrc * fh + y) * largura + sx) * 4;
      const di = ((linhaDst * fh + y) * largura + x) * 4;
      src.copy(destino, di, si, si + 4);
    }
  }
};

const copiarLinha = (src, largura, fh, linhaSrc, linhaDst, destino) => {
  const bytes = largura * fh * 4;
  src.copy(destino, linhaDst * bytes, linhaSrc * bytes, (linhaSrc + 1) * bytes);
};

async function lerMestre(png, spec) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const fw = spec.frameW;
  const fh = spec.frameH;
  const larguraEsperada = fw * spec.colunas;
  if (info.width !== larguraEsperada) {
    throw new Error(`${spec.arquivo}: largura ${info.width}, esperada ${larguraEsperada}`);
  }
  if (info.height % fh !== 0) {
    throw new Error(`${spec.arquivo}: altura ${info.height} não fecha o quadro de ${fh}`);
  }
  const linhas = info.height / fh;
  if (spec.espelhoDaDireita && linhas === 5 && spec.linhas === 8) {
    const destino = Buffer.alloc(larguraEsperada * fh * 8 * 4);
    for (let linha = 0; linha < 5; linha++) copiarLinha(data, larguraEsperada, fh, linha, linha, destino);
    espelharLinha(data, larguraEsperada, fh, 3, 5, destino);
    espelharLinha(data, larguraEsperada, fh, 2, 6, destino);
    espelharLinha(data, larguraEsperada, fh, 1, 7, destino);
    return { data: destino, width: larguraEsperada, height: fh * 8 };
  }
  if (linhas !== spec.linhas) {
    throw new Error(`${spec.arquivo}: ${linhas} linhas, o manifesto pede ${spec.linhas}`);
  }
  return { data, width: info.width, height: info.height };
}

/**
 * Lê os PNG que existirem, monta o atlas e reescreve o manifesto do jogo.
 * Sprite sem PNG fica (ou volta a) origem "codigo".
 */
export async function empacotar({ mestre = path.join(aqui, 'arte'), jogo = JOGO_PADRAO } = {}) {
  const pastaArte = path.join(jogo, 'arte');
  const manifestoPath = path.join(pastaArte, 'manifesto.json');
  const doc = JSON.parse(fs.readFileSync(manifestoPath, 'utf8'));
  const prontos = [];
  let mudou = false;
  for (const spec of Object.values(doc.sprites)) {
    const png = path.join(mestre, spec.arquivo);
    if (!fs.existsSync(png)) {
      if (spec.origem !== 'codigo' || spec.x !== undefined) {
        spec.origem = 'codigo';
        delete spec.x;
        delete spec.y;
        mudou = true;
      }
      continue;
    }
    prontos.push({ spec, ...(await lerMestre(png, spec)) });
  }
  if (!prontos.length) {
    if (mudou) fs.writeFileSync(manifestoPath, JSON.stringify(doc, null, 2) + '\n');
    const atlas = path.join(pastaArte, doc.imagem || 'atlas.webp');
    if (fs.existsSync(atlas)) fs.unlinkSync(atlas);
    return { empacotados: 0, atlas: null };
  }

  const maxL = 512;
  let x = 0;
  let y = 0;
  let alturaLinha = 0;
  let largura = 0;
  let altura = 0;
  for (const item of prontos) {
    if (x > 0 && x + item.width > maxL) {
      y += alturaLinha;
      x = 0;
      alturaLinha = 0;
    }
    item.spec.x = x;
    item.spec.y = y;
    item.spec.origem = 'atlas';
    x += item.width;
    alturaLinha = Math.max(alturaLinha, item.height);
    largura = Math.max(largura, x);
    altura = Math.max(altura, y + alturaLinha);
  }
  const atlas = Buffer.alloc(largura * altura * 4);
  for (const item of prontos) {
    for (let linha = 0; linha < item.height; linha++) {
      const si = linha * item.width * 4;
      const di = ((item.spec.y + linha) * largura + item.spec.x) * 4;
      item.data.copy(atlas, di, si, si + item.width * 4);
    }
  }
  fs.mkdirSync(pastaArte, { recursive: true });
  const atlasPath = path.join(pastaArte, doc.imagem || 'atlas.webp');
  await sharp(atlas, { raw: { width: largura, height: altura, channels: 4 } })
    .webp({ lossless: true })
    .toFile(atlasPath);
  fs.writeFileSync(manifestoPath, JSON.stringify(doc, null, 2) + '\n');
  return { empacotados: prontos.length, atlas: atlasPath, largura, altura };
}

const ehDireto = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehDireto) {
  const args = process.argv.slice(2);
  const opt = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mestre') opt.mestre = path.resolve(args[++i]);
    else if (args[i] === '--jogo') opt.jogo = path.resolve(args[++i]);
  }
  empacotar(opt).then((r) => {
    console.log(r.empacotados
      ? `atlas: ${r.empacotados} sprites, ${r.largura}×${r.altura}`
      : 'nenhum PNG mestre; o jogo segue nos placeholders (origem codigo)');
  }).catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}

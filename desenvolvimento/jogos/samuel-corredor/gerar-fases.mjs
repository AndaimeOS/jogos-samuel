import { writeFileSync } from 'node:fs';
import { gid, LINHAS, COLUNAS } from '../../../_privado/jogos/samuel-corredor/regras.js';

const ALTURA = 15;
const CHAO = 12;
const PE = CHAO * 16;

const PLAT = new Set(['plat_esq', 'plat_meio', 'plat_dir']);

function grade(w) {
  return Array.from({ length: ALTURA }, () => Array(w).fill(0));
}

function faixa(g, fase, x0, x1, linha, familia) {
  for (let x = x0; x <= x1; x++) {
    const borda = x0 === x1 ? 'meio' : x === x0 ? 'esq' : x === x1 ? 'dir' : 'meio';
    g[linha][x] = gid(fase, familia + '_' + borda);
  }
}

function chao(g, fase, x0, x1, linha = CHAO) {
  faixa(g, fase, x0, x1, linha, 'chao');
  for (let y = linha + 1; y < ALTURA; y++) faixa(g, fase, x0, x1, y, 'terra');
}

function plataforma(g, fase, x0, x1, linha) {
  faixa(g, fase, x0, x1, linha, 'plat');
}

function enfeites(g, fase, xs, linha = 11) {
  const id = gid(fase, 'enfeite');
  for (const x of xs) if (g[linha] && g[linha][x] === 0) g[linha][x] = id;
}

let seq = 1;
function objeto(name, type, x, y, w, h, props) {
  const o = { id: seq++, name, type, x, y, width: w, height: h, rotation: 0, visible: true };
  if (props) {
    o.properties = Object.entries(props).map(([nome, value]) => ({
      name: nome,
      type: Number.isInteger(value) ? 'int' : 'string',
      value,
    }));
  }
  return o;
}

function tileset() {
  const tiles = [];
  for (const fase of LINHAS) {
    for (const nome of COLUNAS) {
      const id = gid(fase, nome) - 1;
      let prop = null;
      if (PLAT.has(nome)) prop = ['umaVia', true];
      else if (nome === 'especial' && fase === 'caverna') prop = ['cai', true];
      else if (nome !== 'enfeite') prop = ['solido', true];
      if (prop) tiles.push({ id, properties: [{ name: prop[0], type: 'bool', value: prop[1] }] });
    }
  }
  return {
    columns: 12,
    firstgid: 1,
    image: '../tiles.png',
    imageheight: 48,
    imagewidth: 192,
    margin: 0,
    name: 'tiles',
    spacing: 0,
    tilecount: 36,
    tileheight: 16,
    tilewidth: 16,
    tiles,
  };
}

function mapa(id, titulo, solido, fundo, objetos) {
  const w = solido[0].length;
  const flat = (g) => g.flat();
  return {
    compressionlevel: -1,
    height: ALTURA,
    width: w,
    tilewidth: 16,
    tileheight: 16,
    infinite: false,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    type: 'map',
    version: '1.10',
    nextlayerid: 4,
    nextobjectid: seq,
    properties: [
      { name: 'id', type: 'string', value: id },
      { name: 'titulo', type: 'string', value: titulo },
    ],
    tilesets: [tileset()],
    layers: [
      { id: 1, name: 'fundo', type: 'tilelayer', x: 0, y: 0, width: w, height: ALTURA, opacity: 1, visible: true, data: flat(fundo) },
      { id: 2, name: 'solido', type: 'tilelayer', x: 0, y: 0, width: w, height: ALTURA, opacity: 1, visible: true, data: flat(solido) },
      { id: 3, name: 'objetos', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: objetos },
    ],
  };
}

function campo() {
  seq = 1;
  const w = 36;
  const s = grade(w);
  const f = grade(w);
  chao(s, 'campo', 0, 15);
  chao(s, 'campo', 18, 26);
  chao(s, 'campo', 29, 35);
  plataforma(s, 'campo', 8, 10, 9);
  enfeites(f, 'campo', [3, 12, 21, 32]);
  const objs = [
    objeto('samuel', 'spawn', 24, PE - 48, 32, 48),
    objeto('moeda', 'moeda', 92, 150, 16, 16),
    objeto('moeda', 'moeda', 116, 150, 16, 16),
    objeto('moeda', 'moeda', 140, 150, 16, 16),
    objeto('moeda', 'moeda', 164, 150, 16, 16),
    objeto('lesma', 'inimigo', 196, PE - 20, 28, 20, { tipo: 'lesma', minX: 180, maxX: 240, dir: 1 }),
    objeto('estrela', 'estrela', 136, 112, 16, 16),
    objeto('marco', 'checkpoint', 280, PE - 24, 16, 24),
    objeto('estrela', 'estrela', 360, 150, 16, 16),
    objeto('estrela', 'estrela', 500, 150, 16, 16),
    objeto('bandeira', 'meta', 528, PE - 64, 32, 64),
  ];
  return mapa('campo', 'Campo', s, f, objs);
}

function floresta() {
  seq = 1;
  const w = 40;
  const s = grade(w);
  const f = grade(w);
  chao(s, 'floresta', 0, 13);
  chao(s, 'floresta', 16, 19);
  chao(s, 'floresta', 21, 31, 10);
  chao(s, 'floresta', 34, 39);
  plataforma(s, 'floresta', 16, 18, 8);
  enfeites(f, 'floresta', [2, 8, 17, 28, 36]);
  const objs = [
    objeto('samuel', 'spawn', 24, PE - 48, 32, 48),
    objeto('moeda', 'moeda', 88, 150, 16, 16),
    objeto('moeda', 'moeda', 112, 150, 16, 16),
    objeto('cogumelo', 'cogumelo', 56, PE - 32, 32, 32),
    objeto('lesma', 'inimigo', 186, PE - 20, 28, 20, { tipo: 'lesma', minX: 176, maxX: 214, dir: 1 }),
    objeto('estrela', 'estrela', 256, 96, 16, 16),
    objeto('plataforma', 'plataforma', 276, 80, 48, 16, { eixo: 'x', curso: 24, periodo: 3 }),
    objeto('marco', 'checkpoint', 384, 160 - 24, 16, 24),
    objeto('estrela', 'estrela', 448, 118, 16, 16),
    objeto('moeda', 'moeda', 470, 118, 16, 16),
    objeto('estrela', 'estrela', 560, 150, 16, 16),
    objeto('bandeira', 'meta', 576, PE - 64, 32, 64),
  ];
  return mapa('floresta', 'Floresta', s, f, objs);
}

function caverna() {
  seq = 1;
  const w = 40;
  const s = grade(w);
  const f = grade(w);
  chao(s, 'caverna', 0, 18);
  for (let x = 19; x <= 21; x++) s[CHAO][x] = gid('caverna', 'especial');
  chao(s, 'caverna', 22, 39);
  enfeites(f, 'caverna', [4, 12, 26, 34]);
  const objs = [
    objeto('samuel', 'spawn', 24, PE - 48, 32, 48),
    objeto('moeda', 'moeda', 96, 150, 16, 16),
    objeto('moeda', 'moeda', 120, 150, 16, 16),
    objeto('moeda', 'moeda', 144, 150, 16, 16),
    objeto('lesma', 'inimigo', 186, PE - 20, 28, 20, { tipo: 'lesma', minX: 170, maxX: 270, dir: 1 }),
    objeto('marco', 'checkpoint', 280, PE - 24, 16, 24),
    objeto('besouro', 'inimigo', 418, PE - 20, 24, 20, { tipo: 'besouro', minX: 400, maxX: 500, dir: 1 }),
    objeto('morcego', 'inimigo', 406, 52, 28, 20, { tipo: 'morcego', minX: 340, maxX: 560, dir: 1 }),
    objeto('estrela', 'estrela', 200, 120, 16, 16),
    objeto('estrela', 'estrela', 360, 120, 16, 16),
    objeto('estrela', 'estrela', 540, 140, 16, 16),
    objeto('bandeira', 'meta', 576, PE - 64, 32, 64),
  ];
  return mapa('caverna', 'Caverna', s, f, objs);
}

const destino = new URL('../../../_privado/jogos/samuel-corredor/arte/fases/', import.meta.url);
for (const [nome, doc] of [['campo', campo()], ['floresta', floresta()], ['caverna', caverna()]]) {
  const arq = new URL(nome + '.json', destino);
  writeFileSync(arq, JSON.stringify(doc) + '\n');
  const meta = doc.layers[2].objects.find((o) => o.type === 'checkpoint');
  const px = meta.x + meta.width / 2;
  console.log(nome, 'largura', doc.width * 16, 'marco', px, (px / (doc.width * 16)).toFixed(2));
}

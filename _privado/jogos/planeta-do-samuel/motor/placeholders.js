/* Placeholders em pixel, com os ids de arte/manifesto.json.
   São desenhados em código (a mesma ideia de deLetras / fromStrings: um pixel, uma cor)
   até o empacotador trocar a origem para "atlas". Paleta do portal. Sem Pokémon. */

import manifesto from '../arte/manifesto.json' with { type: 'json' };
import { rgba } from './pixelart.js';

const TINTA = '#193337';
const PELE = '#F3C7A0';
const CABELO = '#4A3428';
const JAQUETA = '#FF9D52';
const CAMISA = '#F2D15A';
const CALCA = '#1F6F78';
const MADEIRA = '#8A5A32';
const MADEIRA_CL = '#C9854A';
const PEDRA = '#8D98A0';
const PEDRA_CL = '#C5CED4';
const VERDE = '#2F7D45';
const VERDE_CL = '#3E9A56';
const FOLHA = '#B9ED80';
const FRUTA = '#E2544A';
const PAPEL = '#F5F2E8';

const CHAO = {
  pedra: {
    grama: ['#3E7A3A', '#5A9A48', '#8BC67A'],
    areia: ['#C8B48A', '#E6D3A1', '#F4E6C0'],
    agua: ['#1E6E94', '#2E7EA3', '#4AA0C4', '#D6EEF8'],
  },
  bronze: {
    grama: ['#6A6428', '#8A8438', '#C4A050'],
    areia: ['#C4A060', '#E2C080', '#F2D8A4'],
    agua: ['#2A6858', '#3A8870', '#58A080', '#D4F0E0'],
  },
  ferro: {
    grama: ['#2E4848', '#3E6060', '#6A9090'],
    areia: ['#A09890', '#C4BDB0', '#E0D8CC'],
    agua: ['#163848', '#245060', '#3A7080', '#C8DCE8'],
  },
};

function folha(w, h) {
  const data = new Uint8Array(w * h * 4);
  const put = (x, y, cor) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= w || py >= h || !cor) return;
    const [r, g, b, a] = rgba(cor);
    const i = (py * w + px) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  };
  const ret = (x, y, rw, rh, cor) => {
    for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) put(x + xx, y + yy, cor);
  };
  const elipse = (cx, cy, rx, ry, cor) => {
    const rxi = Math.max(1, rx);
    const ryi = Math.max(1, ry);
    for (let y = -ryi; y <= ryi; y++) {
      for (let x = -rxi; x <= rxi; x++) {
        if ((x * x) / (rxi * rxi) + (y * y) / (ryi * ryi) <= 1) put(cx + x, cy + y, cor);
      }
    }
  };
  return { w, h, data, put, ret, elipse };
}

function contornar(p) {
  const { w, h, data } = p;
  const out = new Uint8Array(data);
  const alfa = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : data[(y * w + x) * 4 + 3]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alfa(x, y)) continue;
      if (alfa(x + 1, y) || alfa(x - 1, y) || alfa(x, y + 1) || alfa(x, y - 1)) {
        const i = (y * w + x) * 4;
        out[i] = 25;
        out[i + 1] = 51;
        out[i + 2] = 55;
        out[i + 3] = 255;
      }
    }
  }
  return { w, h, data: out };
}

function caixa(p, x, baixo, w, h, frente, topo, lado) {
  const th = Math.max(4, Math.round(h * 0.34));
  const lw = Math.max(4, Math.round(w * 0.28));
  p.ret(x, baixo - h, w - lw, th, topo);
  p.ret(x + w - lw, baixo - h, lw, th, lado);
  p.ret(x, baixo - h + th, w - lw, h - th, frente);
  p.ret(x + w - lw, baixo - h + th, lw, h - th, lado);
  p.ret(x, baixo - h, w, 1, TINTA);
}

function samuel(spec, coluna, linha, parado) {
  const p = folha(spec.frameW, spec.frameH);
  const passo = parado ? 0 : [1, 0, -1, 0][coluna & 3];
  const bob = (coluna & 1) ? -1 : 0;
  const chao = spec.frameH - 2 + (parado ? bob : 0);
  const cx = (spec.frameW >> 1) + (linha === 1 || linha === 3 ? 1 : 0);
  const perna = (ox, dy) => {
    p.ret(cx + ox, chao - 14 + dy, 4, 8, '#C8CDCF');
    p.ret(cx + ox, chao - 6 + dy, 4, 3, '#3C454B');
    p.ret(cx + ox, chao - 3 + dy, 4, 2, '#FFFDF7');
  };
  if (linha === 2) {
    perna(-1, passo > 0 ? -2 : 0);
    perna(0, passo < 0 ? -2 : 0);
  } else {
    perna(-5, passo);
    perna(1, -passo);
  }
  const corpo = chao - 24;
  if (linha === 4) {
    p.ret(cx - 7, corpo, 14, 12, '#8D9397');
    p.ret(cx - 8, corpo + 2, 3, 8, '#6C7479');
    p.ret(cx + 5, corpo + 2, 3, 8, '#6C7479');
  } else if (linha === 2) {
    p.ret(cx - 5, corpo, 10, 12, '#8D9397');
    p.ret(cx - 1, corpo + 2, 4, 6, '#B4B9BC');
    p.ret(cx + 3, corpo + 3, 3, 8, PELE);
  } else {
    p.ret(cx - 7, corpo, 14, 12, '#8D9397');
    p.ret(cx - 2, corpo + 2, 5, 7, '#B4B9BC');
    if (linha !== 1) p.ret(cx - 9, corpo + 2, 3, 8, PELE);
    p.ret(cx + 6, corpo + 2, 3, 8, PELE);
  }
  const hy = corpo - 11;
  const olhosFechados = parado && (coluna & 1) === 1;
  if (linha === 4) {
    p.ret(cx - 5, hy, 11, 11, PELE);
    p.ret(cx - 6, hy - 3, 13, 9, CABELO);
  } else if (linha === 2) {
    p.ret(cx - 4, hy, 9, 11, PELE);
    p.ret(cx - 4, hy - 3, 9, 5, CABELO);
    p.ret(cx + 2, hy + (olhosFechados ? 5 : 4), 2, olhosFechados ? 1 : 2, TINTA);
  } else {
    p.ret(cx - 5, hy, 11, 11, PELE);
    p.ret(cx - 6, hy - 3, 13, 5, CABELO);
    p.ret(cx - 6, hy + 1, 2, 5, CABELO);
    p.ret(cx + 5, hy + 1, 2, 5, CABELO);
    const oy = hy + (olhosFechados ? 5 : 4);
    const oh = olhosFechados ? 1 : 2;
    p.ret(cx - 3, oy, 2, oh, TINTA);
    if (linha !== 1) p.ret(cx + 2, oy, 2, oh, TINTA);
    else p.ret(cx + 1, oy, 2, oh, TINTA);
  }
  return contornar(p);
}

function cao(spec, coluna) {
  const p = folha(spec.frameW, spec.frameH);
  const chao = spec.frameH - 2;
  const bob = (coluna & 1) ? -1 : 0;
  p.ret(4, chao - 10 + bob, 16, 8, PAPEL);
  p.ret(6, chao - 8 + bob, 5, 4, MADEIRA);
  p.ret(17, chao - 14 + bob, 8, 8, MADEIRA);
  p.ret(18, chao - 16 + bob, 3, 4, MADEIRA_CL);
  p.ret(22, chao - 11 + bob, 2, 2, TINTA);
  p.ret(3, chao - 12 + (coluna & 1 ? 0 : -2), 3, 3, PAPEL);
  p.ret(8, chao - 2, 2, 2, TINTA);
  p.ret(16, chao - 2, 2, 2, TINTA);
  return contornar(p);
}

function tileChao(id, spec, coluna) {
  const partes = id.split('-');
  const era = partes[1];
  const tipo = partes.slice(2).join('-');
  const pal = CHAO[era] || CHAO.pedra;
  const p = folha(spec.frameW, spec.frameH);
  if (tipo === 'agua') {
    const [a, b, c, brilho] = pal.agua;
    for (let y = 0; y < spec.frameH; y++) {
      for (let x = 0; x < spec.frameW; x++) {
        const n = (x * 3 + y * 5 + coluna) % 7;
        p.put(x, y, n === 0 ? c : n < 3 ? a : b);
        if ((x * 2 + y + coluna * 3) % 11 === 0) p.put(x, y, brilho);
      }
    }
    return { w: p.w, h: p.h, data: p.data };
  }
  const base = tipo === 'areia' ? pal.areia : pal.grama;
  for (let y = 0; y < spec.frameH; y++) {
    for (let x = 0; x < spec.frameW; x++) {
      const n = (x * 13 + y * 7) % 17;
      p.put(x, y, n < 3 ? base[0] : n > 14 ? base[2] : base[1]);
    }
  }
  if (tipo === 'grama-var') {
    p.put(4, 5, CAMISA);
    p.put(5, 5, CAMISA);
    p.put(11, 10, '#CEB7EF');
    p.put(3, 11, VERDE);
    p.put(3, 12, VERDE_CL);
  }
  return { w: p.w, h: p.h, data: p.data };
}

function graveto(spec) {
  const p = folha(spec.frameW, spec.frameH);
  p.ret(2, 8, 12, 2, MADEIRA);
  p.ret(7, 4, 2, 8, MADEIRA_CL);
  return contornar(p);
}

function seixo(spec) {
  const p = folha(spec.frameW, spec.frameH);
  p.elipse(8, 9, 5, 4, PEDRA);
  p.ret(5, 7, 3, 2, PEDRA_CL);
  return contornar(p);
}

function arbusto(spec, vazio) {
  const p = folha(spec.frameW, spec.frameH);
  const cx = spec.frameW >> 1;
  const pe = spec.frameH - 2;
  p.elipse(cx, pe - 10, 11, 8, vazio ? '#6A7A55' : VERDE);
  p.elipse(cx - 2, pe - 13, 7, 5, vazio ? '#7E8A68' : VERDE_CL);
  if (!vazio) {
    p.ret(cx - 6, pe - 12, 3, 3, FRUTA);
    p.ret(cx + 2, pe - 8, 3, 3, CAMISA);
    p.ret(cx - 1, pe - 15, 2, 2, FRUTA);
  }
  return contornar(p);
}

function arvore(spec) {
  const p = folha(spec.frameW, spec.frameH);
  const cx = spec.frameW >> 1;
  const pe = spec.frameH - 2;
  p.ret(cx - 3, pe - 20, 6, 20, MADEIRA);
  p.ret(cx - 2, pe - 20, 2, 20, MADEIRA_CL);
  p.elipse(cx, pe - 32, 16, 13, VERDE);
  p.elipse(cx - 3, pe - 36, 10, 8, VERDE_CL);
  p.elipse(cx - 8, pe - 38, 4, 3, FOLHA);
  return contornar(p);
}

function toco(spec) {
  const p = folha(spec.frameW, spec.frameH);
  const cx = spec.frameW >> 1;
  const pe = spec.frameH - 2;
  p.elipse(cx, pe - 3, 8, 3, MADEIRA);
  p.elipse(cx, pe - 6, 6, 3, MADEIRA_CL);
  p.ret(cx - 1, pe - 5, 2, 2, '#E6D3A1');
  return contornar(p);
}

function rocha(spec) {
  const p = folha(spec.frameW, spec.frameH);
  const cx = spec.frameW >> 1;
  const pe = spec.frameH - 2;
  p.elipse(cx + 2, pe - 8, 8, 6, PEDRA);
  p.elipse(cx - 4, pe - 10, 7, 6, '#6E7C88');
  p.elipse(cx - 6, pe - 13, 4, 3, PEDRA_CL);
  return contornar(p);
}

function veio(spec, vazio) {
  const p = folha(spec.frameW, spec.frameH);
  const cx = spec.frameW >> 1;
  const pe = spec.frameH - 2;
  p.elipse(cx, pe - 8, 10, 7, '#6E7C88');
  p.ret(cx - 8, pe - 6, 16, 4, PEDRA);
  if (!vazio) {
    p.ret(cx - 4, pe - 10, 3, 3, JAQUETA);
    p.ret(cx + 2, pe - 7, 3, 2, CAMISA);
    p.ret(cx - 1, pe - 5, 2, 2, JAQUETA);
  }
  return contornar(p);
}

function toca(spec) {
  const p = folha(spec.frameW, spec.frameH);
  const pe = spec.frameH - 2;
  p.elipse(22, pe - 12, 16, 12, PEDRA);
  p.elipse(20, pe - 14, 10, 7, PEDRA_CL);
  p.elipse(22, pe - 8, 6, 6, '#3A4248');
  p.ret(14, pe - 4, 4, 3, MADEIRA);
  return contornar(p);
}

function fogueira(spec, acesa, coluna) {
  const p = folha(spec.frameW, spec.frameH);
  const cx = spec.frameW >> 1;
  const pe = spec.frameH - 2;
  p.ret(cx - 11, pe - 5, 5, 4, PEDRA);
  p.ret(cx + 6, pe - 5, 5, 4, PEDRA);
  p.ret(cx - 7, pe - 7, 14, 4, MADEIRA);
  p.ret(cx - 2, pe - 9, 4, 3, MADEIRA_CL);
  if (acesa) {
    const alt = [8, 14, 11, 6][coluna & 3];
    p.ret(cx - 4, pe - 8 - alt, 8, alt, JAQUETA);
    p.ret(cx - 2, pe - 12 - alt, 4, 8, CAMISA);
    p.put(cx, pe - 14 - alt, PAPEL);
  }
  return contornar(p);
}

function mesa(spec, frente, marca) {
  const p = folha(spec.frameW, spec.frameH);
  const pe = spec.frameH - 2;
  caixa(p, 6, pe, spec.frameW - 14, 16, frente, MADEIRA_CL, MADEIRA);
  p.ret(10, pe - 4, 3, 4, TINTA);
  p.ret(spec.frameW - 16, pe - 4, 3, 4, TINTA);
  if (marca) marca(p, pe);
  return contornar(p);
}

function fornalha(spec, acesa, coluna) {
  const p = folha(spec.frameW, spec.frameH);
  const pe = spec.frameH - 2;
  caixa(p, 6, pe, 34, 28, '#6E7C88', PEDRA_CL, PEDRA);
  const boca = acesa ? ((coluna & 1) ? JAQUETA : CAMISA) : '#243038';
  p.ret(16, pe - 14, 12, 10, boca);
  p.ret(18, pe - 16, 8, 3, '#4A3428');
  return contornar(p);
}

function canteiro(spec, coluna) {
  const p = folha(spec.frameW, spec.frameH);
  const pe = spec.frameH - 2;
  p.ret(4, pe - 8, spec.frameW - 8, 8, MADEIRA);
  p.ret(6, pe - 10, spec.frameW - 12, 4, '#5A4030');
  const n = Math.max(0, Math.min(4, coluna));
  for (let i = 0; i < n; i++) {
    const x = 8 + i * 8;
    const alt = 6 + (i % 2);
    p.ret(x, pe - 10 - alt, 2, alt, VERDE_CL);
    p.put(x, pe - 12 - alt, i % 2 ? FRUTA : CAMISA);
  }
  return contornar(p);
}

function casinha(spec, pronta) {
  const p = folha(spec.frameW, spec.frameH);
  const pe = spec.frameH - 2;
  const cx = spec.frameW >> 1;
  caixa(p, 10, pe, 40, 28, PAPEL, '#E4E0D4', '#D8D2C4');
  p.ret(8, pe - 36, 46, 10, JAQUETA);
  p.ret(14, pe - 42, 34, 8, '#E07A30');
  p.ret(cx - 4, pe - 16, 8, 14, MADEIRA);
  p.ret(cx + 10, pe - 22, 8, 8, pronta ? CAMISA : PEDRA);
  return contornar(p);
}

function farol(spec, estagio, coluna) {
  const p = folha(spec.frameW, spec.frameH);
  const cx = spec.frameW >> 1;
  const pe = spec.frameH - 2;
  p.ret(cx - 14, pe - 8, 28, 8, PEDRA);
  p.ret(cx - 12, pe - 10, 24, 3, PEDRA_CL);
  const torre = estagio === 0 ? 18 : estagio === 1 ? 40 : 62;
  p.ret(cx - 6, pe - 8 - torre, 12, torre, PAPEL);
  p.ret(cx - 6, pe - 8 - torre, 3, torre, '#E4E0D4');
  p.ret(cx - 6, pe - 8 - Math.floor(torre * 0.45), 12, 3, CALCA);
  if (estagio >= 2) {
    p.ret(cx - 9, pe - 12 - torre, 18, 4, CALCA);
    const lampada = estagio < 3 ? PEDRA : (coluna & 1) ? JAQUETA : CAMISA;
    p.ret(cx - 5, pe - 22 - torre, 10, 10, lampada);
    p.ret(cx - 8, pe - 26 - torre, 16, 4, TINTA);
  }
  return contornar(p);
}

function icone(id, spec) {
  const p = folha(spec.frameW, spec.frameH);
  const c = 8;
  if (id === 'icone-madeira') {
    p.ret(2, 7, 12, 3, MADEIRA);
    p.ret(3, 6, 8, 1, MADEIRA_CL);
  } else if (id === 'icone-pedra') {
    p.elipse(c, 9, 5, 4, PEDRA);
    p.ret(5, 6, 3, 2, PEDRA_CL);
  } else if (id === 'icone-minerio') {
    p.elipse(c, 9, 5, 4, '#6E7C88');
    p.put(6, 8, JAQUETA);
    p.put(9, 10, CAMISA);
  } else if (id === 'icone-fruta') {
    p.elipse(c, 9, 4, 4, FRUTA);
    p.ret(7, 3, 2, 3, VERDE);
  } else if (id === 'icone-barra') {
    p.ret(3, 6, 10, 5, JAQUETA);
    p.ret(4, 5, 8, 2, CAMISA);
  } else if (id === 'icone-fome') {
    p.elipse(c, 9, 4, 4, FRUTA);
    p.ret(7, 4, 2, 2, VERDE_CL);
  } else if (id === 'icone-calor') {
    p.ret(6, 8, 4, 5, JAQUETA);
    p.ret(7, 4, 2, 5, CAMISA);
  } else if (id === 'icone-dia') {
    p.elipse(c, 8, 3, 3, CAMISA);
    p.ret(7, 1, 2, 2, CAMISA);
    p.ret(7, 13, 2, 2, CAMISA);
    p.ret(1, 7, 2, 2, CAMISA);
    p.ret(13, 7, 2, 2, CAMISA);
  } else if (id === 'icone-noite') {
    p.elipse(9, 8, 5, 5, '#C5CED4');
    p.elipse(11, 7, 4, 4, '#1E2A44');
  } else if (id === 'icone-seta') {
    p.ret(2, 7, 8, 2, JAQUETA);
    p.ret(8, 4, 2, 8, JAQUETA);
    p.ret(10, 5, 2, 6, JAQUETA);
    p.ret(12, 6, 2, 4, JAQUETA);
  }
  return contornar(p);
}

const COMBATE = {
  'seixo-vivo': ['#8D98A0', '#C5CED4', 'bola'],
  'lobo-da-pedra': ['#8A5A32', '#C9854A', 'bicho'],
  enxame: ['#3A4248', '#C5CED4', 'ponto'],
  'urso-da-caverna': ['#6A4A32', '#C9854A', 'bicho'],
  'guerreiro-de-bronze': ['#C4A060', '#E6D3A1', 'pessoa'],
  escorpiao: ['#8A5A32', '#FF9D52', 'bicho'],
  'golem-de-barro': ['#8A7048', '#C4A060', 'bloco'],
  'sentinela-de-bronze': ['#C4A060', '#F5F2E8', 'pessoa'],
  'soldado-de-ferro': ['#6E7C88', '#C5CED4', 'pessoa'],
  catapulta: ['#8A5A32', '#8D98A0', 'bloco'],
  'lobo-de-ferro': ['#6E7C88', '#C5CED4', 'bicho'],
  'colosso-de-ferro': ['#5A646C', '#C5CED4', 'bloco'],
  lasca: ['#8D98A0', '#F5F2E8', 'bola'],
  lanca: ['#C4A060', '#F5F2E8', 'traco'],
  faisca: ['#FF9D52', '#F2D15A', 'ponto'],
  pedregulho: ['#6E7C88', '#C5CED4', 'bola'],
  telegraph: ['#FF9D52', '#F2D15A', 'anel'],
  acerto: ['#F5F2E8', '#FF9D52', 'ponto'],
  morte: ['#8D98A0', '#F5F2E8', 'ponto'],
  'xp-brilho': ['#F2D15A', '#F5F2E8', 'ponto'],
  levelup: ['#F2D15A', '#FF9D52', 'anel'],
  'xp-1': ['#B9ED80', '#F5F2E8', 'bola'],
  'xp-2': ['#F2D15A', '#F5F2E8', 'bola'],
  'xp-3': ['#FF9D52', '#F5F2E8', 'bola'],
  'icone-lasca': ['#8D98A0', '#F5F2E8', 'bola'],
  'icone-lanca': ['#C4A060', '#F5F2E8', 'traco'],
  'icone-faisca': ['#FF9D52', '#F2D15A', 'ponto'],
  'icone-fogueira-carta': ['#FF9D52', '#F2D15A', 'ponto'],
  'icone-vida': ['#E2544A', '#F5F2E8', 'bola'],
  'carta-upgrade': ['#F5F2E8', '#FF9D52', 'carta'],
  mamute: ['#8A5E3E', '#E2E2D6', 'bicho'],
  'caranguejo-gigante': ['#FF9D52', '#F2D15A', 'bicho'],
  'robo-enferrujado': ['#91A3AE', '#C9813F', 'bloco'],
  meteoro: ['#8D98A0', '#FF9D52', 'bola'],
  enchente: ['#1F6F78', '#8FDCD2', 'bloco'],
  'tempestade-de-raios': ['#F5F2E8', '#F2D15A', 'bloco'],
};

function combate(spec, coluna, linha, pal) {
  const [cor, claro, forma] = pal;
  const p = folha(spec.frameW, spec.frameH);
  const cx = (spec.frameW >> 1) + ((linha % 3) - 1);
  const pe = spec.frameH - 2;
  const bob = (coluna % 2) ? -1 : 0;
  if (forma === 'bola') {
    p.elipse(cx, pe - 8 + bob, Math.max(3, (spec.frameW >> 1) - 4), Math.max(3, (spec.frameH >> 1) - 4), cor);
    p.ret(cx - 3, pe - 12 + bob, 3, 2, claro);
  } else if (forma === 'bicho') {
    p.elipse(cx, pe - 8 + bob, Math.max(5, spec.frameW / 3), 6, cor);
    p.elipse(cx + 6, pe - 14 + bob, 4, 4, cor);
    p.ret(cx + 7, pe - 13 + bob, 2, 2, '#193337');
    p.ret(cx - 4, pe - 3, 3, 3, claro);
  } else if (forma === 'pessoa') {
    p.ret(cx - 4, pe - 16 + bob, 4, 10, '#1F6F78');
    p.ret(cx + 1, pe - 16 + bob, 4, 10, '#1F6F78');
    p.ret(cx - 6, pe - 28 + bob, 12, 12, cor);
    p.ret(cx - 4, pe - 36 + bob, 8, 8, '#F3C7A0');
    p.ret(cx - 4, pe - 38 + bob, 8, 3, '#4A3428');
  } else if (forma === 'bloco') {
    p.ret(4, pe - spec.frameH + 10 + bob, spec.frameW - 8, spec.frameH - 14, cor);
    p.ret(6, pe - spec.frameH + 12 + bob, 6, 4, claro);
  } else if (forma === 'traco') {
    p.ret(2, (spec.frameH >> 1) - 1, spec.frameW - 4, 3, cor);
    p.ret(spec.frameW - 6, (spec.frameH >> 1) - 3, 4, 7, claro);
  } else if (forma === 'anel') {
    p.elipse(cx, spec.frameH >> 1, (spec.frameW >> 1) - 2, (spec.frameH >> 1) - 2, cor);
    p.elipse(cx, spec.frameH >> 1, (spec.frameW >> 1) - 6, (spec.frameH >> 1) - 6, '#000000');
    const data = p.data;
    for (let i = 0; i < data.length; i += 4) if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) data[i + 3] = 0;
  } else if (forma === 'carta') {
    p.ret(6, 6, spec.frameW - 12, spec.frameH - 12, cor);
    p.ret(6, 6, spec.frameW - 12, 8, claro);
  } else {
    p.ret(cx - 2, pe - 8 + bob, 4, 4, cor);
    p.put(cx, pe - 12 + bob, claro);
  }
  if (forma === 'anel') return { w: p.w, h: p.h, data: p.data };
  return contornar(p);
}

function pintar(id, spec, coluna, linha) {
  if (id === 'samuel-andar') return samuel(spec, coluna, linha, false);
  if (id === 'samuel-parado') return samuel(spec, coluna, linha, true);
  if (id === 'cao-parado') return cao(spec, coluna);
  if (id.startsWith('chao-')) return tileChao(id, spec, coluna);
  if (id === 'graveto') return graveto(spec);
  if (id === 'seixo') return seixo(spec);
  if (id === 'arbusto') return arbusto(spec, false);
  if (id === 'arbusto-vazio') return arbusto(spec, true);
  if (id === 'arvore') return arvore(spec);
  if (id === 'toco') return toco(spec);
  if (id === 'rocha') return rocha(spec);
  if (id === 'veio') return veio(spec, false);
  if (id === 'veio-vazio') return veio(spec, true);
  if (id === 'toca') return toca(spec);
  if (id === 'fogueira-apagada') return fogueira(spec, false, 0);
  if (id === 'fogueira-acesa') return fogueira(spec, true, coluna);
  if (id === 'pesquisa-bronze') return mesa(spec, MADEIRA_CL, (p, pe) => p.ret(16, pe - 18, 14, 6, PAPEL));
  if (id === 'bancada') return mesa(spec, '#A86838', (p, pe) => p.ret(18, pe - 16, 8, 3, PEDRA));
  if (id === 'fornalha-fria') return fornalha(spec, false, 0);
  if (id === 'fornalha-acesa') return fornalha(spec, true, coluna);
  if (id === 'canteiro') return canteiro(spec, coluna);
  if (id === 'pesquisa-ferro') return mesa(spec, '#6E7C88', (p, pe) => p.ret(18, pe - 18, 10, 4, JAQUETA));
  if (id === 'ferramentas') return mesa(spec, MADEIRA, (p, pe) => {
    p.ret(14, pe - 20, 2, 8, PEDRA_CL);
    p.ret(20, pe - 18, 8, 2, PEDRA);
  });
  if (id === 'casinha-obra') return casinha(spec, false);
  if (id === 'casinha-pronta') return casinha(spec, true);
  if (id === 'farol-0') return farol(spec, 0, coluna);
  if (id === 'farol-1') return farol(spec, 1, coluna);
  if (id === 'farol-2') return farol(spec, 2, coluna);
  if (id === 'farol-aceso') return farol(spec, 3, coluna);
  if (COMBATE[id]) return combate(spec, coluna, linha, COMBATE[id]);
  if (id.startsWith('icone-')) return icone(id, spec);
  throw new Error('sem placeholder: ' + id);
}

/** Um quadro do placeholder. `coluna` é o frame; `linha` é a direção (0–4; o espelho é na hora de desenhar). */
export function quadroCodigo(id, coluna = 0, linha = 0) {
  const s = manifesto.sprites[id];
  if (!s) throw new Error('sprite fora do manifesto: ' + id);
  const buf = pintar(id, s, ((coluna % s.colunas) + s.colunas) % s.colunas, linha);
  if (buf.w !== s.frameW || buf.h !== s.frameH) {
    throw new Error(`tamanho de ${id}: ${buf.w}×${buf.h}, manifesto ${s.frameW}×${s.frameH}`);
  }
  let opacos = 0;
  for (let i = 3; i < buf.data.length; i += 4) if (buf.data[i]) opacos++;
  if (!opacos) throw new Error('placeholder vazio: ' + id);
  return buf;
}

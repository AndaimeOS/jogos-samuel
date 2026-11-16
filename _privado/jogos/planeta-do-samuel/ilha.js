/* Ilha do Planeta do Samuel.
   As regras (queda radial, limiares, vulcão no centro, frequências do ruído,
   taxas dos recursos, dia de 240 s) foram lidas em scripts/world.gd e
   scripts/data.gd do Isle of Embers (MIT, © 2026 Jaineil Rana) e reescritas
   aqui. O ruído é um simplex nosso, com as mesmas frequências e oitavas.
   Não é código Godot e não usa a arte de lá. */

export const LADO = 128;
export const TILE = 32;

export const CHAO = {
  FUNDO: 0,
  RASO: 1,
  PRAIA: 2,
  GRAMA: 3,
  MATO: 4,
  ROCHA: 5,
  CINZA: 6,
  BRASA: 7,
};

export const NO = {
  NENHUM: 0,
  ARVORE: 1,
  PEDRA: 2,
  ARBUSTO: 3,
  VEIO: 4,
  PALMEIRA: 5,
};

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function permuta(semente) {
  const ordem = new Uint8Array(256);
  for (let i = 0; i < 256; i++) ordem[i] = i;
  let s = semente >>> 0;
  for (let i = 255; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = ordem[i];
    ordem[i] = ordem[j];
    ordem[j] = tmp;
  }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = ordem[i & 255];
  return p;
}

function contrib(p, ii, jj, x, y) {
  let t = 0.5 - x * x - y * y;
  if (t <= 0) return 0;
  t *= t;
  const g = GRAD[p[ii + p[jj]] & 7];
  return t * t * (g[0] * x + g[1] * y);
}

/** Simplex 2D em cerca de [-1, 1]. */
function simplex(p, x, y) {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;
  const ii = i & 255;
  const jj = j & 255;
  const n0 = contrib(p, ii, jj, x0, y0);
  const n1 = contrib(p, ii + i1, jj + j1, x0 - i1 + G2, y0 - j1 + G2);
  const n2 = contrib(p, ii + 1, jj + 1, x0 - 1 + 2 * G2, y0 - 1 + 2 * G2);
  return Math.max(-1, Math.min(1, 70 * (n0 + n1 + n2)));
}

/** FBM com ganho 0,5 e lacunaridade 2, normalizado para ficar em [-1, 1]. */
function fbm(p, x, y, freq, oitavas) {
  let amp = 1;
  let somaAmp = 0;
  let f = freq;
  let total = 0;
  for (let o = 0; o < oitavas; o++) {
    total += simplex(p, x * f, y * f) * amp;
    somaAmp += amp;
    amp *= 0.5;
    f *= 2;
  }
  return total / somaAmp;
}

function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inteiro(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

const cache = new Map();

function indice(col, lin) {
  return lin * LADO + col;
}

function centro(col, lin) {
  return { x: (col + 0.5) * TILE, y: (lin + 0.5) * TILE, col, lin };
}

function limparRecursos(recursos, col, lin, raio) {
  for (let y = lin - raio; y <= lin + raio; y++) {
    for (let x = col - raio; x <= col + raio; x++) {
      if (x < 0 || y < 0 || x >= LADO || y >= LADO) continue;
      recursos[indice(x, y)] = NO.NENHUM;
    }
  }
}

function acharAmostra(terreno, recursos, pred) {
  for (let lin = 8; lin < LADO - 8; lin++) {
    for (let col = 8; col < LADO - 8; col++) {
      const i = indice(col, lin);
      if (recursos[i]) continue;
      if (!pred(terreno[i], col, lin)) continue;
      return centro(col, lin);
    }
  }
  return null;
}

function medirTravessia(terreno, inicio) {
  const visto = new Uint8Array(LADO * LADO);
  const fila = [inicio.lin * LADO + inicio.col];
  visto[fila[0]] = 1;
  let minC = inicio.col;
  let maxC = inicio.col;
  let minL = inicio.lin;
  let maxL = inicio.lin;
  let n = 0;
  for (let k = 0; k < fila.length; k++) {
    const i = fila[k];
    if (terreno[i] < CHAO.PRAIA) continue;
    const col = i % LADO;
    const lin = (i / LADO) | 0;
    n++;
    if (col < minC) minC = col;
    if (col > maxC) maxC = col;
    if (lin < minL) minL = lin;
    if (lin > maxL) maxL = lin;
    const viz = [i - 1, i + 1, i - LADO, i + LADO];
    for (const j of viz) {
      if (j < 0 || j >= LADO * LADO || visto[j] || terreno[j] < CHAO.PRAIA) continue;
      const vc = j % LADO;
      if (Math.abs(vc - col) > 1) continue;
      visto[j] = 1;
      fila.push(j);
    }
  }
  const larguraPx = Math.max(0, maxC - minC) * TILE;
  const alturaPx = Math.max(0, maxL - minL) * TILE;
  return { larguraPx, alturaPx, casas: n, minC, maxC, minL, maxL };
}

/**
 * Monta a ilha. O resultado fica em cache pela semente: abrir a partida
 * de novo não refaz o ruído.
 */
export function gerarIlha(semente) {
  const sd = semente >>> 0 || 1;
  const pronta = cache.get(sd);
  if (pronta) return pronta;
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const n1 = permuta(sd);
  const n2 = permuta(sd + 7);
  const n3 = permuta(sd + 13);
  const terreno = new Uint8Array(LADO * LADO);
  const recursos = new Uint8Array(LADO * LADO);
  const metade = LADO * 0.5;
  const crateraCol = 64;
  const crateraLin = 64;
  for (let lin = 0; lin < LADO; lin++) {
    for (let col = 0; col < LADO; col++) {
      const dx = (col - metade) / metade;
      const dy = (lin - metade) / metade;
      const d = Math.hypot(dx, dy);
      const cd = Math.hypot(col - crateraCol, lin - crateraLin);
      const v = Math.max(0, 1 - cd / 20);
      const h = 1 - d * 1.18 + fbm(n1, col, lin, 0.045, 4) * 0.42 + v * 0.5;
      let t = CHAO.FUNDO;
      if (h < 0.06) t = CHAO.FUNDO;
      else if (h < 0.16) t = CHAO.RASO;
      else if (h < 0.25) t = CHAO.PRAIA;
      else {
        t = CHAO.GRAMA;
        if (fbm(n3, col, lin, 0.06, 5) > 0.08) t = CHAO.MATO;
        if (fbm(n2, col, lin, 0.08, 5) > 0.42 || v > 0.5) t = CHAO.ROCHA;
        if (cd < 9.5) t = CHAO.CINZA;
        if (cd < 4.6) t = CHAO.BRASA;
      }
      terreno[indice(col, lin)] = t;
    }
  }

  let spawnCol = metade | 0;
  let spawnLin = LADO - 2;
  for (let lin = LADO - 2; lin > metade; lin--) {
    if (terreno[indice(spawnCol, lin)] < CHAO.PRAIA) continue;
    spawnLin = lin;
    const pare = Math.max(lin - 14, 0);
    for (let yy = lin; yy > pare; yy--) {
      const tt = terreno[indice(spawnCol, yy)];
      if (tt === CHAO.GRAMA || tt === CHAO.MATO) {
        spawnLin = yy - 1;
        break;
      }
    }
    break;
  }

  const rng = aleatorio(sd);
  for (let lin = 0; lin < LADO; lin++) {
    for (let col = 0; col < LADO; col++) {
      const t = terreno[indice(col, lin)];
      const r = rng();
      const cd = Math.hypot(col - crateraCol, lin - crateraLin);
      let kind = NO.NENHUM;
      if (t === CHAO.MATO) {
        if (r < 0.32) kind = NO.ARVORE;
        else if (r < 0.37) kind = NO.ARBUSTO;
        else if (r < 0.39) kind = NO.PEDRA;
      } else if (t === CHAO.GRAMA) {
        if (r < 0.06) kind = NO.ARVORE;
        else if (r < 0.10) kind = NO.ARBUSTO;
        else if (r < 0.13) kind = NO.PEDRA;
      } else if (t === CHAO.PRAIA) {
        if (r < 0.045) kind = NO.PALMEIRA;
        else if (r < 0.055) kind = NO.PEDRA;
      } else if (t === CHAO.ROCHA) {
        if (r < 0.18) kind = NO.PEDRA;
        else if (r < 0.18 + (0.05 + Math.max(0, 0.1 - cd * 0.004))) kind = NO.VEIO;
      } else if (t === CHAO.CINZA) {
        if (r < 0.06) kind = NO.VEIO;
        else if (r < 0.12) kind = NO.PEDRA;
      }
      if (kind) recursos[indice(col, lin)] = kind;
    }
  }
  limparRecursos(recursos, spawnCol, spawnLin, 3);

  let postos = 0;
  let tentativas = 0;
  while (postos < 14 && tentativas < 4000) {
    tentativas++;
    const col = inteiro(rng, 8, LADO - 8);
    const lin = inteiro(rng, 8, LADO - 8);
    const i = indice(col, lin);
    if (terreno[i] === CHAO.ROCHA && !recursos[i]) {
      recursos[i] = NO.VEIO;
      postos++;
    }
  }

  let farol = null;
  for (let raio = 5; raio <= 16 && !farol; raio++) {
    for (let passo = 0; passo < 32; passo++) {
      const ang = -Math.PI / 2 + (passo / 32) * Math.PI * 2;
      const col = Math.round(crateraCol + Math.cos(ang) * raio);
      const lin = Math.round(crateraLin + Math.sin(ang) * raio);
      if (col < 1 || lin < 1 || col >= LADO - 1 || lin >= LADO - 1) continue;
      const t = terreno[indice(col, lin)];
      if (t === CHAO.CINZA || t === CHAO.ROCHA || t === CHAO.GRAMA || t === CHAO.MATO) {
        farol = { col, lin };
        break;
      }
    }
  }
  if (!farol) farol = { col: crateraCol, lin: crateraLin - 6 };
  limparRecursos(recursos, farol.col, farol.lin, 2);
  if (terreno[indice(farol.col, farol.lin)] === CHAO.FUNDO) {
    terreno[indice(farol.col, farol.lin)] = CHAO.CINZA;
  }

  const lista = [];
  const contagem = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < recursos.length; i++) {
    const tipo = recursos[i];
    if (!tipo) continue;
    contagem[tipo]++;
    lista.push({ i, col: i % LADO, lin: (i / LADO) | 0, tipo });
  }

  const inicio = centro(spawnCol, spawnLin);
  const farolPos = centro(farol.col, farol.lin);
  const cratera = centro(crateraCol, crateraLin);
  const travessia = medirTravessia(terreno, inicio);
  const amostras = {
    praia: acharAmostra(terreno, recursos, (t) => t === CHAO.PRAIA) || inicio,
    mato: acharAmostra(terreno, recursos, (t, col, lin) => t === CHAO.MATO && Math.hypot(col - spawnCol, lin - spawnLin) > 12) || inicio,
    rocha: acharAmostra(terreno, recursos, (t) => t === CHAO.ROCHA) || inicio,
    vulcao: centro(farol.col, Math.min(LADO - 2, farol.lin + 2)),
  };
  const geracaoMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  const ilha = {
    semente: sd,
    terreno,
    recursos,
    lista,
    contagem,
    colunas: LADO,
    linhas: LADO,
    inicio,
    farol: farolPos,
    cratera,
    travessia,
    amostras,
    geracaoMs,
    veiosGarantidos: postos,
  };
  cache.set(sd, ilha);
  return ilha;
}

export function terrenoEm(ilha, x, y) {
  const col = Math.floor(x / TILE);
  const lin = Math.floor(y / TILE);
  if (col < 0 || lin < 0 || col >= LADO || lin >= LADO) return CHAO.FUNDO;
  return ilha.terreno[indice(col, lin)];
}

export function bloqueiaPonto(ilha, x, y) {
  const col = Math.floor(x / TILE);
  const lin = Math.floor(y / TILE);
  if (col < 0 || lin < 0 || col >= LADO || lin >= LADO) return true;
  const i = indice(col, lin);
  if (ilha.terreno[i] === CHAO.FUNDO) return true;
  return ilha.recursos[i] !== NO.NENHUM;
}

// src/motor/numeros.js
var TAU = Math.PI * 2;
var clamp = (v, min, max) => Math.min(max, Math.max(min, v));
function dir8(x, y) {
  const octant = (Math.round(Math.atan2(y, x) / (Math.PI / 4)) + 8) % 8;
  return (2 - octant + 8) % 8;
}
function dirPara(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  return len > 1e-6 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
}
function reter(itens, fica) {
  let w = 0;
  for (let r = 0; r < itens.length; r++) if (fica(itens[r])) itens[w++] = itens[r];
  itens.length = w;
}
function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function criarRng(seed) {
  const state = { a: seed >>> 0 };
  const rng = () => {
    const a = state.a = state.a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  rng.state = state;
  return rng;
}
var faixa = (rng, min, max) => min + rng() * (max - min);
function escolherPeso(rng, entradas) {
  let total = 0;
  for (const [, w] of entradas) total += w;
  let roll = rng() * total;
  for (const [item, w] of entradas) {
    roll -= w;
    if (roll <= 0) return item;
  }
  return entradas[entradas.length - 1][0];
}
function hash2(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519) | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function criarGrade(celula) {
  return { celula, cells: /* @__PURE__ */ new Map(), used: [] };
}
function chave(cx, cy) {
  return (cx & 32767) << 15 | cy & 32767;
}
function limparGrade(grade) {
  for (const balde of grade.used) balde.length = 0;
  grade.used.length = 0;
  if (grade.cells.size > 4096) grade.cells.clear();
}
function inserir(grade, index, x, y) {
  const k = chave(Math.floor(x / grade.celula), Math.floor(y / grade.celula));
  let balde = grade.cells.get(k);
  if (!balde) grade.cells.set(k, balde = []);
  if (balde.length === 0) grade.used.push(balde);
  balde.push(index);
}
function consultar(grade, x, y, raio, saida) {
  let n = 0;
  const minX = Math.floor((x - raio) / grade.celula);
  const maxX = Math.floor((x + raio) / grade.celula);
  const minY = Math.floor((y - raio) / grade.celula);
  const maxY = Math.floor((y + raio) / grade.celula);
  for (let cx = minX; cx <= maxX; cx++) {
    for (let cy = minY; cy <= maxY; cy++) {
      const balde = grade.cells.get(chave(cx, cy));
      if (balde) for (const i of balde) saida[n++] = i;
    }
  }
  saida.length = n;
  return saida;
}
var LADO_CURTO_CELULAR = 600;
var MUNDO_CURTO_CELULAR = 220;
var MUNDO_CURTO = 300;
function escalaDispositivo(cssW, cssH, dpr) {
  const curto = Math.min(cssW, cssH);
  if (curto < LADO_CURTO_CELULAR) return Math.max(2, Math.round(curto * dpr / MUNDO_CURTO_CELULAR));
  return Math.max(2, Math.round(Math.max(2, Math.round(curto / MUNDO_CURTO)) * dpr));
}
function ladoPar(px) {
  if (!(px >= 1)) return 1;
  const inteiro = Math.ceil(px);
  return inteiro + inteiro % 2;
}
function encaixarVista(cssW, cssH, dpr) {
  const escala = escalaDispositivo(cssW, cssH, dpr);
  return {
    w: ladoPar(cssW * dpr / escala),
    h: ladoPar(cssH * dpr / escala),
    cssScale: escala / dpr,
    dpr
  };
}
var RAIO_STICK = 52;
var ZONA_MORTA = 8;
var CHEIO_EM = 0.75;
function vetorStick(dx, dy, percurso) {
  const vel = Math.min(1, Math.max(0, (percurso - ZONA_MORTA) / (RAIO_STICK * CHEIO_EM - ZONA_MORTA)));
  return vel > 0 ? { x: dx / percurso * vel, y: dy / percurso * vel } : { x: 0, y: 0 };
}
function joystick(origem, ponteiro) {
  let dx = ponteiro.x - origem.x;
  let dy = ponteiro.y - origem.y;
  const len = Math.hypot(dx, dy);
  let base = origem;
  if (len > RAIO_STICK) {
    const k = RAIO_STICK / len;
    base = { x: ponteiro.x - dx * k, y: ponteiro.y - dy * k };
    dx *= k;
    dy *= k;
  }
  const percurso = Math.hypot(dx, dy);
  return { origin: base, knob: { x: base.x + dx, y: base.y + dy }, vec: vetorStick(dx, dy, percurso) };
}
function xpPara(nivel) {
  return Math.floor(5 + (nivel - 1) * 9 + Math.max(0, nivel - 20) * 6 + Math.max(0, nivel - 40) * 10);
}
function distanciaAnel(w, h) {
  return Math.hypot(w, h) / 2 + 12;
}

// src/motor/mundo.js
var REGIAO = 1100;
var JITTER = 0.6;
var ANEIS = [2400, 4400, 7200];
var SAL = { jitterX: 9105, jitterY: 9106, pick: 9107, ring: 9108 };
function sitioX(seed, i, j) {
  if (i === 0 && j === 0) return 0;
  return (i + (hash2(i, j, seed + SAL.jitterX) - 0.5) * JITTER) * REGIAO;
}
function sitioY(seed, i, j) {
  if (i === 0 && j === 0) return 0;
  return (j + (hash2(i, j, seed + SAL.jitterY) - 0.5) * JITTER) * REGIAO;
}
function andar(seed, i, j, d2) {
  const wobble = 0.9 + hash2(i, j, seed + SAL.ring) * 0.2;
  let tier = 0;
  for (const anel of ANEIS) {
    const r = anel * wobble;
    if (d2 < r * r) return tier;
    tier++;
  }
  return tier;
}
function biomaRegiao(seed, i, j, biomas) {
  const lista = biomas.length ? biomas : ["campo"];
  if (i === 0 && j === 0) return lista[0];
  const x = sitioX(seed, i, j);
  const y = sitioY(seed, i, j);
  const tier = andar(seed, i, j, x * x + y * y);
  const indice = Math.floor(hash2(i, j, seed + SAL.pick + tier) * lista.length);
  return lista[indice % lista.length];
}
function biomaEm(seed, x, y, biomas) {
  const i = Math.round(x / REGIAO);
  const j = Math.round(y / REGIAO);
  let melhor = biomaRegiao(seed, i, j, biomas);
  let melhorD = Infinity;
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const cx = sitioX(seed, i + di, j + dj);
      const cy = sitioY(seed, i + di, j + dj);
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d < melhorD) {
        melhorD = d;
        melhor = biomaRegiao(seed, i + di, j + dj, biomas);
      }
    }
  }
  return melhor;
}

// src/motor/partida.js
var MAX_GOLPES = 6;
var MAX_ITENS = 6;
var MAX_PARTICULAS = 900;
var MAX_TEXTOS = 120;
var CURVA = [
  { ate: 20, taxa: 1.4, max: 40 },
  { ate: 45, taxa: 2.2, max: 70 },
  { ate: Infinity, taxa: 3, max: 100 }
];
var DIFICULDADE = {
  facil: { vidaInimigo: 0.75, danoInimigo: 0.45, velocidadeInimigo: 0.7, taxa: 0.85, cura: 1.6, piso: 1, iframes: 0.55 },
  normal: { vidaInimigo: 1, danoInimigo: 1, velocidadeInimigo: 1, taxa: 1, cura: 0, piso: 0, iframes: 0.5 }
};
var BASE = {
  hpMax: 100,
  speed: 68,
  might: 1,
  area: 1,
  cooldown: 1,
  duration: 1,
  amount: 0,
  projectileSpeed: 1,
  magnet: 42,
  regen: 0,
  armor: 0,
  growth: 1
};
var VIZINHOS = [];
function defGolpe(conteudo, id) {
  return conteudo.golpes.find((g) => g.id === id);
}
function defItem(conteudo, id) {
  return conteudo.itens.find((g) => g.id === id);
}
function defBicho(conteudo, id) {
  return conteudo.inimigos[id];
}
function statsDe(p) {
  const s = { ...BASE };
  const dif = DIFICULDADE[p.modo];
  s.regen += dif.cura;
  let extraVida = 0;
  for (const it of p.jogador.itens) {
    const def = defItem(p.conteudo, it.id);
    if (!def) continue;
    const n = it.nivel;
    for (const [k, v] of Object.entries(def.soma || {})) {
      if (k === "hpMax") extraVida += v * n;
      else s[k] = (s[k] || 0) + v * n;
    }
    for (const [k, v] of Object.entries(def.multiplica || {})) s[k] *= v ** n;
  }
  s.hpMax = BASE.hpMax + extraVida;
  s.armor = clamp(s.armor, 0, 0.6);
  return s;
}
function aplicarStats(p) {
  const antes = p.jogador.stats.hpMax;
  p.jogador.stats = statsDe(p);
  if (p.jogador.stats.hpMax > antes) p.jogador.hp += p.jogador.stats.hpMax - antes;
  p.jogador.hp = Math.min(p.jogador.hp, p.jogador.stats.hpMax);
}
function soltarTexto(p, x, y, texto, cor) {
  if (p.textos.length > MAX_TEXTOS) p.textos.shift();
  p.textos.push({ x: x + faixa(p.rng, -4, 4), y, vy: -38, vida: 0, texto, cor });
}
function estouro(p, x, y, cores, n, vel = 70) {
  for (let i = 0; i < n && p.particulas.length < MAX_PARTICULAS; i++) {
    const a = faixa(p.rng, 0, TAU);
    const s = faixa(p.rng, vel * 0.3, vel);
    p.particulas.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      vida: 0,
      ttl: faixa(p.rng, 0.25, 0.45),
      cor: cores[Math.floor(p.rng() * cores.length)],
      tam: 2,
      grav: 0,
      arrasto: 4
    });
  }
}
function tremer(p, qtd) {
  p.tremor = Math.max(p.tremor, qtd);
}
function machucarJogador(p, dano, de) {
  const j = p.jogador;
  if (j.iframes > 0 || p.pausa !== "jogo") return;
  const dif = DIFICULDADE[p.modo];
  const liquido = Math.max(1, dano * dif.danoInimigo * (1 - j.stats.armor));
  j.hp -= liquido;
  j.iframes = dif.iframes;
  j.ferido = 0.15;
  tremer(p, 3);
  soltarTexto(p, j.x, j.y - 20, String(Math.round(liquido)), "#E2544A");
  if (de) {
    const d = dirPara(de.x, de.y, j.x, j.y);
    j.kx += d.x * 80;
    j.ky += d.y * 80;
  }
  if (j.hp <= dif.piso) {
    j.hp = dif.piso;
    if (dif.piso <= 0) {
      j.hp = 0;
      p.pausa = "derrota";
      estouro(p, j.x, j.y, ["#193337", "#E2544A"], 18, 90);
    }
  }
}
function empurrar(bicho2, dx, dy, forca) {
  const d = Math.hypot(dx, dy) || 1;
  bicho2.kx += dx / d * forca / bicho2.massa;
  bicho2.ky += dy / d * forca / bicho2.massa;
}
function ferirBicho(p, bicho2, dano, deX, deY, golpe2) {
  if (bicho2.morrendo >= 0) return;
  const j = p.jogador;
  let q = dano * j.stats.might;
  if (bicho2.queima > 0) q *= 1.15;
  bicho2.hp -= q;
  bicho2.ferido = 0.12;
  empurrar(bicho2, bicho2.x - deX, bicho2.y - deY, golpe2 && golpe2.empurrao || 40);
  soltarTexto(p, bicho2.x, bicho2.y - bicho2.raio, String(Math.max(1, Math.round(q))), "#193337");
  estouro(p, bicho2.x, bicho2.y, ["#F5F2E8", "#FF9D52"], 4, 50);
  if (golpe2 && golpe2.queima) bicho2.queima = Math.max(bicho2.queima, 2);
  if (golpe2 && golpe2.puxa) {
    const d = dirPara(bicho2.x, bicho2.y, deX, deY);
    bicho2.kx += d.x * golpe2.puxa / bicho2.massa;
    bicho2.ky += d.y * golpe2.puxa / bicho2.massa;
  }
  if (bicho2.hp <= 0) {
    bicho2.morrendo = 0;
    bicho2.hp = 0;
    ganharXp(p, bicho2.xp);
    estouro(p, bicho2.x, bicho2.y, ["#B9ED80", "#FF9D52", "#193337"], bicho2.chefe ? 28 : 10, 110);
    if (bicho2.chefe) tremer(p, bicho2.lendario ? 9 : 5);
    soltarGema(p, bicho2.x, bicho2.y, bicho2.xp);
    p.derrotados++;
  }
}
function soltarGema(p, x, y, xp) {
  const faixaXp = xp >= 6 ? 3 : xp >= 3 ? 2 : 1;
  p.gemas.push({ x, y, xp: Math.max(1, xp), faixa: faixaXp, viva: true });
}
function ganharXp(p, qtd) {
  const j = p.jogador;
  j.xp += qtd * j.stats.growth;
  let subiu = false;
  while (j.xp >= j.xpProx) {
    j.xp -= j.xpProx;
    j.nivel++;
    j.xpProx = xpPara(j.nivel);
    j.pendentes++;
    subiu = true;
  }
  if (subiu && p.pausa === "jogo") abrirCartas(p);
}
function modsAtivos(def, golpe2) {
  const m = { n: 0, dano: 0, raio: 0, queima: false, empurrao: 0, puxa: 0, vel: 0 };
  if (!def.bifurca) return m;
  if (golpe2.nivel >= 4) Object.assign(m, def.bifurca[4][golpe2.caminho & 1].mod);
  if (golpe2.nivel >= 7) Object.assign(m, def.bifurca[7][golpe2.caminho >> 1 & 1].mod);
  return m;
}
function poolCartas(p, soNovos) {
  const j = p.jogador;
  const pool = [];
  if (j.golpes.length < MAX_GOLPES) {
    for (const g of p.conteudo.golpes) {
      if (j.golpes.some((o) => o.id === g.id)) continue;
      pool.push({ tipo: "golpe", id: g.id, peso: soNovos ? 1 : 1, nome: g.nome, texto: g.texto, icone: g.icone });
    }
  }
  if (soNovos) return pool;
  for (const g of j.golpes) {
    const def = defGolpe(p.conteudo, g.id);
    const prox = g.nivel + 1;
    if ((prox === 4 || prox === 7) && def.bifurca && def.bifurca[prox]) {
      def.bifurca[prox].forEach((ramo, indice) => {
        pool.push({
          tipo: "bifurca",
          id: g.id,
          passo: prox,
          indice,
          peso: 1.3,
          nome: ramo.nome,
          texto: ramo.texto,
          icone: def.icone
        });
      });
    } else if (g.nivel < 8) {
      pool.push({
        tipo: "melhora",
        id: g.id,
        peso: 1.3,
        nome: def.nome,
        texto: "Fica mais forte.",
        icone: def.icone
      });
    }
  }
  if (j.itens.length < MAX_ITENS || j.itens.some((it) => it.nivel < 4)) {
    for (const it of p.conteudo.itens) {
      const tem = j.itens.find((o) => o.id === it.id);
      if (!tem && j.itens.length >= MAX_ITENS) continue;
      if (tem && tem.nivel >= 4) continue;
      pool.push({
        tipo: tem ? "item" : "item-novo",
        id: it.id,
        peso: tem ? 1.1 : 0.85,
        nome: it.nome,
        texto: it.texto,
        icone: it.icone
      });
    }
  }
  return pool;
}
function tirarCartas(p, pool) {
  const rng = p.rng;
  const entradas = pool.map((c) => [c, c.peso]);
  const saida = [];
  const usados = /* @__PURE__ */ new Set();
  for (let i = 0; i < 3 && entradas.length; i++) {
    const carta = escolherPeso(rng, entradas);
    const chave2 = `${carta.tipo}:${carta.id}:${carta.indice ?? ""}:${carta.passo ?? ""}`;
    if (usados.has(chave2)) {
      const idx2 = entradas.findIndex(([c]) => c === carta);
      if (idx2 >= 0) entradas.splice(idx2, 1);
      i--;
      continue;
    }
    usados.add(chave2);
    saida.push(carta);
    const idx = entradas.findIndex(([c]) => c === carta);
    if (idx >= 0) entradas.splice(idx, 1);
  }
  return saida;
}
function abrirCartas(p) {
  const soNovos = p.jogador.golpes.length < 2;
  const pool = poolCartas(p, soNovos);
  p.ofertas = tirarCartas(p, pool.length ? pool : poolCartas(p, false));
  p.pausa = p.ofertas.length ? "cartas" : "jogo";
  if (!p.ofertas.length) p.jogador.pendentes = 0;
}
function escolherCarta(p, indice) {
  if (p.pausa !== "cartas") return;
  const carta = p.ofertas[indice];
  if (!carta) return;
  const j = p.jogador;
  if (carta.tipo === "golpe") {
    j.golpes.push({ id: carta.id, nivel: 1, cd: 0.2, caminho: 0 });
  } else if (carta.tipo === "melhora") {
    const g = j.golpes.find((o) => o.id === carta.id);
    if (g) g.nivel++;
  } else if (carta.tipo === "bifurca") {
    const g = j.golpes.find((o) => o.id === carta.id);
    if (g) {
      g.nivel = carta.passo;
      if (carta.passo === 4) g.caminho = g.caminho & ~1 | carta.indice;
      else g.caminho = g.caminho & ~2 | carta.indice << 1;
    }
  } else {
    let it = j.itens.find((o) => o.id === carta.id);
    if (!it) j.itens.push(it = { id: carta.id, nivel: 0 });
    it.nivel++;
  }
  aplicarStats(p);
  j.pendentes = Math.max(0, j.pendentes - 1);
  estouro(p, j.x, j.y, ["#CEB7EF", "#B9ED80"], 12, 60);
  if (j.pendentes > 0) abrirCartas(p);
  else {
    p.ofertas = [];
    p.pausa = "jogo";
  }
}
function nascer(p, id, x, y, extra) {
  const def = defBicho(p.conteudo, id);
  if (!def) return null;
  const dif = DIFICULDADE[p.modo];
  const ordem = 1 + (p.fase.ordem - 1) * 0.12;
  const elite = extra && extra.elite;
  const chefe = !!def.chefe || !!(extra && extra.chefe);
  const hp = def.hp * dif.vidaInimigo * ordem * (elite ? 3 : 1) * (chefe ? 1 : 1);
  const bicho2 = {
    id: ++p.seq,
    tipo: id,
    sprite: def.sprite,
    x,
    y,
    hp,
    hpMax: hp,
    raio: (def.raio || 8) * (elite ? 1.35 : 1) * (chefe ? 1.15 : 1),
    vel: def.vel * dif.velocidadeInimigo * (elite ? 1.05 : 1),
    dano: def.dano,
    xp: Math.round(def.xp * (elite ? 3 : 1)),
    massa: def.massa * (chefe ? 4 : 1),
    comportamento: def.comportamento || "chase",
    chefe,
    elite: !!elite,
    lendario: !!def.lendario,
    kx: 0,
    ky: 0,
    dir: 0,
    idade: 0,
    ferido: 0,
    morrendo: -1,
    queima: 0,
    faseChefe: 1,
    ataque: faixa(p.rng, 0.4, 1.2),
    vx: 0,
    vy: 0,
    ttl: extra && extra.ttl ? extra.ttl : 0,
    altura: def.altura || (chefe ? 34 : 20)
  };
  if (extra && extra.vx != null) {
    bicho2.vx = extra.vx;
    bicho2.vy = extra.vy;
    bicho2.comportamento = "flyby";
  }
  p.inimigos.push(bicho2);
  return bicho2;
}
function pontoFora(p) {
  const j = p.jogador;
  const ang = faixa(p.rng, 0, TAU);
  const d = distanciaAnel(p.vista.w, p.vista.h);
  return { x: j.x + Math.cos(ang) * d, y: j.y + Math.sin(ang) * d };
}
function vivos(p) {
  return p.inimigos.filter((b) => b.morrendo < 0 && !b.chefe).length;
}
function curvaEm(tempo) {
  return CURVA.find((c) => tempo < c.ate) || CURVA[CURVA.length - 1];
}
function dispararAnel(p, id, n) {
  const j = p.jogador;
  const d = distanciaAnel(p.vista.w, p.vista.h) - 20;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;
    nascer(p, id, j.x + Math.cos(a) * d, j.y + Math.sin(a) * d);
  }
}
function dispararBando(p, id, n) {
  const j = p.jogador;
  const ang = faixa(p.rng, 0, TAU);
  const d = distanciaAnel(p.vista.w, p.vista.h);
  const def = defBicho(p.conteudo, id);
  const vel = (def ? def.vel : 40) * 1.7;
  const vx = Math.cos(ang) * vel;
  const vy = Math.sin(ang) * vel;
  for (let i = 0; i < n; i++) {
    const lado = faixa(p.rng, -70, 70);
    const atras = faixa(p.rng, 0, 60);
    nascer(p, id, j.x - Math.cos(ang) * (d + atras) - Math.sin(ang) * lado, j.y - Math.sin(ang) * (d + atras) + Math.cos(ang) * lado, {
      vx,
      vy,
      ttl: (d * 2 + 120) / vel
    });
  }
}
function trazerChefe(p) {
  if (p.chefe && p.chefe.morrendo < 0) return p.chefe;
  const id = p.fase.chefe || p.conteudo.chefeDaRegiao[p.fase.regiao];
  if (!id) return null;
  const pos = pontoFora(p);
  const chefe = nascer(p, id, pos.x, pos.y, { chefe: true });
  if (!chefe) return null;
  p.chefe = chefe;
  tremer(p, chefe.lendario ? 9 : 5);
  p.eventos.chefe = true;
  return chefe;
}
function passoSpawner(p, dt) {
  if (p.fase.tipo === "fim") return;
  const dif = DIFICULDADE[p.modo];
  const curva = curvaEm(p.tempo);
  const chefeVivo = p.chefe && p.chefe.morrendo < 0;
  const taxa = curva.taxa * dif.taxa * (chefeVivo ? 0.35 : 1);
  const teto = Math.round(curva.max * (chefeVivo ? 0.45 : 1));
  p.acumulo += taxa * dt;
  let guard = 0;
  while (p.acumulo >= 1 && vivos(p) < teto && guard++ < 8) {
    p.acumulo -= 1;
    const lista = p.fase.horda;
    const id = lista[Math.floor(p.rng() * lista.length)];
    const pos = pontoFora(p);
    nascer(p, id, pos.x, pos.y);
  }
  if (!p.eventos.bando && p.tempo >= 16) {
    p.eventos.bando = true;
    dispararBando(p, p.fase.bando || p.fase.horda[0], 14);
  }
  if (!p.eventos.anel && p.tempo >= 26) {
    p.eventos.anel = true;
    dispararAnel(p, p.fase.horda[0], 16);
  }
  if (!p.eventos.elite && p.tempo >= 18 && p.fase.tipo === "fase") {
    p.eventos.elite = true;
    const pos = pontoFora(p);
    const id = p.fase.horda[p.fase.horda.length - 1];
    nascer(p, id, pos.x, pos.y, { elite: true });
  }
  if ((p.fase.tipo === "chefe" || p.fase.tipo === "lendario") && !p.eventos.chefe && p.tempo >= p.fase.chefeEm) {
    trazerChefe(p);
  }
}
function passoInimigos(p, dt) {
  const j = p.jogador;
  const amortece = Math.exp(-9 * dt);
  const recicla = Math.hypot(p.vista.w, p.vista.h) * 0.85;
  for (const b of p.inimigos) {
    if (b.morrendo >= 0) {
      b.morrendo += dt;
      continue;
    }
    b.idade += dt;
    if (b.queima > 0) {
      b.queima -= dt;
      ferirBicho(p, b, 4 * dt, b.x, b.y, null);
      if (b.morrendo >= 0) continue;
    }
    let vx = 0;
    let vy = 0;
    const fase2 = b.chefe && b.hp < b.hpMax * 0.5 ? 2 : 1;
    if (b.chefe && fase2 === 2 && b.faseChefe === 1) {
      b.faseChefe = 2;
      tremer(p, 5);
    }
    const pressa = b.faseChefe === 2 ? 1.35 : 1;
    if (b.comportamento === "flyby") {
      vx = b.vx;
      vy = b.vy;
      b.ttl -= dt;
      if (b.ttl <= 0) b.morrendo = 0;
    } else if (b.comportamento === "pula") {
      b.ataque -= dt;
      const d = dirPara(b.x, b.y, j.x, j.y);
      const impulso = b.ataque < 0 ? 2.4 : 0.55;
      if (b.ataque < 0) b.ataque = 1.6;
      vx = d.x * b.vel * impulso;
      vy = d.y * b.vel * impulso;
    } else {
      const d = dirPara(b.x, b.y, j.x, j.y);
      vx = d.x * b.vel * pressa;
      vy = d.y * b.vel * pressa;
      if (b.chefe) {
        b.ataque -= dt * (b.faseChefe === 2 ? 1.5 : 1);
        if (b.ataque <= 0) {
          b.ataque = 2.1;
          const onde = p.rng() < 0.5 ? { x: j.x, y: j.y } : { x: j.x + faixa(p.rng, -30, 30), y: j.y + faixa(p.rng, -30, 30) };
          p.zonas.push({ x: onde.x, y: onde.y, r: 28, arma: 0.7, dano: b.dano, sprite: "telegraph" });
        }
      }
    }
    b.x += (vx + b.kx) * dt;
    b.y += (vy + b.ky) * dt;
    b.kx *= amortece;
    b.ky *= amortece;
    if (Math.abs(vx) + Math.abs(vy) > 1) b.dir = dir8(vx, vy);
    if (!b.chefe && b.comportamento !== "flyby" && Math.abs(b.x - j.x) + Math.abs(b.y - j.y) > recicla * 1.3) {
      b.morrendo = 0;
    }
    if (b.ferido > 0) b.ferido -= dt;
  }
  reter(p.inimigos, (b) => b.morrendo < 0.5);
  if (p.chefe && p.chefe.morrendo >= 0.5) p.chefe = null;
  limparGrade(p.grade);
  p.inimigos.forEach((b, i) => {
    if (b.morrendo < 0) inserir(p.grade, i, b.x, b.y);
  });
  separarCorpos(p);
  for (const z of p.zonas) {
    z.arma -= dt;
    if (z.arma <= 0) {
      if (Math.hypot(j.x - z.x, j.y - z.y) < z.r + j.raio) machucarJogador(p, z.dano, { x: z.x, y: z.y });
      estouro(p, z.x, z.y, ["#E2544A", "#FF9D52"], 8, 40);
      z.morta = true;
    }
  }
  reter(p.zonas, (z) => !z.morta);
}
function separarCorpos(p) {
  const horda = p.inimigos;
  const j = p.jogador;
  for (let i = 0; i < horda.length; i++) {
    const e = horda[i];
    if (!e || e.morrendo >= 0) continue;
    consultar(p.grade, e.x, e.y, e.raio * 2, VIZINHOS);
    for (const k of VIZINHOS) {
      if (k === i) continue;
      const o = horda[k];
      if (!o || o.morrendo >= 0) continue;
      const dx2 = e.x - o.x;
      const dy2 = e.y - o.y;
      const min = (e.raio + o.raio) * 0.8;
      const d22 = dx2 * dx2 + dy2 * dy2;
      if (d22 >= min * min || d22 === 0) continue;
      const d = Math.sqrt(d22);
      const empurra = (min - d) / d * (o.massa / (e.massa + o.massa)) * 0.5;
      e.x += dx2 * empurra;
      e.y += dy2 * empurra;
    }
    const dx = e.x - j.x;
    const dy = e.y - j.y;
    const alcance = e.raio + j.raio;
    const d2 = dx * dx + dy * dy;
    if (d2 < alcance * alcance && e.morrendo < 0) {
      const d = Math.sqrt(d2) || 1;
      e.x = j.x + dx / d * alcance;
      e.y = j.y + dy / d * alcance;
      if (e.comportamento !== "flyby" || d2 < e.raio * e.raio) machucarJogador(p, e.dano, e);
    }
  }
}
function acertarRaio(p, x, y, r, dano, golpe2, deX, deY) {
  for (const b of p.inimigos) {
    if (b.morrendo >= 0) continue;
    if (Math.hypot(b.x - x, b.y - y) <= r + b.raio) ferirBicho(p, b, dano, deX, deY, golpe2);
  }
}
function passoGolpes(p, dt) {
  const j = p.jogador;
  for (const g of j.golpes) {
    const def = defGolpe(p.conteudo, g.id);
    if (!def) continue;
    g.cd -= dt;
    if (g.cd > 0) continue;
    const mod = modsAtivos(def, g);
    const dano = (def.dano + (mod.dano || 0)) * (1 + 0.18 * (g.nivel - 1));
    const extra = j.stats.amount + (mod.n || 0);
    g.cd = def.cadencia * j.stats.cooldown;
    const golpe2 = {
      empurrao: def.empurrao + (mod.empurrao || 0),
      queima: !!(def.queima || mod.queima),
      puxa: (def.puxa || 0) + (mod.puxa || 0)
    };
    const n = def.n + extra;
    if (def.tipo === "orbita") {
      for (let i = 0; i < n; i++) {
        p.ataques.push({
          tipo: "orbita",
          ang: i / n * TAU,
          raio: (def.raio + (mod.raio || 0)) * j.stats.area,
          vel: def.vel + (mod.vel || 0),
          dano,
          r: def.hit || 8,
          ttl: def.duracao * j.stats.duration,
          cd: 0,
          golpe: golpe2,
          sprite: def.sprite
        });
      }
    } else if (def.tipo === "tiro" || def.tipo === "volta") {
      const base = Math.atan2(j.dir === 0 ? 1 : 0, 1);
      const frente = dirDe(j.dir);
      for (let i = 0; i < n; i++) {
        const espalha = (i - (n - 1) / 2) * 0.18;
        const ang = Math.atan2(frente.y, frente.x) + espalha;
        const vel = def.vel * j.stats.projectileSpeed;
        p.ataques.push({
          tipo: def.tipo,
          x: j.x,
          y: j.y - 8,
          vx: Math.cos(ang) * vel,
          vy: Math.sin(ang) * vel,
          dano,
          r: (def.hit || 6) * j.stats.area,
          ttl: def.duracao * j.stats.duration,
          atravessa: def.atravessa || 0,
          acertou: /* @__PURE__ */ new Set(),
          golpe: golpe2,
          sprite: def.sprite,
          fase: "ida",
          vel,
          ang
        });
      }
      void base;
    } else if (def.tipo === "aura" || def.tipo === "vortex") {
      p.ataques.push({
        tipo: def.tipo,
        raio: (def.raio + (mod.raio || 0)) * j.stats.area,
        dano,
        r: 10,
        ttl: def.duracao * j.stats.duration,
        cd: 0,
        golpe: golpe2,
        sprite: def.sprite
      });
    }
  }
  for (const a of p.ataques) {
    a.ttl -= dt;
    if (a.tipo === "orbita") {
      a.ang += a.vel * dt;
      a.x = j.x + Math.cos(a.ang) * a.raio;
      a.y = j.y + Math.sin(a.ang) * a.raio;
      a.cd -= dt;
      if (a.cd <= 0) {
        a.cd = 0.32;
        acertarRaio(p, a.x, a.y, a.r, a.dano, a.golpe, j.x, j.y);
      }
    } else if (a.tipo === "tiro") {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      for (const b of p.inimigos) {
        if (b.morrendo >= 0 || a.acertou.has(b.id)) continue;
        if (Math.hypot(b.x - a.x, b.y - a.y) <= a.r + b.raio) {
          a.acertou.add(b.id);
          ferirBicho(p, b, a.dano, a.x - a.vx, a.y - a.vy, a.golpe);
          if (a.acertou.size > a.atravessa) a.ttl = 0;
        }
      }
    } else if (a.tipo === "volta") {
      if (a.fase === "ida") {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (Math.hypot(a.x - j.x, a.y - j.y) > 90 * j.stats.area) a.fase = "volta";
      } else {
        const d = dirPara(a.x, a.y, j.x, j.y);
        a.x += d.x * a.vel * dt;
        a.y += d.y * a.vel * dt;
        if (Math.hypot(a.x - j.x, a.y - j.y) < 12) a.ttl = 0;
      }
      for (const b of p.inimigos) {
        if (b.morrendo >= 0) continue;
        const marca = `${b.id}:${a.fase}`;
        if (a.acertou.has(marca)) continue;
        if (Math.hypot(b.x - a.x, b.y - a.y) <= a.r + b.raio) {
          a.acertou.add(marca);
          ferirBicho(p, b, a.dano, a.x, a.y, a.golpe);
        }
      }
    } else if (a.tipo === "aura" || a.tipo === "vortex") {
      a.cd -= dt;
      if (a.cd <= 0) {
        a.cd = a.tipo === "vortex" ? 0.2 : 0.45;
        for (const b of p.inimigos) {
          if (b.morrendo >= 0) continue;
          if (Math.hypot(b.x - j.x, b.y - j.y) <= a.raio + b.raio) {
            ferirBicho(p, b, a.dano, j.x, j.y, a.golpe);
          }
        }
      }
    }
  }
  reter(p.ataques, (a) => a.ttl > 0);
}
function dirDe(d) {
  const tabela = [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: -1 },
    { x: -1, y: -1 },
    { x: -1, y: 0 },
    { x: -1, y: 1 }
  ];
  const v = tabela[d] || tabela[2];
  const len = Math.hypot(v.x, v.y);
  return { x: v.x / len, y: v.y / len };
}
function passoEspeciais(p, dt, entrada) {
  const j = p.jogador;
  j.especial = Math.max(0, j.especial - dt);
  if (entrada.acao && j.especial <= 0 && p.pausa === "jogo") {
    j.especial = 8;
    tremer(p, 4);
    estouro(p, j.x, j.y, ["#CEB7EF", "#B9ED80", "#FF9D52"], 22, 140);
    acertarRaio(p, j.x, j.y, 78 * j.stats.area, 26 * j.stats.might, { empurrao: 90, queima: false, puxa: 0 }, j.x, j.y);
    if (p.conteudo.pesca) pescar(p, true);
  }
  if (p.conteudo.pesca && entrada.acaoSegurada) pescar(p, false);
}
function pescar(p, forcar) {
  const j = p.jogador;
  for (const c of p.cardumes) {
    if (!c.vivo) continue;
    if (Math.hypot(c.x - j.x, c.y - j.y) < j.raio + c.raio + (forcar ? 10 : 18)) {
      c.vivo = false;
      const agua = p.fase.agua || p.fase.regiao;
      const novos = p.conteudo.peixes.filter((peixe2) => peixe2.agua === agua && !p.album.includes(peixe2.id));
      const peixe = novos.length ? novos[Math.floor(p.rng() * novos.length)] : null;
      if (peixe) p.album.push(peixe.id);
      ganharXp(p, 4);
      estouro(p, c.x, c.y, ["#6CCBBE", "#F5F2E8"], 8, 40);
      if (p.album.length >= p.conteudo.peixes.length) p.barcoDourado = true;
    }
  }
}
function passoMundo(p, dt, entrada) {
  const j = p.jogador;
  const dif = DIFICULDADE[p.modo];
  const andando = Math.hypot(entrada.x, entrada.y) > 0.05;
  if (andando) {
    const len = Math.hypot(entrada.x, entrada.y) || 1;
    const vx = entrada.x / len * j.stats.speed;
    const vy = entrada.y / len * j.stats.speed;
    j.x += (vx + j.kx) * dt;
    j.y += (vy + j.ky) * dt;
    j.dir = dir8(entrada.x, entrada.y);
    j.andando = true;
    j.andou += Math.hypot(vx, vy) * dt;
  } else {
    j.x += j.kx * dt;
    j.y += j.ky * dt;
    j.andando = false;
  }
  j.kx *= Math.exp(-9 * dt);
  j.ky *= Math.exp(-9 * dt);
  j.iframes = Math.max(0, j.iframes - dt);
  if (j.ferido > 0) j.ferido -= dt;
  j.hp = Math.min(j.stats.hpMax, j.hp + j.stats.regen * dt);
  if (j.hp < dif.piso) j.hp = dif.piso;
  j.anim += dt;
  p.camera.x = j.x - p.vista.w / 2;
  p.camera.y = j.y - p.vista.h / 2;
  p.bioma = biomaEm(p.seed, j.x, j.y, p.fase.biomas);
  for (const g of p.gemas) {
    if (!g.viva) continue;
    const d = Math.hypot(g.x - j.x, g.y - j.y);
    if (d < j.stats.magnet) {
      const passo = (140 + j.stats.magnet) * dt;
      if (d <= passo || d < j.raio + 6) {
        g.viva = false;
        ganharXp(p, g.xp);
      } else {
        g.x += (j.x - g.x) / d * passo;
        g.y += (j.y - g.y) / d * passo;
      }
    }
  }
  reter(p.gemas, (g) => g.viva);
  if (p.conteudo.pesca && p.rng() < dt / 5) {
    const ang = faixa(p.rng, 0, TAU);
    const dist = faixa(p.rng, 40, 120);
    p.cardumes.push({ x: j.x + Math.cos(ang) * dist, y: j.y + Math.sin(ang) * dist, raio: 12, vivo: true });
  }
  reter(p.cardumes, (c) => c.vivo && Math.hypot(c.x - j.x, c.y - j.y) < 500);
  const amortece = Math.exp(-4 * dt);
  for (const part of p.particulas) {
    part.vida += dt;
    part.vy += part.grav * dt;
    part.vx *= Math.exp(-part.arrasto * dt);
    part.vy *= Math.exp(-part.arrasto * dt);
    part.x += part.vx * dt;
    part.y += part.vy * dt;
  }
  reter(p.particulas, (part) => part.vida < part.ttl);
  for (const t of p.textos) {
    t.vida += dt;
    t.y += t.vy * dt;
  }
  reter(p.textos, (t) => t.vida < 0.7);
  p.tremor *= amortece;
  if (p.tremor < 0.2) p.tremor = 0;
  void amortece;
}
function checarFim(p) {
  if (p.pausa !== "jogo") return;
  if (p.fase.tipo === "fase" && p.tempo >= p.fase.duracao) p.pausa = "vitoria";
  if ((p.fase.tipo === "chefe" || p.fase.tipo === "lendario") && p.eventos.chefe && !p.chefe) p.pausa = "vitoria";
}
function criarPartida(conteudo, opcoes = {}) {
  const fase2 = conteudo.fases[opcoes.fase ?? 0];
  const modo = opcoes.modo === "normal" ? "normal" : "facil";
  const seed = opcoes.seed ?? 20261115;
  const p = {
    conteudo,
    fase: fase2,
    modo,
    seed,
    rng: criarRng(seed),
    vista: opcoes.vista || { w: 480, h: 320 },
    camera: { x: 0, y: 0 },
    tempo: 0,
    seq: 1,
    pausa: "jogo",
    tremor: 0,
    bioma: fase2.biomas[0],
    acumulo: 0,
    eventos: { bando: false, anel: false, elite: false, chefe: false },
    inimigos: [],
    ataques: [],
    gemas: [],
    cardumes: [],
    zonas: [],
    particulas: [],
    textos: [],
    ofertas: [],
    chefe: null,
    derrotados: 0,
    album: opcoes.album ? [...opcoes.album] : [],
    barcoDourado: !!opcoes.barcoDourado,
    grade: criarGrade(32),
    jogador: {
      x: 0,
      y: 0,
      kx: 0,
      ky: 0,
      dir: 0,
      andando: false,
      andou: 0,
      anim: 0,
      hp: 100,
      nivel: 1,
      xp: 0,
      xpProx: xpPara(1),
      iframes: 0,
      ferido: 0,
      raio: conteudo.pesca ? 12 : 8,
      golpes: [{ id: conteudo.inicial, nivel: 1, cd: 0.15, caminho: 0 }],
      itens: [],
      pendentes: 0,
      especial: 2,
      stats: { ...BASE }
    }
  };
  aplicarStats(p);
  p.jogador.hp = p.jogador.stats.hpMax;
  if (fase2.tipo === "fim") p.pausa = "fim";
  else {
    p.jogador.pendentes = 1;
    abrirCartas(p);
  }
  return p;
}
function tick(p, dt, entrada = { x: 0, y: 0, acao: false, acaoSegurada: false }) {
  if (!p || p.pausa === "cartas" || p.pausa === "pausa" || p.pausa === "derrota" || p.pausa === "vitoria" || p.pausa === "fim") return;
  const passo = Math.min(dt, 0.05);
  p.tempo += passo;
  passoMundo(p, passo, entrada);
  if (p.pausa !== "jogo") return;
  passoSpawner(p, passo);
  passoInimigos(p, passo);
  if (p.pausa !== "jogo") return;
  passoGolpes(p, passo);
  passoEspeciais(p, passo, entrada);
  checarFim(p);
}

// src/casca/jogo.js
var TILE = 16;
async function iniciar(conteudo) {
  const root = document.getElementById("jogo");
  const tela = document.getElementById("tela");
  const ctx = tela.getContext("2d");
  const sprites = await fetch("arte/sprites.json").then((r) => r.json());
  const motor = await fetch("arte/motor.json").then((r) => r.json());
  const imagens = {};
  async function carga(chave2, src) {
    if (!src || imagens[chave2]) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    try {
      await img.decode();
    } catch {
    }
    if (img.naturalWidth) imagens[chave2] = img;
  }
  await Promise.all([
    ...Object.entries(sprites).map(([id, sp]) => carga(id, sp.src)),
    ...Object.entries(motor).flatMap(([id, sp]) => [
      ...Object.entries(sp.anims).map(([anim, folha]) => carga(`${id}:${anim}`, folha.src)),
      carga(`${id}:portrait`, sp.portrait)
    ])
  ]);
  let partida = null;
  let save = lerSave(conteudo);
  let pronto = true;
  let eixo = { x: 0, y: 0 };
  let acaoPulso = false;
  let acaoSegurada = false;
  let vista = encaixarVista(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  let quadros = 0;
  let jogado = 0;
  const stick = { ativo: false, id: null, origem: { x: 80, y: 80 }, ponteiro: { x: 80, y: 80 } };
  const hud = document.getElementById("hud");
  const mapa = document.getElementById("mapa");
  const levelup = document.getElementById("levelup");
  const vitoria = document.getElementById("vitoria");
  const derrota = document.getElementById("derrota");
  const fim = document.getElementById("fim");
  const pausa = document.getElementById("pausa");
  const joystickEl = document.getElementById("joystick");
  const knob = document.getElementById("knob");
  function mostrar(el, sim) {
    el.hidden = !sim;
  }
  function lerSave(c) {
    const chave2 = `${c.slug}:save`;
    try {
      const bruto = JSON.parse(localStorage.getItem(chave2) || "null");
      if (bruto && bruto.schemaVersion === 2) return bruto;
    } catch {
    }
    return { schemaVersion: 2, modo: "facil", aberta: 1, vencidas: [], album: [], barcoDourado: false };
  }
  function gravar() {
    save.album = partida ? partida.album : save.album;
    save.barcoDourado = partida ? partida.barcoDourado : save.barcoDourado;
    localStorage.setItem(`${conteudo.slug}:save`, JSON.stringify(save));
  }
  function entrar(indice) {
    partida = criarPartida(conteudo, {
      fase: indice,
      modo: save.modo,
      seed: (Date.now() ^ indice * 997) >>> 0,
      vista: { w: vista.w, h: vista.h },
      album: save.album,
      barcoDourado: save.barcoDourado
    });
    mostrar(mapa, false);
    mostrar(vitoria, false);
    mostrar(derrota, false);
    mostrar(fim, partida.pausa === "fim");
    mostrar(levelup, partida.pausa === "cartas");
    mostrar(pausa, false);
    if (partida.pausa === "cartas") pintarCartas();
    if (partida.pausa === "fim") pintarFim();
  }
  function pintarNos() {
    const caixa = document.getElementById("nos");
    const palco = document.getElementById("palco");
    caixa.replaceChildren();
    const largura = palco.clientWidth || vista.w * vista.cssScale;
    const altura = palco.clientHeight || vista.h * vista.cssScale;
    const escala = Math.min(largura / conteudo.mapa.w, altura / conteudo.mapa.h);
    for (const fase2 of conteudo.fases) {
      const aberta = fase2.ordem <= save.aberta;
      const feita = save.vencidas.includes(fase2.ordem);
      const especial = conteudo.noEspecial[fase2.ordem] || conteudo.nos[fase2.regiao] || conteudo.nos[fase2.agua] || conteudo.nos.rio || conteudo.nos.pedra;
      const estado = !aberta ? "travada" : feita ? "vencida" : "aberta";
      const botao2 = document.createElement("button");
      botao2.type = "button";
      botao2.id = `no-${fase2.ordem}`;
      botao2.dataset.alvo = "1";
      botao2.disabled = !aberta;
      botao2.style.left = `${fase2.x * escala - 24}px`;
      botao2.style.top = `${fase2.y * escala - 24}px`;
      botao2.setAttribute("aria-label", `Fase ${fase2.ordem}`);
      const img = document.createElement("img");
      img.alt = "";
      const spec = especial && sprites[especial[estado]];
      if (spec) img.src = spec.src;
      botao2.append(img);
      botao2.addEventListener("click", () => {
        if (aberta) entrar(fase2.ordem - 1);
      });
      caixa.append(botao2);
    }
    const marca = document.getElementById("marca");
    const atual = conteudo.fases.find((f) => f.ordem === save.aberta) || conteudo.fases[0];
    marca.style.left = `${atual.x * escala - 16}px`;
    marca.style.top = `${atual.y * escala - 52}px`;
    marca.src = sprites[conteudo.marcador].src;
  }
  function pintarCartas() {
    const caixa = document.getElementById("cartas");
    caixa.replaceChildren();
    partida.ofertas.forEach((carta, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.id = `carta-${i}`;
      b.dataset.alvo = "1";
      b.className = "carta";
      const img = document.createElement("img");
      img.alt = "";
      const spec = sprites[carta.icone] || sprites[conteudo.golpes[0].icone];
      if (spec) img.src = spec.src;
      const nome = document.createElement("strong");
      nome.textContent = carta.nome;
      const texto = document.createElement("span");
      texto.textContent = carta.texto;
      b.append(img, nome, texto);
      b.addEventListener("click", () => {
        escolherCarta(partida, i);
        if (partida.pausa === "cartas") pintarCartas();
        else mostrar(levelup, false);
      });
      caixa.append(b);
    });
    mostrar(levelup, true);
  }
  function pintarFim() {
    document.getElementById("fimTitulo").textContent = conteudo.fimTitulo;
    document.getElementById("fimTexto").textContent = conteudo.fimTexto;
    const img = document.getElementById("fimSprite");
    img.src = sprites[conteudo.fimSprite].src;
    mostrar(fim, true);
    if (!save.vencidas.includes(partida.fase.ordem)) {
      save.vencidas.push(partida.fase.ordem);
      save.aberta = Math.max(save.aberta, partida.fase.ordem);
      gravar();
    }
  }
  function registrarVitoria() {
    const ordem = partida.fase.ordem;
    if (!save.vencidas.includes(ordem)) save.vencidas.push(ordem);
    save.aberta = Math.max(save.aberta, ordem + 1);
    gravar();
    mostrar(vitoria, true);
  }
  function sincronizarHud() {
    if (!partida) return;
    document.getElementById("nivel").textContent = String(partida.jogador.nivel);
    document.getElementById("relogio").textContent = formatarTempo(partida.tempo);
    document.getElementById("barraXp").style.width = `${Math.max(0, Math.min(100, partida.jogador.xp / partida.jogador.xpProx * 100))}%`;
    const vidas = document.getElementById("vidas");
    const cheias = Math.round(partida.jogador.hp / partida.jogador.stats.hpMax * 5);
    vidas.replaceChildren();
    for (let i = 0; i < 5; i++) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = sprites[i < cheias ? conteudo.vida : conteudo.vidaVazia].src;
      vidas.append(img);
    }
    const golpes2 = document.getElementById("golpes");
    golpes2.replaceChildren();
    for (let i = 0; i < 6; i++) {
      const g = partida.jogador.golpes[i];
      const img = document.createElement("img");
      img.alt = "";
      if (g) {
        const def = conteudo.golpes.find((d) => d.id === g.id);
        if (def && sprites[def.icone]) img.src = sprites[def.icone].src;
      }
      golpes2.append(img);
    }
    const itens = document.getElementById("itens");
    itens.replaceChildren();
    for (let i = 0; i < 6; i++) {
      const it = partida.jogador.itens[i];
      const img = document.createElement("img");
      img.alt = "";
      if (it) {
        const def = conteudo.itens.find((d) => d.id === it.id);
        if (def && sprites[def.icone]) img.src = sprites[def.icone].src;
      }
      itens.append(img);
    }
    const med = document.getElementById("medChefe");
    if (partida.chefe && partida.chefe.morrendo < 0) {
      med.hidden = false;
      document.getElementById("barraChefe").style.width = `${partida.chefe.hp / partida.chefe.hpMax * 100}%`;
    } else med.hidden = true;
    const album = document.getElementById("album");
    if (conteudo.pesca) album.textContent = String(partida.album.length);
    if (partida.pausa === "cartas" && levelup.hidden) pintarCartas();
    if (partida.pausa === "vitoria" && vitoria.hidden) registrarVitoria();
    if (partida.pausa === "derrota") mostrar(derrota, true);
    if (partida.pausa === "fim") mostrar(fim, true);
  }
  function coluna(duracoes, tempo) {
    const total = duracoes.reduce((a, b) => a + b, 0) || 1;
    const t = Math.floor(Math.max(0, tempo) * 60) % total;
    let acc = 0;
    for (let i = 0; i < duracoes.length; i++) {
      acc += duracoes[i];
      if (t < acc) return i;
    }
    return 0;
  }
  function desenharMotor(id, x, y, dir, tempo, anim) {
    const sp = motor[id];
    const folha = sp && sp.anims[anim];
    const img = imagens[`${id}:${anim}`];
    if (!folha || !img) return false;
    const col = coluna(folha.duracoes, tempo) % folha.quadros;
    const linha = folha.linhas === 1 ? 0 : dir % 8;
    const pe = sp.body.footY;
    ctx.fillStyle = "rgba(25,51,55,0.28)";
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), Math.max(4, sp.body.bodyW * 0.45), 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(
      img,
      col * folha.frameW,
      linha * folha.frameH,
      folha.frameW,
      folha.frameH,
      Math.round(x - folha.frameW / 2),
      Math.round(y - (folha.frameH / 2 + pe)),
      folha.frameW,
      folha.frameH
    );
    ctx.restore();
    return true;
  }
  function desenharSprite(id, x, y, dir, tempo, altura, dourado) {
    if (!dourado && desenharMotor(id, x, y, dir, tempo, "Walk")) return;
    const sp = sprites[id];
    const img = imagens[id];
    if (!sp || !img) return;
    const escala = altura / sp.frameH;
    const dw = sp.frameW * escala;
    const dh = altura;
    let linha = 0;
    let flip = false;
    if (sp.linhas >= 5 && sp.espelho) {
      const mapa2 = [0, 1, 2, 3, 4, 3, 2, 1];
      linha = mapa2[dir] || 0;
      flip = dir >= 5;
    } else if (dir >= 5) flip = true;
    const durs = sp.duracoes && sp.duracoes.length ? sp.duracoes : [8];
    const col = coluna(durs, tempo) % (sp.colunas || 1);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    if (dourado) ctx.filter = "sepia(1) saturate(3)";
    ctx.drawImage(img, col * sp.frameW, linha * sp.frameH, sp.frameW, sp.frameH, Math.round(-dw / 2), Math.round(-dh), Math.round(dw), Math.round(dh));
    ctx.restore();
  }
  function desenhar() {
    if (!partida) return;
    partida.vista.w = vista.w;
    partida.vista.h = vista.h;
    const cssW = Math.round(vista.w * vista.cssScale);
    const cssH = Math.round(vista.h * vista.cssScale);
    if (tela.width !== vista.w) {
      tela.width = vista.w;
      tela.height = vista.h;
      tela.style.width = `${cssW}px`;
      tela.style.height = `${cssH}px`;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const sx = partida.tremor ? Math.sin(partida.tempo * 40) * partida.tremor : 0;
    const sy = partida.tremor ? Math.cos(partida.tempo * 35) * partida.tremor : 0;
    const camX = partida.camera.x + sx;
    const camY = partida.camera.y + sy;
    ctx.fillStyle = conteudo.cores[partida.bioma] || "#8FCB6B";
    ctx.fillRect(0, 0, vista.w, vista.h);
    const x0 = Math.floor(camX / TILE) - 1;
    const y0 = Math.floor(camY / TILE) - 1;
    const x1 = Math.ceil((camX + vista.w) / TILE) + 1;
    const y1 = Math.ceil((camY + vista.h) / TILE) + 1;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const bioma = biomaEm(partida.seed, tx * TILE, ty * TILE, partida.fase.biomas);
        const id = partida.fase.chao && partida.fase.chao[bioma] || null;
        const px = Math.round(tx * TILE - camX);
        const py = Math.round(ty * TILE - camY);
        if (id && imagens[id]) {
          const sp = sprites[id];
          const variacao = (tx * 13 + ty * 7 & 3) === 0 && sprites[`${id}-var`] ? `${id}-var` : id;
          const qual = imagens[variacao] ? variacao : id;
          const spv = sprites[qual];
          ctx.drawImage(imagens[qual], 0, 0, spv.frameW, spv.frameH, px, py, TILE, TILE);
          void sp;
        } else {
          ctx.fillStyle = conteudo.cores[bioma] || "#8FCB6B";
          ctx.fillRect(px, py, TILE, TILE);
        }
      }
    }
    const mundo = (wx, wy) => [wx - camX, wy - camY];
    for (const g of partida.gemas) {
      const [x, y] = mundo(g.x, g.y);
      desenharSprite(conteudo.gema[g.faixa - 1] || conteudo.gema[0], x, y + 6, 0, partida.tempo, 12, false);
    }
    for (const c of partida.cardumes) {
      const [x, y] = mundo(c.x, c.y);
      desenharSprite("cardume", x, y + 8, 0, 0, 14, false);
    }
    for (const z of partida.zonas) {
      const [x, y] = mundo(z.x, z.y);
      ctx.strokeStyle = "#E2544A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, z.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const a of partida.ataques) {
      const x = a.x != null ? a.x : partida.jogador.x;
      const y = a.y != null ? a.y : partida.jogador.y;
      const [sx2, sy2] = mundo(x, y);
      if (a.sprite) desenharSprite(a.sprite, sx2, sy2 + 6, 2, partida.tempo, 12, false);
      else {
        ctx.fillStyle = "#FF9D52";
        ctx.fillRect(sx2 - 3, sy2 - 3, 6, 6);
      }
    }
    const lista = [...partida.inimigos].sort((a, b) => a.y - b.y);
    for (const b of lista) {
      const [x, y] = mundo(b.x, b.y);
      if (b.morrendo >= 0) {
        if (!desenharMotor(b.sprite, x, y, b.dir, b.morrendo, "Sumico")) {
          desenharSprite(b.sprite, x, y, b.dir, b.idade, b.altura, false);
        }
        continue;
      }
      const anim = b.ferido > 0 ? "Hurt" : "Walk";
      if (!desenharMotor(b.sprite, x, y, b.dir, b.idade, anim)) {
        desenharSprite(b.sprite, x, y, b.dir, b.idade, b.altura, false);
      }
    }
    const j = partida.jogador;
    const [jx, jy] = mundo(j.x, j.y);
    const animHeroi = j.ferido > 0 ? "Hurt" : j.andando ? "Walk" : "Idle";
    if (!desenharMotor(conteudo.heroi, jx, jy, j.dir, j.anim, animHeroi)) {
      const idHeroi = j.andando ? conteudo.heroiAnda : conteudo.heroiParado;
      desenharSprite(idHeroi, jx, jy, j.dir, j.anim, conteudo.heroiAltura, !!partida.barcoDourado);
    }
    for (const part of partida.particulas) {
      const [x, y] = mundo(part.x, part.y);
      ctx.globalAlpha = 1 - part.vida / part.ttl;
      ctx.fillStyle = part.cor;
      ctx.fillRect(x, y, part.tam, part.tam);
      ctx.globalAlpha = 1;
    }
    ctx.font = "700 10px Courier New, monospace";
    ctx.textAlign = "center";
    for (const t of partida.textos) {
      const [x, y] = mundo(t.x, t.y);
      ctx.fillStyle = t.cor;
      ctx.fillText(t.texto, x, y);
    }
    const mini = document.getElementById("minimapa");
    const mx = mini.getContext("2d");
    mx.imageSmoothingEnabled = false;
    mx.fillStyle = "#193337";
    mx.fillRect(0, 0, 72, 72);
    mx.fillStyle = "#B9ED80";
    mx.fillRect(35, 35, 3, 3);
    mx.fillStyle = "#E2544A";
    for (const b of partida.inimigos) {
      const dx = (b.x - j.x) / 18 + 36;
      const dy = (b.y - j.y) / 18 + 36;
      if (dx > 0 && dy > 0 && dx < 72 && dy < 72) mx.fillRect(dx, dy, 2, 2);
    }
    sincronizarHud();
  }
  function ajustar() {
    const visual = window.visualViewport;
    const caixa = visual && visual.width >= 100 ? visual : { width: window.innerWidth, height: window.innerHeight };
    vista = encaixarVista(caixa.width, caixa.height, window.devicePixelRatio || 1);
    const jogo = document.getElementById("jogo");
    jogo.style.width = `${Math.round(vista.w * vista.cssScale)}px`;
    jogo.style.height = `${Math.round(vista.h * vista.cssScale)}px`;
    if (mapa && !mapa.hidden) pintarNos();
  }
  function local(ev) {
    const r = root.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function botao(alvo) {
    return alvo.closest("button, a");
  }
  root.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    if (botao(ev.target)) return;
    if (mapa && !mapa.hidden) return;
    const p = local(ev);
    stick.ativo = true;
    stick.id = ev.pointerId;
    stick.origem = p;
    stick.ponteiro = p;
    try {
      root.setPointerCapture(ev.pointerId);
    } catch {
    }
    posicionarStick();
  });
  root.addEventListener("pointermove", (ev) => {
    if (!stick.ativo || ev.pointerId !== stick.id) return;
    stick.ponteiro = local(ev);
    const s = joystick(stick.origem, stick.ponteiro);
    stick.origem = s.origin;
    eixo = s.vec;
    window.__eixo = eixo;
    posicionarStick();
  });
  function soltar(ev) {
    if (stick.id != null && ev.pointerId !== stick.id) return;
    stick.ativo = false;
    stick.id = null;
    eixo = { x: 0, y: 0 };
    posicionarStick();
  }
  root.addEventListener("pointerup", soltar);
  root.addEventListener("pointercancel", soltar);
  function posicionarStick() {
    const s = joystick(stick.origem, stick.ativo ? stick.ponteiro : stick.origem);
    joystickEl.style.left = `${s.origin.x - 60}px`;
    joystickEl.style.top = `${s.origin.y - 60}px`;
    joystickEl.style.bottom = "auto";
    knob.style.left = `${60 + (s.knob.x - s.origin.x) - 24}px`;
    knob.style.top = `${60 + (s.knob.y - s.origin.y) - 24}px`;
  }
  document.getElementById("btnAcao").addEventListener("pointerdown", (ev) => {
    ev.stopPropagation();
    acaoSegurada = true;
    acaoPulso = true;
  });
  document.getElementById("btnAcao").addEventListener("pointerup", () => {
    acaoSegurada = false;
  });
  document.getElementById("btnAcao").addEventListener("pointercancel", () => {
    acaoSegurada = false;
  });
  document.getElementById("btnPausa").addEventListener("click", () => {
    if (!partida || partida.pausa === "fim") return;
    if (partida.pausa === "jogo") {
      partida.pausa = "pausa";
      mostrar(pausa, true);
    } else if (partida.pausa === "pausa") {
      partida.pausa = "jogo";
      mostrar(pausa, false);
    }
  });
  document.getElementById("btnContinuar").addEventListener("click", () => {
    if (partida && partida.pausa === "pausa") {
      partida.pausa = "jogo";
      mostrar(pausa, false);
    }
  });
  document.getElementById("btnRecemecar").addEventListener("click", () => {
    if (partida) entrar(partida.fase.ordem - 1);
  });
  document.getElementById("btnMapaPausa").addEventListener("click", voltarMapa);
  document.getElementById("btnProxima").addEventListener("click", voltarMapa);
  document.getElementById("btnDeNovo").addEventListener("click", () => partida && entrar(partida.fase.ordem - 1));
  document.getElementById("btnFimMapa").addEventListener("click", voltarMapa);
  document.getElementById("btnFacil").addEventListener("click", () => {
    save.modo = "facil";
    gravar();
    marcarModo();
  });
  document.getElementById("btnNormal").addEventListener("click", () => {
    save.modo = "normal";
    gravar();
    marcarModo();
  });
  function voltarMapa() {
    mostrar(vitoria, false);
    mostrar(derrota, false);
    mostrar(fim, false);
    mostrar(pausa, false);
    mostrar(levelup, false);
    partida = null;
    mostrar(mapa, true);
    pintarNos();
  }
  function marcarModo() {
    document.getElementById("btnFacil").setAttribute("aria-pressed", save.modo === "facil" ? "true" : "false");
    document.getElementById("btnNormal").setAttribute("aria-pressed", save.modo === "normal" ? "true" : "false");
  }
  document.getElementById("btnTela").addEventListener("click", () => {
    alternarTelaCheia(root);
  });
  document.addEventListener("fullscreenchange", atualizarTela);
  document.addEventListener("webkitfullscreenchange", atualizarTela);
  function atualizarTela() {
    const cheia = !!(document.fullscreenElement || document.webkitFullscreenElement || root.classList.contains("cheia-fallback"));
    const img = document.querySelector("#btnTela img");
    if (img) img.src = sprites[cheia ? conteudo.controles.sair : conteudo.controles.tela].src;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && partida && partida.pausa === "jogo") {
      partida.pausa = "pausa";
      partida._suspenso = true;
      mostrar(pausa, true);
    }
  });
  function alternarTelaCheia(el) {
    const atual = document.fullscreenElement || document.webkitFullscreenElement;
    if (atual) {
      const sair = document.exitFullscreen || document.webkitExitFullscreen;
      if (sair) return sair.call(document);
    }
    const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
    if (pedir) return pedir.call(el);
    el.classList.toggle("cheia-fallback");
    atualizarTela();
    return Promise.resolve();
  }
  const api = {
    get estado() {
      return partida;
    },
    get save() {
      return save;
    },
    get jogado() {
      return jogado;
    },
    get quadros() {
      return quadros;
    },
    CONFIG: conteudo.config,
    conteudo,
    atlasPronto: () => pronto,
    definirEixo(x, y) {
      eixo = { x, y };
    },
    ganharXp(n) {
      if (partida) ganharXp(partida, n);
    },
    trazerChefe() {
      return partida ? trazerChefe(partida) : null;
    },
    escolher(i) {
      if (partida) {
        escolherCarta(partida, i);
        if (partida.pausa !== "cartas") mostrar(levelup, false);
      }
    },
    desenhar,
    simular(seg) {
      if (!partida) return;
      const n = Math.max(1, Math.round(seg / (1 / 60)));
      const pedaco = seg / n;
      for (let i = 0; i < n; i++) {
        const pulso = acaoPulso;
        acaoPulso = false;
        tick(partida, pedaco, { x: eixo.x, y: eixo.y, acao: pulso, acaoSegurada });
      }
      desenhar();
    },
    entrar,
    alternarTelaCheia
  };
  window[conteudo.api] = api;
  window.__jogo = api;
  marcarModo();
  mostrar(mapa, true);
  if (!conteudo.pesca) document.getElementById("album").hidden = true;
  const retrato = document.getElementById("retrato");
  if (retrato && motor[conteudo.heroi] && motor[conteudo.heroi].portrait) retrato.src = motor[conteudo.heroi].portrait;
  ajustar();
  stick.origem = { x: 96, y: Math.max(160, vista.h * vista.cssScale - 96) };
  stick.ponteiro = stick.origem;
  posicionarStick();
  pintarNos();
  window.addEventListener("resize", ajustar);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", ajustar);
  let ultimo = performance.now();
  function quadro(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1e3);
    ultimo = agora;
    quadros++;
    if (partida && partida.pausa === "jogo" && !document.hidden) {
      const pulso = acaoPulso;
      acaoPulso = false;
      tick(partida, dt, { x: eixo.x, y: eixo.y, acao: pulso, acaoSegurada });
      jogado += dt;
    }
    if (partida) desenhar();
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
  posicionarStick();
}

// src/conteudo/comun.js
function bifurca(a, b, c, d) {
  return {
    4: [
      { nome: a.nome, texto: a.texto, mod: a.mod },
      { nome: b.nome, texto: b.texto, mod: b.mod }
    ],
    7: [
      { nome: c.nome, texto: c.texto, mod: c.mod },
      { nome: d.nome, texto: d.texto, mod: d.mod }
    ]
  };
}
var ITENS_COMUNS = [
  { id: "bota", nome: "Bota leve", texto: "O passo fica mais r\xE1pido.", icone: "icone-vida", soma: { speed: 8 } },
  { id: "ima", nome: "\xCDm\xE3", texto: "A experi\xEAncia vem de mais longe.", icone: "xp-2", soma: { magnet: 22 } },
  { id: "escudo", nome: "Escudo", texto: "Os tombos doem menos.", icone: "icone-vida", soma: { armor: 0.08 } },
  { id: "coracao", nome: "Cora\xE7\xE3o", texto: "Cabe mais vida.", icone: "icone-vida", soma: { hpMax: 18 } },
  { id: "amuleto", nome: "Amuleto", texto: "Os golpes batem mais forte.", icone: "icone-lasca", soma: { might: 0.12 } },
  { id: "relogio", nome: "Rel\xF3gio", texto: "Os golpes voltam mais cedo.", icone: "icone-faisca", multiplica: { cooldown: 0.9 } },
  { id: "mochila", nome: "Mochila", texto: "A \xE1rea dos golpes cresce.", icone: "icone-lanca", soma: { area: 0.12 } },
  { id: "broche", nome: "Broche", texto: "A vida volta sozinha, devagar.", icone: "icone-fogueira-carta", soma: { regen: 0.35 } },
  { id: "anel", nome: "Anel", texto: "Solta mais um proj\xE9til.", icone: "lasca", soma: { amount: 1 } },
  { id: "capa", nome: "Capa", texto: "Os golpes duram mais.", icone: "icone-lanca", soma: { duration: 0.15 } }
];
function no(ordem, regiao, tipo, x, y, extra) {
  return { ordem, regiao, tipo, x, y, ...extra };
}

// src/conteudo/planeta.js
var golpe = (id, nome, texto, icone, sprite, tipo, resto) => ({
  id,
  nome,
  texto,
  icone,
  sprite,
  tipo,
  dano: 8,
  cadencia: 1.05,
  duracao: 2.4,
  n: 1,
  raio: 36,
  vel: 2.2,
  hit: 7,
  empurrao: 40,
  bifurca: bifurca(
    { nome: `${nome} largo`, texto: "Alcan\xE7a mais longe.", mod: { raio: 14 } },
    { nome: `${nome} quente`, texto: "Queima quem encosta.", mod: { queima: true } },
    { nome: `${nome} pesado`, texto: "Empurra com for\xE7a.", mod: { empurrao: 50, dano: 4 } },
    { nome: `${nome} duplo`, texto: "Solta mais um.", mod: { n: 1 } }
  ),
  ...resto
});
var golpes = [
  golpe("lasca", "Lasca", "Pedras giram em volta.", "icone-lasca", "lasca", "orbita", { dano: 7, n: 3, raio: 40, vel: 2.4, cadencia: 8, duracao: 6 }),
  golpe("funda", "Funda", "Uma pedra voa para a frente.", "icone-lasca", "pedregulho", "tiro", { dano: 12, vel: 190, cadencia: 0.85, duracao: 1.2, hit: 6 }),
  golpe("lanca", "Lan\xE7a", "Atravessa quem est\xE1 na fila.", "icone-lanca", "lanca", "tiro", { dano: 11, vel: 220, atravessa: 4, cadencia: 1.1, duracao: 0.8 }),
  golpe("machado", "Machado", "Um arco largo e devagar.", "icone-lanca", "lanca", "orbita", { dano: 14, n: 1, raio: 48, vel: 1.4, cadencia: 3.2, duracao: 2.2 }),
  golpe("tocha", "Tocha", "Queima em volta do Samuel.", "icone-fogueira-carta", "faisca", "aura", { dano: 6, raio: 42, cadencia: 5, duracao: 4, queima: true }),
  golpe("faisca", "Fa\xEDsca", "Um risco r\xE1pido.", "icone-faisca", "faisca", "tiro", { dano: 9, vel: 260, n: 2, cadencia: 0.7, duracao: 0.6, hit: 5 }),
  golpe("pedregulho", "Pedregulho", "Devagar e pesado.", "pedregulho", "pedregulho", "tiro", { dano: 22, vel: 120, empurrao: 80, cadencia: 1.6, duracao: 1.4, hit: 10 }),
  golpe("bumerangue", "Bumerangue", "Vai e volta.", "icone-lasca", "lasca", "volta", { dano: 10, vel: 160, cadencia: 1.3, duracao: 2.4 }),
  golpe("redemoinho", "Redemoinho", "Puxa os bichos para perto.", "icone-faisca", "faisca", "vortex", { dano: 5, raio: 50, puxa: 90, cadencia: 6, duracao: 3.5 }),
  golpe("estilingue", "Estilingue", "Tr\xEAs pedrinhas de uma vez.", "icone-lasca", "pedregulho", "tiro", { dano: 7, vel: 200, n: 3, cadencia: 1.15, duracao: 0.9 }),
  golpe("fogueira", "Fogueira", "Um c\xEDrculo de calor.", "icone-fogueira-carta", "faisca", "aura", { dano: 8, raio: 34, queima: true, cadencia: 7, duracao: 5 }),
  golpe("marreta", "Marreta", "Uma pancada que empurra.", "icone-lanca", "pedregulho", "tiro", { dano: 18, vel: 150, empurrao: 120, cadencia: 1.4, duracao: 0.7, hit: 12 })
];
var bicho = (sprite, hp, vel, dano, xp, massa, raio, comportamento, extra) => ({
  sprite,
  hp,
  vel,
  dano,
  xp,
  massa,
  raio,
  comportamento,
  altura: raio * 2.2,
  ...extra
});
var inimigos = {
  "seixo-vivo": bicho("seixo-vivo", 22, 28, 7, 2, 1.2, 9),
  "lobo-da-pedra": bicho("lobo-da-pedra", 16, 52, 8, 2, 0.85, 9),
  enxame: bicho("enxame", 8, 70, 5, 1, 0.45, 6),
  mamute: bicho("mamute", 48, 22, 11, 4, 2.4, 12),
  "guerreiro-de-bronze": bicho("guerreiro-de-bronze", 28, 42, 9, 3, 1.1, 9),
  escorpiao: bicho("escorpiao", 24, 38, 12, 3, 1, 8),
  "golem-de-barro": bicho("golem-de-barro", 70, 22, 10, 5, 2.6, 12),
  "caranguejo-gigante": bicho("caranguejo-gigante", 36, 34, 10, 3, 1.5, 11),
  "soldado-de-ferro": bicho("soldado-de-ferro", 34, 40, 11, 3, 1.3, 9),
  catapulta: bicho("catapulta", 40, 26, 12, 4, 1.8, 10),
  "lobo-de-ferro": bicho("lobo-de-ferro", 30, 48, 12, 3, 1.1, 9),
  "robo-enferrujado": bicho("robo-enferrujado", 55, 30, 13, 4, 2, 11),
  "urso-da-caverna": bicho("urso", 980, 36, 16, 20, 8, 14, "chase", { chefe: true, altura: 72 }),
  "sentinela-de-bronze": bicho("sentinela-de-bronze", 1400, 34, 18, 24, 10, 16, "chase", { chefe: true, altura: 64 }),
  "colosso-de-ferro": bicho("colosso-de-ferro", 2100, 32, 20, 30, 14, 16, "chase", { chefe: true, altura: 72 })
};
var fase = (ordem, regiao, tipo, x, y, extra) => no(ordem, regiao, tipo, x, y, {
  biomas: extra.biomas,
  horda: extra.horda,
  bando: extra.bando || extra.horda[0],
  chefe: extra.chefe || null,
  duracao: extra.duracao ?? 36,
  chefeEm: extra.chefeEm ?? 18,
  chao: extra.chao,
  agua: null
});
var chaoPedra = { campo: "chao-pedra-grama", caverna: "chao-pedra-areia" };
var chaoBronze = { rio: "chao-bronze-agua", deserto: "chao-bronze-areia" };
var chaoFerro = { forja: "chao-ferro-areia", floresta: "chao-ferro-grama" };
var conteudoPlaneta = {
  slug: "planeta-do-samuel",
  api: "__planeta",
  titulo: "Planeta do Samuel",
  pesca: false,
  inicial: "lasca",
  heroi: "samuel",
  heroiParado: "samuel-parado",
  heroiAnda: "samuel-andar",
  heroiAltura: 40,
  marcador: "marcador-samuel",
  vida: "icone-vida",
  vidaVazia: "icone-vida-vazia",
  gema: ["xp-1", "xp-2", "xp-3"],
  fimTitulo: "O farol est\xE1 aceso.",
  fimTexto: "O planetinha ficou vis\xEDvel.",
  fimSprite: "farol-aceso",
  controles: {
    base: "joystick-base",
    bola: "joystick-bola",
    acao: "botao-acao",
    pausa: "botao-pausa",
    tela: "botao-tela-cheia",
    sair: "botao-sair-tela-cheia",
    proxima: "botao-proxima",
    repetir: "botao-repetir"
  },
  mapa: { w: 344, h: 256 },
  golpes,
  itens: ITENS_COMUNS,
  inimigos,
  peixes: [],
  chefeDaRegiao: { pedra: "urso-da-caverna", bronze: "sentinela-de-bronze", ferro: "colosso-de-ferro", fim: null },
  fases: [
    fase(1, "pedra", "fase", 24, 180, { biomas: ["campo", "caverna"], horda: ["seixo-vivo", "lobo-da-pedra", "mamute"], bando: "enxame", chao: chaoPedra }),
    fase(2, "pedra", "fase", 56, 96, { biomas: ["caverna", "campo"], horda: ["lobo-da-pedra", "seixo-vivo", "mamute"], bando: "enxame", chao: chaoPedra }),
    fase(3, "pedra", "chefe", 94, 168, { biomas: ["caverna", "campo"], horda: ["seixo-vivo", "lobo-da-pedra"], chefe: "urso-da-caverna", chao: chaoPedra, duracao: 90 }),
    fase(4, "bronze", "fase", 128, 88, { biomas: ["rio", "deserto"], horda: ["guerreiro-de-bronze", "escorpiao", "golem-de-barro"], bando: "caranguejo-gigante", chao: chaoBronze }),
    fase(5, "bronze", "fase", 158, 176, { biomas: ["deserto", "rio"], horda: ["escorpiao", "guerreiro-de-bronze", "caranguejo-gigante"], chao: chaoBronze }),
    fase(6, "bronze", "chefe", 192, 98, { biomas: ["deserto", "rio"], horda: ["guerreiro-de-bronze", "golem-de-barro"], chefe: "sentinela-de-bronze", chao: chaoBronze, duracao: 90 }),
    fase(7, "ferro", "fase", 226, 176, { biomas: ["forja", "floresta"], horda: ["soldado-de-ferro", "lobo-de-ferro", "robo-enferrujado"], bando: "catapulta", chao: chaoFerro }),
    fase(8, "ferro", "fase", 252, 92, { biomas: ["floresta", "forja"], horda: ["lobo-de-ferro", "soldado-de-ferro", "catapulta"], chao: chaoFerro }),
    fase(9, "ferro", "chefe", 282, 170, { biomas: ["forja", "floresta"], horda: ["soldado-de-ferro", "robo-enferrujado"], chefe: "colosso-de-ferro", chao: chaoFerro, duracao: 90 }),
    fase(10, "fim", "fim", 322, 150, { biomas: ["campo", "floresta"], horda: ["seixo-vivo"], chao: chaoPedra, duracao: 0 })
  ],
  nos: {
    pedra: { aberta: "no-aberta", travada: "no-travada", vencida: "no-vencida" },
    bronze: { aberta: "no-aberta", travada: "no-travada", vencida: "no-vencida" },
    ferro: { aberta: "no-aberta", travada: "no-travada", vencida: "no-vencida" },
    fim: { aberta: "farol-0", travada: "farol-0", vencida: "farol-aceso" }
  },
  noEspecial: {
    3: { aberta: "no-chefe-urso-da-caverna-aberta", travada: "no-chefe-urso-da-caverna-travada", vencida: "no-chefe-urso-da-caverna-vencida" },
    6: { aberta: "no-chefe-sentinela-de-bronze-aberta", travada: "no-chefe-sentinela-de-bronze-travada", vencida: "no-chefe-sentinela-de-bronze-vencida" },
    9: { aberta: "no-chefe-colosso-de-ferro-aberta", travada: "no-chefe-colosso-de-ferro-travada", vencida: "no-chefe-colosso-de-ferro-vencida" }
  },
  cores: {
    campo: "#8FCB6B",
    caverna: "#8A8178",
    rio: "#6BB8C4",
    deserto: "#E2C56A",
    forja: "#C47A52",
    floresta: "#3E6B45"
  },
  config: {
    proposta: true,
    curva: [1.4, 2.2, 3],
    teto: [40, 70, 100],
    anel: "hypot/2+12",
    velocidade: 68,
    facil: "piso 1, cura, menos dano, sem teleporte"
  }
};

// src/entradas/planeta.js
iniciar(conteudoPlaneta);

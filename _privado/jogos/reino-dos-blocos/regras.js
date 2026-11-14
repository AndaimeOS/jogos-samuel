/* Reino dos Blocos — números e regras ajustáveis.
   Tudo que é novo está marcado como provisório. O modo Normal repete o balanceamento
   da versão 1.0 (o playtest de 14/11/2026 achou a dificuldade na medida). */
export const BLOCO = 16;
export const ROWS = 15;

export const TEXTO_NORMAL = '3 corações';
export const TEXTO_FACIL =
  '5 corações. Inimigos mais lentos e em menor número. Pulo com mais tempo no ar, mais coiote e plataformas mais largas. Bandeiras mais perto. O Doguinho dá mais pistas e busca você na queda sem tirar coração.';

/* Ritmo vertical da abelha no Fácil: 2,6 × (0,75 / 1,1), arredondado. Provisório. */
const ABELHA_RITMO_Y_FACIL = 1.77;

export const BALANCO = {
  bloco: BLOCO,
  cristaisParaBonus: 9,
  bonusLargura: 120,
  normal: {
    /* Física da 1.0 — não alterar sem um playtest novo. */
    MAX: 118, ACEL: 950, ACEL_AR: 700, ATRITO: 1250,
    GRAV_SOBE: 1050, GRAV_CAI: 1850, PULO: 392, PULO2: 340,
    QUEDA_MAX: 420, COIOTE: 0.1, BUFFER: 0.13, CORTE: 0.45,
    FLUTUA_FAIXA: 45, FLUTUA_FATOR: 0.5,
    geleiaVel: 28,
    abelhaRitmo: 1.1, abelhaRitmoY: 2.6, abelhaAmpX: 30, abelhaAmpY: 10,
    vidas: 3, coracaoMax: 4, estrelasPorCoracao: 50,
    /* Ajuda do Doguinho. A pista usa distância horizontal: os cristais ficam no alto
       e a distância em linha reta de 6 blocos nunca os alcançaria do chão. */
    pistaBlocos: 6, buscaBlocos: 3, apontaSegundos: 2.6, moedaEspera: 8, caoVel: 70,
    buscaQueda: false,
    inimigoManterACada: 1, plataformaExtra: 0, bandeiraIntervalo: 0,
  },
  facil: {
    /* Provisório. O pulo inicial (PULO) fica igual; o tempo no ar vem da gravidade e da flutuação. */
    MAX: 118, ACEL: 950, ACEL_AR: 700, ATRITO: 1250,
    GRAV_SOBE: 860, GRAV_CAI: 1500, PULO: 392, PULO2: 340,
    QUEDA_MAX: 420, COIOTE: 0.16, BUFFER: 0.20, CORTE: 0.45,
    FLUTUA_FAIXA: 70, FLUTUA_FATOR: 0.35,
    geleiaVel: 18,
    abelhaRitmo: 0.75, abelhaRitmoY: ABELHA_RITMO_Y_FACIL, abelhaAmpX: 30, abelhaAmpY: 10,
    vidas: 5, coracaoMax: 6, estrelasPorCoracao: 50,
    pistaBlocos: 10, buscaBlocos: 5, apontaSegundos: 3.4, moedaEspera: 3.5, caoVel: 100,
    buscaQueda: true,
    inimigoManterACada: 2, plataformaExtra: 1, bandeiraIntervalo: 40,
  },
};

export function parametros(modo) {
  return modo === 'facil' ? BALANCO.facil : BALANCO.normal;
}

export function deveTocarLatido(latir, somLigado) {
  return !!(latir && somLigado);
}

/* Queda em buraco ou água. No Fácil o Doguinho devolve ao chão firme sem tirar coração.
   No Normal o coração sai, como hoje. Quem chama é que teleporta — isto só decide o coração. */
export function aplicarQueda({ modo, vidas, cfg }) {
  if (modo === 'facil' && cfg && cfg.buscaQueda) {
    return { vidas, tiraCoracao: false, resgate: true };
  }
  return { vidas: vidas - 1, tiraCoracao: true, resgate: false };
}

export function idItem(it) {
  if (it.tipo === 'cristal') return 'c' + it.idx;
  return 'e' + Math.round(it.x) + ':' + Math.round(it.y);
}

/* O Doguinho escolhe uma pista. Não coleta, não move o herói, não derrota inimigo
   e não completa a fase — esses flags ficam sempre falsos. Late só para cristal
   ainda não avisado. Moeda (estrela) só entra na distância curta de busca, uma vez. */
export function planejarPista({ x, itens, avisados, moedasAvisadas, moedaEspera, cfg, bloco }) {
  const lista = [];
  const vistos = avisados || new Set();
  const moedas = moedasAvisadas || new Set();
  for (const it of itens || []) {
    if (!it || it.pego) continue;
    if (it.tipo !== 'cristal' && it.tipo !== 'estrela') continue;
    const distX = Math.abs(it.x - x) / bloco;
    if (it.tipo === 'cristal') {
      const id = idItem(it);
      if (vistos.has(id)) continue;
      if (distX <= cfg.pistaBlocos) lista.push({ tipo: 'cristal', id, x: it.x, y: it.y, distX, pri: 0 });
    } else if ((moedaEspera || 0) <= 0 && distX <= cfg.buscaBlocos) {
      const id = idItem(it);
      if (moedas.has(id)) continue;
      lista.push({ tipo: 'estrela', id, x: it.x, y: it.y, distX, pri: 1 });
    }
  }
  lista.sort((a, b) => a.pri - b.pri || a.distX - b.distX);
  const alvo = lista[0];
  if (!alvo) return null;
  return {
    alvo: { tipo: alvo.tipo, id: alvo.id, x: alvo.x, y: alvo.y },
    latir: alvo.tipo === 'cristal',
    caminhar: true,
    moveHeroi: false,
    derrotaInimigo: false,
    completaFase: false,
    coleta: false,
  };
}

export function mesclarCristais(antes, agora) {
  const a = Array.isArray(antes) ? antes : [];
  const b = Array.isArray(agora) ? agora : [];
  const n = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) out.push(!!a[i] || !!b[i]);
  return out;
}

/* Mesmo formato de sempre: completou, cristais, tempo, estrelas. Cristal já salvo continua valendo. */
export function gravarFase(anterior, atual) {
  const antes = anterior || {};
  const cristaisAntes = Array.isArray(antes.cristais) ? antes.cristais : [false, false, false];
  const cristaisAgora = Array.isArray(atual.cristais) ? atual.cristais : [false, false, false];
  return {
    completou: true,
    cristais: mesclarCristais(cristaisAntes, cristaisAgora),
    tempo: Math.min(antes.tempo || Infinity, atual.tempo),
    estrelas: Math.max(antes.estrelas || 0, atual.estrelas || 0),
  };
}

/* Só as 3 fases da história entram na conta. A fase bônus não soma cristal. */
export function totalCristais(progresso) {
  const p = progresso || {};
  let n = 0;
  for (let i = 0; i < 3; i++) {
    const c = p[i]?.cristais;
    if (!Array.isArray(c)) continue;
    for (const v of c) if (v) n++;
  }
  return n;
}

export function bonusAberto(progresso) {
  return totalCristais(progresso) >= BALANCO.cristaisParaBonus;
}

export function contarTiles(linhas, ch) {
  let n = 0;
  for (const linha of linhas) for (const c of linha) if (c === ch) n++;
  return n;
}

function alargarUmaVia(mapa, extra) {
  const rows = mapa.length;
  const cols = mapa[0].length;
  const out = mapa.map((row) => row.slice());
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = mapa[y][x];
      if (c !== '=' && c !== 'c') continue;
      for (let d = 1; d <= extra; d++) {
        for (const nx of [x - d, x + d]) {
          if (nx < 0 || nx >= cols) continue;
          if (mapa[y][nx] !== '.') continue;
          if (out[y][nx] === '.') out[y][nx] = c;
        }
      }
    }
  }
  return out;
}

function rarearInimigos(mapa, manterUmACada) {
  const out = mapa.map((row) => row.slice());
  const cont = { g: 0, z: 0 };
  for (let y = 0; y < out.length; y++) {
    for (let x = 0; x < out[y].length; x++) {
      const c = out[y][x];
      if (c !== 'g' && c !== 'z') continue;
      if (cont[c] % manterUmACada !== 0) out[y][x] = '.';
      cont[c]++;
    }
  }
  return out;
}

function colunaTem(mapa, x, ch) {
  for (let y = 0; y < mapa.length; y++) if (mapa[y][x] === ch) return true;
  return false;
}

function arAcimaDoChao(mapa, x) {
  const solido = (y) => y >= 0 && y < mapa.length && '#SBCP'.includes(mapa[y][x]);
  for (let y = 0; y < mapa.length; y++) {
    if (solido(y) && !solido(y - 1)) {
      const py = y - 1;
      if (py >= 0 && mapa[py][x] === '.') return py;
      return -1;
    }
  }
  return -1;
}

function inserirBandeiras(mapa, intervalo) {
  const out = mapa.map((row) => row.slice());
  const cols = out[0].length;
  let ultima = 0;
  let viu = false;
  for (let x = 0; x < cols; x++) {
    if (colunaTem(out, x, '@') || colunaTem(out, x, 'F')) { ultima = x; viu = true; continue; }
    if (!viu || x - ultima < intervalo) continue;
    const y = arAcimaDoChao(out, x);
    if (y < 0) continue;
    out[y][x] = 'F';
    ultima = x;
  }
  return out;
}

/* No Normal (extra 0, manter 1, intervalo 0) o mapa volta igual, caractere por caractere. */
export function ajustarParaModo(linhas, cfg) {
  let mapa = linhas.map((l) => (typeof l === 'string' ? l.split('') : l.slice()));
  if (cfg.plataformaExtra > 0) mapa = alargarUmaVia(mapa, cfg.plataformaExtra);
  if (cfg.inimigoManterACada > 1) mapa = rarearInimigos(mapa, cfg.inimigoManterACada);
  if (cfg.bandeiraIntervalo > 0) mapa = inserirBandeiras(mapa, cfg.bandeiraIntervalo);
  return mapa.map((r) => r.join(''));
}

function fase(largura, construir) {
  const m = Array.from({ length: ROWS }, () => Array(largura).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && x < largura && y >= 0 && y < ROWS) m[y][x] = c; };
  const api = {
    chao(x1, x2, alt, c = '#') { for (let x = x1; x <= x2; x++) for (let y = ROWS - alt; y < ROWS; y++) put(x, y, c); },
    linha(x1, x2, y, c) { for (let x = x1; x <= x2; x++) put(x, y, c); },
    coluna(x, y1, y2, c) { for (let y = y1; y <= y2; y++) put(x, y, c); },
    p: put,
    estrelas(x1, x2, y) { for (let x = x1; x <= x2; x++) put(x, y, '*'); },
    arco(x1, x2, yBase, alt) { const n = x2 - x1; for (let k = 0; k <= n; k++) put(x1 + k, yBase - Math.round(Math.sin(k / n * Math.PI) * alt), '*'); },
    agua(x1, x2) { for (let x = x1; x <= x2; x++) { put(x, 13, 'w'); put(x, 14, 'w'); } },
  };
  construir(api);
  return m.map((r) => r.join(''));
}

export const FASES = [
  { nome: 'Prados de Blocos', tema: 'prado', ic: '🌳', mapa: fase(206, (a) => {
    a.chao(0, 24, 3); a.p(3, 11, '@'); a.estrelas(6, 10, 11); a.p(12, 8, 'C'); a.p(13, 8, 'C'); a.p(14, 8, 'C'); a.estrelas(12, 14, 7); a.p(19, 11, 'g');
    a.arco(24, 28, 10, 2);
    a.chao(28, 35, 3); a.chao(36, 47, 4); a.linha(30, 33, 8, '='); a.estrelas(30, 33, 7); a.p(32, 3, 'K');
    a.p(42, 10, 'B'); a.p(42, 9, 'B'); a.p(43, 10, 'B'); a.estrelas(42, 43, 7); a.p(46, 10, 'g');
    a.arco(47, 51, 9, 2);
    a.chao(51, 72, 3); a.p(56, 8, 'C'); a.p(57, 8, 'P'); a.p(58, 8, 'C'); a.p(64, 11, 'g'); a.p(69, 11, 'g'); a.estrelas(62, 66, 11); a.p(52, 11, 'f'); a.p(60, 11, 'f');
    a.arco(72, 76, 9, 2);
    a.chao(76, 100, 3); a.p(80, 11, 'M'); a.coluna(86, 6, 11, 'S'); a.coluna(87, 6, 11, 'S'); a.estrelas(86, 87, 5); a.p(86, 1, 'K');
    a.p(94, 11, 'g'); a.p(99, 11, 'F'); a.p(78, 11, 'f');
    a.chao(101, 124, 3); a.p(108, 10, 'B'); a.p(109, 10, 'B'); a.p(109, 9, 'B'); a.p(110, 10, 'B'); a.p(110, 9, 'B'); a.p(110, 8, 'B'); a.estrelas(108, 110, 6); a.p(116, 7, 'z'); a.p(121, 11, 'H');
    a.linha(127, 129, 9, '='); a.linha(132, 134, 8, '='); a.estrelas(127, 129, 8); a.estrelas(132, 134, 7);
    a.chao(137, 160, 4); a.p(142, 10, 'g'); a.p(150, 10, 'g'); a.linha(152, 155, 6, '='); a.estrelas(152, 155, 5); a.p(157, 2, 'K'); a.linha(156, 158, 3, '=');
    a.p(146, 7, 'C'); a.p(147, 7, 'C'); a.p(148, 7, 'C');
    a.arco(160, 164, 9, 2);
    a.chao(164, 205, 3); a.p(170, 11, 'g'); a.p(176, 7, 'z');
    for (let k = 0; k < 5; k++) a.coluna(184 + k, 11 - k, 11, 'B');
    a.estrelas(184, 188, 5); a.chao(189, 205, 7); a.p(198, 7, 'G'); a.p(195, 7, 'f');
  }) },
  { nome: 'Cavernas de Cristal', tema: 'caverna', ic: '💎', mapa: fase(214, (a) => {
    a.linha(0, 213, 0, 'S'); a.linha(0, 213, 1, 'S');
    a.chao(0, 20, 3); a.p(3, 11, '@'); a.p(6, 10, 'l'); a.estrelas(8, 12, 11); a.p(15, 11, 'g');
    a.agua(21, 25); a.linha(22, 24, 9, '='); a.estrelas(22, 24, 8);
    a.chao(26, 44, 4); a.p(30, 10, '^'); a.p(31, 10, '^'); a.p(34, 7, 'C'); a.p(35, 7, 'P'); a.p(36, 7, 'C'); a.p(40, 9, 'l'); a.p(42, 10, 'g');
    a.coluna(44, 2, 6, 'S'); a.coluna(45, 2, 6, 'S'); a.p(44, 7, 'K');
    a.agua(45, 53); a.p(48, 10, '|'); a.estrelas(47, 51, 5);
    a.chao(54, 76, 3); a.p(58, 11, 'g'); a.p(64, 11, '^'); a.p(65, 11, '^'); a.p(66, 11, '^'); a.estrelas(64, 66, 8); a.p(70, 6, 'z'); a.p(72, 10, 'l');
    a.chao(77, 96, 5); a.p(80, 9, 'g'); a.p(86, 9, 'g'); a.p(92, 9, 'F'); a.linha(84, 88, 5, '='); a.estrelas(84, 88, 4); a.p(78, 8, 'l');
    a.agua(97, 108); a.p(99, 9, '|'); a.p(103, 8, '|'); a.estrelas(99, 105, 4); a.p(102, 2, 'K');
    a.chao(109, 130, 3); a.p(112, 11, 'M'); a.linha(116, 120, 5, 'S'); a.estrelas(116, 120, 4); a.p(124, 11, 'g'); a.p(127, 6, 'z'); a.p(118, 10, 'l'); a.p(129, 11, 'H');
    a.chao(131, 150, 6); a.p(137, 8, '^'); a.p(138, 8, '^'); a.p(142, 8, 'g'); a.p(146, 8, 'g'); a.p(143, 5, 'C'); a.p(144, 5, 'C'); a.p(138, 7, 'l');
    a.agua(151, 162); a.linha(152, 154, 9, '='); a.linha(157, 159, 7, '='); a.estrelas(157, 159, 6); a.p(147, 4, 'z');
    a.chao(163, 183, 4); a.p(167, 10, 'g'); a.coluna(176, 5, 10, 'S'); a.p(176, 4, 'K'); a.p(168, 9, 'l'); a.p(171, 10, 'M');
    a.chao(184, 213, 3); a.p(190, 11, 'g'); a.p(196, 9, 'l'); for (let k = 0; k < 4; k++) a.coluna(198 + k, 11 - k, 11, 'S'); a.chao(202, 213, 7); a.p(207, 7, 'G');
  }) },
  { nome: 'Ilhas no Céu', tema: 'ceu', ic: '☁️', mapa: fase(232, (a) => {
    a.chao(0, 14, 4); a.p(3, 10, '@'); a.p(6, 7, 'P'); a.p(7, 7, 'C'); a.estrelas(9, 13, 10);
    a.linha(17, 19, 9, 'c'); a.linha(22, 24, 7, 'c'); a.estrelas(17, 19, 8); a.estrelas(22, 24, 6);
    a.chao(27, 40, 5); a.p(31, 9, 'g'); a.p(36, 9, 'g'); a.p(39, 4, 'z');
    a.p(43, 8, '-'); a.estrelas(43, 49, 6);
    a.chao(52, 64, 4); a.p(55, 10, 'M'); a.estrelas(55, 55, 3); a.p(56, 2, 'K'); a.p(60, 10, 'g');
    a.linha(67, 69, 8, 'c'); a.linha(72, 74, 6, 'c'); a.linha(77, 79, 8, 'c'); a.estrelas(72, 74, 5); a.p(75, 3, 'z');
    a.chao(82, 98, 6); a.p(86, 8, 'g'); a.p(92, 8, 'g'); a.p(96, 8, 'F'); a.p(89, 5, 'C'); a.p(90, 5, 'C');
    a.p(101, 8, '-'); a.p(110, 6, '-'); a.estrelas(101, 114, 4);
    a.chao(117, 130, 3); a.p(120, 11, 'g'); a.p(124, 7, 'z'); a.p(128, 11, 'H');
    a.linha(133, 135, 9, 'c'); a.linha(137, 139, 6, 'c'); a.p(138, 2, 'K'); a.linha(141, 143, 8, 'c');
    a.chao(146, 160, 5); a.p(150, 9, 'g'); a.p(154, 9, 'g'); a.p(158, 9, 'M');
    a.linha(163, 166, 4, 'c'); a.estrelas(163, 166, 3); a.p(168, 7, '|'); a.linha(172, 174, 8, 'c');
    a.chao(177, 192, 4); a.p(181, 10, 'g'); a.p(186, 5, 'z'); a.p(189, 4, 'C'); a.p(190, 4, 'C');
    a.p(195, 8, '-'); a.estrelas(195, 203, 6); a.p(208, 4, 'K');
    a.chao(206, 231, 4); for (let k = 0; k < 4; k++) a.coluna(214 + k, 10 - k, 10, 'S'); a.chao(218, 231, 8); a.p(225, 6, 'G'); a.p(212, 10, 'g');
  }) },
  /* Provisório: 120 blocos, só peças que já existem, chão contínuo (sem buraco, água, espinho ou inimigo). */
  { nome: 'Festa do Gatinho', tema: 'prado', ic: '🐱', bonus: true, mapa: fase(BALANCO.bonusLargura, (a) => {
    a.chao(0, 105, 3);
    a.chao(106, 111, 4);
    a.chao(112, 119, 5);
    a.p(4, 11, '@');
    a.estrelas(8, 14, 11);
    a.p(16, 11, 'f');
    a.linha(20, 24, 9, '=');
    a.estrelas(20, 24, 8);
    a.p(30, 11, 'M');
    a.estrelas(34, 40, 11);
    a.p(44, 10, 'B');
    a.p(48, 10, 'C'); a.p(49, 10, 'P'); a.p(50, 10, 'C');
    a.estrelas(52, 58, 11);
    a.linha(62, 68, 9, '=');
    a.estrelas(62, 68, 8);
    a.p(72, 11, 'f'); a.p(76, 11, 'f');
    a.estrelas(80, 88, 11);
    a.linha(90, 96, 8, '=');
    a.estrelas(90, 96, 7);
    a.p(100, 11, 'H');
    a.p(102, 11, 'f');
    a.p(116, 9, 'G');
  }) },
];

export const TILES_CONHECIDOS = new Set(['.', '#', 'S', 'B', '=', 'c', '^', 'w', '*', 'K', 'H', 'g', 'z', 'F', 'G', '@', 'C', 'P', 'M', 'f', 'l', '-', '|']);
export const TILES_PERIGO = ['^', 'w', 'g', 'z'];

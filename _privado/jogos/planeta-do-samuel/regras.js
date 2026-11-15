/* Planeta do Samuel — números e regras da proposta 0.1.0.
   Tudo que está aqui é PROPOSTA: dá para mudar sem quebrar o formato do save,
   desde que schemaVersion continue 1. Não há armas, ataques, chefes nem inimigos.
   A noite só escurece. No Fácil, fome ou calor em zero só deixam o passo lento. */

export const PROPOSTA = true;

export const CONFIG = {
  proposta: true,
  rotulo: 'PROPOSTA',
  versao: '0.1.0',
  schemaVersion: 1,
  chaveSave: 'planeta-do-samuel:save',
  modo: 'facil',
  semInimigos: true,
  semArmas: true,
  bloco: 16,
  alcance: 26,
  raioJogador: 6,
  velocidade: 72,
  fatorLentidao: 0.4,
  fomeMax: 100,
  calorMax: 100,
  fomeInicial: 80,
  calorInicial: 80,
  fomePorSegundo: 0.45,
  calorPorSegundo: 0.28,
  frioNoiteExtra: 0.55,
  frutaRecupera: 32,
  calorFogueiraPorSegundo: 7,
  calorCasaPorSegundo: 3,
  raioFogueira: 80,
  raioCasa: 40,
  raioFarol: 150,
  duracaoDia: 90,
  horaInicial: 0.22,
  noiteInicio: 0.62,
  noiteFim: 0.9,
  escuridaoMax: 0.78,
  autosaveSegundos: 8,
  canteiroPorSegundo: 0.12,
  canteiroMax: 4,
  recargaFruta: 45,
  rendimento: {
    graveto: 1,
    seixo: 1,
    fruta: 1,
    arvore: 3,
    rocha: 2,
    veio: 2,
  },
};

export const ERAS = {
  pedra: { ordem: 0, nome: 'Idade da Pedra' },
  bronze: { ordem: 1, nome: 'Idade do Bronze' },
  ferro: { ordem: 2, nome: 'Idade do Ferro' },
};

export const TEXTOS = {
  proposta: 'PROPOSTA',
  fim: 'O farol está aceso. O planetinha ficou visível. PROPOSTA.',
  buscar: {
    madeira: 'Junte madeira. A seta mostra onde. PROPOSTA.',
    pedra: 'Junte pedra. A seta mostra onde. PROPOSTA.',
    minerio: 'Junte minério. A seta mostra onde. PROPOSTA.',
    fruta: 'Colha uma fruta. A seta mostra onde. PROPOSTA.',
    barra: 'Funda minério na fornalha para fazer uma barra. PROPOSTA.',
  },
  estacao: {
    toca: 'Entregue madeira e pedra na toca para o machado. PROPOSTA.',
    fogueira: 'Acenda a fogueira. Ela aquece e ilumina. PROPOSTA.',
    pesquisaBronze: 'Pesquise a Idade do Bronze. PROPOSTA.',
    bancada: 'Monte a bancada. PROPOSTA.',
    fornalha: 'Monte a fornalha. PROPOSTA.',
    canteiro: 'Prepare o canteiro. PROPOSTA.',
    pesquisaFerro: 'Pesquise a Idade do Ferro. PROPOSTA.',
    ferramentas: 'Faça as ferramentas de ferro. PROPOSTA.',
    casinha: 'Levante a casinha. PROPOSTA.',
    farol: 'Acenda o farol. PROPOSTA.',
  },
};

/* Custos provisórios. A ordem dos pares é a ordem da entrega (o x/N). */
export const ESTACOES = [
  { id: 'toca', nome: 'Toca de lascar', precisaEra: 'pedra', efeito: 'machado', custo: [['madeira', 2], ['pedra', 2]] },
  { id: 'fogueira', nome: 'Fogueira', precisaEra: 'pedra', precisaEfeito: 'machado', efeito: 'fogueira', custo: [['madeira', 3], ['pedra', 1]] },
  { id: 'pesquisaBronze', nome: 'Pesquisa do bronze', precisaEra: 'pedra', precisaEfeito: 'fogueira', efeito: 'era:bronze', custo: [['madeira', 2], ['pedra', 2], ['fruta', 1]] },
  { id: 'bancada', nome: 'Bancada', precisaEra: 'bronze', efeito: 'bancada', custo: [['madeira', 3], ['pedra', 2]] },
  { id: 'fornalha', nome: 'Fornalha', precisaEra: 'bronze', efeito: 'fornalha', custo: [['pedra', 3], ['minerio', 2]] },
  { id: 'canteiro', nome: 'Canteiro', precisaEra: 'bronze', efeito: 'canteiro', custo: [['madeira', 2], ['fruta', 1]] },
  { id: 'pesquisaFerro', nome: 'Pesquisa do ferro', precisaEra: 'bronze', precisaEfeito: 'fornalha', efeito: 'era:ferro', custo: [['barra', 2], ['madeira', 1]] },
  { id: 'ferramentas', nome: 'Ferramentas de ferro', precisaEra: 'ferro', precisaEfeito: 'bancada', efeito: 'ferro', custo: [['barra', 2], ['madeira', 1]] },
  { id: 'casinha', nome: 'Casinha', precisaEra: 'ferro', efeito: 'casa', custo: [['madeira', 3], ['pedra', 2], ['barra', 1]] },
  { id: 'farol', nome: 'Farol', precisaEra: 'ferro', precisaEfeitos: ['ferro', 'casa'], efeito: 'farol', custo: [['madeira', 2], ['barra', 1]] },
];

const LETRAS = {
  S: 'inicio',
  A: 'toca',
  C: 'fogueira',
  Q: 'pesquisaBronze',
  B: 'bancada',
  U: 'fornalha',
  P: 'canteiro',
  G: 'pesquisaFerro',
  E: 'ferramentas',
  H: 'casinha',
  L: 'farol',
};

const RECURSOS = {
  t: { tipo: 'graveto', item: 'madeira', ferramenta: null },
  r: { tipo: 'seixo', item: 'pedra', ferramenta: null },
  F: { tipo: 'fruta', item: 'fruta', ferramenta: null },
  T: { tipo: 'arvore', item: 'madeira', ferramenta: 'machado' },
  R: { tipo: 'rocha', item: 'pedra', ferramenta: 'machado' },
  O: { tipo: 'veio', item: 'minerio', ferramenta: 'machado' },
};

export const MAPA = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~............~~~~~~~~~~~~~~',
  '~~~~~~~~~~........OOO.........~~~~~~~~~~',
  '~~~~~~~~.........O.O.O..........~~~~~~~~',
  '~~~~~~~...TTT...RR....RR....TT...~~~~~~~',
  '~~~~~~...TT..T.R........R..T..T...~~~~~~',
  '~~~~~.............C...Q............~~~~~',
  '~~~~~.......A.tr.......tr..........~~~~~',
  '~~~~~......F......S..........F.....~~~~~',
  '~~~~~.......t...............r......~~~~~',
  '~~~~~~..L.....B...G.....U.........~~~~~~',
  '~~~~~~~...........F..............~~~~~~~',
  '~~~~~~~~...H..........F...E.....~~~~~~~~',
  '~~~~~~~~~~......P.............~~~~~~~~~~',
  '~~~~~~~~~~~~~~............~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

export function expandirCusto(estacao) {
  const seq = [];
  for (const [item, n] of estacao.custo) {
    for (let i = 0; i < n; i++) seq.push(item);
  }
  return seq;
}

export function estacaoPorId(id) {
  return ESTACOES.find((e) => e.id === id) || null;
}

export function criarMundo() {
  const tiles = MAPA.map((linha) => linha.split(''));
  const linhas = tiles.length;
  const colunas = tiles[0].length;
  const postos = {};
  let inicio = null;
  const nos = [];
  const contagem = {};
  for (let y = 0; y < linhas; y++) {
    if (tiles[y].length !== colunas) throw new Error('mapa com largura desigual');
    for (let x = 0; x < colunas; x++) {
      const ch = tiles[y][x];
      const px = (x + 0.5) * CONFIG.bloco;
      const py = (y + 0.5) * CONFIG.bloco;
      if (LETRAS[ch]) {
        if (ch === 'S') inicio = { x: px, y: py };
        else postos[LETRAS[ch]] = { x: px, y: py };
        tiles[y][x] = '.';
      } else if (RECURSOS[ch]) {
        const rec = RECURSOS[ch];
        const n = contagem[rec.tipo] || 0;
        contagem[rec.tipo] = n + 1;
        nos.push({
          id: `${rec.tipo}-${n}`,
          tipo: rec.tipo,
          item: rec.item,
          ferramenta: rec.ferramenta,
          rendimento: CONFIG.rendimento[rec.tipo],
          restante: CONFIG.rendimento[rec.tipo],
          recarga: 0,
          x: px,
          y: py,
        });
        tiles[y][x] = '.';
      }
    }
  }
  if (!inicio) throw new Error('mapa sem começo');
  for (const est of ESTACOES) {
    if (!postos[est.id]) throw new Error('mapa sem ' + est.id);
  }
  return { tiles: tiles.map((l) => l.join('')), colunas, linhas, postos, inicio, nos };
}

export function criarPartida() {
  const m = criarMundo();
  const progresso = {};
  for (const est of ESTACOES) progresso[est.id] = 0;
  return {
    proposta: true,
    modo: 'facil',
    era: 'pedra',
    fome: CONFIG.fomeInicial,
    calor: CONFIG.calorInicial,
    hora: CONFIG.horaInicial,
    x: m.inicio.x,
    y: m.inicio.y,
    inventario: { madeira: 0, pedra: 0, minerio: 0, fruta: 0, barra: 0 },
    efeitos: {},
    progresso,
    postos: m.postos,
    nos: m.nos.map((n) => ({ ...n })),
    tiles: m.tiles,
    colunas: m.colunas,
    linhas: m.linhas,
    canteiroFruta: 0,
    farol: false,
    morte: false,
    lentidao: false,
    desdeSave: 0,
  };
}

export function distancia(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function escuridao(hora, cfg = CONFIG) {
  const h = ((Number(hora) % 1) + 1) % 1;
  if (h < cfg.noiteInicio || h >= cfg.noiteFim) return 0;
  const meio = (cfg.noiteInicio + cfg.noiteFim) / 2;
  const meia = (cfg.noiteFim - cfg.noiteInicio) / 2;
  const curva = 1 - Math.abs(h - meio) / meia;
  if (curva <= 0.0001) return 0;
  return cfg.escuridaoMax * curva;
}

export function fatorVelocidade(estado) {
  if (estado.fome <= 0 || estado.calor <= 0) return CONFIG.fatorLentidao;
  return 1;
}

export function velocidadeAtual(estado) {
  return CONFIG.velocidade * fatorVelocidade(estado);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function bloqueia(estado, x, y) {
  const col = Math.floor(x / CONFIG.bloco);
  const lin = Math.floor(y / CONFIG.bloco);
  if (lin < 0 || col < 0 || lin >= estado.linhas || col >= estado.colunas) return true;
  return estado.tiles[lin][col] === '~';
}

export function livre(estado, x, y) {
  const r = CONFIG.raioJogador;
  return [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => !bloqueia(estado, x + dx, y + dy));
}

function mover(estado, dt, eixo) {
  let x = Number(eixo?.x) || 0;
  let y = Number(eixo?.y) || 0;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  if (len === 0) return;
  const v = velocidadeAtual(estado) * dt;
  const nx = estado.x + x * v;
  const ny = estado.y + y * v;
  if (livre(estado, nx, ny)) {
    estado.x = nx;
    estado.y = ny;
    return;
  }
  if (livre(estado, nx, estado.y)) estado.x = nx;
  else if (livre(estado, estado.x, ny)) estado.y = ny;
}

function sobreviver(estado, dt) {
  const noite = CONFIG.escuridaoMax > 0 ? escuridao(estado.hora) / CONFIG.escuridaoMax : 0;
  let calor = -CONFIG.calorPorSegundo - noite * CONFIG.frioNoiteExtra;
  const fogo = estado.postos.fogueira;
  const casa = estado.postos.casinha;
  if (estado.efeitos.fogueira && distancia(estado.x, estado.y, fogo.x, fogo.y) <= CONFIG.raioFogueira) {
    calor = CONFIG.calorFogueiraPorSegundo;
  } else if (estado.efeitos.casa && distancia(estado.x, estado.y, casa.x, casa.y) <= CONFIG.raioCasa) {
    calor = CONFIG.calorCasaPorSegundo;
  }
  estado.calor = clamp(estado.calor + calor * dt, 0, CONFIG.calorMax);
  estado.fome = clamp(estado.fome - CONFIG.fomePorSegundo * dt, 0, CONFIG.fomeMax);
  estado.hora = (estado.hora + dt / CONFIG.duracaoDia) % 1;
  if (estado.efeitos.canteiro) {
    estado.canteiroFruta = Math.min(CONFIG.canteiroMax, estado.canteiroFruta + CONFIG.canteiroPorSegundo * dt);
  }
  for (const no of estado.nos) {
    if (no.tipo !== 'fruta' || no.restante > 0) continue;
    no.recarga += dt;
    if (no.recarga >= CONFIG.recargaFruta) {
      no.restante = no.rendimento;
      no.recarga = 0;
    }
  }
  estado.desdeSave += dt;
  estado.lentidao = estado.fome <= 0 || estado.calor <= 0;
  estado.morte = false;
}

export function tick(estado, dt, eixo) {
  let rest = Math.max(0, Number(dt) || 0);
  while (rest > 0) {
    const h = Math.min(0.05, rest);
    mover(estado, h, eixo);
    sobreviver(estado, h);
    rest -= h;
  }
  estado.morte = false;
  return estado;
}

export function podeJuntar(estado, no, opts = {}) {
  const checarAlcance = opts.alcance !== false;
  if (!no || no.restante <= 0) return { ok: false, motivo: 'vazio' };
  if (no.ferramenta && !estado.efeitos[no.ferramenta]) return { ok: false, motivo: 'precisa-machado' };
  if (checarAlcance && distancia(estado.x, estado.y, no.x, no.y) > CONFIG.alcance) {
    return { ok: false, motivo: 'longe' };
  }
  return { ok: true };
}

export function juntar(estado, id) {
  const no = estado.nos.find((n) => n.id === id);
  const r = podeJuntar(estado, no);
  if (!r.ok) return r;
  const ganho = no.restante;
  estado.inventario[no.item] += ganho;
  no.restante = 0;
  no.recarga = 0;
  return { ok: true, item: no.item, ganho };
}

export function desbloqueada(estado, est) {
  if (!est) return false;
  if (ERAS[estado.era].ordem < ERAS[est.precisaEra].ordem) return false;
  if (est.precisaEfeito && !estado.efeitos[est.precisaEfeito]) return false;
  for (const efeito of est.precisaEfeitos || []) {
    if (!estado.efeitos[efeito]) return false;
  }
  return true;
}

export function estacaoPronta(estado, id) {
  const est = estacaoPorId(id);
  if (!est) return false;
  return (estado.progresso[id] || 0) >= expandirCusto(est).length;
}

export function faltando(estado, id) {
  const est = estacaoPorId(id);
  if (!est || estacaoPronta(estado, id)) return null;
  return expandirCusto(est)[estado.progresso[id] || 0];
}

export function contador(estado, id) {
  const est = estacaoPorId(id);
  const n = est ? expandirCusto(est).length : 0;
  const x = estado.progresso[id] || 0;
  return { x, n, texto: `${x}/${n}`, pronto: x >= n && n > 0, proposta: true };
}

function aplicarEfeito(estado, est) {
  estado.efeitos[est.efeito] = true;
  if (est.efeito.startsWith('era:')) {
    const era = est.efeito.slice(4);
    if (ERAS[era] && ERAS[era].ordem > ERAS[estado.era].ordem) estado.era = era;
  }
  if (est.efeito === 'farol') estado.farol = true;
  return est.efeito;
}

export function fundir(estado) {
  if (!estado.efeitos.fornalha) return { ok: false, motivo: 'precisa-passo' };
  if (distancia(estado.x, estado.y, estado.postos.fornalha.x, estado.postos.fornalha.y) > CONFIG.alcance) {
    return { ok: false, motivo: 'longe' };
  }
  if ((estado.inventario.minerio || 0) < 1) return { ok: false, motivo: 'sem-minerio' };
  estado.inventario.minerio -= 1;
  estado.inventario.barra += 1;
  return { ok: true, item: 'barra', ganho: 1 };
}

export function colher(estado) {
  if (!estado.efeitos.canteiro) return { ok: false, motivo: 'precisa-passo' };
  if (distancia(estado.x, estado.y, estado.postos.canteiro.x, estado.postos.canteiro.y) > CONFIG.alcance) {
    return { ok: false, motivo: 'longe' };
  }
  const n = Math.floor(estado.canteiroFruta);
  if (n < 1) return { ok: false, motivo: 'vazio' };
  estado.canteiroFruta -= n;
  estado.inventario.fruta += n;
  return { ok: true, item: 'fruta', ganho: n };
}

export function entregar(estado, id) {
  const est = estacaoPorId(id);
  const posto = estado.postos[id];
  if (!est || !posto) return { ok: false, motivo: 'nada' };
  if (distancia(estado.x, estado.y, posto.x, posto.y) > CONFIG.alcance) return { ok: false, motivo: 'longe' };
  if (!desbloqueada(estado, est)) {
    return { ok: false, motivo: est.precisaEfeito && !estado.efeitos[est.precisaEfeito] ? 'precisa-passo' : 'era-cedo' };
  }
  if (estacaoPronta(estado, id)) {
    if (est.efeito === 'fornalha') return fundir(estado);
    if (est.efeito === 'canteiro') return colher(estado);
    return { ok: false, motivo: 'pronto' };
  }
  const item = faltando(estado, id);
  if ((estado.inventario[item] || 0) < 1) return { ok: false, motivo: 'sem-item', item };
  estado.inventario[item] -= 1;
  estado.progresso[id] += 1;
  let efeito = null;
  if (estacaoPronta(estado, id)) efeito = aplicarEfeito(estado, est);
  const c = contador(estado, id);
  return { ok: true, item, x: c.x, n: c.n, efeito };
}

export function alvoInteracao(estado) {
  const lista = [];
  for (const est of ESTACOES) {
    const p = estado.postos[est.id];
    const d = distancia(estado.x, estado.y, p.x, p.y);
    if (d <= CONFIG.alcance) lista.push({ tipo: 'estacao', id: est.id, d });
  }
  for (const no of estado.nos) {
    if (no.restante <= 0) continue;
    const d = distancia(estado.x, estado.y, no.x, no.y);
    if (d <= CONFIG.alcance) lista.push({ tipo: 'no', id: no.id, d });
  }
  if (!lista.length) return null;
  lista.sort((a, b) => a.d - b.d);
  return lista[0];
}

export function interagir(estado) {
  const alvo = alvoInteracao(estado);
  if (!alvo) return { ok: false, motivo: 'longe' };
  if (alvo.tipo === 'no') return juntar(estado, alvo.id);
  return entregar(estado, alvo.id);
}

export function comer(estado) {
  if ((estado.inventario.fruta || 0) < 1) return { ok: false, motivo: 'sem-fruta' };
  estado.inventario.fruta -= 1;
  estado.fome = Math.min(CONFIG.fomeMax, estado.fome + CONFIG.frutaRecupera);
  return { ok: true };
}

function noMaisPerto(estado, item) {
  let melhor = null;
  let melhorD = Infinity;
  for (const no of estado.nos) {
    if (no.item !== item || no.restante <= 0) continue;
    if (!podeJuntar(estado, no, { alcance: false }).ok) continue;
    const d = distancia(estado.x, estado.y, no.x, no.y);
    if (d < melhorD) {
      melhor = no;
      melhorD = d;
    }
  }
  return melhor;
}

export function proximoPasso(estado) {
  if (estado.efeitos.farol) {
    const p = estado.postos.farol;
    return { id: 'fim', texto: TEXTOS.fim, x: p.x, y: p.y, proposta: true };
  }
  for (const est of ESTACOES) {
    if (estacaoPronta(estado, est.id)) continue;
    if (!desbloqueada(estado, est)) continue;
    const item = faltando(estado, est.id);
    if (item && (estado.inventario[item] || 0) < 1) {
      if (item === 'barra') {
        if ((estado.inventario.minerio || 0) > 0 && estado.efeitos.fornalha) {
          const p = estado.postos.fornalha;
          return { id: 'fundir', texto: TEXTOS.buscar.barra, x: p.x, y: p.y, proposta: true };
        }
        const veio = noMaisPerto(estado, 'minerio');
        if (veio) return { id: veio.id, texto: TEXTOS.buscar.minerio, x: veio.x, y: veio.y, proposta: true };
      }
      const no = noMaisPerto(estado, item);
      if (no) return { id: no.id, texto: TEXTOS.buscar[item], x: no.x, y: no.y, proposta: true };
    }
    const p = estado.postos[est.id];
    return { id: est.id, texto: TEXTOS.estacao[est.id], x: p.x, y: p.y, proposta: true };
  }
  const p = estado.postos.farol;
  return { id: 'fim', texto: TEXTOS.fim, x: p.x, y: p.y, proposta: true };
}

export function custoCampanha() {
  const t = { madeira: 0, pedra: 0, minerio: 0, fruta: 0, barra: 0 };
  for (const est of ESTACOES) {
    for (const [k, n] of est.custo) t[k] += n;
  }
  t.minerio += t.barra;
  return t;
}

export function ofertaDoMapa(estado) {
  const o = { madeira: 0, pedra: 0, minerio: 0, fruta: 0, barra: 0 };
  for (const no of estado.nos) o[no.item] += no.rendimento;
  return o;
}

export function serializar(estado) {
  const nos = {};
  for (const no of estado.nos) nos[no.id] = { restante: no.restante, recarga: no.recarga };
  return {
    schemaVersion: CONFIG.schemaVersion,
    proposta: true,
    modo: 'facil',
    era: estado.era,
    fome: estado.fome,
    calor: estado.calor,
    hora: estado.hora,
    x: estado.x,
    y: estado.y,
    inventario: { ...estado.inventario },
    efeitos: { ...estado.efeitos },
    progresso: { ...estado.progresso },
    nos,
    canteiroFruta: estado.canteiroFruta,
    farol: !!estado.farol,
    morte: false,
  };
}

function numeroFin(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function restaurar(dado) {
  let obj = dado;
  if (typeof dado === 'string') {
    try { obj = JSON.parse(dado); } catch { return null; }
  }
  if (!obj || typeof obj !== 'object') return null;
  if (obj.schemaVersion !== CONFIG.schemaVersion || obj.modo !== 'facil' || !ERAS[obj.era]) return null;
  if (!obj.inventario || typeof obj.inventario !== 'object') return null;
  const estado = criarPartida();
  for (const k of Object.keys(estado.inventario)) {
    const n = obj.inventario[k];
    if (!numeroFin(n) || n < 0) return null;
    estado.inventario[k] = n;
  }
  if (!numeroFin(obj.x) || !numeroFin(obj.y) || !numeroFin(obj.fome) || !numeroFin(obj.calor) || !numeroFin(obj.hora)) {
    return null;
  }
  if (livre(estado, obj.x, obj.y)) {
    estado.x = obj.x;
    estado.y = obj.y;
  }
  estado.fome = clamp(obj.fome, 0, CONFIG.fomeMax);
  estado.calor = clamp(obj.calor, 0, CONFIG.calorMax);
  estado.hora = ((obj.hora % 1) + 1) % 1;
  estado.era = obj.era;
  estado.efeitos = {};
  if (obj.efeitos && typeof obj.efeitos === 'object') {
    for (const [k, v] of Object.entries(obj.efeitos)) if (v === true) estado.efeitos[k] = true;
  }
  for (const est of ESTACOES) {
    const n = obj.progresso?.[est.id];
    const max = expandirCusto(est).length;
    estado.progresso[est.id] = numeroFin(n) && n >= 0 ? Math.min(max, Math.floor(n)) : 0;
  }
  for (const est of ESTACOES) {
    if (estacaoPronta(estado, est.id)) aplicarEfeito(estado, est);
  }
  if (obj.nos && typeof obj.nos === 'object') {
    for (const no of estado.nos) {
      const s = obj.nos[no.id];
      if (!s) continue;
      if (!numeroFin(s.restante) || s.restante < 0) return null;
      no.restante = Math.min(no.rendimento, s.restante);
      no.recarga = numeroFin(s.recarga) && s.recarga >= 0 ? s.recarga : 0;
    }
  }
  estado.canteiroFruta = clamp(numeroFin(obj.canteiroFruta) ? obj.canteiroFruta : 0, 0, CONFIG.canteiroMax);
  estado.farol = !!estado.efeitos.farol;
  estado.morte = false;
  estado.lentidao = estado.fome <= 0 || estado.calor <= 0;
  estado.desdeSave = 0;
  return estado;
}

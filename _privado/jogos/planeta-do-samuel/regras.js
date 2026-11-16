/* Planeta do Samuel — laço da proposta 0.4.
   Todos os números estão em CONFIG e são PROPOSTA.
   Reescrito em JS, sem arte de Pokémon, a partir do código MIT de Pedro Barretto:
   xpPara / ganhar XP (src/game/leveling.ts), faixa de gema (src/game/pickups.ts),
   anel, bando e chefe fora da tela (src/game/spawner.ts),
   fase do chefe na metade da vida (src/game/bossFight.ts).
   A ilha, o dia de 240 s e os dois padrões de chefe (investida que atordoa,
   cuspe voando) seguem as regras do Isle of Embers, reescritas em ilha.js.
   No Fácil, vida em zero não acaba a partida e não tira progresso. */

import { dir8 } from './motor/math.js';
import { CHAO, NO, TILE, gerarIlha } from './ilha.js';

export const PROPOSTA = true;

export const CONFIG = {
  proposta: true,
  rotulo: 'PROPOSTA',
  versao: '0.4.0',
  schemaVersion: 3,
  chaveSave: 'planeta-do-samuel:save',
  modo: 'facil',
  semMorte: true,
  bloco: TILE,
  ladoIlha: 128,
  sementeIlha: 20261115,
  duracaoDia: 240,
  noiteInicio: 0.66,
  noiteFim: 0.97,
  escuridaoNoite: 0.82,
  raioJogador: 8,
  velocidade: 78,
  vidaMax: 100,
  invulneravelSegundos: 2,
  autosaveSegundos: 8,
  distanciaOnda: 170,
  raioColeta: 26,
  ima: 140,
  contatoEspera: 0.45,
  chefeAfina: 0.25,
  chefeMaxVivos: 4,
  chefeMeia: 0.5,
  chefeTelegraph: 0.6,
  chefeInvestida: 150,
  chefeInvestidaTempo: 0.45,
  chefeCirculo: 30,
  chefeAnel: 8,
  ursoPreparo: 0.8,
  ursoInvestida: 300,
  ursoInvestidaTempo: 0.9,
  ursoAtordoado: 1.6,
  ursoAlcance: 420,
  sentinelaCuspe: 2.4,
  sentinelaCuspeRaiva: 1.6,
  cuspeVelocidade: 240,
  cuspeDano: 11,
  cuspeFan: 5,
  curaArbusto: 12,
  xpVeio: 3,
  melhorarDano: 0.3,
  melhorarIntervalo: 0.82,
  vidaCarta: 25,
  xpChefe: 12,
  xpFaixa: [1, 3, 8],
  efeitoAcerto: 0.15,
  efeitoMorte: 0.35,
  efeitoLevel: 0.45,
  escuridaoFerro: 0.72,
  raioFogueira: 80,
  raioFarol: 150,
  guardaToqueMs: 350,
  armas: {
    lasca: { dano: 7, orbita: 40, raio: 8, giro: 2.4, intervalo: 0.32, orbes: 3 },
    lanca: { dano: 12, velocidade: 200, intervalo: 0.85, raio: 6 },
    faisca: { dano: 9, raio: 34, intervalo: 0.45 },
    fogueira: { raioExtra: 26, raioLuz: 80, dano: 5, intervalo: 0.5 },
    pedregulho: { dano: 12, velocidade: 90, raio: 8 },
  },
  inimigos: {
    'seixo-vivo': { hp: 8, velocidade: 28, raio: 8, xp: 1, dano: 6, comportamento: 'chase', sprite: 'seixo-vivo' },
    'lobo-da-pedra': { hp: 14, velocidade: 52, raio: 10, xp: 2, dano: 8, comportamento: 'chase', sprite: 'lobo-da-pedra' },
    enxame: { hp: 4, velocidade: 70, raio: 6, xp: 1, dano: 5, comportamento: 'flyby', sprite: 'enxame' },
    'guerreiro-de-bronze': { hp: 18, velocidade: 42, raio: 10, xp: 2, dano: 10, comportamento: 'chase', sprite: 'guerreiro-de-bronze' },
    escorpiao: { hp: 12, velocidade: 36, raio: 9, xp: 2, dano: 12, comportamento: 'chase', sprite: 'escorpiao' },
    'golem-de-barro': { hp: 36, velocidade: 18, raio: 14, xp: 3, dano: 10, comportamento: 'chase', sprite: 'golem-de-barro' },
    'soldado-de-ferro': { hp: 22, velocidade: 40, raio: 10, xp: 2, dano: 11, comportamento: 'chase', sprite: 'soldado-de-ferro' },
    catapulta: { hp: 20, velocidade: 0, raio: 12, xp: 3, dano: 0, comportamento: 'torre', sprite: 'catapulta', intervalo: 2.2 },
    'lobo-de-ferro': { hp: 16, velocidade: 64, raio: 10, xp: 2, dano: 10, comportamento: 'chase', sprite: 'lobo-de-ferro' },
    'lanca-chuva': { hp: 5, velocidade: 150, raio: 6, xp: 1, dano: 9, comportamento: 'flyby', sprite: 'lanca' },
    'faisca-anel': { hp: 6, velocidade: 24, raio: 7, xp: 1, dano: 8, comportamento: 'chase', sprite: 'faisca' },
    'urso-da-caverna': { hp: 110, velocidade: 34, raio: 18, xp: 12, dano: 14, comportamento: 'chefe', sprite: 'urso-da-caverna' },
    'sentinela-de-bronze': { hp: 140, velocidade: 22, raio: 16, xp: 14, dano: 12, comportamento: 'chefe', sprite: 'sentinela-de-bronze' },
    'colosso-de-ferro': { hp: 180, velocidade: 30, raio: 20, xp: 16, dano: 16, comportamento: 'chefe', sprite: 'colosso-de-ferro' },
    mamute: { hp: 46, velocidade: 22, raio: 16, xp: 4, dano: 12, comportamento: 'chase', sprite: 'mamute' },
    'caranguejo-gigante': { hp: 30, velocidade: 40, raio: 14, xp: 3, dano: 11, comportamento: 'chase', sprite: 'caranguejo-gigante' },
    'robo-enferrujado': { hp: 16, velocidade: 36, raio: 10, xp: 2, dano: 9, comportamento: 'zigue', sprite: 'robo-enferrujado' },
  },
  meteoros: { n: 4, raio: 18, aviso: 0.75, dano: 14 },
  enchente: { raio: 72, dano: 4, intervalo: 0.8, lenta: 0.55, duracao: 4.5 },
  raios: { n: 5, raio: 16, aviso: 0.55, dano: 16, duracao: 1.4 },
  eras: {
    pedra: { ate: 90, taxa: 0.8, max: 12, horda: ['seixo-vivo', 'lobo-da-pedra', 'mamute'] },
    bronze: { ate: 180, taxa: 1.2, max: 18, horda: ['guerreiro-de-bronze', 'escorpiao', 'golem-de-barro', 'caranguejo-gigante'] },
    ferro: { ate: 270, taxa: 1.6, max: 24, horda: ['soldado-de-ferro', 'catapulta', 'lobo-de-ferro', 'robo-enferrujado'] },
  },
  marcos: {
    pedraBando: { em: 30, tipo: 'enxame', n: 5, kind: 'swarm' },
    pedraMeteoros: { em: 45, kind: 'meteoros' },
    pedraChefe: { em: 90, tipo: 'urso-da-caverna' },
    bronzeBando: { em: 120, tipo: 'lanca-chuva', n: 6, kind: 'swarm' },
    bronzeEnchente: { em: 135, kind: 'enchente' },
    bronzeChefe: { em: 180, tipo: 'sentinela-de-bronze' },
    ferroBando: { em: 210, tipo: 'lobo-de-ferro', n: 4, kind: 'swarm' },
    ferroRaios: { em: 225, kind: 'raios' },
    ferroChefe: { em: 270, tipo: 'colosso-de-ferro' },
  },
};

export const ERAS = {
  pedra: { ordem: 0, nome: 'Idade da Pedra' },
  bronze: { ordem: 1, nome: 'Idade do Bronze' },
  ferro: { ordem: 2, nome: 'Idade do Ferro' },
};

export const TEXTOS = {
  proposta: 'PROPOSTA',
  fim: 'O farol está aceso. O planetinha ficou visível.',
  dica: {
    pedra: 'A Pedra chegou. A lasca gira sozinha.',
    bronze: 'O Bronze chegou. Escolha a lança quando o nível subir.',
    ferro: 'O Ferro escurece. A faísca e a fogueira iluminam.',
    farol: 'O farol está aceso. O planetinha ficou visível.',
  },
  cartas: {
    lasca: { nome: 'Lasca de pedra', texto: 'Pedras passam a girar em volta.' },
    lanca: { nome: 'Lança de bronze', texto: 'Um tiro vai no inimigo mais perto.' },
    faisca: { nome: 'Faísca de ferro', texto: 'Uma aura curta queima quem chega.' },
    fogueira: { nome: 'Fogueira', texto: 'A aura cresce e acende uma luz.' },
    dano: { nome: 'Golpe mais forte', texto: 'As armas que você tem doem mais.' },
    ritmo: { nome: 'Mais rápido', texto: 'As armas disparam com menos espera.' },
    vida: { nome: 'Mais fôlego', texto: 'A vida máxima sobe e você se cura.' },
  },
};

/** EXP para ir do nível `nivel` ao próximo. Fórmula de src/game/leveling.ts. */
export function xpPara(nivel) {
  const n = Math.max(1, nivel);
  return Math.floor(5 + (n - 1) * 9 + Math.max(0, n - 20) * 6 + Math.max(0, n - 40) * 10);
}

/** 1, 2 ou 3, no espírito de xpTier em src/game/pickups.ts. Os cortes estão no CONFIG. */
export function faixaXp(valor) {
  const [miuda, media, grande] = CONFIG.xpFaixa;
  if (valor >= grande) return 3;
  if (valor >= media) return 2;
  if (valor >= miuda) return 1;
  return 1;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function aleatorio(estado) {
  if (!estado._rng) estado._rng = mulberry(estado.semente >>> 0);
  return estado._rng();
}

function embaralhar(lista, estado) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio(estado) * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function criarMundo(semente = CONFIG.sementeIlha) {
  const ilha = gerarIlha(semente);
  return {
    terreno: ilha.terreno,
    recursos: ilha.recursos.slice(),
    lista: ilha.lista,
    colunas: ilha.colunas,
    linhas: ilha.linhas,
    inicio: ilha.inicio,
    farol: ilha.farol,
    cratera: ilha.cratera,
    amostras: ilha.amostras,
    travessia: ilha.travessia,
    geracaoMs: ilha.geracaoMs,
    contagem: ilha.contagem,
  };
}

/** Segundos para cruzar a ilha em linha reta, na velocidade do Samuel. */
export function tempoDeTravessia(estado, velocidade = CONFIG.velocidade) {
  const largura = estado?.travessia?.larguraPx || 0;
  return largura / Math.max(1, velocidade);
}

function carta(id, tipo) {
  const texto = TEXTOS.cartas[id];
  return { id, tipo, nome: texto.nome, texto: texto.texto, proposta: true };
}

function pool(estado) {
  const lista = [];
  const era = ERAS[estado.era].ordem;
  if (!estado.armas.lasca) lista.push(carta('lasca', 'arma'));
  if (era >= 1 && !estado.armas.lanca) lista.push(carta('lanca', 'arma'));
  if (era >= 2 && !estado.armas.faisca) lista.push(carta('faisca', 'arma'));
  if (estado.armas.faisca && !estado.fogueira) lista.push(carta('fogueira', 'luz'));
  lista.push(carta('dano', 'melhorar'));
  lista.push(carta('ritmo', 'melhorar'));
  lista.push(carta('vida', 'vida'));
  return lista;
}

function abrirCartas(estado) {
  const tres = embaralhar(pool(estado), estado).slice(0, 3);
  while (tres.length < 3) tres.push(carta('vida', 'vida'));
  estado.cartas = tres;
  estado.pausa = true;
}

export function ganharXp(estado, quantidade) {
  if (estado.vitoria) return estado;
  const q = Math.max(0, Number(quantidade) || 0);
  estado.xp += q;
  while (estado.xp >= estado.xpProx) {
    estado.xp -= estado.xpProx;
    estado.nivel += 1;
    estado.xpProx = xpPara(estado.nivel);
    estado.niveisPendentes += 1;
  }
  if (estado.niveisPendentes > 0 && !estado.pausa) abrirCartas(estado);
  return estado;
}

function aplicarCarta(estado, c) {
  if (!c) return;
  if (c.tipo === 'arma') estado.armas[c.id] = { nivel: 1 };
  else if (c.id === 'dano') estado.danoMult *= 1 + CONFIG.melhorarDano;
  else if (c.id === 'ritmo') estado.ritmo *= CONFIG.melhorarIntervalo;
  else if (c.id === 'fogueira') estado.fogueira = true;
  else if (c.id === 'vida') {
    estado.vidaMax += CONFIG.vidaCarta;
    estado.vida = Math.min(estado.vidaMax, estado.vida + CONFIG.vidaCarta);
  }
}

export function escolherCarta(estado, indice) {
  if (!estado.pausa || !estado.cartas.length) return { ok: false, motivo: 'sem-carta' };
  const i = Math.max(0, Math.min(estado.cartas.length - 1, indice | 0));
  const escolhida = estado.cartas[i];
  aplicarCarta(estado, escolhida);
  estado.niveisPendentes = Math.max(0, estado.niveisPendentes - 1);
  estado.efeitos.push({ tipo: 'levelup', x: estado.x, y: estado.y, idade: 0, duracao: CONFIG.efeitoLevel });
  if (estado.niveisPendentes > 0) abrirCartas(estado);
  else {
    estado.pausa = false;
    estado.cartas = [];
  }
  return { ok: true, carta: escolhida };
}

export function criarPartida() {
  const mundo = criarMundo();
  return {
    proposta: true,
    modo: 'facil',
    semMorte: true,
    morte: false,
    direcao: 0,
    era: 'pedra',
    tempo: 0,
    x: mundo.inicio.x,
    y: mundo.inicio.y,
    inicio: mundo.inicio,
    farolPos: mundo.farol,
    cratera: mundo.cratera,
    amostras: mundo.amostras,
    travessia: mundo.travessia,
    geracaoMs: mundo.geracaoMs,
    terreno: mundo.terreno,
    recursos: mundo.recursos,
    lista: mundo.lista,
    colunas: mundo.colunas,
    linhas: mundo.linhas,
    vida: CONFIG.vidaMax,
    vidaMax: CONFIG.vidaMax,
    nivel: 1,
    xp: 0,
    xpProx: xpPara(1),
    niveisPendentes: 0,
    pausa: false,
    cartas: [],
    armas: { lasca: { nivel: 1 } },
    danoMult: 1,
    ritmo: 1,
    fogueira: false,
    farol: false,
    vitoria: false,
    invulneravel: 0,
    chefesMortos: { pedra: false, bronze: false, ferro: false },
    chefe: null,
    inimigos: [],
    projeteis: [],
    zonas: [],
    enchente: null,
    tempestade: null,
    gemas: [],
    efeitos: [],
    nascer: 0,
    anguloLasca: 0,
    tiroEm: 0.6,
    eventosFeitos: {},
    semente: CONFIG.sementeIlha,
    seq: 1,
    desdeSave: 0,
  };
}

function bloqueia(estado, x, y) {
  const col = Math.floor(x / CONFIG.bloco);
  const lin = Math.floor(y / CONFIG.bloco);
  if (lin < 0 || col < 0 || lin >= estado.linhas || col >= estado.colunas) return true;
  const i = lin * estado.colunas + col;
  if (estado.terreno[i] === CHAO.FUNDO) return true;
  return estado.recursos[i] !== NO.NENHUM;
}

function cabe(estado, x, y, raio) {
  return [[0, 0], [raio, 0], [-raio, 0], [0, raio], [0, -raio]].every(([ox, oy]) => !bloqueia(estado, x + ox, y + oy));
}

/** Anda e devolve true se o passo inteiro bateu em chão ou recurso. */
function andar(estado, corpo, vx, vy, dt) {
  const raio = Math.min(corpo.raio || CONFIG.raioJogador, 12);
  const dx = vx * dt;
  const dy = vy * dt;
  if (dx === 0 && dy === 0) return false;
  const nx = corpo.x + dx;
  const ny = corpo.y + dy;
  if (cabe(estado, nx, ny, raio)) {
    corpo.x = nx;
    corpo.y = ny;
    return false;
  }
  let andou = false;
  if (cabe(estado, nx, corpo.y, raio)) {
    corpo.x = nx;
    andou = true;
  }
  if (cabe(estado, corpo.x, ny, raio)) {
    corpo.y = ny;
    andou = true;
  }
  return !andou;
}

function pertoAndavel(estado, x, y) {
  if (cabe(estado, x, y, 8)) return { x, y };
  const bloco = CONFIG.bloco;
  const col = Math.floor(x / bloco);
  const lin = Math.floor(y / bloco);
  for (let r = 1; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const px = (col + dx + 0.5) * bloco;
        const py = (lin + dy + 0.5) * bloco;
        if (cabe(estado, px, py, 8)) return { x: px, y: py };
      }
    }
  }
  return null;
}

function livre(estado, x, y) {
  return cabe(estado, x, y, CONFIG.raioJogador);
}

function moverJogador(estado, dt, eixo) {
  let x = Number(eixo?.x) || 0;
  let y = Number(eixo?.y) || 0;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  if (len === 0) return;
  estado.direcao = dir8(x, y);
  const lenta = estado.enchente && estado.enchente.resta > 0 ? CONFIG.enchente.lenta : 1;
  const v = CONFIG.velocidade * lenta * dt;
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

export function receberDano(estado, quantidade) {
  if (estado.vitoria || estado.invulneravel > 0 || estado.pausa) return estado;
  const antes = {
    xp: estado.xp,
    nivel: estado.nivel,
    era: estado.era,
    armas: { ...estado.armas },
    fogueira: estado.fogueira,
    farol: estado.farol,
  };
  estado.vida -= Math.max(0, Number(quantidade) || 0);
  if (estado.vida <= 0) {
    estado.vida = estado.vidaMax;
    estado.x = estado.inicio.x;
    estado.y = estado.inicio.y;
    estado.invulneravel = CONFIG.invulneravelSegundos;
    estado.morte = false;
    estado.xp = antes.xp;
    estado.nivel = antes.nivel;
    estado.era = antes.era;
    estado.armas = antes.armas;
    estado.fogueira = antes.fogueira;
    estado.farol = antes.farol;
  }
  return estado;
}

function defDe(tipo) {
  return CONFIG.inimigos[tipo];
}

function criarInimigo(estado, tipo, x, y, extra = {}) {
  const def = defDe(tipo);
  const id = estado.seq++;
  return {
    id,
    tipo,
    sprite: def.sprite,
    x, y,
    hp: def.hp * (extra.elite ? 2 : 1),
    hpMax: def.hp * (extra.elite ? 2 : 1),
    raio: def.raio,
    velocidade: def.velocidade,
    xp: def.xp,
    dano: def.dano,
    comportamento: def.comportamento,
    direcao: 0,
    andando: false,
    contatoEm: 0,
    lascaEm: 0,
    auraEm: 0,
    tiroEm: def.intervalo || 2,
    ttl: extra.ttl || 0,
    vx: extra.vx || 0,
    vy: extra.vy || 0,
    elite: !!extra.elite,
    chefe: def.comportamento === 'chefe',
  };
}

function soltarGema(estado, x, y, valor) {
  const faixa = faixaXp(valor);
  estado.gemas.push({ x, y, valor, faixa, sprite: `xp-${faixa}` });
}

function matarInimigo(estado, inimigo) {
  estado.inimigos = estado.inimigos.filter((i) => i.id !== inimigo.id);
  estado.efeitos.push({ tipo: 'morte', x: inimigo.x, y: inimigo.y, idade: 0, duracao: CONFIG.efeitoMorte });
  soltarGema(estado, inimigo.x, inimigo.y, inimigo.xp);
}

function eraDaHorda(estado) {
  if (!estado.chefesMortos.pedra) return 'pedra';
  if (!estado.chefesMortos.bronze) return 'bronze';
  return 'ferro';
}

function vivosNormais(estado) {
  return estado.inimigos.length;
}

function pontoFora(estado, ang) {
  const d = CONFIG.distanciaOnda;
  const x = estado.x + Math.cos(ang) * d;
  const y = estado.y + Math.sin(ang) * d;
  return pertoAndavel(estado, x, y);
}

function spawnRing(estado, tipo, n) {
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const p = pontoFora(estado, ang);
    if (p) estado.inimigos.push(criarInimigo(estado, tipo, p.x, p.y));
  }
}

function spawnSwarm(estado, tipo, n) {
  const rumo = aleatorio(estado) * Math.PI * 2;
  const def = defDe(tipo);
  const vel = def.velocidade || 80;
  const vx = Math.cos(rumo) * vel;
  const vy = Math.sin(rumo) * vel;
  const d = CONFIG.distanciaOnda;
  for (let i = 0; i < n; i++) {
    const lado = (aleatorio(estado) - 0.5) * 80;
    const atras = aleatorio(estado) * 40;
    const brutoX = estado.x - Math.cos(rumo) * (d + atras) - Math.sin(rumo) * lado;
    const brutoY = estado.y - Math.sin(rumo) * (d + atras) + Math.cos(rumo) * lado;
    const p = pertoAndavel(estado, brutoX, brutoY);
    if (p) estado.inimigos.push(criarInimigo(estado, tipo, p.x, p.y, { vx, vy, ttl: (d * 2 + 80) / vel }));
  }
}

function spawnMeteoros(estado) {
  const cfg = CONFIG.meteoros;
  for (let i = 0; i < cfg.n; i++) {
    const ang = aleatorio(estado) * Math.PI * 2;
    const dist = 24 + aleatorio(estado) * 70;
    estado.zonas.push({
      evento: 'meteoros',
      x: estado.x + Math.cos(ang) * dist,
      y: estado.y + Math.sin(ang) * dist,
      raio: cfg.raio,
      resta: cfg.aviso,
      dano: cfg.dano,
      sprite: 'telegraph',
    });
  }
}

function abrirEnchente(estado) {
  estado.enchente = {
    x: estado.x,
    y: estado.y,
    raio: CONFIG.enchente.raio,
    resta: CONFIG.enchente.duracao,
    golpeEm: 0.2,
  };
}

function spawnRaios(estado) {
  const cfg = CONFIG.raios;
  estado.tempestade = { resta: cfg.aviso + cfg.duracao };
  for (let i = 0; i < cfg.n; i++) {
    const ang = aleatorio(estado) * Math.PI * 2;
    const dist = 16 + aleatorio(estado) * 64;
    estado.zonas.push({
      evento: 'raios',
      x: estado.x + Math.cos(ang) * dist,
      y: estado.y + Math.sin(ang) * dist,
      raio: cfg.raio,
      resta: cfg.aviso,
      dano: cfg.dano,
      sprite: 'telegraph',
    });
  }
}

function spawnChefe(estado, tipo) {
  const ang = aleatorio(estado) * Math.PI * 2;
  const p = pontoFora(estado, ang) || { x: estado.x + 48, y: estado.y };
  const corpo = criarInimigo(estado, tipo, p.x, p.y);
  estado.chefe = {
    ...corpo,
    fase: 1,
    ataqueEm: 1.1,
    telegrafo: 0,
    modo: null,
    investida: 0,
    vx: 0,
    vy: 0,
    anelExtra: false,
  };
}

function chefeDevido(estado, chave) {
  if (chave === 'pedraChefe') return !estado.chefesMortos.pedra;
  if (chave === 'bronzeChefe') return estado.chefesMortos.pedra && !estado.chefesMortos.bronze;
  if (chave === 'ferroChefe') return estado.chefesMortos.bronze && !estado.chefesMortos.ferro;
  return false;
}

function verificarMarcos(estado) {
  for (const [chave, marco] of Object.entries(CONFIG.marcos)) {
    if (estado.eventosFeitos[chave] || estado.tempo < marco.em) continue;
    if (!marco.kind && (!chefeDevido(estado, chave) || estado.chefe)) continue;
    estado.eventosFeitos[chave] = true;
    if (marco.kind === 'ring') spawnRing(estado, marco.tipo, marco.n);
    else if (marco.kind === 'swarm') spawnSwarm(estado, marco.tipo, marco.n);
    else if (marco.kind === 'meteoros') spawnMeteoros(estado);
    else if (marco.kind === 'enchente') abrirEnchente(estado);
    else if (marco.kind === 'raios') spawnRaios(estado);
    else spawnChefe(estado, marco.tipo);
  }
}

function nascerHorda(estado, dt) {
  if (estado.chefe && estado.chefe.tipo === 'colosso-de-ferro') return;
  const era = eraDaHorda(estado);
  estado.era = era;
  const etapa = CONFIG.eras[era];
  let taxa = etapa.taxa;
  let max = etapa.max;
  if (estado.chefe) {
    taxa *= CONFIG.chefeAfina;
    max = Math.min(max, CONFIG.chefeMaxVivos);
  }
  estado.nascer += dt * taxa;
  while (estado.nascer >= 1 && vivosNormais(estado) < max) {
    estado.nascer -= 1;
    const tipo = etapa.horda[Math.floor(aleatorio(estado) * etapa.horda.length)];
    const p = pontoFora(estado, aleatorio(estado) * Math.PI * 2);
    if (p) estado.inimigos.push(criarInimigo(estado, tipo, p.x, p.y));
  }
}

function perseguir(corpo, estado, dt, vel) {
  const dx = estado.x - corpo.x;
  const dy = estado.y - corpo.y;
  const len = Math.hypot(dx, dy) || 1;
  corpo.direcao = dir8(dx, dy);
  andar(estado, corpo, (dx / len) * vel, (dy / len) * vel, dt);
}

function tocarJogador(estado, corpo, dano = corpo.dano) {
  if (corpo.contatoEm > 0 || dano <= 0) return;
  const d = Math.hypot(estado.x - corpo.x, estado.y - corpo.y);
  if (d <= corpo.raio + CONFIG.raioJogador) {
    corpo.contatoEm = CONFIG.contatoEspera;
    receberDano(estado, dano);
  }
}

function cuspir(estado, x, y, ang) {
  const vel = CONFIG.cuspeVelocidade;
  estado.projeteis.push({
    id: estado.seq++,
    sprite: 'faisca',
    x,
    y,
    vx: Math.cos(ang) * vel,
    vy: Math.sin(ang) * vel,
    dano: CONFIG.cuspeDano,
    raio: 6,
    aliado: false,
    direcao: dir8(Math.cos(ang), Math.sin(ang)),
  });
}

function urso(estado, dt) {
  const chefe = estado.chefe;
  chefe.fase = faseDoChefe(chefe);
  chefe.contatoEm = Math.max(0, (chefe.contatoEm || 0) - dt);
  chefe.lascaEm = Math.max(0, (chefe.lascaEm || 0) - dt);
  chefe.auraEm = Math.max(0, (chefe.auraEm || 0) - dt);
  const dx = estado.x - chefe.x;
  const dy = estado.y - chefe.y;
  const dist = Math.hypot(dx, dy) || 1;
  chefe.direcao = dir8(dx, dy);
  const modo = chefe.modo || 'anda';
  if (modo === 'prepara') {
    chefe.telegrafo -= dt;
    if (chefe.telegrafo <= 0) {
      chefe.modo = 'investe';
      const folego = chefe.fase === 2 ? 1.2 : 1;
      chefe.investida = CONFIG.ursoInvestidaTempo;
      chefe.vx = (dx / dist) * CONFIG.ursoInvestida * folego;
      chefe.vy = (dy / dist) * CONFIG.ursoInvestida * folego;
    }
  } else if (modo === 'investe') {
    chefe.investida -= dt;
    const bateu = andar(estado, chefe, chefe.vx, chefe.vy, dt);
    if (bateu) {
      chefe.modo = 'atordoado';
      chefe.telegrafo = CONFIG.ursoAtordoado;
      chefe.vx = 0;
      chefe.vy = 0;
    } else if (chefe.investida <= 0) {
      chefe.modo = 'anda';
      chefe.ataqueEm = chefe.fase === 2 ? 1.3 : 2.2;
    }
  } else if (modo === 'atordoado') {
    chefe.telegrafo -= dt;
    if (chefe.telegrafo <= 0) {
      chefe.modo = 'anda';
      chefe.ataqueEm = 1.5;
    }
  } else {
    const vel = chefe.velocidade * (chefe.fase === 2 ? 1.25 : 1);
    andar(estado, chefe, (dx / dist) * vel, (dy / dist) * vel, dt);
    chefe.ataqueEm = (chefe.ataqueEm ?? 1.1) - dt;
    if (chefe.ataqueEm <= 0 && dist < CONFIG.ursoAlcance) {
      chefe.modo = 'prepara';
      chefe.telegrafo = CONFIG.ursoPreparo;
      estado.zonas.push({
        x: chefe.x, y: chefe.y, raio: chefe.raio + 14,
        resta: CONFIG.ursoPreparo, dano: 0, sprite: 'telegraph',
      });
    }
  }
  if (chefe.modo !== 'atordoado') {
    tocarJogador(estado, chefe, chefe.dano * (chefe.modo === 'investe' ? 1.3 : 0.7));
  }
}

function sentinela(estado, dt) {
  const chefe = estado.chefe;
  chefe.fase = faseDoChefe(chefe);
  chefe.contatoEm = Math.max(0, (chefe.contatoEm || 0) - dt);
  chefe.lascaEm = Math.max(0, (chefe.lascaEm || 0) - dt);
  chefe.auraEm = Math.max(0, (chefe.auraEm || 0) - dt);
  if (!chefe.casa) chefe.casa = { x: chefe.x, y: chefe.y };
  chefe.orbita = (chefe.orbita || 0) + dt * (chefe.fase === 2 ? 1.3 : 0.8);
  const voltaX = chefe.casa.x + Math.cos(chefe.orbita) * CONFIG.bloco * 3;
  const voltaY = chefe.casa.y + Math.sin(chefe.orbita) * CONFIG.bloco * 3;
  let ax = voltaX * 0.75 + estado.x * 0.25;
  let ay = voltaY * 0.75 + estado.y * 0.25;
  const limite = CONFIG.bloco * 8;
  const lx = ax - chefe.casa.x;
  const ly = ay - chefe.casa.y;
  const ld = Math.hypot(lx, ly);
  if (ld > limite) {
    ax = chefe.casa.x + (lx / ld) * limite;
    ay = chefe.casa.y + (ly / ld) * limite;
  }
  const vel = (chefe.velocidade || 40) * (chefe.fase === 2 ? 1.8 : 1.3);
  const dx = ax - chefe.x;
  const dy = ay - chefe.y;
  const dist = Math.hypot(dx, dy) || 1;
  chefe.x += (dx / dist) * vel * dt;
  chefe.y += (dy / dist) * vel * dt;
  chefe.direcao = dir8(estado.x - chefe.x, estado.y - chefe.y);
  chefe.ataqueEm = (chefe.ataqueEm ?? 1.1) - dt;
  if (chefe.ataqueEm <= 0) {
    chefe.faseVoo = (chefe.faseVoo || 0) + 1;
    chefe.ataqueEm = chefe.fase === 2 ? CONFIG.sentinelaCuspeRaiva : CONFIG.sentinelaCuspe;
    const base = Math.atan2(estado.y - chefe.y, estado.x - chefe.x);
    if (chefe.fase === 2 && chefe.faseVoo % 3 === 0) {
      for (let i = 0; i < 8; i++) cuspir(estado, chefe.x, chefe.y, (i / 8) * Math.PI * 2);
    } else {
      for (let i = 0; i < CONFIG.cuspeFan; i++) cuspir(estado, chefe.x, chefe.y, base + (i - 2) * 0.22);
    }
  }
  tocarJogador(estado, chefe, chefe.dano);
}

function atualizarInimigos(estado, dt) {
  const ficam = [];
  for (const inimigo of estado.inimigos) {
    inimigo.contatoEm = Math.max(0, inimigo.contatoEm - dt);
    inimigo.lascaEm = Math.max(0, inimigo.lascaEm - dt);
    inimigo.auraEm = Math.max(0, inimigo.auraEm - dt);
    if (inimigo.comportamento === 'flyby') {
      inimigo.x += inimigo.vx * dt;
      inimigo.y += inimigo.vy * dt;
      inimigo.ttl -= dt;
      inimigo.direcao = dir8(inimigo.vx, inimigo.vy);
      if (inimigo.ttl <= 0) continue;
    } else if (inimigo.comportamento === 'zigue') {
      const dx = estado.x - inimigo.x;
      const dy = estado.y - inimigo.y;
      const len = Math.hypot(dx, dy) || 1;
      const lado = Math.sin((inimigo.faseZ = (inimigo.faseZ || 0) + dt * 7)) * inimigo.velocidade;
      inimigo.direcao = dir8(dx, dy);
      andar(
        estado,
        inimigo,
        (dx / len) * inimigo.velocidade + (-dy / len) * lado,
        (dy / len) * inimigo.velocidade + (dx / len) * lado,
        dt,
      );
    } else if (inimigo.comportamento === 'torre') {
      inimigo.tiroEm -= dt;
      if (inimigo.tiroEm <= 0) {
        inimigo.tiroEm = defDe(inimigo.tipo).intervalo;
        atirar(estado, inimigo.x, inimigo.y, estado.x, estado.y, 'pedregulho', false);
      }
    } else {
      perseguir(inimigo, estado, dt, inimigo.velocidade);
    }
    tocarJogador(estado, inimigo);
    if (inimigo.hp > 0) ficam.push(inimigo);
  }
  estado.inimigos = ficam;
}

function atirar(estado, x, y, ax, ay, sprite, aliado) {
  const dx = ax - x;
  const dy = ay - y;
  const len = Math.hypot(dx, dy) || 1;
  const vel = sprite === 'pedregulho' ? CONFIG.armas.pedregulho.velocidade : CONFIG.armas.lanca.velocidade;
  const dano = sprite === 'pedregulho' ? CONFIG.armas.pedregulho.dano : CONFIG.armas.lanca.dano;
  const raio = sprite === 'pedregulho' ? CONFIG.armas.pedregulho.raio : CONFIG.armas.lanca.raio;
  estado.projeteis.push({
    id: estado.seq++,
    sprite,
    x, y,
    vx: (dx / len) * vel,
    vy: (dy / len) * vel,
    dano,
    raio,
    aliado,
    direcao: dir8(dx, dy),
  });
}

function faseDoChefe(chefe) {
  return chefe.hp <= chefe.hpMax * CONFIG.chefeMeia ? 2 : 1;
}

function dispararChefe(estado) {
  const chefe = estado.chefe;
  chefe.fase = faseDoChefe(chefe);
  const tipo = chefe.tipo;
  if (tipo === 'urso-da-caverna') {
    if (chefe.modo === 'circulo') {
      estado.zonas.push({
        x: estado.x, y: estado.y, raio: CONFIG.chefeCirculo,
        resta: 0, dano: chefe.dano, sprite: 'telegraph',
      });
      receberDano(estado, Math.hypot(estado.x - chefe.x, estado.y - chefe.y) < CONFIG.chefeCirculo + 8 ? chefe.dano : 0);
      chefe.modo = 'investida';
    } else {
      const dx = estado.x - chefe.x;
      const dy = estado.y - chefe.y;
      const len = Math.hypot(dx, dy) || 1;
      const vel = CONFIG.chefeInvestida * (chefe.fase === 2 ? 1.35 : 1);
      chefe.vx = (dx / len) * vel;
      chefe.vy = (dy / len) * vel;
      chefe.investida = CONFIG.chefeInvestidaTempo;
      chefe.modo = 'circulo';
    }
  } else if (tipo === 'sentinela-de-bronze') {
    const vezes = chefe.fase === 2 ? 2 : 1;
    for (let v = 0; v < vezes; v++) {
      for (let i = 0; i < CONFIG.chefeAnel; i++) {
        const ang = (i / CONFIG.chefeAnel) * Math.PI * 2 + v * 0.4;
        const ax = chefe.x + Math.cos(ang) * 80;
        const ay = chefe.y + Math.sin(ang) * 80;
        atirar(estado, chefe.x, chefe.y, ax, ay, 'lanca', false);
      }
    }
  } else {
    const dx = estado.x - chefe.x;
    const dy = estado.y - chefe.y;
    const len = Math.hypot(dx, dy) || 1;
    chefe.vx = (dx / len) * CONFIG.chefeInvestida;
    chefe.vy = (dy / len) * CONFIG.chefeInvestida;
    chefe.investida = CONFIG.chefeInvestidaTempo;
    for (let i = -1; i <= 1; i++) {
      const ang = Math.atan2(dy, dx) + i * 0.35;
      atirar(estado, chefe.x, chefe.y, chefe.x + Math.cos(ang) * 40, chefe.y + Math.sin(ang) * 40, 'pedregulho', false);
    }
  }
}

function atualizarChefe(estado, dt) {
  const chefe = estado.chefe;
  if (!chefe) return;
  if (chefe.hp <= 0) {
    ferirCorpo(estado, chefe, 0);
    return;
  }
  if (chefe.tipo === 'urso-da-caverna') {
    urso(estado, dt);
    return;
  }
  if (chefe.tipo === 'sentinela-de-bronze') {
    sentinela(estado, dt);
    return;
  }
  chefe.fase = faseDoChefe(chefe);
  chefe.contatoEm = Math.max(0, (chefe.contatoEm || 0) - dt);
  chefe.lascaEm = Math.max(0, (chefe.lascaEm || 0) - dt);
  chefe.auraEm = Math.max(0, (chefe.auraEm || 0) - dt);
  if (chefe.investida > 0) {
    chefe.investida -= dt;
    chefe.x += chefe.vx * dt;
    chefe.y += chefe.vy * dt;
  } else if (chefe.tipo !== 'sentinela-de-bronze') {
    perseguir(chefe, estado, dt, chefe.velocidade * (chefe.fase === 2 ? 1.25 : 1));
  } else {
    const dx = estado.x - chefe.x;
    const dy = estado.y - chefe.y;
    chefe.direcao = dir8(dx, dy);
  }
  tocarJogador(estado, chefe);
  if (chefe.telegrafo > 0) {
    chefe.telegrafo -= dt;
    if (chefe.telegrafo <= 0) dispararChefe(estado);
    return;
  }
  chefe.ataqueEm -= dt;
  if (chefe.ataqueEm <= 0) {
    chefe.telegrafo = CONFIG.chefeTelegraph;
    chefe.ataqueEm = (chefe.fase === 2 ? CONFIG.chefeTelegraph * 1.4 : 2.1);
    estado.zonas.push({
      x: chefe.x, y: chefe.y, raio: chefe.raio + 10,
      resta: CONFIG.chefeTelegraph, dano: 0, sprite: 'telegraph',
    });
  }
}

function ferirCorpo(estado, corpo, dano) {
  if (!corpo) return;
  if (corpo.hp > 0 && dano > 0) {
    const atordoado = estado.chefe && corpo.id === estado.chefe.id && estado.chefe.modo === 'atordoado';
    corpo.hp -= dano * estado.danoMult * (atordoado ? 2 : 1);
    estado.efeitos.push({ tipo: 'acerto', x: corpo.x, y: corpo.y, idade: 0, duracao: CONFIG.efeitoAcerto });
  }
  if (corpo.hp > 0) return;
  if (estado.chefe && corpo.id === estado.chefe.id) {
    const tipo = corpo.tipo;
    const xp = corpo.xp;
    const x = corpo.x;
    const y = corpo.y;
    estado.chefe = null;
    estado.efeitos.push({ tipo: 'morte', x, y, idade: 0, duracao: CONFIG.efeitoMorte });
    soltarGema(estado, x, y, xp);
    if (tipo === 'urso-da-caverna') {
      estado.chefesMortos.pedra = true;
      estado.era = 'bronze';
    } else if (tipo === 'sentinela-de-bronze') {
      estado.chefesMortos.bronze = true;
      estado.era = 'ferro';
    } else if (tipo === 'colosso-de-ferro') {
      estado.chefesMortos.ferro = true;
      estado.farol = true;
      estado.vitoria = true;
      estado.inimigos = [];
      estado.projeteis = [];
      estado.zonas = [];
    }
  } else {
    matarInimigo(estado, corpo);
  }
}

function atualizarArmas(estado, dt) {
  const alvos = estado.inimigos.slice();
  if (estado.chefe) alvos.push(estado.chefe);
  if (estado.armas.lasca) {
    estado.anguloLasca += CONFIG.armas.lasca.giro * dt;
    const n = CONFIG.armas.lasca.orbes;
    for (let i = 0; i < n; i++) {
      const ang = estado.anguloLasca + (i / n) * Math.PI * 2;
      const x = estado.x + Math.cos(ang) * CONFIG.armas.lasca.orbita;
      const y = estado.y + Math.sin(ang) * CONFIG.armas.lasca.orbita;
      for (const alvo of alvos) {
        if (alvo.lascaEm > 0) continue;
        if (Math.hypot(alvo.x - x, alvo.y - y) <= alvo.raio + CONFIG.armas.lasca.raio) {
          alvo.lascaEm = CONFIG.armas.lasca.intervalo;
          ferirCorpo(estado, alvo, CONFIG.armas.lasca.dano);
        }
      }
    }
  }
  if (estado.armas.lanca) {
    estado.tiroEm -= dt;
    if (estado.tiroEm <= 0) {
      estado.tiroEm = CONFIG.armas.lanca.intervalo * estado.ritmo;
      let perto = null;
      let melhor = Infinity;
      for (const alvo of alvos) {
        const d = Math.hypot(alvo.x - estado.x, alvo.y - estado.y);
        if (d < melhor) {
          melhor = d;
          perto = alvo;
        }
      }
      if (perto) atirar(estado, estado.x, estado.y, perto.x, perto.y, 'lanca', true);
    }
  }
  const raioFa = (estado.armas.faisca ? CONFIG.armas.faisca.raio : 0) + (estado.fogueira ? CONFIG.armas.fogueira.raioExtra : 0);
  const danoFa = (estado.armas.faisca ? CONFIG.armas.faisca.dano : 0) + (estado.fogueira ? CONFIG.armas.fogueira.dano : 0);
  if (raioFa > 0) {
    for (const alvo of alvos) {
      if (alvo.auraEm > 0) continue;
      if (Math.hypot(alvo.x - estado.x, alvo.y - estado.y) <= raioFa + alvo.raio) {
        alvo.auraEm = (estado.armas.faisca ? CONFIG.armas.faisca.intervalo : CONFIG.armas.fogueira.intervalo) * estado.ritmo;
        ferirCorpo(estado, alvo, danoFa);
      }
    }
  }
}

function atualizarProjeteis(estado, dt) {
  const ficam = [];
  for (const p of estado.projeteis) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    let sumiu = false;
    if (p.aliado) {
      const alvos = estado.chefe ? estado.inimigos.concat(estado.chefe) : estado.inimigos;
      for (const alvo of alvos) {
        if (Math.hypot(alvo.x - p.x, alvo.y - p.y) <= alvo.raio + p.raio) {
          ferirCorpo(estado, alvo, p.dano);
          sumiu = true;
          break;
        }
      }
    } else if (Math.hypot(estado.x - p.x, estado.y - p.y) <= CONFIG.raioJogador + p.raio) {
      receberDano(estado, p.dano);
      sumiu = true;
    }
    if (!sumiu && Math.hypot(p.x - estado.x, p.y - estado.y) < 520) ficam.push(p);
  }
  estado.projeteis = ficam;
}

function atualizarZonas(estado, dt) {
  const ficam = [];
  for (const z of estado.zonas) {
    z.resta -= dt;
    if (z.resta <= 0 && z.dano > 0 && Math.hypot(estado.x - z.x, estado.y - z.y) <= z.raio) {
      receberDano(estado, z.dano);
    }
    if (z.resta > -0.15) ficam.push(z);
  }
  estado.zonas = ficam;
}

function atualizarGemas(estado, dt) {
  const ficam = [];
  for (const g of estado.gemas) {
    const dx = estado.x - g.x;
    const dy = estado.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < CONFIG.raioColeta) {
      g.x += (dx / d) * CONFIG.ima * dt;
      g.y += (dy / d) * CONFIG.ima * dt;
    }
    if (d < 10) ganharXp(estado, g.valor);
    else ficam.push(g);
  }
  estado.gemas = ficam;
}

function atualizarEnchente(estado, dt) {
  const agua = estado.enchente;
  if (!agua) return;
  agua.resta -= dt;
  agua.golpeEm -= dt;
  if (agua.golpeEm <= 0) {
    agua.golpeEm = CONFIG.enchente.intervalo;
    if (Math.hypot(estado.x - agua.x, estado.y - agua.y) <= agua.raio) receberDano(estado, CONFIG.enchente.dano);
  }
  if (agua.resta <= 0) estado.enchente = null;
}

function atualizarTempestade(estado, dt) {
  if (!estado.tempestade) return;
  estado.tempestade.resta -= dt;
  if (estado.tempestade.resta <= 0) estado.tempestade = null;
}

function atualizarEfeitos(estado, dt) {
  for (const fx of estado.efeitos) fx.idade += dt;
  estado.efeitos = estado.efeitos.filter((fx) => fx.idade < fx.duracao);
}

function colher(estado) {
  const alcance = 22;
  const bloco = CONFIG.bloco;
  const c0 = Math.floor((estado.x - alcance) / bloco);
  const c1 = Math.floor((estado.x + alcance) / bloco);
  const l0 = Math.floor((estado.y - alcance) / bloco);
  const l1 = Math.floor((estado.y + alcance) / bloco);
  for (let lin = l0; lin <= l1; lin++) {
    for (let col = c0; col <= c1; col++) {
      if (lin < 0 || col < 0 || lin >= estado.linhas || col >= estado.colunas) continue;
      const i = lin * estado.colunas + col;
      const tipo = estado.recursos[i];
      if (tipo !== NO.ARBUSTO && tipo !== NO.VEIO) continue;
      const cx = (col + 0.5) * bloco;
      const cy = (lin + 0.5) * bloco;
      if (Math.hypot(estado.x - cx, estado.y - cy) > alcance + 10) continue;
      estado.recursos[i] = NO.NENHUM;
      if (tipo === NO.ARBUSTO) estado.vida = Math.min(estado.vidaMax, estado.vida + CONFIG.curaArbusto);
      else soltarGema(estado, cx, cy, CONFIG.xpVeio);
    }
  }
}

function passo(estado, dt, eixo) {
  if (estado.pausa || estado.vitoria) return;
  estado.invulneravel = Math.max(0, estado.invulneravel - dt);
  moverJogador(estado, dt, eixo);
  colher(estado);
  estado.tempo += dt;
  estado.desdeSave += dt;
  verificarMarcos(estado);
  if (!estado.vitoria) nascerHorda(estado, dt);
  atualizarInimigos(estado, dt);
  atualizarChefe(estado, dt);
  atualizarArmas(estado, dt);
  atualizarProjeteis(estado, dt);
  atualizarZonas(estado, dt);
  atualizarGemas(estado, dt);
  atualizarEnchente(estado, dt);
  atualizarTempestade(estado, dt);
  atualizarEfeitos(estado, dt);
  estado.era = estado.vitoria ? 'ferro' : eraDaHorda(estado);
}

export function tick(estado, dt, eixo) {
  let rest = Math.max(0, Number(dt) || 0);
  while (rest > 0) {
    if (estado.pausa || estado.vitoria) return estado;
    const h = Math.min(0.05, rest);
    passo(estado, h, eixo);
    rest -= h;
  }
  return estado;
}

export function escuridao(estado) {
  if (!estado || estado.vitoria) return 0;
  const dia = CONFIG.duracaoDia;
  const tod = ((estado.tempo % dia) + dia) % dia / dia;
  const ini = CONFIG.noiteInicio;
  const fim = CONFIG.noiteFim;
  let a = 0;
  if (tod > ini - 0.06 && tod < ini) a = (tod - (ini - 0.06)) / 0.06;
  else if (tod >= ini && tod < fim) a = 1;
  else if (tod >= fim) a = 1 - (tod - fim) / (1 - fim);
  return Math.max(0, Math.min(1, a)) * CONFIG.escuridaoNoite;
}

/** A câmera segue o Samuel e para na borda do mundo. */
export function limiteCamera(estado, w, h) {
  const mundoL = estado.colunas * CONFIG.bloco;
  const mundoA = estado.linhas * CONFIG.bloco;
  let x = estado.x - w / 2;
  let y = estado.y - 10 - h / 2;
  if (mundoL <= w) x = (mundoL - w) / 2;
  else x = Math.max(0, Math.min(mundoL - w, x));
  if (mundoA <= h) y = (mundoA - h) / 2;
  else y = Math.max(0, Math.min(mundoA - h, y));
  return { x: Math.round(x), y: Math.round(y), w, h, mundoL, mundoA };
}

export function orbesLasca(estado) {
  if (!estado.armas.lasca) return [];
  const n = CONFIG.armas.lasca.orbes;
  const lista = [];
  for (let i = 0; i < n; i++) {
    const ang = estado.anguloLasca + (i / n) * Math.PI * 2;
    lista.push({
      x: estado.x + Math.cos(ang) * CONFIG.armas.lasca.orbita,
      y: estado.y + Math.sin(ang) * CONFIG.armas.lasca.orbita,
    });
  }
  return lista;
}

export function serializar(estado) {
  return {
    schemaVersion: CONFIG.schemaVersion,
    proposta: true,
    modo: 'facil',
    era: estado.era,
    tempo: estado.tempo,
    x: estado.x,
    y: estado.y,
    vida: estado.vida,
    vidaMax: estado.vidaMax,
    nivel: estado.nivel,
    xp: estado.xp,
    xpProx: estado.xpProx,
    armas: { ...estado.armas },
    danoMult: estado.danoMult,
    ritmo: estado.ritmo,
    fogueira: !!estado.fogueira,
    farol: !!estado.farol,
    vitoria: !!estado.vitoria,
    chefesMortos: { ...estado.chefesMortos },
    semente: estado.semente,
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
  if (!obj || obj.schemaVersion !== CONFIG.schemaVersion || obj.modo !== 'facil' || !ERAS[obj.era]) return null;
  const estado = criarPartida();
  if (!numeroFin(obj.x) || !numeroFin(obj.y) || !numeroFin(obj.vida) || !numeroFin(obj.nivel)) return null;
  if (livre(estado, obj.x, obj.y)) {
    estado.x = obj.x;
    estado.y = obj.y;
  }
  estado.era = obj.era;
  estado.tempo = Math.max(0, numeroFin(obj.tempo) ? obj.tempo : 0);
  estado.vidaMax = Math.max(1, numeroFin(obj.vidaMax) ? obj.vidaMax : CONFIG.vidaMax);
  estado.vida = Math.max(1, Math.min(estado.vidaMax, obj.vida));
  estado.nivel = Math.max(1, Math.floor(obj.nivel));
  estado.xpProx = xpPara(estado.nivel);
  estado.xp = Math.max(0, Math.min(estado.xpProx - 0.001, numeroFin(obj.xp) ? obj.xp : 0));
  estado.armas = { lasca: { nivel: 1 } };
  if (obj.armas && typeof obj.armas === 'object') {
    for (const id of ['lasca', 'lanca', 'faisca']) {
      if (obj.armas[id]) estado.armas[id] = { nivel: 1 };
    }
  }
  estado.danoMult = numeroFin(obj.danoMult) && obj.danoMult > 0 ? obj.danoMult : 1;
  estado.ritmo = numeroFin(obj.ritmo) && obj.ritmo > 0 ? obj.ritmo : 1;
  estado.fogueira = obj.fogueira === true;
  estado.farol = obj.farol === true;
  estado.vitoria = obj.vitoria === true;
  estado.chefesMortos = {
    pedra: obj.chefesMortos?.pedra === true,
    bronze: obj.chefesMortos?.bronze === true,
    ferro: obj.chefesMortos?.ferro === true,
  };
  estado.semente = numeroFin(obj.semente) ? obj.semente >>> 0 : estado.semente;
  estado.morte = false;
  estado.desdeSave = 0;
  return estado;
}

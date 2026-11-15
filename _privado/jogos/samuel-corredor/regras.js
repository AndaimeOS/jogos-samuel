/* Samuel Corredor — números e regras puras.
   Os números são PROPOSTA: servem para o teste do motor Phaser e podem mudar
   depois do playtest no iPad. Nada disso aparece escrito na tela. */

export const CONFIG = {
  proposta: true,
  versao: '0.1.0',
  altura: 240,
  gravidade: 1100,
  corrida: 110,
  pulo: -370,
  puloAlto: -470,
  corte: 0.45,
  coyote: 0.1,
  buffer: 0.12,
  invencivel: 1.4,
  vidas: 3,
  lesma: 26,
  besouro: 40,
  morcego: 34,
  blocoEspera: 0.8,
  cameraLerp: 0.14,
  hitbox: { largura: 14, altura: 40, offsetX: 9, offsetY: 8 },
  botoes: { esquerda: 32, direita: 32, pular: 40, pausa: 24, tela: 24, proxima: 40, repetir: 24 },
};

export const ORDEM = ['campo', 'floresta', 'caverna'];

export const COLUNAS = [
  'chao_esq', 'chao_meio', 'chao_dir',
  'terra_esq', 'terra_meio', 'terra_dir',
  'plat_esq', 'plat_meio', 'plat_dir',
  'bloco', 'especial', 'enfeite',
];

export const LINHAS = ['campo', 'floresta', 'caverna'];

const PLAT = new Set(['plat_esq', 'plat_meio', 'plat_dir']);
const CHEIO = new Set([
  'chao_esq', 'chao_meio', 'chao_dir',
  'terra_esq', 'terra_meio', 'terra_dir',
  'bloco',
]);

/** firstgid 1, uma linha de 12 por fase, sem margem e sem espaçamento. */
export function gid(fase, nome) {
  const linha = LINHAS.indexOf(fase);
  const coluna = COLUNAS.indexOf(nome);
  if (linha < 0 || coluna < 0) throw new Error('tile desconhecido: ' + fase + '/' + nome);
  return linha * 12 + coluna + 1;
}

function gidsOnde(pred) {
  const lista = [];
  for (const fase of LINHAS) {
    for (const nome of COLUNAS) if (pred(fase, nome)) lista.push(gid(fase, nome));
  }
  return lista;
}

export const GIDS_PLATAFORMA = gidsOnde((_, nome) => PLAT.has(nome));
export const GIDS_SOLIDO = gidsOnde((fase, nome) => CHEIO.has(nome) || (nome === 'especial' && fase !== 'caverna'));
export const GID_QUEDA = gid('caverna', 'especial');
export const GIDS_ENFEITE = gidsOnde((_, nome) => nome === 'enfeite');

export const ANIMS = {
  'samuel/parado': { frames: ['samuel/parado_0'], frameRate: 1, repeat: -1 },
  'samuel/correr': { frames: ['samuel/correr_0', 'samuel/correr_1', 'samuel/correr_2', 'samuel/correr_1'], frameRate: 10, repeat: -1 },
  'samuel/pular': { frames: ['samuel/pular_0'], frameRate: 1, repeat: 0 },
  'samuel/cair': { frames: ['samuel/cair_0'], frameRate: 1, repeat: 0 },
  'samuel/dano': { frames: ['samuel/dano_0'], frameRate: 1, repeat: 0 },
  'samuel/comemorar': { frames: ['samuel/comemorar_0', 'samuel/parado_0'], frameRate: 4, repeat: 2 },
  'doguinho/parado': { frames: ['doguinho/parado_0'], frameRate: 1, repeat: -1 },
  'doguinho/correr': { frames: ['doguinho/correr_0', 'doguinho/correr_1'], frameRate: 8, repeat: -1 },
  'doguinho/feliz': { frames: ['doguinho/feliz_0'], frameRate: 1, repeat: -1 },
  'doguinho/pular': { frames: ['doguinho/pular_0'], frameRate: 1, repeat: 0 },
  'doguinho/comemorar': { frames: ['doguinho/comemorar_0', 'doguinho/comemorar_1'], frameRate: 4, repeat: -1 },
  'marco/apagado': { frames: ['marco/apagado_0'], frameRate: 1, repeat: -1 },
  'marco/aceso': { frames: ['marco/aceso_0', 'marco/aceso_1'], frameRate: 4, repeat: -1 },
  'castelinho/parado': { frames: ['castelinho/parado_0'], frameRate: 1, repeat: -1 },
  'castelinho/brilhar': { frames: ['castelinho/brilhar_0', 'castelinho/brilhar_1'], frameRate: 4, repeat: -1 },
  'lesma/andar': { frames: ['lesma/andar_0', 'lesma/andar_1'], frameRate: 6, repeat: -1 },
  'besouro/andar': { frames: ['besouro/andar_0', 'besouro/andar_1'], frameRate: 8, repeat: -1 },
  'morcego/voar': { frames: ['morcego/voar_0', 'morcego/voar_1'], frameRate: 8, repeat: -1 },
  'moeda/girar': { frames: ['moeda/girar_0', 'moeda/girar_1', 'moeda/girar_2', 'moeda/girar_3'], frameRate: 8, repeat: -1 },
  'estrela/brilhar': { frames: ['estrela/brilhar_0', 'estrela/brilhar_1'], frameRate: 6, repeat: -1 },
  'bandeira/tremular': { frames: ['bandeira/tremular_0', 'bandeira/tremular_1', 'bandeira/tremular_2'], frameRate: 6, repeat: -1 },
  'cogumelo/mola': { frames: ['cogumelo/mola_0', 'cogumelo/mola_1', 'cogumelo/mola_2'], frameRate: 14, repeat: 0 },
  'plataforma/helice': { frames: ['plataforma/helice_0', 'plataforma/helice_1'], frameRate: 6, repeat: -1 },
  'poeira/sumir': { frames: ['poeira/sumir_0', 'poeira/sumir_1', 'poeira/sumir_2'], frameRate: 14, repeat: 0 },
  'pof/estourar': { frames: ['pof/estourar_0', 'pof/estourar_1', 'pof/estourar_2'], frameRate: 16, repeat: 0 },
  'brilho/piscar': { frames: ['brilho/piscar_0', 'brilho/piscar_1', 'brilho/piscar_2'], frameRate: 14, repeat: 0 },
};

export const FUNDOS = {
  campo: [
    ['campo-ceu', 'arte/fundos/campo/ceu.png', 0, 'topo', 0, 240],
    ['campo-nuvens', 'arte/fundos/campo/nuvens.png', 0.1, 'topo', 8, 64],
    ['campo-morros-longe', 'arte/fundos/campo/morros_longe.png', 0.2, 'pe', -40, 96],
    ['campo-morros', 'arte/fundos/campo/morros.png', 0.4, 'pe', -32, 80],
    ['campo-moitas', 'arte/fundos/campo/moitas.png', 0.7, 'pe', 0, 96],
  ],
  floresta: [
    ['floresta-ceu', 'arte/fundos/floresta/ceu.png', 0, 'topo', 0, 240],
    ['floresta-mata-longe', 'arte/fundos/floresta/mata_longe.png', 0.2, 'pe', -40, 150],
    ['floresta-troncos', 'arte/fundos/floresta/troncos.png', 0.45, 'topo', 0, 240],
    ['floresta-copas', 'arte/fundos/floresta/copas.png', 0.6, 'topo', 0, 56],
    ['floresta-samambaias', 'arte/fundos/floresta/samambaias.png', 0.8, 'pe', 0, 88],
  ],
  caverna: [
    ['caverna-ceu', 'arte/fundos/caverna/ceu.png', 0, 'topo', 0, 240],
    ['caverna-castelo', 'arte/fundos/caverna/castelo.png', 0.2, 'pe', -40, 130],
    ['caverna-estalactites', 'arte/fundos/caverna/estalactites.png', 0.5, 'topo', 0, 48],
    ['caverna-pedras', 'arte/fundos/caverna/pedras.png', 0.7, 'pe', 0, 80],
  ],
};

/** Largura lógica para a altura fixa de 240, sem tarja 16:9. */
export function medida(vw, vh) {
  const altura = CONFIG.altura;
  const largura = Math.max(168, Math.min(420, Math.round(altura * vw / Math.max(1, vh))));
  const zx = vw / largura;
  const zy = vh / altura;
  const zoom = Math.min(zx, zy);
  const inteiro = Math.abs(zx - zy) < 0.02 && Math.abs(zoom - Math.round(zoom)) < 0.02;
  return { largura, altura, zoom, inteiro };
}

/** px de arte → px CSS quando a tela preenche a altura (1 px CSS = 1 pt no iPad). */
export function botaoEmPxCss(pxJogo, alturaCss, alturaJogo = CONFIG.altura) {
  return pxJogo * (alturaCss / alturaJogo);
}

/** Zoom inteiro que o Gerador usou como pior caso (sobra vira margem). */
export function botaoEmPtZoomInteiro(pxJogo, alturaCss, alturaJogo = CONFIG.altura) {
  return pxJogo * Math.max(1, Math.floor(alturaCss / alturaJogo));
}

export function layoutMapa(largura) {
  if (largura >= 240) {
    const w = largura / 3;
    return [
      { id: 'campo', x: 0, y: 0, w, h: 240 },
      { id: 'floresta', x: w, y: 0, w, h: 240 },
      { id: 'caverna', x: 2 * w, y: 0, w, h: 240 },
    ];
  }
  const h = 240 / 3;
  return [
    { id: 'campo', x: 0, y: 0, w: largura, h },
    { id: 'floresta', x: 0, y: h, w: largura, h },
    { id: 'caverna', x: 0, y: 2 * h, w: largura, h },
  ];
}

/** Três nós com área de toque. x,y é o centro, em px do jogo. */
export function layoutNos(largura) {
  const lado = largura < 240 ? 56 : 64;
  if (largura < 240) {
    return ORDEM.map((id, i) => ({ id, x: largura / 2, y: 62 + i * 72, w: lado, h: lado }));
  }
  const span = largura - 96;
  return ORDEM.map((id, i) => ({ id, x: 48 + (span / 2) * i, y: 132, w: lado, h: lado }));
}

export function decidirContato(modo) {
  return modo === 'facil' ? 'empurra' : 'dano';
}

export function decidirBuraco(modo) {
  return modo === 'facil' ? 'plataforma' : 'checkpoint';
}

export function cortarPulo(vy, segurando, corte = CONFIG.corte) {
  if (!segurando && vy < 0) return vy * corte;
  return vy;
}

export function aoZerarVidas(vidas, max = CONFIG.vidas) {
  return vidas <= 0 ? max : vidas;
}

/** 'pisa' se o Samuel está descendo por cima; 'lado' se os corpos se cruzam. */
export function classificarContato(p, ini) {
  const sobrepoeX = p.direita > ini.esquerda + 2 && p.esquerda < ini.direita - 2;
  const meio = (ini.topo + ini.base) / 2;
  if (p.vy > 30 && sobrepoeX && p.pe <= meio + 6) return 'pisa';
  if (sobrepoeX || p.direita > ini.esquerda && p.esquerda < ini.direita) return 'lado';
  return 'nenhum';
}

export function proximaFase(id) {
  const i = ORDEM.indexOf(id);
  return i >= 0 && i < ORDEM.length - 1 ? ORDEM[i + 1] : null;
}

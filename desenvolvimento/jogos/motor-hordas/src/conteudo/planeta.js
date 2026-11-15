import { ITENS_COMUNS, bifurca, no } from './comun.js'

const golpe = (id, nome, texto, icone, sprite, tipo, resto) => ({
  id, nome, texto, icone, sprite, tipo,
  dano: 8, cadencia: 1.05, duracao: 2.4, n: 1, raio: 36, vel: 2.2, hit: 7, empurrao: 40,
  bifurca: bifurca(
    { nome: `${nome} largo`, texto: 'Alcança mais longe.', mod: { raio: 14 } },
    { nome: `${nome} quente`, texto: 'Queima quem encosta.', mod: { queima: true } },
    { nome: `${nome} pesado`, texto: 'Empurra com força.', mod: { empurrao: 50, dano: 4 } },
    { nome: `${nome} duplo`, texto: 'Solta mais um.', mod: { n: 1 } },
  ),
  ...resto,
})

const golpes = [
  golpe('lasca', 'Lasca', 'Pedras giram em volta.', 'icone-lasca', 'lasca', 'orbita', { dano: 7, n: 3, raio: 40, vel: 2.4, cadencia: 8, duracao: 6 }),
  golpe('funda', 'Funda', 'Uma pedra voa para a frente.', 'icone-lasca', 'pedregulho', 'tiro', { dano: 12, vel: 190, cadencia: 0.85, duracao: 1.2, hit: 6 }),
  golpe('lanca', 'Lança', 'Atravessa quem está na fila.', 'icone-lanca', 'lanca', 'tiro', { dano: 11, vel: 220, atravessa: 4, cadencia: 1.1, duracao: 0.8 }),
  golpe('machado', 'Machado', 'Um arco largo e devagar.', 'icone-lanca', 'lanca', 'orbita', { dano: 14, n: 1, raio: 48, vel: 1.4, cadencia: 3.2, duracao: 2.2 }),
  golpe('tocha', 'Tocha', 'Queima em volta do Samuel.', 'icone-fogueira-carta', 'faisca', 'aura', { dano: 6, raio: 42, cadencia: 5, duracao: 4, queima: true }),
  golpe('faisca', 'Faísca', 'Um risco rápido.', 'icone-faisca', 'faisca', 'tiro', { dano: 9, vel: 260, n: 2, cadencia: 0.7, duracao: 0.6, hit: 5 }),
  golpe('pedregulho', 'Pedregulho', 'Devagar e pesado.', 'pedregulho', 'pedregulho', 'tiro', { dano: 22, vel: 120, empurrao: 80, cadencia: 1.6, duracao: 1.4, hit: 10 }),
  golpe('bumerangue', 'Bumerangue', 'Vai e volta.', 'icone-lasca', 'lasca', 'volta', { dano: 10, vel: 160, cadencia: 1.3, duracao: 2.4 }),
  golpe('redemoinho', 'Redemoinho', 'Puxa os bichos para perto.', 'icone-faisca', 'faisca', 'vortex', { dano: 5, raio: 50, puxa: 90, cadencia: 6, duracao: 3.5 }),
  golpe('estilingue', 'Estilingue', 'Três pedrinhas de uma vez.', 'icone-lasca', 'pedregulho', 'tiro', { dano: 7, vel: 200, n: 3, cadencia: 1.15, duracao: 0.9 }),
  golpe('fogueira', 'Fogueira', 'Um círculo de calor.', 'icone-fogueira-carta', 'faisca', 'aura', { dano: 8, raio: 34, queima: true, cadencia: 7, duracao: 5 }),
  golpe('marreta', 'Marreta', 'Uma pancada que empurra.', 'icone-lanca', 'pedregulho', 'tiro', { dano: 18, vel: 150, empurrao: 120, cadencia: 1.4, duracao: 0.7, hit: 12 }),
]

const bicho = (sprite, hp, vel, dano, xp, massa, raio, comportamento, extra) => ({
  sprite, hp, vel, dano, xp, massa, raio, comportamento, altura: raio * 2.2, ...extra,
})

const inimigos = {
  'seixo-vivo': bicho('seixo-vivo', 22, 28, 7, 2, 1.2, 9),
  'lobo-da-pedra': bicho('lobo-da-pedra', 16, 52, 8, 2, 0.85, 9),
  enxame: bicho('enxame', 8, 70, 5, 1, 0.45, 6),
  mamute: bicho('mamute', 28, 26, 8, 3, 1.2, 16, 'chase'),
  'guerreiro-de-bronze': bicho('guerreiro-de-bronze', 28, 42, 9, 3, 1.1, 9),
  escorpiao: bicho('escorpiao', 24, 38, 12, 3, 1, 8),
  'golem-de-barro': bicho('golem-de-barro', 70, 22, 10, 5, 2.6, 12),
  'caranguejo-gigante': bicho('caranguejo-gigante', 26, 34, 8, 3, 1.1, 14, 'chase'),
  'soldado-de-ferro': bicho('soldado-de-ferro', 34, 40, 11, 3, 1.3, 9),
  catapulta: bicho('catapulta', 40, 26, 12, 4, 1.8, 10),
  'lobo-de-ferro': bicho('lobo-de-ferro', 30, 48, 12, 3, 1.1, 9),
  'robo-enferrujado': bicho('robo-enferrujado', 28, 30, 8, 3, 1.1, 14, 'chase'),
  'urso-da-caverna': bicho('urso', 980, 36, 16, 20, 8, 14, 'chase', { chefe: true, altura: 72 }),
  'sentinela-de-bronze': bicho('sentinela-de-bronze', 1400, 34, 18, 24, 10, 16, 'chase', { chefe: true, altura: 64 }),
  'colosso-de-ferro': bicho('colosso-de-ferro', 2100, 32, 20, 30, 14, 16, 'chase', { chefe: true, altura: 72 }),
}

const PERIGOS = [
  { id: 'meteoros', em: 8, aviso: 1.1, dura: 3.2, dano: 14 },
  { id: 'enchente', em: 16, aviso: 1.0, dura: 3.5, dano: 0 },
  { id: 'raios', em: 26, aviso: 1.0, dura: 4.5, dano: 16 },
]

const fase = (ordem, regiao, tipo, x, y, extra) => no(ordem, regiao, tipo, x, y, {
  biomas: extra.biomas,
  horda: extra.horda,
  bando: extra.bando || extra.horda[0],
  chefe: extra.chefe || null,
  duracao: extra.duracao ?? 36,
  chefeEm: extra.chefeEm ?? 18,
  chao: extra.chao,
  agua: null,
  perigos: tipo === 'fim' ? [] : PERIGOS,
})

const chaoPedra = { campo: 'chao-pedra-grama', caverna: 'chao-pedra-areia' }
const chaoBronze = { rio: 'chao-bronze-agua', deserto: 'chao-bronze-areia' }
const chaoFerro = { forja: 'chao-ferro-areia', floresta: 'chao-ferro-grama' }

export const conteudoPlaneta = {
  slug: 'planeta-do-samuel',
  api: '__planeta',
  titulo: 'Planeta do Samuel',
  pesca: false,
  inicial: 'lasca',
  heroi: 'samuel',
  heroiParado: 'samuel-parado',
  heroiAnda: 'samuel-andar',
  heroiAltura: 40,
  marcador: 'marcador-samuel',
  vida: 'icone-vida',
  vidaVazia: 'icone-vida-vazia',
  gema: ['xp-1', 'xp-2', 'xp-3'],
  fimTitulo: 'O farol está aceso.',
  fimTexto: 'O planetinha ficou visível.',
  fimSprite: 'farol-aceso',
  controles: {
    base: 'joystick-base', bola: 'joystick-bola', acao: 'botao-acao', pausa: 'botao-pausa',
    tela: 'botao-tela-cheia', sair: 'botao-sair-tela-cheia', proxima: 'botao-proxima', repetir: 'botao-repetir',
  },
  mapa: { w: 344, h: 256 },
  golpes,
  itens: ITENS_COMUNS,
  inimigos,
  peixes: [],
  chefeDaRegiao: { pedra: 'urso-da-caverna', bronze: 'sentinela-de-bronze', ferro: 'colosso-de-ferro', fim: null },
  fases: [
    fase(1, 'pedra', 'fase', 24, 180, { biomas: ['pedra'], horda: ['seixo-vivo', 'lobo-da-pedra', 'mamute'], bando: 'enxame', chao: chaoPedra }),
    fase(2, 'pedra', 'fase', 56, 96, { biomas: ['pedra'], horda: ['lobo-da-pedra', 'seixo-vivo', 'mamute'], bando: 'enxame', chao: chaoPedra }),
    fase(3, 'pedra', 'chefe', 94, 168, { biomas: ['pedra'], horda: ['seixo-vivo', 'lobo-da-pedra'], chefe: 'urso-da-caverna', chao: chaoPedra, duracao: 90 }),
    fase(4, 'bronze', 'fase', 128, 88, { biomas: ['bronze'], horda: ['guerreiro-de-bronze', 'escorpiao', 'golem-de-barro'], bando: 'caranguejo-gigante', chao: chaoBronze }),
    fase(5, 'bronze', 'fase', 158, 176, { biomas: ['bronze'], horda: ['escorpiao', 'guerreiro-de-bronze', 'caranguejo-gigante'], chao: chaoBronze }),
    fase(6, 'bronze', 'chefe', 192, 98, { biomas: ['bronze'], horda: ['guerreiro-de-bronze', 'golem-de-barro'], chefe: 'sentinela-de-bronze', chao: chaoBronze, duracao: 90 }),
    fase(7, 'ferro', 'fase', 226, 176, { biomas: ['ferro'], horda: ['soldado-de-ferro', 'lobo-de-ferro', 'robo-enferrujado'], bando: 'catapulta', chao: chaoFerro }),
    fase(8, 'ferro', 'fase', 252, 92, { biomas: ['ferro'], horda: ['lobo-de-ferro', 'soldado-de-ferro', 'catapulta'], chao: chaoFerro }),
    fase(9, 'ferro', 'chefe', 282, 170, { biomas: ['ferro'], horda: ['soldado-de-ferro', 'robo-enferrujado'], chefe: 'colosso-de-ferro', chao: chaoFerro, duracao: 90 }),
    fase(10, 'fim', 'fim', 322, 150, { biomas: ['praia-farol'], horda: ['seixo-vivo'], chao: chaoPedra, duracao: 0 }),
  ],
  nos: {
    pedra: { aberta: 'no-aberta', travada: 'no-travada', vencida: 'no-vencida' },
    bronze: { aberta: 'no-aberta', travada: 'no-travada', vencida: 'no-vencida' },
    ferro: { aberta: 'no-aberta', travada: 'no-travada', vencida: 'no-vencida' },
    fim: { aberta: 'farol-0', travada: 'farol-0', vencida: 'farol-aceso' },
  },
  noEspecial: {
    3: { aberta: 'no-chefe-urso-da-caverna-aberta', travada: 'no-chefe-urso-da-caverna-travada', vencida: 'no-chefe-urso-da-caverna-vencida' },
    6: { aberta: 'no-chefe-sentinela-de-bronze-aberta', travada: 'no-chefe-sentinela-de-bronze-travada', vencida: 'no-chefe-sentinela-de-bronze-vencida' },
    9: { aberta: 'no-chefe-colosso-de-ferro-aberta', travada: 'no-chefe-colosso-de-ferro-travada', vencida: 'no-chefe-colosso-de-ferro-vencida' },
  },
  cores: {
    pedra: '#8FD46A', bronze: '#F2CC8E', ferro: '#76726A', 'praia-farol': '#F2E2B0',
  },
  config: {
    proposta: true,
    curva: [1.4, 2.2, 3],
    teto: [40, 70, 100],
    anel: 'hypot/2+12',
    velocidade: 68,
    facil: 'piso 1, cura, menos dano, sem teleporte',
  },
}

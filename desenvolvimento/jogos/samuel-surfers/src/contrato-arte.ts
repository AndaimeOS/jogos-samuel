/** Contrato da arte. O ARTE.md repete estes nomes; se divergir, vale este arquivo. */

export const ESTILOS = ['pixel', 'blocos'] as const;
export type Estilo = (typeof ESTILOS)[number];

export const CHAVE_ESTILO = 'samuel-surfers:estilo';

/** 32 px do sprite = 1 unidade de mundo. O trilho é outra conta: 1 tile cobre a largura dele. */
export const PX_POR_UNIDADE = 32;

export const PIXEL = {
  samuel: {
    arquivo: 'arte/personagens/samuel-costas.png',
    largura: 32,
    altura: 48,
    quadros: ['parado_0', 'correr_0', 'correr_1', 'correr_2', 'correr_3', 'pular_0', 'rolar_0', 'rolar_1', 'tropecar_0'],
  },
  doguinho: {
    arquivo: 'arte/personagens/doguinho-costas.png',
    largura: 24,
    altura: 24,
    quadros: ['correr_0', 'correr_1', 'correr_2', 'correr_3', 'pular_0', 'tropecar_0'],
  },
  fps: 10,
  atlasMax: 512,
  obstaculos: {
    barreira: 'arte/obstaculos/barreira-pular.png',
    placa: 'arte/obstaculos/barreira-rolar.png',
    cone: 'arte/obstaculos/cone.png',
    vagao: 'arte/obstaculos/vagao.png',
  },
  coletaveis: {
    moeda: 'arte/coletaveis/moeda.png',
    ima: 'arte/coletaveis/ima.png',
    prancha: 'arte/coletaveis/prancha.png',
  },
} as const;

export const BLOCOS = {
  formato: 'glb',
  compressao: 'nenhuma',
  arquivos: {
    samuel: 'arte/3d/samuel.glb',
    doguinho: 'arte/3d/doguinho.glb',
    barreira: 'arte/3d/barreira.glb',
    placa: 'arte/3d/placa.glb',
    cone: 'arte/3d/cone.glb',
    vagao: 'arte/3d/vagao.glb',
    moeda: 'arte/3d/moeda.glb',
    ima: 'arte/3d/ima.glb',
    prancha: 'arte/3d/prancha.glb',
  },
  ossos: ['root', 'hips', 'spine', 'head', 'arm_e', 'arm_d', 'perna_e', 'perna_d'],
  clipes: ['idle', 'correr', 'pular', 'rolar', 'tropecar'],
  clipesDoguinho: ['correr', 'pular', 'tropecar'],
  texturaMax: 256,
  texturaFormato: 'png',
} as const;

/** Vazio de propósito: a v1 não pede GLB (ainda não chegou). O carregador existe e só roda com itens aqui. */
export const LISTA_GLB: readonly string[] = [];

export const UI = {
  escalaCss: 1,
  botaoAcao: 76,
  botaoMiudo: 76,
  botaoJogar: 168,
} as const;

export const ESTILO_V1: Estilo = 'blocos';

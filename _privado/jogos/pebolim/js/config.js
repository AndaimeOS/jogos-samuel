// Números PROVISÓRIOS do Pebolim. A arte final vem depois; ajuste tudo aqui.
// Colisão: SAT.js (MIT, Jim Riecken). Base: football-game (MIT, Prashant Baid, 2015).
// Avisos completos em LICENSE.txt.

export const CONFIG = {
  campo: {
    comprimento: 1000,
    largura: 560,
    moldura: 36,
  },
  bola: {
    raio: 11,
    amortecimento: 0.62,
    amortecimentoFacil: 1.2,
    velMax: 760,
    velMaxFacil: 440,
    velQuaseParada: 16,
    janelaParada: 0.5,
    deslocamentoMinimo: 8,
    segundosParada: 2.5,
    quiqueParede: 0.7,
    quiqueTrave: 0.45,
    quiqueJogador: 0.88,
    impulsoChute: 640,
    impulsoChuteFacil: 380,
    fatorLateral: 0.5,
    empurraoBarra: 0.85,
  },
  gol: {
    abertura: 164,
    aberturaFacil: 250,
  },
  trave: {
    espessura: 18,
    profundidade: 28,
  },
  jogador: {
    largura: 24,
    altura: 36,
    espacamento: 58,
    alcanceChute: 22,
  },
  barra: {
    velTeclado: 480,
  },
  saque: {
    velocidade: 200,
    velocidadeFacil: 120,
  },
  partida: {
    golsVitoria: 5,
    segundos: 120,
    toqueMaxMs: 280,
    arrasteMinPx: 14,
    avisoSegundos: 1.4,
  },
  ia: {
    normal: {
      vel: 360,
      erroChance: 0.08,
      erroPixels: 40,
      pausa: 0.12,
      chuteChance: 0.82,
      recarga: 0.38,
      intervaloDecisao: 0.1,
      alcanceChute: 48,
    },
    facil: {
      vel: 110,
      erroChance: 0.62,
      erroPixels: 140,
      pausa: 0.75,
      chuteChance: 0.25,
      recarga: 1.1,
      intervaloDecisao: 0.34,
      alcanceChute: 32,
    },
  },
  // Da esquerda para a direita: o Vermelho defende a esquerda e ataca para a direita.
  barras: [
    { time: 'vermelho', x: 0.08, n: 1 },
    { time: 'azul', x: 0.2, n: 3 },
    { time: 'vermelho', x: 0.34, n: 2 },
    { time: 'azul', x: 0.46, n: 4 },
    { time: 'vermelho', x: 0.58, n: 4 },
    { time: 'azul', x: 0.7, n: 2 },
    { time: 'vermelho', x: 0.82, n: 3 },
    { time: 'azul', x: 0.92, n: 1 },
  ],
  cores: {
    feltro: '#2f8a49',
    feltroFaixa: '#278044',
    linha: '#f5f2e8',
    madeira: '#c47a3a',
    madeiraEscura: '#8a4e22',
    rede: '#d7efe4',
    vermelho: '#e23d3d',
    vermelhoEscuro: '#a61f1f',
    azul: '#2f6fed',
    azulEscuro: '#1c3f9c',
    pele: '#f1c7a3',
    cabelo: '#5a3826',
    barra: '#e4e0d2',
    bola: '#fffdf7',
    trave: '#f7f4ea',
    tinta: '#193337',
  },
};

export function ajustesDe(cfg, dificuldade) {
  const facil = dificuldade === 'facil';
  return {
    facil,
    abertura: facil ? cfg.gol.aberturaFacil : cfg.gol.abertura,
    amortecimento: facil ? cfg.bola.amortecimentoFacil : cfg.bola.amortecimento,
    velMax: facil ? cfg.bola.velMaxFacil : cfg.bola.velMax,
    impulso: facil ? cfg.bola.impulsoChuteFacil : cfg.bola.impulsoChute,
    saque: facil ? cfg.saque.velocidadeFacil : cfg.saque.velocidade,
    ia: facil ? cfg.ia.facil : cfg.ia.normal,
  };
}

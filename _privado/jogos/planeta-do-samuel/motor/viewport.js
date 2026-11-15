/* Trecho reescrito a partir de desenvolvimento/jogos/pokemon-survivors/src/engine/viewport.ts
   (Pokémon Survivors, Copyright (c) 2026 Pedro Barretto, licença MIT).
   Sem arte, nome ou criatura de Pokémon. O aviso está em LICENSE.txt. */

/** Telas cujo lado curto fica abaixo disto (px CSS) são celular. */
const LADO_CURTO_CELULAR = 600;
/** Pixels de mundo no lado curto do celular, para o sprite continuar legível. */
const MUNDO_CURTO_CELULAR = 220;
/** Pixels de mundo no lado curto, no tablet e no computador. */
const MUNDO_CURTO = 300;

/**
 * Fator de aumento em pixels de dispositivo por pixel de mundo. Inteiro no
 * dispositivo, o pixel continua nítido mesmo com DPR quebrado (2.625…).
 */
export const escalaDispositivo = (cssL, cssA, dpr) => {
  const curto = Math.min(cssL, cssA);
  if (curto < LADO_CURTO_CELULAR) return Math.max(2, Math.round((curto * dpr) / MUNDO_CURTO_CELULAR));
  return Math.max(2, Math.round(Math.max(2, Math.round(curto / MUNDO_CURTO)) * dpr));
};

/**
 * Um lado do canvas interno: pelo menos 1 px. Um lado de verdade sobe ao par
 * mais próximo para cima: a câmera fica em `jogador - lado / 2`, e num lado
 * ímpar o jogador e o chão arredondam para pixels diferentes — o sprite treme.
 */
const lado = (px) => {
  if (!(px >= 1)) return 1;
  const inteiro = Math.ceil(px);
  return inteiro + (inteiro % 2);
};

/** Abaixo disto (px CSS) o lado não é uma tela em que o jogo caiba. */
const VISTA_MINIMA = 100;

const naTela = (s) => s.width >= VISTA_MINIMA && s.height >= VISTA_MINIMA;

/**
 * Tamanho para encaixar o jogo: a visual viewport (barras do iOS e teclado),
 * ou a layout viewport quando a visual não parece tela, ou null para ficar
 * como está. Uma página voltando do fundo pode ler 0.
 */
export const escolherVista = (visual, layout) =>
  visual && naTela(visual) ? visual : naTela(layout) ? layout : null;

/** Canvas interno (px de mundo) e px CSS por px de mundo. */
export const encaixarVista = (cssL, cssA, dpr) => {
  const escala = escalaDispositivo(cssL, cssA, dpr);
  return {
    w: lado((cssL * dpr) / escala),
    h: lado((cssA * dpr) / escala),
    cssScale: escala / dpr,
  };
};

/**
 * O `encaixarVista` arredonda o lado para cima. Num tablet 1024×768 com
 * escala 3 isso passa 2 px da tela e cria rolagem. Aqui o lado desce de 2 em
 * 2 (continua par) até caber na viewport.
 */
export const vistaQueCabe = (cssL, cssA, dpr) => {
  const fit = encaixarVista(cssL, cssA, dpr);
  let w = fit.w;
  let h = fit.h;
  while (w > 2 && w * fit.cssScale > cssL + 0.01) w -= 2;
  while (h > 2 && h * fit.cssScale > cssA + 0.01) h -= 2;
  return { w, h, cssScale: fit.cssScale };
};

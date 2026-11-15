/* `dir8` reescrito a partir de desenvolvimento/jogos/pokemon-survivors/src/engine/math.ts
   (Copyright (c) 2026 Pedro Barretto, licença MIT). Sem Pokémon. */

/**
 * Folha de 8 direções, de cima para baixo:
 * 0 baixo, 1 baixo-direita, 2 direita, 3 cima-direita,
 * 4 cima, 5 cima-esquerda, 6 esquerda, 7 baixo-esquerda.
 */
export const dir8 = (x, y) => {
  const octante = (Math.round(Math.atan2(y, x) / (Math.PI / 4)) + 8) % 8;
  return (2 - octante + 8) % 8;
};

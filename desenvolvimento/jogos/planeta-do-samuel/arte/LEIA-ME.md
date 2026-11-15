# Mestres de arte — Planeta do Samuel

PNG com transparência, um arquivo por id do manifesto
(`_privado/jogos/planeta-do-samuel/arte/manifesto.json`, campo `arquivo`).

O jogo publicado não lê estes PNG. O comando `npm run arte` (nesta pasta do jogo,
em `desenvolvimento/jogos/planeta-do-samuel`) junta os que existirem em
`_privado/jogos/planeta-do-samuel/arte/atlas.webp` e marca esses ids como
`origem: "atlas"`. O que não tiver PNG continua placeholder (`origem: "codigo"`).

Perspectiva 3/4, pé na base do quadro, contorno na tinta `#193337`.
Samuel: jaqueta laranja `#FF9D52`, camiseta amarela `#F2D15A`, calça azul-petróleo `#1F6F78`.
Cão: Jack Russell branco e marrom. Sem panda e sem nada de Pokémon.

Direções, de cima para baixo: baixo, baixo-direita, direita, cima-direita, cima.
A esquerda é espelho. Andar: 4 colunas, 4 ticks de 1/60 cada (15 fps).

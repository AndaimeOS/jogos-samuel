# Origem — Planeta do Samuel

Jogo original em JavaScript (canvas 2D), no mesmo formato do Reino dos Blocos:
`_privado/jogos/planeta-do-samuel/` é a fonte e o que o site serve. Sem build.

## Referência de mecânicas

[Isle of Embers](https://github.com/JaiGod/isle-of-embers) (Jaineil Rana / JaiGod, 2026),
Godot 4.3, licença MIT, arte procedural. Consultado como referência de laço:
juntar recursos, fabricar em estações, ciclo de dia e noite, e acender um sinal
no fim. O código, a arte, os textos e os nomes daquele jogo **não** foram copiados.
A reescrita é em JS, com idades Pedra, Bronze e Ferro pedidas para esta proposta.

O aviso MIT fica em `_privado/jogos/planeta-do-samuel/LICENSE.txt` e os créditos em
`CREDITOS.txt`, porque o laço foi consultado nessa obra.

## O que não entra

Alia Domus é obra fechada e serviu só de inspiração de gênero. Nenhum código, arte,
texto ou nome dela foi copiado. Sem armas, chefes, ataques ou inimigos. Sem assets
de terceiros e sem licença NC.

## Motor da v0.2 (Pokémon Survivors, só código MIT)

A apresentação foi reescrita a partir do motor que está neste repositório em
`desenvolvimento/jogos/pokemon-survivors/` (Copyright (c) 2026 Pedro Barretto,
`LICENSE` MIT). Não é um bundle Vite: os trechos foram reescritos em JS, ao lado
de `regras.js`. `regras.js`, o `MAPA`, os custos e os números de `CONFIG` não mudaram.

| Aqui | Veio de |
|---|---|
| `_privado/jogos/planeta-do-samuel/motor/viewport.js` | `src/engine/viewport.ts` |
| `motor/math.js` (`dir8`) | `src/engine/math.ts` |
| `motor/joystick.js` | `src/engine/input.ts` (joystick, fixo, agarre) |
| `motor/pixelart.js` | `src/engine/pixelart.ts` e a sombra de `src/render/draw.ts` |
| `motor/noite.js` | `lightDisc` e `darkLayer` de `src/render/places.ts` |
| `motor/chao.js` | tile 16, chunk 256 e `hash2` (`src/render/world.ts`, `src/engine/rng.ts`) |
| `motor/sprites.js` | geometria de `frameIndex` e do pé (`src/render/sprites.ts`) |

Não foi copiado: `public/assets/`, nome, sprite, grito ou criatura de Pokémon,
combate, horda, conta, Clerk, PostHog, o build Vite. A arte desta versão é
placeholder desenhado em código (`motor/placeholders.js`), com os ids de
`arte/manifesto.json`. Troca pelo atlas: ver o README desta pasta.

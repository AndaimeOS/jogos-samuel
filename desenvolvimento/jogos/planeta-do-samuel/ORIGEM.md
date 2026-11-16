# Origem — Planeta do Samuel

Jogo original em JavaScript (canvas 2D), no mesmo formato do Reino dos Blocos:
`_privado/jogos/planeta-do-samuel/` é a fonte e o que o site serve. Sem build.

## Referência de mecânicas

[Isle of Embers](https://github.com/JaiGod/isle-of-embers) (Jaineil Rana / JaiGod, 2026),
Godot 4.3, licença MIT, arte procedural. Consultado como referência de laço:
juntar recursos, fabricar em estações, ciclo de dia e noite, e acender um sinal
no fim. O código, a arte, os textos e os nomes daquele jogo **não** foram copiados.
A reescrita é em JS, com idades Pedra, Bronze e Ferro pedidas para esta proposta.

Na v0.4 a ilha deixa o mapa desenhado à mão. As regras lidas em
`scripts/world.gd`, `scripts/data.gd` e `scripts/game.gd` e reescritas em
`ilha.js` / `regras.js`:

- grade 128×128, tile de 32 px (mundo de 4096 px);
- queda radial `1 - d * 1.18`, vulcão no centro, ruído nas frequências 0,045 / 0,08 / 0,06;
- limiares de água funda, rasa, praia, grama, mato, rocha, cinza e brasa;
- taxas de árvore, arbusto, pedra, palmeira e veio, com 14 veios garantidos;
- dia de 240 s, noite entre 0,66 e 0,97, escuridão até 0,82;
- chefe que investe e atordoa ao bater, e chefe que voa e cospe.

O ruído é um simplex nosso (não o FastNoiseLite do Godot). A palmeira usa o
sprite da árvore, porque esta arte não tem palmeira. Os nomes continuam os
do Planeta: urso da caverna, sentinela de bronze, colosso de ferro.

O aviso MIT fica em `_privado/jogos/planeta-do-samuel/LICENSE.txt` e os créditos em
`CREDITOS.txt`, porque o laço foi consultado nessa obra.

## O que não entra

Alia Domus é obra fechada e serviu só de inspiração de gênero. Nenhum código, arte,
texto ou nome dela foi copiado. Sem assets de terceiros e sem licença NC.
Nenhum sprite, nome ou criatura de Pokémon.

## Motor da v0.2 (Pokémon Survivors, só código MIT)

A apresentação e o laço de batalha foram reescritos a partir do código MIT que está
neste repositório em `desenvolvimento/jogos/pokemon-survivors/` (Copyright (c) 2026
Pedro Barretto). Não é um bundle Vite. Os números novos estão em `CONFIG`, marcados
como proposta. O mapa da ilha continua. A coleta x/N, a fome e o calor saíram do laço.

| Aqui | Veio de |
|---|---|
| `_privado/jogos/planeta-do-samuel/motor/viewport.js` | `src/engine/viewport.ts` |
| `motor/math.js` (`dir8`) | `src/engine/math.ts` |
| `motor/joystick.js` | `src/engine/input.ts` (joystick, fixo, agarre) |
| `motor/pixelart.js` | `src/engine/pixelart.ts` e a sombra de `src/render/draw.ts` |
| `motor/noite.js` | `lightDisc` e `darkLayer` de `src/render/places.ts` |
| `motor/chao.js` | tile 16, chunk 256 e `hash2` (`src/render/world.ts`, `src/engine/rng.ts`) |
| `motor/sprites.js` | geometria de `frameIndex` e do pé (`src/render/sprites.ts`) |
| `regras.js` (`xpPara`, `ganharXp`) | `src/game/leveling.ts` |
| `regras.js` (`faixaXp`) | `src/game/pickups.ts` (`xpTier`) |
| `regras.js` (anel, bando, chefe) | `src/game/spawner.ts` |
| `regras.js` (fase na metade da vida) | `src/game/bossFight.ts` |
| `ilha.js` | regras de `scripts/world.gd` e `scripts/data.gd` (Isle of Embers, MIT), reescritas |

Não foi copiado: `public/assets/`, nome, sprite, grito ou criatura de Pokémon,
conta, Clerk, PostHog, o build Vite, a lista de golpes. A arte é placeholder
(`motor/placeholders.js`), com os ids de `arte/manifesto.json`. `npm run arte`
empacota qualquer PNG mestre desses ids, os antigos e os da batalha.

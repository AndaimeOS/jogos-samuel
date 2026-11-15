# Origem — Planeta do Samuel 0.3 e Pescador Samuel

Os dois jogos saem de `desenvolvimento/jogos/motor-hordas/`.
`npm run build` grava `_privado/jogos/planeta-do-samuel/` e
`_privado/jogos/pescador-samuel/`.

## Código

A partida solo foi portada do Pokémon Survivors, Copyright (c) 2026 Pedro
Barretto, licença MIT (`LICENSE` na pasta daquele jogo e `LICENSE.txt` em
cada jogo publicado). O aviso está em `CREDITOS.txt`.

Entram as contas de `src/engine/viewport.ts`, `math.ts` (`dir8`), `rng.ts`,
`spatial.ts`, o joystick de `engine/input.ts`, o mapa de regiões de
`game/biomeMap.ts` (região de 1100 px), o anel de spawn de `game/spawner.ts`
(`hypot(vista) / 2 + 12`), a separação e o empurrão de `game/enemies.ts`,
`xpFor` de `game/leveling.ts` e as partículas, o tremor e o número de dano de
`game/effects.ts`. A curva de horda (1,4 / 40, depois 2,2 / 70, depois 3 / 100)
é a de `src/data/waves.ts`, comprimida em cada fase. Os segundos de cada fase
estão marcados como proposta no `CONFIG` e não aparecem escritos na tela.

Não entram `public/assets/` daquele jogo, nomes de criatura, gritos, conta,
ranking, co-op nem arena. O `jogo.php` não lê a pasta do outro slug.

## Arte

Personagem, comuns e chefes: folhas Walk / Idle / Hurt em 8 direções, retrato
40×40 e, nos inimigos, `Sumico.png`. Índice em `arte/motor.json`.
Escala 1 (o chefe já vem grande). O Sumico toca na morte, junto com as partículas.

O barco padrão é `samuel-barco-colete`. `samuel-barco-cinza` está na mesma pasta.

Interface, mapa de fases, golpes e chão que ainda não têm folha nova continuam
com o placeholder anterior. Sem foto real.

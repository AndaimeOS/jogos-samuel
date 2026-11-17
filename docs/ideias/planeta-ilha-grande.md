# Planeta do Samuel — ilha grande

Ideias guardadas do [PR #16](https://github.com/AndaimeOS/jogos-samuel/pull/16)
(branch `cursor/planeta-ilha-grande-2bd5`). O dono fechou o PR sem merge.
A branch fica no repositório para o código poder ser recuperado.

## Onde está o código

- PR: https://github.com/AndaimeOS/jogos-samuel/pull/16
- Commit da ilha: [`a130142`](https://github.com/AndaimeOS/jogos-samuel/commit/a13014270e638124b391b6e7712cbcbb942bcb3e) (`a13014270e638124b391b6e7712cbcbb942bcb3e`)
- Commit da lava e do chão cinza: [`29329d2`](https://github.com/AndaimeOS/jogos-samuel/commit/29329d2033a338aa194cf81b30084baea31ec441) (`29329d2033a338aa194cf81b30084baea31ec441`)
- Para olhar de novo: `git fetch origin cursor/planeta-ilha-grande-2bd5` e `git checkout 29329d2`

## Mundo

O mapa curto de 40×20 saiu. A ilha nasce de uma semente, na escala lida em
`scripts/world.gd` da Isle of Embers: grade de **128×128** tiles de **32 px**,
mundo de **4096×4096 px**. O terreno tem praia, mato, rocha e vulcão no meio.

A lava bloqueia o passo, como a água funda. O cinza ao lado da lava é andável.
Encostar na lava solta uma faísca, para ficar claro por que o Samuel parou.
No Fácil, o dano manda o Samuel de volta para a praia do sul — longe demais
para um esbarrão num chão laranja.

A arte, os nomes e as criaturas continuam os do Planeta. Nada de Pokémon.

## Câmera, mapinha e dia

A câmera segue o Samuel e para na borda do mundo. O minimapa no canto de cima
mostra a ilha e uma seta até o farol. O ciclo de dia dura **240 s**.

## Chefes

Cada chefe tem um padrão de ataque:

- **Urso da caverna:** investida que atordoa.
- **Sentinela de bronze:** voa e cospe.
- **Colosso de ferro:** chefe da 3ª era.

## Desenho e medidas

O cenário fora da vista não é desenhado: culling por chunks de **256 px**.

Medido no WebKit, perfil iPad geração 7, `hasTouch` / `isMobile`, só toque:

| Medida | Valor |
|---|---|
| Travessia de ponta a ponta, a 78 px/s | 43 s (medido 43,1 s; meta ≥ 25 s) |
| Mundo | 4096×4096 px |
| Geração da ilha | 22–23 ms (medido 23 ms) |
| FPS andando, 1024×768 | 62,3 |
| FPS na horda, 1024×768 | 58 (11 inimigos ainda vivos) |
| FPS na horda, 768×1024 | 62 (16 inimigos) |
| FPS na horda, dentro de `/jogar/` | 59,5 (15 inimigos) |

## Aviso de licença

A escala da ilha, o dia de 240 s e os dois padrões de chefe (investida que
atordoa; cuspe voando) foram lidos na Isle of Embers, licença MIT,
© 2026 Jaineil Rana (JaiGod), https://github.com/JaiGod/isle-of-embers.
O aviso MIT fica em `LICENSE.txt` e `CREDITOS.txt` do Planeta naqueles commits.
O ruído, o desenho e os nomes são deste jogo: a reescrita é original.
Nenhum arquivo daquela base entra no portal.

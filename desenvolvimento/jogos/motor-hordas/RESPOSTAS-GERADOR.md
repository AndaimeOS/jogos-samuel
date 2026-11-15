# Respostas ao Gerador — 15/11/2026

O jogo que está sendo montado não publica o `src/` do Pokémon Survivors.
Ele leva os sistemas da partida solo (vista, horda, separação, cartas, tremor,
partículas) e troca a arte. As respostas abaixo são desse código, em
`desenvolvimento/jogos/motor-hordas/`.

## 1. Sumico.png

Sim. Na morte o inimigo fica na tela por 0,5 s e a folha `Sumico.png` toca
(1 linha, 5 quadros, durações 6, 5, 5, 6 e 8 ticks). As partículas do acerto
continuam. O Samuel não tem Sumico: a vida no Fácil não zera.

## 2. Escala dos chefes

Escala 1. O quadro já vem grande (48 a 72 px) e é desenhado nesse tamanho,
um pixel de sprite por pixel de mundo. Não há um `scale` de chefe por cima.
O corpo (`body`) define o pé e a sombra. Não encolher para o tamanho dos comuns.

## 3. Identificação e caminho

A chave é o nome (`lobo-da-pedra`, `urso`, `samuel-barco-colete`), não um
número. Não existe `public/assets/` nestes dois jogos. O arquivo publicado fica em:

`_privado/jogos/<slug>/arte/sprites/<id>/{Walk,Idle,Hurt,Sumico,portrait}.png`

No ar isso é `/jogo/<slug>/arte/sprites/<id>/Walk.png`.
O índice é `arte/motor.json` (corpo, durações, linhas).
`<slug>` é `planeta-do-samuel` ou `pescador-samuel`.

O urso do Planeta entra na pasta `urso`. O lendário do Pescador entra em
`peixe-lendario`. O barco padrão nesta versão é `samuel-barco-colete`;
`samuel-barco-cinza` está no jogo e espera a escolha do Boaz.

## 4. Tamanho de quadro e fitSprites

No motor de origem, `fitSprites` (`src/render/sprites.ts`) só encolhe quando
a largura do **corpo** passa de um máximo. Na horda comum isso não roda.
No modo lenda o máximo é corpo de 48 px de largura, sem descer de 30 px de
altura (`LEGEND_BODY` e `LEGEND_MIN_HEIGHT`). Não há um teto de quadro.

Nestes dois jogos o desenho é escala 1, sem `fitSprites`. O quadro de 72 px
do colosso e da lula cabe. Um corpo bem mais largo que 48 px ocuparia a vista
(o lado curto do mundo fica em torno de 256 a 340 px). Até o lote atual, não
encolher.

## 5. Tiles

Opção A. O chão continua procedural, grade de 16 px, uma cor por bioma
(`GroundStyle`: `base`, `alt`, `path`, e `spots` se fizer falta), mais PNGs
soltos de decoração no padrão `<bioma>-rock-0..2` e `<bioma>-tree-0..2`.
Sem tileset de borda, canto ou transição.

A água do Pescador é o chão por onde o barco anda. Rio, lago e mar são biomas
andáveis, não um buraco e nem uma camada especial. O barco não nada "por cima"
de um chão de terra: a água é o piso.

## Respostas ao Gerador (lote 4)

O lote 4 entrou em `arte/chao.json` e `arte/cenario/`. O jogo lê esses caminhos
relativos à página do jogo (`arte/chao.json`, `arte/cenario/<nome>.png`).

### 1. Biomas

O lote trouxe um estilo por região. O jogo usa esse id direto:

| Jogo | Fase | Id do chão |
| --- | --- | --- |
| Planeta | era de Pedra (campo e caverna) | `pedra` |
| Planeta | era de Bronze (rio e deserto) | `bronze` |
| Planeta | era de Ferro (forja e floresta) | `ferro` |
| Planeta | farol | `praia-farol` |
| Pescador | rio e margem | `rio` |
| Pescador | lago e taboa | `lago` |
| Pescador | mar e areia | `mar` |

Não falta arquivo para esta versão. Se o próximo lote quiser um segundo visual
por era, os ids que ainda não existem são: `caverna`, `deserto`, `forja`,
`floresta`, `margem`, `taboa`, `areia`.

### 2. Caminhos

`arte/chao.json` e `arte/cenario/<bioma>-rock|tree-0..2.png` são os caminhos
que o jogo busca. O tile é de 16 px, com a paleta do json. A trilha usa a
faixa `|ruido-0.5| < 0.08` (um pouco mais larga que 0,025) para aparecer no
tile, não em cada pixel.

### 3. Sombra do bagre

Não precisa de `_v2`. O `bodyW` 51 conta o bigode. A sombra usa o menor lado
do corpo, com teto de 28 px. O quadro continua o mesmo.

### 4. Colisão da decoração

Pedra e árvore não bloqueiam o Samuel nem o barco. A água também não bloqueia:
ela é o piso. O anel de spawn continua `hypot(vista)/2 + 12`. Não encolher a
decoração por causa de colisão.

## Respostas ao Gerador (lote 5)

O lote 5 substituiu o 4. `motor_v2.json` virou `arte/motor.json` do Planeta
(16 ids). Mamute, caranguejo-gigante e robô enferrujado entram em escala 1,
com Walk, Idle, Hurt e Sumico. Não há mais placeholder para esses três.

Os perigos do Pescador estão em `arte/perigos/` e não entram no `motor.json`
nem na horda. Cada arquivo listado em `perigos.json` existe e o PNG tem o
tamanho do quadro vezes o número de quadros.

O raio pisca o alvo a 80 px ou mais do barco e não tira vida, nem no Normal.
A tempestade sobe os três degraus de `escurecer.png` (um por segundo e o
último fica enquanto durar). O degrau 3 cobre 19% do tile de 16 px; o resto
continua transparente, e a chuva cobre 3%. Dá para ver o barco, então o jogo
não para no degrau 1.

Nevoeiro: fiapos 2,5 s antes, depois a camada rolando e a borda presa à tela
(o centro do PNG é transparente). Onda: aviso 2 s na borda de onde ela vem,
frente em 1,5 s e espuma uma vez. O ícone da HUD alterna os dois quadros no
aviso e fica no quadro aceso enquanto o perigo dura.

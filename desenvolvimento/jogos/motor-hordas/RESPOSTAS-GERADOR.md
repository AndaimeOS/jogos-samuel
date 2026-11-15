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

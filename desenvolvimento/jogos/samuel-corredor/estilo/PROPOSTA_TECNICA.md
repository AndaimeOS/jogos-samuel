# Samuel Corredor: proposta técnica de arte (para o Dev confirmar)

Etapa: **folha de estilo**, não são os sprites finais. Plano: `/workspace/samuel-corredor-plano.md` (PROPOSTA de 15/11/2026).
Atualizada com o que o Dev confirmou em 15/11/2026, por volta das 18:47 BRT. A lista exata de animações, frames, ids de tile e camadas do Tiled vem no ARTE.md da branch; quando chegar, ajusto os nomes.

## Confirmado pelo Dev
- **Tela:** a altura base é **240 px**, e a largura se adapta à tela: cerca de 320 com o iPad deitado e cerca de 180 em pé. Phaser com `pixelArt: true`, escala nearest e zoom inteiro.
- **Tamanhos:** **tiles de 16×16** e **Samuel em quadros de 32×48**.
- **Atlas JSON Hash** (`this.load.atlas`) para personagens, inimigos, moedas e efeitos. Os frames se chamam `<sprite>/<anim>_<n>`, por exemplo `samuel/correr_0`.
- **Fases em Tiled JSON** com um tileset de 16×16.
- **Entrega espelhando o repo:** `/workspace/arte/samuel-corredor/entrega/arte/` com `atlas.png` + `atlas.json`, `tiles.png` e `fases/*.json`. A folha de estilo fica em `estilo/`.
  Ainda **não** criei a pasta `entrega/`; ela entra junto com os sprites finais, depois do ARTE.md.

## Amostras já no formato (em `estilo/amostra_tecnica/`)
- **`samuel_atlas.png` + `samuel_atlas.json`:** atlas 128×256 em JSON Hash, quadros de 32×48 sem corte (`trimmed: false`), 2 px entre quadros. São 8 frames: `samuel/parado_0`, `samuel/correr_0..2`, `samuel/pular_0`, `samuel/cair_0`, `samuel/dano_0` e `samuel/comemorar_0`.
- **`atlas_amostra.png` + `atlas_amostra.json`:** atlas 256×256 com 44 frames, cobrindo todas as peças com nome, no mesmo padrão:
  - personagens: `doguinho/parado_0`, `doguinho/correr_0..1`, `doguinho/feliz_0`
  - inimigos: `lesma/andar_0..1`, `lesma/pof_0`, `besouro/andar_0..1`, `besouro/pof_0`, `morcego/voar_0..1`, `morcego/pof_0`
  - coletáveis e cenário: `moeda/girar_0..3`, `estrela/brilhar_0..1`, `bandeira/tremular_0..2`, `cogumelo/mola_0..2`, `plataforma/helice_0..1`
  - efeitos: `poeira/sumir_0..2`, `pof/estourar_0..2`, `brilho/piscar_0..2`
- **`samuel_anims.json`:** sugestão para `this.anims.create`. Correr fica em 10 fps na ordem 0,1,2,1; comemorar é 4 fps; dano é 1 quadro, e o piscar da invencibilidade é feito no código.
- **`tiles_amostra.png`:** 3 linhas (campo, floresta, caverna) × 12 colunas, com tiles de 16×16 sem margem e sem espaçamento. No Tiled, o firstgid 1 é o canto de cima à esquerda. A ordem das colunas é `chao_esq, chao_meio, chao_dir, terra_esq, terra_meio, terra_dir, plat_esq, plat_meio, plat_dir, bloco, especial, enfeite`.

## Decisões de arte que afetam o código
- **Pé e origem:** o pé fica sempre na **última linha** do quadro. Sugiro `setOrigin(0.5, 1)`.
  - A caixa opaca do Samuel parado é x 5, y 4, 21×44 dentro do quadro.
  - Hitbox sugerida: 14×40, com offset (9, 8). É provisório; ajustar no feel.
- **Quadros com tamanho fixo por sprite**, com o pé alinhado ao rodapé:

  | Sprite | Quadro |
  |---|---|
  | doguinho | 28×24 |
  | lesma e morcego | 28×20 |
  | besouro | 24×20 |
  | moeda e estrela | 16×16 |
  | bandeira | 32×64 |
  | cogumelo | 32×32 |
  | plataforma móvel | 48×16 |
  | poeira | 10×8 |
  | pof | 24×24 |
  | brilho | 9×9 |

- **Sombra:** nenhuma no sprite.
- **Pulando no inimigo:** o quadro `pof_0` é o inimigo amassado; depois toca o efeito `pof/estourar` com estrelinhas. Não há sangue.
- **Tiles:**
  - O contorno só aparece nas faces de fora: o `*_meio` emenda sem costura e o `*_esq`/`*_dir` fecham as bordas.
  - A plataforma de passar por baixo ocupa só os 7 px de cima do tile, então a colisão é **one-way** no topo.
  - O bloco especial da caverna é o **bloco que cai devagar** e tem uma carinha de preocupado, que serve de aviso.
- **Fundos (parallax):**
  - Cada camada tem 256 px de largura e **repete na horizontal** sem costura. Não dependem da largura da tela, então servem para 320 e para 180.
  - O céu é uma faixa vertical de 16×240 que repete.
  - A camada de perto desce até o pé da tela, para aparecer dentro dos buracos.
  - Fator de parallax e âncora sugeridos (`tileSprite` com `tilePositionX = câmeraX × fator`, presa ao topo ou ao pé):

    | Fase | Camadas (fator, âncora) |
    |---|---|
    | campo | céu 0 (topo) · nuvens 0,1 (topo+8) · morros_longe 0,2 (pé−40) · morros 0,4 (pé−32) · moitas 0,7 (pé) |
    | floresta | céu 0 · mata_longe 0,2 (pé−40) · troncos 0,45 (topo) · copas 0,6 (topo) · samambaias 0,8 (pé) |
    | caverna | céu 0 · castelo 0,2 (pé−40) · estalactites 0,5 (topo) · pedras 0,7 (pé) |

  - As camadas de longe não têm contorno, para recuar; a de perto tem.
  - Todos os valores estão em `manifesto.json`.

## Botões e 44 pt (base de 240 px de altura)

| iPad | lado usado | zoom inteiro | pt por px de arte |
|---|---|---|---|
| mini, deitado (744 pt, DPR 2) | 1488/240 = 6,2 | 6 | **3,0 (pior caso)** |
| 10ª/Air, deitado (820 pt) | 1640/240 = 6,8 | 6 | 3,0 |
| Pro 13", deitado (1032 pt) | 2064/240 = 8,6 | 8 | 4,0 |
| em pé (altura ≥ 1133 pt) | ≥ 9 | ≥ 9 | ≥ 4,5 |

44 pt ÷ 3 = 14,7, então o **mínimo é 15 px de arte**. Os botões ficaram assim:

| Botão | Tamanho | No pior caso |
|---|---|---|
| esquerda e direita | 32×32 | 96 pt |
| pular | 40×40 | 120 pt |
| pausa, tela cheia e repetir | 24×24 | 72 pt |
| próxima | 40×40 | 120 pt |

- **Formato:** cada botão é um PNG com 2 quadros lado a lado: normal | apertado.
- **Hitbox:** o quadro inteiro.
- **Posição sugerida**, presa aos cantos (cabe em 180 e em 320):
  - corações em (6,6) e moedas em (6,22)
  - pausa em (W−30,6) e tela cheia em (W−58,6)
  - esquerda em (6,H−38) e direita em (44,H−38)
  - pular em (W−46,H−46)

## HUD
- **Corações:** 14×13, cheio e vazio.
- **Moedas:** a moeda vai sobre um painel petróleo.
- **Dígitos:** `hud/digitos.png` tem 10 quadros de 8×12, na ordem 0123456789. É uma fonte pixel nossa, só com dígitos. Dá para usar como spritesheet (`frameWidth 8`) ou montar uma bitmap font.

## Perguntas para o Dev
1. A lista final de animações e tiles vem no ARTE.md? Os nomes que usei (`parado`, `correr`, `pular`, `cair`, `dano`, `comemorar`; `andar`/`voar`/`pof`) servem?
2. **Atlas:** um só para tudo ou um por grupo (personagens, coletáveis, efeitos)? Quer padding/extrude diferente de 2 px sem corte? Quer `trimmed`?
3. **Tiles:** um `tiles.png` único com as 3 fases (uma linha por fase) ou um tileset por fase? Precisa de tiles de rampa e de água?
4. **Origem:** `setOrigin(0.5,1)` no pé, ou prefere o ponto de pivô dentro do JSON?
5. **Fundos:** `tileSprite` por camada, com largura de 256, está bom? Ou prefere uma largura igual à da tela maior (por exemplo 384)?
6. A plataforma móvel e o cogumelo-mola entram no atlas (objetos do Tiled) ou no tileset?

## Fora desta etapa
Os sprites finais, `entrega/arte/*`, as fases em Tiled JSON, o troféu do fim da fase 3, o som e as partículas no código.

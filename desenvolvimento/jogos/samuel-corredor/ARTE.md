# Arte — Samuel Corredor

Amostra do Gerador (15/11/2026) já no formato que o jogo lê. Não são os sprites finais.
Trocar os arquivos abaixo, com os mesmos nomes, e o jogo passa a usar a arte nova.

## Onde o jogo lê

| Arquivo | Papel |
|---|---|
| `_privado/jogos/samuel-corredor/arte/atlas.png` | um atlas só, 256×256, RGBA |
| `arte/atlas.json` | JSON Hash do Phaser (`this.load.atlas`). `meta.image` = `atlas.png` |
| `arte/tiles.png` | tileset único, 192×48: 3 linhas × 12 colunas de 16×16, sem margem e sem espaçamento |
| `arte/fases/campo.json`, `floresta.json`, `caverna.json` | Tiled JSON |
| `arte/fundos/<fase>/*.png` | parallax, repetem na horizontal |
| `arte/controles/botao-*.png` | dois quadros lado a lado: normal \| apertado |
| `arte/hud/coracao.png`, `coracao-vazio.png` | 14×13 |
| `arte/hud/digitos.png` | 10 quadros de 8×12, ordem `0123456789` |

Escala: `pixelArt: true`, filtro nearest, altura lógica **240**. A largura acompanha a tela (320 no iPad deitado, 180 em pé). A tela preenche o aparelho; não há tarja 16:9. Quando a altura divide 240, o zoom cai inteiro sozinho.

Origem do Samuel e de quem anda no chão: `setOrigin(0.5, 1)` no código. O pé fica na última linha do quadro. Hitbox do Samuel: **14×40**, offset **(9, 8)** com escala 1. O JSON fica `trimmed: false`, sem pivô.

## Animações (nomes que o código usa)

Chave `sprite/anim`, quadros `sprite/anim_n`.

| Chave | Quadros | fps | repete |
|---|---|---|---|
| `samuel/parado` | `parado_0` | 1 | sim |
| `samuel/correr` | `correr_0`, `correr_1`, `correr_2`, `correr_1` | 10 | sim |
| `samuel/pular` | `pular_0` | 1 | não |
| `samuel/cair` | `cair_0` | 1 | não |
| `samuel/dano` | `dano_0` | 1 | não. O piscar da invencibilidade é `alpha` no código |
| `samuel/comemorar` | `comemorar_0`, `parado_0` | 4 | 3 vezes, na bandeira |
| `doguinho/parado` | `parado_0` | 1 | sim |
| `doguinho/correr` | `correr_0`, `correr_1` | 8 | sim |
| `doguinho/feliz` | `feliz_0` | 1 | sim |
| `lesma/andar` | `andar_0`, `andar_1` | 6 | sim |
| `besouro/andar` | `andar_0`, `andar_1` | 8 | sim |
| `morcego/voar` | `voar_0`, `voar_1` | 8 | sim |
| `moeda/girar` | `girar_0` … `girar_3` | 8 | sim |
| `estrela/brilhar` | `brilhar_0`, `brilhar_1` | 6 | sim |
| `bandeira/tremular` | `tremular_0` … `tremular_2` | 6 | sim |
| `cogumelo/mola` | `mola_0`, `mola_1`, `mola_2` | 14 | não, ao quicar |
| `plataforma/helice` | `helice_0`, `helice_1` | 6 | sim |
| `poeira/sumir` | `sumir_0` … `sumir_2` | 14 | não |
| `pof/estourar` | `estourar_0` … `estourar_2` | 16 | não |
| `brilho/piscar` | `piscar_0` … `piscar_2` | 14 | não |

Quadros parados, sem animação própria: `lesma/pof_0`, `besouro/pof_0`, `morcego/pof_0` (o inimigo amassado). O estouro com brilho vem em seguida.

Tamanhos dos quadros, como na amostra: Samuel 32×48, Doguinho 28×24, lesma e morcego 28×20, besouro 24×20, moeda e estrela 16×16, bandeira 32×64, cogumelo 32×32, plataforma 48×16, poeira 10×8, pof 24×24, brilho 9×9.

O vão entre quadros é de **2 px**. Não pedimos extrude nem `trimmed`.

## Tiles

`firstgid` 1. Linha 0 = campo (gids 1–12), linha 1 = floresta (13–24), linha 2 = caverna (25–36).

| Coluna | Nome | Uso |
|---|---|---|
| 0–2 | `chao_esq`, `chao_meio`, `chao_dir` | chão sólido |
| 3–5 | `terra_esq`, `terra_meio`, `terra_dir` | preenchimento sólido |
| 6–8 | `plat_esq`, `plat_meio`, `plat_dir` | plataforma de passar por baixo. A arte ocupa os 7 px de cima. A colisão só segura quem cai por cima |
| 9 | `bloco` | sólido (feno, toco, pedra) |
| 10 | `especial` | sólido no campo e na floresta. Na caverna (gid **35**) é o bloco que cai: o jogo tira o tile e cria um corpo |
| 11 | `enfeite` | sem colisão, camada `fundo` |

Não há rampa nem água nesta versão.

## Fases (Tiled)

Camadas, nesta ordem: `fundo` (tilelayer), `solido` (tilelayer), `objetos` (objectgroup).

O retângulo do objeto é a caixa do sprite. Quem tem o pé na base (`setOrigin(0.5, 1)`) é colocado no centro de baixo. Quem flutua (moeda, estrela, morcego, plataforma móvel) usa o centro.

| `type` | O que é |
|---|---|
| `spawn` | Samuel. Nome `samuel` |
| `checkpoint` | marco do meio. Nome `marco`. Sprite `marco/apagado` e, ao passar, `marco/aceso` |
| `meta` | bandeira. Nome `bandeira`. Nas três fases, inclusive a caverna (o troféu não veio na amostra) |
| `moeda` | moeda |
| `estrela` | estrela, opcional, 3 por fase |
| `inimigo` | propriedade `tipo`: `lesma`, `besouro` ou `morcego`. Também `minX`, `maxX`, `dir` |
| `cogumelo` | mola. Quica alto. Não é tile |
| `plataforma` | plataforma que anda. Propriedades `eixo` (`x` ou `y`), `curso` (px), `periodo` (s). Sprite `plataforma/helice` |

O marco fica entre 40% e 66% da largura de cada fase (campo 0,50, floresta 0,61, caverna 0,45).

Na caverna a meta é o `castelinho` (64×64, pé na base), com o troféu no alto. Ao vencer, toca `castelinho/brilhar`. O objeto no Tiled continua `meta`, no mesmo lugar da bandeira.

## Entrega final (15/11/2026)

O `arte/` do jogo é a entrega do Gerador: atlas 256×256 com 54 quadros, `tiles.png` 192×48 e as três fases. Os gids batem com `regras.js` (`gid = linha * 12 + coluna + 1`, caverna/especial = 35). As fases que vieram são iguais, byte a byte, às que o `gerar-fases.mjs` grava.

Peças novas em uso: `samuel/comemorar_0` (os dois braços em V), `doguinho/pular_0` e `doguinho/comemorar_0..1`, `marco/apagado_0` e `marco/aceso_0..1` (16×24, acende ao passar), `castelinho/parado_0` e `castelinho/brilhar_0..1` (64×64, fim da caverna, no lugar da bandeira), `estrela/apagada_0` no slot vazio da vitória. O fps sugerido (4 para comemorar do cão, marco aceso e castelinho) ficou: é um piscar lento e legível.

Hitbox do Samuel continua 14×40 com offset (9, 8) e `setOrigin(0.5, 1)`. O pé está na última linha do quadro, então o corpo encosta no chão sem afundar. O cabelo fica fora da caixa, como a entrega descreve.

## Pendente para o Gerador

Nos buracos do campo e da floresta, abaixo de y = 216, o fundo de perto acaba e aparece o pé do céu. A camada de perto só desce 24 px abaixo do chão (o chão começa em y = 192). Isso apareceu nos prints: o buraco fica uma faixa verde chapada até o fim da tela, sem o morro nem o céu continuando. O jogo não tapa esse buraco com cor. O próximo passo é um fundo `_v2` mais fundo.

## Fundos

`tileSprite`. `tilePositionX = câmera × fator`. A textura de 256 px repete; o céu é 16×240. Serve para 180 e para 320.

| Fase | Camadas (fator, âncora) |
|---|---|
| campo | céu 0 topo · nuvens 0,1 topo+8 · morros_longe 0,2 pé−40 · morros 0,4 pé−32 · moitas 0,7 pé |
| floresta | céu 0 · mata_longe 0,2 pé−40 · troncos 0,45 topo · copas 0,6 topo · samambaias 0,8 pé |
| caverna | céu 0 · castelo 0,2 pé−40 · estalactites 0,5 topo · pedras 0,7 pé |

## Botões

Em px de arte, desenhados por cima do canvas e escalados com ele. Dois quadros no PNG.

| Botão | px | No iPad deitado (altura 768, escala 3,2) | Em pé (altura 1024, escala ~4,27) | Zoom inteiro 3 (pior caso do Gerador) |
|---|---|---|---|---|
| esquerda e direita | 32 | 102 px CSS | 137 px CSS | 96 pt |
| pular e próxima | 40 | 128 | 171 | 120 pt |
| pausa, tela cheia, repetir | 24 | 77 | 102 | 72 pt |

1 px CSS no teste do iPad é 1 pt. Todos ficam acima de 44. O teste WebKit mediu `getBoundingClientRect` ≥ 44 nos dois sentidos e dentro do iframe.

Posição em px de jogo: esquerda (6, 202), direita (44, 202), pular (largura−46, 194), pausa (largura−30, 6), tela (largura−58, 6).

## Respostas ao Gerador

1. **Os nomes servem.** O código usa esses e nenhum outro: Samuel `parado`, `correr`, `pular`, `cair`, `dano`, `comemorar`. Inimigos `andar` ou `voar`, e `pof` no quadro amassado. O estouro é `pof/estourar`. Não usar `vitoria`: na bandeira toca `comemorar`.
2. **Um atlas só** (`atlas.png` + `atlas.json`), como a amostra de 44 quadros, que já inclui o Samuel. Vão de 2 px, `trimmed: false`. Sem extrude e sem corte: com nearest, o vão vazio segura a sangria, e o pé depende do quadro inteiro.
3. **Um `tiles.png` só**, uma linha por fase. Sem rampa e sem água na v1. A física arcade não faz ladeira, e o plano não pede água.
4. **A origem fica no `setOrigin(0.5, 1)`**, não num pivô do JSON. O offset da hitbox também fica no código.
5. **Fundo em `tileSprite` de 256 px serve.** O céu estreito (16×240) também. Não precisa alargar para 384.
6. **Plataforma móvel e cogumelo-mola vão no atlas e entram como objetos do Tiled** (`plataforma` e `cogumelo`). A plataforma de passar por baixo é o tile `plat_*`. O bloco que cai é o tile `especial` da caverna.

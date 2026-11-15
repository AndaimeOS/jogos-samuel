# Samuel Corredor: entrega final da arte (15/11/2026)

Segue o `ARTE.md` (branch `cursor/samuel-corredor-2db6`, PR #13). Para usar no jogo, copie `arte/` por cima de `_privado/jogos/samuel-corredor/arte/`. Os nomes dos arquivos são os mesmos.

## O que tem em `arte/`
| Arquivo | Como está |
|---|---|
| `atlas.png` + `atlas.json` | um atlas só, **256×256**, RGBA, JSON Hash, `meta.image` = `atlas.png`, 54 quadros, vão de 2 px (também na borda), `trimmed:false`, sem rotação, sem extrude e sem pivô |
| `tiles.png` | 192×48, 3 linhas (campo, floresta, caverna) × 12 colunas de 16×16, sem margem e sem espaçamento |
| `fases/campo.json`, `floresta.json`, `caverna.json` | Tiled JSON, camadas `fundo`, `solido` e `objetos`. Saída idêntica byte a byte à do `gerar-fases.mjs` |
| `fundos/<fase>/*.png` | céu 16×240, demais 256 de largura, repetem na horizontal |
| `controles/botao-*.png` | 2 quadros lado a lado (normal \| apertado): 32 (esquerda, direita), 40 (pular, próxima), 24 (pausa, tela-cheia, sair-tela-cheia, repetir) |
| `hud/coracao.png`, `coracao-vazio.png` (14×13), `digitos.png` (10 × 8×12, 0123456789) | iguais à folha aprovada |
| `hud/estrela-slot.png` | **extra**: 2 quadros 16×16 (apagada \| acesa), para quem preferir a estrela fora do atlas |

## Nomes no atlas
Todos os quadros do ARTE.md, com os nomes exatos: `samuel/{parado_0, correr_0..2, pular_0, cair_0, dano_0, comemorar_0}`, `doguinho/{parado_0, correr_0..1, feliz_0}`, `lesma/{andar_0..1, pof_0}`, `besouro/{andar_0..1, pof_0}`, `morcego/{voar_0..1, pof_0}`, `moeda/girar_0..3`, `estrela/brilhar_0..1`, `bandeira/tremular_0..2`, `cogumelo/mola_0..2`, `plataforma/helice_0..1`, `poeira/sumir_0..2`, `pof/estourar_0..2`, `brilho/piscar_0..2`.

**Novos (não estão no ARTE.md; o código só usa se quiser):**
- `samuel/comemorar_0` agora é a pose nova, com os **dois braços para cima em V**. A pose antiga continua em `estilo/samuel/samuel-lado.png`, e a nova está em `samuel-lado_v2.png`.
- `doguinho/pular_0`, `doguinho/comemorar_0..1` (pulinho de festa). `feliz_0` continua.
- `marco/apagado_0`, `marco/aceso_0..1`: 16×24, o mesmo retângulo do objeto `checkpoint`.
- `castelinho/parado_0`, `castelinho/brilhar_0..1`: castelinho com troféu, 64×64, para o fim da caverna.
- `estrela/apagada_0`: o slot vazio da tela "Fase vencida". O slot aceso é `estrela/brilhar_0`.

`animacoes.json` traz as chaves, os quadros, o fps e o repeat do ARTE.md, mais os extras. Sugestões para os extras: doguinho/comemorar 4 fps, marco/aceso 4 fps, castelinho/brilhar 4 fps.

## Origem e hitbox
Quem anda no chão (Samuel, Doguinho, lesma, besouro, bandeira, cogumelo, marco e castelinho) tem o pé **na última linha do quadro** em todos os quadros, até pular, cair e comemorar. Com `setOrigin(0.5,1)` o corpo fica igual em todas as poses. O Samuel ocupa as linhas 4 a 47 e cabe na hitbox 14×40 offset (9,8). O cabelo passa um pouco acima dela.

## Avisos
- As fases são **amostras compatíveis**: uma porta em Python do `gerar-fases.mjs`. Com `gid = linha*12 + coluna + 1` (caverna/especial = 35) a saída é igual byte a byte ao script do Dev. A caverna continua com `meta` = bandeira. O castelinho com troféu está no atlas para quando a regra mudar.
- Nos buracos, abaixo de y = 216 aparece o pé do céu, porque a camada de perto desce só 24 px abaixo do chão. Se incomodar, posso fazer uma `_v2` mais funda.

## Pastas
- `previas/`: `folha-resumo.png`, `atlas_magenta.png`, `atlas_preto.png`, `pecas-novas_magenta_preto.png`, `gif/` (uma animação por chave, no fps do ARTE.md) e `validacao.json`.
- `_src/`: `entrega.py` (monta o atlas, os tiles e as cópias), `fases.py`, `pecas_v2.py`, `validar.py`, `previas.py`, `manifesto.py` e `teste-phaser.html` (carrega tudo no Phaser 3.90).
- `manifesto.json`: os arquivos com tamanho e sha256.

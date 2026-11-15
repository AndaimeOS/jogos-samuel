# Planeta do Samuel v0.2 — plano (fase 1, só análise)

Data: 2026-11-15. Sem código de jogo, sem PR, sem merge, sem deploy.
Lido: `_privado/jogos/planeta-do-samuel/` (v0.1.0 no ar, `regras.js` + `index.html`) e `desenvolvimento/jogos/pokemon-survivors/` (MIT no código; `public/assets/` é CC BY-NC e não sai dali).

O v0.1 já tem o laço certo (3 eras, farol, x/N, pesquisa, noite, fogueira, Fácil sem morte, zero inimigo). O que o Boaz recusou é o desenho: retângulos chapados, personagem de ~12×18 px que não vira, noite em gradiente suave. A v0.2 troca **só a apresentação**. `regras.js`, o `MAPA`, os custos e os testes de regra ficam.

---

## 1. O que reaproveitar do motor

Não existe um pacote “engine” separado. O jogo é um Vite + TypeScript acoplado a horda, golpe e conta. Dá para copiar funções, com o aviso MIT do Pedro Barretto (`LICENSE`) e registro no `ORIGEM.md`. Não dá para importar a pasta do Pokémon em runtime: o `jogo.php` só entrega `_privado/jogos/<slug>/`, e `verificar_jogo.py` recusa caminho absoluto.

### Levar (copiar a ideia, reescrever em JS ao lado de `regras.js`)

| Arquivo | Fica | Adapta / corta |
|---|---|---|
| `src/engine/viewport.ts` | Escala inteira em pixel de dispositivo, lado do canvas par (senão o sprite treme 1 px), mundo ~220 px no celular e ~300 px no lado curto do tablet/desktop | 1024×768 cai no ramo tablet: ~3 CSS px por pixel de mundo, igual ao `ESCALA = 3` do v0.1. Vista ~341×256 px de mundo. O mapa tem 40×21 tiles × 16 = **640×336**. Não mudar o zoom. |
| `src/engine/input.ts` (`joystick`, `fixedJoystick`, `gripDown/Move/Up`) | Analógico, zona morta 8 px, raio 52 CSS px, velocidade cheia aos 75%, stick flutuante ou fixo | Sem gamepad, sem remap, sem mira (`readAim` é da Arena). O `#joystick` do DOM **permanece**: `tests/tablet.test.js` mede a caixa dele (≥ 48 px) em 1024×768. A matemática entra por baixo; o chrome continua quadrado do kit (raio 0, papel `#F5F2E8`, tinta `#193337`, knob laranja). |
| `src/render/joystick.ts` | Knob desenhado no grid de pixel, sombra e brilho | O desenho de lá é círculo estilo GBA. Não copiar o círculo. |
| `src/engine/math.ts` (`dir8`) | 8 direções, nesta ordem de linha da folha: 0 baixo, 1 baixo-direita, 2 direita, 3 cima-direita, 4 cima, 5 cima-esquerda, 6 esquerda, 7 baixo-esquerda | `dmath` existe por causa do replay entre navegadores. Aqui `Math.atan2` basta. |
| `src/engine/pixelart.ts` (miolo) | `imageSmoothingEnabled = false`, canvas, `fromStrings` (arte em string), `drawLoaded` | Não levar flash branco, silhueta de status, vestimenta, worker. O placeholder até o artista entregar sai de `fromStrings`, com os mesmos ids do manifesto. |
| `src/render/draw.ts` — só `shadow` (linha 89) e a ordenação por `y` (por volta da 1056) | Elipse no pé, sort estável: quem está mais abaixo desenha por cima | O arquivo tem 1237 linhas de golpe. Não copiar o arquivo. |
| `src/render/sprites.ts` — geometria, não o loader de dex | Coluna = quadro, linha = direção, duração em ticks de 1/60, `footY`, desenho com o pé em `(x, y)` | Sem número de Pokédex, shiny, Hurt, Fly, grito, retrato, atlas de silhueta. O leitor novo aponta para o manifesto abaixo. |
| `src/render/world.ts` | Tile **16×16**, chunk 256, chão em cache, paleta de 3 tons com ruído | O Planeta não é mapa infinito. Não portar `src/data/biomes.ts` nem `src/game/biomeMap.ts`. O `MAPA` de `regras.js` continua a fonte (`.` terra, `~` água). O ruído só escolhe variação de grama. Na troca de era, troca a paleta do chão — o v0.1 não faz isso; é só visual. |
| `src/render/places.ts` `lightDisc` + `darkLayer` (~linhas 547–603) | Noite em pixel duro (Bayer), núcleo sólido e anéis que rareiam. Um canvas do tamanho da vista, `destination-out` | Raios já definidos: fogueira 80, casa 40, farol 150 (`CONFIG`). Cortar olhos no escuro, tipo Fogo/Elétrico e qualquer nome de lugar do Pokémon. O gradiente suave do v0.1 (`desenharNoite`) é o que sai. |
| `src/game/players.ts` `centerScreen` | Câmera no pixel inteiro, 10 px acima do pé, grudada no jogador (sem lerp) | Sem time, sem co-op. Travar a câmera na borda do mapa, como o v0.1 já faz. |

Opcional, só se o tablet engasgar: `src/render/quality.ts` (modo magro). O mapa cabe em um chunk; provavelmente não precisa.

### Cortar por completo

- Combate e fluxo de horda: `src/game/` (`enemies.ts`, `attacks.ts`, `combat.ts`, `spawner.ts`, `bosses`, `hazards`, `horde`, `pickups`, ondas, XP, evolução, tipos). O Planeta não tem inimigo, arma, dano nem morte (`estado.morte` é sempre falso; no zero de fome/calor o passo vai a 0,4).
- `src/render/draw.ts` como um todo, `*Fx.ts`, `attackLayers.ts`, `damageNumbers.ts`.
- Rede e conta: `src/coop`, `src/arena`, `src/realm`, `src/net`, `server/`, `relay/`, Clerk, PostHog, `src/analytics.ts`.
- `src/i18n` (cinco línguas). O Planeta é pt-BR.
- `src/engine/dmath.ts`, replay, `RULES_VERSION`. Não há ranking.
- **Todo `public/assets/`.** Sprite, retrato, grito e nome de Pokémon são CC BY-NC e IP da Nintendo / Creatures / GAME FREAK. `LICENCA-CC-BY-NC.md` diz que não saem da pasta do Pokémon Survivors. Também não copiar arte de código que desenha criatura ou lugar com nome de Pokémon (`render/biomePieces.ts`, `scenery.ts`, `landmarkPieces.ts`, `sprites.generated.json`). O farol do Planeta é desenho novo; não reusar o `lighthouse` de `biomePieces.ts`.
- Colisão de elipse e “surf / voo / fantasma” de `src/game/terrain.ts`. No Planeta só a água bloqueia (`bloqueia` em `regras.js`). Árvore e rocha não bloqueiam hoje; a v0.2 só passa a desenhar o Samuel atrás ou na frente (sort por `y`). Mudar isso seria regra nova — não fazer nesta leva.
- Botão redondo de golpe (`.special-button`, 76 px, `src/ui/style.css`). Interagir e Comer continuam botões do kit, ≥ 48 px.

### Build: TypeScript do Pokémon × JS do Planeta

O Pokémon publica um bundle Vite (`npm run build` = `tsc` + Vite) já commitado em `_privado/jogos/pokemon-survivors/`, com Clerk, PostHog e centenas de PNG. O Planeta v0.1 é o outro tipo do `desenvolvimento/README.md`: **sem build**, `_privado/jogos/planeta-do-samuel/` é a fonte (`index.html` importa `regras.js`). Os testes (`desenvolvimento/jogos/planeta-do-samuel/`, vitest) importam esse `regras.js`.

A v0.2 fica nesse formato. Reescrever em JS os trechos da tabela. Não herdar o `package.json` / `vite.config.ts` / `tsconfig.json` do Pokémon. Um Vite só valeria se a apresentação passar de uns poucos módulos; aí `base: './'` e a saída commitada em `_privado/`, como o README já descreve. Não é o caso desta leva.

`regras.js` não muda de contrato: `schemaVersion` 1, chave `planeta-do-samuel:save`, `CONFIG.bloco = 16`.

---

## 2. Especificação de sprites (para o artista)

Até a arte chegar, o jogo desenha placeholder com `fromStrings` no id do manifesto. Trocar a arte = trocar o arquivo, sem mudar regra.

### Regras de desenho

- **Tile do mundo:** 16×16 px. Todo quadro é múltiplo de 16.
- **Perspectiva:** 3/4 (três quartos), a mesma das folhas do motor. Não é vista de cima pura do v0.1 nem de lado. O pé encosta no último pixel de baixo, no centro. A sombra oval **não** vai no sprite: o código desenha.
- **Contorno:** 1 px na cor tinta `#193337`, dentro do quadro.
- **Paleta do portal:** papel `#F5F2E8`, tinta `#193337`, verde `#B9ED80`, laranja `#FF9D52`, lilás `#CEB7EF`, amarelo `#F2D15A`, azul-petróleo `#1F6F78`. Samuel: jaqueta laranja, camiseta amarela, calça azul-petróleo. Player 2 (se entrar): jardineira lilás. Cão: Jack Russell branco e marrom. Sem panda. Sem nome, silhueta ou criatura de Pokémon.
- **Formato do mestre:** PNG com transparência (RGBA, fundo vazio, sem pré-multiplicar alfa). Um PNG por linha da tabela, já na grade da folha.
- **O que o jogo carrega:** WebP sem perdas, mesmos pixels, empacotado num atlas. Motivo: o CDN da Hostinger recodifica PNG/JPEG, e o `conferir_producao.py` nesses formatos só confere largura e altura (`≈`). WebP entra na conferência por SHA-256. PNG e WebP são extensões aceitas (`EXTENSOES_JOGO`).
- **Folha:** sem espaço entre quadros. Coluna = quadro da animação, de esquerda para direita. Linha = direção, de cima para baixo, na ordem do `dir8` (seção 1). `imageSmoothingEnabled = false` e escala inteira, então vizinho não vaza.
- **O artista desenha 5 vistas** (baixo, baixo-direita, direita, cima-direita, cima). Esquerda e as duas diagonais esquerdas são espelho no empacotador — o mesmo truque de `src/render/wearArt.ts`. Não espelhar no arquivo à mão.
- **fps:** o manifesto guarda ticks de 1/60 s, como `frameIndex` em `sprites.ts`. Andar: 4 quadros × 4 ticks = **15 fps**. Fogueira: 4 × 8 ticks = **7,5 fps**. Água: 2 × 30 ticks = **2 fps**.
- **Não desenhar:** quadro de dano, arma, inimigo, explosão.

### Onde cada arquivo fica

Mestre (não vai no zip do site):

`desenvolvimento/jogos/planeta-do-samuel/arte/<caminho da tabela>`

Publicado, gerado a partir do mestre:

- `_privado/jogos/planeta-do-samuel/arte/atlas.webp`
- `_privado/jogos/planeta-do-samuel/arte/manifesto.json`

### Lista

Personagem, quadro **32×48**. Andar: 4 colunas × 8 linhas (o PNG mestre pode vir com 5 linhas; o espelho completa). Parado: 2 colunas (respirar / piscar), durações `[40, 8]`, 8 linhas.

| Id | PNG mestre | Notas |
|---|---|---|
| `samuel-andar` | `samuel/walk.png` | O corpo jogável. |
| `samuel-parado` | `samuel/idle.png` | |
| `player2-andar` | `player2/walk.png` | Opcional. Mesma grade. Só se o cookie do explorador trocar o corpo (dúvida 3). |
| `player2-parado` | `player2/idle.png` | Opcional, par do anterior. |
| `cao-parado` | `cao/idle.png` | **32×24**, 2 quadros, **1 direção** (3/4 de frente). Decoração parada, como o v0.1 em (270, 184). Não é Pokémon. |

Chão, **16×16**, uma direção. Três pastas iguais, paleta da era (Pedra mais crua, Bronze mais quente, Ferro mais fria e reta). O código troca o prefixo quando `estado.era` muda. A forma da ilha não muda.

| Id | PNG mestre | Quadros |
|---|---|---|
| `chao-<era>-grama` | `chao/<era>/grama.png` | 1 |
| `chao-<era>-grama-var` | `chao/<era>/grama-var.png` | 1, mancha |
| `chao-<era>-areia` | `chao/<era>/areia.png` | 1. O código usa na beira da água, como o v0.1. Sem autotile de 47 peças. |
| `chao-<era>-agua` | `chao/<era>/agua.png` | 2 colunas, durações `[30, 30]` |

`<era>` = `pedra` | `bronze` | `ferro`.

Recursos. Sumiço (toco, veio vazio, arbusto sem fruta) é outro sprite, não um filtro.

| Id | PNG | Quadro | Notas |
|---|---|---|---|
| `graveto` | `recursos/graveto.png` | 16×16 | Junta sem ferramenta. |
| `seixo` | `recursos/seixo.png` | 16×16 | Idem. |
| `arbusto` | `recursos/arbusto.png` | 32×32 | Com fruta. Rebrota. |
| `arbusto-vazio` | `recursos/arbusto-vazio.png` | 32×32 | |
| `arvore` | `recursos/arvore.png` | 48×64 | Pede machado. Não rebrota nesta versão. |
| `toco` | `recursos/toco.png` | 32×16 | Depois de cortada. |
| `rocha` | `recursos/rocha.png` | 32×32 | Pede machado. Some ao acabar (sem sprite extra). |
| `veio` | `recursos/veio.png` | 32×32 | Minério laranja. Pede machado. |
| `veio-vazio` | `recursos/veio-vazio.png` | 32×32 | |

Estações. “Bloqueada” no v0.1 é a mesma arte com alfa 0,4 — o código faz isso, não precisa de segundo desenho, exceto onde a tabela pede estado.

| Id | PNG | Quadro | Quadros |
|---|---|---|---|
| `toca` | `estacoes/toca.png` | 48×40 | 1 |
| `fogueira-apagada` | `estacoes/fogueira-apagada.png` | 32×32 | 1 |
| `fogueira-acesa` | `estacoes/fogueira-acesa.png` | 32×48 | 4 colunas, `[8,8,8,8]`. Chama para cima. |
| `pesquisa-bronze` | `estacoes/pesquisa-bronze.png` | 48×40 | 1 |
| `bancada` | `estacoes/bancada.png` | 48×40 | 1 |
| `fornalha-fria` | `estacoes/fornalha-fria.png` | 48×48 | 1 |
| `fornalha-acesa` | `estacoes/fornalha-acesa.png` | 48×48 | 2 colunas, `[12, 12]` |
| `canteiro` | `estacoes/canteiro.png` | 48×32 | 5 colunas = 0 a 4 frutas (`canteiroMax`) |
| `pesquisa-ferro` | `estacoes/pesquisa-ferro.png` | 48×40 | 1 |
| `ferramentas` | `estacoes/ferramentas.png` | 48×40 | 1 |
| `casinha-obra` | `estacoes/casinha-obra.png` | 64×64 | 1 |
| `casinha-pronta` | `estacoes/casinha-pronta.png` | 64×64 | 1, janela acesa |
| `farol-0` | `estacoes/farol-0.png` | 48×96 | Base, antes da primeira entrega |
| `farol-1` | `estacoes/farol-1.png` | 48×96 | Depois de 1 entrega (custo total 3) |
| `farol-2` | `estacoes/farol-2.png` | 48×96 | Depois de 2 |
| `farol-aceso` | `estacoes/farol-aceso.png` | 48×96 | 2 colunas, `[20, 20]`, lâmpada. O feixe continua sendo desenhado pelo código, como `desenharFeixe`. |

Ícones de UI, **16×16**, 1 quadro. Ficam dentro dos botões do kit (o botão em si não é sprite; continua ≥ 48 px, borda 2 px, Courier New).

| Id | PNG |
|---|---|
| `icone-madeira` | `ui/madeira.png` |
| `icone-pedra` | `ui/pedra.png` |
| `icone-minerio` | `ui/minerio.png` |
| `icone-fruta` | `ui/fruta.png` |
| `icone-barra` | `ui/barra.png` |
| `icone-fome` | `ui/fome.png` |
| `icone-calor` | `ui/calor.png` |
| `icone-dia` | `ui/dia.png` |
| `icone-noite` | `ui/noite.png` |
| `icone-seta` | `ui/seta.png` |

O contador **x/N** é texto (`contador()` em `regras.js`), não sprite.

### Manifesto

`_privado/jogos/planeta-do-samuel/arte/manifesto.json`

```json
{
  "versao": 1,
  "imagem": "atlas.webp",
  "grade": 16,
  "perspectiva": "3/4",
  "ticksPorSegundo": 60,
  "direcoes": [
    "baixo", "baixo-direita", "direita", "cima-direita",
    "cima", "cima-esquerda", "esquerda", "baixo-esquerda"
  ],
  "sprites": {
    "samuel-andar": {
      "origem": "atlas",
      "x": 0,
      "y": 0,
      "frameW": 32,
      "frameH": 48,
      "colunas": 4,
      "linhas": 8,
      "espelhoDaDireita": true,
      "duracoes": [4, 4, 4, 4],
      "loop": true,
      "pe": "base"
    },
    "chao-pedra-agua": {
      "origem": "atlas",
      "x": 0,
      "y": 384,
      "frameW": 16,
      "frameH": 16,
      "colunas": 2,
      "linhas": 1,
      "duracoes": [30, 30],
      "loop": true,
      "pe": "base"
    }
  }
}
```

- `x`, `y`: canto do primeiro quadro no atlas, em px.
- `origem`: `"atlas"` ou `"codigo"` (placeholder `fromStrings` enquanto o PNG não existe).
- `espelhoDaDireita`: o mestre só trouxe as linhas 0–4; as linhas 5–7 do atlas são o espelho das 3, 2 e 1.
- `pe`: `"base"` = pé no centro da borda de baixo (`footY = frameH / 2` na convenção de `sprites.ts`).
- Retângulo no atlas: largura `frameW * colunas`, altura `frameH * linhas`.
- O jogo acha o quadro assim: coluna `frameIndex`, linha `dir8`, recorte `(x + coluna * frameW, y + linha * frameH, frameW, frameH)`.

Os `x`/`y` do exemplo são ilustração. O empacotador preenche os números de verdade. O id é o contrato; a posição no atlas não é.

---

## 3. Riscos e dúvidas

1. **Licença.** Qualquer arquivo copiado leva o parágrafo MIT do Pedro Barretto. Nenhum byte de `public/assets/`, nenhum nome de Pokémon, nenhum grito. Placeholder desenhado em código com a paleta do kit, até o atlas existir.
2. **3/4 contra o v0.1.** O v0.1 é vista de cima com retângulo. O motor que o Boaz pediu é 3/4 com pé e 8 direções. A spec assume 3/4. Se a intenção for continuar de cima, as folhas de 8 linhas não servem e o `dir8` não se paga.
3. **Player 2.** O portal tem o cookie `samuel_perfil` (Samuel / Player 2). O v0.1 desenha só o Samuel, e um cão parado. A lista marca o Player 2 como opcional. O gato do kit não está no jogo; não entrou na lista.
4. **Esquerda espelhada.** Chapéu, bolso e machado na mão quebram no espelho. Se o Samuel carregar ferramenta, as 3 vistas esquerdas precisam ser desenhadas, não espelhadas (`espelhoDaDireita: false`).
5. **Era no chão.** A regra não muda o mapa na pesquisa. A spec pede três paletas para a era ser legível. É só troca de tile. Se não for desejado, uma paleta só reduz a lista a um terço do chão.
6. **Árvore não bloqueia.** Sort por `y` deixa o Samuel passar “por dentro” do tronco e aparecer na frente. Bloquear árvore e rocha muda `regras.js` e o save. Fora desta leva, salvo pedido.
7. **Joystick.** A matemática é a do Pokémon (analógico, flutuante). O controle na tela continua o quadrado do kit, porque o teste do tablet exige `#joystick` ≥ 48 px e o kit exige raio 0. Não levar o knob redondo.
8. **Noite.** `lightDisc` é pixel duro, diferente do gradiente do v0.1. Os raios (80 / 40 / 150) ficam os de `CONFIG`. Confirmar no tablet se a fogueira ainda “aquece” visualmente o bastante.
9. **PNG no ar.** Publicar o atlas em PNG arrisca o CDN borrar o pixel e a conferência aceitar (`≈`). Por isso o publicado é WebP sem perdas. Falta confirmar na prática que o hcdn não recodifica WebP de `/jogo/...` — se recodificar, o SHA quebra e aí o atlas fica em PNG com a conferência em modo `≈`, aceitando o risco visual.
10. **Testes.** `regras.test.js` não pode sentir a troca de arte. `tablet.test.js` exige, em 1024×768, os alvos `#joystick`, `#btnInteragir`, `#btnComer`, `#btnPausa`, `#btnTela`, `#chip-fruta`, todos ≥ 48 px, e `window.__planeta`. A v0.2 não remove esses ids.
11. **Build.** Não puxar Vite, Clerk nem PostHog “porque o Pokémon tem”. O jogo publicado continua módulo ES em `_privado/jogos/planeta-do-samuel/`.

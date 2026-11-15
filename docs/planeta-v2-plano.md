# Planeta do Samuel v0.2 — plano (escopo novo, 15/11 08:44 BRT)

Pedido do Boaz: o jogo pode seguir 100% a dinâmica do Pokémon Survivors, inclusive as batalhas. As batalhas são com monstros e acontecimentos da época. A regra “nenhum inimigo e nenhuma arma” **não vale mais**.

O plano abaixo é o desenho da v0.2. A publicação no catálogo (`_app/jogos.json`, `0.2.0`, `pronto`) e o merge do PR #8 são uma etapa seguinte. O deploy na Hostinger continua separado.

Licença: reescrever em JS os trechos MIT (Pedro Barretto, `desenvolvimento/jogos/pokemon-survivors/LICENSE`). Nenhum arquivo de `public/assets/`, nenhum nome, sprite, grito ou criatura de Pokémon. Aviso MIT no arquivo copiado e em `ORIGEM.md`. O `jogo.php` não importa a pasta do outro jogo.

Números novos ficam em `CONFIG`, marcados `PROPOSTA`. Os números velhos de fome, calor e custo x/N saem do laço (ver abaixo). O mapa da ilha (40×21 tiles de 16 px) continua o chão. A câmera, o joystick, o `dir8`, o pixel, a sombra, a ordenação por y, o chão em cache e a noite em pixel duro que a v0.2 já reescreveu continuam.

Formato de folha, igual ao plano anterior: PNG mestre em `desenvolvimento/jogos/planeta-do-samuel/arte/<arquivo>`. Coluna = quadro, linha = direção (`dir8`: baixo, baixo-direita, direita, cima-direita, cima; a esquerda é espelho). Pé na base. Sem espaço entre quadros. O publicado é WebP sem perdas via `npm run arte`. `origem: "codigo"` até o PNG existir.

fps abaixo é o que o olho vê. No manifesto, `duracoes` são ticks de 1/60: 15 fps = 4 ticks por quadro, 8 fps = 8 ticks, 4 fps = 15 ticks.

---

## (a) Laço

Uma partida só, no tablet. O Samuel anda (joystick + WASD). O ataque é automático. Inimigos nascem fora da tela, andam até ele e machucam no toque ou com um projétil telegrafado. Morrer solta XP. A barra enche, o mundo pausa, aparecem 3 cartas. No fim de cada era entra um chefe. Derrotar o chefe do Ferro acende o farol e a partida acaba.

O que reescrever, e o que não trazer:

| De lá | O que entra | O que não entra |
|---|---|---|
| `src/data/waves.ts` + `src/game/spawner.ts` | Estágio com `until`, `rate`, `max`. Evento `ring`, `swarm` e `boss` na hora `at`. Nasce fora da tela (`offscreen`, `spawnRing`, `spawnSwarm`, `spawnWaveBoss`). | Trio lendário, mítico, shiny, endless, co-op, tensão de ranking. A lista de eventos do Planeta é curta e fixa, não um elenco sorteado de dex. |
| `src/game/enemies.ts` + `src/game/horde.ts` | Inimigo com hp, raio, velocidade, xp. Comportamento `chase` e `flyby`. Elite = o mesmo bicho maior, no fim do estágio. | `radiusFor(dex)`, grade de centenas, runner de tipo Pokémon. Teto vivo baixo (proposta: 12 / 18 / 24). |
| `src/game/attacks.ts` + `src/game/combat.ts` | Golpe automático em volta do jogador: órbita, projétil, aura. Dano, acerto, morte, XP no chão. | A lista `MOVES`, tipos, status, evoluções de golpe, hitstop de ranking. Três armas, uma por era, no máximo 4 no loadout. |
| `src/game/pickups.ts` + `src/game/leveling.ts` | Gema de XP em 3 tamanhos (`xpTier`). `xpFor(nível)`, `gainXp`, pausa, `rollOffers` de 3 cartas, `applyOffer`. | Moeda, ovo, pokébola, shiny, berry como única saída, 6 golpes e 6 itens. |
| `src/game/bossFight.ts` | Chefe com barra de vida, fase ao cair de metade (anda mais e dispara mais), horda afina enquanto ele vive. | Padrão de golpe com nome de Pokémon, ultimate, disfarce, trio. Cada chefe tem 2 ataques: investida e círculo no chão. |
| `src/ui/screens.ts` `levelUp` + HUD da partida | Pausa, 3 cartas grandes, toque com guarda para o dedo do joystick não escolher sozinho (`TAP_GUARD_MS`). Barra de XP, nível, vida, relógio, ícones das armas. Botões ≥ 48 px. | Texto de golpe de Pokémon, reroll, banir, co-op, cinco línguas. Cartas em pt-BR, chrome do kit (papel, tinta, raio 0). O ícone da carta é sprite; a carta em si é HTML. |
| `src/engine/input.ts` + `src/render/joystick.ts` | Já reescrito. O quadrado do kit fica. | Botão redondo de golpe especial. Não há botão de atirar: o tiro é sozinho. |
| `src/game/game.ts` `step` | A ordem: andar, ondas, inimigos, golpes, coleta, level-up. | O arquivo inteiro. Conta, replay, `dmath`, Clerk, PostHog. |

Proposta de relógio (tudo `PROPOSTA`, em `CONFIG`):

| Era | Tempo | Nasce por segundo | Vivos no máximo | Chefe |
|---|---|---|---|---|
| Pedra | 0–90 s | 0,8 | 12 | no segundo 90 |
| Bronze | 90–180 s | 1,2 | 18 | no segundo 180 |
| Ferro | 180–270 s | 1,6 | 24 | no segundo 270 |
| Farol | depois do chefe do Ferro | 0 | 0 | vitória |

Um anel (`ring`) no meio de cada era. Um bando que cruza a tela (`swarm`) uma vez por era. São os “acontecimentos”.

**Coleta e crafting.** O x/N da v0.1 não cabe: a partida não para para entregar madeira. Sai do laço. O que fica é a gema de XP, que é a coleta. As três armas são o crafting com outro nome: a carta nova da Pedra é a lasca, a do Bronze é a lança, a do Ferro é a faísca. Não há estação, contador x/N nem inventário de barra.

**Noite e fogueira.** Fome e calor saem. A noite em pixel duro fica só na era do Ferro (o escuro do `lightDisc`). A fogueira, se a carta for escolhida, abre um disco de luz e um pouquinho de dano em volta. Não é estação.

**Farol.** Não é chefe e não tem custo. Quando o colosso cai, a horda some, o farol acende (sprite que já estava no plano) e a partida termina. O feixe continua desenhado em código.

**Fácil.** É o único modo. Vida em zero não acaba o jogo e não tira XP, nível, arma nem era. O Samuel volta ao centro da ilha com a vida cheia e fica intangível por `CONFIG.invulneravelSegundos` (proposta: 2). Sem tela de game over.

O `tests/tablet.test.js` de hoje cobra Interagir, Comer e os chips de recurso. A fase 2 troca esses alvos pela barra de XP, pelas cartas e pelo joystick, e reescreve o teste. Botões que restarem continuam ≥ 48 px.

---

## (b) Inimigos e chefes

Nomes de época, nenhum de Pokémon. Contato machuca. O acontecimento é a onda, não um bicho com cara.

**Pedra**

| Id | O que faz |
|---|---|
| `seixo-vivo` | Rola devagar até o Samuel. Redondo, sem direção. |
| `lobo-da-pedra` | Corre (`chase`). Machuca no toque. |
| `enxame` | Acontecimento `swarm`: mosquito cruza a tela e some. |
| `desmoronamento` | Acontecimento `ring`: pedras caem em círculo. Usa o sprite do seixo. |
| Chefe `urso-da-caverna` | Investe numa linha e bate o chão (círculo telegrafado). Aos 50% da vida, investe mais rápido. |

**Bronze**

| Id | O que faz |
|---|---|
| `guerreiro-de-bronze` | Anda e dá um bote curto telegrafado. |
| `escorpiao` | Anda de lado. O toque dói um pouco mais. |
| `chuva-de-lancas` | Acontecimento `swarm`: lanças atravessam a tela. Usa o projétil `lanca`. |
| `golem-de-barro` | Devagar, muita vida. |
| Chefe `sentinela-de-bronze` | Para e solta um anel de lanças. Aos 50%, o anel vem duas vezes. |

**Ferro**

| Id | O que faz |
|---|---|
| `soldado-de-ferro` | Anda. Machuca no toque. |
| `catapulta` | Fica parada fora do Samuel e solta `pedregulho`. |
| `faiscas-da-forja` | Acontecimento `ring`: faíscas em círculo. Usa `faisca`. |
| `lobo-de-ferro` | O lobo da Pedra, mais rápido. Mesmo desenho com a paleta do Ferro, outro id. |
| Chefe `colosso-de-ferro` | Investe e solta três pedregulhos. Aos 50%, os dois juntos. Ao cair, o farol acende. |

Armas automáticas do Samuel, uma liberada por era (carta “nova”):

| Id | Era | Como bate |
|---|---|---|
| `lasca` | Pedra | Três pedras giram em volta. |
| `lanca` | Bronze | Tiro na direção do inimigo mais perto. |
| `faisca` | Ferro | Aura curta. A carta da fogueira aumenta o raio e acende a luz. |

---

## (c) Ids novos para o Gerador

O Samuel andando e parado, o cão, o chão, o farol aceso/apagado e os ícones de UI que não são de combate continuam os do plano anterior. Abaixo só entra o que a batalha pede. Personagem baseado no Samuel, aprovado em 15/11: camiseta cinza mesclada `#8D9397`, bermuda cinza-clara `#C8CDCF`, tênis escuro `#3C454B` de sola branca `#FFFDF7`. Sem jaqueta laranja. Contorno `#193337`. Sem panda. Sem criatura de Pokémon.

PNG mestre: `desenvolvimento/jogos/planeta-do-samuel/arte/<caminho>`.

| Id | PNG mestre | Quadro | Quadros | Direções | fps |
|---|---|---|---|---|---|
| `seixo-vivo` | `inimigos/seixo-vivo.png` | 32×32 | 4, loop | 1 | 8 |
| `lobo-da-pedra` | `inimigos/lobo-da-pedra.png` | 32×32 | 4, loop | 8, espelho | 15 |
| `enxame` | `inimigos/enxame.png` | 16×16 | 2, loop | 1 | 8 |
| `urso-da-caverna` | `chefes/urso-da-caverna.png` | 64×64 | 4, loop | 8, espelho | 8 |
| `guerreiro-de-bronze` | `inimigos/guerreiro-de-bronze.png` | 32×48 | 4, loop | 8, espelho | 15 |
| `escorpiao` | `inimigos/escorpiao.png` | 32×32 | 4, loop | 8, espelho | 8 |
| `golem-de-barro` | `inimigos/golem-de-barro.png` | 48×48 | 4, loop | 4 (baixo, direita, cima, esquerda=espelho) | 8 |
| `sentinela-de-bronze` | `chefes/sentinela-de-bronze.png` | 48×64 | 4, loop | 8, espelho | 8 |
| `soldado-de-ferro` | `inimigos/soldado-de-ferro.png` | 32×48 | 4, loop | 8, espelho | 15 |
| `catapulta` | `inimigos/catapulta.png` | 48×32 | 2, loop | 4, espelho da esquerda | 4 |
| `lobo-de-ferro` | `inimigos/lobo-de-ferro.png` | 32×32 | 4, loop | 8, espelho | 15 |
| `colosso-de-ferro` | `chefes/colosso-de-ferro.png` | 64×80 | 4, loop | 4, espelho da esquerda | 8 |
| `lasca` | `ataques/lasca.png` | 16×16 | 2, loop | 1 | 8 |
| `lanca` | `ataques/lanca.png` | 16×16 | 1 | 1 (o código aponta) | — |
| `faisca` | `ataques/faisca.png` | 16×16 | 4, loop | 1 | 15 |
| `pedregulho` | `ataques/pedregulho.png` | 16×16 | 1 | 1 | — |
| `telegraph` | `ataques/telegraph.png` | 32×32 | 2, loop | 1 | 4 |
| `acerto` | `efeitos/acerto.png` | 32×32 | 2, sem loop | 1 | 15 |
| `morte` | `efeitos/morte.png` | 32×32 | 4, sem loop | 1 | 15 |
| `xp-brilho` | `efeitos/xp-brilho.png` | 16×16 | 2, loop | 1 | 8 |
| `levelup` | `efeitos/levelup.png` | 48×48 | 4, sem loop | 1 | 8 |
| `xp-1` | `coleta/xp-1.png` | 16×16 | 2, loop | 1 | 4 |
| `xp-2` | `coleta/xp-2.png` | 16×16 | 2, loop | 1 | 4 |
| `xp-3` | `coleta/xp-3.png` | 16×16 | 2, loop | 1 | 4 |
| `icone-lasca` | `ui/lasca.png` | 32×32 | 1 | 1 | — |
| `icone-lanca` | `ui/lanca.png` | 32×32 | 1 | 1 | — |
| `icone-faisca` | `ui/faisca.png` | 32×32 | 1 | 1 | — |
| `icone-fogueira-carta` | `ui/fogueira-carta.png` | 32×32 | 1 | 1 | — |
| `icone-vida` | `ui/vida.png` | 16×16 | 1 | 1 | — |
| `carta-upgrade` | `ui/carta-upgrade.png` | 64×80 | 1 | 1 | — |
| `mamute` | `inimigos/mamute.png` | 48×48 | 4, loop | 4, espelho da esquerda | 8 |
| `caranguejo-gigante` | `inimigos/caranguejo-gigante.png` | 48×32 | 4, loop | 4, espelho da esquerda | 8 |
| `robo-enferrujado` | `inimigos/robo-enferrujado.png` | 32×48 | 4, loop | 8, espelho | 8 |
| `meteoro` | `ataques/meteoro.png` | 16×16 | 2, loop | 1 | 8 |
| `enchente` | `ataques/enchente.png` | 96×64 | 1 | 1 | — |
| `tempestade-de-raios` | `ataques/tempestade-de-raios.png` | 96×64 | 1 | 1 | — |

`carta-upgrade` é o miolo ilustrado da carta (a moldura, o texto e o botão são HTML do kit, ≥ 48 px). `telegraph` é o círculo no chão antes da investida, do meteoro e do raio. A chuva de meteoros substitui o desmoronamento. `chuva-de-lancas` e `faiscas-da-forja` não têm sprite próprio: usam `lanca` e `faisca`.

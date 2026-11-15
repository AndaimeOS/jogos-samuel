# Arte final do Gerador

Os PNG desta pasta são as folhas do pacote `final/` (validador 51/51, mais o farol).
O `manifesto.json` daqui é o do Gerador, sem as entradas `-backup`.
`npm run arte` lê o manifesto do jogo (`_privado/jogos/planeta-do-samuel/arte/manifesto.json`),
espelha a esquerda quando o mestre tem 5 linhas (8 direções) ou 3 linhas (4 direções)
e grava o `atlas.webp`.

Não entram no atlas nem no commit: `sentinela-de-bronze-backup`, `colosso-de-ferro-backup`,
`_src/`, prévias e a folha de conferência.

| Id | PNG | Nota |
|---|---|---|
| `samuel-parado` / `samuel-andar` | `samuel/idle.png`, `samuel/walk.png` | 5 linhas; o empacotador espelha a esquerda. Pivô (16, 47) |
| inimigos e chefes de 8 direções | o PNG do mesmo nome | mestre com baixo, baixo-direita, direita, cima-direita, cima |
| `sentinela-de-bronze` | `chefes/sentinela-de-bronze_v2.png` | a folha antiga fica de fora |
| `colosso-de-ferro` | `chefes/colosso-de-ferro_v2.png` | 3 linhas (baixo, direita, cima); a esquerda é espelho |
| `golem-de-barro`, `catapulta` | os PNG do mesmo nome | também 4 direções, mestre com 3 linhas |
| `mamute`, `caranguejo-gigante`, `robo-enferrujado` | `alternativas/inimigos/` | 1 direção |
| `meteoro`, `meteoro-impacto`, `enchente`, `enchente-telegraph`, `raio`, `raio-telegraph` | `alternativas/eventos/` | 1 direção |
| `lanca` | `ataques/lanca.png` | desenhada para a direita; o jogo gira pelo ângulo do tiro |
| `xp-1`, `xp-2`, `xp-3`, `levelup` | `coleta/` e `efeitos/levelup.png` | pé na base; o desenho flutua dentro do quadro. Pivô respeitado |
| `farol-0`, `farol-1`, `farol-2`, `farol-aceso` | `estacoes/` | 48×96, pivô (24, 95). O aceso alterna 2 quadros de 20 ticks. O feixe continua no código |
| chão das três idades | `chao/<era>/` | tile 16×16, pivô (8, 15) |

Continuam placeholder (sem PNG): o cão, as estações antigas de coleta e os ícones de recurso que não entram no laço de batalha.

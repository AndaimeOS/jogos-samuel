# Mapeamento da arte proposta do Gerador

A pasta `origem/gerador/` guarda só os PNG usados (sem `4x/`, sem `_src/brutos` e sem prévias).
`node montar-mestres.mjs` monta as folhas no tamanho do manifesto. `npm run arte` gera
`_privado/jogos/planeta-do-samuel/arte/atlas.webp`.

Quando `/final/` chegar com folhas já no tamanho de cada `arquivo` do manifesto, substitua
esses PNG e rode de novo `npm run arte`. Não precisa mudar código.

Nesta proposta o Gerador desenhou uma direção (ou uma pose). A folha repete esse quadro
nas outras linhas. A esquerda continua espelho. Andar do Samuel repete a pose parada
em 4 quadros, até existir animação de passo.

| Id do jogo | PNG do Gerador | O que a folha faz |
|---|---|---|
| `samuel-parado` | `samuel/parado_frente.png`, `parado_lado.png`, `parado_costas.png` | 5 linhas (frente, frente, lado, lado, costas); o empacotador espelha a esquerda |
| `samuel-andar` | as mesmas três poses | igual, com o quadro repetido 4 vezes |
| `seixo-vivo` | `batalha/inimigos/seixo-vivo.png` | já é a folha (4 quadros) |
| `enxame` | `batalha/inimigos/enxame.png` | já é a folha (2 quadros) |
| `lobo-da-pedra` | `batalha/inimigos/lobo-da-pedra.png` | a faixa de 4 quadros repetida nas 5 linhas |
| `urso-da-caverna` | `ideias/pedra/urso-da-caverna.png` | um quadro repetido |
| `guerreiro-de-bronze` | `ideias/bronze/guerreiro-de-bronze_v2.png` | um quadro repetido |
| `escorpiao` | `ideias/bronze/escorpiao.png` | um quadro repetido |
| `golem-de-barro` | `ideias/bronze/golem-de-barro.png` | um quadro repetido |
| `sentinela-de-bronze` | `ideias/bronze/sentinela-de-bronze.png` | um quadro repetido |
| `soldado-de-ferro` | `ideias/ferro/soldado-de-ferro_v2.png` | um quadro repetido |
| `catapulta` | `ideias/ferro/catapulta.png` | um quadro repetido |
| `lobo-de-ferro` | `ideias/ferro/lobo-de-ferro.png` | um quadro repetido |
| `colosso-de-ferro` | `ideias/ferro/colosso-de-ferro.png` | um quadro repetido |
| `mamute` | `ideias/pedra/mamute-de-la.png` | um quadro repetido |
| `caranguejo-gigante` | `ideias/bronze/caranguejo-gigante.png` | um quadro repetido |
| `robo-enferrujado` | `ideias/ferro/robo-enferrujado.png` | um quadro repetido |
| `lasca` | `batalha/ataques/lasca.png` | já é a folha |
| `telegraph` | `batalha/ataques/telegraph.png` | já é a folha |
| `meteoro` | primeiro quadro de `batalha/inimigos/seixo-vivo.png`, reduzido | a chuva do Gerador mostra esse seixo caindo |
| `enchente` | `ideias/bronze/enchente.png` | cena de área, 1 quadro |
| `tempestade-de-raios` | `ideias/ferro/tempestade-de-raios.png` | cena de área, 1 quadro |
| `acerto` | `batalha/efeitos/acerto.png` | já é a folha |
| `morte` | `batalha/efeitos/morte.png` | já é a folha |
| `xp-1` `xp-2` `xp-3` | `batalha/coleta/` | já são as folhas |
| `icone-lasca` | `batalha/ui/lasca.png` | 1 quadro |
| `icone-vida` | `batalha/ui/vida.png` | 1 quadro |
| `chao-pedra-grama` | 1º tile de `batalha/chao/campo-pedra.png` | 16×16 |
| `chao-pedra-grama-var` | 3º tile de `batalha/chao/campo-pedra.png` | 16×16 |

Continuam placeholder (sem PNG mestre): `lanca`, `faisca`, `pedregulho`, `xp-brilho`, `levelup`, `icone-lanca`, `icone-faisca`, `icone-fogueira-carta`, `carta-upgrade`, o cão, o farol, o chão do Bronze e do Ferro, e as estações antigas que não entram mais no laço.

# Pokémon Survivors no samuel.tech

Fan game de Pedro Barretto, encaixado no portal. A jogabilidade é a do original (código MIT). Os sprites e retratos são os de `public/assets/`, licença CC BY-NC 4.0, e **não podem ser reaproveitados por outros jogos**.

## Créditos

- Código: MIT, Copyright (c) 2026 Pedro Barretto. https://github.com/pedrobarretto/pokemon-survivors
- Sprites e retratos: [PMD SpriteCollab](https://sprites.pmdcollab.org), [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Artistas em `CREDITS.md`. Texto da licença em `LICENCA-CC-BY-NC.md`.
- Gritos: PokéAPI (ver `CREDITS.md` do original, seção de áudio, quando houver).
- Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc.

O mesmo crédito aparece no menu do jogo (rodapé) e em Ajustes → Sobre.

## Controles

Iguais aos do original:

| Ação | Teclado | Toque |
| --- | --- | --- |
| Mover | WASD ou setas | Arrastar (joystick) |
| Especial | Espaço | Botão redondo, embaixo à direita |
| Mega Evolução | E | Botão MEGA |
| Investida | Shift | Botão à esquerda do especial |
| Pausa | Esc ou P | Botão no alto à direita |
| Carta de upgrade | 1, 2 ou 3 | Toque na carta |
| Voltar aos jogos do portal | — | link «← Jogos» no menu (`/jogos/`, `target=_top`) |

## Configuração

Os números da partida (spawn, XP, chefes, duração de 15 minutos, evoluções nos níveis 12 e 28) continuam nos módulos do jogo, em especial `src/data/waves.ts`, `src/game/leveling.ts` e `src/game/difficulty.ts`. Não há um segundo arquivo de balanceamento: mudar o original mudaria a partida.

Atalhos só para captura de tela, sem efeito numa partida normal:

- `?samuel=cartas` abre as cartas de upgrade no começo da partida
- `?samuel=chefe` traz o Onix

Contas, ranking online, co-op, Arena em fila e Poké Realm precisam dos servidores do projeto original. Neste pacote estático eles ficam desligados (sem chave e sem API). A partida solo, a escolha do parceiro por região, a horda, o XP, as cartas, a evolução, o cronômetro e os chefes funcionam no navegador.

O pacote publicado não inclui o rastreador do projeto original: o portal não aceita isso. No código-fonte o módulo continua, para os testes; o build troca por `src/portal/sem-analytics.ts`.

## Como empacotar

Na pasta do jogo:

```bash
npm install
npm test
npm run build
```

`npm run build` gera o site estático em `_privado/jogos/pokemon-survivors/` (`base: './'`, sem CDN). Os milhares de arquivos de `public/assets/pokemon/` viram um `.bin` por espécie em `packs/`, e `sw.js` devolve o caminho original. O limite do porteiro é 3000 arquivos.

Depois, na raiz do repositório:

```bash
python3 ferramentas/verificar_jogo.py pokemon-survivors
python3 ferramentas/verificar_jogo.py --todos
```

O jogo entra em `_app/jogos.json` com status `pronto` (público, como os outros). A capa do catálogo é `assets/img/pokemon-survivors.webp` (desenho simples, sem sprite de terceiro).

## O que não vai para outros jogos

Tudo em `public/assets/` e no pacote publicado deste slug. O kit comum do portal (`desenvolvimento/compartilhado/`) não recebe estes arquivos.

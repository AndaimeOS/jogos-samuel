# Pebolim — origem do código

| Campo | Valor |
|---|---|
| Repositório | https://github.com/pea1bee/football-game |
| Commit | `08a68b730c5ab99c33a5ea52e8a36e49414dce51` |
| Licença | MIT — Copyright (c) 2015 Prashant Baid |
| Biblioteca | SAT.js 0.5.0, MIT — Copyright (C) 2012–2015 Jim Riecken — https://github.com/jriecken/sat-js |
| Fora de uso | pixelfoosball (sem licença) e WebGL-Foosball (GPL) não entram |

Os dois avisos completos estão em `LICENSE` (esta pasta) e em
`_privado/jogos/pebolim/LICENSE.txt` (o que o site entrega).

## Cópia de referência (`upstream-football-game/`)

`football.js`, `SAT.js`, `index.html`, `style.css`, `LICENSE` e `README.md`
do commit acima, sem alterações. As imagens do original ficaram de fora:
os bonecos vermelho e listrado de preto e branco acompanham os nomes
Juventus e Liverpool do placar original. O jogo publicado troca isso pelos
times Vermelho e Azul, desenhados em código, sem escudo e sem marca.

## O que foi copiado e o que mudou

- `SAT.js` entra inteiro em `_privado/jogos/pebolim/js/SAT.js`.
- A mesa, as barras e a colisão bola × caixa (`SAT.Box`, `SAT.Circle`,
  `SAT.testPolygonCircle`) vêm da ideia do `football.js`, reescritas para a
  mesa deitada.
- Nomes de clube e qualquer escudo ou marca real não aparecem no jogo publicado.
- Números de jogo (gol, bola, computador, tempo, gols) ficam só em
  `_privado/jogos/pebolim/js/config.js`. São provisórios.

# Pebolim

Mesa de pebolim na horizontal, para o samuel.tech. Nome **provisório**.
A arte também é provisória: bonecos em código, times **Vermelho** e **Azul**.

O Vermelho defende o gol da esquerda e ataca para a direita. O Azul faz o contrário.
As barras de um time andam juntas.

## Onde está cada coisa

| | |
|---|---|
| Fonte jogável | `_privado/jogos/<slug>/` com slug `pebolim` (sem build; o porteiro entrega esta pasta) |
| Números provisórios | `_privado/jogos/pebolim/js/config.js` |
| Testes | `npm test` nesta pasta (vitest) |
| Licenças | `LICENSE` aqui e `_privado/jogos/pebolim/LICENSE.txt` no ar |

Para abrir direto: sirva `_privado/jogos/pebolim/`. Pelo portal, `/jogar/?jogo=pebolim`
e os arquivos em `/jogo/pebolim/`. `?cena=menu`, `?cena=partida`, `?cena=gol` ou
`?cena=fim` abre essa tela (útil para captura). `window.__pebolim` expõe o estado,
no mesmo espírito dos outros jogos do repositório.

## Controles

Toque, no estilo Taca Taca: **arrastar na sua metade da tela** move as barras do
seu time juntas. **Tocar** (sem arrastar) chuta. Os dois dedos funcionam ao mesmo
tempo no modo de 2 jogadores: esquerda é o Vermelho, direita é o Azul.

No modo de 1 jogador, a metade esquerda é a sua (Vermelho). A metade direita é
o computador.

Teclado, no computador:

| | Mover as barras | Chutar |
|---|---|---|
| 1 jogador (Vermelho) | ↑ ↓, ou W S, ou A D | Espaço, F ou Enter |
| 2 jogadores, Vermelho (esquerda) | W S ou A D | Espaço ou F |
| 2 jogadores, Azul (direita) | ↑ ↓ | Enter ou L |

P ou Esc pausa. A mesa cabe na tela sem esticar: o canvas usa `object-fit: contain`.
Se o aparelho estiver em pé, um aviso pede para deitar.

## Modos

- **1 jogador:** contra o computador (Azul).
- **2 jogadores:** no mesmo tablet, cada um na sua metade, com multitoque.
- **Fácil:** computador mais lento e com mais erros, bola mais lenta (teto menor,
  chute e reposição mais fracos, a bola perde velocidade mais depressa) e gol maior.
- **Normal:** os números cheios do `config.js`.

A partida acaba em **5 gols** ou em **2 minutos**. O fim é uma festa simples
(“venceu”, “empate”, “que partida boa”). Não há punição, ranking nem texto de derrota.

Depois de cada gol que não encerra a partida, a seta mostra para que lado a bola
vai sair e o botão grande **Recomeçar** solta a bola. O placar continua.
Quem sofreu o gol repõe: a bola sai na direção do gol de quem marcou.

Se a bola ficar parada ou quase parada uns segundos (no poste, no canto ou no
meio do campo), ela volta para o meio. Os tempos e a folga estão em `config.js`
(`segundosParada`, `janelaParada`, `deslocamentoMinimo`, `velQuaseParada`).

## Números provisórios

Tudo que muda o jogo está em `_privado/jogos/pebolim/js/config.js`.

| | Fácil | Normal |
|---|---|---|
| Abertura do gol | 250 | 164 |
| Teto da bola | 440 | 760 |
| Força do chute | 380 | 640 |
| Reposição | 120 | 200 |
| Amortecimento da bola | 1,2 | 0,62 |
| Velocidade do computador | 110 | 360 |
| Chance de erro do computador | 0,62 | 0,08 |
| Pausa do erro | 0,75 s | 0,12 s |
| Gols para acabar | 5 | 5 |
| Tempo | 120 s | 120 s |
| Bola quase parada volta ao meio | 2,5 s | 2,5 s |

Mesa lógica: 1000 × 560, mais uma moldura de 36. A tela só escala essa proporção.

## Créditos e licenças

- Base: [football-game](https://github.com/pea1bee/football-game), MIT,
  Copyright (c) 2015 Prashant Baid. Commit `08a68b730c5ab99c33a5ea52e8a36e49414dce51`.
  A cópia de referência está em `upstream-football-game/`. O `SAT.js` foi copiado
  por inteiro. A mesa foi reescrita na horizontal (toque, dois modos, Fácil de
  verdade, bola que não trava, seta depois do gol).
- Colisão: [SAT.js](https://github.com/jriecken/sat-js) 0.5.0, MIT,
  Copyright (C) 2012–2015 Jim Riecken.
- Os dois textos de licença, completos, estão em [`LICENSE`](LICENSE).
- Não entra código do pixelfoosball (sem licença) nem do WebGL-Foosball (GPL).
- Os nomes Juventus e Liverpool, e os bonecos de uniforme de clube do original,
  não são usados. Os times daqui são Vermelho e Azul.

## Testes

```bash
cd desenvolvimento/jogos/pebolim
npm test
```

O teste da bola que destrava está em `tests/destravar.test.js`: canto, trave,
bola presa dentro da trave, bola em movimento e contagem que zera quando ela anda de novo.

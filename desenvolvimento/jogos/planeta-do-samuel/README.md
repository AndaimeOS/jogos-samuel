# Planeta do Samuel

Proposta 0.2. O arquivo que roda é `_privado/jogos/planeta-do-samuel/index.html`.
Os números ajustáveis ficam em `CONFIG`, dentro de `regras.js`, todos marcados como **PROPOSTA**.

Vista 3/4, em pixel, pensada para o tablet deitado. O ataque é automático.
Três idades (Pedra, Bronze e Ferro), cada uma com horda e um chefe, até acender o farol.
A gema de XP sobe o nível e abre 3 cartas. A noite em pixel duro é a era do Ferro.
A fogueira, se escolhida, ilumina. No Fácil não há derrota: no zero da vida, o Samuel
volta ao centro e não perde progresso.

## Testes

```bash
cd desenvolvimento/jogos/planeta-do-samuel
npm test
python3 ferramentas/verificar_jogo.py --todos
```

`window.__planeta` existe para o robô de teste. Não aparece em botão nenhum.

## Trocar o placeholder pelo atlas

A arte que roda hoje é desenhada em código (`_privado/jogos/planeta-do-samuel/motor/placeholders.js`), com os ids de `arte/manifesto.json` (`origem: "codigo"`). O jogo também lê `origem: "atlas"`: recorta `arte/atlas.webp` pelo `x`, `y`, `frameW` e `frameH`.

1. O PNG mestre fica no caminho `arquivo` do manifesto do jogo, dentro de `desenvolvimento/jogos/planeta-do-samuel/arte/`. A arte final do Gerador já está aí; o mapa dos nomes está em `arte/MAPEAMENTO.md`.
2. A largura tem de ser `frameW × colunas`. A altura, `frameH × linhas` do atlas, ou menos quando o empacotador espelha: 5 linhas viram 8, e 3 linhas (baixo, direita, cima) viram 4.
3. Na pasta deste README: `npm run arte`. Isso gera `_privado/jogos/planeta-do-samuel/arte/atlas.webp` (WebP sem perdas) e grava `origem: "atlas"` com `x` e `y`. Trocar o PNG e rodar de novo basta.
4. Sprite sem PNG continua `codigo`. Apagar o PNG e rodar de novo devolve esse id ao placeholder e, se não sobrar nenhum, apaga o atlas.
5. Confira no tablet: `npm test`. O contador x/N, a noite e o farol não dependem do arquivo de arte.

## Números provisórios

Ficam em `CONFIG`, dentro de `regras.js`. O save usa `schemaVersion` 1 e a chave `planeta-do-samuel:save`.

| Constante | Valor | O que faz |
|---|---:|---|
| velocidade | 72 px/s | passo normal |
| fatorLentidao | 0,4 | quando fome ou calor chegam a zero |
| fomePorSegundo / calorPorSegundo | 0,45 / 0,28 | descida devagar |
| frioNoiteExtra | 0,55 | a mais, no pico da noite, longe do fogo |
| duracaoDia | 90 s | um dia inteiro |
| noite | 0,62–0,90 | a tela só escurece |
| raioFogueira | 80 px | luz e calor |

Não há som, nem segundo modo, nem inimigo. Árvore, rocha e veio pedem o machado de pedra. A fornalha troca 1 minério por 1 barra na hora. O arbusto de fruta rebrota; a árvore, nesta proposta, não.

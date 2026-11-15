# Planeta do Samuel

Proposta 0.1.0. O arquivo que roda é `_privado/jogos/planeta-do-samuel/index.html`.
Os números ajustáveis ficam em `regras.js`, todos marcados como **PROPOSTA**.

Vista de cima, em pixel, pensada para o tablet deitado. Três idades (Pedra, Bronze
e Ferro) até acender o farol. Juntar, entregar nas estações (contador x/N) e
pesquisar a idade seguinte. A noite só escurece. A fogueira aquece e ilumina.
Fome e calor descem devagar. No Fácil não há derrota: no zero, o passo só fica lento.
Setas apontam o próximo passo.

## Testes

```bash
cd desenvolvimento/jogos/planeta-do-samuel
npm test
python3 ferramentas/verificar_jogo.py --todos
```

`window.__planeta` existe para o robô de teste. Não aparece em botão nenhum.

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

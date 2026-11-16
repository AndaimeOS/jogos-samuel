# Origem — Samuel Surfers

Revisão feita em 15/11/2026, antes de copiar qualquer arquivo para o jogo publicado.
Fonte: [frankstop/MetroDash](https://github.com/frankstop/MetroDash), commit
`e2db18bf511acf94478d0044f070efbcc55059b5` (15/07/2026, “Merge pull request #1 from frankstop/feat/embed-analytics”).
A cópia de referência do código (sem as PNG) está em `upstream-metrodash/`.

## Licença

O `LICENSE` da raiz é MIT, Copyright (c) 2026 Frank Valdez. Permite uso comercial
desde que o aviso vá junto. Ele está em `public/LICENSE.txt` (e no pacote publicado).

| Arquivo | O que é | Licença | Decisão |
|---|---|---|---|
| `src/**/*.ts` | código do jogo | MIT | adaptado; o aviso fica no `LICENSE.txt` |
| `public/assets/metro-dash-menu.png` | 1672×941, 1,7 MB, sem metadado | só o MIT da raiz, sem crédito próprio | não copiado |
| `metro-dash-world.png` | 1672×941, 2,3 MB | idem | não copiado |
| `metro-dash-concept.png` | 1672×941, 2,1 MB | idem | não copiado |
| `rook-sprites.png` | 1774×887, 743 KB | idem | não copiado |
| `rook-sprites-source.png` | 1774×887, 1,4 MB | idem | não copiado |
| `icons/metro-mark.svg` e a máscara | marca da demo | idem | não copiado |
| modelos glTF / fontes / mp3 | não existem no repositório | — | — |
| sons | osciladores do Web Audio, sem arquivo | código MIT | melodia reescrita; não há faixa de terceiro |

Na dúvida, a arte da demo saiu. As folhas pixel que o jogo conhece são do Gerador
(originais, uso comercial). Os modelos 3D também.

## Dependências

O lock do MetroDash pedia, na época da revisão:

- produção: `three` 0.180.0 (MIT). `npm audit --omit=dev`: 0 avisos.
- desenvolvimento: TypeScript 5.9.3, Vite 7.3.6, vite-plugin-pwa 1.3.0, Vitest 3.2.6,
  Workbox 7.4.1. O audit completo dessa árvore apontou avisos altos e críticos
  (Vite 7, Vitest, Workbox). Nada disso vai para o site.

Este jogo não usa aquele lock. O runtime é o **three 0.170.0**, o mesmo do Minigolfe,
vendido dentro do bundle (sem CDN). `npm audit --omit=dev` desta pasta: 0 avisos.
Vite 6.4.5 e Vitest 3.2.7 ficam só na máquina de build, como nos outros jogos com build.

## Peso

O código-fonte do MetroDash tem cerca de 136 KB. As cinco PNG somam 8,3 MB e não entram.
O pacote publicado leva o three.js (~142 KB gzip) e o pedaço dos modelos (~6 KB gzip).
Sem service worker.

## O que saiu

- O `<script src="https://frankiejvaldez.com/assets/js/embed-analytics.js">` do `index.html`
  (entrou no commit do analytics). Não há outro `gtag` no TypeScript.
- PWA, Workbox e `registerSW`.
- Loja, cosméticos, guarda e missões em inglês.
- As PNG do Rook e do menu.

## O que a v1 usa do código

Passo fixo, três faixas, pulo, rolagem, moedas, ímã, prancha e trechos de pista.
O modo Fácil não existe lá: aqui a batida só faz tropeçar e perder velocidade.
No Normal, a primeira batida encerra (a demo dava um tropeço grátis e falava em guarda).

Cabe num portal estático: o Vite gera os arquivos em `_privado/jogos/samuel-surfers/`
com `base: './'`. Não há build na hospedagem.

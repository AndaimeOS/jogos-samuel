---
name: survivors-like
description: >
  Construir um jogo de horda no estilo survivors-like (gênero bullet-heaven/horde survival):
  andar com um botão só, armas que atacam sozinhas, hordas crescentes, gemas de XP com ímã,
  subir de nível escolhendo 1 de 3 melhorias, classes, progressão permanente entre partidas
  e, depois, PvP. Inclui estrutura de dados, curva de ondas, desempenho com centenas de
  inimigos e a versão infantil. Use quando o pedido falar de survivors-like, horda, bullet
  heaven, auto-ataque, escolher upgrade ao subir de nível, classes, meta-progressão ou PvP
  nesse estilo.
---

# Survivors-like

Gênero de partidas de 10–20 min: o jogador só se move, as armas disparam sozinhas, a horda
cresce até ficar impossível, e a graça é **montar uma combinação de armas e melhorias** que
aguenta mais tempo. Faça um jogo original: tema, armas, classes e nomes próprios; o gênero é
livre, cópia de um jogo específico não é.

## Loop central

```text
mover → armas disparam sozinhas → inimigos morrem → soltam gemas de XP
→ ímã puxa gemas → barra de XP enche → pausa e escolhe 1 de 3 melhorias → repete
a cada minuto: nova onda (mais inimigos, novos tipos); ao morrer: moeda permanente → loja
```

Os 5 sentimentos que o jogo precisa entregar: poder crescendo, tela cheia de inimigos,
escolhas que importam, "quase morri" e "só mais uma partida".

## Estrutura de dados

```js
// Armas e melhorias são DADOS; o código só interpreta.
const WEAPONS = {
  orbita: { name: 'Lâminas', max: 5, base: { dmg: 8, cd: 0, count: 2, radius: 70, speed: 3 },
            perLevel: lv => ({ count: 1 + lv, dmg: 8 + lv * 3 }) },
};
const PASSIVES = { forca: { name: 'Força', max: 5, apply: (st, lv) => st.dmgMul = 1 + 0.1 * lv } };
// Estado do jogador derivado: base da classe × permanentes × passivas da partida.
```

- `player.weapons = [{ id, lv, t }]` (máx. 4–6) e `player.passives = { id: lv }`.
- Estatísticas finais recalculadas numa função (`recalcStats`) sempre que algo muda; nunca
  some bônus "na mão" espalhado pelo código.
- Oferta de nível: sorteie 3 de (armas não maximizadas + passivas não maximizadas + armas
  novas se houver vaga), com peso maior para o que o jogador já tem. Se não houver nada,
  ofereça cura ou moedas.

## Ondas e dificuldade

- Tabela por minuto: `{ min: 0, types: ['lodo'], rate: 1.2, cap: 60 }`, interpolando taxa e
  teto. Novos tipos entram um de cada vez (rápido-fraco, lento-tanque, à distância).
- Spawn num anel fora da tela (raio = meia diagonal + margem), nunca em cima do jogador.
- Eventos: cerco em círculo, enxame em linha, minichefe a cada 3–5 min com baú (arma
  evoluída ou várias melhorias).
- Vida dos inimigos sobe com o tempo (`hp × (1 + min × 0.25)`) para acompanhar o poder.

## Desempenho (centenas de inimigos)

- **Grade espacial** (`cell = 64`) reconstruída a cada quadro para separação entre inimigos
  e para acertos de armas; nunca O(n²) entre todos.
- Arrays de structs simples e remoção por "swap-pop"; sem criar objetos por quadro no laço
  quente. Teto de inimigos (~400 no celular) e de gemas (funda gemas antigas numa grande).
- Desenhe só o que está na tela; sprites como formas simples ou emoji pré-renderizados em
  canvas fora da tela (`OffscreenCanvas`/`<canvas>` em cache), não `fillText` por inimigo.
- Números de dano agrupados ou limitados (≤ 60 na tela).
- Ver `performance-optimization` e `receitas-canvas.md` (passo fixo).

## Sensação (game-feel)

Inimigo pisca branco ao levar dano e recua um pouco; morte com partículas; gema faz
"plim" com tom subindo em sequência; level-up congela, brilha e toca acorde; dano no
jogador treme a tela e dá ~0,5 s de invencibilidade piscando.

## Controles

- Teclado: WASD/setas. Toque: joystick virtual que aparece onde o dedo encosta.
- Escolha de melhoria: clique/toque nas cartas ou teclas 1–3.
- Nada de mirar: armas escolhem alvo sozinhas (mais próximo, direção do movimento, área).

## Progressão permanente e classes

- Moeda ganha ao morrer (por tempo + abates). Loja com 5–8 atributos e custo crescente
  (`custo = base × (nível + 1)`), salva com versão (`save-systems`).
- Classe = arma inicial + bônus de atributo. 3–4 classes com estilos distintos (corpo a corpo
  em órbita, projétil teleguiado, perfurante em linha, área).

## PvP (depois do single player estar divertido)

Modelos possíveis: duelo em arena com hordas neutras que alimentam os dois; ou "envie a
horda" (abater inimigos manda inimigos para o rival). Requer simulação pura e ações por
jogador (ver `multiplayer-familia` → Etapa 0); comece em tela dividida/local.

## Versão infantil (Samuel)

Aplicar `design-infantil`: inimigos fofos/engraçados (sem sangue), partida de 3–5 min com
"Você venceu!" ao sobreviver, menos inimigos e mais lentos, vida que se recupera com
coletáveis, cartas de melhoria com ícone grande e uma palavra, sem tela de atributos
complexa (só 3 compras com ícones). Reescrever no formato da casa a partir do aprendizado do
protótipo; não mover o código do lab.

## Skills relacionadas

`game-feel`, `game-ai` (perseguição/separação), `performance-optimization`, `roguelike`
(tabelas de sorteio), `rpg` (atributos e classes), `save-systems`, `camera-systems`,
`input-systems`, `level-design` (curva de ondas), `multiplayer-familia`.

---
name: jogos-samuel
description: >
  Padrão da casa para criar, alterar e polir os jogos do Samuel (7 anos) neste repositório:
  jogo web em um único index.html com canvas e JavaScript puro, telas de início/pausa/fim,
  toque + teclado, som sintetizado, recorde salvo e cartão na página inicial. Também é o
  roteador que diz quais outras skills carregar. Use sempre que o pedido for um jogo novo,
  uma mudança em um jogo existente (dragoes-e-blocos e os próximos), uma ideia de jogo do
  Samuel, "deixa mais divertido", fases, chefões, sons, pontuação ou multiplayer.
---

# Jogos do Samuel

O público é uma criança de 7 anos que joga no celular, no tablet e no computador, em
português. O objetivo de cada jogo é ser **divertido em 10 segundos, sem explicação**. Esta
skill fixa o formato técnico da casa e manda carregar as skills de apoio certas.

## Antes de escrever código

1. Leia `AGENTS.md` na raiz do repositório e a skill `design-infantil` (sempre).
2. Escreva o **brief de uma linha** (padrão em `prototype-fast`): o verbo central que o
   Samuel repete ("cuspir fogo nos blocos"), a pergunta que o protótipo responde e o
   critério de "manter". Se a ideia veio do Samuel, preserve as palavras e os personagens
   dele; são o motivo de o jogo existir.
3. Não recrie um jogo comercial específico (nem com outro nome). Use o gênero, a ideia e os
   personagens do Samuel para fazer algo original.

## Roteamento: quais skills carregar

As skills de motor (Godot/Unity) dos exemplos vendorizados não se aplicam aqui. Use as
ideias delas e traduza para canvas + JS com `references/receitas-canvas.md`.

| O pedido fala de... | Carregue |
|---|---|
| qualquer jogo | `jogos-samuel` + `design-infantil` |
| ideia nova, "faz um jogo de...", testar se é divertido | + `prototype-fast` |
| "mais legal", impacto, explosão, tremor, pulinho | + `game-feel` |
| botões, menus, placar, HUD, telas | + `game-ui-ux` |
| controles, toque, arrastar, teclado, gamepad | + `input-systems` |
| sons, música, volume | + `audio-design` |
| fases, dificuldade, ritmo, tutorial | + `level-design` |
| recorde, progresso, desbloquear | + `save-systems` |
| câmera que segue, mundo maior que a tela | + `camera-systems` |
| pulo, gravidade, colisão, quicar | + `physics-tuning` |
| travando, lento, celular esquentando | + `performance-optimization` |
| fases aleatórias, mapas gerados | + `procedural-gen` |
| inimigos que perseguem ou fogem | + `game-ai` |
| pular plataformas | + `platformer` |
| quebra-cabeça, combinar peças, labirinto | + `puzzle` |
| torres, defender o castelo | + `tower-defense` |
| cartas, cartinhas, coleção | + `card-game` |
| jogar com o papai/um amigo, 2 jogadores, online | + `multiplayer-familia` |
| o jogo ficou grande demais para um arquivo | + `phaser-core` / `phaser-arcade-physics` (2D) ou `threejs-scene-setup` (3D) |

Engines são exclusivas: um jogo é canvas puro **ou** Phaser **ou** three.js. Trocar de
engine é decisão do Boaz, não do agente.

Trabalho em `lab/` (laboratório do Boaz) não usa esta skill: comece pelo `router`. Esta
skill vale só para os jogos do Samuel.

## Formato técnico da casa

Comece de `references/template.html` (cópia para `<pasta-do-jogo>/index.html`). Ele já traz
tudo abaixo; não remova nada sem motivo.

- **Um arquivo, sem build.** `<pasta>/index.html` com CSS e JS inline. Nada de `npm`,
  bundler ou CDN em jogo de canvas puro. Se usar Phaser/three.js, carregue de CDN com versão
  exata e fixada (ex.: `three@0.186.1`) e cite a versão no topo do arquivo.
- **Resolução lógica fixa** (ex.: 480×720 retrato ou 960×540 paisagem) escalada para caber
  na tela, com `devicePixelRatio` limitado a 2. Toda a lógica usa coordenadas lógicas.
- **Máquina de estados explícita**: `menu → play ⇄ pause → over`. Telas são overlays HTML
  (`.overlay` + `.card`), não desenhadas no canvas, para ter botões grandes e acessíveis.
- **Laço com `dt` limitado** (`Math.min(dt, 1/30)`), simulação separada do desenho:
  `update(dt)` muda o estado, `draw()` só lê. Isso também deixa o caminho aberto para o
  multiplayer.
- **Entrada dupla**: Pointer Events (toque e mouse, `touch-action: none`) **e** teclado
  (setas/WASD, Espaço, Enter para começar, P/Esc para pausar).
- **Pausa automática** quando a aba fica oculta (`visibilitychange`).
- **Som sintetizado** com Web Audio (`beep`), criado só depois do primeiro toque, com botão
  🔊/🔇 lembrado no `localStorage`. Sem arquivos de áudio externos por padrão.
- **Salvar com `store`** (try/catch; janela privada pode falhar). Chaves prefixadas pelo jogo
  (`db-best`, `db-sound`) e versionadas se o formato mudar (ver `save-systems`).
- **Arte**: formas desenhadas no canvas + emoji. Asset externo só com licença conhecida,
  anotada no topo do arquivo.
- **Nada de rede** em jogo single player: sem analytics, anúncios, login, fontes remotas ou
  qualquer coleta de dados.
- **`lang="pt-BR"`**, `<title>`, `<meta name="description">`, ícone emoji em data-URI e link
  "← Voltar aos jogos" (`../`) nas telas de início e fim.

## Fluxo de trabalho

1. **Protótipo** (30–60 min) só com o verbo central e formas simples. Pergunta: o Samuel
   entende e repete sem ajuda?
2. **Teste local** com `python3 -m http.server 8765` (ou a configuração `jogos-samuel` do
   `.claude/launch.json`). Verifique no navegador: console sem erros, tela de início, jogar,
   pausar, perder, jogar de novo, som liga/desliga, tamanho de celular (375×812) e de
   computador. Relate o que você viu, não o que esperava ver.
3. **Polimento** em camadas: primeiro `game-feel` (impacto, partículas, pulinho), depois
   fases/dificuldade (`level-design`), depois recorde e conquistas.
4. **Cartão na página inicial** (`index.html` da raiz): copie o bloco `<a class="game">`
   existente, com emoji, nome e uma frase. O cartão "Em breve" fica por último.
5. **Checklist final** em `design-infantil` → "Pronto para o Samuel".
6. **Publicação não é automática.** Subir para samuel.tech, criar remoto ou tornar algo
   público exige pedido explícito do Boaz naquele momento.

## Armadilhas

- Texto longo na tela de início: o Samuel não lê parágrafos. Ícone + 3 palavras.
- Começar difícil: os primeiros 30 segundos devem ser quase impossíveis de perder.
- `setInterval` para lógica de jogo ou velocidade presa ao FPS: use sempre `dt`.
- Mexer no corpo do jogador para tremer a tela: trema a câmera/desenho (`game-feel`).
- Esquecer o celular: alvos de toque pequenos, gesto que rola a página, `alert()`.
- Juntar dois jogos no mesmo arquivo ou compartilhar código entre pastas: cada jogo é
  independente e pode ser apagado sem quebrar os outros.

## Referências

- `references/template.html` — esqueleto jogável para copiar.
- `references/receitas-canvas.md` — receitas das skills vendorizadas (tremor por trauma,
  hit-stop, squash & stretch, easing, buffer de pulo, coyote time, partículas, salvar
  versionado) em JavaScript de canvas.

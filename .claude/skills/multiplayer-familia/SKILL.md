---
name: multiplayer-familia
description: >
  Caminho em etapas para levar os jogos do Samuel de single player para multiplayer seguro
  para criança: preparar a arquitetura (entrada → simulação → desenho), depois 2 jogadores
  na mesma tela ou por turnos, e só então online em sala privada com código, sem chat livre,
  sem conta e com servidor que valida tudo. Use quando o pedido falar de jogar junto,
  2 jogadores, cooperativo, contra o papai, amigo, irmão, online, sala, WebSocket, WebRTC,
  sincronizar, lag ou servidor de jogo.
---

# Multiplayer em família

O multiplayer vem **depois** de o jogo ser divertido sozinho, e em etapas. Cada etapa só
começa quando a anterior está jogável e testada. A etapa 3 (online) envolve servidor, rede e
crianças: exige pedido explícito do Boaz antes de qualquer código de servidor, hospedagem ou
domínio.

## Etapa 0 — Arquitetura pronta para multiplayer (todo jogo novo)

Custa quase nada fazer desde o início e evita reescrever depois:

- **Entrada vira ação.** Teclado/toque produzem `{ left, right, jump, fire }` por jogador;
  a simulação nunca lê `keys` diretamente.
- **Simulação pura.** `update(state, inputs, dt)` só depende do estado e das ações. Nada de
  `Math.random()` solto: use um gerador com semente (`mulberry32(seed)`) guardado no estado.
- **Desenho só lê.** `draw(state)` não altera nada.
- **Jogadores numa lista.** `state.players = [p1]` desde o single player.
- Para física sensível, passo fixo (`receitas-canvas.md` → passo fixo).

```js
function mulberry32(a) {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;   // 0 ≤ x < 1, mesma sequência para a mesma semente
  };
}
```

## Etapa 1 — Mesma tela (o melhor primeiro multiplayer para 7 anos)

- **Cooperativo antes de competitivo.** Juntos contra o jogo: os dois vencem ou tentam de
  novo. Competitivo, se houver, com rodadas curtas e placar leve.
- **Teclado dividido**: P1 em WASD + Espaço, P2 em setas + Enter. Mostre a legenda com cores.
- **Toque dividido** (tablet): metade esquerda da tela para P1, direita para P2; cada
  `pointerId` fica preso à metade onde começou.
- **Gamepads**: `navigator.getGamepads()` com um gamepad por jogador; "aperte A para entrar".
- Cores e formas distintas por jogador, câmera que enquadra os dois (`camera-systems`) ou
  tela fixa.
- Ajuda entre jogadores: reviver o amigo encostando nele, poderes compartilhados.

## Etapa 2 — Por turnos (hot-seat)

Para quebra-cabeça, cartas e tabuleiro (`puzzle`, `card-game`): estado com `turn`, aviso
grande "Vez do 🐉 Samuel!" e uma pausa entre turnos. Serve também como base para online
assíncrono depois.

## Etapa 3 — Online (só com aprovação explícita)

Requisitos de segurança, todos obrigatórios:

- **Sala privada com código curto** (ex.: 4 emoji ou 4 letras) compartilhado pessoalmente
  pelos pais. Sem lista pública de salas, sem matchmaking com estranhos.
- **Sem chat livre.** Comunicação só por emotes pré-definidos (👍 😂 🎉 ❤️).
- **Sem conta, sem dados pessoais.** Apelido escolhido de uma lista ou emoji; nada de nome
  real, idade, foto, voz ou localização. Nada é guardado no servidor além da partida em curso.
- **Servidor autoritativo.** O cliente envia só ações; o servidor simula e valida (posição
  possível, cadência de tiros, limites), com limite de mensagens por segundo. Nunca confie
  em pontuação enviada pelo cliente.
- **Salas expiram** (ex.: 30 min sem atividade) e têm no máximo os jogadores previstos.
- Conexão caiu → o jogo continua para quem ficou e permite reentrar com o mesmo código.

Escolha técnica (decidida pelo Boaz na hora):

| Opção | Quando | Observação |
|---|---|---|
| WebSocket + servidor Node pequeno | padrão recomendado | servidor simula a 20–30 Hz, clientes interpolam |
| WebRTC (DataChannel) entre 2 aparelhos | 2 jogadores, mesma casa | ainda precisa de sinalização; menos controle de segurança |
| Lockstep determinístico | turnos ou jogos simples | só envia ações; exige a Etapa 0 bem feita |

Técnicas de rede quando houver movimento contínuo: o servidor envia snapshots com número de
quadro; o cliente desenha os outros jogadores interpolando ~100 ms no passado e prevê o
próprio movimento, corrigindo suavemente quando o servidor discorda.

## Armadilhas

- Começar pelo online: é a parte mais cara e a menos importante para uma criança de 7 anos.
  Mesma tela já é "jogar com o papai".
- `Math.random()` ou `Date.now()` dentro da simulação: dessincroniza tudo.
- Lógica de jogo dentro do desenho ou dos handlers de evento.
- Qualquer canal de texto livre, mesmo "só entre amigos".
- Publicar servidor, abrir porta ou registrar domínio sem pedido explícito.

## Skills relacionadas

- `jogos-samuel` — formato da casa e roteador.
- `design-infantil` — regras de segurança que também valem aqui.
- `input-systems` — ações por jogador, gamepad, rebind.
- `camera-systems` — enquadrar dois jogadores.
- `physics-tuning` — passo fixo para simulação estável e determinística.

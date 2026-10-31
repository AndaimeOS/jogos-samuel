---
name: design-infantil
description: >
  Regras de design, segurança e acessibilidade para jogos de uma criança de 7 anos (o Samuel):
  leitura mínima, alvos de toque grandes, sessões curtas, frustração baixa, recompensas,
  dificuldade em rampa, nada de anúncios, compras, chat ou coleta de dados, cuidado com
  flashes e volume, e um roteiro de teste com a criança. Use em todo jogo deste repositório
  e sempre que o pedido falar de dificuldade, "está difícil", "ele desistiu", tutorial,
  texto na tela, recompensa, perder, vidas, sustos, segurança ou playtest com o Samuel.
---

# Design para uma criança de 7 anos

Uma criança de 7 anos está aprendendo a ler, tem coordenação boa mas ainda imprecisa,
joga em sessões curtas e quer **se sentir capaz**. Ela não lê instruções, aprende tocando, e
larga o jogo quando se sente injustiçada. Estas regras valem para todos os jogos do Samuel e
prevalecem sobre recomendações genéricas das outras skills.

## Regras de ouro

1. **Entende em 10 segundos, sem ler.** Ícone + até 3 palavras por instrução ("👆 Arraste!").
   A primeira ação ensina o jogo: um inimigo parado, uma estrela no caminho.
2. **Os primeiros 30 segundos são quase impossíveis de perder.** A dificuldade sobe devagar
   e por tempo/fase, nunca de repente.
3. **Perder é leve e rápido.** "Jogar de novo" a um toque, em menos de 2 segundos, sem
   penalidade acumulada. Prefira "fim da rodada" a "game over"; mostre o que ele conseguiu
   (pontos, recorde, estrelas), não o que errou.
4. **Recompensa frequente e visível.** Algo bom a cada poucos segundos: som, brilho, número
   subindo, um poder. Conquistas e desbloqueios dão motivo para voltar.
5. **Sessões curtas.** Rodada de 30 s a 3 min. Fases com fim claro. Nada que exija jogar
   todo dia (sem "streaks", sem recompensa diária, sem energia que recarrega).
6. **Controle perdoa.** Hitbox do jogador menor que o desenho; coletáveis com área maior;
   coyote time e buffer de entrada generosos; mira com ajuda.
7. **Ele é o herói.** Personagens e ideias do Samuel entram no jogo. Tom alegre e
   aventureiro; perigo de desenho animado, sem sangue, sem sustos, sem humilhação.

## Interface

- Botões e alvos de toque com **no mínimo 64 px CSS** (o template já usa), espaçados; ações
  principais embaixo, ao alcance do polegar. Nada importante encostado nas bordas.
- Fonte grande (≥ 20 px CSS nos cartões, ≥ 24 px lógicos no HUD), alto contraste, poucas
  palavras, emoji como ícone. Números em vez de barras quando ele precisa comparar.
- Sempre visíveis: pausa, som liga/desliga, voltar aos jogos. Pausa automática ao trocar
  de aba.
- Nada de `alert()`, popups, telas de carregamento longas, menus aninhados ou
  configurações complicadas.
- Cor nunca é a única informação (forma ou ícone junto), por acessibilidade.

## Segurança e privacidade (não negociável)

- **Sem anúncios, compras, moedas pagas, loot boxes, chat livre, contas ou login.**
- **Sem coleta de dados**: nada de analytics, rastreadores, fontes ou scripts de terceiros
  que não sejam necessários para o jogo funcionar. `localStorage` só guarda recorde e
  preferências, no próprio aparelho.
- **Sem padrões escuros**: nada de "só mais uma" forçado, contadores que pressionam, culpa
  por sair ou notificações.
- **Fotossensibilidade**: no máximo 3 flashes por segundo, flashes pequenos; nada de tela
  inteira piscando em cores saturadas (ver `game-feel` → referência de feedback).
- **Volume** moderado por padrão (`vol` ≤ 0.08 no `beep`), sem sons altos e súbitos.
- Nome, foto, voz ou qualquer dado do Samuel não entram no jogo publicado sem pedido
  explícito do Boaz.

## Dificuldade

- Rampa suave: uma ideia nova por vez, apresentada num lugar seguro, depois combinada.
- Ajuste dinâmico discreto: se ele perde 2–3 vezes seguidas no mesmo ponto, deixe aquele
  trecho um pouco mais fácil (mais tempo, inimigo mais lento) sem anunciar.
- Modo "bem fácil" é opcional e bem-vindo, mas o padrão já deve ser vencível.
- Chefões têm padrão claro e repetitivo, avisam antes de atacar e não exigem decorar.

## Roteiro de teste com o Samuel

1. Entregue o jogo **sem explicar nada**. Observe em silêncio por 2 minutos.
2. Anote: onde ele hesitou, o que tentou tocar que não fazia nada, quando sorriu, quando
   reclamou, se pediu para jogar de novo sozinho.
3. Pergunte depois, simples: "O que foi mais legal?", "O que foi chato?", "O que você
   colocaria no jogo?". As ideias dele viram a próxima versão.
4. Critério de manter (de `prototype-fast`): ele faz a ação principal de propósito em ~30 s
   e pede "mais uma" sem ninguém sugerir.

## Pronto para o Samuel (checklist)

- [ ] Abre e joga no celular (375×812) e no computador sem erro no console.
- [ ] Tela de início com ícone, nome, até 2 linhas de instrução e botão "Jogar!".
- [ ] Primeiros 30 s vencíveis por quem nunca jogou.
- [ ] Perder → jogar de novo em 1 toque; recorde salvo e mostrado.
- [ ] Pausa (botão, P/Esc, troca de aba), som liga/desliga lembrado.
- [ ] Alvos de toque ≥ 64 px; nada de texto pequeno.
- [ ] Sem flashes fortes, sem sons altos, sem conteúdo assustador.
- [ ] Sem rede, anúncios, compras, chat, login ou coleta de dados.
- [ ] Link "← Voltar aos jogos" e cartão na página inicial.
- [ ] Testado com o Samuel (ou marcado como "ainda não testado com ele").

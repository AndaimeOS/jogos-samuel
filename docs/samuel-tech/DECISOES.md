# Decisões técnicas — Hordas dos Blocos e Dungeons dos Blocos

Registro curto das decisões de execução. A fila e o estado vivem no Notion
("Tarefas — Samuel.tech"); este arquivo guarda o que precisa estar junto do código.
Não apagar decisões antigas: acrescentar uma nova com alternativa, motivo e efeito.

## DEC-007 — Linha canônica do repositório (2026-11-01)

- **Decisão:** `origin/main` (portal PHP publicado em samuel.tech) é a linha de trabalho.
- **Alternativa descartada:** o `main` antigo do computador do Boaz (site estático com
  `aventura-pula-pula`, `bichos-contra-a-gosma`, `lab/` e skills em `.claude/`).
  Ele foi preservado na branch local `site-estatico` (0555a19) e não foi apagado.
- **Efeito:** novos jogos seguem o `CLAUDE.md` do portal (`_privado/jogos/<slug>/`,
  `_app/jogos.json`, empacotar → `publicacao` → Hostinger).

## DEC-008 — Base de Hordas dos Blocos (ST-010, 2026-11-01)

- **Decisão:** adaptar **ken-fs/voxel-survivors**, commit
  `cf9f1fccbcb73487ff45b8e3a6619a19b000be86` (2026-10-13), licença MIT
  (© 2026 BubuAi; manter o `LICENSE`). Reaproveitar o núcleo, não a apresentação.
- **Prova executável:** `demos/play/` rodou como arquivos estáticos (sem build), Three.js r186
  já incluído em `vendor/three` (arquivos reais, sem link simbólico). Simulação fixa de 60 Hz
  (`simStep`), level-up pausa a simulação, chefe aos 41 s, morte → Retry zera a partida,
  recorde em `localStorage` (`vs-best`). Joystick de toque move o herói (`?touch=1`).
  Nenhum 404, nenhuma requisição externa na execução local. Ganchos `__stats()` e `__test`.
- **O que entra:** `lib/voxel.js`, `lib/rng.js`, `lib/crowd.js`, `lib/view.js`, `lib/hitfx.js`,
  `lib/events.js` e o laço/sistemas de `demos/play/` (upgrades 1 de 3, ondas, chefe, drops).
- **O que sai ou muda (obrigatório antes de publicar):**
  - Remover o Google Analytics com banner de consentimento (`gtag`, `__GA_ID__`), o artigo
    de SEO, o JSON-LD e os scripts de site/itch/Cloudflare (`scripts/`, `wrangler.jsonc`,
    `.build-env` com ID do GA, `.indexnow-key`, `dist/itch`).
  - Trocar o tema "exército escuro com bandeiras de caveira" por mundo de blocos claro do kit;
    textos em pt-BR; personagens próprios.
  - Ataque é em arco à frente (precisa virar para o inimigo): avaliar mira automática no
    modo Explorador.
  - Dificuldade atual é alta (robô parado morreu aos 50 s; 300+ soldados na tela):
    criar Explorador (3 min, dano reduzido) e limitar a horda para leitura e desempenho.
  - Em 375×812 os botões de habilidade saem da tela e a câmera fica próxima demais.
  - Não há pausa em `visibilitychange`: acrescentar.
  - `demos/play/` tem 7,1 MB por causa de capturas PNG: não copiar as imagens.
- **Versão do Three.js:** r186 isolado no build de Hordas; Turbo e Caça às Estrelas
  continuam com 0.170 (sem tarefa para trocar).
- **Alternativa:** Giftedx/wild-haggis-survivors (Phaser 4, 2D) — **não executada** nesta
  rodada; fica como plano B se o 3D falhar no teste de toque/desempenho (HO-040).

## DEC-009 — Base de Dungeons dos Blocos (ST-010, 2026-11-01)

- **Decisão:** **não** usar cedrickchee/torchline-dungeon como base visual nem copiar seus
  recursos. Usar como **referência de arquitetura** (MIT, commit
  `cf050b9ef0cfa4ebd5015574c19f179b47bffee1`, 2026-06-26): separação `core/` × `render/`,
  `persistence`, `navigation`, cena autorada, gancho de QA com `advance(ms)`. Trechos de
  código podem ser adaptados mantendo o aviso MIT.
- **Motivo:**
  - Recursos: 40 MB de atlas/sprites góticos e áudio `.ogg`; `docs/assets.md` pede para
    confirmar a origem, mas o repositório não documenta a licença/origem das folhas de
    sprites (`assets/source/*`). Visual escuro (caveiras, cripta) e em inglês.
  - Toque: só "tocar para andar" (pointer); sem joystick nem botões de ação.
  - Exige build (Vite 7 + TypeScript); o portal aceita, mas a apresentação teria de ser
    refeita inteira de qualquer forma.
- **Prova executável:** `bun install --frozen-lockfile --ignore-scripts` + `vite build --base ./`
  → `dist/` estático (19 MB) abriu sem 404 nem requisição externa. Combate (Bone Warden,
  Ash Chanter), morte (`killPlayer`) e `R` reinicia com 8 monstros e HP cheio. 120 FPS médios
  no desktop (238 draw calls), `__torchlineQa.metrics()`.
- **Efeito no plano:** DU-010 constrói a sala de masmorra sobre o núcleo de blocos de Hordas
  (`voxel.js` para paredes/chão, mesmo herói, mesmo combate), como o plano já sugeria
  ("compartilhar o núcleo de combate de Hordas"). carlesvallve/voxel-engine continua
  reservado (sem `LICENSE` na raiz).

## DEC-010 — Motor do Minigolfe dos Pets (EXP-01, 2026-11-01)

- **Decisão:** Three.js 0.170.0 (mesma versão do Turbo e do Caça às Estrelas) + TypeScript
  5.9.3 + Vite 6.4.5 com `base: './'`, **física própria** em `src/core/fisica.ts` (bola num
  plano com rampas, colisão contra cápsulas, sub-passos de no máximo 40% do raio).
- **Alternativas descartadas:** Rapier (WASM ~2 MB, porteiro e MIME a validar, sem ganho para
  bola rolando em plano); LCmaster/minigolf como base (SvelteKit/Threlte/Firebase, sem toque) —
  ficou só como referência de gênero, nenhum código copiado.
- **Efeito:** jogo com build (fonte em `desenvolvimento/jogos/minigolfe-dos-pets/`, saída
  commitada em `_privado/jogos/minigolfe-dos-pets/`), 157 KB gzip, sem arquivos de arte externos
  (texturas e pets gerados por código), aviso MIT do three.js em `THIRD_PARTY_NOTICES.txt`.

## DEC-011 — Contrato de release (ST-040, 2026-11-01)

- `python3 ferramentas/release_jogo.py <slug> <versão>` grava `_privado/jogos/<slug>/release.json`
  com o commit do código (exige árvore limpa para o jogo). O manifesto vai no pacote e é servido em
  `/jogo/<slug>/release.json`; o roteador local deixou de bloquear `.json` dentro de `/jogo/`.
- Hash do zip, hora do deploy e link do Notion ficam fora do pacote (Notion + comentário
  `SAMUEL_TECH_DEPLOY_READY` no PR), nunca o hash do próprio zip dentro dele.

## DEC-012 — Base da Ilha dos Blocos: Voxelize (BLK-020, 2026-11-01)

- **Decisão:** Voxelize `7ae1c202c4ed33e6f18ea2e947c5c6f9a373b605` (MIT): cliente `@voxelize/core` estático em
  `/jogo/ilha-dos-blocos/` + servidor Rust autoritativo na VPS por `wss://`. Regras de inventário/crafting/modos em TS
  puro testado; modpacks JSON próprios com o manifesto da seção 7. Detalhes: `docs/blocos/ADR-001-base.md`.
- **Aceita com condições:** servidor na VPS com TLS conectando do iframe do player, e sessão em celular real com
  toque e ≥ 30 FPS. Se uma reprovar, prova mínima de noa antes de seguir.
- **Descartados:** zardoy (recursos extraídos do Minecraft via `mc-assets`), noa (reserva, não testado), Luanti (lab).
- **Efeito:** a Ilha é o primeiro jogo do portal que depende de servidor; precisa de tela "servidor fora do ar",
  backup diário e proteção infantil (sem chat livre, mundos por código opaco). Matriz: `docs/blocos/MATRIZ-FIDELIDADE.md`.

## DEC-013 — Ilha dos Blocos no ar como prévia, com código da ilha (2026-11-01)

- **Pedido do Boaz:** publicar a Ilha. Vai como **prévia do Criativo (0.1), só computador** (teclado e mouse; no
  tablet aparece um aviso e um botão de voltar, sem prender a criança num mundo sem controle).
- **Servidor:** VPS `srv2114451.hstgr.cloud`, serviço `ilha-dos-blocos` (usuário `ilha`, sem privilégio, só
  `127.0.0.1:4100`), nginx em **:8443** com o certificado Let's Encrypt que já existia (porta própria porque o cliente
  do Voxelize usa `/ws/` na raiz, que é do painel de jogos). Só passam `/ws/` (Origin samuel.tech, limite por IP),
  `/registry/` e `/saude`. Backup de hora em hora (3 dias) na VPS. Arquivos em `desenvolvimento/infra/vps/`.
- **Código da ilha (achado P1 do REV-01):** a chave do servidor é um código da família que **não está no Git nem no
  JS publicado** — fica só em `/opt/ilha/ilha.env` (root, 600) e numa cópia local do Boaz. Um adulto digita uma vez por
  computador; fica no `localStorage` daquele aparelho. Código errado → mensagem; servidor fora → "a ilha está dormindo".
  Não é login nem conta: não há nome, e-mail ou dado pessoal. Trocar o código = editar o `.env` e reiniciar o serviço.
- **Limites conhecidos (P2, fila):** sem limite de edições por segundo no servidor (só a família tem o código);
  mensagens grandes aceitas pelo motor; JS total com workers ≈ 591 KB gzip (orçamento de 450 KB vale para o bundle
  principal: 425 KB); sem cópia do backup fora da VPS.

## DEC-014 — Samuel Surfers em cima do MetroDash (2026-11-15)

- **Decisão:** adaptar o código MIT do MetroDash (`e2db18b`, Frank Valdez) e jogar a v1 com os
  modelos low-poly em código da folha 3D do Gerador. O estilo pixel (billboard) fica no menu,
  desligado por padrão. Sem GLB, sem Draco, sem meshopt, sem o analytics da demo.
- **Motivo:** o MetroDash passa na revisão (MIT, sem modelo/fonte/mp3 de terceiro, three sem aviso
  no audit de produção). As PNG dele não têm licença própria e saem. O código dos modelos pesa
  menos que os GLB e não pede outro carregador. A faixa fica em 3,1 e o Samuel em cerca de 3,4,
  como a folha 3D.
- **Efeito:** `_privado/jogos/samuel-surfers/` é o build estático (three 0.170 dentro do bundle).
  O modo Fácil não acaba a corrida. Não houve merge nem publicação nesta sessão.

## DEC-015 — Planeta 0.3 e Pescador no motor da horda (2026-11-15)

- **Decisão:** os dois jogos usam a partida solo portada do código MIT de Pedro
  Barretto (vista, horda fora da tela, separação, cartas, tremor, partículas).
  A arte, os nomes e os sons são nossos. O chefe desenha em escala 1. A morte
  toca `Sumico.png` e as partículas. O chão fica procedural (opção A), e a água
  do Pescador é o piso do barco.
- **Alternativa descartada:** publicar o bundle inteiro do Pokémon Survivors
  com outro nome. Ele carrega criatura, sprite e nome que este portal não pode
  servir, além de conta e rastreador.
- **Efeito:** o código mora em `desenvolvimento/jogos/motor-hordas/` e o site
  recebe só o pacote de cada slug. Respostas ao Gerador em
  `desenvolvimento/jogos/motor-hordas/RESPOSTAS-GERADOR.md`. Sem deploy nesta sessão.

## DEC-016 — Perigos do cenário e sprites do lote 5 (2026-11-15)

- **Decisão:** nevoeiro, onda-gigante e tempestade não são inimigos. São efeitos
  de tela com aviso antes, no mesmo espírito da chuva de meteoros, da enchente
  e dos raios do Planeta. No Fácil nenhum desses perigos tira vida. O raio do
  Pescador não tira vida em modo nenhum, e o alvo pisca a pelo menos 64 px do
  barco. A tempestade usa os três degraus de escurecimento, porque o mais escuro
  cobre 19% do tile e o barco continua visível. Mamute, caranguejo-gigante e
  robô enferrujado usam a folha de 8 direções do lote 5, em escala 1.
- **Alternativa descartada:** desenhar esses três do Pescador como bicho com
  sprite, e manter os três do Planeta como placeholder de 24 px.
- **Efeito:** os ids saem da horda e do `motor.json`. A arte fica em
  `arte/perigos/`. Pedra e árvore do `cenario/` não bloqueiam o passo.

## DEC-017 — Combate no alvo, no estilo Tibia (2026-11-15)

- **Decisão (Boaz, 15/11 18:20 BRT):** o Planeta e o Pescador atacam sozinhos o
  bicho marcado. A mira escolhe o mais perto; o chefe no alcance tem prioridade
  e ganha uma moldura vermelha. Lança, funda, anzol, arpão, rede e as outras
  ferramentas vão nesse alvo. A arma que orbitava o Samuel sai dos dois jogos,
  inclusive das cartas. O botão de Ação dispara um especial no alvo, com recarga.
  O joystick continua com a criança: o personagem não persegue sozinho. XP,
  cartas, mapa, Fácil sem perder e tela cheia ficam. Os números de dano e
  alcance continuam proposta.
- **Alternativa descartada:** deixar a órbita como melhoria escondida, e copiar
  o idle inteiro (andar sozinho, poção, mercado, grupo).
- **Efeito:** o código mora em `desenvolvimento/jogos/motor-hordas/`. Sem deploy
  nesta sessão.

## DEC-018 — Mira no alcance da arma, moldura no sprite, tempestade sem pontilhado (2026-11-15)

- **Decisão:** a mira mede distância no mundo, todo quadro, e escolhe o bicho vivo
  mais perto. O chefe só passa na frente se estiver dentro do alcance da
  ferramenta mais longa. A moldura vermelha abraça os pixels opacos do quadro
  que está na tela, com 2 px de folga. A tempestade escurece a tela inteira com
  um véu uniforme (16% com a chuva caindo, até 8% no aviso) e não espalha mais
  o pontilhado de `escurecer.png`. As gemas andam até o Samuel (ímã de 110 px,
  e mais 80 px depois de 4 s) e as que nascem juntas viram uma só. O círculo
  desenhado da rede, da espuma e das outras armas no alvo tem no máximo 10 px;
  o raio que acerta continua o da carta. Esse círculo some quando o bicho morre.
- **Alternativa descartada:** manter os três degraus do pontilhado (DEC-016) e
  a mira fixa de 420 px (DEC-017). No print de 30 s o pontilhado virava ruído e
  a moldura ia parar longe do barco.
- **Efeito:** vale para o Planeta e para o Pescador. Sem deploy nesta sessão.

## DEC-019 — O Pescador usa a camiseta cinza (2026-11-15)

- **Decisão (Boaz, 15/11 21:33 BRT):** o Samuel no barco é o `samuel-barco-cinza`.
  É o único visual. O colete sai do índice, da capa e da pasta.
- **Efeito:** a capa da biblioteca e o jogo desenham a camiseta cinza. Sem merge
  nem publicação nesta sessão.

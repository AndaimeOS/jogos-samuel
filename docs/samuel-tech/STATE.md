# Estado — Samuel.tech

Atualizado ao fim de cada sessão (ST-090). Um bloco por sessão, o mais novo em cima.
Vale o que está aqui e no Notion, não a memória do chat.

## 2026-11-15 — Samuel Corredor 0.1.0 (arte final, ainda sem publicar)

- **Pedido:** entrar a entrega final do Gerador (`corredor-entrega`) no lugar dos placeholders e fechar a rodada dos prints (moedas e 3 cristais, mapa com nós, castelinho, floresta e caverna provadas, 60 s de toque no retrato e no iframe). Sem merge, sem push na `main` e sem deploy.
- **Feito:** arte em `f9b7af2`. Atlas 256×256, 54 quadros, JSON Hash, vão de 2 px, `trimmed: false`. O castelinho com troféu fecha a caverna; o marco acende no checkpoint; a vitória segura a pose em V (`samuel/comemorar_0`). As fases do Gerador são iguais byte a byte ao `gerar-fases.mjs` (`gid = linha*12 + coluna + 1`, especial da caverna = 35). Hitbox segue 14×40, offset (9, 8); no campo o pé encosta em y = 192. Os fps sugeridos dos extras ficaram em 4. O buraco do campo e da floresta mostra o pé do céu (faixa verde chapada): falta um fundo `_v2` mais fundo. O jogo não tapa isso com cor.
- **Testes:** `npx vitest run` no jogo — regras 7/7 e iPad WebKit (geração 7) 7/7: 60 s em 1024×768 e em 768×1024, 60 s no iframe de `/jogar/?jogo=samuel-corredor` nos dois sentidos, sem erro no console. `verificar_jogo.py samuel-corredor` ok. As outras suítes já tinham passado depois do catálogo e não foram reexecutadas nesta leva (o texto do catálogo só mudou a frase da bandeira e do castelinho).
- **Não feito:** merge, deploy, playtest no iPad de verdade, fundo `_v2` dos buracos.
- **Notion:** esta sessão não veio de um card da fila; o hub não foi atualizado.
- **NEXT:** o Boaz olha os prints, pede o fundo `_v2` se quiser, faz o merge e publica. Este agente não faz o deploy.

## 2026-11-15 — Samuel Corredor 0.1.0 (Phaser, proposta jogável)

- **Pedido do Boaz (15/11 18:42 e 18:44 BRT):** testar o Phaser num jogo novo, "Faz o Samuel Corredor". Plataforma 2D de lado, três fases curtas, mapa, modo Fácil. Sem merge, sem push na `main` e sem deploy: o Boaz confere os prints e publica.
- **Feito:** slug `samuel-corredor`, branch `cursor/samuel-corredor-2db6`, código em `bde1aad`. Catálogo com `status: "pronto"` e `version: 0.1.0`, então a biblioteca lista o jogo depois do merge. Manifesto `samuel-corredor@0.1.0+bde1aad.producao` (`environment: producao`, como o `release_jogo.py`). Phaser 3.88.2 MIT, build arcade, em `phaser.min.js`. Arte da amostra do Gerador. Respostas no `desenvolvimento/jogos/samuel-corredor/ARTE.md`.
- **Testes:** `npx vitest run` no jogo — regras 7/7 e iPad WebKit (geração 7) 5/5, inclusive 60 s em 1024×768, retrato 768×1024 e o iframe de `/jogar/?jogo=samuel-corredor`, sem erro no console. `verificar_jogo.py --todos` ok. Os outros jogos não foram alterados; as suítes deles não foram reexecutadas aqui.
- **Não feito:** merge, deploy, playtest no iPad de verdade. O troféu da caverna não veio na amostra: a meta é a bandeira. O marco do meio é um poste desenhado no código.
- **Notion:** esta sessão não veio de um card da fila; o hub não foi atualizado.
- **NEXT:** o Boaz olha os prints, faz o merge e publica. Este agente não faz o deploy.

## 2026-11-15 — Pebolim 0.1.2 (faixa no iPad, sem rótulo nas hastes)

- **Pedido:** no iPad em pé a faixa "A bola voltou para o meio!" fica mais larga que a mesa e é cortada. Tirar VERMELHO/AZUL de baixo das hastes. Branch `fix/pebolim-faixa-ipad`, PR rascunho. Sem merge e sem publicar.
- **Feito:** a faixa usa a largura da mesa, quebra a linha e a fonte fica no máximo em 46 px, nos dois sentidos. Saíram da mesa as palavras VERMELHO, AZUL, você e computador (as duas últimas também passavam por baixo da haste). O aviso de deitar o tablet desce para baixo do placar e cabe na tela. Catálogo e manifesto em `0.1.2`. Código em `cceefb7`.
- **Testes de novo, já com a main `78c592d`:** Pebolim `npm test` 35/35 (WebKit/iPad incluso). Planeta 24/24, Minigolfe 53/53, Reino 18/18, Corrida do Jack 19/19, Ilha cliente 12/12, Ilha servidor `cargo test` 6/6, Pokémon Survivors 1941 passaram (59 pulados). `verificar_jogo.py --todos` ok.
- **Aprovação:** Boaz, 15/11 11:22 BRT: "Sim, publica os ajustes do Pebolim". Isso autoriza o merge. O deploy continua fora daqui.
- **Notion:** esta sessão não veio de um card da fila; o hub não foi atualizado.
- **NEXT:** o Boaz publica. Este agente não faz o deploy.

## 2026-11-15 — Cache dos assets do portal (v=8)

- **Pedido:** a correção do Pebolim no iPad (PR #9, `db39790`) mudou `assets/js/site.js` e `assets/css/samuel.css`, mas as páginas ainda pediam `?v=7`. O `/assets` fica 7 dias em cache, então um iPad que já abriu o site pode continuar com a versão velha.
- **Feito:** `?v=7` passou a `?v=8` no layout compartilhado (`_app/layout.php`), que é o cabeçalho e o rodapé da home, `/jogos/`, `/jogar/` e do resto do PHP. Não há constante central de versão; os dois links são o único lugar. Desde o `v=7` (`9d1d7de`) os únicos assets compartilhados alterados foram esses dois. As capas novas em `assets/img/` foram arquivos novos, sem `?v=`. `verificar_jogo.py`, `empacotar.sh` e `conferir_producao.py` não conferem essa versão.
- **Não feito:** publicar no samuel.tech.
- **NEXT:** o Boaz publica. Sem o `?v=8` no ar, o iPad antigo segue com o Pebolim quebrado.

## 2026-11-15 — Pebolim no iPad (WebKit)

- **Pedido do Boaz (15/11 09:56 BRT):** o Pebolim não funciona no iPad; investigar e corrigir. O Samuel joga no Safari/WebKit. Deploy desta sessão não é daqui: só o merge na `main`.
- **Causa:** em paisagem (1024×768) o `/jogar/` deixa o iframe em 78vh, o botão Jogar fica abaixo da dobra, e o `touch-action: none` do jogo come o toque — a página do player não rola.
- **Feito:** no iPad deitado o iframe passa a ocupar a tela e a página rola até a mesa; no menu o toque pode rolar, na partida a mesa continua sem rolagem; o botão Tela cheia usa `requestFullscreen` ou `webkitRequestFullscreen` e, se o Safari não tiver a API, cresce a moldura sem estourar. `release.json` do Pebolim vai para `producao` 0.1.1. Teste WebKit/iPad (toque, saque, hastes, tela cheia) e smoke dos jogos `pronto`.
- **Não feito:** publicar no samuel.tech.
- **Notion:** esta sessão não veio de um card da fila; o hub não foi atualizado.
- **NEXT:** o Boaz publica (o pacote ainda não foi gerado aqui).

## 2026-11-15 — Planeta do Samuel 0.2.0 (barra sem texto, merge autorizado)

- **Pedido do Boaz:** tirar o selo PROPOSTA da tela, trocar a barra de cima por nível, XP, corações, timer e ícones (sem texto), marcar o Planeta como `0.2.0` / `pronto` e fazer o merge do PR #8. O deploy no ar fica para outra etapa.
- **Feito:** o HUD não mostra mais a palavra PROPOSTA; os números continuam `PROPOSTA` no `CONFIG`. A barra usa `icone-vida` e `icone-vida-vazia` do atlas. O botão Tela chama `webkitRequestFullscreen` quando não há `requestFullscreen`. Teste novo em WebKit, perfil iPad, nos dois sentidos e dentro de `/jogar/?jogo=planeta-do-samuel`.
- **Regra:** daqui para a frente, todo jogo passa nesse teste de iPad/WebKit antes do merge.
- **Não mexido:** o deploy da Hostinger.

## 2026-11-15 — Planeta do Samuel 0.1.0 (proposta, sem publicar)

- **Pedido:** jogo novo `planeta-do-samuel` na branch `feat/planeta-do-samuel`, a partir da `main` `83aed98` (Pebolim já na main). PR rascunho. Sem merge e sem deploy.
- **Feito:** vista de cima em canvas, três idades até o farol, juntar / fabricar com x/N / pesquisar, noite que só escurece, fogueira que aquece e ilumina, Fácil sem derrota, joystick e botões ≥ 48 px, autosave. Números em `CONFIG`, marcados PROPOSTA. Entrada no `_app/jogos.json` com `status: novo` e `version: 0.1.0`.
- **Não mexido:** Pebolim, Mestre do Cubo (continua rascunho), branch `publicacao`, os outros jogos.
- **Decisão:** `status: novo` não está em `STATUS_VISIVEIS` nem em `STATUS_TODOS`, então a biblioteca não lista o jogo e o `jogo.php` não entrega os arquivos. A capa existe para quando o status mudar.
- **Referência:** Isle of Embers (MIT, Jaineil Rana) só como laço de mecânicas. Reescrita original em JS. Créditos em `CREDITOS.txt` e `LICENSE.txt`. Nada de Alia Domus.
- **Notion:** esta sessão não veio de uma tarefa da fila; o hub não foi atualizado.
- **NEXT:** playtest no tablet de verdade e, se a proposta ficar, trocar o status para `rascunho` (teste no /admin) ou `pronto` só depois do QA. Não publicar este rascunho.

## 2026-11-14 — Claude (deploys sem sustos: card `docs/qa/infra-deploy/`)

- **Pedido do Boaz:** corrigir todos os problemas encontrados na publicação da Ilha da Vida para os próximos deploys.
- **Feito (revisor: APROVADO, 3 ciclos):**
  - O servidor da Ilha dos Blocos roda com `.debug(false)`: a senha tentada não vai mais para o journal.
  - `/opt/ilha` passou a `root:root 755`, com binário e `backup.sh` do root e cópias de backup em 600.
  - `verificar_jogo.py --todos` passa (créditos do Mestre do Cubo em texto) e virou trava do `empacotar.sh`, que agora
    imprime o SHA-256.
  - Ferramentas novas: `ferramentas/conferir_producao.py <zip>` (conferência de produção, 70/70 hoje) e
    `ferramentas/atualizar_publicacao.sh <zip> [--push]`.
  - A seção Publicação do `CLAUDE.md` foi reescrita com esses passos.
- **Journal antigo da VPS e `ilha.env.anterior` apagados** a pedido do Boaz: 0 senhas em log; a senha antiga não fica
  mais na VPS.
- **Pendências do Boaz:**
  - Remover o vínculo Git antigo no hPanel (Sites → samuel.tech → Avançado → Git).
- **Outras pendências:** toque no celular da Ilha da Vida; registro no Notion.

## 2026-11-14 — Claude (Ilha da Vida 0.1 — sobrevivência Luanti + VoxeLibre)

- **Pedido do Boaz:** testar o Luanti no navegador, criar a "Ilha da Vida" com a mesma senha da Ilha dos Blocos e publicar.
  Eaglercraft recusado (código e arte do Minecraft descompilados).
- **Publicado:** portal `git archive 532be67` desde 2026-11-14 17:20 (-03:00), SHA-256 `8286e259…8f72` (= branch `publicacao`
  `c154977`); `ilha-da-vida@0.1+3b8f7c2`. Produção conferida (arquivos do jogo = commit; `_privado`/`_app` 403; Mestre do
  Cubo segue rascunho, 404). Cliente WASM e servidor na VPS: `https://srv2114451.hstgr.cloud:8443/vida/jogo/`.
- **Como funciona:** ver `desenvolvimento/jogos/ilha-da-vida/README.md` (servidor em 127.0.0.2, ponte lwproxy só para ele, nginx com
  origem + senha escolhendo o destino e limite de taxa, monstros desligados, sem chat, backup de hora em hora).
- **Revisão:** REV-01 reprovou (brecha na exceção do verificador, C1 sem evidência, senha errada sem limite, permissões de
  `/opt/vida`); corrigido no ciclo 2; REV-02 sem defeito; C1 = entrada real do Boaz registrada no servidor (20:17 UTC).
- **Pendências:** resolvidas ou levadas para o bloco "deploys sem sustos" acima.

## 2026-11-14 — Claude (repositório: AndaimeOS vira a fonte da verdade)

- **Pedido do Boaz:** tudo no AndaimeOS, não mais no WeBoaz; ver os conflitos.
- **Feito:** `origin` = `AndaimeOS/jogos-samuel`; `weboaz` = histórico só leitura (push desativado no remote). `main` do
  AndaimeOS = `main` local (fast-forward de `c6938cb`). Tudo o que só existia no WeBoaz foi copiado:
  `main` (`1b420dc` Mestre do Cubo), `publicacao` e `claude/kids-games-retro-site-crzmf6`; `site-estatico` (só local) também.
- **Conflitos e decisões:**
  - **Mestre do Cubo** (`1b420dc`, WeBoaz): nunca foi ao ar (404). Entra na `main` como **rascunho**; o
    `verificar_jogo.py` reprova por 2 links de crédito para o GitHub (cube.js e rubiks-color-resolver). Precisa de QA.
  - **`claude/kids-games-retro-site-crzmf6`** (`6f45932`, outra sessão): outra Ilha dos Blocos (Three.js num arquivo só) no
    **mesmo slug** da Ilha 0.2 em produção. **Não** entrou na `main`; fica só como branch.
  - **`cursor/seguranca-docs-main-e45d`** (Cursor): entrou na `main` (CLAUDE.md sem identificador da hospedagem, .gitignore de segredos).
  - **`cursor/seguranca-deps-exp01-e45d`** (Cursor): atualiza actix/vitest e põe o Voxelize em `vendor/`. **Não** entrou: muda o
    servidor da Ilha e precisa de build e teste na VPS antes.
  - **`publicacao`**: o pacote do WeBoaz (`2c33177`, + Mestre do Cubo) não tinha Minigolfe nem Ilha 0.2 e derrubaria os dois se
    fosse publicado. Agora espelha a produção (`0a8e5416…48b1`, conferido em produção).
- **PR WeBoaz/jogos-samuel#1:** fechado com aviso (pedido do Boaz). **Pendente:** o AndaimeOS ainda aparece como fork do WeBoaz no GitHub
  (desligar exige o dono do WeBoaz ou o suporte do GitHub).

## 2026-11-01 — Claude (Corrida do Jack — etapa 1)

- **Pedido do Boaz:** jogos bonitos; primeiro um runner 3D original no samuel.tech (celular e PC), arte até US$500; GitHub com
  escrita (depende do Boaz convidar `AndaimeOS`). Plano e lista de compras com links: `docs/runner/PLANO-E-COMPRAS.md`.
- **Feito (local):** trecho jogável da **Corrida do Jack** com arte provisória em código; regras puras com 19 testes; pista
  sempre passável (jogador automático 6×90 s); deslizar no celular e teclas no PC. Estado: `docs/jogos/corrida-do-jack/ESTADO.md`.
- **NEXT:** quando as compras chegarem em `~/Downloads/runner-assets/`: instalar Blender (com ok), converter para GLB,
  trocar a arte provisória, som e "juice" (etapa 2). Em paralelo: merge do PR #1 assim que houver escrita no GitHub.

## 2026-11-01 — Claude (Ilha dos Blocos 0.2 — celular e tablet)

- **Pedido do Boaz:** Ilha jogável em celular/iPad com direcionais na tela, e publicar.
- **Publicado:** `ilha-dos-blocos@0.2+a2d073f` desde 2026-11-01 20:34 (-03:00); pacote `0a8e5416…48b1` (= `git archive 91acf90`);
  produção = zip (30/30); servidor da VPS no commit `04d916f` (anterior guardado como `.0.1.1`).
- **O que mudou:** controles de toque (joystick da casa, olhar arrastando, ⛏ 🧱 ⤒ 🪽 ⤓, barra no alto, ▦), velocidades de
  criança, Criativo sempre de dia (relógio parado sem gravar stats a cada tick), avisos compactos, volta ao meio sem encalhar.
  `desenvolvimento/compartilhado/controles-toque.js`: centro lógico do joystick perto de onde o dedo encosta.
- **QA:** 3 rodadas — rodada 1 e 2 reprovadas (REV-01 + QA-UX), rodada 3 aprovada pelos dois. G3 em
  `docs/qa/ilha-dos-blocos/0.2+a2d073f/`. Sessões reais em samuel.tech com o código: iPhone emulado (anda, põe e tira bloco,
  manhã) e computador (põe e tira bloco).
- **Não executado:** aparelho real, Safari real, 120 Hz, playtest com o Samuel.
- **NEXT:** 0.2.1 com os P2 da G3 (voo vertical por tempo de quadro, joystick colado na borda, volta ao meio olhando a altura,
  avisos longos) ou BLK-030 incremento 2 (porta, girar, exportar/importar, mundos por código).

## 2026-11-01 — Claude (Ilha dos Blocos 0.1.1)

- **Publicado:** `ilha-dos-blocos@0.1.1+479f2f1` desde 2026-11-01 17:57 (-03:00); pacote `1244fa66…6629` (= `git archive
  17a48f1`); produção = zip (30/30); sessão real em samuel.tech com o código (entrou, colocou e tirou um bloco).
- **O que mudou:** P2 da 0.1 — `?servidor`/`?codigo` só no dev; código guardado não some numa recusa; Enter respeita o
  aviso de tablet; servidor recusa código fraco em produção (`ILHA_PRODUCAO=1`, sem reinício em laço); nginx 60r/m;
  avisos das crates do wasm. REV-01 Aprovado; G3 em `docs/qa/ilha-dos-blocos/0.1.1+479f2f1/`.
- **VPS:** binário 0.1.1 instalado (0.1 guardado em `/opt/ilha/bin/ilha-dos-blocos-servidor.0.1` para voltar atrás).
- **NEXT:** BLK-030 incremento 2 (porta que abre, girar blocos, exportar/importar, mundos por código) e BLK-040 (toque).
  P2 restantes listados na G3 da 0.1.1.

## 2026-11-01 — Claude (Ilha dos Blocos 0.1 — prévia publicada)

- **Pedido do Boaz:** "Publicar não apareceu no site" → publicar a Ilha. DEC-013.
- **VPS:** chave SSH dedicada (`~/.ssh/samuel_tech_vps`) cadastrada pela API; servidor da Ilha compilado na VPS,
  systemd com usuário `ilha`, nginx :8443 (certificado existente; painel de jogos intacto), backup de hora em hora.
- **REV-01 rodada 1:** reprovado (P1 mundo aberto; P1 avisos de licença) → código da ilha fora do Git/JS + Origin +
  limites no nginx; avisos gerados do bundle real. Mais P2: logs sem IP, `/info` fechado, volta do vazio, aviso de
  reconexão, fallback do pointer lock, backup robusto.
- **Publicado:** `ilha-dos-blocos@0.1+ed6a828` em samuel.tech desde 2026-11-01 16:43 (-03:00); pacote `af544fc4…f9ba`
  (= `git archive b8a4f47`); produção = zip (30/30 arquivos de jogos); REV-01 rodada 2 Aprovado; G3 em
  `docs/qa/ilha-dos-blocos/0.1+ed6a828/`. Sessão real em samuel.tech com o código: entrou, colocou e tirou um bloco.
- **NEXT:** Ilha 0.1.1 com os P2 da G3 (servidor só em dev pelo `?debug`, 503 não apagar código, Enter no tablet,
  avisos das crates do wasm, segredo vazio recusado) → depois BLK-030 incremento 2 e BLK-040 (toque).

## 2026-11-01 — Claude (BLK-030 — Ilha dos Blocos, incremento 1)

- **Feito (local):** servidor Rust da Ilha (32 blocos + água, ilha por seed 2026, save, 127.0.0.1, sem chat) e
  cliente (telas da casa, céu do kit, texturas próprias em código, barra de 9, catálogo de 32, quebrar/colocar).
  Estado detalhado: `docs/jogos/ilha-dos-blocos/ESTADO.md`.
- **Testes:** `cargo test` 5/5, `vitest` 12/12, `tsc` ok; sessão no navegador: quebrar tronco, colocar 3 blocos
  trocando vaga, servidor parado → "a ilha está dormindo" → tentar de novo → tudo persistido.
- **Decisão:** dependências = par publicado `@voxelize/core` 3.0.0 + crate `voxelize` =3.0.0 (ADR atualizada).
- **Não executado:** toque, celular, build de produção/orçamento, VPS.
- **NEXT:** BLK-030 incremento 2 — porta que abre, girar blocos, exportar/importar mundo, mundos por código,
  build ≤ 450 KB gzip, robô da casa de referência.

## 2026-11-01 — Claude (BLK-020 — decisão da base)

- **Decisão:** DEC-012 / `docs/blocos/ADR-001-base.md` — Voxelize `7ae1c20` aceito **com condições** (servidor na VPS
  com `wss://` no iframe; celular real com toque e 30 FPS). Critérios: Recursos, Save, Gameplay e Sustentação aprovados;
  Navegador móvel e Hostinger/infra **inconclusivos por falta de ambiente**.
- **Novos documentos:** `docs/blocos/RECURSOS.md` (licenças; assets do Voxelize não entram), `TESTES.md` (automáticos,
  sessões, orçamento: JS ≤ 450 KB gzip, 30 FPS, ≤ 5 s até jogar, 4 jogadores na VPS), `MATRIZ-FIDELIDADE.md`.
- **Bloqueio real para a condição 1:** acesso SSH/TLS na VPS ainda não configurado (cartão de sessão "Infra da VPS e
  Rust" proposto; Rust já instalado nesta máquina).
- **NEXT:** BLK-030 — esqueleto `desenvolvimento/jogos/ilha-dos-blocos/{cliente,servidor}`, catálogo de 32 blocos com
  texturas próprias, regras de inventário em TS, primeiro trecho jogável local (seed, árvores, quebrar madeira, colocar,
  barra, salvar/reabrir).

## 2026-11-01 — Claude (BLK-010 — provas da base de blocos)

- **Resultado:** Voxelize `7ae1c20` **aprovado como base** (com ressalvas); zardoy **reprovado** para publicação
  (`mc-assets` = recursos extraídos do Minecraft); noa não executado (não foi preciso). Relatório:
  `docs/blocos/BLK-010-PROVAS.md`.
- **Provado:** build servidor Rust + cliente WASM; seed determinística; quebrar/colocar; 2 clientes sincronizados;
  persistência após parada abrupta; reconexão automática; build estático em outra origem; WebKit 26.6 iPad/iPhone;
  API de toque (`MobileRigidControls`); porteiro já entrega `.wasm`.
- **Instalado nesta máquina:** Rust 1.99.1 (rustup, `~/.cargo`, sem mexer no perfil do shell), wasm-pack 0.15.1,
  protoc 36.2 (brew). Clone em `desenvolvimento/provas/` (ignorado pelo Git).
- **Não executado:** aparelho real, VPS/`wss://`, Safari iOS real.
- **NEXT:** BLK-020 (ADR-001, RECURSOS, TESTES, matriz de fidelidade).

## 2026-11-01 — Claude (Minigolfe 1.0.1 — RV-MG-001/003)

- **Publicado:** `minigolfe-dos-pets@1.0.1+c0b67d9` em produção desde 2026-11-01 14:04 (-03:00); pacote SHA-256
  `eb76b122…4473` (= `git archive 752744b`); produção conferida byte a byte (23/23 arquivos de jogos) e rotas 403 ok.
- **O que mudou:** medidor `?fps` (média, p95, quedas, travadas, aparelho/GPU, resumo após 5 min, nada sai do aparelho),
  recordes mesclados entre abas (RV-MG-003), `release.json` com SHA-256 por arquivo (identidade pública verificável).
- **QA:** rodada 1 (`c3c2f99`) reprovada pelo REV-01 (P1: medidor ordenava o histórico) → corrigido; rodada 2 aprovada
  por REV-01 e QA-PERF; G3 em `docs/qa/minigolfe-dos-pets/1.0.1+c0b67d9/G3-LIBERACAO.md`. vitest 53/53.
- **Não executado:** celular real (toque nativo, 30 FPS) — roteiro para o Boaz; iOS Simulator indisponível (sem Xcode
  completo; WebKit 26.6 via Playwright usado como apoio); playtest com o Samuel.
- **NEXT:** resultado do celular → RV-MG-001 → EXP-01-F. Programa de blocos: BLK-010 (Voxelize) depende de Rust + VPS.

## 2026-11-01 — Claude (BLK-000 — programa de blocos)

- **Pedido do Boaz:** programa "Minecraft no navegador, mods, Roblox e arenas de blocos" (v1.1, protocolo de QA G0–G5),
  começando pela BLK-000. Plano aprovado: Voxelize primeiro (noa alternativa, Colyseus para salas); VPS liberada para
  Arena online + servidor família.
- **Checkpoint:** `main` = `dc7628c`, árvore limpa; EXP-01 (Minigolfe) em EXP-01-E publicado, aguardando EXP-01-F;
  revisão RV-MG-001 (P1: identidade pública verificável, toque/30 FPS em aparelho real) vira Minigolfe 1.0.1 antes de
  conteúdo novo. Slug `ilha-dos-blocos` confirmado em `_app/jogos.json`.
- **BLK-000:** Concluída no Notion. BLK-010 Pronta (Voxelize principal; zardoy só auditoria — `mc-assets` são texturas
  extraídas, não publicáveis; noa só se Voxelize reprovar).
- **Bloqueio real para BLK-010:** Rust não instalado; acesso SSH à VPS não configurado (etapa de infra proposta como
  sessão separada).
- **NEXT:** Minigolfe 1.0.1 (`?fps` + página de evidências) → REV-01 + QA-PERF → publicação → BLK-010.

## 2026-11-01 — Claude (EXP-01 Minigolfe dos Pets)

- **Pedido do Boaz:** executar o Minigolfe dos Pets (documento "12 jogos 2D/3D") no automático, com várias
  rodadas de QA, e publicar.
- **Commits:** `1235b79` (MVP), `8b3e383` (correções de QA + capa), `040829f` (manifesto). PR
  https://github.com/WeBoaz/jogos-samuel/pull/1 (fork AndaimeOS — a conta não tem escrita no WeBoaz).
- **Deploy:** **em produção** desde 2026-11-01 12:47 (-03:00), upload TUS + `deploy-static-site-archive` pela API
  da Hostinger. Registro: https://app.notion.com/p/40b0a726d05581d69440cf9fa623464f. Sinal
  `SAMUEL_TECH_DEPLOY_READY` no PR #1.
- **Testes:** vitest 43/43; 4 QAs independentes com P0/P1 corrigidos (`desenvolvimento/jogos/minigolfe-dos-pets/qa/`);
  circuito completo por robô local e em produção; layout em 3 tamanhos; produção = bytes do Git; 4 jogos antigos idênticos.
- **Não executado:** aparelho real/FPS no celular, Safari, playtest com o Samuel.
- **Pendência de processo:** branch `publicacao` desatualizada até o merge do PR #1.
- **NEXT:** ler o parecer de EXP-01-F; corrigir P0/P1 se houver. Estado detalhado em `docs/jogos/minigolfe-dos-pets/ESTADO.md`.
  (Fila do plano principal continua em HO-010.)

## 2026-11-01 — Claude (ST-030)

- **Tarefa atual:** ST-030 — Definir interface e identidade dos dois jogos. **Concluída.**
- **Branch e commit:** `main` local, sem push (ver `git log`; commits ST-010, ST-020, ST-030).
- **Concluído:** `desenvolvimento/compartilhado/ui-blocos.css` (tokens do kit + componentes),
  `desenvolvimento/compartilhado/controles-toque.js` (joystick + ações com multitoque),
  `desenvolvimento/interface/prototipo.html` (15 telas de Hordas e Dungeons),
  `docs/samuel-tech/INTERFACE.md` (decisões, telas, cores do mundo, validação, skills).
- **Testes executados:** auditoria automática das 15 telas em 815×881, 375×812 e 812×375
  (rolagem, alvos ≥ 64 px, sobreposição HUD/controles) — tudo ok depois de 5 correções;
  contraste ≥ 6:1 em todos os pares; multitoque simulado com 3 dedos; blur solta tudo;
  `destruir()` remove ouvintes; P/Esc/1-2-3 no teclado; console limpo.
- **Não executado:** toque real em aparelho, iPhone/Android, leitor de tela, teste com criança.
- **Deploy e release:** nenhum. **Bloqueio real:** nenhum.
- **NEXT:** HO-010 — copiar `ui-blocos.css` e `controles-toque.js` para
  `_privado/jogos/hordas-dos-blocos/`, montar a arena com 1 herói, 1 arma, 1 inimigo a partir de
  `desenvolvimento/jogos/hordas-dos-blocos/upstream-voxel-survivors/` (sem GA, Three.js com
  versão exata), entrada `rascunho` no `jogos.json`, provar 90 s jogáveis e passar no
  `verificar_jogo.py`. ST-040 (manifesto de release + `release.json` no roteador local)
  continua Pronta e pode ser feita antes da publicação (HO-050).

## 2026-11-01 — Claude (ST-000, ST-010, ST-020)

- **Tarefa atual:** ST-020 — Preparar fonte, build e retomada de contexto.
- **Branch e commit:** `main`, à frente do `origin/main` (c6938cb) com os commits desta
  sessão; **sem push**. O site estático antigo está só na branch local `site-estatico` (0555a19).
- **Concluído nesta sessão:**
  - ST-000: inventário de rotas e publicação; produção = c6938cb; portal rodou em PHP 8.3
    (Docker) e os 4 jogos passaram no smoke local e em samuel.tech.
  - ST-010: DEC-007 (portal PHP é a linha canônica), DEC-008 (Hordas adapta
    voxel-survivors cf9f1fc, MIT), DEC-009 (Dungeons usa torchline-dungeon só como
    referência; sala de masmorra sobre o núcleo de blocos de Hordas).
  - ST-020: `desenvolvimento/` fora do pacote (README, `hordas-dos-blocos/ORIGEM.md`,
    cópia de referência do upstream), `ferramentas/verificar_jogo.py`, este arquivo,
    `README.md` desta pasta, links no `CLAUDE.md`, roteador local bloqueando `docs/` e
    `desenvolvimento/`.
- **Testes executados:** `verificar_jogo.py --todos` → 4 jogos ok; caso falso com CDN,
  `fetch` externo, caminho absoluto, `gtag`, oculto, link e `.exe` → 8 erros e saída 1;
  `demos/play` original do voxel-survivors → recusado por GA. Portal local: rotas 200,
  `_privado`/`_app`/`docs`/`desenvolvimento` = 403.
- **Não executado:** toque real e multitoque, iPhone/Safari, Android, tela cheia, som,
  FPS no aparelho de referência; wild-haggis-survivors (plano B) não foi rodado.
- **Deploy e release:** nenhum. **Revisão:** nenhuma pendente.
- **Bloqueio real:** nenhum.
- **Pendências conhecidas:**
  - `ferramentas/roteador-local.php` dá 403 para qualquer `.json`, então
    `/jogo/<slug>/release.json` falha localmente (resolver na ST-040).
  - A `nota` do `_app/jogos.json` ainda fala em "família logada" (acesso é livre).
- **NEXT:** ST-030 — definir menu, HUD, pausa e fim de Hordas e Dungeons com os tokens
  de `kit/brand/tokens.json`, só nas superfícies necessárias. Em paralelo possível: ST-040
  (manifesto de release + permitir `release.json` no roteador local).

## Outbox (sincronização pendente com o Notion)

Nada pendente.

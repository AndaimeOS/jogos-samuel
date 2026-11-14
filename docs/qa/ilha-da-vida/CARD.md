---
status: revisao
projeto: samuel.tech (AndaimeOS/jogos-samuel)
tipo: codigo + configuracao de infra (VPS) + publicacao
branch_policy: main do AndaimeOS (CLAUDE.md do projeto)
base_sha: a017c7cae8ea9033e7efb7c494eda7fec2942462
delivery_sha: preencher-no-commit
commit_policy: permitido (pedido "Publicar a ilha da vida real", 14/11/2026)
ciclos_consumidos: 2
autorizacao: Boaz, 14/11/2026 — "Testar o Luanti no navegador … crie um novo jogo, Ilha da vida … a senha é a mesma pros dois" e "Publicar a ilha da vida real"
max_ciclos: 5
---
# Ilha da Vida 0.1 — sobrevivência em blocos (Luanti + VoxeLibre) publicada no samuel.tech

## Objetivo
A família entra pelo card do portal, abre o cliente Luanti no navegador, digita apelido + senha da família (a mesma da
Ilha dos Blocos) e joga sobrevivência VoxeLibre num mundo persistente na VPS. Ninguém de fora entra sem a senha; sem chat.

## Contexto mínimo
- `CLAUDE.md`, `desenvolvimento/jogos/ilha-da-vida/README.md` (arquitetura, build, pendências).
- VPS: `luantiserver` 127.0.0.2:30000 (`ilha-da-vida.service`), ponte lwproxy 127.0.0.1:7777 (`ilha-da-vida-ponte.service`),
  nginx `:8443` `/vida/` (senha + origem) e `/vida/jogo/` (cliente estático, COOP/COEP).
- Segredo só na VPS: `/etc/nginx/segredos/ilha-vida-codigo.map`.

## Estado inicial
- `main` = `origin/main` = `a017c7c`. Preexistente não commitado: hunk da rota `/vida/` em
  `desenvolvimento/infra/vps/ilha-dos-blocos.nginx.conf` (desta mesma frente, sessão anterior).
- Baseline do verificador (`python3 ferramentas/verificar_jogo.py --todos`): falha só `mestre-do-cubo` (rascunho, links
  externos de crédito — pendência antiga, fora deste card).

## Pode alterar
- `_privado/jogos/ilha-da-vida/**`, `assets/img/ilha-da-vida.webp`, entrada `ilha-da-vida` em `_app/jogos.json`
- `desenvolvimento/jogos/ilha-da-vida/**`, `desenvolvimento/infra/vps/{ilha-da-vida*,lwproxy-samuel.patch,vida-backup.sh,ilha-dos-blocos.nginx.conf}`
- `ferramentas/verificar_jogo.py`: exceção declarada `navegacao_externa` (só `<a href target="_top">` para URL listada no catálogo)
- `docs/qa/ilha-da-vida/**`, `docs/samuel-tech/STATE.md`
- VPS: `/opt/vida/**`, units `ilha-da-vida*.service`, `/etc/nginx/conf.d/ilha-dos-blocos.conf`, cron do backup

## NÃO pode alterar
- Outros jogos, PHP do portal, regras do verificador para recurso carregado de fora, rastreadores.
- Ilha dos Blocos (rota `/ws/` precisa continuar 101). Segredo/senha em arquivo do repositório.
- DNS, faturamento, painel AMP.

## Critérios de aceite
| ID | Resultado observável | Como verificar | Esperado |
|---|---|---|---|
| C1 | Cliente carrega e entra no mundo com apelido + senha certa | navegador em `https://srv2114451.hstgr.cloud:8443/vida/jogo/` | jogo em pé (print) |
| C2 | Senha errada não entra | página do cliente + `curl` do upgrade em `/vida/?c=errada` | mensagem de senha errada; 403 |
| C3 | Origem estranha não entra | `curl -H 'Origin: https://exemplo.com'` em `/vida/` | 403 |
| C4 | Ilha dos Blocos intacta | upgrade em `/ws/?secret=<código>` com origem samuel.tech (`curl --http1.1`) | 101 (código errado: 403) |
| C5 | Servidor só local; sem chat | `ss -lunp` na VPS; `default_privs = interact` | só 127.0.0.2:30000 (loopback; ver mudança registrada); sem `shout` |
| C6 | Portal: card abre o cliente; verificador passa | `verificar_jogo.py ilha-da-vida` e `--todos`; portal local | ✓; só `mestre-do-cubo` falha (baseline) |
| C7 | Exceção do verificador é estreita | `python3 -I docs/qa/ilha-da-vida/casos_verificador.py <cópia> _privado/jogos/ilha-da-vida/index.html` (cópia mínima do repo no scratchpad): `_blank`, sem target, outra URL, prefixo, `<script src>`/`<iframe>` com a mesma URL, `style`/`onclick` externos na própria tag, tag dentro de `<script>`, `<link>` externo antes | card real passa; todos os negativos reprovam |
| C8 | Licenças e sem segredo no Git | `LICENCAS.txt`; `git grep -iF -f <(sed -n 2p ~/samuel-tech-ilha-codigo.txt)` + mesmo grep nos arquivos novos | créditos presentes; nenhum resultado |
| C9 | Produção = pacote liberado | zip publicado, `jogos.json` no ar com `ilha-da-vida` pronto, `/jogar/?jogo=ilha-da-vida` | 200 e bytes conferidos |

## Tentativas
| Ciclo | Falha/hipótese | Mudança | Evidência | Decisão |
|---|---|---|---|---|
| 1 | build WASM: `cannot compute sizeof (wchar_t)`; hipótese Node 24.11 < 24.18 | Node 24.22.3 | mesmo erro | refutada |
| 1 | `config.log`: conftest procura `libzstd.so` (zstd instalou .so; ligação dinâmica) | `-DZSTD_BUILD_SHARED=OFF` | libarchive OK | confirmada |
| 1 | libzip vira `.so` e falha (`recompile with -fPIC`); mesma causa | `-DBUILD_SHARED_LIBS=OFF` no libzip | build completo, `luanti.wasm` 13,9 MB | confirmada |
| 1 | cliente conecta e cai em "sendto going nowhere"; hipótese: emsocket trata 127.0.0.1 como servidor DENTRO do navegador | leitura de `webshims/src/emsocket` (`isLocalHost` = só INADDR_LOOPBACK) → servidor em `127.0.0.2`, ponte `udp_allow ["127.0.0.2:30000"]`, cliente `args.address='127.0.0.2'` | "TesteClaude entrou no jogo", mídia baixada, HUD pt_BR | confirmada |
| 1 | jogador de teste morto por Stalker em segundos na 1ª entrada | `only_peaceful_mobs = true` (decisão reversível, registrada no README) | servidor: "Modo pacífico ativado!" | aplicada |
| 1 | verificador recusa o link externo do card do portal | exceção estreita `navegacao_externa` (só `<a href target="_top">` para URL declarada no catálogo, só .html) | `ilha-da-vida` ✓; negativos reprovam (C7) | aplicada |
| 2 | REV-01 achado 1: exceção perdoava qualquer recurso externo cujo `<` anterior fosse o `<a>` permitido (style, onclick, texto dentro de `<script>`) | só perdoa quando o próprio match é o `href` da tag aberta em `ini` (sem `>` entre a tag e o match); casos novos no C7 | 14/14 casos ok (incl. `data-target`, `data-href` após REV-02); `--todos` = baseline | confirmada |
| 2 | REV-01 achado 3: `if … return 403` roda antes do `limit_req` (senha errada sem limite) | `map` origem+senha → destino (ponte 7777 ou 403 interno 127.0.0.1:7779); `proxy_pass http://$vida_destino/` (a ponte não recebe mais a senha) | 40 erradas seguidas: 403 até ~26, depois 503; certa 101; `/ws/` 101 | confirmada |
| 2 | REV-01 achado 4: `/opt/vida` era do `vida` e o root roda `/opt/vida/backup.sh` | `/opt/vida`, vida.conf, `games/`, `ponte-fonte/` → root; log em `/opt/vida/log/`; `ReadWritePaths` só `mundo`, `log`, caches | servidor de volta em 127.0.0.2:30000; `vida` não grava em `/opt/vida`, `www`, `games`; grava em `mundo`; backup ok | confirmada |
| 2 | REV-01 achados 5 e 6 | zona `vida_con` própria; `publicar-cliente.sh` usa o hostname (chave ED25519 conferida igual à do IP) | — | aplicada |

**Mudança registrada de requisito (C5):** o endereço do servidor passou de 127.0.0.1 para 127.0.0.2 por causa do emsocket
(acima). Continua loopback, inacessível de fora; o objetivo do critério (servidor só local) não mudou.

## Evidências do dev
Papel: o coordenador fez o dev nesta sessão (sem agente `dev-harness` separado — registrado como desvio do fluxo).
Medido em 14/11/2026 ~19:50 UTC.

- **C1** — via túnel SSH (`localhost:17777` → ponte da VPS), cliente 5.18-dev com servidor 5.10: "TesteClaude entrou no
  jogo", mídia do VoxeLibre baixada, HUD/menus em pt_BR, print de dia. O teste usou senha vazia temporária
  (`disallow_empty_password=false`) para não digitar a senha real num formulário; revertido e conferido: `true` no ar,
  TesteClaude removido de `auth.sqlite`, `players.sqlite` e `mod_storage`. Entrada com a senha real pelo portão de produção:
  **não executada pelo agente** (fica para o Boaz). Página de produção: `crossOriginIsolated=true`, botão habilitado após
  carregar o wasm.
- **C2** — página: senha errada → "Senha errada (ou servidor fora do ar)." `curl --http1.1` upgrade `/vida/?c=errada` → 403;
  sem `c` → 403; senha certa (origem samuel.tech ou da própria VPS) → 101. Comparação do nginx `map` é sem diferença de caixa.
- **C3** — `Origin: https://exemplo.com` com senha certa → 403; sem `Origin` → 403.
- **C4** — `/ws/?secret=<senha em minúscula>` origem samuel.tech → 101; `secret=errada` → 403. (Observação: o servidor da Ilha
  dos Blocos registra no journal o segredo errado em texto puro; um teste com a senha em maiúscula ficou no journal da VPS,
  que só o root lê. Pendência antiga, fora deste card.)
- **C5** — `ss -lunp`: só `127.0.0.2:30000` (luantiserver); `127.0.0.1:7777` (lwproxy); `vida.conf`: `default_privs = interact`,
  `server_announce = false`, `enable_pvp = false`, `disallow_empty_password = true`, `only_peaceful_mobs = true`.
- **C6** — `verificar_jogo.py ilha-da-vida` ✓ (aviso "navegação externa declarada: index.html:31"); `--todos` falha só
  `mestre-do-cubo` (baseline). Portal local (Docker `php:8.3-cli`): biblioteca lista o jogo e a capa; `/jogar/?jogo=ilha-da-vida`
  200; `/jogo/ilha-da-vida/index.html` 200, botão para `https://srv2114451.hstgr.cloud:8443/vida/jogo/` com `target=_top`;
  `LICENCAS.txt` 200; `/_privado/...` 403; capa 200. Layout conferido em 1280 px e 375×812.
- **C7** — casos negativos (`_blank`, sem target, outra URL, `<script src>` externo) reprovam.
- **C8** — `LICENCAS.txt` com Luanti, VoxeLibre, luanti-wasm, lwproxy; grep da senha (lida de fora do repo) sem resultado.
- Cliente estático: `/vida/jogo/` 200 com COOP/COEP/CORP e `X-Robots-Tag: noindex`; POST → 403; `luanti.wasm` 200
  `application/wasm`. Backup: `/opt/vida/backup.sh` (igual ao do repo) rodado à mão → tar.gz de 1,8 MB com todos os
  arquivos do mundo, pasta 700; cron `23 * * * *`.
- **C9** — depois do commit/publicação.

Ciclo 2 (após REV-01 REPROVADO): achados 1, 3, 4, 5 e 6 corrigidos (tabela de tentativas). Pendente fora do alcance do
agente: **C1 com a senha real pelo portão de produção** — o Boaz entra em `https://srv2114451.hstgr.cloud:8443/vida/jogo/`
e o resultado (data/hora, apelido, o que viu) é registrado aqui. Fora deste card: `/opt/ilha` tem o mesmo padrão de
permissão do achado 4 e o servidor da Ilha dos Blocos registra segredos errados no log.

## Revisão
- **REV-01 (ciclo 1, agente `revisor`, 14/11/2026): REPROVADO.** Bloqueantes: (1) exceção do verificador perdoava recurso
  externo na mesma tag/dentro de script; (2) C1 sem entrada real pelo portão. Não bloqueantes: (3) senha errada sem
  limite de taxa; (4) `/opt/vida` gravável pelo `vida` com script do root; (5) zona `limit_conn` compartilhada com `/ws/`;
  (6) IP/login no script. C2–C5, C8, repo = VPS e cron conferidos. O revisor registrou ter rodado por engano um
  `docker run --rm … cat` de leitura na VPS (sem efeito persistente).
- **REV-02 (ciclo 2, mesmo agente `revisor`, 14/11/2026): REPROVADO só por falta de evidência do C1** — sem defeito
  pendente. C2–C5, C7, C8, repo = VPS e as correções dos achados 1, 3–6 reproduzidos (rajada de 35 senhas erradas: 27×403
  e depois 503; senha certa 101 nas duas origens). C6 com portal só pela evidência do dev. Ressalvas não bloqueantes
  corrigidas em seguida: `data-target`/`data-href` não contam mais (casos novos, 14/14) e a tabela de tentativas emendada.
  Próximo passo: o Boaz faz o C1 com a senha real; registrado aqui, basta conferir o registro (sem nova revisão de código
  se nada mudar). Só então release/publicação do portal (C9).

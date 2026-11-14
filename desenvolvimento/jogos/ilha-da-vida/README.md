# Ilha da Vida — sobrevivência em blocos (Luanti + VoxeLibre)

Laboratório do modo sobrevivência pedido pelo Boaz em 14/11/2026 ("testar o Luanti no navegador … Ilha da Vida, a senha é a
mesma pros dois"). Não é Minecraft: motor **Luanti** (LGPL-2.1+) e jogo **VoxeLibre 0.92.3** (GPL-3 / CC BY-SA 4.0).
Eaglercraft foi recusado: é código e arte do Minecraft descompilados (já sofreu DMCA).

## Como as peças se ligam

```
samuel.tech/jogar/?jogo=ilha-da-vida  (card no portal, iframe)  ──botão──▶  página própria (fora do iframe)
                                                                              │
https://srv2114451.hstgr.cloud:8443/vida/jogo/   cliente Luanti em WebAssembly (nginx estático, COOP/COEP)
        │  wss://…:8443/vida/?c=<senha>      nginx: origem permitida + senha (mapa só na VPS) + limite por IP
        ▼
127.0.0.1:7777  ponte lwproxy (Docker, somente leitura, sem privilégios) — patch: só fala com 127.0.0.2:30000, JOIN desligado
        │ UDP
        ▼
127.0.0.2:30000 luantiserver 5.10 (pacote Debian, usuário vida, systemd) + VoxeLibre, mundo em /opt/vida/mundo
```

- O cliente precisa de `SharedArrayBuffer` (página com isolamento entre origens). Dentro do iframe do `/jogar/` isso exigiria
  mudar os cabeçalhos do portal; por isso o card do portal só tem um botão que abre a página do cliente (`target=_top`).
- A senha da família (minúscula, igual à da Ilha dos Blocos) abre a ponte e também vira a senha da conta do apelido no
  servidor (o Luanti registra o apelido na primeira entrada). Ninguém de fora entra sem a senha.
- Sem chat: `default_privs = interact` (não tem `shout`). Sem lista pública (`server_announce = false`). Sem PvP.
- **Endereço 127.0.0.2, não 127.0.0.1:** no emsocket (webshims) `127.0.0.1` é o servidor rodando DENTRO do navegador
  (`VirtualSocket::sendto` → "sendto going nowhere"); qualquer outro endereço vai pela ponte. O servidor escuta em
  `127.0.0.2` (continua loopback, inacessível de fora) e a ponte só libera `127.0.0.2:30000`.
- **Permissões na VPS:** `/opt/vida` é do root (vida.conf, `games/`, `www/`, `backup.sh`, `backups/`); o serviço roda como
  `vida` e só escreve em `mundo/`, `log/` e nos caches (`ReadWritePaths`). Assim um servidor comprometido não troca o
  script que o cron do root executa nem a página do cliente.
- **Senha errada também tem limite:** no nginx, origem + senha escolhem o destino por `map` (ponte ou 403 interno) em vez de
  `if … return 403`, que rodaria antes do `limit_req`. A ponte recebe só `/`, sem a senha na URL.
- **Monstros desligados** (`only_peaceful_mobs = true`): no teste de 14/11/2026 um Stalker explodiu o jogador em
  segundos na primeira entrada (bosque escuro perto do ponto de chegada). Fome, dano, queda, dia/noite continuam.

## Arquivos

| Onde | O quê |
|---|---|
| `cliente/index.html` | Página do cliente em português (substitui o `index.html` de demonstração do luanti-wasm) |
| `_privado/jogos/ilha-da-vida/` | Card do portal (botão) e `LICENCAS.txt` |
| `desenvolvimento/infra/vps/ilha-da-vida.conf` | `/opt/vida/vida.conf` |
| `desenvolvimento/infra/vps/ilha-da-vida.service`, `ilha-da-vida-ponte.service` | units systemd |
| `desenvolvimento/infra/vps/lwproxy-samuel.patch`, `ilha-da-vida-ponte.settings.toml` | patch e config da ponte |
| `desenvolvimento/infra/vps/vida-backup.sh` | `/opt/vida/backup.sh` (cron de hora em hora, 3 dias) |
| `desenvolvimento/infra/vps/ilha-dos-blocos.nginx.conf` | rotas `/vida/` e `/vida/jogo/` |

Segredo fora do Git: `/etc/nginx/segredos/ilha-vida-codigo.map` (pasta 700) com a senha aceita em `?c=`.

## Compilar o cliente (WebAssembly)

Fonte: `paradust7/luanti-wasm` `5bfae52` (fork `paradust7/luanti` `6f532b5`, emsdk 6.0.8). Num Mac (arm64), em Docker:

1. `Dockerfile` de build: `ubuntu:22.04` + `build-essential cmake python3 git zip zstd gettext tclsh` + **Node ≥ 24.18**
   (tarball oficial; usado 24.22.3), depois `./install_emsdk.sh` e `./build_all.sh`.
2. Correções necessárias (bibliotecas compartilhadas viram padrão no CMake deste emscripten) — `build_zstd.sh`: `-DZSTD_BUILD_SHARED=OFF -DZSTD_BUILD_PROGRAMS=OFF`. Sem isso o zstd instala
   `libzstd.so`, o `-lzstd` do libarchive liga dinâmico e o `configure` falha com "cannot compute sizeof (wchar_t)"
   (o programa de teste não acha o `.so`). `build_libzip.sh`: `-DBUILD_SHARED_LIBS=OFF` (sem isso: `relocation … recompile with -fPIC`).
3. Saída em `www/`: `index.html` + pasta da versão (`luanti.js`, `luanti.wasm`, `launcher.js`, `worker.js`, `packs/`).
   Trocar o `index.html` pelo `cliente/index.html` deste diretório (o build troca `%__RELEASE_UUID__%` pela pasta da versão).
4. Publicar: `desenvolvimento/jogos/ilha-da-vida/publicar-cliente.sh` (extrai `www/` da imagem, troca o `index.html`,
   envia para `/opt/vida/www/`; o nginx serve em `/vida/jogo/`).

## Pendências conhecidas

- Toque/celular: o Luanti tem controles de toque, mas o laboratório foi pensado para computador.
- Mídia do VoxeLibre vai pelo próprio protocolo (UDP pela ponte) na primeira entrada; se ficar lento, avaliar
  `remote_media` por HTTP no nginx.
- Contas: a senha da família é a mesma para todos os apelidos (qualquer pessoa da família entra em qualquer apelido).

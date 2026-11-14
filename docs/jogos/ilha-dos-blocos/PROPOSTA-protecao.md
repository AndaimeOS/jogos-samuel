# Proposta — proteger a Ilha sem pedir código à criança

Proposta apenas. Nada disto está implementado. A VPS não foi alterada e não deve ser
alterada até o Boaz dizer sim. A branch só tira a tela em que um adulto digitava o código.

## Como o código é usado hoje

O código da ilha é a chave do mundo multiplayer. Não é login: não há nome, e-mail nem
dado pessoal. Ele não está no Git. Em produção fica só em `/opt/ilha/ilha.env` (root,
modo 600). Decisão de referência: DEC-013.

### Cliente

Arquivo: `desenvolvimento/jogos/ilha-dos-blocos/cliente/src/main.ts`.

1. A chave `samuel:ilha-dos-blocos:codigo` no `localStorage` deste aparelho guarda o
   código depois da primeira entrada que deu certo.
2. Na hora de conectar, o cliente escolhe, nesta ordem: `?codigo=` (só no `npm run dev`;
   o build publicado não lê a query), o valor guardado, `ilha-local` (só no dev) ou
   vazio (build publicado sem nada guardado).
3. Antes de entrar de verdade, `testarCodigo` abre um WebSocket em `{servidor}ws/?secret=<código>`
   e espera 8 segundos. Se abrir, o código serviu. Se falhar, um GET em `{servidor}saude`
   separa “servidor no ar, mas recusou” de “servidor fora”.
4. Se o teste passa, `@voxelize/core` 3.0.0 faz `network.connect(servidor, { secret })` e
   `network.join('ilha')`. O core também manda o mesmo `secret` na query do WebSocket.
5. O endereço de produção é fixado no build por `VITE_ILHA_SERVIDOR`
   (`https://srv2114451.hstgr.cloud:8443/`). `?servidor=` só existe no dev.

A tela removida era o cartão `tInicio` em `cliente/index.html`: o campo “Código da ilha”
(`#campoCodigo`, placeholder “peça para um adulto”) e o link “trocar o código da ilha”.
Os dois ficavam no mesmo cartão do botão “Entrar na ilha”. Sem código guardado, o campo
aparecia e o botão não seguia enquanto estivesse vazio.

### Servidor (código no repositório, binário na VPS)

Arquivo: `desenvolvimento/jogos/ilha-dos-blocos/servidor/src/main.rs`.

- `ILHA_SEGREDO` é a chave. Se a variável não existe, o padrão é `ilha-local`.
- Essa string vai para o Voxelize em `Server::new().secret(&segredo)`. O motor compara
  com o `secret` da query. Diferente: a conexão fecha com permissão negada (403).
  Igual: entra no mundo `ilha`.
- Um segredo vazio no Voxelize vira “aceitar `secret=` vazio”. A trava `conferir_segredo`
  impede o processo de subir assim em produção: com `ILHA_PRODUCAO` definida, ou escutando
  fora de `127.0.0.1`, o processo sai com código 2 se o segredo estiver vazio, for
  `ilha-local` ou tiver menos de 12 caracteres. O systemd está com
  `RestartPreventExitStatus=2`, então um segredo fraco não reinicia em laço.

### VPS (não foi mexida)

Arquivos de referência em `desenvolvimento/infra/vps/`. O que está rodando é o que foi
instalado na publicação; este repositório não altera a máquina.

- Serviço `ilha-dos-blocos`, usuário `ilha`, escuta só `127.0.0.1:4100`.
- `EnvironmentFile=/opt/ilha/ilha.env` traz o `ILHA_SEGREDO`. `ILHA_PRODUCAO=1`.
- nginx na porta 8443, com TLS. Só passam três rotas: `/ws/` (Origin `https://samuel.tech`
  ou `https://www.samuel.tech`, 60 requisições por minuto com rajada de 20, no máximo 6
  conexões por IP), `/registry/` (GET) e `/saude` (GET). O resto responde 404.
- O access log do nginx está desligado para a query do WebSocket (ela carrega o código)
  não ir parar em arquivo.

O filtro de Origin não autentica a família. Qualquer página servida em samuel.tech — e
hoje a Ilha está `pronto`, então qualquer visita — pode abrir o WebSocket. Quem não está
no navegador ainda pode mentir o cabeçalho Origin. A chave continua sendo o `secret`.

O portal e a VPS são máquinas diferentes. O cookie do site (samuel.tech) não viaja no
WebSocket para `srv2114451.hstgr.cloud`. `jogo.php` hoje só entrega o arquivo estático
(`readfile`); não injeta segredo.

## O que esta branch muda — e o risco até a proteção nova

A tela some. O botão “Entrar na ilha” fica no cartão, com as dicas de controle. A criança
não digita nada.

O cliente **ainda envia** um código que este aparelho já tenha guardado. Assim, o
computador ou o celular em que um adulto já entrou uma vez continua conseguindo falar com
a VPS atual. Não há mais botão para trocar ou apagar esse valor.

Aparelho novo, outro navegador, aba anônima ou site data limpo: o build publicado manda
`secret` vazio. **A VPS recusa.** O Voxelize compara com o `ILHA_SEGREDO` real, que não é
vazio, e fecha o WebSocket. O cliente mostra “A ilha não abriu agora”. A criança não entra.
Não existe mais campo para um adulto digitar o código e destravar esse aparelho.

Isso é falha fechada, não mundo aberto:

- Publicar este cliente sem mudar a VPS **não** deixa a ilha pública. Quem não manda o
  código certo continua do lado de fora.
- O prejuízo é o contrário: aparelho sem código guardado não joga, e ninguém consegue
  informar o código pela tela.
- Se o código da VPS for trocado, os aparelhos que guardaram o código antigo também passam
  a ser recusados, e a tela não oferece outro caminho.
- Esvaziar `ILHA_SEGREDO` para “o cliente novo entrar” abriria o mundo: o Voxelize aceita
  `secret` vazio quando o servidor foi configurado com segredo vazio. A trava
  `conferir_segredo` deve continuar. Não apagar o `.env` para compensar a tela.

Enquanto esta branch não for publicada, samuel.tech segue com a tela antiga. O risco de
aparelho travado só começa no deploy, que esta tarefa não faz.

O dev local não muda de contrato: `npm run dev` ainda usa `ilha-local` (ou `?codigo=`),
que é o padrão do `cargo run` sem `ILHA_SEGREDO`.

## Opções (nenhuma implementada)

Critério comum: a criança só toca em “Entrar na ilha”; o adulto configura fora do jogo;
sem conta da criança, sem nome, e-mail, chat ou ranking; o segredo longo não volta para o
Git; o motor Voxelize só compara **um** `secret`, então lista de aparelhos ou token
assinado precisa ser resolvida no nginx (ou num proxy na frente), não dentro do
`Server::secret`.

### 1. Aparelho autorizado pelo adulto + token curto no nginx (recomendada)

O adulto entra em `/admin` (senha que já existe, cookie assinado, 30 minutos) **naquele
aparelho** e aperta “Este aparelho pode entrar na ilha”. O PHP grava um cookie longo,
opaco, `Secure` e `HttpOnly`, sem texto para a criança ler.

Quando `jogo.php` entrega o `index.html` da Ilha, se o cookie confere, a página recebe um
token curto (validade de poucas horas, HMAC). O cliente manda só esse token no WebSocket.
O nginx confere a assinatura e o prazo e, se estiver certo, encaminha ao Voxelize já com
o `ILHA_SEGREDO` de verdade. O navegador nunca vê a chave longa. A chave HMAC fica só em
`samuel-config.php` (Hostinger, fora do público) e em `/opt/ilha/ilha.env`.

- Prós: a criança não digita nem vê código; a chave longa não sai da VPS; token roubado
  no HTML expira; o Voxelize e o binário podem ficar como estão; encaixa no `/admin` que
  já existe; dá para revogar trocando a chave HMAC ou a versão do cookie.
- Contras: portal e VPS precisam da mesma chave, combinada à mão uma vez; um cookie
  copiado para outro navegador entra até expirar ou até a revogação; XSS em samuel.tech
  ainda leria o token curto da página (hoje um XSS já lê o código no `localStorage`);
  `jogo.php` deixa de ser `readfile` puro para o HTML da Ilha — o cuidado é não alterar
  os outros jogos.
- Esforço: médio. Muda `jogo.php` (só o HTML da Ilha), uma ação no `/admin`, o cliente
  (ler o token injetado em vez do campo) e o nginx da VPS (conferir e reescrever o
  `secret`). Não precisa mudar o Rust se a reescrita ficar no nginx. Exige o sim do Boaz
  e um passo manual nas duas máquinas. Não é só um arquivo.

### 2. Link de convite

No `/admin`, o adulto gera um link `https://samuel.tech/jogar/?jogo=ilha-dos-blocos&convite=…`.
Abrir o link no aparelho da criança grava o mesmo cookie da opção 1 e tira o convite da
barra de endereço. Nas próximas vezes a criança só toca em Entrar.

- Prós: o adulto não precisa entrar no `/admin` dentro do aparelho da criança, se preferir
  mandar o link (QR na tela dele, AirDrop). A criança continua sem digitar. Dá para ser de
  uso único: o primeiro acesso queima o convite e fica o cookie.
- Contras: link vaza por histórico, captura de tela e encaminhamento; quem receber o link
  antes de queimar entra. O resto (HMAC, nginx, chave fora do Git) é o mesmo da opção 1.
- Esforço: médio, um pouco acima da opção 1 (emissão e queima do convite no PHP). Mesmas
  duas máquinas.

### 3. Allowlist de aparelhos

Cada aparelho ganha um identificador aleatório. A VPS guarda a lista dos aceitos. O adulto
autoriza aparelho por aparelho. Dá para tirar um aparelho perdido sem trocar a chave de
todo mundo.

- Prós: revogação fina; um aparelho não carrega a chave da família inteira.
- Contras: o Voxelize não aceita vários `secret`; a lista tem de viver no nginx ou num
  processo na frente. Hostinger não enxerga o disco da VPS, então autorizar exige um
  canal novo (API mínima na VPS, autenticada com a senha do responsável, ou o adulto cola
  o identificador por SSH). Identificador no JavaScript ainda é furtável por XSS. A lista
  precisa entrar no backup.
- Esforço: alto. Serviço ou configuração nova na VPS, mais o portal, mais operação. Só
  vale se a revogação por aparelho for requisito. Pode ser uma segunda etapa em cima da
  opção 1.

### 4. Reusar a sessão do site

Não serve como está. Jogar é livre: a criança não tem conta. O cookie de explorador
(`samuel_perfil`) só separa favoritos. O modo responsável dura 30 minutos dentro do cookie
assinado do site, e esse cookie não é enviado à VPS, que é outro host. Prender a Ilha a
esses 30 minutos faria a criança cair no meio da construção.

- Prós: não criaria senha nova; a assinatura HMAC do portal já existe.
- Contras: não há sessão de criança para reusar; 30 minutos é curto demais; o cookie não
  atravessa até a VPS sozinho. No fim seria a opção 1 com outro nome, e com prazo pior se
  alguém reutilizasse o `adm` sem criar um cookie próprio da ilha.
- Esforço: baixo se fosse só “exigir o modo responsável”, e o resultado seria ruim. Médio
  se virasse a opção 1.

### 5. Allowlist de IP no nginx

O nginx só aceitaria o IP da casa. Sem `secret` no navegador.

- Prós: a criança não vê nada; mudança pequena no nginx; o Voxelize pode continuar com a
  chave, ou a chave fica só entre nginx e o processo local.
- Contras: IP de casa muda; celular na rede móvel sai por CGNAT compartilhado com
  desconhecidos (liberar esse IP abre a ilha para outros clientes da operadora); viagem,
  escola e o Wi-Fi de outra casa ficam de fora; visitante na mesma rede entra. IP não é
  segredo.
- Esforço: baixo para escrever a regra, alto para operar. Não recomendada como trava única.

## O que não fazer

- Não colocar o `ILHA_SEGREDO` no JavaScript, no Git ou no `jogos.json`.
- Não esvaziar o segredo da VPS para o cliente sem tela conseguir entrar.
- Não publicar esta branch antes de escolher e instalar a proteção. Até lá, o site no ar
  deve continuar com o cliente que ainda tem a tela, senão aparelho novo fica na mensagem
  “A ilha não abriu agora” sem um adulto poder digitar o código.

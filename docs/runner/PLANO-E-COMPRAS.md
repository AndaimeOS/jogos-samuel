# Corrida 3D (runner) — plano e lista de compras

Decisões do Boaz (2026-11-01): primeiro jogo "de qualidade" = **corrida infinita 3D**, original (gênero runner, não cópia
de jogo comercial), **no samuel.tech em celular e PC**, orçamento de arte **até US$500**. Infra: só GitHub por enquanto.

## Por que os jogos atuais parecem "feios"

A arte é toda **desenhada por código** (Dragões & Blocos: um HTML de 21 KB só com retângulos; Minigolfe e Ilha: texturas e
bichos gerados em canvas). Falta o que dá cara de jogo de loja: modelos 3D profissionais, animação de personagem, som e
"juice" (partículas, câmera que balança, menus que pulam). O runner é o primeiro jogo feito com **pacotes de arte comprados**
e direção visual única; depois o mesmo pipeline refaz Dragões & Blocos.

## Ideia do jogo (proposta, original)

**"Corrida do Jack"**: uma criança (personagem estilizado do pacote, sem foto nem nome real) corre por uma cidadezinha
colorida com o **Jack Russell e o gato amarelo** do kit. 3 faixas; deslizar ↔ troca de faixa, ↑ pula, ↓ abaixa; moedas
(ossinhos), obstáculos (cercas, carrinhos, caixas), ímã e skate de power-up, missões curtas, recorde por perfil.
Sem anúncio, sem loja, sem chat; perder é leve (volta em 1 toque). Teclado no PC, deslizar no celular.

Tecnologia: **Three.js + TypeScript + Vite** (o que já usamos no Minigolfe), modelos convertidos de FBX para **GLB** no
Blender, compressão de textura e malha, meta **≥ 30 FPS no celular** e carga inicial ≤ 8 MB.

## Lista de compras proposta (≈ US$315–415 de US$500) — preços conferidos em 2026-11-01, podem mudar

| # | Item | Para quê | Preço | Licença (resumo) |
|---|---|---|---|---|
| 1 | **Synty POLYGON – Town Pack** ([loja](https://syntystore.com/products/polygon-town-pack)) | Cidade inteira: 125 prédios, 412 objetos, 99 cenários, 9 personagens, 8 veículos | **US$49,99** (compra única) | One-Time Purchase EULA: uso perpétuo em videogames, "não limitado por motor, sistema ou plataforma"; 5 vagas de equipe; proibido revender os arquivos, usar em ferramentas de criar jogos, metaverso e treino de IA |
| 2 | **Jack Russell + gato amarelo em estilo low-poly, com animações** (correr, pular, abaixar, comemorar) | Os pets do kit no estilo Synty | **≈ US$120–250** (encomenda a artista 3D, ex.: Fiverr/ArtStation) ou ≈ US$10–40 num pacote de pets estilizado (perde a identidade) | Encomenda com cessão de direitos para o samuel.tech |
| 3 | **Música + efeitos sonoros casual** (ex.: WOW Sound "Casual Game Happy Music Bundle", 35 músicas + 55 efeitos) | Trilha alegre e sons de moeda, pulo, batida | **≈ US$95** (ou Construct "Playful": US$19 por jogo / US$89 ilimitado) | Royalty-free, licença vitalícia; conferir o texto antes de comprar |
| 4 | **Pacote de interface casual** (botões, ícones, painéis) | Menus e HUD bonitos | **≈ US$15–30** (ou Kenney UI grátis) | Comercial |
| — | **Mixamo** (Adobe) | Animações da criança (correr, pular, deslizar) | **Grátis** | Uso comercial dentro do jogo; não distribuir os arquivos soltos |
| — | **Kenney / Quaternius** | Complementos (moedas, power-ups, partículas) | **Grátis** | CC0 (Quaternius: conferir a licença atual de cada pacote) |
| — | Folga para promoções e um 2º pacote Synty se faltar algo | | ≈ US$85–185 | |

Antes de publicar: e-mail curto ao suporte da Synty confirmando jogo de navegador (o EULA não fala de web por nome; a
leitura é que "jogo em qualquer plataforma" cobre, com os modelos convertidos dentro do jogo).

**Quem compra:** o Boaz (cartão dele). Depois põe os arquivos baixados numa pasta (ex.: `~/Downloads/runner-assets/`) e eu
converto, otimizo e registro cada licença em `docs/runner/RECURSOS.md`. Para converter preciso instalar o **Blender**
(grátis, ~300 MB, `brew install --cask blender`) — com o seu ok.

## Onde comprar (links diretos) e conectores

| # | O que comprar | Onde | Conector MCP |
|---|---|---|---|
| 1 | POLYGON – Town Pack, compra única (US$49,99) | https://syntystore.com/products/polygon-town-pack — botão de compra única ("One Time Purchase Licence"), não a assinatura | não existe; compra no site |
| 2 | Jack Russell + gato amarelo low-poly animados (encomenda) | **Upwork** (https://www.upwork.com) ou Fiverr: https://www.fiverr.com/search/gigs?query=low%20poly%20animated%20dog%203d | **Upwork MCP** (conectar pelo botão do app); com ele eu redijo o pedido e listo artistas, e **você aprova** cada contratação |
| 3 | Música + efeitos (≈ US$95) | https://wowsoundbundles.sellfy.store/p/casual-game-happy-music-bundle (alternativa barata: https://construct.net/game-assets/sounds/music/casual-game-music-pack-playful-317) | não existe; compra no site |
| 4 | Interface | Grátis e suficiente para começar: https://kenney.nl/assets/ui-pack | — |
| — | Animações da criança | https://www.mixamo.com (conta Adobe gratuita) | (existe um conector Adobe, mas o Mixamo não faz parte dele) |
| — | Conversor de modelos | Blender https://www.blender.org/download/ — eu instalo com `brew install --cask blender` com o seu ok | — |
| — | GitHub | dar escrita a `AndaimeOS` em https://github.com/WeBoaz/jogos-samuel/settings/access | o conector GitHub desta sessão pede login pelo app (`/mcp` no terminal) |

Depois de comprar: baixe os arquivos para `~/Downloads/runner-assets/` (uma subpasta por pacote) e me avise; eu leio as
licenças que vêm junto, converto e registro em `docs/runner/RECURSOS.md`.

## GitHub (o que precisa de você)

A conta desta máquina (**AndaimeOS**) só tem leitura em `WeBoaz/jogos-samuel`, e o PR
[#1](https://github.com/WeBoaz/jogos-samuel/pull/1) (33 commits, sem conflito) espera merge. Escolha um:

1. **Dar escrita** (recomendado): GitHub → `WeBoaz/jogos-samuel` → Settings → Collaborators → *Add people* → `AndaimeOS`
   → papel **Write**. Eu aceito o convite, faço o merge e passo a trabalhar direto no repositório.
2. Ou você mesmo faz o merge do PR #1 pelo botão "Merge pull request".

Depois do merge: regenerar a branch `publicacao` e, quando quiser (fora do escopo autorizado hoje), publicação automática
por GitHub Actions, subdomínios `teste.` / `servidor.`, alerta e backup fora da VPS.

## Etapas do runner (cada uma com revisão antes de publicar)

1. **Trecho jogável com arte provisória grátis** (enquanto a compra não chega): faixas, troca de faixa, pulo, abaixar,
   obstáculos, moedas, câmera, toque e teclado, 30 FPS no celular.
2. **Arte comprada**: cidade Synty, pets, criança com Mixamo, som, interface; direção visual e "juice".
3. **Conteúdo**: power-ups, missões, recordes por perfil, telas da casa.
4. **QA** (REV-01, QA-UX no toque, QA-PERF no celular) → publicação → teste em aparelho real com o Samuel.

# Reino dos Blocos

Plataforma do Samuel. O arquivo que roda no site é `_privado/jogos/reino-dos-blocos/index.html`. Os números ajustáveis ficam em `regras.js`, no mesmo lugar. Tudo que entrou nesta leva está marcado como **provisório** — a arte final vem depois e reaproveita os sprites que já existem.

## O que mudou (incrementos 1 a 3)

O modo **Normal** não mudou de balanceamento. O playtest terminou as 3 fases, achou a dificuldade na medida e juntou os 9 cristais. O teste `modo Normal permanece o de hoje` trava esses números e o desenho das fases.

**Doguinho.** Perto de um cristal que ainda não foi pego, ele para, late uma vez e aponta (distância horizontal provisória: 6 blocos no Normal, 10 no Fácil). Também caminha um trecho curto em direção a cristais e moedas (estrelas) próximos. Ele não pega o item no lugar da criança, não move o herói, não derrota inimigo e não entra no portal. O latido sai só com o som ligado. Não fica em loop: cada cristal e cada moeda geram uma pista por visita à fase.

**Fácil.** Além dos 5 corações, inimigos mais lentos e em menor número, pulo com mais tempo no ar (mesma força, gravidade menor), coiote e pulo guardado maiores, plataformas de mão única mais largas onde havia espaço, bandeiras mais perto e o Doguinho dando mais pistas. Na queda (buraco ou água) ele devolve a criança ao último chão firme sem tirar coração. O botão do modo descreve isso.

**Fase bônus.** O menu mostra `💎 x/9`. O quarto cartão, Festa do Gatinho, abre só com 9 de 9. A fase tem 120 blocos, só peças que já existiam, chão contínuo (sem espinho, água, geleia ou abelha). O Gatinho fica no portal. No fim, a tela de festa.

## Save

Continua em `localStorage`, chave `reino:progresso`. Cada fase guarda `completou`, `cristais`, `tempo` e `estrelas`. Cristal já marcado como achado continua valendo: ao terminar de novo, os dois vetores se juntam com “ou”. A conta dos 9 lê só as fases 0, 1 e 2. A festa é a fase 3 e não soma cristal.

## Números provisórios (Normal → Fácil)

| Constante | Normal (hoje) | Fácil |
|---|---:|---:|
| Geleias (px/s) | 28 | 18 |
| Abelha, ritmo horizontal | 1,1 | 0,75 |
| Abelha, ritmo vertical | 2,6 | 1,77 |
| Coiote (s) | 0,1 | 0,16 |
| Pulo guardado (s) | 0,13 | 0,20 |
| Gravidade subindo | 1050 | 860 |
| Gravidade caindo | 1850 | 1500 |
| Faixa de flutuação (px/s) | 45 | 70 |
| Fator de flutuação | 0,5 | 0,35 |
| Força do pulo | 392 | 392 |
| Corações no começo | 3 | 5 |
| Teto do coração achado | 4 | 6 |
| Pista do cristal (blocos) | 6 | 10 |
| Busca de moeda (blocos) | 3 | 5 |
| Espera entre moedas (s) | 8 | 3,5 |
| Doguinho busca na queda | não | sim |
| Inimigos mantidos | todos | 1 a cada 2 |
| Plataforma mais larga (blocos) | 0 | 1 |
| Bandeira extra a cada (blocos) | — | 40 |

A fase bônus tem 120 blocos nos dois modos. Para mudar um número, edite `BALANCO` em `regras.js`.

## Testes

```bash
cd desenvolvimento/jogos/reino-dos-blocos
npm test
python3 ferramentas/verificar_jogo.py --todos
```

`window.__reino` existe para o robô de teste (`robo = true` e `simular(segundos)`). Não aparece em botão nenhum.

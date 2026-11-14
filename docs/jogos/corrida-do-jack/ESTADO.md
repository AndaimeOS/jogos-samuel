# Estado — Corrida do Jack (runner 3D)

- Slug: `corrida-do-jack` (ainda fora do catálogo; local) · Data: 2026-11-01 (-03:00)
- Plano, decisões e compras: `docs/runner/PLANO-E-COMPRAS.md`
- Etapa atual: **etapa 1 — trecho jogável com arte provisória em código: feito (local)**. Etapa 2 espera as compras.
- Fonte: `desenvolvimento/jogos/corrida-do-jack/` (Three.js 0.170 + TS + Vite; build em `_privado/jogos/corrida-do-jack/`)

## O que funciona

3 faixas; deslizar ← → (celular) ou ← → / A D (PC) troca de faixa; ↑ / W / espaço pula; ↓ / S abaixa (no ar, desce
rápido); barreira baixa (pular), arco (abaixar), carrinho (trocar de faixa); moedas em fileira e em arco; velocidade
crescente; modos **Com ajuda** (até 15 m/s + 1 escudo com 2 s de invencibilidade) e **Desafio** (até 22 m/s); pista por
semente com regra de justiça (nunca 3 carrinhos e nunca 2 carrinhos vizinhos: de qualquer faixa basta uma troca);
recorde por perfil e modo (`samuel:corrida-do-jack:<perfil>:v1`); pausa (II, P, Esc, troca de aba); telas da casa;
câmera ajustada para celular em pé; `?debug` (`window.__corrida`) e `?fps`.

## Evidência

| Verificação | Resultado |
|---|---|
| `vitest` | 19/19 — semente, justiça da pista (300 sementes), espaço entre fileiras, faixas, pulo, queda rápida, 9 combinações obstáculo × ação, escudo, moedas, velocidade e marcos |
| `tsc --noEmit` | ok |
| iPhone 13 emulado (WebKit) | deslizar ←, ↑, ↓ funcionam; HUD cabe; pausa 64 px; sem erros |
| Computador | teclas funcionam; jogador automático (`tests/robo-jogador-automatico.cjs`) aguenta 6×90 s no Desafio (1678 m a 22 m/s) |
| Desempenho (Mac) | 163–182 chamadas de desenho (cenário fundido por cor; eram 639) |

## Não feito / próximos

- Arte comprada (cidade Synty, Jack e gato encomendados, criança com Mixamo), som, partículas e "juice" (etapa 2).
- Power-ups, missões, QA formal, publicação (etapas 3–4). Celular real: não testado.

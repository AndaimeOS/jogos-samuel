# Planeta do Samuel

Versão 0.3.0. O que roda é `_privado/jogos/planeta-do-samuel/index.html`,
empacotado por `desenvolvimento/jogos/motor-hordas` (`npm run build` lá).

Vista de cima, horda e cartas no motor da partida solo (código MIT de Pedro
Barretto). Três eras, três fases cada, a terceira é chefe, e o farol no fim.
O dedo move, o botão Ação solta o especial. No Fácil a vida não zera e o
Samuel não volta ao começo.

Os sprites de personagem, comuns e chefes estão em `arte/sprites/<id>/`
(Walk, Idle, Hurt, Sumico, retrato). O resto da interface ainda é o
placeholder. Respostas ao Gerador: `../motor-hordas/RESPOSTAS-GERADOR.md`.

## Testes

```bash
cd desenvolvimento/jogos/planeta-do-samuel
npm test
python3 ferramentas/verificar_jogo.py --todos
```

`window.__planeta` existe para o robô. O save é `planeta-do-samuel:save`,
`schemaVersion` 2.

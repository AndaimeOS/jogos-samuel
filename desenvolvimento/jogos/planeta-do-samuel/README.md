# Planeta do Samuel

Proposta 0.1.0. O arquivo que roda é `_privado/jogos/planeta-do-samuel/index.html`.
Os números ajustáveis ficam em `regras.js`, todos marcados como **PROPOSTA**.

Vista de cima, em pixel, pensada para o tablet deitado. Três idades (Pedra, Bronze
e Ferro) até acender o farol. Juntar, entregar nas estações (contador x/N) e
pesquisar a idade seguinte. A noite só escurece. A fogueira aquece e ilumina.
Fome e calor descem devagar. No Fácil não há derrota: no zero, o passo só fica lento.
Setas apontam o próximo passo.

## Testes

```bash
cd desenvolvimento/jogos/planeta-do-samuel
npm test
python3 ferramentas/verificar_jogo.py --todos
```

`window.__planeta` existe para o robô de teste. Não aparece em botão nenhum.

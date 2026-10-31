# Jogos do Samuel

Site estático publicado em samuel.tech.

- `index.html` — página inicial "🎮 Jogos do Samuel".
- `dragoes-e-blocos/` — jogo Dragões & Blocos (samuel.tech/dragoes-e-blocos).
- `lab/` — laboratório do Boaz (samuel.tech/lab): protótipos e experimentos, fora da página do Samuel.

Sem build: cada jogo é um HTML único. Para testar localmente:

```bash
python3 -m http.server 8765
```

Para adicionar um jogo, copie `.claude/skills/jogos-samuel/references/template.html` para uma pasta nova como `index.html` e crie um cartão na página inicial.

Regras para agentes em `AGENTS.md`; skills de game design em `.claude/skills/` (origem e licença em `.claude/skills/THIRD-PARTY.md`).

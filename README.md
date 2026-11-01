# Jogos do Samuel

Site estático publicado em samuel.tech.

- `index.html` — página inicial "🎮 Jogos do Samuel".
- `aventura-pula-pula/` — plataforma em 3 fases (Phaser).
- `bichos-contra-a-gosma/` — horda com bichinhos, 3 minutos (Phaser).
- `dragoes-e-blocos/` — jogo Dragões & Blocos (samuel.tech/dragoes-e-blocos).
- `vendor/` — Phaser 4.2.1 e a fonte Kenney Future, servidos pelo próprio site.
- `lab/` — laboratório do Boaz (samuel.tech/lab): protótipos e experimentos, fora da página do Samuel.

Sem build: cada jogo é um HTML único. Para testar localmente:

```bash
python3 -m http.server 8765
```

Para adicionar um jogo, copie `.claude/skills/jogos-samuel/references/template.html` para uma pasta nova como `index.html` e crie um cartão na página inicial.

Regras para agentes em `AGENTS.md`; skills de game design em `.claude/skills/` (origem e licença em `.claude/skills/THIRD-PARTY.md`).

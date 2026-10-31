# Skills de terceiros

As 77 skills e o `router` desta pasta vêm de
[gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills),
licença Apache-2.0 (texto em `LICENSE.awesome-gamedev-agent-skills`, avisos em
`NOTICE.awesome-gamedev-agent-skills`).

- Commit fixado: `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` (2026-10-28).
- Copiadas sem nenhuma alteração (conferido com `diff -r` contra o commit). O `router` fica
  em `router/`, igual ao original. Mudanças da casa vão nas skills próprias, nunca nestas.
- Revisão antes da cópia: Markdown sem instruções fora de game design; os 9 scripts Python
  não acessam a rede. O único que apaga algo (`ebitengine-game/scripts/package_macos_app.py`)
  só substitui um `.app` que ele mesmo gerou, com `--force`. `create-game-assets` pede
  `Pillow` (instalar só no laboratório, quando necessário).

Skills próprias (não vêm do pacote): `jogos-samuel`, `design-infantil`,
`multiplayer-familia`.

## Para que serve cada grupo aqui

| Grupo | Jogos do Samuel | Laboratório (`lab/`) |
|---|---|---|
| disciplines (game-feel, ui-ux, input, audio, level, save, camera, physics, performance, procedural, game-ai, ai-behavior-trees, dialogue, shaders, create-game-assets) | sim, traduzidas para canvas (`jogos-samuel/references/receitas-canvas.md`) | sim |
| genres: platformer, puzzle, tower-defense, card-game | sim | sim |
| genres: fps-shooter, survival-crafting, roguelike, rpg, visual-novel | só ideias compatíveis com `design-infantil` | sim |
| web-engines (Phaser, PixiJS, three.js) | só com decisão do Boaz | sim |
| godot, unity, unreal, ebitengine, bevy, pygame, love2d, defold, roblox | não | sim (web export para publicar) |
| workflows: prototype-fast, game-jam | sim | sim |
| workflows: itch-publish, steam-publish | não | só com pedido explícito |
| router | não (use `jogos-samuel`) | ponto de entrada |

## Atualizar

Atualização é manual, nunca automática (nada de `npx skills add` ou `claude plugin install`
apontando para o `main`):

1. Clone o repositório numa pasta temporária e veja `git log` desde o commit fixado.
2. Leia o diff (procure scripts novos, comandos, URLs, instruções fora do escopo de game
   design).
3. Copie só as pastas revisadas, atualize o commit fixado aqui e faça commit separado.

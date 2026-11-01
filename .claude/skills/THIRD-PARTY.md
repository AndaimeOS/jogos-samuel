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

## Outras fontes

| Skill | Origem | Licença | Commit fixado |
|---|---|---|---|
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT | `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62` |
| `web-design-guidelines-snapshot/command.md` | [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | MIT | `434b7f91364665f2f733b310ec54809bf8f37937` |
| `threejs-game-director`, `threejs-gameplay-systems`, `threejs-aaa-graphics-builder`, `threejs-game-ui-designer`, `threejs-qa-release`, `threejs-debug-profiler`, `threejs-image-generator`, `threejs-3d-generator`, `threejs-audio-generator` | [majidmanzarpour/threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) | MIT (`LICENSE.threejs-game-skills`) | `8286774b22a2566bf894dbc825825c16921866af` |

- `web-design-guidelines` manda baixar as regras online a cada revisão; aqui usamos a cópia
  fixada em `web-design-guidelines-snapshot/command.md` (instrução de terceiros não se
  atualiza sozinha).
- `threejs-*`: só para o laboratório. Os geradores chamam APIs pagas (Tripo, Gemini,
  ElevenLabs) e `probe_asset_credentials.sh` inspeciona variáveis de chave; não rodar sem
  pedido explícito.
- Não instaladas: `opusgamelabs/game-creator` (sem licença no repositório; só referência de
  leitura).

## Arte, fontes e bibliotecas dos jogos

- Kenney (CC0): New Platformer Pack 1.1, Animal Pack Remastered, Particle Pack, UI Pack
  (fonte Kenney Future), Interface Sounds, Music Jingles. Cada pasta `assets/` traz o
  `License.txt` do pacote usado.
- Phaser 4.2.1 (MIT) em `vendor/phaser-4.2.1/`, do npm, integridade conferida com o sha512
  publicado.

Skills próprias (não vêm do pacote): `jogos-samuel`, `design-infantil`,
`multiplayer-familia`, `survivors-like`.

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

# Receitas em canvas + JavaScript

As skills vendorizadas (`game-feel`, `platformer`, `physics-tuning`, `save-systems`,
`input-systems`, `camera-systems`) explicam o porquê com exemplos em Godot/Unity. Aqui está o
mesmo padrão no formato da casa (`update(dt)` muda o estado, `draw()` só lê). Os nomes batem
com o `template.html`.

## Tremor de tela por "trauma" (game-feel, padrão 1)

Golpes somam trauma; o tremor é `trauma²` e decai sozinho. Mexa no desenho, nunca no corpo.

```js
function addTrauma(a) { s.trauma = Math.min(1, s.trauma + a); }      // pequeno 0.15, médio 0.4, grande 0.8
// update(dt):
s.trauma = Math.max(0, s.trauma - dt * 1.5);
s.shakeT += dt * 30;
// draw(), antes de desenhar o mundo:
const k = s.trauma * s.trauma * 10;                                   // até 10 px lógicos
ctx.translate(k * Math.sin(s.shakeT * 1.7), k * Math.sin(s.shakeT * 2.3)); // seno, não random
```

Para criança, mantenha o máximo baixo (≤ 10 px) e ofereça desligar se ficar exagerado.

## Hit-stop (congelar um instante no impacto)

```js
// update(dt), no início:
if (s.freeze > 0) { s.freeze -= dt; updateEffects(dt); return; }     // efeitos seguem, lógica para
// no impacto grande (chefão, explosão), nunca em toda batida:
s.freeze = Math.max(s.freeze || 0, 0.08);
```

## Squash & stretch com volta elástica (o "pulinho")

```js
// no evento: achata um eixo, estica o outro
p.sx = 1.25; p.sy = 0.8;
// update(dt): volta para 1 (exponencial, independente do FPS)
const k = 1 - Math.exp(-dt * 12);
p.sx += (1 - p.sx) * k; p.sy += (1 - p.sy) * k;
// draw(): ctx.translate(p.x, p.y); ctx.scale(p.sx, p.sy); desenhar centrado na base
```

## Easing para animações de UI e entradas

```js
const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),                               // "assentar"
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } // "pop"
};
// tween simples: guarde {t0, dur, from, to} e calcule from + (to - from) * ease.outBack(min(1, (agora - t0) / dur))
```

## Partículas e texto flutuante

Já estão no template (`burst`, `floatText`). Limite: ~200 partículas vivas; acima disso
reaproveite (pool) ou reduza `n`. Cores do evento: dourado = ponto, verde = cura, branco = poder.

## Pulo gostoso: coyote time + buffer + pulo variável (platformer)

```js
const G = 2200, JUMP_V = 820, COYOTE = 0.12, BUFFER = 0.15;
// update(dt):
p.coyote = p.onGround ? COYOTE : p.coyote - dt;                      // ainda pode pular logo após sair da borda
p.buffer = jumpPressedThisFrame ? BUFFER : p.buffer - dt;            // aperto um pouco antes de tocar o chão vale
if (p.buffer > 0 && p.coyote > 0) { p.vy = -JUMP_V; p.buffer = 0; p.coyote = 0; sfx.jump(); }
if (!jumpHeld && p.vy < 0) p.vy *= 0.5;                               // soltou cedo → pulo baixo
p.vy = Math.min(p.vy + G * (p.vy > 0 ? 1.6 : 1) * dt, 1400);         // cai mais rápido do que sobe
```

Para 7 anos: coyote e buffer generosos (0.12–0.15 s), plataformas largas, nada de pulo
pixel-perfeito.

## Passo fixo para física que precisa ser estável (physics-tuning)

```js
const STEP = 1 / 120; let acc = 0;
// loop: acc += dt; while (acc >= STEP) { update(STEP); acc -= STEP; }
```

Use quando houver quicar, empilhar ou colisão rápida atravessando paredes. Também é a base
para multiplayer determinístico (ver `multiplayer-familia`).

## Colisão simples

```js
const hitAABB = (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
const hitCircle = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.r + b.r) ** 2;
```

Hitbox do jogador **menor** que o desenho e do item coletável **maior**: o jogo parece justo
para a criança.

## Entrada: toque, teclado e gamepad (input-systems)

- Pointer Events cobrem mouse e toque. Para "arrastar para mover", siga `targetX` com
  suavização (template). Para botões virtuais, zonas grandes nos cantos inferiores (≥ 80 px
  lógicos) com retorno visual ao apertar.
- Ações, não teclas: `const act = { left: keys.arrowleft || keys.a, jump: keys[' '] || keys.arrowup || keys.w }`.
- Gamepad opcional: `navigator.getGamepads()[0]` lido no `update`; botão 0 = ação, eixo 0 = andar.

## Câmera que segue (camera-systems)

```js
cam.x += (p.x - W / 2 - cam.x) * (1 - Math.exp(-dt * 6));           // segue suave
cam.x = Math.max(0, Math.min(worldW - W, cam.x));                      // não mostra fora do mundo
// draw(): ctx.translate(-Math.round(cam.x), 0) antes do mundo; HUD depois de restaurar
```

## Salvar com versão (save-systems)

```js
const SAVE_V = 2;
function loadSave() {
  const d = store.get('save', null);
  if (!d) return { v: SAVE_V, best: 0, unlocked: 1 };
  if (d.v === 1) { d.unlocked = 1; d.v = 2; }                          // migração explícita
  return d;
}
```

Salve só em momentos claros (fim de fase, recorde), nunca a cada quadro.

## Dificuldade em rampa (level-design)

`dificuldade = base + tempoOuFase * passo`, com teto. Alterne tensão e respiro: depois de
um pico (chefão, onda grande), 5–10 s calmos com recompensa. Introduza uma ideia nova por
vez, primeiro num lugar seguro, depois combinada com as anteriores.

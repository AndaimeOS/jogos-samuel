# Metro Dash

![Metro Dash menu](public/assets/metro-dash-menu.png)

Metro Dash is a polished 3D endless runner built for the browser. Guide Rook through a bright urban rail yard, switch between three lanes, clear obstacles, collect power-ups, finish missions, and turn every run into permanent progress.

[Play Metro Dash](https://frankstop.github.io/MetroDash/)

## What is included

- Responsive three-lane running with keyboard, swipe, double-tap, and on-screen controls
- Jump, roll, lane-switch, stumble, shield, and hoverboard mechanics
- Modular track chunks, eight obstacle types, coin paths, and escalating difficulty
- Coin magnet, score multiplier, super sneakers, shield, and hoverboard power-ups
- Missions, XP, levels, high scores, cosmetics, currency, and a daily route
- Main menu, tutorial, pause, settings, locker, results, and replay flow
- Music and responsive sound effects generated through the Web Audio API
- Local save data with no account required
- Installable PWA with an offline-ready application shell
- Reduced motion, screen-shake, contrast, handedness, sensitivity, and audio settings

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move left or right | `A` / `D` or arrow keys | Swipe left or right |
| Jump | `W`, `Space`, or Up Arrow | Swipe up |
| Roll | `S` or Down Arrow | Swipe down |
| Activate hoverboard | `Shift` | Double tap |
| Pause | `Escape` | Pause button |

Optional on-screen controls are available on touch devices.

## Technology

- TypeScript
- Three.js and WebGL
- Vite
- Web Audio API
- Vite PWA and Workbox
- Vitest
- GitHub Pages

The simulation runs at a fixed 120 Hz step while rendering through `requestAnimationFrame`. Track sections and game objects are recycled to keep per-frame work predictable.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Production checks

```bash
npm test
npm run build
npm run preview
```

The production build is written to `dist/`.

## Project documentation

- [Game and visual design](docs/DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Test plan](docs/TEST_PLAN.md)

## License

Released under the [MIT License](LICENSE).

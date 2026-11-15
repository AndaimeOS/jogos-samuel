// O WebKit do Playwright só publica o toque de um instante (tap). O navegador
// também aceita Input.dispatchTouchEvent (toque preso, arraste, soltar). Isto
// liga esse comando para o teste poder arrastar as hastes com o dedo de verdade,
// sem mouse. Idempotente: rodar de novo não duplica o trecho.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);

function trocar(arquivo, antigo, novo) {
  const texto = fs.readFileSync(arquivo, 'utf8');
  if (texto.includes(novo)) return;
  if (!texto.includes(antigo)) {
    throw new Error(`não achei o trecho para o arraste por toque em ${arquivo}`);
  }
  fs.writeFileSync(arquivo, texto.replace(antigo, novo));
}

export function habilitarArrasteWebKit() {
  const raiz = require.resolve('playwright-core/package.json').replace(/package\.json$/, '');
  trocar(
    raiz + 'lib/server/webkit/wkInput.js',
    `  async tap(progress, x, y, modifiers) {
    await progress.race(this._pageProxySession.send("Input.dispatchTapEvent", {
      x,
      y,
      modifiers: toModifiersMask(modifiers)
    }));
  }
}`,
    `  async tap(progress, x, y, modifiers) {
    await progress.race(this._pageProxySession.send("Input.dispatchTapEvent", {
      x,
      y,
      modifiers: toModifiersMask(modifiers)
    }));
  }
  async touch(progress, type, touchPoints) {
    await progress.race(this._pageProxySession.send("Input.dispatchTouchEvent", {
      type,
      touchPoints
    }));
  }
}`,
  );
  trocar(
    raiz + 'lib/server/input.js',
    `  async tap(progress, x, y) {
    if (!this._page.browserContext._options.hasTouch)
      throw new Error("hasTouch must be enabled on the browser context before using the touchscreen.");
    await this._raw.tap(progress, x, y, this._page.keyboard._modifiers());
  }
}`,
    `  async tap(progress, x, y) {
    if (!this._page.browserContext._options.hasTouch)
      throw new Error("hasTouch must be enabled on the browser context before using the touchscreen.");
    await this._raw.tap(progress, x, y, this._page.keyboard._modifiers());
  }
  async gesture(progress, points) {
    if (!this._page.browserContext._options.hasTouch)
      throw new Error("hasTouch must be enabled on the browser context before using the touchscreen.");
    if (!points?.length) return;
    const id = 1;
    const pt = (p) => ({ x: Math.round(p.x), y: Math.round(p.y), id });
    await this._raw.touch(progress, "touchStart", [pt(points[0])]);
    for (let i = 1; i < points.length; i++)
      await this._raw.touch(progress, "touchMove", [pt(points[i])]);
    await this._raw.touch(progress, "touchEnd", [pt(points[points.length - 1])]);
    await this._raw.touch(progress, "touchCancel", []);
  }
}`,
  );
  trocar(
    raiz + 'lib/server/dispatchers/pageDispatcher.js',
    `  async touchscreenTap(params, progress) {
    progress.metadata.point = { x: params.x, y: params.y };
    await this._page.touchscreen.tap(progress, params.x, params.y);
  }
`,
    `  async touchscreenTap(params, progress) {
    progress.metadata.point = { x: params.x, y: params.y };
    await this._page.touchscreen.tap(progress, params.x, params.y);
  }
  async touchscreenGesture(params, progress) {
    progress.metadata.point = { x: params.points[0].x, y: params.points[0].y };
    await this._page.touchscreen.gesture(progress, params.points);
  }
`,
  );
  trocar(
    raiz + 'lib/protocol/validator.js',
    `import_validatorPrimitives.scheme.PageTouchscreenTapResult = (0, import_validatorPrimitives.tOptional)((0, import_validatorPrimitives.tObject)({}));
`,
    `import_validatorPrimitives.scheme.PageTouchscreenTapResult = (0, import_validatorPrimitives.tOptional)((0, import_validatorPrimitives.tObject)({}));
import_validatorPrimitives.scheme.PageTouchscreenGestureParams = (0, import_validatorPrimitives.tObject)({
  points: (0, import_validatorPrimitives.tArray)((0, import_validatorPrimitives.tObject)({
    x: import_validatorPrimitives.tFloat,
    y: import_validatorPrimitives.tFloat
  }))
});
import_validatorPrimitives.scheme.PageTouchscreenGestureResult = (0, import_validatorPrimitives.tOptional)((0, import_validatorPrimitives.tObject)({}));
`,
  );
}

export async function arrastar(page, x0, y0, x1, y1) {
  const points = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    points.push({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n });
  }
  await page._channel.touchscreenGesture({ points });
}

const { webkit, devices } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
(async () => {
  const b = await webkit.launch(); const r = {};
  // 1) celular em pé: deslizar troca de faixa, pula e abaixa
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message.slice(0, 100)));
  await p.goto('http://localhost:5195/?debug');
  r.dicaToque = await p.isVisible('.dica-icones.so-toque');
  await p.tap('#bCorrer'); await p.waitForTimeout(300);
  const deslizar = (dx, dy) => p.evaluate(async ({ dx, dy }) => { const c = document.getElementById('jogo'); const x0 = innerWidth / 2, y0 = innerHeight * 0.6;
    const ev = (t, x, y) => c.dispatchEvent(new PointerEvent(t, { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    ev('pointerdown', x0, y0); for (let i = 1; i <= 5; i++) { ev('pointermove', x0 + dx * i / 5, y0 + dy * i / 5); await new Promise((f) => setTimeout(f, 16)); } ev('pointerup', x0 + dx, y0 + dy); }, { dx, dy });
  await deslizar(-80, 0); await p.waitForTimeout(250);
  r.faixaDepoisEsquerda = await p.evaluate(() => window.__corrida.corrida.jogador.faixa);
  await deslizar(0, -80); await p.waitForTimeout(120);
  r.pulou = await p.evaluate(() => window.__corrida.corrida.jogador.y > 0.3);
  await p.waitForTimeout(800);
  await deslizar(0, 80); await p.waitForTimeout(80);
  r.abaixou = await p.evaluate(() => window.__corrida.corrida.abaixado);
  await p.screenshot({ path: process.argv[2] + '/celular.png' });
  r.layoutCelular = await p.evaluate(() => { const q = [...document.querySelectorAll('.hud-corrida .painel, #bPausa')].map((e) => e.getBoundingClientRect()); return { cabe: q.every((x) => x.right <= innerWidth && x.left >= 0), pausaPx: Math.round(document.getElementById('bPausa').getBoundingClientRect().width) }; });
  r.errosCelular = erros;
  // 2) computador: teclas + jogador automático por 60 s de corrida no modo desafio
  const d = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await d.goto('http://localhost:5195/?debug');
  await d.click('[data-modo="desafio"]'); await d.click('#bCorrer'); await d.waitForTimeout(200);
  await d.keyboard.press('ArrowRight'); await d.waitForTimeout(250);
  r.teclaDireita = await d.evaluate(() => window.__corrida.corrida.jogador.faixa);
  r.robo = await d.evaluate(() => {
    const C = window.__corrida; const c = C.corrida; const FX = [-2.2, 0, 2.2];
    const decidir = () => {
      const j = c.jogador; const perto = c.obstaculos.filter((o) => o.z + 3.5 > c.z && o.z - c.z < c.vel * 0.55 + 2);
      const naFaixa = perto.find((o) => o.faixa === j.faixa);
      if (!naFaixa) return;
      if (naFaixa.tipo === 'baixo' && j.noChao && naFaixa.z - c.z < c.vel * 0.3 + 1) return c.pular();
      if (naFaixa.tipo === 'alto' && !c.abaixado && naFaixa.z - c.z < c.vel * 0.3 + 1) return c.abaixar();
      if (naFaixa.tipo === 'bloco') {
        const livre = [j.faixa - 1, j.faixa + 1].filter((f) => f >= 0 && f <= 2).find((f) => !c.obstaculos.some((o) => o.faixa === f && o.tipo === 'bloco' && o.z + 3.5 > c.z - 1 && o.z - c.z < 6));
        if (livre !== undefined) return livre < j.faixa ? c.esquerda() : c.direita();
      }
    };
    let t = 0; while (t < 60 && c.estado === 'correndo') { decidir(); C.avancar(1 / 30); t += 1 / 30; }
    return { segundos: +t.toFixed(1), estado: c.estado, metros: c.distancia, moedas: c.moedas, vel: +c.vel.toFixed(1), drawCalls: C.cena.info().calls };
  });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });

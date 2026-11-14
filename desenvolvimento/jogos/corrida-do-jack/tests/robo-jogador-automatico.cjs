const { webkit } = require('/Users/boaz_mac/Workspace/02_ANDAIME/Andaime-Gestao-V2/node_modules/playwright-core');
(async () => { const b = await webkit.launch(); const d = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage();
  await d.goto('http://localhost:5195/?debug'); await d.click('[data-modo="desafio"]'); await d.click('#bCorrer'); await d.waitForTimeout(200);
  const out = await d.evaluate(() => {
    const C = window.__corrida; const resultados = [];
    for (let rodada = 0; rodada < 6; rodada++) {
      C.nova(); const c = C.corrida;
      const decidir = () => {
        const j = c.jogador; const perto = c.obstaculos.filter((o) => o.z + 3.5 > c.z && o.z - c.z < c.vel * 0.55 + 2);
        const naFaixa = perto.find((o) => o.faixa === j.faixa); if (!naFaixa) return;
        const d = naFaixa.z - c.z;
        if (naFaixa.tipo === 'baixo' && j.noChao && d < c.vel * 0.3 + 1) return c.pular();
        if (naFaixa.tipo === 'alto' && !c.abaixado && d < c.vel * 0.3 + 1) return c.abaixar();
        if (naFaixa.tipo === 'bloco') {
          // prefere faixa sem nada perto; senão faixa com obstáculo pulável/abaixável
          const vizinhas = [j.faixa - 1, j.faixa + 1].filter((f) => f >= 0 && f <= 2);
          const nada = vizinhas.find((f) => !c.obstaculos.some((o) => o.faixa === f && o.z + 3.5 > c.z - 1 && o.z - c.z < 8));
          const semBloco = vizinhas.find((f) => !c.obstaculos.some((o) => o.faixa === f && o.tipo === 'bloco' && o.z + 3.5 > c.z - 1 && o.z - c.z < 8));
          const f = nada ?? semBloco; if (f !== undefined) return f < j.faixa ? c.esquerda() : c.direita();
        }
      };
      let t = 0, ultimoPerto = null;
      while (t < 90 && c.estado === 'correndo') { decidir(); const perto = c.obstaculos.filter((o) => Math.abs(o.z - c.z) < 4).map((o) => `${o.faixa}${o.tipo}@${(o.z - c.z).toFixed(1)}`); if (perto.length) ultimoPerto = perto; C.avancar(1 / 30); t += 1 / 30; }
      const fileira = c.obstaculos.filter((o) => Math.abs(o.z - c.z) < 6).map((o) => `${o.faixa}:${o.tipo}`);
      resultados.push({ s: +t.toFixed(0), estado: c.estado, m: c.distancia, vel: +c.vel.toFixed(1), faixa: c.jogador.faixa, y: +c.jogador.y.toFixed(2), abaixado: c.abaixado, fileira, ultimoPerto });
    }
    return resultados; });
  console.log(JSON.stringify(out, null, 0)); await b.close(); })();

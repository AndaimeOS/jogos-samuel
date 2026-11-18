// Copa dos Blocos no WebKit, perfil iPad (geração 7), só toque.
// node desenvolvimento/jogos/turbo-dos-blocos/tests/copa-ipad.mjs
// --rapido: uma corrida cronometrada em vez das seis.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, webkit } from 'playwright';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../../..');
const arte = '/opt/cursor/artifacts';
const porta = 8794;
const origem = `http://127.0.0.1:${porta}`;
const direto = `${origem}/jogo/turbo-dos-blocos/index.html`;
const jogar = `${origem}/jogar/?jogo=turbo-dos-blocos`;
const ipad = devices['iPad (gen 7)'];
const rapido = process.argv.includes('--rapido');
const falhas = [];

function afirmar(cond, msg) {
  if (!cond) {
    falhas.push(msg);
    console.error('FALHA:', msg);
  }
}

function portaAberta() {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tentar = () => {
      const s = createConnection({ port: porta, host: '127.0.0.1' }, () => { s.end(); resolve(); });
      s.on('error', () => {
        if (++n > 50) reject(new Error('o portal PHP não subiu'));
        else setTimeout(tentar, 100);
      });
    };
    tentar();
  });
}

function contexto(browser, largura, altura) {
  return browser.newContext({
    ...ipad,
    viewport: { width: largura, height: altura },
  });
}

function ouvir(page, erros) {
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const texto = msg.text();
    if (/favicon|net::ERR|audio device/i.test(texto)) return;
    erros.push(texto);
  });
}

async function abrir(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__turbo && window.__turbo.estado.fase === 'menu');
}

async function tiro(page, nome) {
  await page.screenshot({ path: path.join(arte, nome) });
  console.log('print', nome);
}

async function esperarFim(page, ms) {
  const inicio = Date.now();
  let ultimo = '';
  while (Date.now() - inicio < ms) {
    const agora = await page.evaluate(() => {
      const e = window.__turbo.estado;
      return { fase: e.fase, volta: e.eu && e.eu.volta, tempo: e.tempo, pos: e.eu && Math.round(e.eu.progresso) };
    });
    const linha = `${agora.fase} volta=${agora.volta} t=${agora.tempo.toFixed(1)} prog=${agora.pos}`;
    if (linha !== ultimo && Math.floor((Date.now() - inicio) / 15000) !== Math.floor((Date.now() - inicio - 500) / 15000)) {
      console.log('  ', linha);
      ultimo = linha;
    }
    if (agora.fase === 'fim') return agora;
    await page.waitForTimeout(500);
  }
  throw new Error('a corrida não terminou a tempo');
}

async function corridaReal(page, id) {
  await page.evaluate((pista) => {
    const t = window.__turbo;
    t.menu();
    t.estado.modo = 'facil';
    t.estado.pistaChave = pista;
    t.estado.emCopa = false;
  }, id);
  await page.locator(`[data-pista="${id}"]`).tap();
  await page.locator('[data-modo="facil"]').tap();
  await page.locator('#btnCorrer').tap();
  await page.waitForFunction(() => window.__turbo.estado.fase === 'contagem' || window.__turbo.estado.fase === 'corrida');
  const relogio = Date.now();
  await esperarFim(page, 240000);
  await page.waitForSelector('#telaFim:not([hidden])', { timeout: 8000 });
  const med = await page.evaluate(() => ({
    id: window.__turbo.estado.pistaChave,
    tempo: window.__turbo.estado.eu.tempoFinal,
    fps: window.__turbo.fps(),
    quadros: window.__turbo.estado.quadrosCorrida,
    recorde: JSON.parse(localStorage.getItem('turbo:recorde:' + window.__turbo.estado.pistaChave) || 'null'),
  }));
  med.parede = (Date.now() - relogio) / 1000;
  console.log('corrida', med.id, 'tempo', med.tempo.toFixed(2), 'fps', med.fps.toFixed(1), 'parede', med.parede.toFixed(1));
  await page.locator('#btnOutra').tap();
  await page.waitForFunction(() => window.__turbo.estado.fase === 'menu');
  return med;
}

async function copaPulada(page, lugar, modo, aoMostrar) {
  await page.evaluate(({ modo }) => {
    const melhor = window.__turbo.estado.copa.trofeu;
    localStorage.removeItem('turbo:copa');
    window.__turbo.estado.copa = { i: 0, pontos: {}, piloto: null, modo: null, ativa: false, trofeu: melhor, ultimo: null };
    window.__turbo.estado.modo = modo;
    window.__turbo.estado.piloto = 'samuel';
    window.__turbo.menu();
  }, { modo });
  await page.locator(`[data-modo="${modo}"]`).tap();
  await page.locator('#btnCopa').tap();
  await page.waitForFunction(() => window.__turbo.estado.fase === 'contagem' || window.__turbo.estado.fase === 'corrida');
  const tabelas = [];
  for (let n = 0; n < 6; n++) {
    const ok = await page.evaluate((lugar) => window.__turbo.pularCorrida(lugar), lugar);
    afirmar(ok === true, `pularCorrida na etapa ${n + 1} não rodou`);
    await page.waitForSelector('#telaFim:not([hidden])', { timeout: 8000 });
    const tela = await page.evaluate(() => ({
      titulo: document.getElementById('fimTitulo').textContent,
      info: document.getElementById('fimInfo').textContent,
      trofeu: document.getElementById('fimTrofeu').innerText,
      tabela: [...document.querySelectorAll('#podio li')].map((li) => li.innerText.replace(/\s+/g, ' ').trim()),
      proxima: !document.getElementById('btnProxima').hidden,
      copa: window.__turbo.copa,
    }));
    tabelas.push(tela);
    if (aoMostrar) await aoMostrar(n, tela);
    if (n < 5) {
      afirmar(tela.proxima, `faltou o botão Próxima corrida depois da corrida ${n + 1}`);
      afirmar(tela.tabela.length === 6, `a tabela da corrida ${n + 1} não tem 6 pilotos`);
      await page.locator('#btnProxima').tap();
      await page.waitForFunction(() => window.__turbo.estado.fase === 'contagem' || window.__turbo.estado.fase === 'corrida');
    }
  }
  return tabelas;
}

async function printsDasPistas(page, sufixo) {
  const ids = await page.evaluate(() => window.__turbo.PISTAS.map((p) => p.id));
  for (const id of ids) {
    await page.evaluate((pista) => { window.__turbo.construir(pista); window.__turbo.enquadrar('pista'); }, id);
    await page.waitForTimeout(400);
    await tiro(page, `turbo-copa-pista-${id}-${sufixo}.png`);
  }
  await page.evaluate(() => { window.__turbo.construir('ilha'); window.__turbo.enquadrar('piloto'); });
  await page.waitForTimeout(400);
  await tiro(page, `turbo-copa-samuel-${sufixo}.png`);
  await page.evaluate(() => window.__turbo.menu());
}

async function fluxoDireto(page, sufixo, opcoes) {
  const erros = [];
  ouvir(page, erros);
  await abrir(page, direto);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__turbo && window.__turbo.estado.fase === 'menu');
  await page.evaluate(() => { document.getElementById('telaInicio').scrollTop = 0; });
  await tiro(page, `turbo-copa-menu-${sufixo}.png`);
  const menu = await page.evaluate(() => ({
    primeiro: document.querySelector('#telaInicio button').id,
    copa: document.getElementById('btnCopa').textContent,
    pistas: [...document.querySelectorAll('#selPista [data-pista]')].map((b) => b.dataset.pista),
    textos: [...document.querySelectorAll('#selPista small')].map((s) => s.textContent),
    nomes: window.__turbo.PISTAS.map((p) => p.nome),
  }));
  afirmar(menu.primeiro === 'btnCopa', 'o primeiro botão do menu não é a Copa: ' + menu.primeiro);
  afirmar(menu.copa.includes('Copa dos Blocos'), 'o botão da Copa não anuncia a Copa: ' + menu.copa);
  afirmar(menu.pistas.length === 6, 'o menu não listou 6 pistas');
  afirmar(menu.pistas.join() === 'ilha,estrelas,ilha-contrario,estrelas-espelho,ilha-lua,grande-final', 'ordem das pistas: ' + menu.pistas.join());
  afirmar(menu.textos.every((t) => /dia · cachoeiras|noite · cristais/.test(t)), 'texto da pista ficou fixo ou vazio: ' + menu.textos.join(' | '));
  afirmar(!menu.textos.some((t) => t.includes('recorde')), 'recorde apareceu sem corrida');

  if (opcoes.auditar) {
    const rel = await page.evaluate(() => window.__turbo.auditarTodas());
    for (const r of rel) {
      console.log('auditoria', r.id, r.ok ? 'ok' : JSON.stringify(r.problemas), 'fecha', r.fecha.toFixed(2));
      afirmar(r.ok, `${r.nome} não passou na auditoria: ${JSON.stringify(r.problemas)}`);
      afirmar(r.placas === 3, `${r.nome} não tem 3 placas`);
      afirmar(r.estrelas === 18, `${r.nome} não tem 18 estrelas`);
    }
    await page.evaluate(() => window.__turbo.menu());
  }

  const roupa = await page.evaluate(() => {
    const sam = window.__turbo.estado.karts.find((k) => k.id === 'samuel');
    const hex = [];
    sam.grupo.traverse((o) => { if (o.material && o.material.color) hex.push(o.material.color.getHex()); });
    return { hex, corKart: sam.corKart, roupa: window.__turbo.ROUPA_SAMUEL, blusa: window.__turbo.BLUSA_SAMUEL };
  });
  afirmar(roupa.hex.includes(0x8d9397), 'a camiseta não está no cinza #8D9397');
  afirmar(roupa.hex.includes(0xc8cdcf), 'a blusa amarela não virou cinza-claro #C8CDCF');
  afirmar(!roupa.hex.includes(0xff7a2e), 'ainda há jaqueta laranja 0xff7a2e no Samuel');
  afirmar(!roupa.hex.includes(0xffd23f), 'ainda há blusa amarela 0xffd23f no Samuel');
  afirmar(roupa.corKart === 0xff9d52, 'o kart do Samuel não ficou laranja antes do ouro');

  await printsDasPistas(page, sufixo);

  if (opcoes.lugar) {
    const tabelas = await copaPulada(page, opcoes.lugar, 'facil', async (n) => {
      if (n === 0) await tiro(page, `turbo-copa-tabela-${sufixo}.png`);
      if (n === 5) await tiro(page, `turbo-copa-trofeu-${sufixo}.png`);
    });
    const meio = tabelas[0];
    afirmar(meio.titulo.includes('corrida 1 de 6'), 'título da tabela: ' + meio.titulo);
    const linhaSamuel = meio.tabela.find((l) => l.includes('Samuel'));
    afirmar(linhaSamuel && linhaSamuel.includes(opcoes.lugar === 1 ? '10 pts' : '1 pts'), 'pontos do Samuel: ' + meio.tabela.join(' / '));
    const fim = tabelas[5];
    afirmar(!fim.proxima, 'a última corrida ainda oferece Próxima corrida');
    afirmar(fim.trofeu.includes(opcoes.trofeu), 'troféu errado: ' + fim.trofeu);
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem('turbo:copa')));
    afirmar(salvo && salvo.trofeu === opcoes.salvo, 'turbo:copa não guardou o troféu ' + opcoes.salvo + ': ' + JSON.stringify(salvo && salvo.trofeu));
    afirmar(salvo.ativa === false, 'a Copa continuou ativa depois da 6ª');
    if (opcoes.lugar === 1) {
      const ouro = await page.evaluate(() => {
        const sam = window.__turbo.estado.karts.find((k) => k.id === 'samuel');
        const hex = [];
        sam.grupo.traverse((o) => { if (o.material && o.material.color) hex.push(o.material.color.getHex()); });
        return { corKart: sam.corKart, hex: hex.includes(0xffd56b), laranja: hex.includes(0xff9d52), cinza: hex.includes(0x8d9397) };
      });
      afirmar(ouro.corKart === 0xffd56b && ouro.hex && !ouro.laranja && ouro.cinza, 'o ouro não liberou o kart dourado com a camiseta cinza: ' + JSON.stringify(ouro));
      await page.evaluate(() => window.__turbo.enquadrar('piloto'));
      await page.waitForTimeout(400);
      await tiro(page, `turbo-copa-samuel-ouro-${sufixo}.png`);
      await page.evaluate(() => window.__turbo.menu());
    }
    await page.reload();
    await page.waitForFunction(() => window.__turbo && window.__turbo.copa);
    const depois = await page.evaluate(() => ({ trofeu: window.__turbo.copa.trofeu, texto: document.getElementById('copaNota').textContent, ativa: window.__turbo.copa.ativa }));
    afirmar(depois.trofeu === opcoes.salvo, 'o troféu sumiu ao reabrir: ' + JSON.stringify(depois));
  }

  if (opcoes.avulsa) {
    await page.evaluate(() => window.__turbo.menu());
    await page.locator('[data-pista="estrelas"]').tap();
    await page.locator('[data-modo="normal"]').tap();
    await page.locator('#btnCorrer').tap();
    await page.waitForFunction(() => window.__turbo.estado.fase === 'contagem');
    const avulsa = await page.evaluate(() => ({ emCopa: window.__turbo.estado.emCopa, pista: window.__turbo.estado.pistaChave, modo: window.__turbo.estado.modo }));
    afirmar(avulsa.emCopa === false && avulsa.pista === 'estrelas' && avulsa.modo === 'normal', 'a corrida avulsa não saiu do menu: ' + JSON.stringify(avulsa));
    const hab = await page.evaluate(() => window.__turbo.estado.karts.map((k) => k.ia.habil));
    afirmar(hab.every((h) => h >= 0.9 && h <= 1.02), 'habil do Normal saiu da faixa de hoje: ' + hab.join(','));
    await page.evaluate(() => window.__turbo.pularCorrida(1));
    await page.waitForSelector('#telaFim:not([hidden])');
    const semProxima = await page.locator('#btnProxima').isHidden();
    afirmar(semProxima, 'a corrida avulsa mostrou Próxima corrida');
    await page.locator('#btnOutra').tap();
    await page.evaluate(() => { window.__turbo.estado.modo = 'facil'; window.__turbo.construir('ilha'); });
    const facil = await page.evaluate(() => window.__turbo.estado.karts.map((k) => k.ia.habil));
    afirmar(facil.every((h) => h >= 0.78 && h <= 0.861), 'habil do Fácil fora de 0,78 + n*0,012 + rand*0,02: ' + facil.join(','));
  }

  afirmar(erros.length === 0, 'erros no console (' + sufixo + '): ' + erros.join(' | '));
}

async function fluxoIframe(page, sufixo) {
  const erros = [];
  ouvir(page, erros);
  await page.goto(jogar, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#jogo');
  const frame = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('iframe sem __turbo')), 20000);
    const ver = () => {
      const f = page.frames().find((fr) => fr.url().includes('/jogo/turbo-dos-blocos/'));
      if (f) { clearTimeout(t); resolve(f); } else setTimeout(ver, 100);
    };
    ver();
  });
  ouvir(frame, erros);
  await frame.waitForFunction(() => window.__turbo && window.__turbo.estado.fase === 'menu');
  await frame.evaluate(() => { document.getElementById('telaInicio').scrollTop = 0; });
  await tiro(page, `turbo-copa-iframe-menu-${sufixo}.png`);
  const temCopa = await frame.locator('#btnCopa').innerText();
  afirmar(temCopa.includes('Copa'), 'a Copa não apareceu no iframe: ' + temCopa);
  await frame.locator('[data-modo="facil"]').tap();
  await frame.locator('#btnCorrer').tap();
  await frame.waitForFunction(() => window.__turbo.estado.fase === 'contagem' || window.__turbo.estado.fase === 'corrida');
  await frame.waitForTimeout(1500);
  await tiro(page, `turbo-copa-iframe-corrida-${sufixo}.png`);
  const toque = await frame.evaluate(() => document.body.classList.contains('toque'));
  afirmar(toque, 'o iframe não entrou no modo toque');
  afirmar(erros.length === 0, 'erros no iframe (' + sufixo + '): ' + erros.join(' | '));
}

async function main() {
  mkdirSync(arte, { recursive: true });
  writeFileSync('/tmp/samuel-config-turbo.php', "<?php\nreturn ['senha_hash' => 'teste', 'segredo' => 'teste-turbo-copa', 'versao' => 1];\n");
  const php = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    env: { ...process.env, SAMUEL_CONFIG: '/tmp/samuel-config-turbo.php' },
    stdio: 'ignore',
  });
  await portaAberta();
  const browser = await webkit.launch({ headless: true });
  const tempos = [];
  try {
    afirmar(ipad.defaultBrowserType === 'webkit', 'perfil do iPad não é webkit');
    afirmar(ipad.hasTouch === true && ipad.isMobile === true, 'perfil sem toque ou sem isMobile');

    {
      const ctx = await contexto(browser, 1024, 768);
      const page = await ctx.newPage();
      await fluxoDireto(page, '1024x768', { auditar: true, lugar: 1, trofeu: 'Troféu de Ouro', salvo: 'ouro', avulsa: true });
      await ctx.close();
    }
    {
      const ctx = await contexto(browser, 768, 1024);
      const page = await ctx.newPage();
      await fluxoDireto(page, '768x1024', { auditar: false, lugar: 6, trofeu: 'Troféu da Copa', salvo: 'copa', avulsa: false });
      await ctx.close();
    }
    {
      const ctx = await contexto(browser, 1024, 768);
      const page = await ctx.newPage();
      await fluxoIframe(page, '1024x768');
      await ctx.close();
    }
    {
      const ctx = await contexto(browser, 768, 1024);
      const page = await ctx.newPage();
      await fluxoIframe(page, '768x1024');
      await ctx.close();
    }
    {
      const ctx = await contexto(browser, 1024, 768);
      const page = await ctx.newPage();
      const erros = [];
      ouvir(page, erros);
      await page.addInitScript(() => localStorage.clear());
      await abrir(page, direto);
      const ids = rapido ? ['ilha'] : ['ilha', 'estrelas', 'ilha-contrario', 'estrelas-espelho', 'ilha-lua', 'grande-final'];
      for (const id of ids) tempos.push(await corridaReal(page, id));
      afirmar(erros.length === 0, 'erros nas corridas cronometradas: ' + erros.join(' | '));
      const rec = tempos[0];
      afirmar(rec.recorde && rec.recorde.corrida > 10, 'o recorde da corrida avulsa não foi gravado: ' + JSON.stringify(rec.recorde));
      await ctx.close();
    }
  } finally {
    await browser.close();
    php.kill();
  }
  writeFileSync(path.join(arte, 'turbo-copa-tempos.json'), JSON.stringify({ rapido, tempos }, null, 2));
  if (falhas.length) {
    console.error('\n' + falhas.length + ' falha(s)');
    process.exit(1);
  }
  console.log('\nOK', tempos.map((t) => `${t.id}=${t.tempo.toFixed(1)}s/${t.fps.toFixed(0)}fps`).join(' '));
}

main().catch((e) => { console.error(e); process.exit(1); });

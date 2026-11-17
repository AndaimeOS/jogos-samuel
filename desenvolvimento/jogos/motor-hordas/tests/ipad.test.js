import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { createConnection } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { devices, webkit } from 'playwright'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.resolve(aqui, '../../../..')
const arte = '/opt/cursor/artifacts'
const porta = 8776
const origem = `http://127.0.0.1:${porta}`
const ipad = devices['iPad (gen 7)']

let servidor
let browser

async function portaAberta() {
  for (let i = 0; i < 50; i++) {
    const ok = await new Promise((resolve) => {
      const s = createConnection({ port: porta, host: '127.0.0.1' }, () => { s.end(); resolve(true) })
      s.on('error', () => resolve(false))
    })
    if (ok) return
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('o portal PHP não subiu')
}

function contexto(largura, altura) {
  return browser.newContext({
    ...ipad,
    viewport: { width: largura, height: altura },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  })
}

function ouvir(page, erros) {
  page.on('pageerror', (e) => erros.push(String(e)))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const texto = msg.text()
    if (/favicon/i.test(texto)) return
    erros.push(texto)
  })
}

async function alvos(alvo) {
  return alvo.evaluate(() => [...document.querySelectorAll('[data-alvo]')].flatMap((el) => {
    if (el.closest('[hidden]')) return []
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return []
    return [{ id: el.id || el.getAttribute('aria-label') || '', w: r.width, h: r.height }]
  }))
}

async function tocarStick(alvo, dx) {
  await alvo.evaluate((deslocamento) => {
    const zona = document.getElementById('joystick')
    const r = zona.getBoundingClientRect()
    const x0 = r.left + r.width / 2
    const y0 = r.top + r.height / 2
    const x1 = x0 + deslocamento
    const ev = (tipo, x, y) => zona.dispatchEvent(new PointerEvent(tipo, {
      bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, buttons: tipo === 'pointerup' ? 0 : 1,
    }))
    ev('pointerdown', x0, y0)
    ev('pointermove', x1, y0)
  }, dx)
}

async function soltarStick(alvo) {
  await alvo.evaluate(() => {
    document.getElementById('joystick').dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true,
    }))
  })
}

async function fotoCombate(alvo, api, chefe = false) {
  for (let i = 0; i < 4; i++) {
    if (await alvo.locator('#levelup').isHidden()) break
    await alvo.locator('#carta-0').tap()
    await alvo.waitForFunction((nome) => window[nome].estado.pausa !== 'cartas', api)
  }
  return alvo.evaluate(({ nome, forcarChefe }) => {
    const jogo = window[nome]
    const e = jogo.estado
    const j = e.jogador
    const dist = (b) => Math.hypot(b.x - j.x, b.y - (b.footY || 0) - j.y)
    if (forcarChefe) {
      if (!e.chefe || e.chefe.morrendo >= 0) jogo.trazerChefe()
      const c = e.chefe
      if (c) {
        c.morrendo = -1
        c.hp = c.hpMax
        c.kx = 0
        c.ky = 0
        c.vel = 0
        c.x = j.x + 72
        c.y = j.y
      }
    }
    if (e.pausa !== 'jogo') e.pausa = 'jogo'
    let leitura = null
    for (let i = 0; i < 30; i++) {
      if (e.pausa === 'cartas') jogo.escolher(0)
      jogo.simular(0.05)
      const alcance = e.alcanceMira || 0
      const chefe = e.chefe && e.chefe.morrendo < 0 && dist(e.chefe) <= alcance + (e.chefe.raio || 0) ? e.chefe : null
      let perto = null
      let menor = Infinity
      for (const b of e.inimigos) {
        if (b.morrendo >= 0 || b === e.chefe) continue
        const d = dist(b)
        if (d < menor) {
          menor = d
          perto = b
        }
      }
      const esperado = chefe || (perto && menor <= alcance + (perto.raio || 0) ? perto : null)
      const tiros = (e.ataques || []).filter((a) => (a.tipo === 'tiro' || a.tipo === 'estocada') && a.ttl > 0)
      leitura = {
        mira: e.alvo === esperado,
        chefe: !!(forcarChefe && e.chefe && e.alvo === e.chefe),
        tiros: tiros.length,
        distAlvo: e.alvo ? Math.round(dist(e.alvo)) : null,
        distPerto: Number.isFinite(menor) ? Math.round(menor) : null,
      }
      if (leitura.mira && leitura.tiros > 0 && (!forcarChefe || leitura.chefe)) break
    }
    e.pausa = 'foto'
    jogo.desenhar()
    return leitura
  }, { nome: api, forcarChefe: chefe })
}

async function soltarFoto(alvo, api) {
  await alvo.evaluate((nome) => {
    if (window[nome].estado.pausa === 'foto') window[nome].estado.pausa = 'jogo'
  }, api)
}

async function esperarCombate(alvo, api) {
  for (let i = 0; i < 50; i++) {
    const ok = await alvo.evaluate((nome) => {
      const e = window[nome].estado
      const tiro = (e.ataques || []).some((a) => a.tipo === 'tiro' || a.tipo === 'estocada')
      return !!(e.alvo && e.alvo.morrendo < 0 && tiro)
    }, api)
    if (ok) return
    if (!(await alvo.locator('#levelup').isHidden())) await alvo.locator('#carta-0').tap()
    else await alvo.evaluate((nome) => window[nome].simular(0.15), api)
  }
}

async function escolherSePrecisar(alvo, api) {
  const aberto = await alvo.locator('#levelup').isHidden()
  if (aberto) return
  await alvo.locator('#carta-0').tap()
  await alvo.waitForFunction((nome) => window[nome].estado.pausa !== 'cartas', api)
}

async function fluido(alvo, api, segundos) {
  const fim = Date.now() + (segundos + 25) * 1000
  while (Date.now() < fim) {
    if (!(await alvo.locator('#levelup').isHidden())) {
      await alvo.locator('#carta-0').tap()
      continue
    }
    if (!(await alvo.locator('#vitoria').isHidden())) {
      await alvo.locator('#btnProxima').tap()
      await alvo.locator('#no-2').tap()
      await alvo.waitForFunction((nome) => window[nome].estado && window[nome].estado.pausa, api)
      continue
    }
    const jogado = await alvo.evaluate((nome) => window[nome].jogado, api)
    if (jogado >= segundos) return jogado
    await alvo.waitForTimeout(200)
  }
  return alvo.evaluate((nome) => window[nome].jogado, api)
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true })
  const { writeFile } = await import('node:fs/promises')
  await writeFile('/tmp/samuel-ipad-config.php', "<?php\nreturn ['senha_hash' => 'teste', 'segredo' => 'teste-ipad', 'versao' => 1];\n")
  servidor = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    env: { ...process.env, SAMUEL_CONFIG: '/tmp/samuel-ipad-config.php' },
    stdio: 'ignore',
  })
  await portaAberta()
  browser = await webkit.launch({ headless: true })
})

afterAll(async () => {
  await browser?.close()
  servidor?.kill()
})

function suite(slug, api, titulo) {
  const jogoUrl = `${origem}/jogo/${slug}/index.html`
  const jogarUrl = `${origem}/jogar/?jogo=${slug}`

  async function abrir(alvo, url) {
    const erros = []
    ouvir(alvo, erros)
    await alvo.goto(url, { waitUntil: 'domcontentloaded' })
    let dentro = alvo
    if (url.includes('/jogar/')) {
      const iframe = await alvo.waitForSelector('iframe#jogo')
      dentro = await iframe.contentFrame()
    }
    await dentro.waitForFunction((nome) => window[nome] && document.getElementById('no-1'), api)
    return { erros, dentro }
  }

  async function cenario(largura, altura, url, nome, longo) {
    const context = await contexto(largura, altura)
    const page = await context.newPage()
    const { erros, dentro } = await abrir(page, url)
    expect(await dentro.evaluate(() => navigator.userAgent)).toMatch(/iPad/)
    expect(await dentro.evaluate(() => navigator.userAgent)).toMatch(/Safari/)
    expect(await dentro.evaluate(() => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0)).toBe(true)
    const botoes = await alvos(dentro)
    for (const b of botoes) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(44)
      expect(b.h, b.id).toBeGreaterThanOrEqual(44)
    }
    expect(await dentro.locator('body').innerText()).not.toMatch(/PROPOSTA/)
    await dentro.evaluate(() => { localStorage.clear() })
    await dentro.locator('#no-1').tap()
    await dentro.waitForFunction((nome) => window[nome].estado && window[nome].estado.pausa === 'cartas', api)
    const shot = async (arquivo) => {
      if (url.includes('/jogar/')) await page.locator('iframe#jogo').screenshot({ path: arquivo })
      else await page.screenshot({ path: arquivo })
    }
    if (!url.includes('/jogar/')) await shot(path.join(arte, `${nome}-levelup.png`))
    await dentro.locator('#carta-0').tap()
    await dentro.waitForFunction((nome) => window[nome].estado.pausa === 'jogo', api)
    const inicio = await dentro.evaluate((nome) => {
      const e = window[nome].estado
      return {
        tempo: e.tempo,
        chefe: Boolean(e.chefe),
        perto: e.inimigos.filter((b) => Math.hypot(b.x - e.jogador.x, b.y - e.jogador.y) < 80).length,
        fase: document.getElementById('faseNome').textContent,
      }
    }, api)
    expect(inicio.chefe).toBe(false)
    expect(inicio.perto).toBe(0)
    expect(inicio.tempo).toBeLessThan(2)
    expect(inicio.fase.length).toBeGreaterThan(0)
    if (!url.includes('/jogar/')) {
      await dentro.evaluate((nome) => window[nome].desenhar(), api)
      await shot(path.join(arte, `${nome}-inicio.png`))
    }
    await tocarStick(dentro, 80)
    const antes = await dentro.evaluate((nome) => window[nome].estado.jogador.x, api)
    await dentro.evaluate((nome) => window[nome].simular(0.6), api)
    const depois = await dentro.evaluate((nome) => window[nome].estado.jogador.x, api)
    await soltarStick(dentro)
    expect(depois).toBeGreaterThan(antes + 8)
    await dentro.evaluate((nome) => { window[nome].estado.jogador.especial = 0 }, api)
    await dentro.locator('#btnAcao').tap()
    await dentro.waitForFunction((nome) => window[nome].estado.jogador.especial > 5, api)
    await dentro.evaluate((nome) => {
      const jogo = document.getElementById('jogo')
      window.__telaPedido = ''
      Object.defineProperty(jogo, 'requestFullscreen', { configurable: true, value: undefined })
      Object.defineProperty(jogo, 'webkitRequestFullscreen', {
        configurable: true,
        value() { window.__telaPedido = this.id; return Promise.resolve() },
      })
    })
    if (!(await dentro.locator('#levelup').isHidden())) await dentro.locator('#carta-0').tap()
    await dentro.locator('#btnTela').tap()
    expect(await dentro.evaluate(() => window.__telaPedido)).toBe('jogo')
    if (!url.includes('/jogar/')) {
      const vistos = new Set()
      for (let n = 0; n < 40; n++) {
        const info = await dentro.evaluate((nome) => {
          const ev = window[nome].estado.perigoAtual
          return { tempo: window[nome].estado.tempo, id: ev ? ev.id : '', fase: ev ? ev.fase : '' }
        }, api)
        if (info.id && !vistos.has(info.id)) {
          vistos.add(info.id)
          await shot(path.join(arte, `${nome}-perigo-${info.id}-${info.fase}.png`))
        }
        if (info.tempo >= 30 && await dentro.locator('#levelup').isHidden()) break
        if (!(await dentro.locator('#levelup').isHidden())) await dentro.locator('#carta-0').tap()
        else await dentro.evaluate((nome) => window[nome].simular(2), api)
      }
      const esperados = api === '__planeta' ? ['meteoros', 'enchente', 'raios'] : ['nevoeiro', 'onda-gigante', 'tempestade']
      for (const id of esperados) expect(vistos.has(id), `${nome} ${id}`).toBe(true)
      await esperarCombate(dentro, api)
      const aos30 = await dentro.evaluate((nome) => {
        const e = window[nome].estado
        return {
          alvo: !!(e.alvo && e.alvo.morrendo < 0),
          tiro: (e.ataques || []).some((a) => a.tipo === 'tiro' || a.tipo === 'estocada'),
        }
      }, api)
      expect(aos30.alvo, `${nome} moldura aos 30s`).toBe(true)
      expect(aos30.tiro, `${nome} projetil aos 30s`).toBe(true)
      const foto30 = await fotoCombate(dentro, api)
      expect(foto30.mira, `${nome} mira no mais perto (${foto30.distAlvo} vs ${foto30.distPerto})`).toBe(true)
      expect(foto30.tiros, `${nome} projetil aos 30s`).toBeGreaterThan(0)
      await shot(path.join(arte, `${nome}-30s.png`))
      await soltarFoto(dentro, api)
    }
    await dentro.evaluate((nome) => {
      const jogo = window[nome]
      jogo.trazerChefe()
      const chefe = jogo.estado.chefe
      const j = jogo.estado.jogador
      if (chefe) {
        chefe.x = j.x + 96
        chefe.y = j.y
      }
      jogo.desenhar()
    }, api)
    await dentro.waitForFunction((nome) => window[nome].estado.chefe, api)
    if (!url.includes('/jogar/')) {
      await esperarCombate(dentro, api)
      const combate = await dentro.evaluate((nome) => {
        const e = window[nome].estado
        const tiro = (e.ataques || []).some((a) => a.tipo === 'tiro' || a.tipo === 'estocada')
        return { alvo: !!(e.alvo && e.alvo.morrendo < 0), tiro }
      }, api)
      expect(combate.alvo, `${nome} moldura`).toBe(true)
      expect(combate.tiro, `${nome} projetil`).toBe(true)
      const foto = await fotoCombate(dentro, api, true)
      expect(foto.chefe, `${nome} a moldura é a do chefe`).toBe(true)
      expect(foto.tiros, `${nome} projetil do chefe`).toBeGreaterThan(0)
      await shot(path.join(arte, `${nome}-chefe.png`))
      await soltarFoto(dentro, api)
    }
    if (longo) {
      const jogado = await fluido(dentro, api, 60)
      expect(jogado).toBeGreaterThanOrEqual(60)
    }
    for (let n = 0; n < 80 && await dentro.locator('#mapa').isHidden(); n++) {
      if (!(await dentro.locator('#levelup').isHidden())) {
        await dentro.locator('#carta-0').tap()
        continue
      }
      if (!(await dentro.locator('#vitoria').isHidden())) {
        await dentro.locator('#btnProxima').tap()
        break
      }
      if (!(await dentro.locator('#fim').isHidden())) {
        await dentro.locator('#btnFimMapa').tap()
        break
      }
      await dentro.evaluate((nome) => window[nome].simular(2), api)
    }
    await dentro.waitForSelector('#no-2:not([disabled])')
    expect(erros, erros.join('\n')).toEqual([])
    await context.close()
  }

  describe(`${titulo} no iPad`, () => {
    it('1024×768, página direta', async () => {
      const context = await contexto(1024, 768)
      const page = await context.newPage()
      const { erros, dentro } = await abrir(page, jogoUrl)
      await dentro.waitForFunction(() => document.getElementById('cenario').naturalWidth > 0)
      await page.screenshot({ path: path.join(arte, `${slug}-mapa-paisagem.png`) })
      await context.close()
      expect(erros).toEqual([])
      await cenario(1024, 768, jogoUrl, `${slug}-paisagem`, true)
    })

    it('768×1024, página direta', async () => {
      const context = await contexto(768, 1024)
      const page = await context.newPage()
      const { dentro } = await abrir(page, jogoUrl)
      await dentro.waitForFunction(() => document.getElementById('cenario').naturalWidth > 0)
      await page.screenshot({ path: path.join(arte, `${slug}-mapa-retrato.png`) })
      await context.close()
      void dentro
      await cenario(768, 1024, jogoUrl, `${slug}-retrato`, false)
    })

    it('dentro do iframe, nos dois sentidos', async () => {
      await cenario(1024, 768, jogarUrl, `${slug}-iframe-paisagem`, false)
      await cenario(768, 1024, jogarUrl, `${slug}-iframe-retrato`, false)
    })
  })
}

suite('planeta-do-samuel', '__planeta', 'Planeta')
suite('pescador-samuel', '__pescador', 'Pescador')

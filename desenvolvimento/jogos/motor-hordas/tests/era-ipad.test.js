import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createConnection } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { devices, webkit } from 'playwright'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.resolve(aqui, '../../../..')
const arte = '/opt/cursor/artifacts'
const porta = 8779
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

async function abrir(page, url, api) {
  const erros = []
  ouvir(page, erros)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  let dentro = page
  if (url.includes('/jogar/')) {
    const iframe = await page.waitForSelector('iframe#jogo')
    dentro = await iframe.contentFrame()
  }
  await dentro.waitForFunction((nome) => window[nome] && document.getElementById('no-1'), api, { timeout: 60000 })
  return { erros, dentro }
}

async function shot(page, url, arquivo) {
  if (url.includes('/jogar/')) await page.locator('iframe#jogo').screenshot({ path: arquivo })
  else await page.screenshot({ path: arquivo })
}

async function perfil(dentro) {
  const ua = await dentro.evaluate(() => navigator.userAgent)
  expect(ua).toMatch(/iPad/)
  expect(ua).toMatch(/Safari/)
  const toque = await dentro.evaluate(() => ({
    pontos: navigator.maxTouchPoints,
    coarse: matchMedia('(pointer: coarse)').matches,
    ontouch: 'ontouchstart' in window,
  }))
  expect(toque.pontos > 0 || toque.coarse || toque.ontouch).toBe(true)
}

function resumirFps(amostras) {
  const validas = amostras.filter((a) => a.dt >= 0.4 && a.dt <= 1.5 && Number.isFinite(a.fps))
  const media = (lista) => (lista.length ? lista.reduce((s, a) => s + a.fps, 0) / lista.length : 0)
  const tarde = validas.filter((a) => a.tempo >= 50)
  const pico = validas.reduce((m, a) => (a.vivos > m.vivos ? a : m), { vivos: 0, fps: 0, tempo: 0 })
  return {
    amostras: validas.length,
    media: Math.round(media(validas) * 10) / 10,
    mediaComHorda: Math.round(media(tarde) * 10) / 10,
    picoVivos: pico.vivos,
    fpsNoPico: Math.round(pico.fps * 10) / 10,
    tempoNoPico: Math.round(pico.tempo * 10) / 10,
  }
}

beforeAll(async () => {
  await mkdir(arte, { recursive: true })
  await writeFile('/tmp/samuel-era-config.php', "<?php\nreturn ['senha_hash' => 'teste', 'segredo' => 'teste-era', 'versao' => 1];\n")
  servidor = spawn('php', ['-S', `127.0.0.1:${porta}`, 'ferramentas/roteador-local.php'], {
    cwd: raiz,
    env: { ...process.env, SAMUEL_CONFIG: '/tmp/samuel-era-config.php' },
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

  async function simularAte(dentro, alvo) {
    return dentro.evaluate(({ nome, alvo }) => {
      const jogo = window[nome]
      let g = 0
      while (g++ < 500) {
        const e = jogo.estado
        if (!e) break
        if (e.pausa === 'cartas') {
          jogo.escolher(0)
          continue
        }
        if (e.pausa !== 'jogo') break
        if (alvo.tempo != null && e.tempo >= alvo.tempo) break
        jogo.simular(0.5)
      }
      jogo.desenhar()
      const e = jogo.estado
      return {
        pausa: e.pausa,
        tempo: e.tempo,
        vivos: e.inimigos.filter((b) => b.morrendo < 0).length,
        nivel: e.jogador.nivel,
        golpes: e.jogador.golpes.map((g) => `${g.id}:${g.nivel}`),
        fase: document.getElementById('faseNome').textContent,
        duracao: e.fase.duracao,
        ordem: e.fase.ordem,
        andou: e.jogador.andou,
      }
    }, { nome: api, alvo })
  }

  async function fotos(largura, altura, url, prefixo) {
    const context = await contexto(largura, altura)
    const page = await context.newPage()
    page.setDefaultTimeout(90000)
    const { erros, dentro } = await abrir(page, url, api)
    await perfil(dentro)
    const arquivo = (momento) => path.join(arte, `${prefixo}-${momento}.png`)
    await dentro.locator('#no-1').tap()
    await dentro.waitForFunction((nome) => window[nome].estado && window[nome].estado.pausa === 'cartas', api)
    await dentro.locator('#carta-0').tap()
    await dentro.waitForFunction((nome) => window[nome].estado.pausa === 'jogo', api)
    await dentro.evaluate((nome) => window[nome].desenhar(), api)
    await shot(page, url, arquivo('fase1'))
    const horda = await simularAte(dentro, { tempo: 82 })
    expect(horda.duracao).toBe(90)
    expect(horda.andou).toBe(0)
    expect(horda.tempo).toBeGreaterThanOrEqual(82)
    expect(horda.tempo).toBeLessThan(90)
    expect(horda.vivos).toBeGreaterThan(0)
    await shot(page, url, arquivo('horda'))
    const fim = await simularAte(dentro, {})
    expect(fim.pausa).toBe('vitoria')
    expect(fim.tempo).toBeGreaterThanOrEqual(90)
    expect(fim.nivel).toBeGreaterThan(1)
    await dentro.locator('#vitoria').waitFor({ state: 'visible' })
    await dentro.locator('#btnProxima').tap()
    await dentro.locator('#no-2').tap()
    await dentro.waitForFunction((nome) => {
      const e = window[nome].estado
      return e && e.fase.ordem === 2 && e.pausa === 'jogo'
    }, api)
    const fase2 = await dentro.evaluate((nome) => {
      const e = window[nome].estado
      window[nome].desenhar()
      return {
        nivel: e.jogador.nivel,
        golpes: e.jogador.golpes.map((g) => `${g.id}:${g.nivel}`),
        fase: document.getElementById('faseNome').textContent,
        hud: document.getElementById('nivel').textContent,
      }
    }, api)
    expect(fase2.nivel).toBe(fim.nivel)
    expect(fase2.golpes).toEqual(fim.golpes)
    expect(fase2.hud).toBe(String(fim.nivel))
    expect(fase2.fase).toMatch(/2$/)
    await shot(page, url, arquivo('fase2'))
    expect(erros, erros.join('\n')).toEqual([])
    await context.close()
  }

  describe(`${titulo} no iPad, era contínua`, () => {
    it('mede a fase parada, sem andar, na página direta deitada', async () => {
      const context = await contexto(1024, 768)
      const page = await context.newPage()
      page.setDefaultTimeout(90000)
      const { erros, dentro } = await abrir(page, jogoUrl, api)
      await perfil(dentro)
      const arquivo = (momento) => path.join(arte, `${slug}-paisagem-${momento}.png`)
      await dentro.locator('#no-1').tap()
      await dentro.waitForFunction((nome) => window[nome].estado && window[nome].estado.pausa === 'cartas', api)
      await dentro.locator('#carta-0').tap()
      await dentro.waitForFunction((nome) => window[nome].estado.pausa === 'jogo', api)
      await dentro.evaluate((nome) => window[nome].desenhar(), api)
      await shot(page, jogoUrl, arquivo('fase1'))
      const inicio = Date.now()
      let marca = inicio
      let quadros = await dentro.evaluate((nome) => window[nome].quadros, api)
      const amostras = []
      let hordaFeita = false
      let melhorHorda = 0
      let final = null
      while (Date.now() - inicio < 150000) {
        if (!(await dentro.locator('#levelup').isHidden())) {
          await dentro.locator('#carta-0').tap()
          continue
        }
        const info = await dentro.evaluate((nome) => {
          const e = window[nome].estado
          return {
            pausa: e.pausa,
            tempo: e.tempo,
            vivos: e.inimigos.filter((b) => b.morrendo < 0).length,
            quadros: window[nome].quadros,
            nivel: e.jogador.nivel,
            golpes: e.jogador.golpes.map((g) => `${g.id}:${g.nivel}`),
            andou: e.jogador.andou,
            duracao: e.fase.duracao,
            relogio: document.getElementById('relogio').textContent,
          }
        }, api)
        const agora = Date.now()
        const dt = (agora - marca) / 1000
        if (dt >= 0.8) {
          amostras.push({ fps: (info.quadros - quadros) / dt, vivos: info.vivos, tempo: info.tempo, dt })
          quadros = info.quadros
          marca = agora
        }
        if (info.tempo >= 70 && info.vivos > melhorHorda) melhorHorda = info.vivos
        if (!hordaFeita && info.tempo >= 82 && info.pausa === 'jogo') {
          await dentro.evaluate((nome) => window[nome].desenhar(), api)
          await shot(page, jogoUrl, arquivo('horda'))
          hordaFeita = true
        }
        if (info.pausa === 'vitoria') {
          final = info
          break
        }
        await dentro.waitForTimeout(200)
      }
      expect(final, 'a fase não terminou').toBeTruthy()
      expect(final.duracao).toBe(90)
      expect(final.andou).toBe(0)
      expect(final.tempo).toBeGreaterThanOrEqual(90)
      expect(final.tempo).toBeLessThan(91)
      expect(final.nivel).toBeGreaterThan(1)
      expect(hordaFeita).toBe(true)
      const parede = (Date.now() - inicio) / 1000
      const fps = resumirFps(amostras)
      await dentro.locator('#vitoria').waitFor({ state: 'visible' })
      const era = await dentro.evaluate((nome) => window[nome].save.era, api)
      expect(era.nivel).toBe(final.nivel)
      expect(era.golpes.map((g) => `${g.id}:${g.nivel}`)).toEqual(final.golpes)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForFunction((nome) => window[nome] && document.getElementById('no-2') && !document.getElementById('no-2').disabled, api)
      const eraRecarregada = await page.evaluate((nome) => window[nome].save.era, api)
      expect(eraRecarregada.nivel).toBe(era.nivel)
      await page.locator('#no-2').tap()
      await page.waitForFunction((nome) => {
        const e = window[nome].estado
        return e && e.fase.ordem === 2 && e.pausa === 'jogo'
      }, api)
      const fase2 = await page.evaluate((nome) => {
        const e = window[nome].estado
        window[nome].desenhar()
        return {
          nivel: e.jogador.nivel,
          golpes: e.jogador.golpes.map((g) => `${g.id}:${g.nivel}`),
          fase: document.getElementById('faseNome').textContent,
          hud: document.getElementById('nivel').textContent,
        }
      }, api)
      expect(fase2.nivel).toBe(era.nivel)
      expect(fase2.golpes).toEqual(final.golpes)
      expect(fase2.hud).toBe(String(era.nivel))
      expect(fase2.fase).toMatch(/2$/)
      await shot(page, jogoUrl, arquivo('fase2'))
      const medicao = {
        slug,
        duracaoFase: final.duracao,
        tempoAoVencer: final.tempo,
        relogio: final.relogio,
        paredeSegundos: Math.round(parede * 10) / 10,
        nivel: final.nivel,
        golpes: final.golpes,
        andou: final.andou,
        vivosNoFim: melhorHorda,
        fps,
      }
      await writeFile(path.join(arte, `${slug}-medicao.json`), JSON.stringify(medicao, null, 2))
      console.log(JSON.stringify(medicao))
      expect(erros, erros.join('\n')).toEqual([])
      await context.close()
    })

    it('768×1024, página direta', async () => {
      await fotos(768, 1024, jogoUrl, `${slug}-retrato`)
    })

    it('1024×768, dentro do iframe', async () => {
      await fotos(1024, 768, jogarUrl, `${slug}-iframe-paisagem`)
    })

    it('768×1024, dentro do iframe', async () => {
      await fotos(768, 1024, jogarUrl, `${slug}-iframe-retrato`)
    })
  })
}

suite('planeta-do-samuel', '__planeta', 'Planeta')
suite('pescador-samuel', '__pescador', 'Pescador')

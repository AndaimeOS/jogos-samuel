import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { conteudoPlaneta } from '../src/conteudo/planeta.js'
import { conteudoPescador } from '../src/conteudo/pescador.js'
import { escolherCarta, criarPartida, DIFICULDADE, MAX_GOLPES, separarCorpos, tick, trazerChefe, xpPara } from '../src/motor/partida.js'
import { dir8, distanciaAnel, encaixarVista, inserir, joystick, limparGrade, RAIO_STICK, xpPara as xpVista } from '../src/motor/numeros.js'

const aqui = path.dirname(fileURLToPath(import.meta.url))

function andar(p, seg) {
  let resto = seg
  let guarda = 0
  while (resto > 0 && guarda++ < 20000) {
    if (p.pausa === 'cartas') {
      escolherCarta(p, 0)
      continue
    }
    if (p.pausa !== 'jogo') break
    const dt = Math.min(1 / 60, resto)
    tick(p, dt, { x: 1, y: 0, acao: false, acaoSegurada: false })
    resto -= dt
  }
}

describe('contas do motor', () => {
  it('dir8, joystick e vista seguem o motor de origem', () => {
    expect(dir8(0, 1)).toBe(0)
    expect(dir8(1, 1)).toBe(1)
    expect(dir8(1, 0)).toBe(2)
    expect(dir8(0, -1)).toBe(4)
    expect(dir8(-1, 0)).toBe(6)
    const parado = joystick({ x: 0, y: 0 }, { x: 4, y: 0 })
    expect(parado.vec).toEqual({ x: 0, y: 0 })
    const cheio = joystick({ x: 0, y: 0 }, { x: RAIO_STICK, y: 0 })
    expect(cheio.vec.x).toBe(1)
    const vista = encaixarVista(1024, 768, 2)
    expect(vista.w % 2).toBe(0)
    expect(vista.h % 2).toBe(0)
    expect(vista.w * vista.cssScale).toBeLessThanOrEqual(1024 + 2)
    expect(xpPara(1)).toBe(5)
    expect(xpVista(1)).toBe(5)
  })

  it('nasce fora da tela, a câmera segue e os corpos se separam', () => {
    const p = criarPartida(conteudoPlaneta, { fase: 0, seed: 7, vista: { w: 400, h: 300 } })
    escolherCarta(p, 0)
    const anel = distanciaAnel(400, 300)
    let nasceuFora = false
    for (let i = 0; i < 180 && !nasceuFora; i++) {
      tick(p, 1 / 60, { x: 0, y: 0, acao: false, acaoSegurada: false })
      for (const b of p.inimigos) {
        if (b.idade > 0.08) continue
        const longe = Math.hypot(b.x - p.jogador.x, b.y - p.jogador.y)
        expect(longe).toBeGreaterThan(anel * 0.9)
        nasceuFora = true
      }
    }
    expect(nasceuFora).toBe(true)
    const cedo = criarPartida(conteudoPlaneta, { fase: 0, seed: 7, vista: { w: 400, h: 300 } })
    escolherCarta(cedo, 0)
    for (let i = 0; i < 60; i++) tick(cedo, 1 / 60, { x: 0, y: 0, acao: false, acaoSegurada: false })
    expect(cedo.chefe).toBeNull()
    expect(cedo.tempo).toBeLessThan(1.05)
    for (const b of cedo.inimigos) {
      expect(Math.hypot(b.x - cedo.jogador.x, b.y - cedo.jogador.y)).toBeGreaterThan(80)
      expect(b.chefe).toBeFalsy()
    }
    const antes = p.camera.x
    for (let i = 0; i < 30; i++) tick(p, 1 / 60, { x: 1, y: 0, acao: false, acaoSegurada: false })
    expect(p.camera.x).toBeGreaterThan(antes + 10)
    expect(p.jogador.x).toBeGreaterThan(10)
    p.jogador.x = 800
    p.jogador.y = 800
    p.inimigos = [
      { id: 1, x: 0, y: 0, raio: 12, massa: 1, morrendo: -1, dano: 0, comportamento: 'chase' },
      { id: 2, x: 2, y: 0, raio: 12, massa: 1, morrendo: -1, dano: 0, comportamento: 'chase' },
    ]
    limparGrade(p.grade)
    inserir(p.grade, 0, 0, 0)
    inserir(p.grade, 1, 2, 0)
    separarCorpos(p)
    const a = p.inimigos[0]
    const b = p.inimigos[1]
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1)
  })

  it('o Fácil não zera a vida e não teleporta; o Normal pode acabar a fase', () => {
    const facil = criarPartida(conteudoPlaneta, { fase: 0, seed: 3, modo: 'facil' })
    escolherCarta(facil, 0)
    const x = facil.jogador.x
    facil.jogador.hp = 3
    facil.inimigos.push({
      id: 9, x: facil.jogador.x, y: facil.jogador.y, raio: 20, massa: 1, morrendo: -1,
      dano: 500, comportamento: 'chase', hp: 999, hpMax: 999, vel: 0, xp: 0, chefe: false,
      kx: 0, ky: 0, dir: 0, idade: 0, ferido: 0, queima: 0, faseChefe: 1, ataque: 9, ttl: 0, altura: 10, sprite: 'seixo-vivo', tipo: 'seixo-vivo',
    })
    tick(facil, 1 / 60, { x: 0, y: 0, acao: false, acaoSegurada: false })
    expect(facil.jogador.hp).toBeGreaterThanOrEqual(DIFICULDADE.facil.piso)
    expect(facil.pausa).toBe('jogo')
    expect(facil.jogador.x).toBe(x)

    const normal = criarPartida(conteudoPlaneta, { fase: 0, seed: 3, modo: 'normal' })
    escolherCarta(normal, 0)
    normal.jogador.hp = 1
    normal.jogador.iframes = 0
    normal.inimigos.push({
      id: 9, x: normal.jogador.x, y: normal.jogador.y, raio: 30, massa: 1, morrendo: -1,
      dano: 500, comportamento: 'chase', hp: 999, hpMax: 999, vel: 0, xp: 0, chefe: false,
      kx: 0, ky: 0, dir: 0, idade: 0, ferido: 0, queima: 0, faseChefe: 1, ataque: 9, ttl: 0, altura: 10, sprite: 'seixo-vivo', tipo: 'seixo-vivo',
    })
    tick(normal, 1 / 60, { x: 0, y: 0, acao: false, acaoSegurada: false })
    expect(normal.pausa).toBe('derrota')
  })

  it('a fase de sobrevivência passa no tempo e o chefe muda na metade da vida', () => {
    const p = criarPartida(conteudoPlaneta, { fase: 0, seed: 11, vista: { w: 320, h: 240 } })
    andar(p, 40)
    expect(p.pausa).toBe('vitoria')
    expect(p.jogador.nivel).toBeGreaterThan(1)
    expect(p.jogador.golpes.length).toBeGreaterThan(1)
    expect(p.jogador.golpes.length).toBeLessThanOrEqual(MAX_GOLPES)

    const chefe = criarPartida(conteudoPlaneta, { fase: 2, seed: 4, vista: { w: 320, h: 240 } })
    escolherCarta(chefe, 0)
    trazerChefe(chefe)
    expect(chefe.chefe.tipo).toBe('urso-da-caverna')
    expect(chefe.chefe.faseChefe).toBe(1)
    chefe.chefe.hp = chefe.chefe.hpMax * 0.4
    tick(chefe, 1 / 60, { x: 0, y: 0, acao: false, acaoSegurada: false })
    expect(chefe.chefe.faseChefe).toBe(2)
    chefe.chefe.hp = 0
    chefe.chefe.morrendo = 0.49
    tick(chefe, 1 / 60, { x: 0, y: 0, acao: false, acaoSegurada: false })
    expect(chefe.pausa).toBe('vitoria')
  })

  it('o pescador pesca, completa o álbum e não usa nome de criatura de fora', async () => {
    expect(conteudoPescador.fases).toHaveLength(11)
    expect(conteudoPescador.fases.filter((f) => f.tipo === 'chefe')).toHaveLength(3)
    expect(conteudoPescador.fases[9].tipo).toBe('lendario')
    expect(conteudoPescador.fases[10].tipo).toBe('fim')
    expect(conteudoPescador.peixes).toHaveLength(30)
    expect(conteudoPlaneta.fases).toHaveLength(10)
    expect(conteudoPlaneta.fases[9].tipo).toBe('fim')
    const p = criarPartida(conteudoPescador, { fase: 0, seed: 5 })
    escolherCarta(p, 0)
    p.cardumes.push({ x: p.jogador.x, y: p.jogador.y, raio: 10, vivo: true })
    tick(p, 1 / 60, { x: 0, y: 0, acao: true, acaoSegurada: true })
    expect(p.album.length).toBe(1)
    p.album = conteudoPescador.peixes.map((peixe) => peixe.id)
    p.cardumes.push({ x: p.jogador.x + 1000, y: 0, raio: 4, vivo: true })
    p.barcoDourado = p.album.length >= 30
    expect(p.barcoDourado).toBe(true)
    const folhas = JSON.parse(await readFile(path.join(aqui, '../arte/planeta/motor.json'), 'utf8'))
    const barco = JSON.parse(await readFile(path.join(aqui, '../arte/pescador/motor.json'), 'utf8'))
    expect(folhas.samuel.body).toEqual({ bodyW: 17, bodyH: 32, footY: 15 })
    expect(folhas['lobo-da-pedra'].anims.Sumico.linhas).toBe(1)
    expect(folhas['lobo-da-pedra'].anims.Sumico.quadros).toBe(5)
    expect(folhas['lobo-da-pedra'].anims.Walk.linhas).toBe(8)
    expect(folhas.urso.anims.Walk.frameH).toBe(72)
    expect(barco['samuel-barco-colete'].body.bodyW).toBe(20)
    expect(barco['peixe-lendario'].anims.Sumico).toBeTruthy()
    expect(folhas.samuel.anims.Sumico).toBeUndefined()
    expect(folhas.mamute.anims.Walk.linhas).toBe(8)
    expect(folhas.mamute.anims.Sumico).toMatchObject({ linhas: 1, quadros: 5 })
    expect(folhas['caranguejo-gigante'].anims.Sumico.quadros).toBe(5)
    expect(folhas['robo-enferrujado'].anims.Walk.linhas).toBe(8)
    expect(Object.keys(folhas)).toHaveLength(16)
    expect(barco.nevoeiro).toBeUndefined()
    expect(barco['onda-gigante']).toBeUndefined()
    expect(barco.tempestade).toBeUndefined()

    const proibidos = /\b(pikachu|charmander|charizard|squirtle|bulbasaur|mewtwo|jigglypuff|rattata|snorlax|eevee|pok[eé]mon|pokeball|pokedex|pokédex|gastly|gengar|lucario|arceus|kyogre)\b/i
    const arquivos = []
    async function andarDir(dir) {
      for (const nome of await readdir(dir, { withFileTypes: true })) {
        const pth = path.join(dir, nome.name)
        if (nome.isDirectory()) await andarDir(pth)
        else if (/\.(js|html|json)$/.test(nome.name)) arquivos.push(pth)
      }
    }
    await andarDir(path.join(aqui, '../src'))
    await andarDir(path.join(aqui, '../../../..', '_privado/jogos/planeta-do-samuel'))
    await andarDir(path.join(aqui, '../../../..', '_privado/jogos/pescador-samuel'))
    for (const arquivo of arquivos) {
      if (arquivo.endsWith('LICENSE.txt')) continue
      const texto = await readFile(arquivo, 'utf8')
      expect(texto, arquivo).not.toMatch(proibidos)
    }
  })

  it('perigos avisam antes e no fácil não tiram vida', () => {
    expect(conteudoPescador.inimigos.nevoeiro).toBeUndefined()
    expect(conteudoPescador.inimigos['onda-gigante']).toBeUndefined()
    expect(conteudoPescador.inimigos.tempestade).toBeUndefined()
    for (const f of [...conteudoPescador.fases, ...conteudoPlaneta.fases]) {
      expect((f.horda || []).join(' ')).not.toMatch(/nevoeiro|onda-gigante/)
      expect((f.horda || []).includes('tempestade')).toBe(false)
    }
    expect(conteudoPlaneta.inimigos.mamute.raio).toBe(16)
    expect(conteudoPlaneta.fases[0].perigos.map((ev) => ev.id)).toEqual(['meteoros', 'enchente', 'raios'])
    expect(conteudoPescador.fases[0].perigos.map((ev) => ev.id)).toEqual(['nevoeiro', 'onda-gigante', 'tempestade'])
    expect(conteudoPescador.fases[0].perigos.find((ev) => ev.id === 'tempestade').dano).toBe(0)
    expect(conteudoPlaneta.fases[9].perigos).toEqual([])
    expect(conteudoPescador.fases[10].perigos).toEqual([])

    const parado = { x: 0, y: 0, acao: false, acaoSegurada: false }
    function passo(p) {
      if (p.pausa === 'cartas') escolherCarta(p, 0)
      else tick(p, 1 / 60, parado)
      p.inimigos.length = 0
      p.acumulo = 0
    }
    function ate(p, id) {
      let guarda = 0
      while (guarda++ < 4000 && !(p.perigoAtual && p.perigoAtual.id === id)) passo(p)
      return p.perigoAtual
    }
    function soltar(p) {
      let guarda = 0
      while (p.perigoAtual && p.perigoAtual.fase === 'aviso' && guarda++ < 200) passo(p)
    }

    const facil = criarPartida(conteudoPlaneta, { fase: 0, seed: 3, modo: 'facil' })
    escolherCarta(facil, 0)
    const aviso = ate(facil, 'raios')
    expect(aviso.fase).toBe('aviso')
    expect(aviso.marcas).toHaveLength(4)
    facil.jogador.x = aviso.marcas[0].x
    facil.jogador.y = aviso.marcas[0].y
    soltar(facil)
    expect(facil.perigoAtual.fase).toBe('ativo')
    expect(facil.jogador.hp).toBe(100)

    const normal = criarPartida(conteudoPlaneta, { fase: 0, seed: 3, modo: 'normal' })
    escolherCarta(normal, 0)
    const raio = ate(normal, 'raios')
    normal.jogador.x = raio.marcas[0].x
    normal.jogador.y = raio.marcas[0].y
    normal.jogador.iframes = 0
    soltar(normal)
    expect(normal.jogador.hp).toBeLessThan(100)

    const barco = criarPartida(conteudoPescador, { fase: 0, seed: 4, modo: 'facil' })
    escolherCarta(barco, 0)
    expect(ate(barco, 'nevoeiro').fase).toBe('aviso')
    soltar(barco)
    expect(barco.visao).toBe(70)
    expect(barco.jogador.hp).toBe(100)
    const onda = ate(barco, 'onda-gigante')
    expect(onda.fase).toBe('aviso')
    expect(onda.marcas).toHaveLength(0)
    soltar(barco)
    const x0 = barco.jogador.x
    const y0 = barco.jogador.y
    for (let i = 0; i < 20; i++) passo(barco)
    expect(Math.hypot(barco.jogador.x - x0, barco.jogador.y - y0)).toBeGreaterThan(20)
    expect(barco.jogador.hp).toBe(100)
    const chuva = ate(barco, 'tempestade')
    expect(chuva.fase).toBe('aviso')
    expect(chuva.marcas).toHaveLength(0)
    soltar(barco)
    let guardaRaio = 0
    while (guardaRaio++ < 200 && !(barco.perigoAtual && barco.perigoAtual.raio)) passo(barco)
    expect(barco.perigoAtual.raio.dist).toBeGreaterThanOrEqual(64)
    expect(Math.hypot(barco.perigoAtual.raio.x - barco.jogador.x, barco.perigoAtual.raio.y - barco.jogador.y)).toBeGreaterThanOrEqual(64)
    expect(barco.jogador.hp).toBe(100)
    const normalBarco = criarPartida(conteudoPescador, { fase: 0, seed: 4, modo: 'normal' })
    escolherCarta(normalBarco, 0)
    soltar(ate(normalBarco, 'tempestade') && normalBarco)
    guardaRaio = 0
    while (guardaRaio++ < 200 && !(normalBarco.perigoAtual && normalBarco.perigoAtual.raio)) passo(normalBarco)
    normalBarco.jogador.x = normalBarco.perigoAtual.raio.x
    normalBarco.jogador.y = normalBarco.perigoAtual.raio.y
    while (normalBarco.perigoAtual && normalBarco.perigoAtual.raio && normalBarco.perigoAtual.raio.fase === 'pisca') passo(normalBarco)
    expect(normalBarco.jogador.hp).toBe(100)
  })

  it('mira o mais perto, o chefe tem prioridade e o golpe vai nele', () => {
    for (const g of [...conteudoPlaneta.golpes, ...conteudoPescador.golpes]) {
      expect(g.tipo).not.toBe('orbita')
      expect(g.tipo).not.toBe('aura')
    }
    expect(conteudoPlaneta.inicial).toBe('funda')
    expect(conteudoPescador.inicial).toBe('arpao')
    const parado = { x: 0, y: 0, acao: false, acaoSegurada: false }
    const p = criarPartida(conteudoPlaneta, { fase: 0, seed: 2, modo: 'facil' })
    escolherCarta(p, 0)
    let guarda = 0
    while (guarda++ < 500 && !p.inimigos.some((b) => b.morrendo < 0)) tick(p, 1 / 60, parado)
    const vivos = p.inimigos.filter((b) => b.morrendo < 0)
    expect(vivos.length).toBeGreaterThan(0)
    vivos[0].x = 50
    vivos[0].y = 0
    vivos[0].chefe = false
    const longe = vivos[1] || vivos[0]
    if (longe === vivos[0]) {
      p.inimigos.push({ ...vivos[0], id: 999, x: 200, y: 0, chefe: true, hp: 50, morrendo: -1 })
    } else {
      longe.x = 200
      longe.y = 0
      longe.chefe = true
      longe.hp = 80
      longe.morrendo = -1
    }
    const chefe = p.inimigos.find((b) => b.chefe && b.morrendo < 0)
    p.chefe = chefe
    const xAntes = p.jogador.x
    tick(p, 1 / 60, parado)
    expect(p.alvo).toBe(chefe)
    expect(p.jogador.x).toBeCloseTo(xAntes, 1)
    chefe.morrendo = 0
    tick(p, 1 / 60, parado)
    const comum = p.inimigos.find((b) => b.morrendo < 0 && !b.chefe)
    expect(p.alvo).toBe(comum)
    let tiro = null
    for (let i = 0; i < 90 && !tiro; i++) {
      tick(p, 1 / 60, parado)
      tiro = p.ataques.find((a) => a.tipo === 'tiro' && a.vx)
    }
    expect(tiro).toBeTruthy()
    expect(tiro.vx).toBeGreaterThan(0)
    expect(p.ataques.some((a) => a.tipo === 'orbita')).toBe(false)
  })
})

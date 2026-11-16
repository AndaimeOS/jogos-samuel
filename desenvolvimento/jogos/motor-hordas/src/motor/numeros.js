/**
 * Números do motor, copiados do código MIT de Pedro Barretto (Copyright (c) 2026).
 * viewport.ts, math.ts (dir8), rng.ts, spatial.ts e a regra do joystick em engine/input.ts.
 * Sem sprite, nome de criatura ou som daquele jogo.
 */

export const TAU = Math.PI * 2

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export function dir8(x, y) {
  const octant = (Math.round(Math.atan2(y, x) / (Math.PI / 4)) + 8) % 8
  return (2 - octant + 8) % 8
}

export function dirPara(ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy)
  return len > 1e-6 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 }
}

export function reter(itens, fica) {
  let w = 0
  for (let r = 0; r < itens.length; r++) if (fica(itens[r])) itens[w++] = itens[r]
  itens.length = w
}

export function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function criarRng(seed) {
  const state = { a: seed >>> 0 }
  const rng = () => {
    const a = (state.a = (state.a + 0x6d2b79f5) >>> 0)
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  rng.state = state
  return rng
}

export const faixa = (rng, min, max) => min + rng() * (max - min)
export const chance = (rng, p) => rng() < p
export const escolher = (rng, itens) => itens[Math.floor(rng() * itens.length)]

export function escolherPeso(rng, entradas) {
  let total = 0
  for (const [, w] of entradas) total += w
  let roll = rng() * total
  for (const [item, w] of entradas) {
    roll -= w
    if (roll <= 0) return item
  }
  return entradas[entradas.length - 1][0]
}

/** hash2 de engine/rng.ts — o chão e o bioma saem daqui, iguais em todo aparelho. */
export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function criarGrade(celula) {
  return { celula, cells: new Map(), used: [] }
}

function chave(cx, cy) {
  return ((cx & 0x7fff) << 15) | (cy & 0x7fff)
}

export function limparGrade(grade) {
  for (const balde of grade.used) balde.length = 0
  grade.used.length = 0
  if (grade.cells.size > 4096) grade.cells.clear()
}

export function inserir(grade, index, x, y) {
  const k = chave(Math.floor(x / grade.celula), Math.floor(y / grade.celula))
  let balde = grade.cells.get(k)
  if (!balde) grade.cells.set(k, (balde = []))
  if (balde.length === 0) grade.used.push(balde)
  balde.push(index)
}

export function consultar(grade, x, y, raio, saida) {
  let n = 0
  const minX = Math.floor((x - raio) / grade.celula)
  const maxX = Math.floor((x + raio) / grade.celula)
  const minY = Math.floor((y - raio) / grade.celula)
  const maxY = Math.floor((y + raio) / grade.celula)
  for (let cx = minX; cx <= maxX; cx++) {
    for (let cy = minY; cy <= maxY; cy++) {
      const balde = grade.cells.get(chave(cx, cy))
      if (balde) for (const i of balde) saida[n++] = i
    }
  }
  saida.length = n
  return saida
}

const LADO_CURTO_CELULAR = 600
const MUNDO_CURTO_CELULAR = 220
const MUNDO_CURTO = 300
const MIN_VISTA = 100

export function escalaDispositivo(cssW, cssH, dpr) {
  const curto = Math.min(cssW, cssH)
  if (curto < LADO_CURTO_CELULAR) return Math.max(2, Math.round((curto * dpr) / MUNDO_CURTO_CELULAR))
  return Math.max(2, Math.round(Math.max(2, Math.round(curto / MUNDO_CURTO)) * dpr))
}

function ladoPar(px) {
  if (!(px >= 1)) return 1
  const inteiro = Math.ceil(px)
  return inteiro + (inteiro % 2)
}

export function encaixarVista(cssW, cssH, dpr) {
  const escala = escalaDispositivo(cssW, cssH, dpr)
  return {
    w: ladoPar((cssW * dpr) / escala),
    h: ladoPar((cssH * dpr) / escala),
    cssScale: escala / dpr,
    dpr,
  }
}

export function vistaQueCabe(visual, layout) {
  const serve = (s) => s && s.width >= MIN_VISTA && s.height >= MIN_VISTA
  if (serve(visual)) return visual
  if (serve(layout)) return layout
  return null
}

/** Raio do manche, zona morta e velocidade cheia: engine/input.ts. */
export const RAIO_STICK = 52
const ZONA_MORTA = 8
const CHEIO_EM = 0.75

function vetorStick(dx, dy, percurso) {
  const vel = Math.min(1, Math.max(0, (percurso - ZONA_MORTA) / (RAIO_STICK * CHEIO_EM - ZONA_MORTA)))
  return vel > 0 ? { x: (dx / percurso) * vel, y: (dy / percurso) * vel } : { x: 0, y: 0 }
}

/**
 * Joystick flutuante. Passou do raio, a base acompanha o dedo
 * (a inversão de direção é imediata). Dentro da zona morta, parado.
 */
export function joystick(origem, ponteiro) {
  let dx = ponteiro.x - origem.x
  let dy = ponteiro.y - origem.y
  const len = Math.hypot(dx, dy)
  let base = origem
  if (len > RAIO_STICK) {
    const k = RAIO_STICK / len
    base = { x: ponteiro.x - dx * k, y: ponteiro.y - dy * k }
    dx *= k
    dy *= k
  }
  const percurso = Math.hypot(dx, dy)
  return { origin: base, knob: { x: base.x + dx, y: base.y + dy }, vec: vetorStick(dx, dy, percurso) }
}

/** xpFor de game/leveling.ts — 5 de experiência para o nível 2. */
export function xpPara(nivel) {
  return Math.floor(5 + (nivel - 1) * 9 + Math.max(0, nivel - 20) * 6 + Math.max(0, nivel - 40) * 10)
}

/** Anel fora da tela: hypot(vista) / 2 + 12, de game/spawner.ts. */
export function distanciaAnel(w, h) {
  return Math.hypot(w, h) / 2 + 12
}

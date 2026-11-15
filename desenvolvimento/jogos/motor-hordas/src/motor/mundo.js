/**
 * Mapa de biomas por região de 1100 px. A conta é a de game/biomeMap.ts
 * (grade, jitter, anéis, hash2). Os nomes dos biomas vêm do jogo, não de lá.
 */
import { hash2 } from './numeros.js'

export const REGIAO = 1100
const JITTER = 0.6
const ANEIS = [2400, 4400, 7200]
const SAL = { jitterX: 9105, jitterY: 9106, pick: 9107, ring: 9108 }

function sitioX(seed, i, j) {
  if (i === 0 && j === 0) return 0
  return (i + (hash2(i, j, seed + SAL.jitterX) - 0.5) * JITTER) * REGIAO
}
function sitioY(seed, i, j) {
  if (i === 0 && j === 0) return 0
  return (j + (hash2(i, j, seed + SAL.jitterY) - 0.5) * JITTER) * REGIAO
}

function andar(seed, i, j, d2) {
  const wobble = 0.9 + hash2(i, j, seed + SAL.ring) * 0.2
  let tier = 0
  for (const anel of ANEIS) {
    const r = anel * wobble
    if (d2 < r * r) return tier
    tier++
  }
  return tier
}

/** Bioma da região (i, j). A lista é a da fase (duas paisagens da era ou da água). */
export function biomaRegiao(seed, i, j, biomas) {
  const lista = biomas.length ? biomas : ['campo']
  if (i === 0 && j === 0) return lista[0]
  const x = sitioX(seed, i, j)
  const y = sitioY(seed, i, j)
  const tier = andar(seed, i, j, x * x + y * y)
  const indice = Math.floor(hash2(i, j, seed + SAL.pick + tier) * lista.length)
  return lista[indice % lista.length]
}

/** Bioma no ponto do mundo. Olha a região da grade de 1100 px. */
export function biomaEm(seed, x, y, biomas) {
  const i = Math.round(x / REGIAO)
  const j = Math.round(y / REGIAO)
  let melhor = biomaRegiao(seed, i, j, biomas)
  let melhorD = Infinity
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const cx = sitioX(seed, i + di, j + dj)
      const cy = sitioY(seed, i + di, j + dj)
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy)
      if (d < melhorD) {
        melhorD = d
        melhor = biomaRegiao(seed, i + di, j + dj, biomas)
      }
    }
  }
  return melhor
}

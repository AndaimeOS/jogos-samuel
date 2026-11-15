/**
 * Partida solo. A ordem do passo e as contas vêm do motor MIT
 * (spawner, enemies, attacks, leveling, effects, difficulty):
 * nasce fora da tela, corpos se separam, empurrão pela massa,
 * experiência, três cartas, tremor, número de dano, partículas.
 * Os nomes, os números de cada fase e a arte são do jogo.
 */
import { biomaEm } from './mundo.js'
import {
  TAU, clamp, consultar, criarGrade, criarRng, dir8, dirPara, distanciaAnel,
  faixa, inserir, limparGrade, reter, xpPara, escolherPeso,
} from './numeros.js'

export const PROPOSTA = true
export const MAX_GOLPES = 6
export const MAX_ITENS = 6
export const MAX_PARTICULAS = 900
export const MAX_TEXTOS = 120

/** Curva do spawner (waves.ts), comprimida na fase. Os segundos são PROPOSTA. */
export const CURVA = [
  { ate: 20, taxa: 1.4, max: 40 },
  { ate: 45, taxa: 2.2, max: 70 },
  { ate: Infinity, taxa: 3, max: 100 },
]

/**
 * Fácil não perde: menos dano, bicho mais lento, regenera e a vida não zera.
 * Normal é a partida base (o piso é zero e a fase acaba).
 */
export const DIFICULDADE = {
  facil: { vidaInimigo: 0.75, danoInimigo: 0.45, velocidadeInimigo: 0.7, taxa: 0.85, cura: 1.6, piso: 1, iframes: 0.55 },
  normal: { vidaInimigo: 1, danoInimigo: 1, velocidadeInimigo: 1, taxa: 1, cura: 0, piso: 0, iframes: 0.5 },
}

const BASE = {
  hpMax: 100, speed: 68, might: 1, area: 1, cooldown: 1, duration: 1,
  amount: 0, projectileSpeed: 1, magnet: 110, regen: 0, armor: 0, growth: 1,
}

const VIZINHOS = []

function defGolpe(conteudo, id) {
  return conteudo.golpes.find((g) => g.id === id)
}
function defItem(conteudo, id) {
  return conteudo.itens.find((g) => g.id === id)
}
function defBicho(conteudo, id) {
  return conteudo.inimigos[id]
}

function statsDe(p) {
  const s = { ...BASE }
  const dif = DIFICULDADE[p.modo]
  s.regen += dif.cura
  let extraVida = 0
  for (const it of p.jogador.itens) {
    const def = defItem(p.conteudo, it.id)
    if (!def) continue
    const n = it.nivel
    for (const [k, v] of Object.entries(def.soma || {})) {
      if (k === 'hpMax') extraVida += v * n
      else s[k] = (s[k] || 0) + v * n
    }
    for (const [k, v] of Object.entries(def.multiplica || {})) s[k] *= v ** n
  }
  s.hpMax = BASE.hpMax + extraVida
  s.armor = clamp(s.armor, 0, 0.6)
  return s
}

function aplicarStats(p) {
  const antes = p.jogador.stats.hpMax
  p.jogador.stats = statsDe(p)
  if (p.jogador.stats.hpMax > antes) p.jogador.hp += p.jogador.stats.hpMax - antes
  p.jogador.hp = Math.min(p.jogador.hp, p.jogador.stats.hpMax)
}

function soltarTexto(p, x, y, texto, cor) {
  if (p.textos.length > MAX_TEXTOS) p.textos.shift()
  p.textos.push({ x: x + faixa(p.rng, -4, 4), y, vy: -38, vida: 0, texto, cor })
}

function estouro(p, x, y, cores, n, vel = 70) {
  for (let i = 0; i < n && p.particulas.length < MAX_PARTICULAS; i++) {
    const a = faixa(p.rng, 0, TAU)
    const s = faixa(p.rng, vel * 0.3, vel)
    p.particulas.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      vida: 0, ttl: faixa(p.rng, 0.25, 0.45), cor: cores[Math.floor(p.rng() * cores.length)],
      tam: 2, grav: 0, arrasto: 4,
    })
  }
}

function tremer(p, qtd) {
  p.tremor = Math.max(p.tremor, qtd)
}

function machucarJogador(p, dano, de) {
  const j = p.jogador
  if (j.iframes > 0 || p.pausa !== 'jogo') return
  const dif = DIFICULDADE[p.modo]
  const liquido = Math.max(1, dano * dif.danoInimigo * (1 - j.stats.armor))
  j.hp -= liquido
  j.iframes = dif.iframes
  j.ferido = 0.15
  tremer(p, 3)
  soltarTexto(p, j.x, j.y - 20, String(Math.round(liquido)), '#E2544A')
  if (de) {
    const d = dirPara(de.x, de.y, j.x, j.y)
    j.kx += d.x * 80
    j.ky += d.y * 80
  }
  if (j.hp <= dif.piso) {
    j.hp = dif.piso
    if (dif.piso <= 0) {
      j.hp = 0
      p.pausa = 'derrota'
      estouro(p, j.x, j.y, ['#193337', '#E2544A'], 18, 90)
    }
  }
}

function empurrar(bicho, dx, dy, forca) {
  const d = Math.hypot(dx, dy) || 1
  bicho.kx += (dx / d) * forca / bicho.massa
  bicho.ky += (dy / d) * forca / bicho.massa
}

function ferirBicho(p, bicho, dano, deX, deY, golpe) {
  if (bicho.morrendo >= 0) return
  const j = p.jogador
  let q = dano * j.stats.might
  if (bicho.queima > 0) q *= 1.15
  bicho.hp -= q
  bicho.ferido = 0.12
  empurrar(bicho, bicho.x - deX, bicho.y - deY, (golpe && golpe.empurrao) || 40)
  soltarTexto(p, bicho.x, bicho.y - bicho.raio, String(Math.max(1, Math.round(q))), '#193337')
  estouro(p, bicho.x, bicho.y, ['#F5F2E8', '#FF9D52'], 4, 50)
  if (golpe && golpe.queima) bicho.queima = Math.max(bicho.queima, 2)
  if (golpe && golpe.puxa) {
    const d = dirPara(bicho.x, bicho.y, deX, deY)
    bicho.kx += d.x * golpe.puxa / bicho.massa
    bicho.ky += d.y * golpe.puxa / bicho.massa
  }
  if (bicho.hp <= 0) {
    bicho.morrendo = 0
    bicho.hp = 0
    ganharXp(p, bicho.xp)
    estouro(p, bicho.x, bicho.y, ['#B9ED80', '#FF9D52', '#193337'], bicho.chefe ? 28 : 10, 110)
    if (bicho.chefe) tremer(p, bicho.lendario ? 9 : 5)
    soltarGema(p, bicho.x, bicho.y, bicho.xp)
    p.derrotados++
  }
}

function soltarGema(p, x, y, xp) {
  const faixaXp = xp >= 6 ? 3 : xp >= 3 ? 2 : 1
  p.gemas.push({ x, y, xp: Math.max(1, xp), faixa: faixaXp, viva: true, idade: 0 })
}

function agruparGemas(p) {
  const vivas = p.gemas.filter((g) => g.viva)
  for (let i = 0; i < vivas.length; i++) {
    const a = vivas[i]
    if (!a.viva) continue
    for (let k = i + 1; k < vivas.length; k++) {
      const b = vivas[k]
      if (!b.viva) continue
      if (Math.hypot(a.x - b.x, a.y - b.y) > 18) continue
      a.xp += b.xp
      a.faixa = Math.max(a.faixa, b.faixa)
      a.idade = Math.min(a.idade || 0, b.idade || 0)
      b.viva = false
    }
  }
}

export function ganharXp(p, qtd) {
  const j = p.jogador
  j.xp += qtd * j.stats.growth
  let subiu = false
  while (j.xp >= j.xpProx) {
    j.xp -= j.xpProx
    j.nivel++
    j.xpProx = xpPara(j.nivel)
    j.pendentes++
    subiu = true
  }
  if (subiu && p.pausa === 'jogo') abrirCartas(p)
}

function modsGolpe(def, caminho) {
  const m = { n: 0, dano: 0, raio: 0, queima: false, empurrao: 0, puxa: 0 }
  if (!def.bifurca) return m
  if (caminho & 1 && def.bifurca[4]) Object.assign(m, def.bifurca[4][1].mod, m, def.bifurca[4][1].mod)
  if (caminho & 2 && def.bifurca[7]) Object.assign(m, def.bifurca[7][1].mod)
  if ((caminho & 1) === 0 && def.bifurca[4] && (caminho & 1) === 0 && arguments.length) {
    /* ramo A é o índice 0, aplicado só quando o nível já passou da bifurcação */
  }
  return m
}

function modsAtivos(def, golpe) {
  const m = { n: 0, dano: 0, raio: 0, queima: false, empurrao: 0, puxa: 0, vel: 0 }
  if (!def.bifurca) return m
  if (golpe.nivel >= 4) Object.assign(m, def.bifurca[4][golpe.caminho & 1].mod)
  if (golpe.nivel >= 7) Object.assign(m, def.bifurca[7][(golpe.caminho >> 1) & 1].mod)
  return m
}

function poolCartas(p, soNovos) {
  const j = p.jogador
  const pool = []
  if (j.golpes.length < MAX_GOLPES) {
    for (const g of p.conteudo.golpes) {
      if (j.golpes.some((o) => o.id === g.id)) continue
      pool.push({ tipo: 'golpe', id: g.id, peso: soNovos ? 1 : 1, nome: g.nome, texto: g.texto, icone: g.icone })
    }
  }
  if (soNovos) return pool
  for (const g of j.golpes) {
    const def = defGolpe(p.conteudo, g.id)
    const prox = g.nivel + 1
    if ((prox === 4 || prox === 7) && def.bifurca && def.bifurca[prox]) {
      def.bifurca[prox].forEach((ramo, indice) => {
        pool.push({
          tipo: 'bifurca', id: g.id, passo: prox, indice, peso: 1.3,
          nome: ramo.nome, texto: ramo.texto, icone: def.icone,
        })
      })
    } else if (g.nivel < 8) {
      pool.push({
        tipo: 'melhora', id: g.id, peso: 1.3,
        nome: def.nome, texto: 'Fica mais forte.', icone: def.icone,
      })
    }
  }
  if (j.itens.length < MAX_ITENS || j.itens.some((it) => it.nivel < 4)) {
    for (const it of p.conteudo.itens) {
      const tem = j.itens.find((o) => o.id === it.id)
      if (!tem && j.itens.length >= MAX_ITENS) continue
      if (tem && tem.nivel >= 4) continue
      pool.push({
        tipo: tem ? 'item' : 'item-novo', id: it.id, peso: tem ? 1.1 : 0.85,
        nome: it.nome, texto: it.texto, icone: it.icone,
      })
    }
  }
  return pool
}

function tirarCartas(p, pool) {
  const rng = p.rng
  const entradas = pool.map((c) => [c, c.peso])
  const saida = []
  const usados = new Set()
  for (let i = 0; i < 3 && entradas.length; i++) {
    const carta = escolherPeso(rng, entradas)
    const chave = `${carta.tipo}:${carta.id}:${carta.indice ?? ''}:${carta.passo ?? ''}`
    if (usados.has(chave)) {
      const idx = entradas.findIndex(([c]) => c === carta)
      if (idx >= 0) entradas.splice(idx, 1)
      i--
      continue
    }
    usados.add(chave)
    saida.push(carta)
    const idx = entradas.findIndex(([c]) => c === carta)
    if (idx >= 0) entradas.splice(idx, 1)
  }
  return saida
}

function abrirCartas(p) {
  const soNovos = p.jogador.golpes.length < 2
  const pool = poolCartas(p, soNovos)
  p.ofertas = tirarCartas(p, pool.length ? pool : poolCartas(p, false))
  p.pausa = p.ofertas.length ? 'cartas' : 'jogo'
  if (!p.ofertas.length) p.jogador.pendentes = 0
}

export function escolherCarta(p, indice) {
  if (p.pausa !== 'cartas') return
  const carta = p.ofertas[indice]
  if (!carta) return
  const j = p.jogador
  if (carta.tipo === 'golpe') {
    j.golpes.push({ id: carta.id, nivel: 1, cd: 0.2, caminho: 0 })
  } else if (carta.tipo === 'melhora') {
    const g = j.golpes.find((o) => o.id === carta.id)
    if (g) g.nivel++
  } else if (carta.tipo === 'bifurca') {
    const g = j.golpes.find((o) => o.id === carta.id)
    if (g) {
      g.nivel = carta.passo
      if (carta.passo === 4) g.caminho = (g.caminho & ~1) | carta.indice
      else g.caminho = (g.caminho & ~2) | (carta.indice << 1)
    }
  } else {
    let it = j.itens.find((o) => o.id === carta.id)
    if (!it) j.itens.push((it = { id: carta.id, nivel: 0 }))
    it.nivel++
  }
  aplicarStats(p)
  j.pendentes = Math.max(0, j.pendentes - 1)
  estouro(p, j.x, j.y, ['#CEB7EF', '#B9ED80'], 12, 60)
  if (j.pendentes > 0) abrirCartas(p)
  else {
    p.ofertas = []
    p.pausa = 'jogo'
  }
}

function nascer(p, id, x, y, extra) {
  const def = defBicho(p.conteudo, id)
  if (!def) return null
  const dif = DIFICULDADE[p.modo]
  const ordem = 1 + (p.fase.ordem - 1) * 0.12
  const elite = extra && extra.elite
  const chefe = !!def.chefe || !!(extra && extra.chefe)
  const hp = def.hp * dif.vidaInimigo * ordem * (elite ? 3 : 1) * (chefe ? 1 : 1)
  const bicho = {
    id: ++p.seq,
    tipo: id,
    sprite: def.sprite,
    x, y,
    hp, hpMax: hp,
    raio: (def.raio || 8) * (elite ? 1.35 : 1) * (chefe ? 1.15 : 1),
    vel: def.vel * dif.velocidadeInimigo * (elite ? 1.05 : 1),
    dano: def.dano,
    xp: Math.round(def.xp * (elite ? 3 : 1)),
    massa: def.massa * (chefe ? 4 : 1),
    comportamento: def.comportamento || 'chase',
    chefe, elite: !!elite, lendario: !!def.lendario,
    kx: 0, ky: 0, dir: 0,
    idade: 0, ferido: 0, morrendo: -1, queima: 0,
    faseChefe: 1, ataque: faixa(p.rng, 0.4, 1.2),
    vx: 0, vy: 0, ttl: extra && extra.ttl ? extra.ttl : 0,
    altura: def.altura || (chefe ? 34 : 20),
    footY: def.footY || 0,
  }
  if (extra && extra.vx != null) {
    bicho.vx = extra.vx
    bicho.vy = extra.vy
    bicho.comportamento = 'flyby'
  }
  p.inimigos.push(bicho)
  return bicho
}

function pontoFora(p) {
  const j = p.jogador
  const ang = faixa(p.rng, 0, TAU)
  const d = distanciaAnel(p.vista.w, p.vista.h)
  return { x: j.x + Math.cos(ang) * d, y: j.y + Math.sin(ang) * d }
}

function vivos(p) {
  return p.inimigos.filter((b) => b.morrendo < 0 && !b.chefe).length
}

function curvaEm(tempo) {
  return CURVA.find((c) => tempo < c.ate) || CURVA[CURVA.length - 1]
}

function dispararAnel(p, id, n) {
  const j = p.jogador
  const d = distanciaAnel(p.vista.w, p.vista.h) - 20
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU
    nascer(p, id, j.x + Math.cos(a) * d, j.y + Math.sin(a) * d)
  }
}

function dispararBando(p, id, n) {
  const j = p.jogador
  const ang = faixa(p.rng, 0, TAU)
  const d = distanciaAnel(p.vista.w, p.vista.h)
  const def = defBicho(p.conteudo, id)
  const vel = (def ? def.vel : 40) * 1.7
  const vx = Math.cos(ang) * vel
  const vy = Math.sin(ang) * vel
  for (let i = 0; i < n; i++) {
    const lado = faixa(p.rng, -70, 70)
    const atras = faixa(p.rng, 0, 60)
    nascer(p, id, j.x - Math.cos(ang) * (d + atras) - Math.sin(ang) * lado, j.y - Math.sin(ang) * (d + atras) + Math.cos(ang) * lado, {
      vx, vy, ttl: (d * 2 + 120) / vel,
    })
  }
}

export function trazerChefe(p) {
  if (p.chefe && p.chefe.morrendo < 0) return p.chefe
  const id = p.fase.chefe || p.conteudo.chefeDaRegiao[p.fase.regiao]
  if (!id) return null
  const pos = pontoFora(p)
  const chefe = nascer(p, id, pos.x, pos.y, { chefe: true })
  if (!chefe) return null
  p.chefe = chefe
  tremer(p, chefe.lendario ? 9 : 5)
  p.eventos.chefe = true
  return chefe
}

function passoSpawner(p, dt) {
  if (p.fase.tipo === 'fim') return
  const dif = DIFICULDADE[p.modo]
  const curva = curvaEm(p.tempo)
  const chefeVivo = p.chefe && p.chefe.morrendo < 0
  const taxa = curva.taxa * dif.taxa * (chefeVivo ? 0.35 : 1)
  const teto = Math.round(curva.max * (chefeVivo ? 0.45 : 1))
  p.acumulo += taxa * dt
  let guard = 0
  while (p.acumulo >= 1 && vivos(p) < teto && guard++ < 8) {
    p.acumulo -= 1
    const lista = p.fase.horda
    const id = lista[Math.floor(p.rng() * lista.length)]
    const pos = pontoFora(p)
    nascer(p, id, pos.x, pos.y)
  }
  if (!p.eventos.bando && p.tempo >= 16) {
    p.eventos.bando = true
    dispararBando(p, p.fase.bando || p.fase.horda[0], 14)
  }
  if (!p.eventos.anel && p.tempo >= 26) {
    p.eventos.anel = true
    dispararAnel(p, p.fase.horda[0], 16)
  }
  if (!p.eventos.elite && p.tempo >= 18 && p.fase.tipo === 'fase') {
    p.eventos.elite = true
    const pos = pontoFora(p)
    const id = p.fase.horda[p.fase.horda.length - 1]
    nascer(p, id, pos.x, pos.y, { elite: true })
  }
  if ((p.fase.tipo === 'chefe' || p.fase.tipo === 'lendario') && !p.eventos.chefe && p.tempo >= p.fase.chefeEm) {
    trazerChefe(p)
  }
}

function passoInimigos(p, dt) {
  const j = p.jogador
  const amortece = Math.exp(-9 * dt)
  const recicla = Math.hypot(p.vista.w, p.vista.h) * 0.85
  for (const b of p.inimigos) {
    if (b.morrendo >= 0) {
      b.morrendo += dt
      continue
    }
    b.idade += dt
    if (b.queima > 0) {
      b.queima -= dt
      ferirBicho(p, b, 4 * dt, b.x, b.y, null)
      if (b.morrendo >= 0) continue
    }
    let vx = 0
    let vy = 0
    const fase = b.chefe && b.hp < b.hpMax * 0.5 ? 2 : 1
    if (b.chefe && fase === 2 && b.faseChefe === 1) {
      b.faseChefe = 2
      tremer(p, 5)
    }
    const pressa = b.faseChefe === 2 ? 1.35 : 1
    if (b.comportamento === 'flyby') {
      vx = b.vx
      vy = b.vy
      b.ttl -= dt
      if (b.ttl <= 0) b.morrendo = 0
    } else if (b.comportamento === 'pula') {
      b.ataque -= dt
      const d = dirPara(b.x, b.y, j.x, j.y)
      const impulso = b.ataque < 0 ? 2.4 : 0.55
      if (b.ataque < 0) b.ataque = 1.6
      vx = d.x * b.vel * impulso
      vy = d.y * b.vel * impulso
    } else {
      const d = dirPara(b.x, b.y, j.x, j.y)
      vx = d.x * b.vel * pressa
      vy = d.y * b.vel * pressa
      if (b.chefe) {
        b.ataque -= dt * (b.faseChefe === 2 ? 1.5 : 1)
        if (b.ataque <= 0) {
          b.ataque = 2.1
          const onde = p.rng() < 0.5
            ? { x: j.x, y: j.y }
            : { x: j.x + faixa(p.rng, -30, 30), y: j.y + faixa(p.rng, -30, 30) }
          p.zonas.push({ x: onde.x, y: onde.y, r: 28, arma: 0.7, dano: b.dano, sprite: 'telegraph' })
        }
      }
    }
    b.x += (vx + b.kx) * dt
    b.y += (vy + b.ky) * dt
    b.kx *= amortece
    b.ky *= amortece
    if (Math.abs(vx) + Math.abs(vy) > 1) b.dir = dir8(vx, vy)
    if (!b.chefe && b.comportamento !== 'flyby' && Math.abs(b.x - j.x) + Math.abs(b.y - j.y) > recicla * 1.3) {
      b.morrendo = 0
    }
    if (b.ferido > 0) b.ferido -= dt
  }
  reter(p.inimigos, (b) => b.morrendo < 0.5)
  if (p.chefe && p.chefe.morrendo >= 0.5) p.chefe = null

  limparGrade(p.grade)
  p.inimigos.forEach((b, i) => { if (b.morrendo < 0) inserir(p.grade, i, b.x, b.y) })
  separarCorpos(p)

  for (const z of p.zonas) {
    z.arma -= dt
    if (z.arma <= 0) {
      if (Math.hypot(j.x - z.x, j.y - z.y) < z.r + j.raio) machucarJogador(p, z.dano, { x: z.x, y: z.y })
      estouro(p, z.x, z.y, ['#E2544A', '#FF9D52'], 8, 40)
      z.morta = true
    }
  }
  reter(p.zonas, (z) => !z.morta)
}

/** Separação: corpos sobrepostos se afastam (enemies.ts). */
export function separarCorpos(p) {
  const horda = p.inimigos
  const j = p.jogador
  for (let i = 0; i < horda.length; i++) {
    const e = horda[i]
    if (!e || e.morrendo >= 0) continue
    consultar(p.grade, e.x, e.y, e.raio * 2, VIZINHOS)
    for (const k of VIZINHOS) {
      if (k === i) continue
      const o = horda[k]
      if (!o || o.morrendo >= 0) continue
      const dx = e.x - o.x
      const dy = e.y - o.y
      const min = (e.raio + o.raio) * 0.8
      const d2 = dx * dx + dy * dy
      if (d2 >= min * min || d2 === 0) continue
      const d = Math.sqrt(d2)
      const empurra = ((min - d) / d) * (o.massa / (e.massa + o.massa)) * 0.5
      e.x += dx * empurra
      e.y += dy * empurra
    }
    const dx = e.x - j.x
    const dy = e.y - j.y
    const alcance = e.raio + j.raio
    const d2 = dx * dx + dy * dy
    if (d2 < alcance * alcance && e.morrendo < 0) {
      const d = Math.sqrt(d2) || 1
      e.x = j.x + (dx / d) * alcance
      e.y = j.y + (dy / d) * alcance
      if (e.comportamento !== 'flyby' || d2 < (e.raio) * (e.raio)) machucarJogador(p, e.dano, e)
    }
  }
}

function acertaPonto(x, y, b, folga) {
  const q = pontoMira(b)
  return Math.hypot(b.x - x, b.y - y) <= folga || Math.hypot(q.x - x, q.y - y) <= folga
}

function acertarRaio(p, x, y, r, dano, golpe, deX, deY) {
  for (const b of p.inimigos) {
    if (b.morrendo >= 0) continue
    if (acertaPonto(x, y, b, r + b.raio)) ferirBicho(p, b, dano, deX, deY, golpe)
  }
}

function alcanceMira(p) {
  const j = p.jogador
  let maior = 0
  for (const g of j.golpes) {
    const def = defGolpe(p.conteudo, g.id)
    if (!def) continue
    maior = Math.max(maior, (def.alcance || 240) * j.stats.area)
  }
  return maior
}

/** Centro do quadro, o mesmo ponto da moldura. O pé fica abaixo e, no sprite grande, mente a distância. */
function pontoMira(b) {
  return { x: b.x, y: b.y - (b.footY || 0) }
}

function distanciaDoJogador(p, b) {
  const q = pontoMira(b)
  return Math.hypot(q.x - p.jogador.x, q.y - p.jogador.y)
}

/** Mundo, não tela. Recalcula todo quadro: o mais perto no alcance da arma; o chefe só se também estiver nesse alcance. */
function escolherAlvo(p) {
  const j = p.jogador
  const alcance = alcanceMira(p)
  p.alcanceMira = alcance
  const chefe = p.chefe && p.chefe.morrendo < 0 ? p.chefe : null
  if (chefe && distanciaDoJogador(p, chefe) <= alcance + (chefe.raio || 0)) {
    p.alvo = chefe
  } else {
    let melhor = null
    let perto = Infinity
    for (const b of p.inimigos) {
      if (b.morrendo >= 0 || b === chefe) continue
      const d = distanciaDoJogador(p, b)
      if (d < perto) {
        perto = d
        melhor = b
      }
    }
    p.alvo = melhor && perto <= alcance + (melhor.raio || 0) ? melhor : null
  }
  if (p.alvo) j.dir = dir8(p.alvo.x - j.x, p.alvo.y - j.y)
}

function passoGolpes(p, dt) {
  const j = p.jogador
  escolherAlvo(p)
  const alvo = p.alvo && p.alvo.morrendo < 0 ? p.alvo : null
  for (const g of j.golpes) {
    const def = defGolpe(p.conteudo, g.id)
    if (!def) continue
    g.cd -= dt
    if (g.cd > 0) continue
    if (!alvo) {
      g.cd = 0.12
      continue
    }
    const onde = pontoMira(alvo)
    const dist = Math.hypot(onde.x - j.x, onde.y - j.y)
    const alcance = (def.alcance || 240) * j.stats.area
    if (dist > alcance + alvo.raio) {
      g.cd = 0.12
      continue
    }
    const mod = modsAtivos(def, g)
    const dano = (def.dano + (mod.dano || 0)) * (1 + 0.18 * (g.nivel - 1))
    const extra = j.stats.amount + (mod.n || 0)
    g.cd = def.cadencia * j.stats.cooldown
    const golpe = {
      empurrao: def.empurrao + (mod.empurrao || 0),
      queima: !!(def.queima || mod.queima),
      puxa: (def.puxa || 0) + (mod.puxa || 0),
    }
    const n = Math.max(1, def.n + extra)
    const ang = Math.atan2(onde.y - j.y, onde.x - j.x)
    if (def.tipo === 'estocada') {
      ferirBicho(p, alvo, dano, j.x, j.y, golpe)
      p.ataques.push({
        tipo: 'estocada', x: j.x, y: j.y - 6, ax: onde.x, ay: onde.y, alvoId: alvo.id,
        dano: 0, ttl: def.duracao, golpe, sprite: def.sprite,
      })
    } else if (def.tipo === 'tiro' || def.tipo === 'volta') {
      for (let i = 0; i < n; i++) {
        const espalha = (i - (n - 1) / 2) * 0.12
        const rumo = ang + espalha
        const vel = def.vel * j.stats.projectileSpeed
        p.ataques.push({
          tipo: def.tipo, x: j.x, y: j.y - 8,
          vx: Math.cos(rumo) * vel, vy: Math.sin(rumo) * vel,
          dano, r: (def.hit || 6) * j.stats.area, ttl: def.duracao * j.stats.duration,
          atravessa: def.atravessa || 0, acertou: new Set(), golpe, sprite: def.sprite,
          fase: 'ida', vel, ang: rumo,
        })
      }
    } else if (def.tipo === 'noalvo') {
      p.ataques.push({
        tipo: 'noalvo', x: onde.x, y: onde.y, alvoId: alvo.id,
        raio: (def.raio + (mod.raio || 0)) * j.stats.area,
        dano, ttl: def.duracao * j.stats.duration, cd: 0, golpe, sprite: def.sprite,
      })
    }
  }

  for (const a of p.ataques) {
    a.ttl -= dt
    if (a.tipo === 'estocada') {
      if (alvo) {
        const q = pontoMira(alvo)
        a.ax = q.x
        a.ay = q.y
        a.alvoId = alvo.id
      }
      continue
    } else if (a.tipo === 'noalvo') {
      if (!alvo) {
        a.ttl = 0
        continue
      }
      const q = pontoMira(alvo)
      a.x = q.x
      a.y = q.y
      a.alvoId = alvo.id
      a.cd -= dt
      if (a.cd <= 0) {
        a.cd = 0.35
        acertarRaio(p, a.x, a.y, a.raio, a.dano, a.golpe, j.x, j.y)
      }
    } else if (a.tipo === 'tiro') {
      if (alvo) {
        const q = pontoMira(alvo)
        const vel = a.vel || Math.hypot(a.vx, a.vy) || 1
        const rumo = Math.atan2(q.y - a.y, q.x - a.x)
        a.vx = Math.cos(rumo) * vel
        a.vy = Math.sin(rumo) * vel
        a.alvoId = alvo.id
      }
      a.x += a.vx * dt
      a.y += a.vy * dt
      for (const b of p.inimigos) {
        if (b.morrendo >= 0 || a.acertou.has(b.id)) continue
        if (acertaPonto(a.x, a.y, b, a.r + b.raio)) {
          a.acertou.add(b.id)
          ferirBicho(p, b, a.dano, a.x - a.vx, a.y - a.vy, a.golpe)
          if (a.acertou.size > a.atravessa) a.ttl = 0
        }
      }
    } else if (a.tipo === 'volta') {
      if (a.fase === 'ida') {
        a.x += a.vx * dt
        a.y += a.vy * dt
        if (Math.hypot(a.x - j.x, a.y - j.y) > 90 * j.stats.area) a.fase = 'volta'
      } else {
        const d = dirPara(a.x, a.y, j.x, j.y)
        a.x += d.x * a.vel * dt
        a.y += d.y * a.vel * dt
        if (Math.hypot(a.x - j.x, a.y - j.y) < 12) a.ttl = 0
      }
      for (const b of p.inimigos) {
        if (b.morrendo >= 0) continue
        const marca = `${b.id}:${a.fase}`
        if (a.acertou.has(marca)) continue
        if (acertaPonto(a.x, a.y, b, a.r + b.raio)) {
          a.acertou.add(marca)
          ferirBicho(p, b, a.dano, a.x, a.y, a.golpe)
        }
      }
    }
  }
  reter(p.ataques, (a) => a.ttl > 0)
}

function passoEspeciais(p, dt, entrada) {
  const j = p.jogador
  j.especial = Math.max(0, j.especial - dt)
  if (entrada.acao && j.especial <= 0 && p.pausa === 'jogo') {
    j.especial = 8
    const alvo = p.alvo && p.alvo.morrendo < 0 ? p.alvo : null
    const onde = alvo ? pontoMira(alvo) : null
    if (onde && Math.hypot(onde.x - j.x, onde.y - j.y) <= (p.alcanceMira || alcanceMira(p))) {
      const ang = Math.atan2(onde.y - j.y, onde.x - j.x)
      tremer(p, 4)
      estouro(p, onde.x, onde.y, ['#E02020', '#FF9D52', '#F6E27A'], 16, 90)
      acertarRaio(p, onde.x, onde.y, 34 * j.stats.area, 28 * j.stats.might, { empurrao: 110, queima: false, puxa: 0 }, j.x, j.y)
      p.ataques.push({
        tipo: 'tiro', x: j.x, y: j.y - 8,
        vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280,
        dano: 0, r: 8, ttl: 0.45, atravessa: 0, acertou: new Set(),
        golpe: { empurrao: 0, queima: false, puxa: 0 },
        sprite: p.conteudo.pesca ? 'bolha' : 'pedregulho', fase: 'ida', vel: 280, ang,
      })
    }
    if (p.conteudo.pesca) pescar(p, true)
  }
  if (p.conteudo.pesca && entrada.acaoSegurada) pescar(p, false)
}

function pescar(p, forcar) {
  const j = p.jogador
  for (const c of p.cardumes) {
    if (!c.vivo) continue
    if (Math.hypot(c.x - j.x, c.y - j.y) < j.raio + c.raio + (forcar ? 10 : 18)) {
      c.vivo = false
      const agua = p.fase.agua || p.fase.regiao
      const novos = p.conteudo.peixes.filter((peixe) => peixe.agua === agua && !p.album.includes(peixe.id))
      const peixe = novos.length ? novos[Math.floor(p.rng() * novos.length)] : null
      if (peixe) p.album.push(peixe.id)
      ganharXp(p, 4)
      estouro(p, c.x, c.y, ['#6CCBBE', '#F5F2E8'], 8, 40)
      if (p.album.length >= p.conteudo.peixes.length) p.barcoDourado = true
    }
  }
}

function passoMundo(p, dt, entrada) {
  const j = p.jogador
  const dif = DIFICULDADE[p.modo]
  const emp = empurrarPerigo(p)
  const andando = Math.hypot(entrada.x, entrada.y) > 0.05
  if (andando) {
    const len = Math.hypot(entrada.x, entrada.y) || 1
    const vx = (entrada.x / len) * j.stats.speed * emp.freio
    const vy = (entrada.y / len) * j.stats.speed * emp.freio
    j.x += (vx + j.kx + emp.x) * dt
    j.y += (vy + j.ky + emp.y) * dt
    j.dir = dir8(entrada.x, entrada.y)
    j.andando = true
    j.andou += Math.hypot(vx, vy) * dt
  } else {
    j.x += (j.kx + emp.x) * dt
    j.y += (j.ky + emp.y) * dt
    j.andando = false
  }
  j.kx *= Math.exp(-9 * dt)
  j.ky *= Math.exp(-9 * dt)
  j.iframes = Math.max(0, j.iframes - dt)
  if (j.ferido > 0) j.ferido -= dt
  j.hp = Math.min(j.stats.hpMax, j.hp + (j.stats.regen) * dt)
  if (j.hp < dif.piso) j.hp = dif.piso
  j.anim += dt
  p.camera.x = j.x - p.vista.w / 2
  p.camera.y = j.y - p.vista.h / 2
  p.bioma = biomaEm(p.seed, j.x, j.y, p.fase.biomas)

  for (const g of p.gemas) {
    if (!g.viva) continue
    g.idade = (g.idade || 0) + dt
    const d = Math.hypot(g.x - j.x, g.y - j.y)
    const alcance = j.stats.magnet + (g.idade > 4 ? 80 : 0)
    if (d < alcance) {
      const passo = (180 + j.stats.magnet) * dt
      if (d <= passo || d < j.raio + 6) {
        g.viva = false
        ganharXp(p, g.xp)
      } else {
        g.x += ((j.x - g.x) / d) * passo
        g.y += ((j.y - g.y) / d) * passo
      }
    }
  }
  agruparGemas(p)
  reter(p.gemas, (g) => g.viva)

  if (p.conteudo.pesca && p.rng() < dt / 5) {
    const ang = faixa(p.rng, 0, TAU)
    const dist = faixa(p.rng, 40, 120)
    p.cardumes.push({ x: j.x + Math.cos(ang) * dist, y: j.y + Math.sin(ang) * dist, raio: 12, vivo: true })
  }
  reter(p.cardumes, (c) => c.vivo && Math.hypot(c.x - j.x, c.y - j.y) < 500)

  const amortece = Math.exp(-4 * dt)
  for (const part of p.particulas) {
    part.vida += dt
    part.vy += part.grav * dt
    part.vx *= Math.exp(-part.arrasto * dt)
    part.vy *= Math.exp(-part.arrasto * dt)
    part.x += part.vx * dt
    part.y += part.vy * dt
  }
  reter(p.particulas, (part) => part.vida < part.ttl)
  for (const t of p.textos) {
    t.vida += dt
    t.y += t.vy * dt
  }
  reter(p.textos, (t) => t.vida < 0.7)
  p.tremor *= amortece
  if (p.tremor < 0.2) p.tremor = 0
  void amortece
}

function empurrarPerigo(p) {
  const ev = p.perigoAtual
  if (!ev || ev.fase !== 'ativo') return { x: 0, y: 0, freio: 1 }
  if (ev.id === 'onda-gigante' && ev.t < 1.5) return { x: ev.dir.x * 92, y: ev.dir.y * 92, freio: 1 }
  if (ev.id === 'enchente') return { x: 0, y: 0, freio: 0.45 }
  return { x: 0, y: 0, freio: 1 }
}

function abrirPerigo(p, modelo) {
  const j = p.jogador
  const ang0 = p.rng() * Math.PI * 2
  const marcas = []
  const comMarca = modelo.id === 'meteoros' || modelo.id === 'raios'
  const n = comMarca ? 4 : 0
  for (let i = 0; i < n; i++) {
    const ang = ang0 + (i / n) * Math.PI * 2
    const dist = 80
    marcas.push({ x: j.x + Math.cos(ang) * dist, y: j.y + Math.sin(ang) * dist, r: 22, bateu: false })
  }
  const paraBaixo = p.rng() < 0.5
  const dir = modelo.id === 'onda-gigante'
    ? { x: 0, y: paraBaixo ? 1 : -1 }
    : { x: Math.cos(ang0), y: Math.sin(ang0) }
  p.perigoAtual = {
    id: modelo.id,
    aviso: modelo.aviso,
    dura: modelo.dura,
    dano: modelo.id === 'tempestade' ? 0 : (modelo.dano || 0),
    fase: 'aviso',
    t: 0,
    marcas,
    dir,
    raio: null,
    espera: 0,
  }
  p.visao = null
}

function passoPerigos(p, dt) {
  const lista = p.fase.perigos || []
  if (!p.perigoAtual) {
    const prox = lista.find((ev) => !p.perigosFeitos[ev.id] && p.tempo >= ev.em)
    if (prox) abrirPerigo(p, prox)
  }
  const ev = p.perigoAtual
  if (!ev) {
    p.visao = null
    return
  }
  ev.t += dt
  if (ev.fase === 'aviso' && ev.t >= ev.aviso) {
    ev.fase = 'ativo'
    ev.t = 0
    p.perigosFeitos[ev.id] = true
  }
  if (ev.fase === 'ativo') {
    if (ev.id === 'nevoeiro') p.visao = 70
    else p.visao = null
    if (ev.id === 'tempestade') passoRaio(p, ev, dt)
    if (ev.id !== 'tempestade' && p.modo === 'normal' && ev.dano > 0) {
      for (const m of ev.marcas) {
        if (m.bateu) continue
        if (Math.hypot(p.jogador.x - m.x, p.jogador.y - m.y) <= m.r + p.jogador.raio) {
          m.bateu = true
          machucarJogador(p, ev.dano)
        }
      }
    }
    if (ev.t >= ev.dura) {
      p.perigoAtual = null
      p.visao = null
    }
  }
}

function passoRaio(p, ev, dt) {
  if (!ev.raio) {
    ev.espera += dt
    if (ev.espera < 0.35) return
    const ang = p.rng() * Math.PI * 2
    const dist = 80 + p.rng() * 40
    ev.raio = {
      x: p.jogador.x + Math.cos(ang) * dist,
      y: p.jogador.y + Math.sin(ang) * dist,
      dist,
      t: 0,
      fase: 'pisca',
    }
    return
  }
  ev.raio.t += dt
  if (ev.raio.fase === 'pisca' && ev.raio.t >= 1) {
    ev.raio.fase = 'cai'
    ev.raio.t = 0
  } else if (ev.raio.fase === 'cai' && ev.raio.t >= 15 / 60) {
    ev.raio = null
    ev.espera = 0
  }
}

function checarFim(p) {
  if (p.pausa !== 'jogo') return
  if (p.fase.tipo === 'fase' && p.tempo >= p.fase.duracao) p.pausa = 'vitoria'
  if ((p.fase.tipo === 'chefe' || p.fase.tipo === 'lendario') && p.eventos.chefe && !p.chefe) p.pausa = 'vitoria'
}

export function criarPartida(conteudo, opcoes = {}) {
  const fase = conteudo.fases[opcoes.fase ?? 0]
  const modo = opcoes.modo === 'normal' ? 'normal' : 'facil'
  const seed = opcoes.seed ?? 20261115
  const p = {
    conteudo, fase, modo, seed,
    rng: criarRng(seed),
    vista: opcoes.vista || { w: 480, h: 320 },
    camera: { x: 0, y: 0 },
    tempo: 0,
    seq: 1,
    pausa: 'jogo',
    tremor: 0,
    bioma: fase.biomas[0],
    acumulo: 0,
    eventos: { bando: false, anel: false, elite: false, chefe: false },
    inimigos: [],
    ataques: [],
    alvo: null,
    alcanceMira: 0,
    gemas: [],
    cardumes: [],
    zonas: [],
    particulas: [],
    textos: [],
    ofertas: [],
    chefe: null,
    perigoAtual: null,
    perigosFeitos: {},
    visao: null,
    derrotados: 0,
    album: opcoes.album ? [...opcoes.album] : [],
    barcoDourado: !!opcoes.barcoDourado,
    grade: criarGrade(32),
    jogador: {
      x: 0, y: 0, kx: 0, ky: 0, dir: 0, andando: false, andou: 0, anim: 0,
      hp: 100, nivel: 1, xp: 0, xpProx: xpPara(1),
      iframes: 0, ferido: 0, raio: conteudo.pesca ? 12 : 8,
      golpes: [{ id: conteudo.inicial, nivel: 1, cd: 0.15, caminho: 0 }],
      itens: [],
      pendentes: 0,
      especial: 2,
      stats: { ...BASE },
    },
  }
  aplicarStats(p)
  p.jogador.hp = p.jogador.stats.hpMax
  if (fase.tipo === 'fim') p.pausa = 'fim'
  else {
    p.jogador.pendentes = 1
    abrirCartas(p)
  }
  return p
}

export function tick(p, dt, entrada = { x: 0, y: 0, acao: false, acaoSegurada: false }) {
  if (!p || p.pausa === 'cartas' || p.pausa === 'pausa' || p.pausa === 'derrota' || p.pausa === 'vitoria' || p.pausa === 'fim') return
  const passo = Math.min(dt, 0.05)
  p.tempo += passo
  passoPerigos(p, passo)
  passoMundo(p, passo, entrada)
  if (p.pausa !== 'jogo') return
  passoSpawner(p, passo)
  passoInimigos(p, passo)
  if (p.pausa !== 'jogo') return
  passoGolpes(p, passo)
  passoEspeciais(p, passo, entrada)
  checarFim(p)
}

export { xpPara, statsDe, modsGolpe }

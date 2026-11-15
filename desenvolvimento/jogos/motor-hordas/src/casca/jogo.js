import { criarPartida, escolherCarta, ganharXp, tick, trazerChefe } from '../motor/partida.js'
import { encaixarVista, formatarTempo, joystick } from '../motor/numeros.js'
import { biomaEm } from '../motor/mundo.js'

const TILE = 16

export async function iniciar(conteudo) {
  const root = document.getElementById('jogo')
  const tela = document.getElementById('tela')
  const ctx = tela.getContext('2d')
  const sprites = await fetch('arte/sprites.json').then((r) => r.json())
  const motor = await fetch('arte/motor.json').then((r) => r.json())
  const imagens = {}
  async function carga(chave, src) {
    if (!src || imagens[chave]) return
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    try { await img.decode() } catch { /* sprite opcional */ }
    if (img.naturalWidth) imagens[chave] = img
  }
  await Promise.all([
    ...Object.entries(sprites).map(([id, sp]) => carga(id, sp.src)),
    ...Object.entries(motor).flatMap(([id, sp]) => [
      ...Object.entries(sp.anims).map(([anim, folha]) => carga(`${id}:${anim}`, folha.src)),
      carga(`${id}:portrait`, sp.portrait),
    ]),
  ])

  let partida = null
  let save = lerSave(conteudo)
  let pronto = true
  let eixo = { x: 0, y: 0 }
  let acaoPulso = false
  let acaoSegurada = false
  let vista = encaixarVista(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1)
  let quadros = 0
  let jogado = 0
  const stick = { ativo: false, id: null, origem: { x: 80, y: 80 }, ponteiro: { x: 80, y: 80 } }

  const hud = document.getElementById('hud')
  const mapa = document.getElementById('mapa')
  const levelup = document.getElementById('levelup')
  const vitoria = document.getElementById('vitoria')
  const derrota = document.getElementById('derrota')
  const fim = document.getElementById('fim')
  const pausa = document.getElementById('pausa')
  const joystickEl = document.getElementById('joystick')
  const knob = document.getElementById('knob')

  function mostrar(el, sim) { el.hidden = !sim }

  function lerSave(c) {
    const chave = `${c.slug}:save`
    try {
      const bruto = JSON.parse(localStorage.getItem(chave) || 'null')
      if (bruto && bruto.schemaVersion === 2) return bruto
    } catch { /* save velho ou vazio */ }
    return { schemaVersion: 2, modo: 'facil', aberta: 1, vencidas: [], album: [], barcoDourado: false }
  }
  function gravar() {
    save.album = partida ? partida.album : save.album
    save.barcoDourado = partida ? partida.barcoDourado : save.barcoDourado
    localStorage.setItem(`${conteudo.slug}:save`, JSON.stringify(save))
  }

  function entrar(indice) {
    partida = criarPartida(conteudo, {
      fase: indice,
      modo: save.modo,
      seed: (Date.now() ^ (indice * 997)) >>> 0,
      vista: { w: vista.w, h: vista.h },
      album: save.album,
      barcoDourado: save.barcoDourado,
    })
    mostrar(mapa, false)
    mostrar(vitoria, false)
    mostrar(derrota, false)
    mostrar(fim, partida.pausa === 'fim')
    mostrar(levelup, partida.pausa === 'cartas')
    mostrar(pausa, false)
    if (partida.pausa === 'cartas') pintarCartas()
    if (partida.pausa === 'fim') pintarFim()
  }

  function pintarNos() {
    const caixa = document.getElementById('nos')
    const palco = document.getElementById('palco')
    caixa.replaceChildren()
    const largura = palco.clientWidth || vista.w * vista.cssScale
    const altura = palco.clientHeight || vista.h * vista.cssScale
    const escala = Math.min(largura / conteudo.mapa.w, altura / conteudo.mapa.h)
    for (const fase of conteudo.fases) {
      const aberta = fase.ordem <= save.aberta
      const feita = save.vencidas.includes(fase.ordem)
      const especial = conteudo.noEspecial[fase.ordem] || conteudo.nos[fase.regiao] || conteudo.nos[fase.agua] || conteudo.nos.rio || conteudo.nos.pedra
      const estado = !aberta ? 'travada' : feita ? 'vencida' : 'aberta'
      const botao = document.createElement('button')
      botao.type = 'button'
      botao.id = `no-${fase.ordem}`
      botao.dataset.alvo = '1'
      botao.disabled = !aberta
      botao.style.left = `${fase.x * escala - 24}px`
      botao.style.top = `${fase.y * escala - 24}px`
      botao.setAttribute('aria-label', `Fase ${fase.ordem}`)
      const img = document.createElement('img')
      img.alt = ''
      const spec = especial && sprites[especial[estado]]
      if (spec) img.src = spec.src
      botao.append(img)
      botao.addEventListener('click', () => { if (aberta) entrar(fase.ordem - 1) })
      caixa.append(botao)
    }
    const marca = document.getElementById('marca')
    const atual = conteudo.fases.find((f) => f.ordem === save.aberta) || conteudo.fases[0]
    marca.style.left = `${atual.x * escala - 16}px`
    marca.style.top = `${atual.y * escala - 52}px`
    marca.src = sprites[conteudo.marcador].src
  }

  function pintarCartas() {
    const caixa = document.getElementById('cartas')
    caixa.replaceChildren()
    partida.ofertas.forEach((carta, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.id = `carta-${i}`
      b.dataset.alvo = '1'
      b.className = 'carta'
      const img = document.createElement('img')
      img.alt = ''
      const spec = sprites[carta.icone] || sprites[conteudo.golpes[0].icone]
      if (spec) img.src = spec.src
      const nome = document.createElement('strong')
      nome.textContent = carta.nome
      const texto = document.createElement('span')
      texto.textContent = carta.texto
      b.append(img, nome, texto)
      b.addEventListener('click', () => {
        escolherCarta(partida, i)
        if (partida.pausa === 'cartas') pintarCartas()
        else mostrar(levelup, false)
      })
      caixa.append(b)
    })
    mostrar(levelup, true)
  }

  function pintarFim() {
    document.getElementById('fimTitulo').textContent = conteudo.fimTitulo
    document.getElementById('fimTexto').textContent = conteudo.fimTexto
    const img = document.getElementById('fimSprite')
    img.src = sprites[conteudo.fimSprite].src
    mostrar(fim, true)
    if (!save.vencidas.includes(partida.fase.ordem)) {
      save.vencidas.push(partida.fase.ordem)
      save.aberta = Math.max(save.aberta, partida.fase.ordem)
      gravar()
    }
  }

  function registrarVitoria() {
    const ordem = partida.fase.ordem
    if (!save.vencidas.includes(ordem)) save.vencidas.push(ordem)
    save.aberta = Math.max(save.aberta, ordem + 1)
    gravar()
    mostrar(vitoria, true)
  }

  function sincronizarHud() {
    if (!partida) return
    document.getElementById('nivel').textContent = String(partida.jogador.nivel)
    document.getElementById('relogio').textContent = formatarTempo(partida.tempo)
    document.getElementById('barraXp').style.width = `${Math.max(0, Math.min(100, (partida.jogador.xp / partida.jogador.xpProx) * 100))}%`
    const vidas = document.getElementById('vidas')
    const cheias = Math.round((partida.jogador.hp / partida.jogador.stats.hpMax) * 5)
    vidas.replaceChildren()
    for (let i = 0; i < 5; i++) {
      const img = document.createElement('img')
      img.alt = ''
      img.src = sprites[i < cheias ? conteudo.vida : conteudo.vidaVazia].src
      vidas.append(img)
    }
    const golpes = document.getElementById('golpes')
    golpes.replaceChildren()
    for (let i = 0; i < 6; i++) {
      const g = partida.jogador.golpes[i]
      const img = document.createElement('img')
      img.alt = ''
      if (g) {
        const def = conteudo.golpes.find((d) => d.id === g.id)
        if (def && sprites[def.icone]) img.src = sprites[def.icone].src
      }
      golpes.append(img)
    }
    const itens = document.getElementById('itens')
    itens.replaceChildren()
    for (let i = 0; i < 6; i++) {
      const it = partida.jogador.itens[i]
      const img = document.createElement('img')
      img.alt = ''
      if (it) {
        const def = conteudo.itens.find((d) => d.id === it.id)
        if (def && sprites[def.icone]) img.src = sprites[def.icone].src
      }
      itens.append(img)
    }
    const med = document.getElementById('medChefe')
    if (partida.chefe && partida.chefe.morrendo < 0) {
      med.hidden = false
      document.getElementById('barraChefe').style.width = `${(partida.chefe.hp / partida.chefe.hpMax) * 100}%`
    } else med.hidden = true
    const album = document.getElementById('album')
    if (conteudo.pesca) album.textContent = String(partida.album.length)
    if (partida.pausa === 'cartas' && levelup.hidden) pintarCartas()
    if (partida.pausa === 'vitoria' && vitoria.hidden) registrarVitoria()
    if (partida.pausa === 'derrota') mostrar(derrota, true)
    if (partida.pausa === 'fim') mostrar(fim, true)
  }

  function coluna(duracoes, tempo) {
    const total = duracoes.reduce((a, b) => a + b, 0) || 1
    const t = Math.floor(Math.max(0, tempo) * 60) % total
    let acc = 0
    for (let i = 0; i < duracoes.length; i++) {
      acc += duracoes[i]
      if (t < acc) return i
    }
    return 0
  }

  /** Folha do motor: 8 linhas Dir8, pé em footY abaixo do centro, escala 1. Sumico é 1 linha. */
  function desenharMotor(id, x, y, dir, tempo, anim) {
    const sp = motor[id]
    const folha = sp && sp.anims[anim]
    const img = imagens[`${id}:${anim}`]
    if (!folha || !img) return false
    const col = coluna(folha.duracoes, tempo) % folha.quadros
    const linha = folha.linhas === 1 ? 0 : (dir % 8)
    const pe = sp.body.footY
    ctx.fillStyle = 'rgba(25,51,55,0.28)'
    ctx.beginPath()
    ctx.ellipse(Math.round(x), Math.round(y), Math.max(4, sp.body.bodyW * 0.45), 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.globalAlpha = 1
    ctx.drawImage(
      img,
      col * folha.frameW, linha * folha.frameH, folha.frameW, folha.frameH,
      Math.round(x - folha.frameW / 2), Math.round(y - (folha.frameH / 2 + pe)),
      folha.frameW, folha.frameH,
    )
    ctx.restore()
    return true
  }

  function desenharSprite(id, x, y, dir, tempo, altura, dourado) {
    if (!dourado && desenharMotor(id, x, y, dir, tempo, 'Walk')) return
    const sp = sprites[id]
    const img = imagens[id]
    if (!sp || !img) return
    const escala = altura / sp.frameH
    const dw = sp.frameW * escala
    const dh = altura
    let linha = 0
    let flip = false
    if (sp.linhas >= 5 && sp.espelho) {
      const mapa = [0, 1, 2, 3, 4, 3, 2, 1]
      linha = mapa[dir] || 0
      flip = dir >= 5
    } else if (dir >= 5) flip = true
    const durs = sp.duracoes && sp.duracoes.length ? sp.duracoes : [8]
    const col = coluna(durs, tempo) % (sp.colunas || 1)
    ctx.save()
    ctx.translate(Math.round(x), Math.round(y))
    if (flip) ctx.scale(-1, 1)
    if (dourado) ctx.filter = 'sepia(1) saturate(3)'
    ctx.drawImage(img, col * sp.frameW, linha * sp.frameH, sp.frameW, sp.frameH, Math.round(-dw / 2), Math.round(-dh), Math.round(dw), Math.round(dh))
    ctx.restore()
  }

  function desenhar() {
    if (!partida) return
    partida.vista.w = vista.w
    partida.vista.h = vista.h
    const cssW = Math.round(vista.w * vista.cssScale)
    const cssH = Math.round(vista.h * vista.cssScale)
    if (tela.width !== vista.w) {
      tela.width = vista.w
      tela.height = vista.h
      tela.style.width = `${cssW}px`
      tela.style.height = `${cssH}px`
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.imageSmoothingEnabled = false
    const sx = partida.tremor ? Math.sin(partida.tempo * 40) * partida.tremor : 0
    const sy = partida.tremor ? Math.cos(partida.tempo * 35) * partida.tremor : 0
    const camX = partida.camera.x + sx
    const camY = partida.camera.y + sy
    ctx.fillStyle = conteudo.cores[partida.bioma] || '#8FCB6B'
    ctx.fillRect(0, 0, vista.w, vista.h)
    const x0 = Math.floor(camX / TILE) - 1
    const y0 = Math.floor(camY / TILE) - 1
    const x1 = Math.ceil((camX + vista.w) / TILE) + 1
    const y1 = Math.ceil((camY + vista.h) / TILE) + 1
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const bioma = biomaEm(partida.seed, tx * TILE, ty * TILE, partida.fase.biomas)
        const id = (partida.fase.chao && partida.fase.chao[bioma]) || null
        const px = Math.round(tx * TILE - camX)
        const py = Math.round(ty * TILE - camY)
        if (id && imagens[id]) {
          const sp = sprites[id]
          const variacao = ((tx * 13 + ty * 7) & 3) === 0 && sprites[`${id}-var`] ? `${id}-var` : id
          const qual = imagens[variacao] ? variacao : id
          const spv = sprites[qual]
          ctx.drawImage(imagens[qual], 0, 0, spv.frameW, spv.frameH, px, py, TILE, TILE)
          void sp
        } else {
          ctx.fillStyle = conteudo.cores[bioma] || '#8FCB6B'
          ctx.fillRect(px, py, TILE, TILE)
        }
      }
    }
    const mundo = (wx, wy) => [wx - camX, wy - camY]
    for (const g of partida.gemas) {
      const [x, y] = mundo(g.x, g.y)
      desenharSprite(conteudo.gema[g.faixa - 1] || conteudo.gema[0], x, y + 6, 0, partida.tempo, 12, false)
    }
    for (const c of partida.cardumes) {
      const [x, y] = mundo(c.x, c.y)
      desenharSprite('cardume', x, y + 8, 0, 0, 14, false)
    }
    for (const z of partida.zonas) {
      const [x, y] = mundo(z.x, z.y)
      ctx.strokeStyle = '#E2544A'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, z.r, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (const a of partida.ataques) {
      const x = a.x != null ? a.x : partida.jogador.x
      const y = a.y != null ? a.y : partida.jogador.y
      const [sx2, sy2] = mundo(x, y)
      if (a.sprite) desenharSprite(a.sprite, sx2, sy2 + 6, 2, partida.tempo, 12, false)
      else {
        ctx.fillStyle = '#FF9D52'
        ctx.fillRect(sx2 - 3, sy2 - 3, 6, 6)
      }
    }
    const lista = [...partida.inimigos].sort((a, b) => a.y - b.y)
    for (const b of lista) {
      const [x, y] = mundo(b.x, b.y)
      if (b.morrendo >= 0) {
        if (!desenharMotor(b.sprite, x, y, b.dir, b.morrendo, 'Sumico')) {
          desenharSprite(b.sprite, x, y, b.dir, b.idade, b.altura, false)
        }
        continue
      }
      const anim = b.ferido > 0 ? 'Hurt' : 'Walk'
      if (!desenharMotor(b.sprite, x, y, b.dir, b.idade, anim)) {
        desenharSprite(b.sprite, x, y, b.dir, b.idade, b.altura, false)
      }
    }
    const j = partida.jogador
    const [jx, jy] = mundo(j.x, j.y)
    const animHeroi = j.ferido > 0 ? 'Hurt' : j.andando ? 'Walk' : 'Idle'
    if (!desenharMotor(conteudo.heroi, jx, jy, j.dir, j.anim, animHeroi)) {
      const idHeroi = j.andando ? conteudo.heroiAnda : conteudo.heroiParado
      desenharSprite(idHeroi, jx, jy, j.dir, j.anim, conteudo.heroiAltura, !!partida.barcoDourado)
    }
    for (const part of partida.particulas) {
      const [x, y] = mundo(part.x, part.y)
      ctx.globalAlpha = 1 - part.vida / part.ttl
      ctx.fillStyle = part.cor
      ctx.fillRect(x, y, part.tam, part.tam)
      ctx.globalAlpha = 1
    }
    ctx.font = '700 10px Courier New, monospace'
    ctx.textAlign = 'center'
    for (const t of partida.textos) {
      const [x, y] = mundo(t.x, t.y)
      ctx.fillStyle = t.cor
      ctx.fillText(t.texto, x, y)
    }
    const mini = document.getElementById('minimapa')
    const mx = mini.getContext('2d')
    mx.imageSmoothingEnabled = false
    mx.fillStyle = '#193337'
    mx.fillRect(0, 0, 72, 72)
    mx.fillStyle = '#B9ED80'
    mx.fillRect(35, 35, 3, 3)
    mx.fillStyle = '#E2544A'
    for (const b of partida.inimigos) {
      const dx = (b.x - j.x) / 18 + 36
      const dy = (b.y - j.y) / 18 + 36
      if (dx > 0 && dy > 0 && dx < 72 && dy < 72) mx.fillRect(dx, dy, 2, 2)
    }
    sincronizarHud()
  }

  function ajustar() {
    const visual = window.visualViewport
    const caixa = visual && visual.width >= 100 ? visual : { width: window.innerWidth, height: window.innerHeight }
    vista = encaixarVista(caixa.width, caixa.height, window.devicePixelRatio || 1)
    const jogo = document.getElementById('jogo')
    jogo.style.width = `${Math.round(vista.w * vista.cssScale)}px`
    jogo.style.height = `${Math.round(vista.h * vista.cssScale)}px`
    if (mapa && !mapa.hidden) pintarNos()
  }

  function local(ev) {
    const r = root.getBoundingClientRect()
    return { x: ev.clientX - r.left, y: ev.clientY - r.top }
  }

  function botao(alvo) {
    return alvo.closest('button, a')
  }

  root.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return
    if (botao(ev.target)) return
    if (mapa && !mapa.hidden) return
    const p = local(ev)
    stick.ativo = true
    stick.id = ev.pointerId
    stick.origem = p
    stick.ponteiro = p
    try { root.setPointerCapture(ev.pointerId) } catch { /* o teste sintético não captura o dedo */ }
    posicionarStick()
  })
  root.addEventListener('pointermove', (ev) => {
    if (!stick.ativo || ev.pointerId !== stick.id) return
    stick.ponteiro = local(ev)
    const s = joystick(stick.origem, stick.ponteiro)
    stick.origem = s.origin
    eixo = s.vec
    window.__eixo = eixo
    posicionarStick()
  })
  function soltar(ev) {
    if (stick.id != null && ev.pointerId !== stick.id) return
    stick.ativo = false
    stick.id = null
    eixo = { x: 0, y: 0 }
    posicionarStick()
  }
  root.addEventListener('pointerup', soltar)
  root.addEventListener('pointercancel', soltar)

  function posicionarStick() {
    const s = joystick(stick.origem, stick.ativo ? stick.ponteiro : stick.origem)
    joystickEl.style.left = `${s.origin.x - 60}px`
    joystickEl.style.top = `${s.origin.y - 60}px`
    joystickEl.style.bottom = 'auto'
    knob.style.left = `${60 + (s.knob.x - s.origin.x) - 24}px`
    knob.style.top = `${60 + (s.knob.y - s.origin.y) - 24}px`
  }

  document.getElementById('btnAcao').addEventListener('pointerdown', (ev) => {
    ev.stopPropagation()
    acaoSegurada = true
    acaoPulso = true
  })
  document.getElementById('btnAcao').addEventListener('pointerup', () => { acaoSegurada = false })
  document.getElementById('btnAcao').addEventListener('pointercancel', () => { acaoSegurada = false })

  document.getElementById('btnPausa').addEventListener('click', () => {
    if (!partida || partida.pausa === 'fim') return
    if (partida.pausa === 'jogo') { partida.pausa = 'pausa'; mostrar(pausa, true) }
    else if (partida.pausa === 'pausa') { partida.pausa = 'jogo'; mostrar(pausa, false) }
  })
  document.getElementById('btnContinuar').addEventListener('click', () => {
    if (partida && partida.pausa === 'pausa') { partida.pausa = 'jogo'; mostrar(pausa, false) }
  })
  document.getElementById('btnRecemecar').addEventListener('click', () => {
    if (partida) entrar(partida.fase.ordem - 1)
  })
  document.getElementById('btnMapaPausa').addEventListener('click', voltarMapa)
  document.getElementById('btnProxima').addEventListener('click', voltarMapa)
  document.getElementById('btnDeNovo').addEventListener('click', () => partida && entrar(partida.fase.ordem - 1))
  document.getElementById('btnFimMapa').addEventListener('click', voltarMapa)
  document.getElementById('btnFacil').addEventListener('click', () => { save.modo = 'facil'; gravar(); marcarModo() })
  document.getElementById('btnNormal').addEventListener('click', () => { save.modo = 'normal'; gravar(); marcarModo() })

  function voltarMapa() {
    mostrar(vitoria, false)
    mostrar(derrota, false)
    mostrar(fim, false)
    mostrar(pausa, false)
    mostrar(levelup, false)
    partida = null
    mostrar(mapa, true)
    pintarNos()
  }

  function marcarModo() {
    document.getElementById('btnFacil').setAttribute('aria-pressed', save.modo === 'facil' ? 'true' : 'false')
    document.getElementById('btnNormal').setAttribute('aria-pressed', save.modo === 'normal' ? 'true' : 'false')
  }

  document.getElementById('btnTela').addEventListener('click', () => { alternarTelaCheia(root) })
  document.addEventListener('fullscreenchange', atualizarTela)
  document.addEventListener('webkitfullscreenchange', atualizarTela)
  function atualizarTela() {
    const cheia = !!(document.fullscreenElement || document.webkitFullscreenElement || root.classList.contains('cheia-fallback'))
    const img = document.querySelector('#btnTela img')
    if (img) img.src = sprites[cheia ? conteudo.controles.sair : conteudo.controles.tela].src
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && partida && partida.pausa === 'jogo') {
      partida.pausa = 'pausa'
      partida._suspenso = true
      mostrar(pausa, true)
    }
  })

  function alternarTelaCheia(el) {
    const atual = document.fullscreenElement || document.webkitFullscreenElement
    if (atual) {
      const sair = document.exitFullscreen || document.webkitExitFullscreen
      if (sair) return sair.call(document)
    }
    const pedir = el.requestFullscreen || el.webkitRequestFullscreen
    if (pedir) return pedir.call(el)
    el.classList.toggle('cheia-fallback')
    atualizarTela()
    return Promise.resolve()
  }

  const api = {
    get estado() { return partida },
    get save() { return save },
    get jogado() { return jogado },
    get quadros() { return quadros },
    CONFIG: conteudo.config,
    conteudo,
    atlasPronto: () => pronto,
    definirEixo(x, y) { eixo = { x, y } },
    ganharXp(n) { if (partida) ganharXp(partida, n) },
    trazerChefe() { return partida ? trazerChefe(partida) : null },
    escolher(i) { if (partida) { escolherCarta(partida, i); if (partida.pausa !== 'cartas') mostrar(levelup, false) } },
    desenhar,
    simular(seg) {
      if (!partida) return
      const n = Math.max(1, Math.round(seg / (1 / 60)))
      const pedaco = seg / n
      for (let i = 0; i < n; i++) {
        const pulso = acaoPulso
        acaoPulso = false
        tick(partida, pedaco, { x: eixo.x, y: eixo.y, acao: pulso, acaoSegurada })
      }
      desenhar()
    },
    entrar,
    alternarTelaCheia,
  }
  window[conteudo.api] = api
  window.__jogo = api

  marcarModo()
  mostrar(mapa, true)
    if (!conteudo.pesca) document.getElementById('album').hidden = true
    const retrato = document.getElementById('retrato')
    if (retrato && motor[conteudo.heroi] && motor[conteudo.heroi].portrait) retrato.src = motor[conteudo.heroi].portrait
  ajustar()
  stick.origem = { x: 96, y: Math.max(160, vista.h * vista.cssScale - 96) }
  stick.ponteiro = stick.origem
  posicionarStick()
  pintarNos()
  window.addEventListener('resize', ajustar)
  if (window.visualViewport) window.visualViewport.addEventListener('resize', ajustar)

  let ultimo = performance.now()
  function quadro(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000)
    ultimo = agora
    quadros++
    if (partida && partida.pausa === 'jogo' && !document.hidden) {
      const pulso = acaoPulso
      acaoPulso = false
      tick(partida, dt, { x: eixo.x, y: eixo.y, acao: pulso, acaoSegurada })
      jogado += dt
    }
    if (partida) desenhar()
    requestAnimationFrame(quadro)
  }
  requestAnimationFrame(quadro)
  posicionarStick()
}

export function alternarTelaCheia(el) {
  const atual = document.fullscreenElement || document.webkitFullscreenElement
  if (atual) {
    const sair = document.exitFullscreen || document.webkitExitFullscreen
    if (sair) return sair.call(document)
  }
  const pedir = el.requestFullscreen || el.webkitRequestFullscreen
  if (pedir) return pedir.call(el)
  el.classList.toggle('cheia-fallback')
  return Promise.resolve()
}

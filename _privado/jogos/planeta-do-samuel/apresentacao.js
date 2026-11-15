/* Apresentação da v0.2: horda, XP, cartas e chefes.
   Câmera, stick, direção, pixel, sombra, chão e noite já reescritos do MIT. */

import {
  CONFIG, ERAS, PROPOSTA, TEXTOS,
  escolherCarta, escuridao, ganharXp, orbesLasca, receberDano, restaurar, serializar, tick, criarPartida,
} from './regras.js';
import { agarreDesceu, agarreMoveu, agarreSoltou } from './motor/joystick.js';
import { sombra } from './motor/pixelart.js';
import { escolherVista, vistaQueCabe } from './motor/viewport.js';
import { desenharNoite } from './motor/noite.js';
import { desenharChao, limparChao } from './motor/chao.js';
import {
  atlasCarregado, desenharSprite, ligarAtlas, manifesto, quandoAtlas,
} from './motor/sprites.js';
import { quadroCodigo } from './motor/placeholders.js';

const MAR = { pedra: '#1E6E94', bronze: '#2A6858', ferro: '#163848' };
const NOMES_CHEFE = {
  'urso-da-caverna': 'Urso da caverna',
  'sentinela-de-bronze': 'Sentinela de bronze',
  'colosso-de-ferro': 'Colosso de ferro',
};
const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
ctx.imageSmoothingEnabled = false;
const knob = document.getElementById('knob');
const zona = document.getElementById('joystick');

let estado = criarPartida();
let pausado = true;
let ultimo = 0;
let relogio = 0;
let eixoJoy = { x: 0, y: 0 };
let joyAtivo = false;
let agarre = null;
let vista = { w: 320, h: 240, cssScale: 3 };
let cartasChave = '';
const teclas = {};

function salvar() {
  estado.desdeSave = 0;
  try { localStorage.setItem(CONFIG.chaveSave, JSON.stringify(serializar(estado))); } catch { /* o aparelho pode recusar */ }
}

function eixoAtual() {
  if (joyAtivo) return eixoJoy;
  const x = (teclas.ArrowRight || teclas.KeyD ? 1 : 0) - (teclas.ArrowLeft || teclas.KeyA ? 1 : 0);
  const y = (teclas.ArrowDown || teclas.KeyS ? 1 : 0) - (teclas.ArrowUp || teclas.KeyW ? 1 : 0);
  return { x, y };
}

function ajustarTela() {
  const caixa = document.getElementById('jogo');
  const layout = { width: caixa.clientWidth || 1, height: caixa.clientHeight || 1 };
  const visual = window.visualViewport
    ? { width: window.visualViewport.width, height: window.visualViewport.height }
    : null;
  const escolhida = escolherVista(visual, layout) || layout;
  const fit = vistaQueCabe(escolhida.width, escolhida.height, window.devicePixelRatio || 1);
  if (tela.width !== fit.w || tela.height !== fit.h) {
    tela.width = fit.w;
    tela.height = fit.h;
  }
  tela.style.width = `${fit.w * fit.cssScale}px`;
  tela.style.height = `${fit.h * fit.cssScale}px`;
  tela.style.left = `${Math.floor((layout.width - fit.w * fit.cssScale) / 2)}px`;
  tela.style.top = `${Math.floor((layout.height - fit.h * fit.cssScale) / 2)}px`;
  vista = fit;
  ctx.imageSmoothingEnabled = false;
}

function camera() {
  const mundoL = estado.colunas * CONFIG.bloco;
  const mundoA = estado.linhas * CONFIG.bloco;
  let x = estado.x - vista.w / 2;
  let y = estado.y - 10 - vista.h / 2;
  if (mundoL <= vista.w) x = (mundoL - vista.w) / 2;
  else x = Math.max(0, Math.min(mundoL - vista.w, x));
  if (mundoA <= vista.h) y = (mundoA - vista.h) / 2;
  else y = Math.max(0, Math.min(mundoA - vista.h, y));
  return { x: Math.round(x), y: Math.round(y), w: vista.w, h: vista.h };
}

function corpo(id, x, y, opts) {
  sombra(ctx, x, y, manifesto.sprites[id]?.frameW || 16);
  desenharSprite(ctx, id, relogio, x, y, opts);
}

function desenharFeixe() {
  if (!estado.farol) return;
  const p = estado.farolPos;
  const ang = Math.sin(relogio * 0.4) * 0.5;
  const co = Math.cos(ang);
  const si = Math.sin(ang);
  ctx.fillStyle = 'rgba(242, 209, 90, 0.55)';
  const lampada = p.y - 82;
  for (let t = 0; t < 72; t += 2) {
    const largura = 1 + Math.floor(t / 16);
    for (let w = -largura; w <= largura; w++) {
      ctx.fillRect(Math.round(p.x + co * t - si * w), Math.round(lampada + si * t + co * w), 1, 1);
    }
  }
}

function desenhar() {
  ajustarTela();
  const cam = camera();
  const eixo = eixoAtual();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = MAR[estado.era] || MAR.pedra;
  ctx.fillRect(0, 0, cam.w, cam.h);
  desenharChao(ctx, estado, cam, relogio);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  if (estado.enchente && estado.enchente.resta > 0) {
    const agua = estado.enchente;
    const passo = 28;
    for (let oy = -agua.raio; oy <= agua.raio; oy += passo) {
      for (let ox = -agua.raio; ox <= agua.raio; ox += passo) {
        if (ox * ox + oy * oy > agua.raio * agua.raio) continue;
        desenharSprite(ctx, 'enchente', relogio + (ox + oy) * 0.01, agua.x + ox, agua.y + oy, { alfa: 0.9 });
      }
    }
  }
  for (const z of estado.zonas) {
    if (z.evento === 'meteoros') {
      desenharSprite(ctx, 'telegraph', relogio, z.x, z.y, { alfa: 0.9 });
      desenharSprite(ctx, z.resta > 0 ? 'meteoro' : 'meteoro-impacto', relogio, z.x, z.y - 20);
    } else if (z.evento === 'raios') {
      desenharSprite(ctx, 'raio-telegraph', relogio, z.x, z.y, { alfa: 0.9 });
      desenharSprite(ctx, 'raio', relogio, z.x, z.y);
    } else {
      desenharSprite(ctx, z.sprite || 'telegraph', relogio, z.x, z.y, { alfa: 0.9 });
    }
  }
  const fila = [];
  const por = (y, desenha) => fila.push({ y, i: fila.length, desenha });
  por(estado.farolPos.y, () => corpo(estado.farol ? 'farol-aceso' : 'farol-0', estado.farolPos.x, estado.farolPos.y));
  por(184, () => corpo('cao-parado', 270, 184));
  for (const g of estado.gemas) por(g.y, () => desenharSprite(ctx, g.sprite, relogio, g.x, g.y));
  for (const inimigo of estado.inimigos) {
    por(inimigo.y, () => corpo(inimigo.sprite, inimigo.x, inimigo.y, { direcao: inimigo.direcao }));
  }
  if (estado.chefe) {
    const chefe = estado.chefe;
    por(chefe.y, () => corpo(chefe.sprite, chefe.x, chefe.y, { direcao: chefe.direcao }));
  }
  const andando = Math.hypot(eixo.x, eixo.y) > 0.1 && !pausado && !estado.pausa;
  por(estado.y, () => corpo(andando ? 'samuel-andar' : 'samuel-parado', estado.x, estado.y, {
    direcao: estado.direcao || 0,
    alfa: estado.invulneravel > 0 && Math.floor(relogio * 8) % 2 ? 0.45 : 1,
  }));
  fila.sort((a, b) => a.y - b.y || a.i - b.i);
  for (const item of fila) item.desenha();
  for (const orbe of orbesLasca(estado)) desenharSprite(ctx, 'lasca', relogio, orbe.x, orbe.y);
  if (estado.armas.faisca || estado.fogueira) {
    desenharSprite(ctx, 'faisca', relogio, estado.x, estado.y + 6, { alfa: 0.8 });
  }
  for (const tiro of estado.projeteis) {
    desenharSprite(ctx, tiro.sprite, relogio, tiro.x, tiro.y, {
      direcao: tiro.direcao,
      angulo: Math.atan2(tiro.vy, tiro.vx),
    });
  }
  for (const fx of estado.efeitos) desenharSprite(ctx, fx.tipo === 'acerto' ? 'acerto' : fx.tipo === 'morte' ? 'morte' : 'levelup', fx.idade, fx.x, fx.y);
  desenharFeixe();
  ctx.restore();
  const luzes = [];
  if (estado.fogueira) luzes.push({ x: estado.x, y: estado.y, raio: CONFIG.raioFogueira });
  if (estado.farol) luzes.push({ x: estado.farolPos.x, y: estado.farolPos.y - 40, raio: CONFIG.raioFarol });
  desenharNoite(ctx, cam, escuridao(estado), luzes);
}

function relogioTexto(seg) {
  const s = Math.max(0, Math.floor(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function atualizarHud() {
  document.getElementById('era').textContent = ERAS[estado.era].nome;
  document.getElementById('relogio').textContent = relogioTexto(estado.tempo);
  document.getElementById('nivel').textContent = `Nível ${estado.nivel}`;
  document.getElementById('barraVida').style.width = `${Math.max(0, Math.round(100 * estado.vida / estado.vidaMax))}%`;
  document.getElementById('barraXp').style.width = `${Math.max(0, Math.min(100, Math.round(100 * estado.xp / estado.xpProx)))}%`;
  const chefe = document.getElementById('medChefe');
  if (estado.chefe) {
    chefe.hidden = false;
    document.getElementById('nomeChefe').textContent = NOMES_CHEFE[estado.chefe.tipo] || 'Chefe';
    document.getElementById('barraChefe').style.width = `${Math.max(0, Math.round(100 * estado.chefe.hp / estado.chefe.hpMax))}%`;
  } else chefe.hidden = true;
  document.getElementById('dica').textContent = estado.vitoria ? TEXTOS.dica.farol : TEXTOS.dica[estado.era];
  const armas = document.getElementById('armas');
  const ids = ['lasca', 'lanca', 'faisca'].filter((id) => estado.armas[id]);
  if (estado.fogueira) ids.push('fogueira');
  if (armas.dataset.ids !== ids.join()) {
    armas.dataset.ids = ids.join();
    armas.replaceChildren();
    for (const id of ids) {
      const icon = id === 'fogueira' ? 'icone-fogueira-carta' : `icone-${id}`;
      const buf = quadroCodigo(icon, 0, 0);
      const c = document.createElement('canvas');
      c.width = buf.w;
      c.height = buf.h;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      const img = g.createImageData(buf.w, buf.h);
      img.data.set(buf.data);
      g.putImageData(img, 0, 0);
      armas.appendChild(c);
    }
  }
  mostrarCartas();
}

function mostrarCartas() {
  const caixa = document.getElementById('levelup');
  const lista = document.getElementById('cartas');
  if (!estado.pausa) {
    caixa.hidden = true;
    cartasChave = '';
    return;
  }
  caixa.hidden = false;
  const chave = `${estado.nivel}:${estado.niveisPendentes}:${estado.cartas.map((c) => c.id).join('|')}`;
  if (cartasChave === chave) return;
  cartasChave = chave;
  const aberto = performance.now();
  lista.replaceChildren();
  estado.cartas.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = `carta-${i}`;
    b.dataset.alvo = 'carta';
    b.innerHTML = `<strong>${c.nome}</strong><span>${c.texto}</span>`;
    b.addEventListener('click', () => {
      if (performance.now() - aberto < CONFIG.guardaToqueMs) return;
      escolherCarta(estado, i);
      cartasChave = '';
      salvar();
      mostrarCartas();
    });
    lista.appendChild(b);
  });
}

function frame(t) {
  const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
  ultimo = t;
  relogio += dt;
  if (!pausado) {
    tick(estado, dt, eixoAtual());
    if (estado.desdeSave >= CONFIG.autosaveSegundos) salvar();
  }
  desenhar();
  atualizarHud();
  requestAnimationFrame(frame);
}

function centroDoStick() {
  const r = zona.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function aplicarStick(stick) {
  eixoJoy = stick.vec;
  joyAtivo = true;
  const r = zona.getBoundingClientRect();
  knob.style.left = `${stick.knob.x - r.left - 24}px`;
  knob.style.top = `${stick.knob.y - r.top - 24}px`;
}

function soltarJoy() {
  joyAtivo = false;
  eixoJoy = { x: 0, y: 0 };
  agarre = null;
  knob.style.left = '40px';
  knob.style.top = '40px';
}

zona.addEventListener('pointerdown', (e) => {
  zona.setPointerCapture(e.pointerId);
  agarre = agarreDesceu(agarre, { id: e.pointerId, em: { x: e.clientX, y: e.clientY }, primario: e.isPrimary }, centroDoStick());
  if (agarre) aplicarStick(agarre.stick);
});
zona.addEventListener('pointermove', (e) => {
  agarre = agarreMoveu(agarre, e.pointerId, { x: e.clientX, y: e.clientY });
  if (agarre) aplicarStick(agarre.stick);
});
zona.addEventListener('pointerup', (e) => {
  agarre = agarreSoltou(agarre, e.pointerId);
  if (!agarre) soltarJoy();
});
zona.addEventListener('pointercancel', () => soltarJoy());
zona.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  agarre = agarreDesceu(null, { id: t.identifier, em: { x: t.clientX, y: t.clientY }, primario: true }, centroDoStick());
  if (agarre) aplicarStick(agarre.stick);
}, { passive: false });
zona.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  agarre = agarreMoveu(agarre, t.identifier, { x: t.clientX, y: t.clientY });
  if (agarre) aplicarStick(agarre.stick);
}, { passive: false });
zona.addEventListener('touchend', soltarJoy);
zona.addEventListener('touchcancel', soltarJoy);

function emJogo() {
  return document.getElementById('titulo').hidden;
}

function abrirPausa(ligar) {
  if (!emJogo()) return;
  pausado = ligar;
  document.getElementById('pausa').hidden = !ligar;
  if (ligar) salvar();
}
document.getElementById('btnPausa').addEventListener('click', () => abrirPausa(!pausado));
document.getElementById('btnSeguir').addEventListener('click', () => abrirPausa(false));
document.getElementById('btnDeNovo').addEventListener('click', () => {
  document.getElementById('pausa').hidden = true;
  comecar(true);
});
document.getElementById('btnTela').addEventListener('click', () => {
  const raiz = document.getElementById('jogo');
  if (document.fullscreenElement) document.exitFullscreen();
  else raiz.requestFullscreen?.();
});

addEventListener('keydown', (e) => {
  teclas[e.code] = true;
  if (e.code === 'KeyP' || e.code === 'Escape') abrirPausa(e.code === 'Escape' ? true : !pausado);
  if (e.code === 'Digit1') escolherCarta(estado, 0);
  if (e.code === 'Digit2') escolherCarta(estado, 1);
  if (e.code === 'Digit3') escolherCarta(estado, 2);
});
addEventListener('keyup', (e) => { teclas[e.code] = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) abrirPausa(true); });

function saveUtil() {
  try {
    const bruto = localStorage.getItem(CONFIG.chaveSave);
    return !!(bruto && restaurar(bruto));
  } catch {
    return false;
  }
}

function atualizarContinuar() {
  document.getElementById('btnContinuar').hidden = !saveUtil();
}

function comecar(novo) {
  if (novo || !saveUtil()) {
    estado = criarPartida();
    if (novo) try { localStorage.removeItem(CONFIG.chaveSave); } catch { /* segue sem apagar */ }
  } else {
    let salvo = null;
    try { salvo = localStorage.getItem(CONFIG.chaveSave); } catch { salvo = null; }
    estado = (salvo && restaurar(salvo)) || criarPartida();
  }
  document.getElementById('titulo').hidden = true;
  document.getElementById('pausa').hidden = true;
  document.getElementById('levelup').hidden = true;
  cartasChave = '';
  pausado = false;
  ultimo = 0;
  soltarJoy();
  atualizarContinuar();
}

document.getElementById('btnComecar').addEventListener('click', () => comecar(true));
document.getElementById('btnContinuar').addEventListener('click', () => comecar(false));
atualizarContinuar();
quandoAtlas(limparChao);
ligarAtlas();

window.__planeta = {
  CONFIG, PROPOSTA, TEXTOS, ERAS, manifesto,
  get estado() { return estado; },
  tick, ganharXp, escolherCarta, receberDano, serializar, restaurar, escuridao,
  salvar, comecar, quadroCodigo,
  saveUtil,
  idsSprites() { return Object.keys(manifesto.sprites); },
  amostra(id) {
    const q = quadroCodigo(id, 0, 0);
    let opacos = 0;
    for (let i = 3; i < q.data.length; i += 4) if (q.data[i]) opacos++;
    const s = manifesto.sprites[id];
    return { w: q.w, h: q.h, opacos, origem: s.origem, frameW: s.frameW, frameH: s.frameH };
  },
  definirEixo(x, y) {
    eixoJoy = { x, y };
    joyAtivo = x !== 0 || y !== 0;
  },
  simular(seg) {
    const n = Math.max(1, Math.round(seg / 0.05));
    for (let i = 0; i < n; i++) tick(estado, seg / n, eixoAtual());
    relogio += seg;
    desenhar();
    atualizarHud();
  },
  desenhar() { desenhar(); atualizarHud(); },
  travar(ligado) { pausado = !!ligado; },
  atlasPronto: atlasCarregado,
};

addEventListener('resize', () => desenhar());
requestAnimationFrame(frame);

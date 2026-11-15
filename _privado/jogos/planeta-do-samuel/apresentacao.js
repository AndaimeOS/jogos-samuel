/* Apresentação da v0.2. As regras ficam em regras.js.
   Câmera, stick, direção, pixel, sombra, ordenação, chão e noite vêm dos
   módulos em motor/, reescritos do Pokémon Survivors (MIT, Pedro Barretto). */

import {
  CONFIG, ERAS, ESTACOES, PROPOSTA, TEXTOS,
  colher, comer, contador, criarPartida, entregar, escuridao, estacaoPorId, estacaoPronta,
  fatorVelocidade, faltando, fundir, interagir, juntar, proximoPasso, restaurar, serializar, tick,
} from './regras.js';
import { dir8 } from './motor/math.js';
import { agarreDesceu, agarreMoveu, agarreSoltou, joystickFixo } from './motor/joystick.js';
import { sombra } from './motor/pixelart.js';
import { escolherVista, vistaQueCabe } from './motor/viewport.js';
import { desenharNoite } from './motor/noite.js';
import { desenharChao, limparChao } from './motor/chao.js';
import {
  alturaSprite, desenharSprite, larguraSprite, ligarAtlas, manifesto, quandoAtlas,
} from './motor/sprites.js';
import { quadroCodigo } from './motor/placeholders.js';

const MAR = { pedra: '#1E6E94', bronze: '#2A6858', ferro: '#163848' };
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
let direcao = 0;
let vista = { w: 320, h: 240, cssScale: 3 };
const teclas = {};
let avisoAte = 0;

const MOTIVOS = {
  'sem-item': 'Falta material para o próximo passo. PROPOSTA.',
  'precisa-machado': 'Isso pede o machado de pedra. PROPOSTA.',
  'era-cedo': 'Ainda não é a idade dessa estação. PROPOSTA.',
  'precisa-passo': 'Falta um passo antes deste. PROPOSTA.',
  'sem-fruta': 'Você não tem fruta. PROPOSTA.',
  'sem-minerio': 'A fornalha precisa de minério. PROPOSTA.',
  vazio: 'Aqui não tem mais nada agora. PROPOSTA.',
  longe: 'Chegue mais perto. PROPOSTA.',
  pronto: 'Isso já está pronto. PROPOSTA.',
};

const EFEITOS = {
  machado: 'Machado de pedra pronto. PROPOSTA.',
  fogueira: 'A fogueira acendeu. Ela aquece e ilumina. PROPOSTA.',
  'era:bronze': 'Idade do Bronze. PROPOSTA.',
  bancada: 'A bancada está pronta. PROPOSTA.',
  fornalha: 'A fornalha está pronta. PROPOSTA.',
  canteiro: 'O canteiro está pronto. PROPOSTA.',
  'era:ferro': 'Idade do Ferro. PROPOSTA.',
  ferro: 'Ferramentas de ferro prontas. PROPOSTA.',
  casa: 'A casinha está de pé. PROPOSTA.',
  farol: TEXTOS.fim,
};

const NOMES = { madeira: 'Madeira', pedra: 'Pedra', minerio: 'Minério', fruta: 'Fruta', barra: 'Barra' };

function salvar() {
  estado.desdeSave = 0;
  try { localStorage.setItem(CONFIG.chaveSave, JSON.stringify(serializar(estado))); } catch { /* o aparelho pode recusar */ }
}

function dizer(texto) {
  avisoAte = relogio + 3.2;
  document.getElementById('aviso').textContent = texto || '';
}

function resultado(r) {
  if (!r) return;
  if (r.ok && r.efeito && EFEITOS[r.efeito]) dizer(EFEITOS[r.efeito]);
  else if (r.ok && r.item) dizer(`${r.item}: +${r.ganho || 1}. PROPOSTA.`);
  else if (!r.ok && MOTIVOS[r.motivo]) dizer(MOTIVOS[r.motivo]);
  if (r.ok) salvar();
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

function idNo(no) {
  if (no.tipo === 'arvore') return no.restante > 0 ? 'arvore' : 'toco';
  if (no.tipo === 'veio') return no.restante > 0 ? 'veio' : 'veio-vazio';
  if (no.tipo === 'fruta') return no.restante > 0 ? 'arbusto' : 'arbusto-vazio';
  if (no.restante <= 0) return null;
  if (no.tipo === 'graveto') return 'graveto';
  if (no.tipo === 'seixo') return 'seixo';
  if (no.tipo === 'rocha') return 'rocha';
  return null;
}

function idEstacao(est) {
  const pronto = estacaoPronta(estado, est.id);
  if (est.id === 'fogueira') return pronto ? 'fogueira-acesa' : 'fogueira-apagada';
  if (est.id === 'fornalha') return pronto ? 'fornalha-acesa' : 'fornalha-fria';
  if (est.id === 'casinha') return pronto ? 'casinha-pronta' : 'casinha-obra';
  if (est.id === 'farol') {
    if (estado.efeitos.farol) return 'farol-aceso';
    const n = estado.progresso.farol || 0;
    if (n >= 2) return 'farol-2';
    if (n >= 1) return 'farol-1';
    return 'farol-0';
  }
  if (est.id === 'pesquisaBronze') return 'pesquisa-bronze';
  if (est.id === 'pesquisaFerro') return 'pesquisa-ferro';
  return est.id;
}

function colunaEstacao(est) {
  if (est.id === 'canteiro') {
    return estacaoPronta(estado, 'canteiro') ? Math.min(4, Math.floor(estado.canteiroFruta)) : 0;
  }
  return undefined;
}

function corpo(id, x, y, opts) {
  sombra(ctx, x, y, larguraSprite(id));
  desenharSprite(ctx, id, relogio, x, y, opts);
}

function desenharFeixe() {
  if (!estado.efeitos.farol) return;
  const p = estado.postos.farol;
  const ang = Math.sin(relogio * 0.4) * 0.5;
  const ox = p.x;
  const oy = p.y - 70;
  const co = Math.cos(ang);
  const si = Math.sin(ang);
  ctx.fillStyle = 'rgba(242, 209, 90, 0.55)';
  for (let t = 0; t < 72; t += 2) {
    const largura = 1 + Math.floor(t / 16);
    for (let w = -largura; w <= largura; w++) {
      ctx.fillRect(Math.round(ox + co * t - si * w), Math.round(oy + si * t + co * w), 1, 1);
    }
  }
}

function rotulo(x, y, texto) {
  ctx.font = '900 8px Courier New, monospace';
  const w = Math.ceil(ctx.measureText(texto).width) + 6;
  const left = Math.round(x - w / 2);
  const top = Math.round(y);
  ctx.fillStyle = TINTA_CAIXA;
  ctx.fillRect(left - 1, top - 1, w + 2, 12);
  ctx.fillStyle = '#F5F2E8';
  ctx.fillRect(left, top, w, 10);
  ctx.fillStyle = '#193337';
  ctx.fillText(texto, left + 3, top + 8);
}
const TINTA_CAIXA = '#193337';

function desenharSeta(cam) {
  const passo = proximoPasso(estado);
  const dx = passo.x - estado.x;
  const dy = passo.y - estado.y;
  const len = Math.hypot(dx, dy);
  if (len < 18) return;
  const ux = dx / len;
  const uy = dy / len;
  const ox = estado.x - cam.x + ux * 22;
  const oy = estado.y - cam.y + uy * 18;
  ctx.fillStyle = '#FF9D52';
  for (let t = -6; t <= 8; t++) {
    const largura = t > 2 ? Math.max(0, 5 - (t - 2)) : 1;
    for (let w = -largura; w <= largura; w++) {
      ctx.fillRect(Math.round(ox + ux * t - uy * w), Math.round(oy + uy * t + ux * w), 1, 1);
    }
  }
  ctx.fillStyle = '#193337';
  ctx.fillRect(Math.round(ox + ux * 8), Math.round(oy + uy * 8), 1, 1);
}

function desenhar() {
  ajustarTela();
  const cam = camera();
  const eixo = eixoAtual();
  if (Math.hypot(eixo.x, eixo.y) > 0.1) direcao = dir8(eixo.x, eixo.y);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = MAR[estado.era] || MAR.pedra;
  ctx.fillRect(0, 0, cam.w, cam.h);
  desenharChao(ctx, estado, cam, relogio);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  const fila = [];
  const por = (y, desenha) => fila.push({ y, i: fila.length, desenha });
  for (const no of estado.nos) {
    const id = idNo(no);
    if (!id) continue;
    por(no.y, () => corpo(id, no.x, no.y));
  }
  for (const est of ESTACOES) {
    const p = estado.postos[est.id];
    const id = idEstacao(est);
    const pronto = estacaoPronta(estado, est.id);
    const aberto = pronto || ERAS[estado.era].ordem >= ERAS[est.precisaEra].ordem;
    const coluna = colunaEstacao(est);
    por(p.y, () => corpo(id, p.x, p.y, { alfa: aberto ? 1 : 0.4, coluna }));
  }
  por(184, () => corpo('cao-parado', 270, 184));
  const andando = Math.hypot(eixo.x, eixo.y) > 0.1 && !pausado;
  por(estado.y, () => corpo(andando ? 'samuel-andar' : 'samuel-parado', estado.x, estado.y, { direcao }));
  fila.sort((a, b) => a.y - b.y || a.i - b.i);
  for (const item of fila) item.desenha();
  desenharFeixe();
  ctx.restore();

  const luzes = [];
  if (estado.efeitos.fogueira) luzes.push({ x: estado.postos.fogueira.x, y: estado.postos.fogueira.y, raio: CONFIG.raioFogueira });
  if (estado.efeitos.casa) luzes.push({ x: estado.postos.casinha.x, y: estado.postos.casinha.y, raio: CONFIG.raioCasa });
  if (estado.efeitos.farol) luzes.push({ x: estado.postos.farol.x, y: estado.postos.farol.y - 40, raio: CONFIG.raioFarol });
  desenharNoite(ctx, cam, escuridao(estado.hora), luzes);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  for (const est of ESTACOES) {
    const p = estado.postos[est.id];
    rotulo(p.x, p.y - alturaSprite(idEstacao(est)) - 4, contador(estado, est.id).texto);
  }
  ctx.restore();
  desenharSeta(cam);
}

function atualizarHud() {
  document.getElementById('era').textContent = ERAS[estado.era].nome;
  const esc = escuridao(estado.hora);
  document.getElementById('relogio').textContent = esc > 0.2 ? 'Noite' : (estado.hora < CONFIG.noiteInicio ? 'Dia' : 'Entardecer');
  document.getElementById('barraFome').style.width = `${estado.fome}%`;
  document.getElementById('barraCalor').style.width = `${estado.calor}%`;
  for (const item of Object.keys(NOMES)) {
    const el = document.getElementById('chip-' + item);
    el.querySelector('span').textContent = `${NOMES[item]} ${estado.inventario[item]}`;
  }
  const passo = proximoPasso(estado);
  let extra = '';
  if (estado.fome <= 0) extra = 'A fome zerou: você só anda mais devagar. PROPOSTA. ';
  else if (estado.calor <= 0) extra = 'O calor zerou: você só anda mais devagar. PROPOSTA. ';
  document.getElementById('dica').textContent = extra + passo.texto;
  if (relogio > avisoAte) document.getElementById('aviso').textContent = '';
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

document.getElementById('btnInteragir').addEventListener('click', () => resultado(interagir(estado)));
document.getElementById('btnComer').addEventListener('click', () => resultado(comer(estado)));
document.getElementById('chip-fruta').addEventListener('click', () => resultado(comer(estado)));
for (const item of ['madeira', 'pedra', 'minerio', 'barra']) {
  document.getElementById('chip-' + item).addEventListener('click', () => {
    dizer(`${NOMES[item]}: ${estado.inventario[item]}. PROPOSTA.`);
  });
}

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
  if (e.code === 'KeyE') resultado(interagir(estado));
  if (e.code === 'KeyF') resultado(comer(estado));
  if (e.code === 'KeyP' || e.code === 'Escape') abrirPausa(e.code === 'Escape' ? true : !pausado);
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
  pausado = false;
  ultimo = 0;
  soltarJoy();
  atualizarContinuar();
}

document.getElementById('btnComecar').addEventListener('click', () => comecar(true));
document.getElementById('btnContinuar').addEventListener('click', () => comecar(false));
atualizarContinuar();

for (const el of document.querySelectorAll('canvas.icone')) {
  const buf = quadroCodigo(el.dataset.icone, 0, 0);
  el.width = buf.w;
  el.height = buf.h;
  const g = el.getContext('2d');
  g.imageSmoothingEnabled = false;
  const img = g.createImageData(buf.w, buf.h);
  img.data.set(buf.data);
  g.putImageData(img, 0, 0);
}

quandoAtlas(limparChao);
ligarAtlas();

window.__planeta = {
  CONFIG, PROPOSTA, TEXTOS, ERAS, ESTACOES, manifesto,
  get estado() { return estado; },
  tick, interagir, comer, juntar, entregar, fundir, colher, contador, proximoPasso,
  serializar, restaurar, escuridao, fatorVelocidade, faltando, estacaoPronta, estacaoPorId,
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
};

addEventListener('resize', () => desenhar());
requestAnimationFrame(frame);

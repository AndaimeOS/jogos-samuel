import { CONFIG } from './config.js';
import { moverBarra } from './fisica.js';
import {
  criarPartida, definirOpcoes, comecar, avancar, soltarBola, cena, textoSeta, textoFim,
} from './partida.js';
import { timeDoPonteiro, classificarToque, lerTeclas } from './controles.js';

const mesa = document.getElementById('mesa');
const ctx = mesa.getContext('2d');
const campo = CONFIG.campo;
mesa.width = campo.comprimento + campo.moldura * 2;
mesa.height = campo.largura + campo.moldura * 2;

const ui = {
  hud: document.getElementById('hud'),
  menu: document.getElementById('tMenu'),
  gol: document.getElementById('tGol'),
  fim: document.getElementById('tFim'),
  pausa: document.getElementById('tPausa'),
  pV: document.getElementById('pV'),
  pA: document.getElementById('pA'),
  pT: document.getElementById('pT'),
  golFrase: document.getElementById('golFrase'),
  golPlacar: document.getElementById('golPlacar'),
  seta: document.getElementById('seta'),
  fimTitulo: document.getElementById('fimTitulo'),
  fimFrase: document.getElementById('fimFrase'),
  fimV: document.getElementById('fimV'),
  fimA: document.getElementById('fimA'),
  aviso: document.getElementById('aviso'),
  deite: document.getElementById('deite'),
};

const partida = criarPartida({ modo: '1', dificuldade: 'facil', semente: 1 });
const teclas = new Set();
const chutesPendentes = [];
const ponteiros = new Map();
const confetes = [];
let ultimo = performance.now();
let ultimoDt = 1 / 60;
let festa = false;
const C = CONFIG.cores;

function px(x) { return x + campo.moldura; }
function py(y) { return y + campo.moldura; }

function escalaY() {
  const rect = mesa.getBoundingClientRect();
  const aspect = mesa.width / mesa.height;
  const box = rect.width / Math.max(1, rect.height);
  const dh = box > aspect ? rect.height : rect.width / aspect;
  return mesa.height / Math.max(1, dh);
}

function tempoTexto(seg) {
  const s = Math.max(0, Math.ceil(seg));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function soltarConfete() {
  confetes.length = 0;
  const cores = ['#b9ed80', '#ff9d52', '#ceb7ef', '#ffd56b', '#e23d3d', '#2f6fed', '#fffdf7'];
  for (let i = 0; i < 80; i++) {
    confetes.push({
      x: Math.random() * mesa.width,
      y: Math.random() * mesa.height,
      v: 70 + Math.random() * 160,
      w: 8 + Math.random() * 12,
      h: 8 + Math.random() * 10,
      c: cores[i % cores.length],
      r: Math.random() * 6,
    });
  }
}

function alternarPausa() {
  if (partida.fase === 'jogando') partida.fase = 'pausa';
  else if (partida.fase === 'pausa') partida.fase = 'jogando';
}

function escolher(grupo, attr, valor) {
  for (const botao of document.querySelectorAll(grupo)) {
    botao.setAttribute('aria-pressed', botao.dataset[attr] === valor ? 'true' : 'false');
  }
}

function sincronizar() {
  const fase = partida.fase;
  document.body.dataset.fase = fase;
  document.body.classList.toggle('jogando', fase !== 'menu');
  ui.menu.hidden = fase !== 'menu';
  ui.gol.hidden = fase !== 'gol';
  ui.fim.hidden = fase !== 'fim';
  ui.pausa.hidden = fase !== 'pausa';
  ui.hud.hidden = fase === 'menu';
  ui.pV.textContent = String(partida.placar.vermelho);
  ui.pA.textContent = String(partida.placar.azul);
  ui.pT.textContent = tempoTexto(partida.tempo);
  ui.aviso.hidden = !partida.aviso;
  ui.aviso.textContent = partida.aviso || '';
  ui.deite.hidden = window.innerWidth >= window.innerHeight;
  if (fase === 'gol') {
    const seta = textoSeta(partida);
    ui.seta.dataset.dir = seta.lado;
    ui.seta.setAttribute('aria-label', seta.frase);
    ui.golFrase.textContent = seta.frase;
    ui.golPlacar.textContent = `Vermelho ${partida.placar.vermelho} × ${partida.placar.azul} Azul`;
  }
  if (fase === 'fim') {
    if (!festa) {
      festa = true;
      soltarConfete();
    }
    const texto = textoFim(partida);
    ui.fimTitulo.textContent = texto.titulo;
    ui.fimFrase.textContent = texto.frase;
    ui.fimV.textContent = String(partida.placar.vermelho);
    ui.fimA.textContent = String(partida.placar.azul);
  } else {
    festa = false;
  }
}

function ret(x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
}

function desenharMesa() {
  const m = campo.moldura;
  const c = campo.comprimento;
  const l = campo.largura;
  ctx.fillStyle = C.madeiraEscura;
  ctx.fillRect(0, 0, mesa.width, mesa.height);
  ctx.fillStyle = C.madeira;
  ctx.fillRect(8, 8, mesa.width - 16, mesa.height - 16);
  ctx.strokeStyle = C.tinta;
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, mesa.width - 16, mesa.height - 16);

  const abertura = partida.ajustes.abertura;
  const y0 = (l - abertura) / 2;
  const y1 = y0 + abertura;
  ctx.fillStyle = C.rede;
  ctx.fillRect(px(-m + 8), py(y0), m - 6, abertura);
  ctx.fillRect(px(c - 2), py(y0), m - 6, abertura);

  ctx.fillStyle = C.feltro;
  ctx.fillRect(px(0), py(0), c, l);
  ctx.fillStyle = C.feltroFaixa;
  ctx.fillRect(px(c * 0.5 - 18), py(0), 36, l);

  ctx.strokeStyle = C.linha;
  ctx.lineWidth = 3;
  ctx.strokeRect(px(14), py(14), c - 28, l - 28);
  ctx.beginPath();
  ctx.moveTo(px(c / 2), py(14));
  ctx.lineTo(px(c / 2), py(l - 14));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px(c / 2), py(l / 2), 54, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = C.trave;
  ctx.strokeStyle = C.tinta;
  ctx.lineWidth = 2;
  ret(px(0), py(y0 - CONFIG.trave.espessura), CONFIG.trave.profundidade, CONFIG.trave.espessura);
  ret(px(0), py(y1), CONFIG.trave.profundidade, CONFIG.trave.espessura);
  ret(px(c - CONFIG.trave.profundidade), py(y0 - CONFIG.trave.espessura), CONFIG.trave.profundidade, CONFIG.trave.espessura);
  ret(px(c - CONFIG.trave.profundidade), py(y1), CONFIG.trave.profundidade, CONFIG.trave.espessura);

  ctx.fillStyle = 'rgba(245,242,232,.85)';
  ctx.font = '700 18px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VERMELHO', px(c * 0.18), py(28));
  ctx.fillText('AZUL', px(c * 0.82), py(28));
  if (partida.modo === '1') {
    ctx.font = '700 13px Courier New, monospace';
    ctx.fillText('você', px(c * 0.18), py(48));
    ctx.fillText('computador', px(c * 0.82), py(48));
  }
}

function desenharBarras() {
  for (const barra of CONFIG.barras) {
    const x = barra.x * campo.comprimento;
    ctx.fillStyle = C.barra;
    ctx.strokeStyle = C.tinta;
    ctx.lineWidth = 2;
    ret(px(x - 5), py(0), 10, campo.largura);
    const cor = barra.time === 'vermelho' ? C.vermelho : C.azul;
    const d = partida.deslize[barra.time] || 0;
    const chute = partida.animChute[barra.time] > 0;
    const dir = barra.time === 'vermelho' ? 1 : -1;
    for (let i = 0; i < barra.n; i++) {
      const y = campo.largura / 2 + d + (i - (barra.n - 1) / 2) * CONFIG.jogador.espacamento;
      const dx = chute ? dir * 8 : 0;
      ctx.save();
      ctx.translate(px(x + dx), py(y));
      ctx.fillStyle = cor;
      ctx.strokeStyle = C.tinta;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-12, -15, 24, 30);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = barra.time === 'vermelho' ? C.vermelhoEscuro : C.azulEscuro;
      ctx.fillRect(-12, -4, 24, 6);
      ctx.beginPath();
      ctx.arc(0, -18, 8, 0, Math.PI * 2);
      ctx.fillStyle = C.pele;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.cabelo;
      ctx.fillRect(-7, -26, 14, 6);
      ctx.restore();
    }
  }
}

function desenharBola() {
  const b = partida.bola;
  ctx.beginPath();
  ctx.arc(px(b.x), py(b.y), CONFIG.bola.raio, 0, Math.PI * 2);
  ctx.fillStyle = C.bola;
  ctx.fill();
  ctx.strokeStyle = C.tinta;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px(b.x), py(b.y), 4, 0, Math.PI * 2);
  ctx.stroke();
}

function desenharConfete(dt) {
  if (partida.fase !== 'fim') return;
  for (const pedaco of confetes) {
    pedaco.y += pedaco.v * dt;
    pedaco.r += dt * 2;
    if (pedaco.y > mesa.height + 20) pedaco.y = -16;
    ctx.save();
    ctx.translate(pedaco.x, pedaco.y);
    ctx.rotate(pedaco.r);
    ctx.fillStyle = pedaco.c;
    ctx.strokeStyle = C.tinta;
    ctx.lineWidth = 2;
    ctx.fillRect(-pedaco.w / 2, -pedaco.h / 2, pedaco.w, pedaco.h);
    ctx.strokeRect(-pedaco.w / 2, -pedaco.h / 2, pedaco.w, pedaco.h);
    ctx.restore();
  }
}

function desenhar(dt) {
  desenharMesa();
  desenharBarras();
  desenharBola();
  desenharConfete(dt);
}

function quadro(agora) {
  const dt = Math.max(0, Math.min(0.05, (agora - ultimo) / 1000));
  ultimo = agora;
  ultimoDt = dt || ultimoDt;
  const entrada = lerTeclas(teclas, partida.modo);
  entrada.chutes = chutesPendentes.splice(0);
  avancar(partida, dt, entrada);
  sincronizar();
  desenhar(dt);
  requestAnimationFrame(quadro);
}

document.getElementById('opModo').addEventListener('click', (ev) => {
  const botao = ev.target.closest('[data-modo]');
  if (!botao) return;
  definirOpcoes(partida, { modo: botao.dataset.modo });
  escolher('#opModo .opcao', 'modo', partida.modo);
});
document.getElementById('opNivel').addEventListener('click', (ev) => {
  const botao = ev.target.closest('[data-nivel]');
  if (!botao) return;
  definirOpcoes(partida, { dificuldade: botao.dataset.nivel });
  escolher('#opNivel .opcao', 'nivel', partida.dificuldade);
});
document.getElementById('bJogar').addEventListener('click', () => comecar(partida));
document.getElementById('bRecomecar').addEventListener('click', () => soltarBola(partida));
document.getElementById('bDeNovo').addEventListener('click', () => comecar(partida));
document.getElementById('bMenu').addEventListener('click', () => { partida.fase = 'menu'; });
document.getElementById('bPausa').addEventListener('click', alternarPausa);
document.getElementById('bContinuar').addEventListener('click', () => { partida.fase = 'jogando'; });

window.addEventListener('keydown', (ev) => {
  const nome = ev.code;
  const útil = ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter', 'KeyF', 'KeyL', 'KeyP', 'Escape'];
  if (!útil.includes(nome)) return;
  ev.preventDefault();
  if ((nome === 'KeyP' || nome === 'Escape') && !ev.repeat) {
    alternarPausa();
    return;
  }
  if (!ev.repeat && (nome === 'Space' || nome === 'Enter' || nome === 'KeyF' || nome === 'KeyL')) {
    chutesPendentes.push(...lerTeclas(new Set([nome]), partida.modo).chutes);
  }
  teclas.add(nome);
});
window.addEventListener('keyup', (ev) => teclas.delete(ev.code));
window.addEventListener('blur', () => teclas.clear());

function ponteiroUtil(ev) {
  if (partida.fase !== 'jogando') return false;
  const alvo = ev.target;
  return !(alvo && alvo.closest && alvo.closest('button, a, .tela'));
}

window.addEventListener('pointerdown', (ev) => {
  if (!ponteiroUtil(ev)) return;
  const time = timeDoPonteiro(ev.clientX, window.innerWidth, partida.modo);
  if (!time) return;
  ponteiros.set(ev.pointerId, {
    time, x: ev.clientX, y: ev.clientY, ly: ev.clientY, t: performance.now(),
  });
  ev.preventDefault();
}, { passive: false });

window.addEventListener('pointermove', (ev) => {
  const info = ponteiros.get(ev.pointerId);
  if (!info || partida.fase !== 'jogando') return;
  const dy = ev.clientY - info.ly;
  if (dy !== 0) {
    const delta = moverBarra(partida, info.time, dy * escalaY());
    partida.velBarra[info.time] = delta / Math.max(ultimoDt, 1 / 120);
    info.ly = ev.clientY;
  }
  ev.preventDefault();
}, { passive: false });

function soltarPonteiro(ev) {
  const info = ponteiros.get(ev.pointerId);
  if (!info) return;
  ponteiros.delete(ev.pointerId);
  if (partida.fase !== 'jogando') return;
  const tipo = classificarToque(info, { x: ev.clientX, y: ev.clientY, t: performance.now() }, CONFIG);
  if (tipo === 'chute') chutesPendentes.push(info.time);
}

window.addEventListener('pointerup', soltarPonteiro);
window.addEventListener('pointercancel', (ev) => ponteiros.delete(ev.pointerId));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && partida.fase === 'jogando') partida.fase = 'pausa';
});

const params = new URLSearchParams(location.search);
if (params.has('cena')) cena(partida, params.get('cena'));

window.__pebolim = {
  get estado() { return partida; },
  config: CONFIG,
  cena: (nome) => cena(partida, nome),
  comecar: () => comecar(partida),
  soltarBola: () => soltarBola(partida),
};

sincronizar();
requestAnimationFrame(quadro);

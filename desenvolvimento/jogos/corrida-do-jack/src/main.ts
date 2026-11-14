// Corrida do Jack — controlador: telas, laço com passo fixo, entrada, recorde e depuração (?debug, ?fps).
import './ui/ui-blocos.css';
import './ui/corrida.css';
import { Corrida, type Evento, type Modo } from './core/regras';
import { Cena } from './render/cena';
import { ligarEntrada, type Acao } from './entrada';
import { Recorde } from './recorde';
import { Medidor } from './ui/medidor';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const PASSO = 1 / 120;
const TOQUE = matchMedia('(pointer: coarse)').matches;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>('jogo');
const cena = new Cena(canvas);
const recorde = new Recorde();
let modo: Modo = 'ajuda';
let corrida = new Corrida(modo, Math.floor(Math.random() * 1e9));
let pausado = false;
let acumulador = 0;
let ultimo = performance.now();
let dicaAte = 0;

const telas = ['tInicio', 'tPausa', 'tFim'] as const;
function mostrar(t: (typeof telas)[number] | null) { for (const id of telas) $(id).hidden = id !== t; $('hud').hidden = t === 'tInicio'; }
document.querySelectorAll<HTMLElement>(TOQUE ? '.so-teclado' : '.so-toque').forEach((el) => { el.hidden = true; });

function atualizarRecordeInicio() {
  const m = recorde.melhor(modo);
  $('recorde').textContent = m ? `⭐ Recorde: ${m} pontos` : '';
}
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-modo]')) {
  b.addEventListener('click', () => {
    modo = b.dataset.modo as Modo;
    document.querySelectorAll('[data-modo]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    atualizarRecordeInicio();
  });
}

function nova() {
  corrida = new Corrida(modo, Math.floor(Math.random() * 1e9));
  corrida.comecar();
  pausado = false;
  acumulador = 0;
  mostrar(null);
  dica(TOQUE ? '👆 deslize para os lados, para cima e para baixo' : '← → trocam de faixa · ↑ pula · ↓ abaixa', 3);
  $('hEscudo').hidden = corrida.escudos === 0;
}
function dica(txt: string, seg: number) { $('dica').textContent = txt; $('dica').hidden = false; dicaAte = performance.now() + seg * 1000; }
function pausar(p: boolean) {
  if (corrida.estado !== 'correndo') return;
  pausado = p;
  mostrar(p ? 'tPausa' : null);
}
function fim() {
  const bateu = recorde.registrar(modo, corrida.pontos);
  $('fMetros').textContent = String(corrida.distancia);
  $('fMoedas').textContent = String(corrida.moedas);
  $('fPontos').textContent = String(corrida.pontos);
  $('fimTitulo').textContent = bateu ? 'Novo recorde! 🎉' : 'Opa! Tropeçou 🐶';
  $('fRecorde').textContent = bateu ? '' : `⭐ Recorde: ${recorde.melhor(modo)} pontos`;
  setTimeout(() => mostrar('tFim'), 650);   // deixa ver a queda antes da tela
}

function agir(a: Acao) {
  if (a === 'pausa') return pausar(!pausado);
  if (pausado || corrida.estado !== 'correndo') return;
  const ev = a === 'esquerda' ? corrida.esquerda() : a === 'direita' ? corrida.direita() : a === 'pular' ? corrida.pular() : corrida.abaixar();
  tratar(ev);
}
function tratar(ev: Evento[]) {
  for (const e of ev) {
    if (e === 'escudo') { $('hEscudo').hidden = true; dica('🛡️ O escudo te salvou!', 1.6); }
    if (e === 'batida') fim();
  }
}

$('bCorrer').addEventListener('click', nova);
$('bDeNovo').addEventListener('click', nova);
$('bContinuar').addEventListener('click', () => pausar(false));
$('bPausa').addEventListener('click', () => pausar(true));
$('bMenuPausa').addEventListener('click', () => { corrida.estado = 'caiu'; pausado = false; atualizarRecordeInicio(); mostrar('tInicio'); });
$('bMenuFim').addEventListener('click', () => { atualizarRecordeInicio(); mostrar('tInicio'); });
ligarEntrada(canvas, agir);
document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(true); });
addEventListener('blur', () => pausar(true));

function redimensionar() { cena.redimensionar(innerWidth, innerHeight); }
addEventListener('resize', redimensionar);
redimensionar();

const medidor = params.has('fps')
  ? new Medidor(cena.renderer.getContext(), () => `${cena.info().calls} draw calls`, Math.min(1800, Math.max(10, Number(params.get('fps')) || 300)), () => pausado || corrida.estado !== 'correndo')
  : null;

/** Avança a simulação dt segundos e desenha um quadro. */
function passo(dt: number) {
  if (!pausado) {
    acumulador += dt;
    while (acumulador >= PASSO) { tratar(corrida.passo(PASSO)); acumulador -= PASSO; }
  }
  cena.desenhar(corrida, pausado ? 0 : dt);
  $('hMetros').textContent = String(corrida.distancia);
  $('hMoedas').textContent = String(corrida.moedas);
  if (!$('dica').hidden && performance.now() > dicaAte) $('dica').hidden = true;
}
function quadro(agora: number) {
  requestAnimationFrame(quadro);
  const dt = Math.min(0.1, (agora - ultimo) / 1000);
  ultimo = agora;
  passo(dt);
  medidor?.quadro(agora);
}
requestAnimationFrame(quadro);
atualizarRecordeInicio();
mostrar('tInicio');

if (DEBUG) (window as unknown as { __corrida: object }).__corrida = {
  get corrida() { return corrida; }, get pausado() { return pausado; }, cena,
  nova, agir, pausar,
  /** Roda a simulação na mão (o painel oculto para o requestAnimationFrame). */
  avancar: (seg: number) => { for (let t = 0; t < seg; t += 1 / 60) passo(1 / 60); },
};

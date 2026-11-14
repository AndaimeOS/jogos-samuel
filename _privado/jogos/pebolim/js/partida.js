import { CONFIG, ajustesDe } from './config.js';
import { passoFisico, chutar, moverBarra, travarDeslize } from './fisica.js';
import { passoIA } from './ia.js';

export function mulberry32(semente) {
  let a = semente >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function criarPartida(opcoes = {}) {
  const cfg = opcoes.config || CONFIG;
  const dificuldade = opcoes.dificuldade === 'normal' ? 'normal' : 'facil';
  const modo = opcoes.modo === '2' || opcoes.modo === 2 ? '2' : '1';
  const partida = {
    cfg,
    modo,
    dificuldade,
    ajustes: ajustesDe(cfg, dificuldade),
    fase: 'menu',
    placar: { vermelho: 0, azul: 0 },
    tempo: cfg.partida.segundos,
    bola: { x: cfg.campo.comprimento / 2, y: cfg.campo.largura / 2, vx: 0, vy: 0 },
    deslize: { vermelho: 0, azul: 0 },
    velBarra: { vermelho: 0, azul: 0 },
    trava: {
      acumulado: 0,
      janela: 0,
      x: cfg.campo.comprimento / 2,
      y: cfg.campo.largura / 2,
    },
    seta: 1,
    vencedor: null,
    motivo: null,
    ia: { espera: 0, pausa: 0, alvo: cfg.campo.largura / 2, recarga: 0.4 },
    semente: opcoes.semente ?? 1,
    rng: mulberry32(opcoes.semente ?? 1),
    animChute: { vermelho: 0, azul: 0 },
    aviso: '',
    avisoTempo: 0,
  };
  return partida;
}

export function definirOpcoes(partida, { modo, dificuldade } = {}) {
  if (modo === '1' || modo === '2') partida.modo = modo;
  if (dificuldade === 'facil' || dificuldade === 'normal') {
    partida.dificuldade = dificuldade;
    partida.ajustes = ajustesDe(partida.cfg, dificuldade);
  }
}

function zerarBola(partida) {
  const cfg = partida.cfg;
  partida.bola.x = cfg.campo.comprimento / 2;
  partida.bola.y = cfg.campo.largura / 2;
  partida.bola.vx = 0;
  partida.bola.vy = 0;
  partida.trava.acumulado = 0;
  partida.trava.janela = 0;
  partida.trava.x = partida.bola.x;
  partida.trava.y = partida.bola.y;
}

export function comecar(partida) {
  partida.fase = 'jogando';
  partida.placar = { vermelho: 0, azul: 0 };
  partida.tempo = partida.cfg.partida.segundos;
  partida.vencedor = null;
  partida.motivo = null;
  partida.deslize = { vermelho: 0, azul: 0 };
  partida.velBarra = { vermelho: 0, azul: 0 };
  partida.seta = 1;
  partida.aviso = '';
  partida.avisoTempo = 0;
  partida.ia = { espera: 0, pausa: 0, alvo: partida.cfg.campo.largura / 2, recarga: 0.45 };
  partida.animChute = { vermelho: 0, azul: 0 };
  partida.ajustes = ajustesDe(partida.cfg, partida.dificuldade);
  partida.rng = mulberry32(partida.semente ?? 1);
  zerarBola(partida);
}

export function textoSeta(partida) {
  const lado = partida.seta > 0 ? 'direita' : 'esquerda';
  return { lado, frase: `A bola vai para a ${lado}` };
}

export function textoFim(partida) {
  if (partida.vencedor === 'empate') {
    return { titulo: 'Empate!', frase: 'Os dois times mandaram bem!' };
  }
  const nome = partida.vencedor === 'azul' ? 'Azul' : 'Vermelho';
  return { titulo: `O ${nome} venceu!`, frase: 'Que partida boa!' };
}

function encerrar(partida, motivo) {
  partida.fase = 'fim';
  partida.motivo = motivo;
  partida.tempo = Math.max(0, partida.tempo);
  const a = partida.placar.vermelho;
  const b = partida.placar.azul;
  partida.vencedor = a === b ? 'empate' : a > b ? 'vermelho' : 'azul';
  partida.bola.vx = 0;
  partida.bola.vy = 0;
}

export function aplicarGol(partida, time) {
  partida.placar[time] += 1;
  zerarBola(partida);
  if (partida.placar[time] >= partida.cfg.partida.golsVitoria) {
    encerrar(partida, 'gols');
    return;
  }
  partida.fase = 'gol';
  // Quem sofreu o gol repõe. A seta aponta para o lado em que a bola sai.
  partida.seta = time === 'vermelho' ? -1 : 1;
}

export function soltarBola(partida) {
  if (partida.fase !== 'gol') return false;
  partida.fase = 'jogando';
  zerarBola(partida);
  partida.bola.vx = partida.seta * partida.ajustes.saque;
  partida.trava.x = partida.bola.x;
  partida.trava.y = partida.bola.y;
  return true;
}

export function avancar(partida, dt, entrada = {}) {
  if (partida.avisoTempo > 0) {
    partida.avisoTempo -= dt;
    if (partida.avisoTempo <= 0) partida.aviso = '';
  }
  partida.animChute.vermelho = Math.max(0, partida.animChute.vermelho - dt);
  partida.animChute.azul = Math.max(0, partida.animChute.azul - dt);
  if (partida.fase !== 'jogando') return [];

  const eixo = entrada.eixo || {};
  for (const time of ['vermelho', 'azul']) {
    if (time === 'azul' && partida.modo === '1') continue;
    const dir = eixo[time] || 0;
    if (!dir) continue;
    const delta = moverBarra(partida, time, dir * partida.cfg.barra.velTeclado * dt);
    partida.velBarra[time] = delta / dt;
  }
  partida.deslize.vermelho = travarDeslize(partida.cfg, partida.deslize.vermelho);
  partida.deslize.azul = travarDeslize(partida.cfg, partida.deslize.azul);

  if (partida.modo === '1') passoIA(partida, dt);
  partida.deslize.azul = travarDeslize(partida.cfg, partida.deslize.azul);

  for (const time of entrada.chutes || []) {
    if (time === 'azul' && partida.modo === '1') continue;
    chutar(partida, time);
  }

  const eventos = passoFisico(partida, dt);
  for (const ev of eventos) {
    if (ev.tipo === 'gol') aplicarGol(partida, ev.time);
  }

  if (partida.fase === 'jogando') {
    partida.tempo -= dt;
    if (partida.tempo <= 0) encerrar(partida, 'tempo');
  }

  partida.velBarra.vermelho = 0;
  partida.velBarra.azul = 0;
  return eventos;
}

export function cena(partida, nome) {
  if (nome === 'menu') {
    partida.fase = 'menu';
    return;
  }
  definirOpcoes(partida, { modo: '1', dificuldade: 'facil' });
  comecar(partida);
  if (nome === 'partida') {
    partida.placar.vermelho = 1;
    partida.placar.azul = 0;
    partida.tempo = 95;
    partida.bola.x = 430;
    partida.bola.y = 250;
    partida.bola.vx = 0;
    partida.bola.vy = 0;
    partida.deslize.vermelho = 40;
    partida.deslize.azul = -30;
    return;
  }
  if (nome === 'gol') {
    aplicarGol(partida, 'vermelho');
    partida.tempo = 88;
    return;
  }
  if (nome === 'fim') {
    partida.placar.vermelho = 5;
    partida.placar.azul = 3;
    partida.tempo = 37;
    encerrar(partida, 'gols');
  }
}

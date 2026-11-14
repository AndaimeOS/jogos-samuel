// Física da mesa. A bola é um círculo e os bonecos/traves são caixas testadas
// com SAT.testPolygonCircle, como no football-game (MIT, Prashant Baid, 2015).
// SAT.js é copiado na íntegra (MIT, Jim Riecken). Avisos em LICENSE.txt.

import { ajustesDe } from './config.js';

function sat() {
  const lib = globalThis.SAT;
  if (!lib) throw new Error('SAT.js não foi carregado');
  return lib;
}

export function limiteDeslize(cfg) {
  let maior = 0;
  for (const barra of cfg.barras) {
    const alcance = ((barra.n - 1) * cfg.jogador.espacamento) / 2 + cfg.jogador.altura / 2;
    if (alcance > maior) maior = alcance;
  }
  return cfg.campo.largura / 2 - maior - 2;
}

export function travarDeslize(cfg, valor) {
  const lim = limiteDeslize(cfg);
  return Math.max(-lim, Math.min(lim, valor));
}

export function jogadoresDe(cfg, deslize) {
  const lista = [];
  for (const barra of cfg.barras) {
    const x = barra.x * cfg.campo.comprimento;
    const d = deslize[barra.time] || 0;
    for (let i = 0; i < barra.n; i++) {
      const y = cfg.campo.largura / 2 + d + (i - (barra.n - 1) / 2) * cfg.jogador.espacamento;
      lista.push({ time: barra.time, x, y });
    }
  }
  return lista;
}

export function bocaDoGol(cfg, abertura) {
  const y0 = (cfg.campo.largura - abertura) / 2;
  const y1 = (cfg.campo.largura + abertura) / 2;
  return { y0, y1 };
}

export function travesDe(cfg, abertura) {
  const { y0, y1 } = bocaDoGol(cfg, abertura);
  const e = cfg.trave.espessura;
  const p = cfg.trave.profundidade;
  const c = cfg.campo.comprimento;
  return [
    { x: 0, y: y0 - e, w: p, h: e },
    { x: 0, y: y1, w: p, h: e },
    { x: c - p, y: y0 - e, w: p, h: e },
    { x: c - p, y: y1, w: p, h: e },
  ];
}

export function caixaDe(x, y, w, h) {
  const SAT = sat();
  const box = new SAT.Box(new SAT.Vector(x - w / 2, y - h / 2), w, h);
  return { poly: box.toPolygon(), centro: { x, y }, x: x - w / 2, y: y - h / 2, w, h };
}

function caixasDosJogadores(cfg, deslize) {
  const { largura, altura } = cfg.jogador;
  return jogadoresDe(cfg, deslize).map((j) => ({
    ...caixaDe(j.x, j.y, largura, altura),
    time: j.time,
    jx: j.x,
    jy: j.y,
  }));
}

function caixasDasTraves(cfg, abertura) {
  return travesDe(cfg, abertura).map((t) => caixaDe(t.x + t.w / 2, t.y + t.h / 2, t.w, t.h));
}

function sobrepoe(bola, caixa, raio) {
  const SAT = sat();
  const circ = new SAT.Circle(new SAT.Vector(bola.x, bola.y), raio);
  return SAT.testPolygonCircle(caixa.poly, circ, new SAT.Response());
}

export function bolaPresaNumSolido(partida) {
  const cfg = partida.cfg;
  const raio = cfg.bola.raio;
  const solidos = [
    ...caixasDasTraves(cfg, partida.ajustes.abertura),
    ...caixasDosJogadores(cfg, partida.deslize),
  ];
  return solidos.some((caixa) => sobrepoe(partida.bola, caixa, raio));
}

function separar(bola, caixa, raio, quique, extraVy) {
  const SAT = sat();
  const resp = new SAT.Response();
  const circ = new SAT.Circle(new SAT.Vector(bola.x, bola.y), raio);
  if (!SAT.testPolygonCircle(caixa.poly, circ, resp)) return false;
  let ox = resp.overlapV.x;
  let oy = resp.overlapV.y;
  const afastando = (bola.x - caixa.centro.x) * ox + (bola.y - caixa.centro.y) * oy;
  if (afastando < 0) {
    ox = -ox;
    oy = -oy;
  }
  if (ox === 0 && oy === 0) {
    const dx = bola.x - caixa.centro.x || 1;
    const dy = bola.y - caixa.centro.y;
    const len0 = Math.hypot(dx, dy) || 1;
    ox = (dx / len0) * (raio * 0.25);
    oy = (dy / len0) * (raio * 0.25);
  }
  bola.x += ox;
  bola.y += oy;
  const len = Math.hypot(ox, oy) || 1;
  const nx = ox / len;
  const ny = oy / len;
  const vn = bola.vx * nx + bola.vy * ny;
  if (vn < 0) {
    const impulso = -(1 + quique) * vn;
    bola.vx += impulso * nx;
    bola.vy += impulso * ny;
  }
  bola.vy += extraVy || 0;
  return true;
}

function limitarVelocidade(bola, max) {
  const v = Math.hypot(bola.vx, bola.vy);
  if (v > max) {
    bola.vx = (bola.vx / v) * max;
    bola.vy = (bola.vy / v) * max;
  }
}

// Sorteio injetável: partida.sorteio() devolve um número em [0, 1).
export function sortearLado(partida) {
  return partida.sorteio() < 0.5 ? -1 : 1;
}

// Põe a bola no meio e já manda para o lado pedido (-1 esquerda, 1 direita),
// com um pequeno desvio vertical sorteado. A bola nunca sai daqui parada.
export function sacar(partida, lado, velocidade) {
  const cfg = partida.cfg;
  const angulo = (partida.sorteio() * 2 - 1) * cfg.saque.anguloMax;
  partida.bola.x = cfg.campo.comprimento / 2;
  partida.bola.y = cfg.campo.largura / 2;
  partida.bola.vx = lado * velocidade * Math.cos(angulo);
  partida.bola.vy = velocidade * Math.sin(angulo);
  partida.trava.acumulado = 0;
  partida.trava.janela = 0;
  partida.trava.x = partida.bola.x;
  partida.trava.y = partida.bola.y;
}

function centralizar(partida) {
  const cfg = partida.cfg;
  const a = partida.ajustes || ajustesDe(cfg, partida.dificuldade);
  const longe = Math.hypot(
    partida.bola.x - cfg.campo.comprimento / 2,
    partida.bola.y - cfg.campo.largura / 2,
  ) > 24;
  sacar(partida, sortearLado(partida), a.destravar);
  if (longe) {
    partida.aviso = 'A bola voltou para o meio!';
    partida.avisoTempo = cfg.partida.avisoSegundos;
  }
}

function atualizarTrava(partida, dt) {
  const cfg = partida.cfg;
  const bola = partida.bola;
  partida.trava.janela += dt;
  if (partida.trava.janela < cfg.bola.janelaParada) return null;
  const d = Math.hypot(bola.x - partida.trava.x, bola.y - partida.trava.y);
  const vel = Math.hypot(bola.vx, bola.vy);
  const quase = d < cfg.bola.deslocamentoMinimo || vel < cfg.bola.velQuaseParada;
  if (quase) partida.trava.acumulado += partida.trava.janela;
  else partida.trava.acumulado = 0;
  partida.trava.x = bola.x;
  partida.trava.y = bola.y;
  partida.trava.janela = 0;
  if (partida.trava.acumulado >= cfg.bola.segundosParada) {
    centralizar(partida);
    return { tipo: 'destravou' };
  }
  return null;
}

function subpasso(partida, dt) {
  const cfg = partida.cfg;
  const a = partida.ajustes;
  const bola = partida.bola;
  const raio = cfg.bola.raio;
  const { comprimento: c, largura: l } = cfg.campo;
  const boca = bocaDoGol(cfg, a.abertura);

  bola.vx *= Math.exp(-a.amortecimento * dt);
  bola.vy *= Math.exp(-a.amortecimento * dt);
  bola.x += bola.vx * dt;
  bola.y += bola.vy * dt;

  if (bola.y < raio) {
    bola.y = raio;
    bola.vy = Math.abs(bola.vy) * cfg.bola.quiqueParede;
  } else if (bola.y > l - raio) {
    bola.y = l - raio;
    bola.vy = -Math.abs(bola.vy) * cfg.bola.quiqueParede;
  }

  const naBoca = bola.y > boca.y0 && bola.y < boca.y1;
  if (!naBoca && bola.x < raio) {
    bola.x = raio;
    bola.vx = Math.abs(bola.vx) * cfg.bola.quiqueParede;
  } else if (!naBoca && bola.x > c - raio) {
    bola.x = c - raio;
    bola.vx = -Math.abs(bola.vx) * cfg.bola.quiqueParede;
  }

  const traves = caixasDasTraves(cfg, a.abertura);
  const jogadores = caixasDosJogadores(cfg, partida.deslize);
  for (let volta = 0; volta < 4; volta++) {
    for (const trave of traves) separar(bola, trave, raio, cfg.bola.quiqueTrave, 0);
    for (const jogador of jogadores) {
      const extra = (partida.velBarra[jogador.time] || 0) * cfg.bola.empurraoBarra;
      separar(bola, jogador, raio, cfg.bola.quiqueJogador, extra);
    }
  }
  limitarVelocidade(bola, a.velMax);

  const naBocaDepois = bola.y > boca.y0 && bola.y < boca.y1;
  if (naBocaDepois && bola.x <= 0) return { tipo: 'gol', time: 'azul' };
  if (naBocaDepois && bola.x >= c) return { tipo: 'gol', time: 'vermelho' };
  return null;
}

export function passoFisico(partida, dt) {
  const eventos = [];
  const cfg = partida.cfg;
  const vel = Math.hypot(partida.bola.vx, partida.bola.vy);
  const maxPasso = Math.max(4, cfg.bola.raio * 0.45);
  const n = Math.max(1, Math.min(8, Math.ceil((vel * dt) / maxPasso)));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const ev = subpasso(partida, h);
    if (ev) {
      eventos.push(ev);
      return eventos;
    }
  }
  const trava = atualizarTrava(partida, dt);
  if (trava) eventos.push(trava);
  return eventos;
}

export function chutar(partida, time) {
  const cfg = partida.cfg;
  const a = partida.ajustes || ajustesDe(cfg, partida.dificuldade);
  const dir = time === 'vermelho' ? 1 : -1;
  const alcance = cfg.bola.raio + cfg.jogador.altura / 2 + cfg.jogador.alcanceChute;
  let melhor = null;
  for (const j of jogadoresDe(cfg, partida.deslize)) {
    if (j.time !== time) continue;
    const dx = partida.bola.x - j.x;
    const dy = partida.bola.y - j.y;
    const dist = Math.hypot(dx, dy);
    const naFrente = dx * dir > -cfg.jogador.largura;
    if (naFrente && dist <= alcance && (!melhor || dist < melhor.dist)) {
      melhor = { j, dy, dist };
    }
  }
  partida.animChute[time] = 0.16;
  if (!melhor) return false;
  const lateral = Math.max(-1, Math.min(1, melhor.dy / (cfg.jogador.altura / 2)));
  partida.bola.vx = partida.bola.vx * 0.15 + dir * a.impulso;
  partida.bola.vy = partida.bola.vy * 0.15 + lateral * a.impulso * cfg.bola.fatorLateral;
  limitarVelocidade(partida.bola, a.velMax);
  partida.trava.acumulado = 0;
  partida.trava.janela = 0;
  partida.trava.x = partida.bola.x;
  partida.trava.y = partida.bola.y;
  return true;
}

export function moverBarra(partida, time, delta) {
  const antes = partida.deslize[time];
  partida.deslize[time] = travarDeslize(partida.cfg, antes + delta);
  return partida.deslize[time] - antes;
}

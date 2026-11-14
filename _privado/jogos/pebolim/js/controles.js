// Toque no estilo Taca Taca: arrastar na sua metade move as barras, tocar chuta.
// O teclado continua no computador.

export function timeDoPonteiro(clientX, larguraTela, modo) {
  const time = clientX < larguraTela / 2 ? 'vermelho' : 'azul';
  if (modo === '1' && time === 'azul') return null;
  return time;
}

export function classificarToque(inicio, fim, cfg) {
  const dist = Math.hypot(fim.x - inicio.x, fim.y - inicio.y);
  const dt = fim.t - inicio.t;
  if (dist < cfg.partida.arrasteMinPx && dt <= cfg.partida.toqueMaxMs) return 'chute';
  return 'arraste';
}

export function lerTeclas(teclas, modo) {
  const eixo = { vermelho: 0, azul: 0 };
  const chutes = [];
  const setaSobe = teclas.has('ArrowUp');
  const setaDesce = teclas.has('ArrowDown');
  if (modo === '2') {
    if (teclas.has('KeyW') || teclas.has('KeyA')) eixo.vermelho -= 1;
    if (teclas.has('KeyS') || teclas.has('KeyD')) eixo.vermelho += 1;
    if (setaSobe) eixo.azul -= 1;
    if (setaDesce) eixo.azul += 1;
  } else {
    if (teclas.has('KeyW') || teclas.has('KeyA') || setaSobe) eixo.vermelho -= 1;
    if (teclas.has('KeyS') || teclas.has('KeyD') || setaDesce) eixo.vermelho += 1;
  }
  if (teclas.has('Space') || teclas.has('KeyF')) chutes.push('vermelho');
  if (modo === '2' && (teclas.has('Enter') || teclas.has('KeyL'))) chutes.push('azul');
  if (modo === '1' && teclas.has('Enter')) chutes.push('vermelho');
  return { eixo, chutes };
}

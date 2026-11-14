// Entrada: deslizar o dedo (celular/tablet) e teclado (computador). Um gesto = uma ação.
export type Acao = 'esquerda' | 'direita' | 'pular' | 'abaixar' | 'pausa';

const LIMIAR_PX = 28;   // quanto o dedo anda até valer como deslize

export function ligarEntrada(alvo: HTMLElement, aoAgir: (a: Acao) => void) {
  const limpar: (() => void)[] = [];
  const ouvir = <K extends keyof WindowEventMap>(el: Window | HTMLElement, tipo: K, fn: (e: WindowEventMap[K]) => void) => {
    el.addEventListener(tipo, fn as EventListener);
    limpar.push(() => el.removeEventListener(tipo, fn as EventListener));
  };
  const teclas: Record<string, Acao> = {
    ArrowLeft: 'esquerda', KeyA: 'esquerda', ArrowRight: 'direita', KeyD: 'direita',
    ArrowUp: 'pular', KeyW: 'pular', Space: 'pular', ArrowDown: 'abaixar', KeyS: 'abaixar', KeyP: 'pausa', Escape: 'pausa',
  };
  ouvir(window, 'keydown', (e) => {
    const a = teclas[e.code];
    if (!a || e.repeat) return;
    e.preventDefault();
    aoAgir(a);
  });

  // deslize: decide a direção assim que o dedo passa do limiar; o mesmo toque não dispara duas ações
  let dedo: number | null = null, x0 = 0, y0 = 0, usado = false;
  ouvir(alvo, 'pointerdown', (e) => {
    if (dedo !== null) return;
    dedo = e.pointerId; x0 = e.clientX; y0 = e.clientY; usado = false;
    try { alvo.setPointerCapture(e.pointerId); } catch { /* sem captura */ }
  });
  ouvir(alvo, 'pointermove', (e) => {
    if (e.pointerId !== dedo || usado) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < LIMIAR_PX) return;
    usado = true;
    aoAgir(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'esquerda' : 'direita') : dy < 0 ? 'pular' : 'abaixar');
  });
  const soltar = (e: PointerEvent) => { if (e.pointerId === dedo) dedo = null; };
  ouvir(alvo, 'pointerup', soltar);
  ouvir(alvo, 'pointercancel', soltar);
  return () => limpar.splice(0).forEach((f) => f());
}

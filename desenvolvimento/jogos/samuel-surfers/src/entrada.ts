import { CONFIG } from './config';
import type { Gesto } from './tipos';

export class Entrada {
  private ponto: { x: number; y: number } | null = null;

  constructor(private alvo: HTMLElement, private dispatch: (gesto: Gesto) => void) {
    alvo.addEventListener('touchstart', this.noToqueInicio, { passive: true });
    alvo.addEventListener('touchend', this.noToqueFim, { passive: true });
    alvo.addEventListener('touchmove', this.noToqueMove, { passive: false });
    alvo.addEventListener('pointerdown', this.noPonteiroInicio);
    alvo.addEventListener('pointerup', this.noPonteiroFim);
    window.addEventListener('keydown', this.noTecla);
  }

  destruir(): void {
    this.alvo.removeEventListener('touchstart', this.noToqueInicio);
    this.alvo.removeEventListener('touchend', this.noToqueFim);
    this.alvo.removeEventListener('touchmove', this.noToqueMove);
    this.alvo.removeEventListener('pointerdown', this.noPonteiroInicio);
    this.alvo.removeEventListener('pointerup', this.noPonteiroFim);
    window.removeEventListener('keydown', this.noTecla);
  }

  private controle(alvo: EventTarget | null): boolean {
    return alvo instanceof Element && !!alvo.closest('button, a, [data-controle]');
  }

  private noToqueInicio = (evento: TouchEvent): void => {
    if (evento.touches.length !== 1 || this.controle(evento.target)) return;
    const toque = evento.touches[0];
    this.ponto = { x: toque.clientX, y: toque.clientY };
  };

  private noToqueMove = (evento: TouchEvent): void => {
    if (this.ponto) evento.preventDefault();
  };

  private noToqueFim = (evento: TouchEvent): void => {
    if (!this.ponto) return;
    const toque = evento.changedTouches[0];
    this.soltar(toque.clientX, toque.clientY);
  };

  private noPonteiroInicio = (evento: PointerEvent): void => {
    if (this.controle(evento.target) || this.ponto) return;
    this.ponto = { x: evento.clientX, y: evento.clientY };
    if (evento.pointerType !== 'touch') this.alvo.setPointerCapture(evento.pointerId);
  };

  private noPonteiroFim = (evento: PointerEvent): void => {
    if (!this.ponto) return;
    this.soltar(evento.clientX, evento.clientY);
  };

  private soltar(x: number, y: number): void {
    if (!this.ponto) return;
    const inicio = this.ponto;
    this.ponto = null;
    const dx = x - inicio.x;
    const dy = y - inicio.y;
    if (Math.abs(dx) < CONFIG.deslize && Math.abs(dy) < CONFIG.deslize) return;
    if (Math.abs(dx) > Math.abs(dy)) this.dispatch(dx > 0 ? 'direita' : 'esquerda');
    else this.dispatch(dy > 0 ? 'rolar' : 'pular');
  }

  private noTecla = (evento: KeyboardEvent): void => {
    const mapa: Record<string, Gesto | undefined> = {
      ArrowLeft: 'esquerda', a: 'esquerda', A: 'esquerda',
      ArrowRight: 'direita', d: 'direita', D: 'direita',
      ArrowUp: 'pular', w: 'pular', W: 'pular', ' ': 'pular',
      ArrowDown: 'rolar', s: 'rolar', S: 'rolar',
      Escape: 'pausa', p: 'pausa', P: 'pausa',
    };
    const gesto = mapa[evento.key];
    if (!gesto) return;
    evento.preventDefault();
    this.dispatch(gesto);
  };
}

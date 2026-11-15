import type { Som } from './tipos';

const NOTAS_MENU = [262, 330, 392, 330, 349, 294, 392, 262];
const NOTAS_CORRIDA = [392, 494, 587, 494, 440, 587, 659, 523];

export class Audio {
  private contexto?: AudioContext;
  private timer = 0;
  private passo = 0;
  private mudo = false;
  private modo: 'menu' | 'corrida' = 'menu';

  constructor() {
    try {
      this.mudo = localStorage.getItem('samuel-surfers:som') === '0';
    } catch {
      this.mudo = false;
    }
  }

  get ligado(): boolean {
    return !this.mudo;
  }

  alternar(): boolean {
    this.mudo = !this.mudo;
    try {
      localStorage.setItem('samuel-surfers:som', this.mudo ? '0' : '1');
    } catch {
      /* o som continua neste instante */
    }
    if (this.mudo) this.parar();
    else this.tocar(this.modo);
    return !this.mudo;
  }

  tocar(modo: 'menu' | 'corrida'): void {
    this.modo = modo;
    if (this.mudo) return;
    const ctx = this.abrir();
    if (!ctx) return;
    this.parar();
    const notas = modo === 'corrida' ? NOTAS_CORRIDA : NOTAS_MENU;
    const intervalo = modo === 'corrida' ? 210 : 320;
    const pulso = () => {
      const nota = notas[this.passo % notas.length];
      this.passo += 1;
      this.tom(nota, 0.12, 'sine', 0.03);
      if (this.passo % 4 === 0) this.tom(nota / 2, 0.1, 'triangle', 0.02);
    };
    pulso();
    this.timer = window.setInterval(pulso, intervalo);
  }

  parar(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
  }

  efeito(nome: Som): void {
    if (this.mudo) return;
    this.abrir();
    const mapa: Record<Som, [number, number, OscillatorType]> = {
      ui: [520, 0.04, 'sine'],
      moeda: [784, 0.07, 'sine'],
      pulo: [340, 0.09, 'triangle'],
      rola: [180, 0.08, 'sine'],
      faixa: [240, 0.04, 'triangle'],
      poder: [620, 0.16, 'sine'],
      tropeco: [150, 0.16, 'triangle'],
      fim: [196, 0.28, 'sine'],
    };
    const [freq, dur, tipo] = mapa[nome];
    this.tom(freq, dur, tipo, nome === 'moeda' ? 0.07 : 0.05);
    if (nome === 'moeda') window.setTimeout(() => this.tom(1046, 0.08, 'sine', 0.05), 70);
  }

  private abrir(): AudioContext | undefined {
    try {
      this.contexto ??= new AudioContext();
      if (this.contexto.state === 'suspended') void this.contexto.resume();
      return this.contexto;
    } catch {
      return undefined;
    }
  }

  private tom(frequencia: number, duracao: number, tipo: OscillatorType, volume: number): void {
    if (!this.contexto || volume <= 0) return;
    const osc = this.contexto.createOscillator();
    const ganho = this.contexto.createGain();
    osc.type = tipo;
    osc.frequency.value = frequencia;
    ganho.gain.setValueAtTime(volume, this.contexto.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.0001, this.contexto.currentTime + duracao);
    osc.connect(ganho).connect(this.contexto.destination);
    osc.start();
    osc.stop(this.contexto.currentTime + duracao);
  }
}

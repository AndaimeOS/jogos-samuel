// Corrida do Jack — regras puras (sem Three.js nem DOM), testadas em tests/regras.test.ts.
// Eixos: z = para a frente (o jogador corre em +z), x = faixas, y = para cima. Unidades em metros e segundos.

export const FAIXAS = [-2.2, 0, 2.2] as const;
export const GRAVIDADE = -38;
export const VEL_PULO = 12.5;        // pico ≈ 2,05 m, ≈ 0,66 s no ar
export const QUEDA_RAPIDA = -26;     // abaixar no ar desce rápido
export const ABAIXADO_SEG = 0.7;
export const TROCA_SEG = 0.15;       // tempo para chegar na faixa vizinha
export const ALTURA_EM_PE = 1.7;
export const ALTURA_ABAIXADO = 0.8;
export const MEIA_LARGURA = 0.35;
export const MEIO_COMPRIMENTO = 0.3;
const GERAR_A_FRENTE = 130;
const APAGAR_ATRAS = 12;

export type Modo = 'ajuda' | 'desafio';
export type Tipo = 'baixo' | 'alto' | 'bloco';
export type Estado = 'pronta' | 'correndo' | 'caiu';
export type Evento = 'moeda' | 'pulo' | 'abaixou' | 'troca' | 'escudo' | 'batida' | 'marco';

/** baixo: barreira até 0,9 m (pular); alto: barra de 1,2 a 2,6 m (abaixar); bloco: carrinho de 0 a 2,6 m (trocar de faixa). */
export const FORMA: Record<Tipo, { y0: number; y1: number; comprimento: number }> = {
  baixo: { y0: 0, y1: 0.9, comprimento: 0.6 },
  alto: { y0: 1.2, y1: 2.6, comprimento: 0.5 },
  bloco: { y0: 0, y1: 2.6, comprimento: 3.2 },
};
const MEIA_LARGURA_OBSTACULO = 0.95;

export interface Obstaculo { id: number; faixa: number; z: number; tipo: Tipo }
export interface Moeda { id: number; faixa: number; z: number; y: number; pega: boolean }
export interface Jogador { faixa: number; x: number; y: number; vy: number; abaixadoAte: number; noChao: boolean }

export const AJUSTES: Record<Modo, { velInicial: number; velMax: number; aceleracao: number; escudos: number }> = {
  ajuda: { velInicial: 9, velMax: 15, aceleracao: 0.12, escudos: 1 },
  desafio: { velInicial: 11, velMax: 22, aceleracao: 0.2, escudos: 0 },
};

/** Gerador pseudoaleatório determinístico (mulberry32). */
export function rng(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Corrida {
  estado: Estado = 'pronta';
  jogador: Jogador = { faixa: 1, x: 0, y: 0, vy: 0, abaixadoAte: 0, noChao: true };
  z = 0;
  vel: number;
  tempo = 0;
  moedas = 0;
  escudos: number;
  invencivelAte = 0;
  obstaculos: Obstaculo[] = [];
  moedasMundo: Moeda[] = [];
  private sorteio: () => number;
  private proximaFileira = 40;   // começo livre para a criança se situar
  private proximoId = 1;
  private ultimoMarco = 0;

  constructor(readonly modo: Modo = 'ajuda', readonly semente = 2026) {
    this.vel = AJUSTES[modo].velInicial;
    this.escudos = AJUSTES[modo].escudos;
    this.sorteio = rng(semente);
    this.gerarAte(GERAR_A_FRENTE);
  }

  get distancia() { return Math.floor(this.z); }
  get pontos() { return this.distancia + this.moedas * 5; }
  get abaixado() { return this.tempo < this.jogador.abaixadoAte; }

  comecar() { if (this.estado === 'pronta') this.estado = 'correndo'; }

  // ---------------- ações ----------------
  esquerda(): Evento[] { return this.trocar(-1); }
  direita(): Evento[] { return this.trocar(1); }
  private trocar(d: number): Evento[] {
    if (this.estado !== 'correndo') return [];
    const nova = this.jogador.faixa + d;
    if (nova < 0 || nova > 2) return [];
    this.jogador.faixa = nova;
    return ['troca'];
  }
  pular(): Evento[] {
    if (this.estado !== 'correndo' || !this.jogador.noChao) return [];
    this.jogador.vy = VEL_PULO;
    this.jogador.noChao = false;
    this.jogador.abaixadoAte = 0;   // pular cancela o abaixar
    return ['pulo'];
  }
  abaixar(): Evento[] {
    if (this.estado !== 'correndo') return [];
    if (!this.jogador.noChao) this.jogador.vy = Math.min(this.jogador.vy, QUEDA_RAPIDA);
    this.jogador.abaixadoAte = this.tempo + ABAIXADO_SEG + (this.jogador.noChao ? 0 : 0.25);
    return ['abaixou'];
  }

  // ---------------- simulação ----------------
  /** Avança dt segundos (use passos pequenos, até 1/30 s). Devolve o que aconteceu, para som e efeitos. */
  passo(dt: number): Evento[] {
    if (this.estado !== 'correndo') return [];
    const ev: Evento[] = [];
    const a = AJUSTES[this.modo];
    this.tempo += dt;
    this.vel = Math.min(a.velMax, this.vel + a.aceleracao * dt);
    this.z += this.vel * dt;

    const j = this.jogador;
    const alvo = FAIXAS[j.faixa];
    const passoX = (2.2 / TROCA_SEG) * dt;
    j.x = Math.abs(alvo - j.x) <= passoX ? alvo : j.x + Math.sign(alvo - j.x) * passoX;
    if (!j.noChao) {
      j.vy += GRAVIDADE * dt;
      j.y += j.vy * dt;
      if (j.y <= 0) { j.y = 0; j.vy = 0; j.noChao = true; }
    }

    const altura = this.abaixado ? ALTURA_ABAIXADO : ALTURA_EM_PE;
    for (const m of this.moedasMundo) {
      if (m.pega || Math.abs(m.z - this.z) > 0.9) continue;
      if (Math.abs(FAIXAS[m.faixa] - j.x) < 0.9 && m.y > j.y - 0.4 && m.y < j.y + altura + 0.4) { m.pega = true; this.moedas++; ev.push('moeda'); }
    }
    if (this.tempo >= this.invencivelAte) {
      for (const o of this.obstaculos) {
        const f = FORMA[o.tipo];
        if (this.z + MEIO_COMPRIMENTO < o.z || this.z - MEIO_COMPRIMENTO > o.z + f.comprimento) continue;
        if (Math.abs(FAIXAS[o.faixa] - j.x) > MEIA_LARGURA_OBSTACULO + MEIA_LARGURA) continue;
        if (j.y + altura <= f.y0 || j.y >= f.y1) continue;
        if (this.escudos > 0) {
          this.escudos--;
          this.invencivelAte = this.tempo + 2;
          ev.push('escudo');
        } else {
          this.estado = 'caiu';
          ev.push('batida');
        }
        break;
      }
    }
    const marco = Math.floor(this.z / 100);
    if (marco > this.ultimoMarco) { this.ultimoMarco = marco; ev.push('marco'); }

    this.gerarAte(this.z + GERAR_A_FRENTE);
    const limite = this.z - APAGAR_ATRAS;
    if (this.obstaculos.length && this.obstaculos[0].z < limite) this.obstaculos = this.obstaculos.filter((o) => o.z + FORMA[o.tipo].comprimento >= limite);
    if (this.moedasMundo.length && this.moedasMundo[0].z < limite) this.moedasMundo = this.moedasMundo.filter((m) => m.z >= limite);
    return ev;
  }

  // ---------------- gerador de pista ----------------
  /** Fileiras de obstáculos com espaço para reagir; toda fileira deixa pelo menos uma faixa sem bloco. */
  private gerarAte(zMax: number) {
    while (this.proximaFileira < zMax) {
      const z = this.proximaFileira;
      const r = this.sorteio;
      // quanto mais rápido, mais espaço entre fileiras (≈ 1,3 s de reação)
      const espaco = Math.max(14, this.vel * 1.3) + r() * 8;
      const tipos: (Tipo | null)[] = [null, null, null];
      const quantos = r() < 0.35 ? 1 : r() < 0.8 ? 2 : 3;
      const faixas = [0, 1, 2].sort(() => r() - 0.5).slice(0, quantos);
      for (const f of faixas) tipos[f] = r() < 0.4 ? 'bloco' : r() < 0.6 ? 'baixo' : 'alto';
      if (tipos.filter((t) => t === 'bloco').length === 3) tipos[faixas[0]] = 'baixo';   // nunca três carrinhos lado a lado
      // dois carrinhos nunca lado a lado: carrinho no meio com outro ao lado vira barreira/arco — de qualquer faixa,
      // basta UMA troca (ou pular/abaixar) para escapar; duas trocas em menos de 1 s é difícil demais para criança
      if (tipos[1] === 'bloco' && (tipos[0] === 'bloco' || tipos[2] === 'bloco')) tipos[1] = r() < 0.5 ? 'baixo' : 'alto';
      tipos.forEach((t, f) => { if (t) this.obstaculos.push({ id: this.proximoId++, faixa: f, z, tipo: t }); });
      // moedas: fileira numa faixa livre entre esta e a próxima, ou em arco por cima de uma barreira baixa
      const livres = tipos.map((t, f) => (t === null ? f : -1)).filter((f) => f >= 0);
      if (livres.length && r() < 0.75) {
        const f = livres[Math.floor(r() * livres.length)];
        for (let i = 0; i < 5; i++) this.moedasMundo.push({ id: this.proximoId++, faixa: f, z: z + 3 + i * 2, y: 0.8, pega: false });
      } else {
        const baixa = tipos.findIndex((t) => t === 'baixo');
        if (baixa >= 0) for (let i = 0; i < 5; i++) {
          const k = i / 4;
          this.moedasMundo.push({ id: this.proximoId++, faixa: baixa, z: z - 3 + i * 1.6, y: 0.8 + Math.sin(k * Math.PI) * 1.6, pega: false });
        }
      }
      this.proximaFileira = z + espaco;
    }
  }
}

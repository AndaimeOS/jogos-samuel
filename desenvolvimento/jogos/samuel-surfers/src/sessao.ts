import { CONFIG } from './config';
import { TRECHOS } from './pista';
import type { Acao, Entidade, Faixa, Foto, Ganchos, Modo, TipoEntidade, Trecho } from './tipos';

export interface OpcoesSessao {
  modo: Modo;
  rng?: () => number;
  trechos?: Trecho[];
  zInicial?: number;
}

const FAIXAS: Faixa[] = [-1, 0, 1];

function obstaculo(tipo: TipoEntidade): boolean {
  return tipo === 'barreira' || tipo === 'placa' || tipo === 'cone' || tipo === 'vagao';
}

export class Sessao {
  readonly entidades: Entidade[] = [];
  acabou = false;

  get metros(): number {
    return this.distancia;
  }

  private readonly modo: Modo;
  private readonly rng: () => number;
  private readonly trechos: Trecho[];
  private proximoZ: number;
  private proximoId = 1;
  private tempo = 0;
  private faixaAlvo: Faixa = 0;
  private x = 0;
  private y = 0;
  private vy = 0;
  private rolar = 0;
  private invulneravel = 0;
  private soluco = 0;
  private ima = 0;
  private prancha = 0;
  private velocidade: number = CONFIG.velocidadeInicial;
  private distancia = 0;
  private pontos = 0;
  private moedas = 0;
  private tropecos = 0;
  private pulos = 0;
  private rolos = 0;
  private jaContinuou = false;
  private missaoAvisada = false;

  constructor(private ganchos: Ganchos, opcoes: OpcoesSessao) {
    this.modo = opcoes.modo;
    this.rng = opcoes.rng ?? Math.random;
    this.trechos = opcoes.trechos ?? TRECHOS;
    this.proximoZ = opcoes.zInicial ?? CONFIG.zInicial;
    this.garantir();
  }

  atualizar(dt: number): void {
    if (this.acabou) return;
    this.tempo += dt;
    const teto = Math.min(CONFIG.velocidadeMaxima, CONFIG.velocidadeInicial + this.tempo * CONFIG.aceleracao);
    this.velocidade += (teto - this.velocidade) * Math.min(1, dt * 0.55);
    const viajou = this.velocidade * dt;
    this.distancia += viajou;
    this.pontos = Math.floor(this.distancia * 2 + this.moedas * 10);
    this.x += (this.faixaAlvo - this.x) * Math.min(1, dt * 10);

    if (this.y > 0 || this.vy > 0) {
      this.vy -= CONFIG.gravidade * dt;
      this.y = Math.max(0, this.y + this.vy * dt);
      if (this.y === 0) this.vy = 0;
    }
    this.rolar = Math.max(0, this.rolar - dt);
    this.invulneravel = Math.max(0, this.invulneravel - dt);
    this.soluco = Math.max(0, this.soluco - dt);
    this.ima = Math.max(0, this.ima - dt);
    this.prancha = Math.max(0, this.prancha - dt);

    const faixa = this.faixaAtual();
    for (const entidade of this.entidades) {
      if (!entidade.ativa) continue;
      entidade.z -= viajou;
      if (this.ima > 0 && entidade.tipo === 'moeda' && entidade.z < 16 && entidade.z > -1) {
        entidade.faixa = this.faixaAlvo;
        entidade.z -= viajou * 1.5;
      }
      if (this.encosta(entidade, faixa)) this.bater(entidade);
      if (entidade.z < -8) entidade.ativa = false;
    }
    this.proximoZ -= viajou;
    this.garantir();
    if (!this.missaoAvisada && this.moedas >= CONFIG.missaoMoedas) {
      this.missaoAvisada = true;
      this.ganchos.som('poder');
      this.ganchos.aviso('50 moedas!');
    }
    if (this.entidades.length > 400) {
      const vivas = this.entidades.filter((entidade) => entidade.ativa);
      this.entidades.length = 0;
      this.entidades.push(...vivas);
    }
  }

  acao(acao: Acao): void {
    if (this.acabou) return;
    if (acao === 'esquerda' && this.faixaAlvo > -1) {
      this.faixaAlvo = (this.faixaAlvo - 1) as Faixa;
      this.ganchos.som('faixa');
    } else if (acao === 'direita' && this.faixaAlvo < 1) {
      this.faixaAlvo = (this.faixaAlvo + 1) as Faixa;
      this.ganchos.som('faixa');
    } else if (acao === 'pular' && this.y === 0 && this.rolar <= 0) {
      this.vy = CONFIG.pulo;
      this.pulos += 1;
      this.ganchos.som('pulo');
    } else if (acao === 'rolar' && this.y === 0) {
      this.rolar = CONFIG.rolar;
      this.rolos += 1;
      this.ganchos.som('rola');
    }
  }

  colocarBarreira(): void {
    this.prancha = 0;
    this.invulneravel = 0;
    this.y = 0;
    this.vy = 0;
    this.rolar = 0;
    this.criar('barreira', this.faixaAlvo, 5);
  }

  continuar(): boolean {
    if (this.modo !== 'normal' || !this.acabou || this.jaContinuou) return false;
    this.jaContinuou = true;
    this.acabou = false;
    this.invulneravel = 1.8;
    for (const entidade of this.entidades) {
      if (!entidade.ativa || !obstaculo(entidade.tipo)) continue;
      if (entidade.z < 12 && entidade.z > -4) entidade.ativa = false;
    }
    return true;
  }

  foto(): Foto {
    return {
      pontos: this.pontos,
      moedas: this.moedas,
      distancia: Math.floor(this.distancia),
      faixa: this.faixaAlvo,
      x: this.x,
      y: this.y,
      rolando: this.rolar > 0,
      pulando: this.y > 0.05,
      protegido: this.prancha > 0 || this.invulneravel > 0,
      velocidade: this.velocidade,
      ima: this.ima,
      prancha: this.prancha,
      tropecos: this.tropecos,
      tropecando: this.soluco > 0,
      acabou: this.acabou,
      modo: this.modo,
      pulos: this.pulos,
      rolos: this.rolos,
      continuou: this.jaContinuou,
      podeContinuar: this.modo === 'normal' && this.acabou && !this.jaContinuou,
      missao: this.moedas >= CONFIG.missaoMoedas,
      moedasPerto: this.entidades.filter((entidade) => entidade.ativa && entidade.tipo === 'moeda' && entidade.z > 0 && entidade.z < 42).length,
    };
  }

  private faixaAtual(): Faixa {
    return Math.round(this.x) as Faixa;
  }

  private encosta(entidade: Entidade, faixa: Faixa): boolean {
    if (entidade.faixa !== faixa) return false;
    const perto = entidade.z;
    const longe = entidade.tipo === 'vagao' ? entidade.z + CONFIG.vagaoComprimento : entidade.z;
    return longe > -1.15 && perto < 1.5;
  }

  private bater(entidade: Entidade): void {
    if (!entidade.ativa) return;
    if (entidade.tipo === 'moeda') {
      entidade.ativa = false;
      this.moedas += 1;
      this.ganchos.particulas(entidade.faixa, Math.max(0.4, entidade.z));
      this.ganchos.som('moeda');
      return;
    }
    if (entidade.tipo === 'ima' || entidade.tipo === 'prancha') {
      entidade.ativa = false;
      if (entidade.tipo === 'ima') this.ima = CONFIG.imaSegundos;
      else this.prancha = CONFIG.pranchaSegundos;
      this.ganchos.som('poder');
      this.ganchos.aviso(entidade.tipo === 'ima' ? 'Ímã!' : 'Prancha!');
      return;
    }
    const desviou =
      ((entidade.tipo === 'barreira' || entidade.tipo === 'cone') && this.y > CONFIG.alturaPulo) ||
      (entidade.tipo === 'placa' && this.rolar > 0);
    if (desviou) return;
    entidade.ativa = false;
    if (this.prancha > 0 || this.invulneravel > 0) return;
    if (this.modo === 'facil') {
      this.tropecos += 1;
      this.soluco = CONFIG.soluco;
      this.invulneravel = CONFIG.invulneravel;
      this.velocidade = Math.max(CONFIG.velocidadePiso, this.velocidade * CONFIG.freioTropeco);
      this.ganchos.som('tropeco');
      this.ganchos.aviso('Ai! Tropeçou.');
      return;
    }
    this.acabou = true;
    this.ganchos.som('fim');
    this.ganchos.fim();
  }

  private garantir(): void {
    let guarda = 0;
    while (this.proximoZ < CONFIG.horizonte && guarda < 8) {
      this.gerarTrecho();
      guarda += 1;
    }
  }

  private gerarTrecho(): void {
    const nivel = Math.min(3, 1 + Math.floor(this.tempo / CONFIG.nivelSegundos));
    let opcoes = this.trechos.filter((trecho) => trecho.nivel <= nivel);
    if (!opcoes.length) opcoes = this.trechos;
    const indice = Math.min(opcoes.length - 1, Math.floor(this.rng() * opcoes.length));
    const trecho = opcoes[indice];
    const base = this.proximoZ;
    for (const linha of trecho.linhas) {
      for (const faixa of linha.moedas ?? []) this.criar('moeda', faixa, base + linha.z);
      if (linha.obstaculos) {
        for (const faixa of FAIXAS) {
          const tipo = linha.obstaculos[faixa];
          if (tipo) this.criar(tipo, faixa, base + linha.z);
        }
      }
      if (linha.poder) this.criar(linha.poder.tipo, linha.poder.faixa, base + linha.z);
    }
    this.proximoZ += CONFIG.trecho;
  }

  private criar(tipo: TipoEntidade, faixa: Faixa, z: number): void {
    this.entidades.push({ id: this.proximoId++, tipo, faixa, z, ativa: true });
  }
}

export function semente(n: number): () => number {
  let x = n >>> 0 || 1;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

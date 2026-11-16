export type Faixa = -1 | 0 | 1;
export type Modo = 'facil' | 'normal';
export type Obstaculo = 'barreira' | 'placa' | 'cone' | 'vagao';
export type Item = 'moeda' | 'ima' | 'prancha';
export type TipoEntidade = Item | Obstaculo;
export type Acao = 'esquerda' | 'direita' | 'pular' | 'rolar';
export type Gesto = Acao | 'pausa';
export type Som = 'moeda' | 'pulo' | 'rola' | 'faixa' | 'poder' | 'tropeco' | 'fim' | 'ui';

export interface Entidade {
  id: number;
  tipo: TipoEntidade;
  faixa: Faixa;
  z: number;
  ativa: boolean;
}

export interface LinhaTrecho {
  z: number;
  obstaculos?: Partial<Record<Faixa, Obstaculo>>;
  moedas?: Faixa[];
  poder?: { faixa: Faixa; tipo: 'ima' | 'prancha' };
}

export interface Trecho {
  id: string;
  nivel: 1 | 2 | 3;
  linhas: LinhaTrecho[];
}

export interface Foto {
  pontos: number;
  moedas: number;
  distancia: number;
  faixa: Faixa;
  x: number;
  y: number;
  rolando: boolean;
  pulando: boolean;
  protegido: boolean;
  velocidade: number;
  ima: number;
  prancha: number;
  tropecos: number;
  tropecando: boolean;
  acabou: boolean;
  modo: Modo;
  pulos: number;
  rolos: number;
  continuou: boolean;
  podeContinuar: boolean;
  missao: boolean;
  moedasPerto: number;
}

export interface Ganchos {
  som(nome: Som): void;
  aviso(texto: string): void;
  fim(): void;
  particulas(faixa: Faixa, z: number): void;
}

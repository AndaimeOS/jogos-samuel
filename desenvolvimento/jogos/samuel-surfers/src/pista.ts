import type { Trecho } from './tipos';

/** Cada linha deixa pelo menos uma faixa livre. */
export const TRECHOS: Trecho[] = [
  {
    id: 'abertura',
    nivel: 1,
    linhas: [
      { z: 6, moedas: [-1, 0, 1] },
      { z: 16, moedas: [0] },
      { z: 32, obstaculos: { 0: 'barreira' }, moedas: [-1, 1] },
    ],
  },
  {
    id: 'cones',
    nivel: 1,
    linhas: [
      { z: 10, obstaculos: { 1: 'cone' }, moedas: [-1, 0] },
      { z: 26, obstaculos: { [-1]: 'barreira' }, moedas: [0, 1] },
      { z: 40, poder: { faixa: 0, tipo: 'ima' } },
    ],
  },
  {
    id: 'placas',
    nivel: 1,
    linhas: [
      { z: 12, obstaculos: { 0: 'placa' }, moedas: [0] },
      { z: 28, obstaculos: { [-1]: 'cone', 1: 'barreira' }, moedas: [0] },
      { z: 42, moedas: [-1, 1] },
    ],
  },
  {
    id: 'vagao',
    nivel: 2,
    linhas: [
      { z: 8, obstaculos: { [-1]: 'vagao' }, moedas: [0, 1] },
      { z: 30, obstaculos: { 1: 'placa' }, moedas: [-1] },
      { z: 44, poder: { faixa: 0, tipo: 'prancha' } },
    ],
  },
  {
    id: 'zigue',
    nivel: 2,
    linhas: [
      { z: 10, obstaculos: { 0: 'barreira', 1: 'cone' }, moedas: [-1] },
      { z: 26, obstaculos: { [-1]: 'cone', 0: 'placa' }, moedas: [1] },
      { z: 42, obstaculos: { 1: 'vagao' }, moedas: [-1, 0] },
    ],
  },
  {
    id: 'festa',
    nivel: 1,
    linhas: [
      { z: 8, moedas: [-1, 0, 1] },
      { z: 20, moedas: [-1, 0, 1] },
      { z: 32, poder: { faixa: 0, tipo: 'ima' } },
      { z: 44, moedas: [0] },
    ],
  },
  {
    id: 'apertado',
    nivel: 3,
    linhas: [
      { z: 8, obstaculos: { [-1]: 'vagao', 1: 'vagao' }, moedas: [0] },
      { z: 28, obstaculos: { 0: 'placa' }, moedas: [-1, 1] },
      { z: 44, obstaculos: { [-1]: 'barreira', 0: 'cone' }, moedas: [1] },
    ],
  },
];

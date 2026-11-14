import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../../../_privado/jogos/pebolim/js/config.js';
import { classificarToque, lerTeclas, timeDoPonteiro } from '../../../../_privado/jogos/pebolim/js/controles.js';

describe('controles', () => {
  it('cada metade da tela é um time, e no modo 1 a direita é o computador', () => {
    expect(timeDoPonteiro(10, 800, '2')).toBe('vermelho');
    expect(timeDoPonteiro(799, 800, '2')).toBe('azul');
    expect(timeDoPonteiro(400, 800, '2')).toBe('azul');
    expect(timeDoPonteiro(399, 800, '2')).toBe('vermelho');
    expect(timeDoPonteiro(700, 800, '1')).toBeNull();
    expect(timeDoPonteiro(20, 800, '1')).toBe('vermelho');
  });

  it('toque curto chuta e arrastar move', () => {
    const toque = classificarToque(
      { x: 0, y: 0, t: 0 },
      { x: 4, y: 3, t: 120 },
      CONFIG,
    );
    const arraste = classificarToque(
      { x: 0, y: 0, t: 0 },
      { x: 0, y: 40, t: 80 },
      CONFIG,
    );
    expect(toque).toBe('chute');
    expect(arraste).toBe('arraste');
  });

  it('no computador as setas movem e o espaço chuta; com dois, cada um tem o seu lado', () => {
    const um = lerTeclas(new Set(['ArrowUp', 'Space']), '1');
    expect(um.eixo.vermelho).toBe(-1);
    expect(um.eixo.azul).toBe(0);
    expect(um.chutes).toEqual(['vermelho']);

    const dois = lerTeclas(new Set(['KeyS', 'ArrowUp', 'Enter']), '2');
    expect(dois.eixo.vermelho).toBe(1);
    expect(dois.eixo.azul).toBe(-1);
    expect(dois.chutes).toEqual(['azul']);
  });
});
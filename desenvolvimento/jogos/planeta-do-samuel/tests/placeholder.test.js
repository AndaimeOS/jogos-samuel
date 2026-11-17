import { describe, expect, it } from 'vitest';
import manifesto from '../../../../_privado/jogos/planeta-do-samuel/arte/manifesto.json' with { type: 'json' };
import { quadroCodigo } from '../../../../_privado/jogos/planeta-do-samuel/motor/placeholders.js';

function opacos(buf) {
  let n = 0;
  for (let i = 3; i < buf.data.length; i += 4) if (buf.data[i]) n++;
  return n;
}

describe('placeholder', () => {
  it('cada id do manifesto pinta um quadro do tamanho certo', () => {
    for (const [id, spec] of Object.entries(manifesto.sprites)) {
      const q = quadroCodigo(id, 0, 0);
      expect(q.w, id).toBe(spec.frameW);
      expect(q.h, id).toBe(spec.frameH);
      expect(opacos(q), id).toBeGreaterThan(8);
      if (spec.colunas > 1) {
        const ultimo = quadroCodigo(id, spec.colunas - 1, 0);
        expect(opacos(ultimo), id).toBeGreaterThan(8);
      }
    }
  });

  it('o Samuel tem as cinco vistas desenhadas, e a esquerda fica para o espelho', () => {
    for (const linha of [0, 1, 2, 3, 4]) {
      expect(opacos(quadroCodigo('samuel-andar', 0, linha)), 'linha ' + linha).toBeGreaterThan(20);
    }
    expect(manifesto.sprites['samuel-andar'].espelhoDaDireita).toBe(true);
    expect(manifesto.sprites['player2-andar']).toBeUndefined();
  });
});

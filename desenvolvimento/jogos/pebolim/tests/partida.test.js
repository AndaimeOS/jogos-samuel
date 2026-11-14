import './sat.js';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../../../_privado/jogos/pebolim/js/config.js';
import { chutar, jogadoresDe } from '../../../../_privado/jogos/pebolim/js/fisica.js';
import {
  aplicarGol, avancar, comecar, criarPartida, soltarBola, textoFim, textoSeta,
} from '../../../../_privado/jogos/pebolim/js/partida.js';

const PASSO = 1 / 60;

function nova(extra = {}) {
  const p = criarPartida({ modo: '2', dificuldade: 'normal', semente: 2, ...extra });
  comecar(p);
  return p;
}

describe('partida', () => {
  it('acaba em 5 gols, com festa e sem punição', () => {
    const p = nova();
    for (let i = 1; i < CONFIG.partida.golsVitoria; i++) {
      aplicarGol(p, 'azul');
      expect(p.fase).toBe('gol');
      expect(soltarBola(p)).toBe(true);
      expect(p.fase).toBe('jogando');
    }
    aplicarGol(p, 'azul');
    expect(p.placar.azul).toBe(CONFIG.partida.golsVitoria);
    expect(p.fase).toBe('fim');
    expect(p.motivo).toBe('gols');
    expect(p.vencedor).toBe('azul');
    const texto = textoFim(p);
    expect(texto.titulo).toBe('O Azul venceu!');
    expect(texto.frase).toMatch(/boa/);
    expect(`${texto.titulo} ${texto.frase}`).not.toMatch(/perdeu|derrota|puni|fraco|ruim/i);
  });

  it('acaba quando o tempo acaba, empate também é festa', () => {
    const p = nova();
    expect(p.tempo).toBe(CONFIG.partida.segundos);
    p.tempo = 0.05;
    avancar(p, 0.1);
    expect(p.fase).toBe('fim');
    expect(p.motivo).toBe('tempo');
    expect(p.vencedor).toBe('empate');
    expect(textoFim(p).titulo).toBe('Empate!');
    expect(textoFim(p).frase).toMatch(/mandaram bem/);
  });

  it('depois do gol a seta mostra o lado e o botão solta a bola para esse lado', () => {
    const p = nova();
    aplicarGol(p, 'vermelho');
    expect(p.fase).toBe('gol');
    expect(textoSeta(p)).toEqual({ lado: 'esquerda', frase: 'A bola vai para a esquerda' });
    const tempo = p.tempo;
    avancar(p, 1);
    expect(p.fase).toBe('gol');
    expect(p.tempo).toBe(tempo);
    soltarBola(p);
    expect(p.fase).toBe('jogando');
    expect(p.bola.vx).toBeLessThan(0);
    expect(Math.abs(p.bola.vx)).toBe(p.ajustes.saque);
  });

  it('o Fácil tem gol maior, bola mais lenta e chute mais fraco', () => {
    const facil = nova({ dificuldade: 'facil' });
    const normal = nova({ dificuldade: 'normal' });
    expect(facil.ajustes.abertura).toBe(CONFIG.gol.aberturaFacil);
    expect(normal.ajustes.abertura).toBe(CONFIG.gol.abertura);
    expect(facil.ajustes.abertura).toBeGreaterThan(normal.ajustes.abertura);
    expect(facil.ajustes.velMax).toBeLessThan(normal.ajustes.velMax);
    expect(facil.ajustes.impulso).toBeLessThan(normal.ajustes.impulso);
    expect(facil.ajustes.saque).toBeLessThan(normal.ajustes.saque);

    const yForaDoNormal = (CONFIG.campo.largura - CONFIG.gol.abertura) / 2 - CONFIG.bola.raio - 20;
    const dentroDoFacil = yForaDoNormal > (CONFIG.campo.largura - CONFIG.gol.aberturaFacil) / 2;
    expect(dentroDoFacil).toBe(true);

    function empurra(p) {
      p.bola.x = 12;
      p.bola.y = yForaDoNormal;
      p.bola.vx = -240;
      p.bola.vy = 0;
      p.fase = 'jogando';
      avancar(p, 0.08);
    }
    empurra(normal);
    expect(normal.placar.azul).toBe(0);
    expect(normal.fase).toBe('jogando');
    empurra(facil);
    expect(facil.placar.azul).toBe(1);
    expect(facil.fase).toBe('gol');
  });

  it('chute do Vermelho manda a bola para a direita, e no Fácil sai mais devagar', () => {
    function tacada(dificuldade) {
      const p = nova({ dificuldade });
      const gk = jogadoresDe(p.cfg, p.deslize).find((j) => j.time === 'vermelho');
      p.bola.x = gk.x + 28;
      p.bola.y = gk.y;
      p.bola.vx = 0;
      p.bola.vy = 0;
      expect(chutar(p, 'vermelho')).toBe(true);
      return p.bola.vx;
    }
    const vxFacil = tacada('facil');
    const vxNormal = tacada('normal');
    expect(vxFacil).toBeGreaterThan(0);
    expect(vxNormal).toBeGreaterThan(vxFacil);
  });
});

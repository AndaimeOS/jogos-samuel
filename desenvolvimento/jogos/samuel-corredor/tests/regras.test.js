import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ANIMS, COLUNAS, CONFIG, GID_QUEDA, GIDS_ENFEITE, GIDS_PLATAFORMA, GIDS_SOLIDO,
  ORDEM, aoZerarVidas, botaoEmPtZoomInteiro, botaoEmPxCss, classificarContato,
  cortarPulo, decidirBuraco, decidirContato, gid, layoutMapa, layoutNos, medida, proximaFase, zoomDaFase,
} from '../../../../_privado/jogos/samuel-corredor/regras.js';

const raiz = new URL('../../../../_privado/jogos/samuel-corredor/', import.meta.url);

describe('regras', () => {
  it('segura o pulo alto e corta quando solta', () => {
    expect(cortarPulo(-370, true)).toBe(-370);
    expect(cortarPulo(-370, false)).toBeCloseTo(-370 * CONFIG.corte);
    expect(cortarPulo(40, false)).toBe(40);
  });

  it('separa pisão, empurrão e buraco', () => {
    expect(decidirContato('normal')).toBe('dano');
    expect(decidirContato('facil')).toBe('empurra');
    expect(decidirBuraco('normal')).toBe('checkpoint');
    expect(decidirBuraco('facil')).toBe('plataforma');
    const ini = { esquerda: 100, direita: 128, topo: 172, base: 192 };
    expect(classificarContato({ esquerda: 104, direita: 118, pe: 176, altura: 40, vy: 80 }, ini)).toBe('pisa');
    expect(classificarContato({ esquerda: 90, direita: 110, pe: 192, altura: 40, vy: 0 }, ini)).toBe('lado');
    expect(aoZerarVidas(2)).toBe(2);
    expect(aoZerarVidas(0)).toBe(3);
  });

  it('os botões do Gerador passam de 44 pt no iPad', () => {
    for (const altura of [768, 1024]) {
      for (const px of [24, 32, 40]) {
        expect(botaoEmPxCss(px, altura)).toBeGreaterThanOrEqual(44);
        expect(botaoEmPtZoomInteiro(px, altura)).toBeGreaterThanOrEqual(44);
      }
    }
    expect(botaoEmPtZoomInteiro(24, 744)).toBeGreaterThanOrEqual(44);
    expect(medida(1024, 768).largura).toBe(320);
    expect(medida(768, 1024).largura).toBe(180);
    expect(medida(1024, 768).inteiro).toBe(false);
  });

  it('o mapa deita em colunas e em pé empilha', () => {
    expect(layoutMapa(320).map((f) => f.id)).toEqual(ORDEM);
    expect(layoutNos(320).map((f) => f.id)).toEqual(ORDEM);
    expect(layoutNos(320)[1].x).toBeGreaterThan(layoutNos(320)[0].x);
    expect(layoutNos(180)[1].y).toBeGreaterThan(layoutNos(180)[0].y);
    expect(layoutNos(180)[0].w).toBeGreaterThanOrEqual(48);
    expect(zoomDaFase(180)).toBe(2.2);
    expect(zoomDaFase(320)).toBe(1);
    const faixas = layoutMapa(180);
    expect(faixas[0].y).toBeGreaterThanOrEqual(40);
    expect(faixas[2].y + faixas[2].h).toBeCloseTo(240);
    expect(faixas[2].chao).toBeGreaterThan(faixas[0].chao);
    expect(proximaFase('campo')).toBe('floresta');
    expect(proximaFase('caverna')).toBeNull();
  });
});

describe('arte combinada', () => {
  const atlas = JSON.parse(readFileSync(new URL('arte/atlas.json', raiz), 'utf8'));

  it('o atlas único tem os 54 quadros sem corte', () => {
    expect(atlas.meta.image).toBe('atlas.png');
    expect(atlas.meta.size).toEqual({ w: 256, h: 256 });
    const nomes = [];
    for (const def of Object.values(ANIMS)) nomes.push(...def.frames);
    nomes.push('lesma/pof_0', 'besouro/pof_0', 'morcego/pof_0', 'estrela/apagada_0');
    expect(new Set(nomes).size).toBe(54);
    expect(Object.keys(atlas.frames).sort()).toEqual([...new Set(nomes)].sort());
    for (const nome of nomes) {
      const quadro = atlas.frames[nome];
      expect(quadro, nome).toBeTruthy();
      expect(quadro.trimmed, nome).toBe(false);
      expect(quadro.rotated, nome).toBe(false);
      expect(quadro.spriteSourceSize).toEqual({ x: 0, y: 0, w: quadro.frame.w, h: quadro.frame.h });
    }
    expect(atlas.frames['samuel/parado_0'].frame).toMatchObject({ w: 32, h: 48 });
    expect(atlas.frames['samuel/comemorar_0'].frame).toMatchObject({ w: 32, h: 48 });
    expect(atlas.frames['marco/apagado_0'].frame).toMatchObject({ w: 16, h: 24 });
    expect(atlas.frames['castelinho/parado_0'].frame).toMatchObject({ w: 64, h: 64 });
  });

  it('as fases Tiled usam as camadas e o tileset de 16', () => {
    for (const id of ORDEM) {
      const mapa = JSON.parse(readFileSync(new URL(`arte/fases/${id}.json`, raiz), 'utf8'));
      expect(mapa.tilewidth).toBe(16);
      expect(mapa.tilesets[0]).toMatchObject({ name: 'tiles', columns: 12, firstgid: 1, tilecount: 36, image: '../tiles.png' });
      expect(mapa.layers.map((c) => c.name)).toEqual(['fundo', 'solido', 'objetos']);
      const tipos = mapa.layers[2].objects.map((o) => o.type);
      expect(tipos).toContain('spawn');
      expect(tipos).toContain('checkpoint');
      expect(tipos).toContain('meta');
      const estrelas = mapa.layers[2].objects.filter((o) => o.type === 'estrela');
      expect(estrelas, id).toHaveLength(3);
      const marco = mapa.layers[2].objects.find((o) => o.type === 'checkpoint');
      const meio = (marco.x + marco.width / 2) / (mapa.width * 16);
      expect(meio).toBeGreaterThanOrEqual(0.4);
      expect(meio).toBeLessThanOrEqual(0.66);
      const usados = new Set(mapa.layers[1].data.filter((n) => n > 0));
      for (const n of usados) {
        expect(GIDS_SOLIDO.includes(n) || GIDS_PLATAFORMA.includes(n) || n === GID_QUEDA || GIDS_ENFEITE.includes(n), `${id} gid ${n}`).toBe(true);
      }
    }
  });

  it('os nomes de animação são os da amostra', () => {
    expect(Object.keys(ANIMS)).toEqual(expect.arrayContaining([
      'samuel/parado', 'samuel/correr', 'samuel/pular', 'samuel/cair', 'samuel/dano', 'samuel/comemorar',
      'lesma/andar', 'besouro/andar', 'morcego/voar', 'pof/estourar',
    ]));
    expect(COLUNAS).toHaveLength(12);
    expect(gid('caverna', 'especial')).toBe(GID_QUEDA);
  });
});

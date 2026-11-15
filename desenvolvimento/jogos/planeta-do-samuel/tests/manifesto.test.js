import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import manifesto from '../../../../_privado/jogos/planeta-do-samuel/arte/manifesto.json' with { type: 'json' };
import { empacotar } from '../empacotar-arte.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const jogoReal = path.resolve(aqui, '../../../../_privado/jogos/planeta-do-samuel');

const ESPERADOS = [
  'samuel-andar', 'samuel-parado', 'cao-parado',
  'graveto', 'seixo', 'arbusto', 'arbusto-vazio', 'arvore', 'toco', 'rocha', 'veio', 'veio-vazio',
  'toca', 'fogueira-apagada', 'fogueira-acesa', 'pesquisa-bronze', 'bancada',
  'fornalha-fria', 'fornalha-acesa', 'canteiro', 'pesquisa-ferro', 'ferramentas',
  'casinha-obra', 'casinha-pronta', 'farol-0', 'farol-1', 'farol-2', 'farol-aceso',
  'icone-madeira', 'icone-pedra', 'icone-minerio', 'icone-fruta', 'icone-barra',
  'icone-fome', 'icone-calor', 'icone-dia', 'icone-noite', 'icone-seta',
  'seixo-vivo', 'lobo-da-pedra', 'enxame', 'urso-da-caverna',
  'guerreiro-de-bronze', 'escorpiao', 'golem-de-barro', 'sentinela-de-bronze',
  'soldado-de-ferro', 'catapulta', 'lobo-de-ferro', 'colosso-de-ferro',
  'lasca', 'lanca', 'faisca', 'pedregulho', 'telegraph',
  'acerto', 'morte', 'xp-brilho', 'levelup', 'xp-1', 'xp-2', 'xp-3',
  'icone-lasca', 'icone-lanca', 'icone-faisca', 'icone-fogueira-carta', 'icone-vida', 'carta-upgrade',
];

describe('manifesto', () => {
  it('lista a arte da v0.2 em codigo, sem Player 2 e sem Pokémon', () => {
    expect(manifesto.versao).toBe(1);
    expect(manifesto.imagem).toBe('atlas.webp');
    expect(manifesto.perspectiva).toBe('3/4');
    expect(manifesto.ticksPorSegundo).toBe(60);
    expect(manifesto.direcoes).toHaveLength(8);
    const ids = Object.keys(manifesto.sprites);
    for (const id of ESPERADOS) expect(ids, id).toContain(id);
    for (const era of ['pedra', 'bronze', 'ferro']) {
      for (const tipo of ['grama', 'grama-var', 'areia', 'agua']) {
        expect(ids).toContain(`chao-${era}-${tipo}`);
      }
    }
    expect(ids.some((id) => id.startsWith('player2'))).toBe(false);
    const texto = JSON.stringify(manifesto).toLowerCase();
    expect(texto).not.toMatch(/pokemon|pikachu|poké/);
    for (const [id, s] of Object.entries(manifesto.sprites)) {
      expect(['codigo', 'atlas'], id).toContain(s.origem);
      expect(s.duracoes, id).toHaveLength(s.colunas);
      expect(s.frameW % manifesto.grade, id).toBe(0);
      expect(s.pe, id).toBe('base');
      expect(s.arquivo, id).toMatch(/\.png$/);
    }
    expect(manifesto.sprites['samuel-andar']).toMatchObject({
      frameW: 32, frameH: 48, colunas: 4, linhas: 8, espelhoDaDireita: true, origem: 'codigo',
    });
  });

  it('sem PNG mestre, o empacotador não troca o manifesto publicado', async () => {
    const antes = await readFile(path.join(jogoReal, 'arte', 'manifesto.json'), 'utf8');
    const r = await empacotar({ mestre: path.join(aqui, 'sem-png'), jogo: jogoReal });
    expect(r.empacotados).toBe(0);
    const depois = await readFile(path.join(jogoReal, 'arte', 'manifesto.json'), 'utf8');
    expect(depois).toBe(antes);
  });

  it('com um PNG, gera atlas.webp sem perdas e marca origem atlas', async () => {
    const raiz = await mkdtemp(path.join(tmpdir(), 'planeta-arte-'));
    const mestre = path.join(raiz, 'mestre');
    const jogo = path.join(raiz, 'jogo');
    await mkdir(path.join(mestre, 'ui'), { recursive: true });
    await mkdir(path.join(jogo, 'arte'), { recursive: true });
    const doc = {
      versao: 1,
      imagem: 'atlas.webp',
      sprites: {
        'icone-seta': {
          arquivo: 'ui/seta.png',
          origem: 'codigo',
          frameW: 8,
          frameH: 8,
          colunas: 1,
          linhas: 8,
          espelhoDaDireita: true,
          duracoes: [1],
          loop: false,
          pe: 'base',
        },
      },
    };
    await writeFile(path.join(jogo, 'arte', 'manifesto.json'), JSON.stringify(doc));
    const cru = Buffer.alloc(8 * 40 * 4);
    const pixelDireita = (2 * 8 * 8 + 7) * 4;
    cru[pixelDireita] = 255;
    cru[pixelDireita + 3] = 255;
    await sharp(cru, { raw: { width: 8, height: 40, channels: 4 } }).png().toFile(path.join(mestre, 'ui/seta.png'));

    const r = await empacotar({ mestre, jogo });
    expect(r.empacotados).toBe(1);
    expect(r.altura).toBe(64);
    const saida = JSON.parse(await readFile(path.join(jogo, 'arte', 'manifesto.json'), 'utf8'));
    expect(saida.sprites['icone-seta'].origem).toBe('atlas');
    expect(saida.sprites['icone-seta'].x).toBe(0);
    const webp = sharp(path.join(jogo, 'arte', 'atlas.webp'));
    const meta = await webp.metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(8);
    expect(meta.height).toBe(64);
    const { data } = await webp.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const direita = 2 * 8 * 8 * 4 + 7 * 4;
    expect(data[direita]).toBe(255);
    const esquerda = 6 * 8 * 8 * 4 + 0 * 4;
    expect(data[esquerda]).toBe(255);
    expect(data[esquerda + 3]).toBe(255);
    await rm(raiz, { recursive: true, force: true });
  });
});

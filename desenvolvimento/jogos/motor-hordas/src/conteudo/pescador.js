import { DURACAO_FASE, EVENTOS } from '../motor/partida.js'
import { ITENS_COMUNS, bifurca, no } from './comun.js'

const golpe = (id, nome, texto, icone, sprite, tipo, resto) => ({
  id, nome, texto, icone, sprite, tipo,
  dano: 8, cadencia: 1, duracao: 2.2, n: 1, raio: 36, vel: 2, hit: 7, empurrao: 36,
  bifurca: bifurca(
    { nome: `${nome} longo`, texto: 'Chega mais longe.', mod: { raio: 16 } },
    { nome: `${nome} ardido`, texto: 'Arde na água.', mod: { queima: true } },
    { nome: `${nome} forte`, texto: 'Empurra a onda.', mod: { empurrao: 46, dano: 3 } },
    { nome: `${nome} em par`, texto: 'Solta mais um.', mod: { n: 1 } },
  ),
  ...resto,
})

const golpes = [
  golpe('anzol', 'Anzol', 'A linha vai no alvo.', 'icone-anzol', 'anzol-giratorio', 'tiro', { dano: 9, vel: 210, cadencia: 0.9, duracao: 1, hit: 6, alcance: 210 }),
  golpe('rede', 'Rede', 'A rede cai no alvo.', 'icone-rede', 'rede', 'noalvo', { dano: 11, raio: 42, cadencia: 1.3, duracao: 0.7, alcance: 200 }),
  golpe('arpao', 'Arpão', 'Um arpão voa no alvo.', 'icone-bolhas', 'bolha', 'tiro', { dano: 12, vel: 240, cadencia: 0.8, duracao: 0.9, hit: 7, alcance: 280 }),
  golpe('boia', 'Boia', 'Vai no alvo e volta.', 'icone-bolhas', 'bolha', 'volta', { dano: 10, vel: 150, cadencia: 1.35, duracao: 2.5, alcance: 220 }),
  golpe('espuma', 'Espuma', 'Espuma em volta do alvo.', 'icone-rede', 'rede', 'noalvo', { dano: 6, raio: 40, cadencia: 4.5, duracao: 2, alcance: 200 }),
  golpe('linha', 'Linha', 'Puxa quem está no alvo.', 'icone-anzol', 'anzol-giratorio', 'noalvo', { dano: 5, raio: 46, puxa: 100, cadencia: 5, duracao: 2, alcance: 200 }),
  golpe('remo', 'Remo', 'Uma pancada no alvo perto.', 'icone-rede', 'rede', 'estocada', { dano: 16, empurrao: 100, cadencia: 1.1, duracao: 0.2, alcance: 68, hit: 12 }),
  golpe('cardume-tiro', 'Isca', 'Três iscas no alvo.', 'icone-anzol', 'anzol-giratorio', 'tiro', { dano: 7, vel: 200, n: 3, cadencia: 1.1, duracao: 0.85, alcance: 230 }),
  golpe('neblina', 'Neblina', 'Névoa em volta do alvo.', 'icone-bolhas', 'bolha', 'noalvo', { dano: 7, raio: 36, cadencia: 5.5, duracao: 2.2, alcance: 180 }),
  golpe('onda', 'Onda', 'Uma onda vai no alvo.', 'icone-bolhas', 'bolha', 'tiro', { dano: 13, vel: 150, cadencia: 1.4, duracao: 1.1, alcance: 220, hit: 10 }),
  golpe('lanterna', 'Lanterna', 'Luz quente no alvo.', 'icone-album', 'figurinha', 'noalvo', { dano: 6, raio: 34, queima: true, cadencia: 6, duracao: 2.2, alcance: 180 }),
  golpe('arpao-duplo', 'Arpão fundo', 'Um arpão pesado no alvo.', 'icone-bolhas', 'bolha', 'tiro', { dano: 20, vel: 210, empurrao: 70, cadencia: 1.45, duracao: 0.8, alcance: 260 }),
]

const bicho = (sprite, hp, vel, dano, xp, massa, raio, extra) => ({
  sprite, hp, vel, dano, xp, massa, raio, comportamento: (extra && extra.comportamento) || 'chase', altura: (extra && extra.altura) || raio * 2, ...extra,
})

const inimigos = {
  piranha: bicho('piranha', 14, 54, 7, 2, 0.7, 8, { altura: 16 }),
  'sapo-pulador': bicho('sapo-pulador', 20, 36, 8, 2, 0.9, 9, { comportamento: 'pula', altura: 18 }),
  caranguejo: bicho('caranguejo', 26, 32, 9, 3, 1.3, 9, { altura: 18 }),
  'enguia-eletrica': bicho('enguia-eletrica', 24, 48, 11, 3, 0.8, 8, { altura: 18 }),
  'tartaruga-mordedora': bicho('tartaruga-mordedora', 46, 24, 10, 4, 2.2, 11, { altura: 20 }),
  'enxame-mosquitos': bicho('enxame-mosquitos', 8, 66, 5, 1, 0.4, 6, { altura: 14 }),
  tubarao: bicho('tubarao', 40, 50, 13, 4, 1.6, 12, { altura: 22 }),
  'agua-viva': bicho('agua-viva', 22, 30, 10, 3, 0.7, 10, { altura: 20 }),
  polvo: bicho('polvo', 48, 34, 12, 4, 1.8, 12, { altura: 22 }),
  'bagre-gigante': bicho('bagre-gigante', 1000, 34, 16, 20, 8, 18, { chefe: true, altura: 56 }),
  'jacare-rei': bicho('jacare-rei', 1450, 38, 18, 24, 10, 13, { chefe: true, altura: 56 }),
  'lula-gigante': bicho('lula-gigante', 2000, 36, 20, 28, 12, 13, { chefe: true, altura: 72 }),
  'peixe-lendario-dourado': bicho('peixe-lendario', 1700, 48, 18, 40, 6, 15, { chefe: true, lendario: true, altura: 48 }),
}

const peixe = (id, nome, agua) => ({ id, nome, agua })
const peixes = [
  ...['lambari', 'traira', 'dourado-do-rio', 'pintado', 'pacu', 'piaba', 'cascudo', 'mandi', 'piau', 'curimba'].map((id, i) => peixe(id, ['Lambari', 'Traíra', 'Dourado do rio', 'Pintado', 'Pacu', 'Piaba', 'Cascudo', 'Mandi', 'Piau', 'Curimba'][i], 'rio')),
  ...['tilapia', 'tucunare', 'cara', 'traira-da-lagoa', 'tambaqui', 'pirarucu-pequeno', 'acara', 'bagrinho', 'mussum', 'jeju'].map((id, i) => peixe(id, ['Tilápia', 'Tucunaré', 'Cará', 'Traíra da lagoa', 'Tambaqui', 'Pirarucu pequeno', 'Acará', 'Bagrinho', 'Mussum', 'Jejú'][i], 'lago')),
  ...['sardinha', 'robalo', 'tainha', 'garoupa', 'badejo', 'corvina', 'pargo', 'dourado-do-mar', 'anchova', 'linguado'].map((id, i) => peixe(id, ['Sardinha', 'Robalo', 'Tainha', 'Garoupa', 'Badejo', 'Corvina', 'Pargo', 'Dourado do mar', 'Anchova', 'Linguado'][i], 'mar')),
]

const PERIGOS = [
  { id: 'nevoeiro', em: 8, aviso: 2.5, dura: 4, dano: 0 },
  { id: 'onda-gigante', em: 16, aviso: 2, dura: 2.6, dano: 0 },
  { id: 'tempestade', em: 26, aviso: 3, dura: 4.2, dano: 0 },
]

const aguaDe = {
  rio: { biomas: ['rio'], horda: ['piranha', 'sapo-pulador', 'caranguejo'], bando: 'piranha', chao: { rio: 'rio-agua' } },
  lago: { biomas: ['lago'], horda: ['enguia-eletrica', 'tartaruga-mordedora', 'enxame-mosquitos'], bando: 'enxame-mosquitos', chao: { lago: 'lago-agua' } },
  mar: { biomas: ['mar'], horda: ['tubarao', 'agua-viva', 'polvo'], bando: 'agua-viva', chao: { mar: 'mar-agua' } },
}

function fase(ordem, regiao, tipo, x, y, extra) {
  const base = aguaDe[regiao] || aguaDe.mar
  return no(ordem, regiao, tipo, x, y, {
    agua: regiao === 'fim' ? 'mar' : regiao,
    biomas: base.biomas,
    horda: extra.horda || base.horda,
    bando: extra.bando || base.bando,
    chefe: extra.chefe || null,
    duracao: extra.duracao ?? DURACAO_FASE,
    chefeEm: extra.chefeEm ?? EVENTOS.chefe,
    chao: base.chao,
    perigos: tipo === 'fim' ? [] : PERIGOS,
  })
}

const itens = ITENS_COMUNS.map((it) => ({
  ...it,
  icone: it.id === 'bota' ? 'icone-anzol' : it.id === 'ima' ? 'figurinha' : it.id === 'coracao' ? 'coracao' : it.icone === 'icone-vida' ? 'coracao' : it.icone === 'icone-lasca' ? 'icone-anzol' : it.icone === 'icone-faisca' ? 'icone-bolhas' : it.icone === 'icone-lanca' ? 'icone-rede' : it.icone === 'icone-fogueira-carta' ? 'icone-album' : 'icone-rede',
}))

export const conteudoPescador = {
  slug: 'pescador-samuel',
  api: '__pescador',
  titulo: 'Pescador Samuel',
  pesca: true,
  inicial: 'arpao',
  heroi: 'samuel-barco-cinza',
  heroiParado: 'samuel-no-barco',
  heroiAnda: 'samuel-no-barco',
  heroiAltura: 48,
  marcador: 'marcador-barco',
  vida: 'coracao',
  vidaVazia: 'coracao-vazio',
  gema: ['figurinha', 'figurinha', 'cardume'],
  fimTitulo: 'O porto guardou o troféu.',
  fimTexto: 'O peixe lendário está no álbum da viagem.',
  fimSprite: 'porto-trofeu',
  controles: {
    base: 'joystick-base', bola: 'joystick-bola', acao: 'botao-acao', pausa: 'botao-pausa',
    tela: 'botao-tela-cheia', sair: 'botao-sair-tela-cheia', proxima: 'botao-proxima', repetir: 'botao-repetir',
  },
  mapa: { w: 344, h: 256 },
  golpes,
  itens,
  inimigos,
  peixes,
  chefeDaRegiao: { rio: 'bagre-gigante', lago: 'jacare-rei', mar: 'lula-gigante' },
  fases: [
    fase(1, 'rio', 'fase', 28, 150, {}),
    fase(2, 'rio', 'fase', 62, 84, { horda: ['sapo-pulador', 'piranha', 'caranguejo'] }),
    fase(3, 'rio', 'chefe', 98, 150, { chefe: 'bagre-gigante' }),
    fase(4, 'lago', 'fase', 134, 96, {}),
    fase(5, 'lago', 'fase', 162, 186, { horda: ['tartaruga-mordedora', 'enguia-eletrica', 'enxame-mosquitos'] }),
    fase(6, 'lago', 'chefe', 196, 96, { chefe: 'jacare-rei' }),
    fase(7, 'mar', 'fase', 232, 166, {}),
    fase(8, 'mar', 'fase', 258, 86, { horda: ['polvo', 'tubarao', 'agua-viva'] }),
    fase(9, 'mar', 'chefe', 290, 146, { chefe: 'lula-gigante' }),
    fase(10, 'mar', 'lendario', 322, 70, { chefe: 'peixe-lendario-dourado', horda: ['tubarao', 'agua-viva'] }),
    fase(11, 'fim', 'fim', 318, 226, { duracao: 0 }),
  ],
  nos: {
    rio: { aberta: 'no-aberta', travada: 'no-travada', vencida: 'no-vencida' },
    lago: { aberta: 'no-aberta', travada: 'no-travada', vencida: 'no-vencida' },
    mar: { aberta: 'no-aberta', travada: 'no-travada', vencida: 'no-vencida' },
    fim: { aberta: 'porto', travada: 'porto', vencida: 'porto-trofeu' },
  },
  noEspecial: {
    3: { aberta: 'no-chefe-bagre-gigante-aberta', travada: 'no-chefe-bagre-gigante-travada', vencida: 'no-chefe-bagre-gigante-vencida' },
    6: { aberta: 'no-chefe-jacare-rei-aberta', travada: 'no-chefe-jacare-rei-travada', vencida: 'no-chefe-jacare-rei-vencida' },
    9: { aberta: 'no-chefe-lula-gigante-aberta', travada: 'no-chefe-lula-gigante-travada', vencida: 'no-chefe-lula-gigante-vencida' },
    10: { aberta: 'no-lendario-aberta', travada: 'no-lendario-travada', vencida: 'no-lendario-vencida' },
    11: { aberta: 'porto', travada: 'porto', vencida: 'porto-trofeu' },
  },
  cores: { rio: '#3FA8A6', margem: '#C4D48A', lago: '#2B7F78', taboa: '#7EA24A', mar: '#1B5A6E', areia: '#E4D2A0' },
  config: {
    proposta: true,
    duracaoFase: DURACAO_FASE,
    curva: [1.4, 2.2, 3],
    teto: [28, 18, 22],
    anel: 'hypot/2+12',
    velocidade: 68,
    facil: 'piso 1, cura, monstros mais lentos, sem perder',
    album: 30,
  },
}

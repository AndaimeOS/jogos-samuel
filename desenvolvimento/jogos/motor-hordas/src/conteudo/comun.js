/** Atalhos das cartas. Os números são proposta e ficam no CONFIG de cada jogo. */

export function bifurca(a, b, c, d) {
  return {
    4: [
      { nome: a.nome, texto: a.texto, mod: a.mod },
      { nome: b.nome, texto: b.texto, mod: b.mod },
    ],
    7: [
      { nome: c.nome, texto: c.texto, mod: c.mod },
      { nome: d.nome, texto: d.texto, mod: d.mod },
    ],
  }
}

export const ITENS_COMUNS = [
  { id: 'bota', nome: 'Bota leve', texto: 'O passo fica mais rápido.', icone: 'icone-vida', soma: { speed: 8 } },
  { id: 'ima', nome: 'Ímã', texto: 'A experiência vem de mais longe.', icone: 'xp-2', soma: { magnet: 22 } },
  { id: 'escudo', nome: 'Escudo', texto: 'Os tombos doem menos.', icone: 'icone-vida', soma: { armor: 0.08 } },
  { id: 'coracao', nome: 'Coração', texto: 'Cabe mais vida.', icone: 'icone-vida', soma: { hpMax: 18 } },
  { id: 'amuleto', nome: 'Amuleto', texto: 'Os golpes batem mais forte.', icone: 'icone-lasca', soma: { might: 0.12 } },
  { id: 'relogio', nome: 'Relógio', texto: 'Os golpes voltam mais cedo.', icone: 'icone-faisca', multiplica: { cooldown: 0.9 } },
  { id: 'mochila', nome: 'Mochila', texto: 'A área dos golpes cresce.', icone: 'icone-lanca', soma: { area: 0.12 } },
  { id: 'broche', nome: 'Broche', texto: 'A vida volta sozinha, devagar.', icone: 'icone-fogueira-carta', soma: { regen: 0.35 } },
  { id: 'anel', nome: 'Anel', texto: 'Solta mais um projétil.', icone: 'lasca', soma: { amount: 1 } },
  { id: 'capa', nome: 'Capa', texto: 'Os golpes duram mais.', icone: 'icone-lanca', soma: { duration: 0.15 } },
]

export function no(ordem, regiao, tipo, x, y, extra) {
  return { ordem, regiao, tipo, x, y, ...extra }
}

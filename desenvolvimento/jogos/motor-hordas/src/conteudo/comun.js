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
  { id: 'bota', nome: 'Bota leve', texto: 'O passo fica mais rápido.', icone: 'carta-bota', soma: { speed: 8 } },
  { id: 'ima', nome: 'Ímã', texto: 'A experiência vem de mais longe.', icone: 'carta-ima', soma: { magnet: 22 } },
  { id: 'escudo', nome: 'Escudo', texto: 'Os tombos doem menos.', icone: 'carta-escudo', soma: { armor: 0.08 } },
  { id: 'coracao', nome: 'Coração', texto: 'Cabe mais vida.', icone: 'carta-coracao', soma: { hpMax: 18 } },
  { id: 'amuleto', nome: 'Amuleto', texto: 'Os golpes batem mais forte.', icone: 'carta-amuleto', soma: { might: 0.12 } },
  { id: 'relogio', nome: 'Relógio', texto: 'Os golpes voltam mais cedo.', icone: 'carta-relogio', multiplica: { cooldown: 0.9 } },
  { id: 'mochila', nome: 'Mochila', texto: 'A área dos golpes cresce.', icone: 'carta-mochila', soma: { area: 0.12 } },
  { id: 'broche', nome: 'Broche', texto: 'A vida volta sozinha, devagar.', icone: 'carta-broche', soma: { regen: 0.35 } },
  { id: 'anel', nome: 'Anel', texto: 'Solta mais um projétil.', icone: 'carta-anel', soma: { amount: 1 } },
  { id: 'capa', nome: 'Capa', texto: 'Os golpes duram mais.', icone: 'carta-capa', soma: { duration: 0.15 } },
]

export function no(ordem, regiao, tipo, x, y, extra) {
  return { ordem, regiao, tipo, x, y, ...extra }
}

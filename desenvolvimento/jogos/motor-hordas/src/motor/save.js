/** Save da era. O schema 2 (mapa, álbum, modo) continua válido; a era entra como campo opcional. */
export const SCHEMA_SAVE = 3

export function saveVazio() {
  return {
    schemaVersion: SCHEMA_SAVE,
    modo: 'facil',
    aberta: 1,
    vencidas: [],
    album: [],
    barcoDourado: false,
    era: null,
  }
}

function inteiro(valor, minimo, fallback) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return fallback
  return Math.max(minimo, Math.round(n))
}

export function migrarEra(era) {
  if (!era || typeof era !== 'object' || typeof era.regiao !== 'string' || !era.regiao) return null
  if (!Array.isArray(era.golpes)) return null
  const golpes = []
  for (const g of era.golpes) {
    if (!g || typeof g.id !== 'string' || !g.id) continue
    golpes.push({
      id: g.id,
      nivel: inteiro(g.nivel, 1, 1),
      caminho: inteiro(g.caminho, 0, 0),
    })
  }
  if (!golpes.length) return null
  const itens = []
  for (const it of Array.isArray(era.itens) ? era.itens : []) {
    if (!it || typeof it.id !== 'string' || !it.id) continue
    itens.push({ id: it.id, nivel: inteiro(it.nivel, 1, 1) })
  }
  const xp = Number(era.xp)
  return {
    regiao: era.regiao,
    nivel: inteiro(era.nivel, 1, 1),
    xp: Number.isFinite(xp) ? Math.max(0, xp) : 0,
    golpes,
    itens,
    pendentes: inteiro(era.pendentes, 0, 0),
  }
}

export function migrarSave(bruto) {
  if (!bruto || typeof bruto !== 'object') return saveVazio()
  const versao = bruto.schemaVersion
  if (versao != null && versao !== 2 && versao !== 3) return saveVazio()
  if (versao == null && bruto.aberta == null && bruto.vencidas == null && bruto.modo == null) return saveVazio()
  const vencidas = Array.isArray(bruto.vencidas)
    ? bruto.vencidas.filter((n) => Number.isInteger(n) && n > 0)
    : []
  const album = Array.isArray(bruto.album)
    ? bruto.album.filter((id) => typeof id === 'string' && id)
    : []
  return {
    schemaVersion: SCHEMA_SAVE,
    modo: bruto.modo === 'normal' ? 'normal' : 'facil',
    aberta: inteiro(bruto.aberta, 1, 1),
    vencidas,
    album,
    barcoDourado: !!bruto.barcoDourado,
    era: migrarEra(bruto.era),
  }
}

/** A era só continua na mesma região. Save antigo, outra era e a fase final começam do zero. */
export function progressoParaFase(save, fase) {
  if (!save || !save.era || !fase || fase.tipo === 'fim') return null
  if (save.era.regiao !== fase.regiao) return null
  return save.era
}

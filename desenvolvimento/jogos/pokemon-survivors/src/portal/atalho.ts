import { gainXp } from '../game/leveling'
import { spawnWaveBoss } from '../game/spawner'
import type { Game } from '../game/types'

/**
 * Atalhos só para capturas e testes manuais (`?samuel=cartas` ou `?samuel=chefe`).
 * Sem o parâmetro, a partida segue exatamente as regras do jogo.
 */
export const aplicarAtalhoSamuel = (g: Game) => {
  const modo = new URLSearchParams(location.search).get('samuel')
  if (modo === 'cartas') gainXp(g, 800)
  if (modo === 'chefe') spawnWaveBoss(g, 'onix', g.time)
}

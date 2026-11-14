/**
 * Substitui `src/analytics.ts` só no pacote publicado.
 * O portal não pode levar rastreador (a palavra do serviço e os endereços dele).
 * As funções existem para o jogo continuar igual, sem enviar nada.
 */

export type RunPerf = Record<string, unknown>
export type Opened = string
export type QueueEnd = { result: string }
export type ErrorContext = Record<string, string | number | boolean | null>

export const track = (...args: unknown[]) => {
  void args
}

export const lobbyPress = (...args: unknown[]) => {
  void args
}

export const takeOpened = () => [] as string[]

export const recordReplay = (...args: unknown[]) => {
  void args
}

export const identify = (...args: unknown[]) => {
  void args
}

export const isOwnError = (...args: unknown[]) => {
  void args
  return false
}

export const isStaleChunk = (...args: unknown[]) => {
  void args
  return false
}

export const isExpectedFailure = (...args: unknown[]) => {
  void args
  return false
}

export const startAnalytics = (...args: unknown[]) => {
  void args
}

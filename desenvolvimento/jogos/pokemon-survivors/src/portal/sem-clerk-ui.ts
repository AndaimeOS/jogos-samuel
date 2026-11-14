export const loadClerkUIScript = (...args: unknown[]): Promise<never> => {
  void args
  return Promise.reject(new Error('contas desligadas neste portal'))
}

/** Contas ficam desligadas no portal (não há chave nem API). O botão de entrar nem aparece. */
export class Clerk {
  constructor(_key: string) {
    void _key
  }

  user: null = null

  load(): Promise<void> {
    return Promise.resolve()
  }
}

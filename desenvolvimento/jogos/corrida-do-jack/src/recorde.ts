// Recorde por perfil e modo no localStorage (chave versionada). Se o armazenamento falhar, o jogo segue sem recorde.
import type { Modo } from './core/regras';

export function perfilLocal(busca = location.search): string {
  const p = new URLSearchParams(busca).get('perfil');
  return p && /^[a-z0-9-]{1,24}$/.test(p) ? p : 'convidado';
}

export class Recorde {
  private chave = `samuel:corrida-do-jack:${perfilLocal()}:v1`;
  private dados: Record<Modo, number> = { ajuda: 0, desafio: 0 };

  constructor() {
    try {
      const bruto = JSON.parse(localStorage.getItem(this.chave) ?? '{}');
      for (const m of ['ajuda', 'desafio'] as Modo[]) if (Number.isInteger(bruto[m]) && bruto[m] > 0) this.dados[m] = bruto[m];
    } catch { /* sem armazenamento ou dado estranho: começa do zero */ }
  }
  melhor(m: Modo) { return this.dados[m]; }
  /** Grava se for recorde; devolve true quando bateu. */
  registrar(m: Modo, pontos: number) {
    if (pontos <= this.dados[m]) return false;
    this.dados[m] = pontos;
    try { localStorage.setItem(this.chave, JSON.stringify(this.dados)); } catch { /* segue sem gravar */ }
    return true;
  }
}

export interface Recorde {
  schemaVersion: 1;
  moedas: number;
  pontos: number;
  distancia: number;
}

export const CHAVE_RECORDE = 'samuel-surfers:recorde';

const VAZIO: Recorde = { schemaVersion: 1, moedas: 0, pontos: 0, distancia: 0 };

function numero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0;
}

export function lerRecorde(ler: (chave: string) => string | null): Recorde {
  try {
    const bruto = ler(CHAVE_RECORDE);
    if (!bruto) return { ...VAZIO };
    const json = JSON.parse(bruto) as Partial<Recorde>;
    if (json.schemaVersion !== 1) return { ...VAZIO };
    return {
      schemaVersion: 1,
      moedas: numero(json.moedas),
      pontos: numero(json.pontos),
      distancia: numero(json.distancia),
    };
  } catch {
    return { ...VAZIO };
  }
}

export function gravarRecorde(
  arm: { ler(chave: string): string | null; gravar(chave: string, valor: string): void },
  agora: { moedas: number; pontos: number; distancia: number },
): Recorde {
  const anterior = lerRecorde((chave) => arm.ler(chave));
  const melhor: Recorde = {
    schemaVersion: 1,
    moedas: Math.max(anterior.moedas, Math.floor(agora.moedas)),
    pontos: Math.max(anterior.pontos, Math.floor(agora.pontos)),
    distancia: Math.max(anterior.distancia, Math.floor(agora.distancia)),
  };
  try {
    arm.gravar(CHAVE_RECORDE, JSON.stringify(melhor));
  } catch {
    return melhor;
  }
  return melhor;
}

import { Cena } from './cena';
import { CONFIG } from './config';
import { CHAVE_ESTILO, ESTILOS, UI, type Estilo } from './contrato-arte';
import { Entrada } from './entrada';
import { Audio } from './audio';
import { gravarRecorde, lerRecorde, type Recorde } from './recorde';
import { Sessao } from './sessao';
import type { Gesto, Modo } from './tipos';

type Estado = 'menu' | 'correndo' | 'pausa' | 'fim';

const CHAVE_TUTORIAL = 'samuel-surfers:tutorial';
const CHAVE_MODO = 'samuel-surfers:modo';

function ler(chave: string): string | null {
  try { return localStorage.getItem(chave); } catch { return null; }
}
function gravar(chave: string, valor: string): void {
  try { localStorage.setItem(chave, valor); } catch { /* segue sem gravar */ }
}

function estiloGuardado(): Estilo {
  const valor = ler(CHAVE_ESTILO);
  return valor === 'pixel' || valor === 'blocos' ? valor : 'blocos';
}

export function pedirTela(alvo: HTMLElement): 'api' | 'fallback' {
  const el = alvo as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
  };
  const pedir = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
  if (typeof pedir !== 'function') {
    document.body.classList.toggle('tela-fallback');
    return 'fallback';
  }
  try {
    const resultado = pedir.call(el);
    if (resultado && typeof (resultado as Promise<void>).catch === 'function') {
      (resultado as Promise<void>).catch(() => document.body.classList.add('tela-fallback'));
    }
    return 'api';
  } catch {
    document.body.classList.add('tela-fallback');
    return 'fallback';
  }
}

export class Jogo {
  private readonly cena: Cena;
  private readonly audio = new Audio();
  private sessao: Sessao | null = null;
  private estado: Estado = 'menu';
  private modo: Modo = ler(CHAVE_MODO) === 'normal' ? 'normal' : 'facil';
  private estilo: Estilo = estiloGuardado();
  private anterior = performance.now();
  private acumulador = 0;
  private vista = 0;
  private avisoTimer = 0;
  private tutorialTimer = 0;
  private viuFaixa = false;
  private viuPulo = false;
  private viuRolar = false;
  private recorde: Recorde = { schemaVersion: 1, moedas: 0, pontos: 0, distancia: 0 };
  private pronto = false;

  constructor(private raiz: HTMLElement) {
    document.documentElement.style.setProperty('--acao', UI.botaoAcao + 'px');
    document.documentElement.style.setProperty('--miudo', UI.botaoMiudo + 'px');
    document.documentElement.style.setProperty('--jogar', UI.botaoJogar + 'px');
    this.cena = new Cena(this.q('#cena'));
    new Entrada(this.q('#cena'), (gesto) => this.gesto(gesto));
    this.ligar();
    this.recorde = lerRecorde(ler);
    this.marcar();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.estado === 'correndo') this.pausar();
    });
    if (!this.cena.ok) {
      this.q('#carregando').hidden = true;
      this.q('#semWebgl').hidden = false;
      this.publicar();
      return;
    }
    void this.cena.usar(this.estilo).then(() => {
      this.pronto = true;
      this.q('#carregando').hidden = true;
      this.mostrar('menu');
      this.publicar();
      requestAnimationFrame(this.loop);
    }).catch(() => {
      this.q('#carregando').hidden = true;
      this.q('#semWebgl').hidden = false;
      this.publicar();
    });
  }

  private q<T extends HTMLElement>(seletor: string): T {
    const el = this.raiz.querySelector<T>(seletor);
    if (!el) throw new Error(seletor);
    return el;
  }

  private ligar(): void {
    this.q('#bJogar').addEventListener('click', () => this.comecar());
    this.q('#bFacil').addEventListener('click', () => this.definirModo('facil'));
    this.q('#bNormal').addEventListener('click', () => this.definirModo('normal'));
    this.q('#bPixel').addEventListener('click', () => void this.definirEstilo('pixel'));
    this.q('#bBlocos').addEventListener('click', () => void this.definirEstilo('blocos'));
    this.q('#bPausa').addEventListener('click', () => this.pausar());
    this.q('#bContinuarPausa').addEventListener('click', () => this.retomar());
    this.q('#bEncerrar').addEventListener('click', () => this.encerrar(false));
    this.q('#bDeNovo').addEventListener('click', () => this.comecar());
    this.q('#bContinuar').addEventListener('click', () => this.continuar());
    for (const id of ['#bTela', '#bTelaMenu', '#bTelaPausa', '#bTelaFim']) {
      this.q(id).addEventListener('click', () => pedirTela(this.raiz));
    }
    for (const id of ['#bSom', '#bSomMenu']) this.q(id).addEventListener('click', () => this.som());
    this.q('#bEsquerda').addEventListener('click', () => this.gesto('esquerda'));
    this.q('#bDireita').addEventListener('click', () => this.gesto('direita'));
    this.q('#bPular').addEventListener('click', () => this.gesto('pular'));
    this.q('#bRolar').addEventListener('click', () => this.gesto('rolar'));
  }

  private definirModo(modo: Modo): void {
    this.modo = modo;
    gravar(CHAVE_MODO, modo);
    this.marcar();
    this.audio.efeito('ui');
  }

  private async definirEstilo(estilo: Estilo): Promise<void> {
    if (!ESTILOS.includes(estilo) || this.estado !== 'menu' || !this.cena.ok) return;
    this.estilo = estilo;
    gravar(CHAVE_ESTILO, estilo);
    this.marcar();
    this.q('#carregando').hidden = false;
    await this.cena.usar(estilo);
    this.q('#carregando').hidden = true;
    this.audio.efeito('ui');
  }

  private som(): void {
    const ligado = this.audio.alternar();
    for (const id of ['#bSom', '#bSomMenu']) this.q(id).setAttribute('aria-label', ligado ? 'Som ligado' : 'Som desligado');
    if (ligado) this.audio.tocar(this.estado === 'correndo' ? 'corrida' : 'menu');
  }

  private comecar(): void {
    if (!this.cena.ok) return;
    this.sessao = new Sessao({
      som: (nome) => this.audio.efeito(nome),
      aviso: (texto) => this.aviso(texto),
      fim: () => { if (this.estado === 'correndo') this.encerrar(true); },
      particulas: (faixa, z) => this.cena.particulas(faixa, z),
    }, { modo: this.modo });
    this.vista = 0;
    this.acumulador = 0;
    this.viuFaixa = this.viuPulo = this.viuRolar = false;
    this.audio.tocar('corrida');
    this.mostrar('correndo');
    const primeira = ler(CHAVE_TUTORIAL) !== '1';
    this.q('#tutorial').hidden = !primeira;
    window.clearTimeout(this.tutorialTimer);
    if (primeira) this.tutorialTimer = window.setTimeout(() => this.fecharTutorial(), 12000);
  }

  private pausar(): void {
    if (this.estado !== 'correndo') return;
    this.audio.parar();
    this.mostrar('pausa');
  }

  private retomar(): void {
    if (this.estado !== 'pausa') return;
    this.audio.tocar('corrida');
    this.mostrar('correndo');
  }

  private continuar(): void {
    if (!this.sessao?.continuar()) return;
    this.audio.tocar('corrida');
    this.mostrar('correndo');
  }

  private encerrar(batida: boolean): void {
    if (!this.sessao || this.estado === 'fim') return;
    const foto = this.sessao.foto();
    const antes = this.recorde.moedas;
    this.recorde = gravarRecorde({ ler, gravar }, foto);
    this.q('#tituloFim').textContent = batida ? 'FIM DA CORRIDA' : 'CORRIDA ENCERRADA';
    this.q('#moedasFim').textContent = foto.moedas + ' moedas';
    this.q('#metrosFim').textContent = foto.distancia + ' m';
    this.q('#recordeFim').textContent = 'Recorde: ' + this.recorde.moedas + ' moedas' + (foto.moedas > antes ? ' — novo!' : '');
    this.q('#bContinuar').hidden = !foto.podeContinuar;
    this.audio.parar();
    this.mostrar('fim');
  }

  private gesto(gesto: Gesto): void {
    if (gesto === 'pausa') {
      if (this.estado === 'correndo') this.pausar();
      else if (this.estado === 'pausa') this.retomar();
      return;
    }
    if (this.estado !== 'correndo' || !this.sessao) return;
    this.sessao.acao(gesto);
    if (gesto === 'esquerda' || gesto === 'direita') this.viuFaixa = true;
    if (gesto === 'pular') this.viuPulo = true;
    if (gesto === 'rolar') this.viuRolar = true;
    if (this.viuFaixa && this.viuPulo && this.viuRolar) this.fecharTutorial();
  }

  private fecharTutorial(): void {
    this.q('#tutorial').hidden = true;
    gravar(CHAVE_TUTORIAL, '1');
  }

  private aviso(texto: string): void {
    const el = this.q('#aviso');
    el.textContent = texto;
    el.hidden = false;
    window.clearTimeout(this.avisoTimer);
    this.avisoTimer = window.setTimeout(() => { el.hidden = true; }, 1400);
  }

  private marcar(): void {
    this.q('#bFacil').setAttribute('aria-pressed', String(this.modo === 'facil'));
    this.q('#bNormal').setAttribute('aria-pressed', String(this.modo === 'normal'));
    this.q('#bPixel').setAttribute('aria-pressed', String(this.estilo === 'pixel'));
    this.q('#bBlocos').setAttribute('aria-pressed', String(this.estilo === 'blocos'));
    this.q('#recordeMenu').textContent = this.recorde.moedas > 0 ? 'Recorde: ' + this.recorde.moedas + ' moedas' : 'Recorde: ainda não';
  }

  private mostrar(estado: Estado): void {
    this.estado = estado;
    this.q('#tMenu').hidden = estado !== 'menu';
    this.q('#hud').hidden = estado !== 'correndo';
    this.q('#tPausa').hidden = estado !== 'pausa';
    this.q('#tFim').hidden = estado !== 'fim';
    if (estado !== 'correndo') this.q('#tutorial').hidden = true;
    this.marcar();
  }

  private hud(): void {
    const foto = this.sessao?.foto();
    if (!foto) return;
    this.q('#moedas').textContent = String(foto.moedas);
    this.q('#metros').textContent = foto.distancia + ' m';
    this.q('#missao').textContent = Math.min(foto.moedas, CONFIG.missaoMoedas) + '/' + CONFIG.missaoMoedas;
  }

  private loop = (agora: number): void => {
    const dt = Math.min(0.05, (agora - this.anterior) / 1000);
    this.anterior = agora;
    if (this.estado === 'correndo' && this.sessao && !this.sessao.acabou) {
      this.acumulador += dt;
      while (this.acumulador >= CONFIG.passo) {
        this.sessao.atualizar(CONFIG.passo);
        this.acumulador -= CONFIG.passo;
      }
      this.hud();
    }
    const metros = this.sessao?.metros ?? 0;
    const delta = this.estado === 'correndo' ? Math.max(0, metros - this.vista) : 0;
    this.vista = metros;
    this.cena.desenhar(this.estado === 'menu' ? null : this.sessao?.foto() ?? null, this.sessao?.entidades ?? [], delta, dt);
    requestAnimationFrame(this.loop);
  };

  private publicar(): void {
    const jogo = this;
    window.__surfers = {
      pronto: true,
      resumo: () => {
        const foto = jogo.sessao?.foto();
        return {
          estado: jogo.estado,
          modo: jogo.modo,
          estilo: jogo.estilo,
          webgl: jogo.cena.ok,
          arquivos: jogo.cena.arquivos,
          chamadas: jogo.cena.chamadas,
          triangulos: jogo.cena.triangulos,
          pixelRatio: jogo.cena.renderer?.getPixelRatio() ?? 0,
          sombras: jogo.cena.renderer?.shadowMap.enabled ?? false,
          faixa: foto?.faixa ?? 0,
          moedas: foto?.moedas ?? 0,
          pontos: foto?.pontos ?? 0,
          distancia: foto?.distancia ?? 0,
          pulando: foto?.pulando ?? false,
          rolando: foto?.rolando ?? false,
          pulos: foto?.pulos ?? 0,
          rolos: foto?.rolos ?? 0,
          tropecos: foto?.tropecos ?? 0,
          tropecando: foto?.tropecando ?? false,
          acabou: foto?.acabou ?? false,
          tutorial: !jogo.q('#tutorial').hidden,
          pronto: jogo.pronto,
          recorde: jogo.recorde.moedas,
          faixaMundo: CONFIG.faixa,
          alturaSamuel: CONFIG.samuelAltura,
        };
      },
    };
  }
}

declare global {
  interface Window {
    __surfers?: {
      pronto: boolean;
      resumo: () => Record<string, unknown>;
    };
  }
}

"""Controles de toque, HUD (corações, moedas e dígitos), efeitos, mapa de 3 fases e 'Fase vencida' do Samuel Corredor.
Botões no MESMO estilo do Pescador (função botao() de pescador-samuel/estilo/_src/controles_mapa.py, reaproveitada).
Tamanhos pensados para a base de 240 px de altura (ver PROPOSTA_TECNICA.md: pior caso 3 pt por px de arte -> 44 pt = 15 px)."""
import sys, numpy as np
sys.path.insert(0,'/workspace/arte/pescador-samuel/estilo/_src')
import controles_mapa as K, samuel2
from paleta_corredor import i as I
from base_c import P, cola, vazio, contornar, fechar, tira
import pecas, samuel_lado as SL
import base as _bp   # P do Pescador (mesmos índices)
def _ic_seta_dir(p,ox,oy,ap):
    w=p.w;c=w//2;q=_bp.P(w,w)
    q.r((c-9,c-4,c,c+2),'branco');q.p([(c,c-10),(c+9,c-1),(c,c+8)],'branco')
    p.cola(_bp.contornar(q.arr()),ox,oy)
def _ic_seta_esq(p,ox,oy,ap):
    w=p.w;c=w//2;q=_bp.P(w,w)
    q.r((c-1,c-4,c+8,c+2),'branco');q.p([(c-1,c-10),(c-10,c-1),(c-1,c+8)],'branco')
    p.cola(_bp.contornar(q.arr()),ox,oy)
def _ic_pular(p,ox,oy,ap):
    w=p.w;c=w//2;q=_bp.P(w,w)
    q.p([(c-10,c+1),(c,c-10),(c+10,c+1),(c+5,c+1),(c+5,c+7),(c-5,c+7),(c-5,c+1)],'branco')
    p.cola(_bp.contornar(q.arr()),ox,oy)
    p.l([(c-6,c+11),(c-3,c+11)],'laranja_luz');p.l([(c+3,c+11),(c+6,c+11)],'laranja_luz')   # risquinhos de impulso
BOTOES={ # nome: (tamanho, cor, ícone)
 'esquerda':(32,'papel',_ic_seta_esq),'direita':(32,'papel',_ic_seta_dir),'pular':(40,'laranja',_ic_pular),
 'pausa':(24,'papel',K.ic_pausa),'tela-cheia':(24,'papel',K.ic_tela_cheia),'sair-tela-cheia':(24,'papel',K.ic_sair_tela_cheia),
 'proxima':(40,'verde',K.ic_seta),'repetir':(24,'lilas',K.ic_repetir)}
def botao(nome,apertado=False):
    t,c,ic=BOTOES[nome];return K.botao(t,c,ic,apertado)
# ---------------------------------------------------------------- HUD
def coracao(cheio=True):
    p=P(14,13);cor,luz=('rosa','rosa_luz') if cheio else ('papel_sombra','papel')
    p.p([(6,12),(0,6),(0,2),(2,0),(4,0),(6,2),(7,2),(9,0),(11,0),(13,2),(13,6),(7,12)],cor,'tinta')
    p.r((2,2,3,3),luz);p.dot(11,4,'rosa_sombra' if cheio else 'pedra_sombra')
    return p.arr()
DIG={'0':["111","101","101","101","111"],'1':["010","110","010","010","111"],'2':["111","001","111","100","111"],'3':["111","001","111","001","111"],
     '4':["101","101","111","001","001"],'5':["111","100","111","001","111"],'6':["111","100","111","101","111"],'7':["111","001","010","010","010"],
     '8':["111","101","111","101","111"],'9':["111","101","111","001","111"]}
def digito(ch,cor='branco'):
    """fonte pixel nossa, só dígitos: 3x5 desenhado em 2x (6x10) + contorno = 8x12 por dígito."""
    g=np.array([[c=='1' for c in r] for r in DIG[ch]]);g=np.kron(g,np.ones((2,2),bool))
    a=vazio(8,12);a[1:11,1:7][g]=I(cor);return contornar(a)
def numero(txt,cor='branco'):
    return tira([digito(c,cor) for c in txt],gap=0)[:, :]
def hud_moedas(n='12'):
    m=pecas.MOEDA[0];num=numero(n);w=16+2+num.shape[1]+6;p=P(w,18)
    p.r((0,1,w-1,17),'petroleo_fundo','tinta');p.l([(1,2),(w-2,2)],'petroleo')
    a=cola(p.arr(),m,2,1);a=cola(a,num,19,4);a[0,:]=-1;a[0,1:w-1]=-1
    return a
def hud_coracoes(cheios=3,total=3):
    return tira([coracao(k<cheios) for k in range(total)],gap=2)
# ---------------------------------------------------------------- efeitos
def poeira(f):
    p=P(10,8);r=[2,3,2][f];c=['papel','papel_sombra','papel_sombra'][f]
    p.e((5-r,7-2*r,5+r,7),c,'tinta')
    if f>0: p.e((0,5,2,7),c,'tinta')
    return p.arr()
def pof(f):
    """pisou no inimigo: nuvenzinha de 'pof' com estrelinhas (sem sangue)."""
    p=P(24,24)
    if f<2:
        r=[5,8][f]
        for dx,dy,rr in ((-r*0.6,1,r*0.6),(r*0.6,1,r*0.6),(0,-r*0.4,r*0.7)): p.e((12+dx-rr,14+dy-rr,12+dx+rr,14+dy+rr),'branco',None)
        a=contornar(p.arr());p.set(a)
    for k,(x,y) in enumerate([(3,5),(20,4),(21,17),(2,18)][:[2,4,4][f]]):
        c='amarelo' if k%2==0 else 'lilas_luz';y=y-(f*2)
        for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1)): p.dot(x+dx,y+dy,c)
        p.dot(x,y,'branco')
    return p.arr()
def brilho_moeda(f):
    p=P(9,9);r=[1,3,4][f]
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        for k in range(1,r+1): p.dot(4+dx*k,4+dy*k,'amarelo_luz' if k<r else 'amarelo')
    p.dot(4,4,'branco');return p.arr()
EFEITOS={'poeira':[poeira(k) for k in range(3)],'pof':[pof(k) for k in range(3)],'brilho':[brilho_moeda(k) for k in range(3)]}
# ---------------------------------------------------------------- mapa de 3 fases e Fase vencida
def no(estado,fase):
    """nó de fase = laje redonda do Planeta (mesma peça do mapa dos outros jogos) com enfeite da fase."""
    a=K.no_fase('planeta',estado)[:, :32]
    return a
def marcador():
    """Samuel de frente (aprovado) parado em cima do nó."""
    return samuel2.grade('frente')
def painel(w,h):
    p=P(w,h);p.r((0,2,w-1,h-1),'papel_sombra','tinta');p.r((0,0,w-1,h-4),'papel','tinta');p.l([(2,1),(w-3,1)],'branco')
    a=p.arr();a[0,0]=a[0,w-1]=a[h-1,0]=a[h-1,w-1]=-1;return a

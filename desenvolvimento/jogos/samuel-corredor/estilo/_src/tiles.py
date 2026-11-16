"""Tiles 16x16 das 3 fases, vistos de lado. Por fase: chão (topo esq/meio/dir), terra (esq/meio/dir), plataforma de passar por baixo
(esq/meio/dir), bloco, bloco especial e 1 enfeite. Contorno #193337 só nas faces de fora (o meio emenda sem costura).
Bloco do campo = fardo de feno; floresta = toco de tronco; caverna = bloco de pedra que cai devagar. Nenhum bloco de interrogação."""
import numpy as np
from paleta_corredor import i as I
from base_c import P, vazio, contornar
T=16
FASES={
 'campo':   dict(grama='verde_medio',grama_luz='verde_luz',grama_sombra='verde_sombra',terra='marrom_luz',terra_s='marrom',terra_p='pele_luz',
                 tab='marrom_luz',tab_l='pele_luz',tab_s='marrom'),
 'floresta':dict(grama='verde_sombra',grama_luz='verde_medio',grama_sombra='verde_fundo',terra='marrom',terra_s='marrom_sombra',terra_p='marrom_luz',
                 tab='marrom',tab_l='marrom_luz',tab_s='marrom_sombra'),
 'caverna': dict(grama='lilas_sombra',grama_luz='lilas',grama_sombra='lilas_fundo',terra='pedra_sombra',terra_s='pedra_fundo',terra_p='pedra',
                 tab='pedra',tab_l='pedra_luz',tab_s='pedra_sombra'),
}
def _rnd(seed): return np.random.RandomState(seed)
def terra(c,lado,seed,topo=False):
    a=np.full((T,T),I(c['terra']),int);r=_rnd(seed)
    for _ in range(4):
        x,y=r.randint(1,14),r.randint(2 if not topo else 8,14);a[y,x]=I(c['terra_s']);a[y,x+1]=I(c['terra_p'])
    if c is FASES['caverna']:  # tijolinhos
        a[:]=I(c['terra'])
        for y in (3,11): a[y,:]=I(c['terra_s'])
        for y0,y1,xs in ((0,3,(4,12)),(4,11,(0,8)),(12,16,(4,12))):
            for x in xs: a[y0:y1,x]=I(c['terra_s'])
        a[5,2]=I(c['terra_p']);a[13,6]=I(c['terra_p'])
    if lado=='esq': a[:,0]=I('tinta');a[:,1]=np.where(a[:,1]==I(c['terra']),I(c['terra_p']),a[:,1])
    if lado=='dir': a[:,15]=I('tinta');a[:,14]=np.where(a[:,14]==I(c['terra']),I(c['terra_s']),a[:,14])
    return a
def topo(c,lado,seed):
    a=terra(c,lado,seed,topo=True);r=_rnd(seed+50)
    a[0,:]=I('tinta')
    for x in range(T):
        h=5+(1 if (x+seed)%5==0 else 0)+(1 if (x*7+seed)%11==0 else 0)
        a[1:h,x]=I(c['grama']);a[1,x]=I(c['grama_luz']);a[h,x]=I(c['grama_sombra'])
        if h<T-1: a[h+1,x]=I('tinta') if (x+seed)%7==3 else a[h+1,x]
    for _ in range(2): x=r.randint(1,14);a[2,x]=I(c['grama_luz'])
    if lado=='esq':
        a[:,0]=I('tinta');a[0,0]=-1;a[1:7,1]=I(c['grama'])
    if lado=='dir':
        a[:,15]=I('tinta');a[0,15]=-1
    return a
def plataforma(c,lado):
    """plataforma fina (passa por baixo, para em cima): 7 px de altura no topo do tile."""
    a=vazio(T,T);a[0:7,:]=I(c['tab']);a[0,:]=I('tinta');a[6,:]=I('tinta');a[1,:]=I(c['tab_l']);a[5,:]=I(c['tab_s'])
    if c is FASES['campo']:   # tábuas com pregos
        a[2:5,7]=I(c['tab_s']);a[3,2]=I('tinta');a[3,12]=I('tinta')
    elif c is FASES['floresta']:  # galho com casca
        for x in (3,9,13): a[3,x]=I(c['tab_s']);a[3,x+1]=I(c['tab_s'])
        a[2,6]=I('verde_medio');a[2,7]=I('verde_luz')
    else:
        a[2:5,8]=I(c['tab_s']);a[4,3]=I(c['tab_s'])
    if lado=='esq': a[0:7,0]=I('tinta');a[0,0]=-1;a[6,0]=-1;a[1:6,1]=I(c['tab_l']) if c is not FASES['floresta'] else I(c['tab_l'])
    if lado=='dir': a[0:7,15]=I('tinta');a[0,15]=-1;a[6,15]=-1
    if c is FASES['floresta'] and lado=='dir':  # ponta do galho com folhinha
        a[7:10,12:15]=I('verde_medio');a[10,12:15]=I('tinta');a[7:10,15]=I('tinta');a[7:10,11]=I('tinta');a[8,13]=I('verde_luz')
    return a
def bloco(fase):
    p=P(T,T)
    if fase=='campo':      # fardo de feno amarrado
        p.r((0,0,15,15),'amarelo','tinta')
        for y in (3,7,11): p.l([(1,y),(14,y)],'amarelo_sombra')
        for x,y in ((3,5),(9,2),(12,9),(5,13),(10,13)): p.dot(x,y,'amarelo_luz')
        for x in (4,11): p.l([(x,1),(x,14)],'marrom')
        p.l([(1,1),(14,1)],'amarelo_luz')
    elif fase=='floresta': # toco de tronco visto de frente (anéis)
        p.r((0,0,15,15),'marrom_luz','tinta');p.e((2,2,13,13),'pele_luz','marrom');p.e((5,5,10,10),None,'marrom');p.dot(7,7,'marrom')
        p.l([(1,1),(14,1)],'pele_luz')
    else:                  # bloco de pedra (castelinho)
        p.r((0,0,15,15),'castelo_luz','tinta');p.r((2,2,13,13),'castelo_luz','castelo_longe')
        p.l([(1,1),(14,1)],'lilas_luz');p.l([(1,14),(14,14)],'castelo_longe')
        for x,y in ((3,3),(12,3),(3,12),(12,12)): p.dot(x,y,'tinta')
    return p.arr()
def especial(fase):
    """campo: bloco de feno pequeno empilhável -> aqui um caixote de madeira; floresta: cogumelinho de enfeite; caverna: bloco que cai devagar (rachadinha + gotinhas)."""
    p=P(T,T)
    if fase=='campo':
        p.r((0,0,15,15),'marrom_luz','tinta');p.r((2,2,13,13),None,'marrom');p.l([(2,2),(13,13)],'marrom');p.l([(1,1),(14,1)],'pele_luz')
    elif fase=='floresta':
        p.r((0,0,15,15),'marrom','tinta');p.e((2,2,13,13),'marrom_luz','marrom_sombra');p.e((5,5,10,10),None,'marrom_sombra')
        p.e((9,-1,15,5),'verde_medio','tinta')  # musgo no canto
    else:
        p.r((0,0,15,15),'pedra','tinta');p.l([(1,1),(14,1)],'pedra_luz');p.l([(1,14),(14,14)],'pedra_sombra')
        p.l([(6,1),(8,5),(6,8)],'pedra_fundo');p.r((10,7,11,8),'tinta');p.r((4,10,5,11),'tinta')
        p.l([(6,12),(9,12)],'tinta')   # carinha preocupada: avisa que vai cair
    return p.arr()
def enfeite(fase):
    p=P(T,T)
    if fase=='campo':
        p.l([(7,15),(7,9)],'verde_sombra');p.e((4,4,10,10),'branco','tinta');p.e((6,6,8,8),'amarelo',None)
        p.e((9,11,13,14),'verde_medio','tinta')
    elif fase=='floresta':
        # samambaia (fronde curvada)
        p.l([(8,15),(8,10),(10,5),(13,3)],'tinta',3);p.l([(8,15),(8,10),(10,5),(13,3)],'verde_medio',1)
        for (x,y,dx) in ((8,12,-4),(8,12,3),(9,8,-4),(9,8,3),(11,5,-3),(11,5,3)):
            p.l([(x,y),(x+dx,y-2)],'tinta',3)
        for (x,y,dx) in ((8,12,-4),(8,12,3),(9,8,-4),(9,8,3),(11,5,-3),(11,5,3)):
            p.l([(x,y),(x+dx,y-2)],'verde_luz' if dx>0 else 'verde_medio',1)
    else:
        p.p([(4,15),(6,6),(8,15)],'lilas_luz','tinta');p.p([(7,15),(10,3),(12,15)],'lilas','tinta');p.l([(10,5),(10,13)],'lilas_luz')
    return p.arr()
NOMES=['chao_esq','chao_meio','chao_dir','terra_esq','terra_meio','terra_dir','plat_esq','plat_meio','plat_dir','bloco','especial','enfeite']
def tileset(fase):
    c=FASES[fase];s=sum(map(ord,fase))
    return [topo(c,'esq',s),topo(c,'meio',s+1),topo(c,'dir',s+2),terra(c,'esq',s+3),terra(c,'meio',s+4),terra(c,'dir',s+5),
            plataforma(c,'esq'),plataforma(c,'meio'),plataforma(c,'dir'),bloco(fase),especial(fase),enfeite(fase)]

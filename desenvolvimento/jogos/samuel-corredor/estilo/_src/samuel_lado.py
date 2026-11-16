"""Samuel de lado (olhando para a direita) para o Corredor, partindo do 'parado_lado' aprovado do Planeta v0.2 (estilo-v2).
Quadro 32x48, pé na última linha. A cabeça e o tronco vêm da grade aprovada; braço e pernas são redesenhados por pose.
Poses: parado, correr_0..2, pular, cair, dano, comemorar. Sem logos."""
import sys, numpy as np
sys.path.insert(0,'/workspace/arte/pescador-samuel/estilo/_src')
import samuel2
from paleta_corredor import i as I
from base_c import P, cola, vazio, contornar
W,H=32,48
BASE=samuel2.grade('lado')            # aprovado (32x48)
def _sem_braco_pernas():
    g=BASE.copy()
    g[28:33,14:18]=I('cinza')         # tira o braço que fica na frente do tronco (camiseta mesclada no lugar)
    g[29,15]=I('cinza_luz');g[31,17]=I('cinza_luz')
    g[33,14:18]=I('cinza_claro')      # mão saía na bermuda
    g[38:,:]=-1                        # pernas: redesenhadas
    g[37,9:23]=np.where(g[37,9:23]>=0,I('tinta'),-1)
    return g
CORPO=_sem_braco_pernas()
def perna(a,hip,pe,frente=True):
    """canela da bermuda até o pé + tênis apontando para a direita."""
    p=P(W,H);hx,hy=hip;fx,fy=pe;pele='pele' if frente else 'pele_sombra'
    p.l([(hx,hy),(fx,fy-3)],'tinta',4);p.l([(hx,hy),(fx,fy-3)],pele,2)
    p.r((fx-3,fy-4,fx+4,fy),'tenis' if frente else 'tenis_sombra','tinta');p.l([(fx-2,fy-1),(fx+3,fy-1)],'papel' if frente else 'papel_sombra')
    p.dot(fx+3,fy-3,'tenis_sombra' if frente else 'tenis')
    return cola(a,p.arr(),0,0)
def braco(a,ombro,mao,frente=True,cotovelo=None):
    """braço de 3 px saindo da manga (com cotovelo opcional) + mão redonda. A manga é só cor, sem contorno por dentro do tronco."""
    p=P(W,H);pele='pele' if frente else 'pele_sombra';manga='cinza' if frente else 'cinza_sombra'
    ox,oy=ombro;ex,ey=cotovelo or mao;dx,dy=ex-ox,ey-oy;n=max(1,(dx*dx+dy*dy)**0.5);s0=(ox+dx/n*4,oy+dy/n*4)
    pts=[s0]+([cotovelo] if cotovelo else [])+[mao]
    p.l(pts,'tinta',5);p.l(pts,pele,3);mx,my=mao
    p.e((mx-2,my-2,mx+2,my+2),pele,'tinta')
    q=P(W,H);q.l([(ox,oy),s0],manga,5);q.e((ox-2,oy-2,ox+2,oy+2),manga,None)
    m=q.arr();fora=(m>=0)&(CORPO<0)            # contorno só onde a manga sai do tronco
    a=cola(a,p.arr(),0,0);a=cola(a,m,0,0)
    return a
def rosto(a,olho='aberto',boca='sorriso',dy=0):
    a=a.copy();y=16+dy
    if olho!='aberto':
        a[y:y+3,16:18]=I('pele')
        if olho=='feliz': a[y+1,16]=I('tinta');a[y,17]=I('tinta');a[y+1,18]=I('tinta')
        if olho=='dor': a[y,16]=I('tinta');a[y+1,17]=I('tinta');a[y+2,16]=I('tinta')
        if olho=='fechado': a[y+2,16:18]=I('tinta')
    if boca=='aberta': a[19+dy,22:24]=I('rosa_sombra')
    if boca=='o': a[19+dy,21:24]=I('pele');a[19+dy,22]=I('tinta');a[20+dy,21:24]=I('tinta');a[20+dy,22]=I('rosa_sombra');a[21+dy,22]=I('tinta')
    return a
def monta(dy=0,dx=0,pernas=(),bracos=(),olho='aberto',boca='sorriso'):
    """pernas/bracos: listas de (de_onde, para_onde, frente?) em coordenadas do quadro (antes do deslocamento)."""
    a=vazio(W,H)
    for (h,f,fr) in [x for x in pernas if not x[2]]: a=perna(a,(h[0]+dx,h[1]+dy),(f[0]+dx,f[1]+dy),False)
    for b_ in [x for x in bracos if not x[2]]: a=braco(a,(b_[0][0]+dx,b_[0][1]+dy),(b_[1][0]+dx,b_[1][1]+dy),False,(b_[3][0]+dx,b_[3][1]+dy) if len(b_)>3 else None)
    r=rosto(CORPO,olho,boca);corpo=r.copy();corpo[:23]=-1;cab=r.copy();cab[23:]=-1
    a=cola(a,corpo,dx,dy)
    for (h,f,fr) in [x for x in pernas if x[2]]: a=perna(a,(h[0]+dx,h[1]+dy),(f[0]+dx,f[1]+dy),True)
    for b_ in [x for x in bracos if x[2]]: a=braco(a,(b_[0][0]+dx,b_[0][1]+dy),(b_[1][0]+dx,b_[1][1]+dy),True,(b_[3][0]+dx,b_[3][1]+dy) if len(b_)>3 else None)
    a=cola(a,cab,dx,dy)   # a cabeça fica por cima: braço levantado passa por trás dela
    return a
HT,HF=(13,37),(18,37)       # quadris (perna de trás, perna da frente)
OM=(16,26)                  # ombro
POSES={
 'parado':[BASE],
 'correr':[monta(dy=-1,pernas=[(HT,(9,46),False),(HF,(23,46),True)],bracos=[(OM,(24,27),False,(21,31)),(OM,(9,28),True,(12,32))]),
           monta(dy=-2,pernas=[(HT,(14,44),False),(HF,(19,42),True)],bracos=[(OM,(19,32),False,(17,32)),(OM,(18,33),True,(16,32))]),
           monta(dy=-1,pernas=[(HT,(20,46),False),(HF,(11,46),True)],bracos=[(OM,(9,28),False,(12,32)),(OM,(24,27),True,(21,31))])],
 'pular':[monta(dy=-3,pernas=[(HT,(11,46),False),(HF,(22,41),True)],bracos=[(OM,(7,19),False),(OM,(27,25),True,(22,28))],boca='aberta')],
 'cair':[monta(dy=-3,pernas=[(HT,(12,47),False),(HF,(20,46),True)],bracos=[(OM,(7,19),False),(OM,(26,17),True)],boca='o')],
 'dano':[monta(dy=-2,dx=-1,pernas=[(HT,(9,45),False),(HF,(15,46),True)],bracos=[(OM,(6,20),False),(OM,(26,22),True)],olho='dor',boca='o')],
 'comemorar':[monta(dy=-2,pernas=[(HT,(13,46),False),(HF,(19,46),True)],bracos=[(OM,(6,9),False),(OM,(28,9),True)],olho='feliz',boca='aberta')],
}

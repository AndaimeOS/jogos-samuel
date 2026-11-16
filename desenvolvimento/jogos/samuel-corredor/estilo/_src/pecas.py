"""Doguinho de lado, coletáveis (moeda, estrela, bandeira, cogumelo-mola, plataforma móvel) e os 3 inimigos fofos e lentos.
Tudo original, feito por nós: moeda com folhinha (sem fenda), estrela-cristal de 4 pontas lilás sem rosto,
bandeira com patinha, cogumelo-mola de chapéu lilás com bolinhas e mola à mostra. Sem bloco de interrogação."""
import numpy as np
from paleta_corredor import i as I
from base_c import P, cola, vazio, contornar, fechar, tira
# ---------------------------------------------------------------- Doguinho de lado (o mesmo do Pescador: creme, orelha caramelo, coleira petróleo com plaquinha amarela)
def dog(pose='parado',f=0):
    p=P(28,24);b=[0,-1][f] if pose=='correr' else 0
    # rabinho
    p.e((1,8+b,6,13+b),'papel','tinta') if pose!='correr' else p.e((1,6+b,6,11+b),'papel','tinta')
    # corpo
    p.e((4,11+b,19,21+b),'papel','tinta');p.e((6,12+b,15,16+b),'branco',None)
    # patas
    if pose=='correr':
        pts=[(6,20,3,23),(15,20,19,23)] if f==0 else [(8,20,9,23),(13,20,14,23)]
    else: pts=[(6,19,8,23),(15,19,17,23)]
    for x0,y0,x1,y1 in pts: p.l([(x0,y0+b),(x1,y1)],'tinta',4);p.l([(x0,y0+b),(x1,y1-1)],'papel_sombra',2)
    for x0,y0,x1,y1 in pts: p.e((x1-2,y1-2,x1+1,y1),'papel','tinta')
    # cabeça
    p.e((13,2+b,26,15+b),'papel','tinta');p.e((15,3+b,23,9+b),'branco',None)
    p.e((22,8+b,27,13+b),'papel','tinta');p.dot(26,9+b,'tinta');p.dot(25,9+b,'tinta')   # focinho + nariz
    p.p([(14,3+b),(18,1+b),(19,4+b),(17,12+b),(14,11+b)],'marrom_luz','tinta')            # orelha caramelo
    p.e((19,4+b,23,8+b),'marrom_luz',None)                                                   # mancha no olho
    p.r((21,6+b,22,7+b),'tinta');p.dot(21,6+b,'branco');p.dot(21,10+b,'rosa_luz')
    p.l([(23,12+b),(25,12+b)],'tinta')
    if pose=='feliz': p.dot(24,13+b,'rosa');p.dot(25,13+b,'rosa')
    p.l([(15,14+b),(19,14+b)],'petroleo');p.dot(17,15+b,'amarelo')
    return p.arr()
DOG={'parado':[dog()], 'correr':[dog('correr',0),dog('correr',1)], 'feliz':[dog('feliz')]}
# ---------------------------------------------------------------- moeda (16x16, 4 quadros girando)
def moeda(f):
    p=P(16,16);w=[6,4,1,4][f];cx=8
    if w>1:
        p.e((cx-w-1,1,cx+w,14),'amarelo_sombra','tinta');p.e((cx-w,1,cx+w-1,13),'amarelo','tinta')
        if w>=4:
            p.e((cx-w+2,3,cx+w-3,11),None,'amarelo_sombra')
            # semente/coraçãozinho de folha em relevo (no lugar de fenda): bolinha clara com brilho
            p.e((cx-3,5,cx+1,9),'amarelo_luz','amarelo_sombra');p.dot(cx-2,6,'branco')
        else: p.l([(cx-1,4),(cx-1,10)],'amarelo_luz')
        p.dot(cx-w+1,4,'branco')
    else: p.r((cx-1,1,cx+1,14),'amarelo_sombra','tinta');p.l([(cx,2),(cx,13)],'amarelo')
    return p.arr()
MOEDA=[moeda(k) for k in range(4)]
# ---------------------------------------------------------------- estrela escondida (estrela-cristal de 4 pontas, lilás, 16x16, 2 quadros brilhando)
def estrela(f):
    p=P(16,16)
    p.p([(8,0),(10,6),(15,8),(10,10),(8,15),(6,10),(1,8),(6,6)],'lilas','tinta')
    p.p([(8,2),(9,7),(8,8),(7,7)],'lilas_luz');p.p([(3,8),(7,7),(8,8),(7,9)],'lilas_luz')
    p.p([(9,9),(13,8),(9,8)],'lilas_sombra');p.p([(8,13),(9,9),(8,9)],'lilas_sombra')
    p.dot(8,8,'branco')
    if f==1:
        for x,y in ((2,2),(13,3),(12,13)): p.dot(x,y,'amarelo_luz')
    return p.arr()
ESTRELA=[estrela(0),estrela(1)]
# ---------------------------------------------------------------- bandeira de fim de fase (32x64, 3 quadros tremulando): mastro de madeira, flâmula verde com patinha
def bandeira(f):
    p=P(32,64)
    p.r((4,56,15,63),'pedra','tinta');p.l([(5,57),(14,57)],'pedra_luz')                     # base de pedra
    p.r((8,6,11,56),'marrom_luz','tinta');p.l([(9,7),(9,55)],'pelo' if False else 'pele_luz')
    p.e((6,1,13,8),'amarelo','tinta');p.dot(8,3,'amarelo_luz')                              # bolinha no topo
    o=[0,1,2][f];pts=[(12,9),(28,10+o),(30,18),(27,25-o),(12,26)]
    p.p(pts,'verde_medio','tinta');p.p([(13,10),(26,11+o),(26,13+o),(13,13)],'verde_luz')
    # patinha (Doguinho) na flâmula
    cx,cy=20,18+(1 if f==1 else 0)
    p.e((cx-3,cy-1,cx+2,cy+3),'branco','tinta')
    for dx,dy in ((-4,-4),(-1,-5),(2,-4)): p.e((cx+dx,cy+dy,cx+dx+2,cy+dy+2),'branco','tinta')
    return p.arr()
BANDEIRA=[bandeira(k) for k in range(3)]
# ---------------------------------------------------------------- cogumelo-mola (pulo alto): chapéu lilás com bolinhas creme + mola à mostra. 32x32, 3 quadros: parado, amassado, solta
def cogumelo(f):
    p=P(32,32);alt=[0,5,-3][f];topo=8+alt
    # mola
    for k in range(4):
        y=topo+8+k*(16-alt)//4
        p.l([(10,y),(21,y+2)],'tinta',4);p.l([(11,y),(20,y+2)],'ferro_luz',2)
    p.r((8,28,23,31),'marrom','tinta');p.l([(9,29),(22,29)],'marrom_luz')                     # base de madeira
    # chapéu
    p.e((2,topo,29,topo+14),'lilas_sombra','tinta');p.e((2,topo-1,29,topo+11),'lilas','tinta')
    p.e((5,topo,16,topo+5),'lilas_luz',None)
    for x,y,r in ((7,topo+4,2),(16,topo+1,2),(24,topo+5,2)): p.e((x-r,y-r,x+r,y+r),'papel','tinta')
    p.l([(5,topo+12),(26,topo+12)],'lilas_fundo')
    # carinha
    p.r((12,topo+7,13,topo+9),'tinta');p.r((18,topo+7,19,topo+9),'tinta');p.dot(12,topo+7,'branco');p.dot(18,topo+7,'branco')
    p.dot(10,topo+10,'rosa_luz');p.dot(21,topo+10,'rosa_luz')
    p.l([(14,topo+10),(15,topo+11),(16,topo+11),(17,topo+10)],'tinta') if f!=1 else p.l([(14,topo+10),(17,topo+10)],'tinta')
    return p.arr()
COGUMELO=[cogumelo(k) for k in range(3)]
# ---------------------------------------------------------------- plataforma móvel (48x16): tábua com duas hélices-folha embaixo (2 quadros)
def plataforma(f):
    p=P(48,16)
    p.r((0,2,47,9),'marrom_luz','tinta');p.l([(1,3),(46,3)],'pele_luz');p.l([(1,8),(46,8)],'marrom')
    for x in (15,31): p.l([(x,3),(x,8)],'marrom')
    for x in (4,43): p.e((x-1,4,x+1,6),'amarelo_sombra','tinta')
    # setinhas pintadas indicando que anda
    for x,s in ((22,-1),(26,1)): p.p([(x,4),(x,7),(x+2*s,5)] if s>0 else [(x,4),(x,7),(x-2,5)],'verde_luz' if True else None,None)
    # hélices-folha
    for cx in (12,36):
        p.l([(cx,10),(cx,12)],'tinta',1)
        if f==0: p.e((cx-6,11,cx-1,14),'verde_medio','tinta');p.e((cx+1,11,cx+6,14),'verde_medio','tinta')
        else: p.e((cx-3,11,cx+3,14),'verde_sombra','tinta')
    return p.arr()
PLATAFORMA=[plataforma(0),plataforma(1)]
# ---------------------------------------------------------------- inimigos fofos e lentos (24x24): lesma-flor (campo), besouro-bolinha (floresta), morceguinho-sonolento (caverna)
def lesma(f):
    p=P(28,20);s=[0,1][f]
    p.p([(2,18),(4,13+s),(10,12),(24,13),(27,18)],'verde_luz','tinta')                     # corpo (pé da lesma)
    p.e((20,6-s,27,15),'verde_luz','tinta')                                                 # cabeça
    for x in (22,25): p.l([(x,7-s),(x+1,2-s)],'tinta');p.e((x,0-s,x+2,2-s),'verde_luz','tinta')
    p.r((22,9-s,22,10-s),'tinta');p.r((25,9-s,25,10-s),'tinta');p.dot(23,12-s,'rosa_luz')
    # casca em caracol com florzinha
    p.e((5,2,19,16),'laranja','tinta');p.e((8,5,16,13),'laranja_luz','laranja_sombra');p.e((11,7,13,10),'laranja','laranja_sombra')
    for dx,dy in ((0,-2),(2,0),(0,2),(-2,0)): p.e((12+dx-1,2+dy-1,12+dx+1,2+dy+1),'branco','tinta')
    p.dot(12,2,'amarelo')
    return p.arr()
def besouro(f):
    p=P(24,20);s=[0,1][f]
    for k,x in enumerate((6,11,16)):
        dx=(s if k%2==0 else -s);p.l([(x,14),(x+dx-1,19)],'tinta',2)
    p.e((2,4,19,17),'verde_sombra','tinta');p.e((3,4,18,15),'verde_medio','tinta');p.l([(10,5),(10,14)],'tinta')
    p.e((5,6,9,9),'verde_luz',None);for_=None
    for x,y in ((6,11),(14,8),(15,12)): p.dot(x,y,'amarelo')
    p.e((16,7,23,15),'tenis','tinta')                                                          # cabeça
    p.l([(19,7),(21,2)],'tinta');p.dot(22,2,'amarelo')
    p.r((20,9,20,10),'branco');p.dot(21,12,'rosa_luz');p.l([(19,13),(21,13)],'papel_sombra')
    return p.arr()
def morcego(f):
    p=P(28,20);b=[0,2][f]
    asa=[(3,7+b),(0,3+b),(5,5),(9,4),(9,12)] if f==0 else [(3,12),(0,15),(5,14),(9,10),(9,13)]
    p.p(asa,'lilas_sombra','tinta');p.p([(27-x,y) for x,y in asa],'lilas_sombra','tinta')
    p.e((7,3+b,20,16+b),'lilas','tinta');p.e((9,5+b,14,9+b),'lilas_luz',None)
    p.p([(8,6+b),(9,0+b),(12,4+b)],'lilas','tinta');p.p([(19,6+b),(18,0+b),(15,4+b)],'lilas','tinta')
    p.l([(10,10+b),(12,10+b)],'tinta');p.l([(15,10+b),(17,10+b)],'tinta')                   # olhinhos sonolentos
    p.dot(10,12+b,'rosa_luz');p.dot(17,12+b,'rosa_luz');p.dot(13,13+b,'branco');p.dot(14,13+b,'branco')
    return p.arr()
def amassado(fn,w,h):
    """quadro de 'pof' (pisou em cima): o inimigo achatado, olhos fechados."""
    a=fn(0);m=a>=0;ys,xs=np.nonzero(m);y0=ys.min()
    from PIL import Image
    im=Image.fromarray(a[y0:].astype(np.int32),'I').resize((a.shape[1],max(4,(h-y0)//2)),Image.NEAREST)
    q=vazio(w,h);b=np.array(im);q[h-b.shape[0]:,:]=b;return fechar(q)
INIMIGOS={'lesma':([lesma(0),lesma(1)],28,20),'besouro':([besouro(0),besouro(1)],24,20),'morcego':([morcego(0),morcego(1)],28,20)}
def inim(nome):
    fr,w,h=INIMIGOS[nome];fn={'lesma':lesma,'besouro':besouro,'morcego':morcego}[nome]
    return {'andar' if nome!='morcego' else 'voar':fr,'pof':[amassado(fn,w,h)]}

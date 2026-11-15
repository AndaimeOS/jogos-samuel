"""Fundos com parallax para as 3 fases. A tela tem 240 px de altura e a largura muda (~320 deitado, ~180 em pé),
então cada camada REPETE NA HORIZONTAL (largura 256, emenda sem costura) e é presa no topo ou no pé da tela.
Céu = faixa vertical de 16x240 (degradê em faixas com pontilhado nas transições; alpha só 0/255).
Camadas longe sem contorno (para recuar); a camada de perto tem contorno #193337."""
import math, numpy as np
from paleta_corredor import i as I
from base_c import vazio, contornar, fechar, P
HT=240;LW=256
BAYER=np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]])/16+1/32
def ceu(cores,limites):
    """faixas de cor de cima para baixo; transição de 6 px em pontilhado."""
    a=np.zeros((HT,16),int);yy,xx=np.mgrid[0:HT,0:16]
    a[:]=I(cores[0])
    for k,y0 in enumerate(limites):
        t=np.clip((yy-y0+3)/6,0,1);a[t>BAYER[yy%4,xx%4]]=I(cores[k+1])
    return a
def onda(x,termos,seed=0):
    return sum(A*math.sin(2*math.pi*(n*x/LW)+fase) for A,n,fase in termos)
def silhueta(h,base,termos,cor,luz=None,topo=False):
    """perfil repetível: altura em cada coluna = base + soma de senos com período inteiro em LW."""
    a=vazio(LW,h)
    for x in range(LW):
        y=int(round(base-onda(x,termos)))
        y=max(0,min(h-1,y))
        if topo: a[:h-y,x]=I(cor)
        else:
            a[y:,x]=I(cor)
            if luz: a[y:y+2,x]=I(luz)
    return a
def arvore_redonda(a,x,y,r,cor,luz,tronco,outline=False):
    p=P(a.shape[1],a.shape[0]);p.set(a)
    p.r((x-2,y,x+1,a.shape[0]-1),tronco,'tinta' if outline else None)
    p.e((x-r,y-2*r+3,x+r,y+3),cor,'tinta' if outline else None);p.e((x-r+2,y-2*r+5,x,y-r+2),luz,None)
    return p.arr()
def pinheiro(a,x,y,h,cor,luz=None,outline=False):
    p=P(a.shape[1],a.shape[0]);p.set(a)
    for k in range(3):
        w=h//3+k*3;yy=y+k*(h//4)
        p.p([(x,yy),(x-w//2-2,yy+h//3),(x+w//2+2,yy+h//3)],cor,'tinta' if outline else None)
    p.r((x-1,y+h//3+2*(h//4),x+1,a.shape[0]-1),'marrom_sombra' if outline else cor,'tinta' if outline else None)
    return p.arr()
def fechar_rep(a,topo=False):
    """contorno nas bordas da arte, emendando na horizontal (a camada repete) e sem contorno na borda presa à tela."""
    m=a>=0;l=np.roll(m,1,1);r=np.roll(m,-1,1)
    u=np.vstack([m[:1] if topo else np.zeros((1,m.shape[1]),bool),m[:-1]]);d=np.vstack([m[1:],np.zeros((1,m.shape[1]),bool) if topo else m[-1:]])
    b=m&~(l&r&u&d);a=a.copy();a[b]=I('tinta');return a
def campo():
    C={}
    C['ceu']=ceu(['ceu','ceu_luz','branco'],[150,205])
    # nuvens (topo, longe): 256x64, sem contorno, repetível
    n=vazio(LW,64);p=P(LW,64);p.set(n)
    for cx,cy,w in ((40,30,30),(150,18,22),(220,40,26)):
        for dx in (-LW,0,LW):
            x=cx+dx
            for ox,oy,r in ((-w*0.5,4,w*0.35),(0,0,w*0.45),(w*0.5,5,w*0.32),(w*0.1,7,w*0.4)):
                p.e((x+ox-r,cy+oy-r*0.7,x+ox+r,cy+oy+r*0.7),'branco',None)
            p.l([(x-w*0.7,cy+11),(x+w*0.7,cy+11)],'ceu_luz')
    C['nuvens']=p.arr()
    C['morros_longe']=silhueta(96,60,[(14,1,0.3),(8,3,1.1),(3,7,2.0)],'morro_longe')
    m=silhueta(80,42,[(10,2,0.8),(6,5,0.1),(2,11,1.3)],'morro');C['morros']=m
    # perto: moitas e árvores redondas com contorno, pé da tela
    a=vazio(LW,72)
    for x in range(LW):
        y=int(48-4*math.sin(2*math.pi*x*4/LW)-2*math.sin(2*math.pi*x*9/LW+1));a[y:,x]=I('verde_sombra')
    for cx in (30,110,190):
        for dx in (-LW,0,LW): a=arvore_redonda(a,cx+dx,40,14,'verde_medio','verde_luz','marrom',outline=True)
    C['moitas']=fechar_rep(a)
    return C
def floresta():
    C={}
    C['ceu']=ceu(['agua_espuma','verde_luz','branco'],[110,180])
    # mata longe: copas redondas emendadas (perfil com 'calombos'), sem contorno
    a=vazio(LW,150)
    for x in range(LW):
        y=int(60-14*abs(math.sin(math.pi*x*8/LW))-8*abs(math.sin(math.pi*x*3/LW+0.5)));a[y:,x]=I('mata_longe')
    for k,cx in enumerate(range(16,LW,32)): a[100:,cx-2:cx+2]=I('mata_fundo')
    C['mata_longe']=a
    # troncos (do topo até o pé da tela, as copas cobrem a ponta de cima)
    b=vazio(LW,240)
    for k,cx in enumerate(range(24,LW,64)):
        w=7+(k%2)*3
        for x in range(cx-w,cx+w+1): b[:,x%LW]=I('mata_fundo')
        b[:,(cx-w+2)%LW]=I('mata_longe')
    C['troncos']=b
    # copas (presas no topo): galhos e folhas com contorno
    c=vazio(LW,56)
    for x in range(LW):
        y=int(30+8*math.sin(2*math.pi*x*3/LW)+5*math.sin(2*math.pi*x*8/LW+0.7));c[:y,x]=I('verde_fundo')
        if y>2: c[y-2:y,x]=I('verde_sombra')
    for cx in (40,128,210):
        for dx in (-LW,0,LW):
            p=P(LW,56);p.set(c);x=cx+dx;p.e((x-5,y0:=30,x+5,40),'verde_sombra',None);c=p.arr()
    C['copas']=fechar_rep(c,topo=True)
    a=vazio(LW,64)
    for x in range(LW):
        y=int(40-5*math.sin(2*math.pi*x*5/LW)-3*math.sin(2*math.pi*x*11/LW));a[y:,x]=I('verde_fundo')
    for cx in (50,160):
        for dx in (-LW,0,LW):
            p=P(LW,64);p.set(a);x=cx+dx;p.e((x-10,26,x+10,44),'verde_sombra','tinta');p.e((x-6,28,x,34),'verde_medio',None);a=p.arr()
    C['samambaias']=fechar_rep(a)
    return C
def caverna():
    C={}
    C['ceu']=ceu(['caverna_fundo','caverna','petroleo_fundo'],[90,170])
    # castelinho longe (silhueta lilás com janelinhas acesas)
    a=vazio(LW,130);p=P(LW,130);p.set(a)
    for cx,w,h in ((60,40,80),(170,56,100)):
        for dx in (-LW,0,LW):
            x=cx+dx;p.r((x-w//2,130-h,x+w//2,129),'castelo_longe')
            for k in range(-w//2,w//2+1,8): p.r((x+k-2,130-h-5,x+k+2,130-h),'castelo_longe')
            for tx in (x-w//2,x+w//2):
                p.r((tx-6,130-h-24,tx+6,129),'castelo_longe');p.p([(tx-8,130-h-24),(tx,130-h-38),(tx+8,130-h-24)],'lilas_fundo')
                p.r((tx-1,130-h-14,tx+1,130-h-10),'amarelo')
            p.r((x-3,130-h+20,x+3,130-h+28),'amarelo_sombra')
    a=p.arr();a[120:,:]=I('castelo_longe');C['castelo']=a
    # estalactites (topo) com contorno
    s=vazio(LW,48)
    for x in range(LW):
        y=int(10+3*math.sin(2*math.pi*x*6/LW));s[:y,x]=I('pedra_fundo')
    p=P(LW,48);p.set(s)
    for k,cx in enumerate(range(10,LW,22)):
        h=18+(k*13)%22
        for dx in (-LW,0,LW): x=cx+dx;p.p([(x-6,8),(x,8+h),(x+6,8)],'pedra_fundo')
    C['estalactites']=fechar_rep(p.arr(),topo=True)
    # pedras e cristais perto (pé)
    a=vazio(LW,56)
    for x in range(LW):
        y=int(36-6*math.sin(2*math.pi*x*3/LW)-3*math.sin(2*math.pi*x*7/LW+2));a[y:,x]=I('pedra_fundo')
    p=P(LW,56);p.set(a)
    for cx in (40,140,220):
        for dx in (-LW,0,LW):
            x=cx+dx;p.p([(x-4,40),(x,20),(x+4,40)],'lilas');p.p([(x+2,40),(x+7,28),(x+9,40)],'lilas_sombra');p.l([(x,23),(x,38)],'lilas_luz')
    C['pedras']=fechar_rep(p.arr())
    return C
def _desce(fn,nome,n=24):
    def g():
        C=fn();a=C[nome];C[nome]=np.vstack([a,np.repeat(a[-1:],n,0)]);return C
    return g
# a camada de perto desce até o pé da tela (aparece dentro dos buracos)
FASES={'campo':_desce(campo,'moitas'),'floresta':_desce(floresta,'samambaias'),'caverna':_desce(caverna,'pedras')}
# ordem de desenho e fator de parallax (proposta) + âncora vertical
CAMADAS={'campo':[('ceu',0.0,'topo'),('nuvens',0.1,'topo:8'),('morros_longe',0.2,'pe:-40'),('morros',0.4,'pe:-32'),('moitas',0.7,'pe:0')],
         'floresta':[('ceu',0.0,'topo'),('mata_longe',0.2,'pe:-40'),('troncos',0.45,'topo'),('copas',0.6,'topo'),('samambaias',0.8,'pe:0')],
         'caverna':[('ceu',0.0,'topo'),('castelo',0.2,'pe:-40'),('estalactites',0.5,'topo'),('pedras',0.7,'pe:0')]}

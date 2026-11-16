"""Telas simuladas (Phaser, pixelArt, zoom inteiro): 240 px de altura, largura 320 (iPad deitado) e 180 (em pé).
Fase de amostra para cada mundo, mapa de 3 fases e 'Fase vencida'. As camadas de fundo repetem na horizontal."""
import sys, numpy as np
sys.path.insert(0,'/workspace/arte/pescador-samuel/estilo/_src')
import controles_mapa as K
from PIL import Image
from paleta_corredor import i as I, para_rgba
from base_c import vazio, P
import tiles as TL, fundos as FD, pecas as PC, samuel_lado as SL, ui as UI
HT=240;CHAO=192
def rgba(a): return para_rgba(np.asarray(a,int))
def cola_img(dst,a,x,y): im=rgba(a);dst.paste(im,(int(x),int(y)),im)
def pe(dst,a,x,y):   # cola pelo pé (x = centro, y = linha do chão)
    cola_img(dst,a,x-a.shape[1]//2,y-a.shape[0])
def fundo(fase,W,camx):
    C=FD.FASES[fase]();tela=Image.new('RGBA',(W,HT),(0,0,0,255))
    for nome,fat,anc in FD.CAMADAS[fase]:
        im=rgba(C[nome]);w,h=im.size
        y=0 if anc=='topo' else int(anc[5:]) if anc.startswith('topo:') else HT+int(anc[3:])-h
        off=-int(camx*fat)%w
        for x in range(-2*w,W+w,w): tela.paste(im,(x+off,y),im)
    return tela
# --------------------------------------------------------- fase de amostra (mundo de 400 px; a câmera recorta)
def mundo(fase):
    ts=TL.tileset(fase);WW=400
    m=vazio(WW,HT)
    def chao(x0,x1):
        for x in range(x0,x1,16):
            k=0 if x==x0 else 2 if x==x1-16 else 1
            m[CHAO:CHAO+16,x:x+16]=ts[k]
            for y in range(CHAO+16,HT,16): m[y:y+16,x:x+16]=ts[3+k]
    chao(0,208);chao(240,WW)
    for k,x in enumerate(range(256,304,16)): m[136:152,x:x+16]=ts[6 if k==0 else 8 if k==2 else 7]
    for x,y in ((112,128),(128,128)): m[y:y+16,x:x+16]=ts[9]
    m[128:144,144:160]=ts[10] if fase!='caverna' else ts[9]
    m[CHAO-16:CHAO,24:40]=ts[11];m[CHAO-16:CHAO,330:346]=ts[11]
    return m
ELENCO={'campo':('lesma','andar'),'floresta':('besouro','andar'),'caverna':('morcego','voar')}
def fase_tela(fase,W,camx,hud=True,samuel_x=170,pose=('correr',0)):
    tela=fundo(fase,W,camx);m=mundo(fase)
    sl=m[:,camx:camx+W];cola_img(tela,sl,0,0)
    def X(x): return x-camx
    for k,x in enumerate((104,120,136,152)): cola_img(tela,PC.MOEDA[k%4],X(x),104-(6 if k in(1,2) else 0))
    for k,x in enumerate((264,280)): cola_img(tela,PC.MOEDA[(k+1)%4],X(x),112)
    cola_img(tela,PC.ESTRELA[1],X(296),60)
    nome,anim=ELENCO[fase];ini=PC.inim(nome)[anim][0]
    if fase=='caverna': pe(tela,ini,X(350),CHAO-30)
    else: pe(tela,ini,X(350),CHAO)
    if fase=='floresta': pe(tela,PC.COGUMELO[0],X(230+32),CHAO) if False else pe(tela,PC.COGUMELO[0],X(380),CHAO)
    if fase=='caverna': cola_img(tela,PC.PLATAFORMA[0],X(200),150)
    if fase=='campo': pe(tela,PC.BANDEIRA[0],X(388),CHAO);pe(tela,PC.DOG['parado'][0],X(372),CHAO)
    sam=SL.POSES[pose[0]][pose[1]];pe(tela,sam,X(samuel_x),CHAO)
    pe(tela,PC.dog('correr',1),X(samuel_x-26),CHAO)
    pe(tela,UI.EFEITOS['poeira'][1],X(samuel_x-12),CHAO)
    if hud: poe_hud(tela,W)
    return tela
def poe_hud(tela,W):
    cola_img(tela,UI.hud_coracoes(3),6,6);cola_img(tela,UI.hud_moedas('12'),6,22)
    cola_img(tela,UI.botao('pausa'),W-30,6);cola_img(tela,UI.botao('tela-cheia'),W-58,6)
    cola_img(tela,UI.botao('esquerda'),6,HT-38);cola_img(tela,UI.botao('direita',True),44,HT-38);cola_img(tela,UI.botao('pular'),W-46,HT-46)
# --------------------------------------------------------- mapa de 3 fases
def mapa_tela(W):
    deitado=W>=300;tela=Image.new('RGBA',(W,HT))
    cores=[('verde_medio','verde_luz'),('verde_sombra','verde_medio'),('caverna','pedra_fundo')]
    a=vazio(W,HT);yy,xx=np.mgrid[0:HT,0:W]
    if deitado: faixa=np.minimum(2,xx*3//W)
    else: faixa=np.minimum(2,(HT-1-yy)*3//HT)
    for k,(c,l) in enumerate(cores):
        a[faixa==k]=I(c);a[(faixa==k)&((xx*7+yy*13)%29==0)]=I(l)
    cola_img(tela,a,0,0)
    # enfeites de cada região
    tsC,tsF,tsK=TL.tileset('campo'),TL.tileset('floresta'),TL.tileset('caverna')
    if deitado:
        nos=[(52,150),(160,110),(268,150)]
        for x,y in ((20,60),(80,200),(30,210)): cola_img(tela,tsC[11],x,y)
        for x,y in ((120,40),(190,200),(130,190)): cola_img(tela,tsF[11],x,y)
        for x,y in ((230,40),(290,200)): cola_img(tela,tsK[11],x,y)
    else:
        nos=[(56,196),(124,128),(60,58)]
        for x,y in ((140,200),(10,170)): cola_img(tela,tsC[11],x,y)
        for x,y in ((20,110),(150,96)): cola_img(tela,tsF[11],x,y)
        for x,y in ((140,30),(14,20)): cola_img(tela,tsK[11],x,y)
    # caminho pontilhado
    for k in range(2):
        (x0,y0),(x1,y1)=nos[k],nos[k+1]
        for t in np.linspace(0.18,0.82,6): cola_img(tela,K.ponto(k==0),x0+(x1-x0)*t-4,y0+(y1-y0)*t-4+8)
    est=['vencida','aberta','travada']
    for (x,y),e in zip(nos,est): cola_img(tela,UI.no(e,None),x-16,y-16+8)
    # castelinho pequeno no fim (nó 3)
    x,y=nos[2];p=P(20,22);p.r((3,8,16,21),'castelo_luz','tinta');p.r((0,2,6,21),'castelo_luz','tinta');p.r((13,2,19,21),'castelo_luz','tinta')
    p.r((8,13,11,21),'castelo_longe','tinta');p.dot(3,6,'amarelo');p.dot(16,6,'amarelo');cola_img(tela,p.arr(),x-10,y-30)
    x,y=nos[1];pe(tela,UI.marcador(),x,y+12);cola_img(tela,K.seta_marcador(),x-8,y-46)
    pe(tela,PC.dog('parado'),nos[0][0]+20,nos[0][1]+14)
    cola_img(tela,UI.hud_moedas('12'),6,6);cola_img(tela,UI.botao('pausa'),W-30,6);cola_img(tela,UI.botao('tela-cheia'),W-58,6)
    return tela
# --------------------------------------------------------- Fase vencida (sem texto e sem estrelas)
def escurece(tela):
    a=np.array(tela);yy,xx=np.mgrid[0:a.shape[0],0:a.shape[1]];m=((xx+yy)%2==0)
    a[m,:3]=(25,51,55);return Image.fromarray(a)
def vencida_tela(W):
    tela=escurece(fase_tela('campo',W,40 if W>=300 else 296-W//2+40,hud=False,samuel_x=360 if W>=300 else 370,pose=('comemorar',0)))
    pw,ph=(200,168) if W>=300 else (164,176);x0=(W-pw)//2;y0=(HT-ph)//2
    cola_img(tela,UI.painel(pw,ph),x0,y0)
    cx=W//2
    pe(tela,PC.BANDEIRA[1],cx-40,y0+96);pe(tela,SL.POSES['comemorar'][0],cx+2,y0+98);pe(tela,PC.DOG['feliz'][0],cx+38,y0+98)
    for k,(dx,dy) in enumerate(((-60,20),(58,26),(-50,70),(66,72))): cola_img(tela,UI.EFEITOS['brilho'][2],cx+dx,y0+dy)
    hm=UI.hud_moedas('12');cola_img(tela,hm,cx-hm.shape[1]//2,y0+104)
    cola_img(tela,UI.botao('repetir'),cx-44,y0+ph-46);cola_img(tela,UI.botao('proxima'),cx-6,y0+ph-54)
    return tela

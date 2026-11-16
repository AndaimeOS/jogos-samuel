"""Gera a folha de estilo do Samuel Corredor em /workspace/arte/samuel-corredor/estilo/. Nunca sobrescreve (base_c.salvar grava _v2...).
python3 build.py"""
import os, json, hashlib, glob, numpy as np, sys
from PIL import Image
sys.path.insert(0,'/workspace/arte/pescador-samuel/estilo/_src')
import controles_mapa as K
from paleta_corredor import para_rgba, i as I
from base_c import salvar, tira, vazio
import samuel_lado as SL, pecas as PC, tiles as TL, fundos as FD, ui as UI, cenas as CN
R='/workspace/arte/samuel-corredor/estilo';LIC='original, feito por nós, livre para uso no repo'
MAN={'jogo':'Samuel Corredor (proposta)','etapa':'folha de estilo (não são os sprites finais)','licenca':LIC,
     'base':{'altura':240,'largura':'~320 deitado / ~180 em pé','tile':16,'samuel':[32,48],'zoom':'inteiro, nearest (pixelArt)'},
     'cor':'PNG RGBA, alpha só 0/255, contorno #193337, paleta estilo-v2 + derivados (_src/paleta_corredor.py)','pecas':{}}
def reg(chave,caminho,**k): MAN['pecas'][chave]=dict(arquivo=os.path.relpath(caminho,R),**k)
def strip(qs,w,h,anch='pe'):
    out=[]
    for q in qs:
        z=vazio(w,h);y=h-q.shape[0] if anch=='pe' else 0;x=(w-q.shape[1])//2;z[y:y+q.shape[0],x:x+q.shape[1]]=q;out.append(z)
    return tira(out)
# ---------- personagens
ORD_SAM=[(k,n) for k in SL.POSES for n in range(len(SL.POSES[k]))]
p=salvar(tira([SL.POSES[k][n] for k,n in ORD_SAM]),f'{R}/samuel/samuel-lado.png');reg('samuel',p,quadro=[32,48],quadros=[f'{k}_{n}' for k,n in ORD_SAM],nota='parte do parado_lado aprovado do Planeta v0.2; braço e pernas redesenhados por pose')
ORD_DOG=[(k,n) for k in PC.DOG for n in range(len(PC.DOG[k]))]
p=salvar(strip([PC.DOG[k][n] for k,n in ORD_DOG],28,24),f'{R}/doguinho/doguinho-lado.png');reg('doguinho',p,quadro=[28,24],quadros=[f'{k}_{n}' for k,n in ORD_DOG],nota='o mesmo Doguinho do Pescador, agora de lado')
COLETA={'moeda':(PC.MOEDA,16,16,'girar'),'estrela':(PC.ESTRELA,16,16,'brilhar'),'bandeira':(PC.BANDEIRA,32,64,'tremular'),
        'cogumelo':(PC.COGUMELO,32,32,'mola'),'plataforma':(PC.PLATAFORMA,48,16,'helice')}
for n,(qs,w,h,an) in COLETA.items():
    p=salvar(strip(qs,w,h),f'{R}/coleta/{n}.png');reg(n,p,quadro=[w,h],quadros=[f'{an}_{k}' for k in range(len(qs))])
INI={}
for n in ('lesma','besouro','morcego'):
    d=PC.inim(n);fr,w,h=PC.INIMIGOS[n];INI[n]=d
    qs=[q for a in d for q in d[a]];p=salvar(strip(qs,w,h),f'{R}/inimigos/{n}.png');reg(n,p,quadro=[w,h],quadros=[f'{a}_{k}' for a in d for k in range(len(d[a]))])
EFE={'poeira':(10,8,'sumir'),'pof':(24,24,'estourar'),'brilho':(9,9,'piscar')}
for n,(w,h,an) in EFE.items():
    p=salvar(strip(UI.EFEITOS[n],w,h,'centro'),f'{R}/efeitos/{n}.png');reg(n,p,quadro=[w,h],quadros=[f'{an}_{k}' for k in range(3)])
# ---------- tiles
TS={f:TL.tileset(f) for f in TL.FASES}
for f,ts in TS.items():
    p=salvar(tira(ts),f'{R}/tiles/{f}.png');reg(f'tiles_{f}',p,tile=16,ordem=TL.NOMES)
p=salvar(np.concatenate([tira(TS[f]) for f in TS],0),f'{R}/tiles/tiles-3-fases.png');reg('tiles',p,tile=16,linhas=list(TS),colunas=TL.NOMES,nota='amostra: ids e ordem finais vêm do ARTE.md do Dev')
# ---------- fundos
for f,fn in FD.FASES.items():
    C=fn()
    for nome,fat,anc in FD.CAMADAS[f]:
        p=salvar(C[nome],f'{R}/fundos/{f}/{nome}.png');reg(f'fundo_{f}_{nome}',p,tamanho=list(C[nome].shape[::-1]),repete='horizontal',parallax=fat,ancora=anc)
# ---------- controles e HUD
for n,(t,c,ic) in UI.BOTOES.items():
    p=salvar(tira([UI.botao(n),UI.botao(n,True)]),f'{R}/controles/botao-{n}.png');reg(f'botao-{n}',p,quadro=[t,t],quadros=['normal','apertado'],pt_pior_caso=t*3)
p=salvar(UI.coracao(True),f'{R}/hud/coracao.png');reg('coracao',p)
p=salvar(UI.coracao(False),f'{R}/hud/coracao-vazio.png');reg('coracao-vazio',p)
p=salvar(tira([UI.digito(c) for c in '0123456789']),f'{R}/hud/digitos.png');reg('digitos',p,quadro=[8,12],ordem='0123456789',nota='fonte pixel nossa, só dígitos')
p=salvar(UI.hud_moedas('12'),f'{R}/hud/painel-moedas-exemplo.png');reg('painel-moedas',p,nota='exemplo montado: moeda + dígitos sobre fundo petróleo')
# ---------- telas (1x e 2x)
def tela(img,nome,chave,**k):
    os.makedirs(f'{R}/telas',exist_ok=True);p=f'{R}/telas/{nome}.png';b,x=os.path.splitext(p);j=1
    while os.path.exists(p): j+=1;p=f'{b}_v{j}{x}'
    img.convert('RGB').save(p.replace('.png','__1x.png'));img.resize((img.width*2,img.height*2),Image.NEAREST).convert('RGB').save(p)
    reg(chave,p,**k);return img
TELAS={}
TELAS['jogo320']=tela(CN.fase_tela('campo',320,40),'tela-jogo-campo-320x240','tela_jogo_deitado',tamanho=[320,240])
TELAS['jogo180']=tela(CN.fase_tela('campo',180,96),'tela-jogo-campo-180x240','tela_jogo_em_pe',tamanho=[180,240])
TELAS['flo']=tela(CN.fase_tela('floresta',320,40),'tela-jogo-floresta-320x240','tela_floresta',tamanho=[320,240])
TELAS['cav']=tela(CN.fase_tela('caverna',320,40),'tela-jogo-caverna-320x240','tela_caverna',tamanho=[320,240])
TELAS['mapa320']=tela(CN.mapa_tela(320),'mapa-3-fases-320x240','mapa_deitado',tamanho=[320,240])
TELAS['mapa180']=tela(CN.mapa_tela(180),'mapa-3-fases-180x240','mapa_em_pe',tamanho=[180,240])
TELAS['venc320']=tela(CN.vencida_tela(320),'fase-vencida-320x240','vencida_deitado',tamanho=[320,240],nota='sem texto e sem estrelas')
TELAS['venc180']=tela(CN.vencida_tela(180),'fase-vencida-180x240','vencida_em_pe',tamanho=[180,240])
# ---------- amostra técnica: atlas JSON Hash (this.load.atlas), nomes <sprite>/<anim>_<n>
def atlas(frames,png,js,larg=256,esp=2):
    """empacota em prateleiras, sem cortar (trimmed=false) e com 2 px entre quadros."""
    x=y=esp;hmax=0;pos=[]
    for nome,a in frames:
        h,w=a.shape
        if x+w+esp>larg: x=esp;y+=hmax+esp;hmax=0
        pos.append((nome,a,x,y));x+=w+esp;hmax=max(hmax,h)
    H=y+hmax+esp;H=1<<(H-1).bit_length();out=vazio(larg,H)
    J={'frames':{},'meta':{'app':'samuel-corredor/estilo/_src/build.py','version':'1.0','image':os.path.basename(png),'format':'RGBA8888','size':{'w':larg,'h':H},'scale':'1'}}
    for nome,a,x0,y0 in pos:
        h,w=a.shape;out[y0:y0+h,x0:x0+w]=a
        J['frames'][nome]={'frame':{'x':x0,'y':y0,'w':w,'h':h},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'sourceSize':{'w':w,'h':h}}
    p=salvar(out,png);J['meta']['image']=os.path.basename(p)
    assert not os.path.exists(js);json.dump(J,open(js,'w'),indent=1,ensure_ascii=False);return p,js
A=f'{R}/amostra_tecnica';os.makedirs(A,exist_ok=True)
fs=[(f'samuel/{k}_{n}',SL.POSES[k][n]) for k,n in ORD_SAM]
p,j=atlas(fs,f'{A}/samuel_atlas.png',f'{A}/samuel_atlas.json',larg=128);reg('amostra_atlas_samuel',p,json=os.path.relpath(j,R))
todos=list(fs)+[(f'doguinho/{k}_{n}',strip([PC.DOG[k][n]],28,24)) for k,n in ORD_DOG]
for n,d in INI.items():
    w,h=PC.INIMIGOS[n][1:];todos+=[(f'{n}/{a}_{k}',strip([q],w,h)) for a in d for k,q in enumerate(d[a])]
for n,(qs,w,h,an) in COLETA.items(): todos+=[(f'{n}/{an}_{k}',strip([q],w,h)) for k,q in enumerate(qs)]
for n,(w,h,an) in EFE.items(): todos+=[(f'{n}/{an}_{k}',strip([q],w,h,'centro')) for k,q in enumerate(UI.EFEITOS[n])]
p,j=atlas(todos,f'{A}/atlas_amostra.png',f'{A}/atlas_amostra.json',larg=256);reg('amostra_atlas_completo',p,json=os.path.relpath(j,R),quadros=len(todos))
# animações propostas (Phaser anims.create), tempos em quadros por segundo
ANIMS={'samuel/parado':{'frames':['samuel/parado_0'],'frameRate':1,'repeat':-1},'samuel/correr':{'frames':['samuel/correr_0','samuel/correr_1','samuel/correr_2','samuel/correr_1'],'frameRate':10,'repeat':-1},
 'samuel/pular':{'frames':['samuel/pular_0'],'frameRate':1,'repeat':0},'samuel/cair':{'frames':['samuel/cair_0'],'frameRate':1,'repeat':0},
 'samuel/dano':{'frames':['samuel/dano_0'],'frameRate':1,'repeat':0,'nota':'piscar com setVisible/alpha no código durante a invencibilidade'},
 'samuel/comemorar':{'frames':['samuel/comemorar_0','samuel/parado_0'],'frameRate':4,'repeat':3}}
j=f'{A}/samuel_anims.json';assert not os.path.exists(j);json.dump(ANIMS,open(j,'w'),indent=1,ensure_ascii=False);reg('amostra_anims_samuel',j)
p=salvar(np.concatenate([tira(TS[f]) for f in TS],0),f'{A}/tiles_amostra.png');reg('amostra_tiles',p,tile=16,nota='3 linhas (campo, floresta, caverna) x 12 colunas; firstgid 1 no Tiled = canto de cima à esquerda')
# medida da caixa opaca do Samuel (para sugerir hitbox)
m=SL.POSES['parado'][0]>=0;ys,xs=np.nonzero(m);MAN['samuel_caixa_opaca_parado']={'x':int(xs.min()),'y':int(ys.min()),'w':int(xs.max()-xs.min()+1),'h':int(ys.max()-ys.min()+1)}
json.dump(MAN,open('/tmp/gi/corredor_man.json','w'),indent=1,ensure_ascii=False)
print('ok',len(MAN['pecas']))

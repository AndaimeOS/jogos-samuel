"""Folha de estilo principal (sem texto), previas magenta/preto e manifesto.json. Nunca sobrescreve."""
import os, json, glob, numpy as np
from PIL import Image
R='/workspace/arte/samuel-corredor/estilo';BG=(230,238,234,255)
def im(p): return Image.open(f'{R}/{p}').convert('RGBA')
def zoom(i,k): return i.resize((i.width*k,i.height*k),Image.NEAREST)
def quadros(p,w,h,k=1,gap=4):
    i=im(p);n=i.width//w;out=Image.new('RGBA',((w+gap)*n-gap,h),(0,0,0,0))
    for j in range(n): out.alpha_composite(i.crop((j*w,0,(j+1)*w,h)),((w+gap)*j,0))
    return zoom(out,k)
def linha(pecas,gap=14,base=True):
    H=max(p.height for p in pecas);W=sum(p.width for p in pecas)+gap*(len(pecas)-1);o=Image.new('RGBA',(W,H),(0,0,0,0));x=0
    for p in pecas: o.alpha_composite(p,(x,H-p.height if base else 0));x+=p.width+gap
    return o
def main():
    secoes=[]
    secoes.append(linha([quadros('samuel/samuel-lado.png',32,48,4,6),quadros('doguinho/doguinho-lado.png',28,24,4,6)],30))
    secoes.append(linha([quadros('coleta/moeda.png',16,16,4),quadros('coleta/estrela.png',16,16,4),quadros('coleta/bandeira.png',32,64,3),
                         quadros('coleta/cogumelo.png',32,32,3),quadros('coleta/plataforma.png',48,16,3)],26))
    secoes.append(linha([quadros('inimigos/lesma.png',28,20,4),quadros('inimigos/besouro.png',24,20,4),quadros('inimigos/morcego.png',28,20,4),
                         quadros('efeitos/poeira.png',10,8,4),quadros('efeitos/pof.png',24,24,4),quadros('efeitos/brilho.png',9,9,4)],26))
    secoes.append(linha([zoom(im('tiles/tiles-3-fases.png'),3)]+[zoom(im(f'telas/tela-jogo-{f}-320x240__1x.png').crop((0,96,320,240)),2) for f in ('floresta',)],20))
    # fundos: composição sem fase por cima (1x) — usa as telas de floresta/caverna e o campo
    secoes.append(linha([im(f'telas/tela-jogo-{f}-320x240__1x.png') for f in ('campo','floresta','caverna')],16))
    bt=[quadros(f'controles/botao-{n}.png',t,t,3) for n,t in (('esquerda',32),('direita',32),('pular',40),('pausa',24),('tela-cheia',24),('proxima',40),('repetir',24))]
    secoes.append(linha(bt+[zoom(im('hud/coracao.png'),3),zoom(im('hud/coracao-vazio.png'),3),zoom(im('hud/painel-moedas-exemplo.png'),3),zoom(im('hud/digitos.png'),3)],18))
    secoes.append(linha([im('telas/tela-jogo-campo-320x240__1x.png'),im('telas/tela-jogo-campo-180x240__1x.png'),im('telas/mapa-3-fases-320x240__1x.png'),im('telas/mapa-3-fases-180x240__1x.png')],16))
    secoes.append(linha([im('telas/fase-vencida-320x240__1x.png'),im('telas/fase-vencida-180x240__1x.png')],16))
    W=max(s.width for s in secoes)+40;H=sum(s.height+28 for s in secoes)+20
    o=Image.new('RGBA',(W,H),BG);y=20
    for s in secoes:
        o.alpha_composite(s,(20,y));y+=s.height+14
        if s is not secoes[-1]:
            for x in range(20,W-20): o.putpixel((x,y),(200,208,206,255))
        y+=14
    p=f'{R}/folha_estilo_corredor.png';assert not os.path.exists(p);o.convert('RGB').save(p);print(p,o.size)
    # prévias magenta/preto de todas as peças soltas (não das telas)
    os.makedirs(f'{R}/previas',exist_ok=True)
    for grupo in ('samuel','doguinho','coleta','inimigos','efeitos','tiles','fundos','controles','hud','amostra_tecnica'):
        fs=sorted(glob.glob(f'{R}/{grupo}/**/*.png',recursive=True));blocos=[]
        for f in fs:
            i=Image.open(f).convert('RGBA');k=3 if i.width<200 else 1
            b=zoom(i,k);par=Image.new('RGBA',(b.width*2+6,b.height),(128,128,128,255))
            for j,c in enumerate([(255,0,255,255),(0,0,0,255)]):
                t=Image.new('RGBA',b.size,c);t.alpha_composite(b);par.paste(t,(j*(b.width+6),0))
            blocos.append(par)
        Wp=max(b.width for b in blocos)+20;Hp=sum(b.height+10 for b in blocos)+10;o=Image.new('RGB',(Wp,Hp),(70,70,70));y=10
        for b in blocos: o.paste(b.convert('RGB'),(10,y));y+=b.height+10
        p=f'{R}/previas/{grupo}_magenta_preto.png';assert not os.path.exists(p);o.save(p)
    man=json.load(open('/tmp/gi/corredor_man.json'))
    man['folha_principal']='folha_estilo_corredor.png';man['previas']=sorted(os.path.relpath(p,R) for p in glob.glob(f'{R}/previas/*.png'))
    man['_src']=sorted(os.path.relpath(p,R) for p in glob.glob(f'{R}/_src/*.py'))
    man['reaproveitado']={'samuel':'planeta-v2/estilo-v2 (samuel2.grade lado/frente, aprovado)','botoes_e_nos_do_mapa':'pescador-samuel/estilo/_src/controles_mapa.py (botao, ic_pausa, ic_tela_cheia, ic_seta, ic_repetir, no_fase, ponto, seta_marcador)'}
    p=f'{R}/manifesto.json';assert not os.path.exists(p);json.dump(man,open(p,'w'),indent=1,ensure_ascii=False);print(p)
if __name__=='__main__': main()

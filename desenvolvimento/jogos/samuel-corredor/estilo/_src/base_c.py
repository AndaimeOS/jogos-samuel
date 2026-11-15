"""Ferramentas de desenho (iguais às do Pescador, com a paleta do Corredor). -1 = transparente. Nunca sobrescreve."""
import numpy as np, os
from PIL import Image, ImageDraw
from paleta_corredor import i as I, para_rgba
class P:
 def __init__(s,w,h): s.im=Image.new('I',(w,h),-1);s.d=ImageDraw.Draw(s.im);s.w=w;s.h=h
 def e(s,b,f,oc='tinta'): s.d.ellipse(b,fill=I(f) if f else None,outline=I(oc) if oc else None,width=1)
 def r(s,b,f,oc=None): s.d.rectangle(b,fill=I(f) if f else None,outline=I(oc) if oc else None,width=1)
 def p(s,pts,f,oc=None): s.d.polygon(pts,fill=I(f) if f else None,outline=I(oc) if oc else None)
 def l(s,pts,f,w=1): s.d.line(pts,fill=I(f),width=w)
 def dot(s,x,y,f):
  if 0<=x<s.w and 0<=y<s.h: s.d.point((x,y),fill=I(f))
 def arr(s): return np.array(s.im).astype(int)
 def set(s,a): s.im=Image.fromarray(np.asarray(a).astype(np.int32),'I');s.d=ImageDraw.Draw(s.im)
 def cola(s,g,ox,oy): s.set(cola(s.arr(),g,ox,oy))
def cola(dst,g,ox,oy):
 a=dst.copy();H,W=g.shape;h,w=a.shape
 ys,xs=np.nonzero(g>=0);ty=ys+oy;tx=xs+ox;ok=(ty>=0)&(ty<h)&(tx>=0)&(tx<w)
 a[ty[ok],tx[ok]]=g[ys[ok],xs[ok]];return a
def vazio(w,h): return np.full((h,w),-1,int)
def contornar(a,cor='tinta'):
 a=a.copy();m=a>=0;o=np.zeros_like(m)
 o[1:,:]|=m[:-1,:];o[:-1,:]|=m[1:,:];o[:,1:]|=m[:,:-1];o[:,:-1]|=m[:,1:]
 a[o&~m]=I(cor);return a
def fechar(a,cor='tinta'):
 """Todo pixel colorido que encosta no transparente (ou na borda) vira contorno."""
 m=a>=0;o=np.pad(m,1);b=~(o[:-2,1:-1]&o[2:,1:-1]&o[1:-1,:-2]&o[1:-1,2:])&m;a=a.copy();a[b]=I(cor);return a
def tira(qs,gap=0):
 if gap: qs=sum([[q,vazio(gap,q.shape[0])] for q in qs],[])[:-1]
 return np.concatenate(qs,1)
def salvar(a,caminho):
 base,ext=os.path.splitext(caminho);k=1;c=caminho
 while os.path.exists(c): k+=1;c=f"{base}_v{k}{ext}"
 os.makedirs(os.path.dirname(c),exist_ok=True);para_rgba(np.asarray(a,dtype=int)).save(c);return c

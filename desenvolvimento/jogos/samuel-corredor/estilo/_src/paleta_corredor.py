"""Paleta do Samuel Corredor = paleta do Pescador (estilo-v2 + derivados de água) + alguns derivados para fundos de lado.
Os novos tons ficam NO FIM da lista, então os índices das peças reaproveitadas do Pescador continuam valendo. Contorno = tinta #193337."""
import sys, numpy as np
sys.path.insert(0,'/workspace/arte/pescador-samuel/estilo/_src')
import paleta_pescador as _pp
PALETA=list(_pp.PALETA)+[
 ("ceu_luz","#CFEFFF"),("morro","#A9DE8E"),("morro_longe","#C4E9B4"),
 ("mata_longe","#6FB58A"),("mata_fundo","#4E9774"),
 ("caverna","#2B4652"),("caverna_fundo","#223841"),
 ("castelo_longe","#7E7FA8"),("castelo_luz","#A3A5C8"),
]
NOMES=[n for n,_ in PALETA]
RGB=np.array([[int(h[k:k+2],16) for k in (1,3,5)] for _,h in PALETA],dtype=np.uint8)
def i(n): return NOMES.index(n)
def c(n): return tuple(int(v) for v in RGB[i(n)])
def para_rgba(g):
    from PIL import Image
    H,W=g.shape;o=np.zeros((H,W,4),np.uint8);m=g>=0;o[m,:3]=RGB[g[m]];o[m,3]=255
    return Image.fromarray(o,"RGBA")
assert NOMES[:len(_pp.NOMES)]==_pp.NOMES

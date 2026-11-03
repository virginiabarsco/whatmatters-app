import math
r3=math.sqrt(3)
def net(s,ox,oy): return dict(A=(ox,oy),B=(ox,oy+s),C=(ox+s*r3/2,oy+s/2),M1=(ox,oy+s/2),M2=(ox+s*r3/4,oy+s/4),M3=(ox+s*r3/4,oy+3*s/4))
def nrm(p,q):
    dx,dy=q[0]-p[0],q[1]-p[1]; n=math.hypot(dx,dy); return -dy/n,dx/n
def add(p,v,d): return (p[0]+v[0]*d,p[1]+v[1]*d)
def shorten(p,q,g):
    dx,dy=q[0]-p[0],q[1]-p[1]; n=math.hypot(dx,dy); ux,uy=dx/n,dy/n
    return (p[0]+ux*g,p[1]+uy*g),(q[0]-ux*g,q[1]-uy*g)
def L(p,q,c,w): return '<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" stroke="%s" stroke-width="%.2f" stroke-linecap="round"/>'%(p[0],p[1],q[0],q[1],c,w)
def PL(pts,c,w): return '<polyline points="%s" fill="none" stroke="%s" stroke-width="%.2f" stroke-linejoin="round" stroke-linecap="round"/>'%(' '.join('%.2f,%.2f'%p for p in pts),c,w)
def draw(v,s,ox,oy,O,C,K,cw):
    P=net(s,ox,oy); A,B,Cc,M1,M2,M3=[P[k] for k in ['A','B','C','M1','M2','M3']]
    ow=cw*0.55; o=[]
    nv=nrm(M2,M3)  # points left (-x) for downward segment
    if v==0:
        g=cw*0.55
        o+=[L(A,M2,K,ow*0.5),L(B,M3,K,ow*0.5)]
        o+=[L(add(M2,nv,g),add(M3,nv,g),C,cw),L(add(M2,nv,-g),add(M3,nv,-g),O,cw)]
        o+=[L(A,M1,O,cw),L(M1,M2,O,cw),L(M3,Cc,O,cw),L(B,M1,C,cw),L(M1,M3,C,cw),L(M2,Cc,C,cw)]
    elif v==1:
        g=cw/2
        o+=[L(A,M2,K,ow),L(B,M3,K,ow)]
        o.append(PL([B,M1,M3 and add(M3,nv,g),add(M2,nv,g),Cc],C,cw))
        o.append(PL([A,M1,add(M2,nv,-g),add(M3,nv,-g),Cc],O,cw))
    else:
        gap=cw*1.05; g=cw*0.62
        def seg(p,q,c,w,dx=None):
            if dx is not None: p,q=add(p,nv,dx),add(q,nv,dx)
            a,b=shorten(p,q,gap); return L(a,b,c,w)
        o+=[seg(A,M2,K,ow),seg(B,M3,K,ow)]
        o+=[seg(M2,M3,C,cw,g),seg(M2,M3,O,cw,-g)]
        o+=[seg(A,M1,O,cw),seg(M1,M2,O,cw),seg(M3,Cc,O,cw),seg(B,M1,C,cw),seg(M1,M3,C,cw),seg(M2,Cc,C,cw)]
        if v==3:
            for p in [A,B,Cc,M1,M2,M3]: o.append('<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s"/>'%(p[0],p[1],cw*0.62,K))
    return ''.join(o)
DK=dict(bg='#060A12',O='#FF9A1F',C='#3FE0FF',K='#E8F4FF')
LT=dict(bg='#FFFFFF',O='#EE8400',C='#0AA9C2',K='#0B1726')
def tile(v,T,px,s_rel=0.74,cw_rel=None):
    s=100*s_rel; w=s*r3/2; ox=(100-w)/2+4; oy=(100-s)/2
    cw = cw_rel if cw_rel else 5.2
    return '<svg width="%d" height="%d" viewBox="0 0 100 100" style="display:block;background:%s">%s</svg>'%(px,px,T['bg'],draw(v,s,ox,oy,T['O'],T['C'],T['K'],cw))
info=[(0,'A · COMO ESTÁ AHORA','Diez líneas sueltas: se pisan en los vértices y la arista del medio queda doble con una separación.'),
 (1,'B · DOS TRAZOS CONTINUOS','La W y la M son un solo trazo cada una, con uniones redondeadas. En el medio, los dos colores corren pegados: la arista compartida es el acuerdo.'),
 (2,'C · UN TRAZO POR PERSONA','Cada línea es una pieza separada; los vértices quedan abiertos. Se lee que cada línea es alguien y que el conjunto se arma entre todas.'),
 (3,'D · PERSONAS Y ACUERDOS','Como la C, con un punto en cada vértice: las líneas son personas y los puntos son los encuentros donde se ponen de acuerdo.')]
rows=''
for v,t,d in info:
    small=''.join('<div style="display:flex;flex-direction:column;align-items:center;gap:4px">%s<span style="font-size:10px;color:#6B7A8C">%d px</span></div>'%(tile(v,T,z,cw_rel=(9 if z<=32 else 6.5)),z) for T in (DK,LT) for z in (48,32,20))
    rows+=('<div style="display:grid;grid-template-columns:200px 200px 1fr;gap:18px;align-items:start">%s%s'
      '<div style="display:flex;flex-direction:column;gap:10px"><span style="font-family:Saira,sans-serif;font-weight:600;font-size:13px;letter-spacing:.18em;color:#0B1726">%s</span>'
      '<p style="margin:0;font-size:13px;line-height:1.5;color:#33465C">%s</p><div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">%s</div></div></div>')%(tile(v,DK,200),tile(v,LT,200),t,d,small)
body=('<div style="width:840px;box-sizing:border-box;padding:28px;background:#F1F5F9;font-family:\'Atkinson Hyperlegible\',sans-serif;display:flex;flex-direction:column;gap:28px">'
 '<span style="font-family:Saira,sans-serif;font-weight:600;font-size:12px;letter-spacing:.22em;color:#077A90">CÓMO PROLIJAR LAS LÍNEAS · CUATRO CAMINOS</span>%s</div>')%rows
import importlib.util
spec=importlib.util.spec_from_file_location('b','build.py')
tpl=open('build.py').read()
start=tpl.index("def wrap(title,body,w,h):"); end=tpl.index("proj='../arboles/project/'")
ns={}; exec(tpl[start:end],ns)
open('../arboles/project/Logo-Variantes.dc.html','w').write(ns['wrap']('Logo · variantes de trazo',body,840,1020))
open('p3.html','w').write('<html><body style="margin:0">'+body+'</body></html>')

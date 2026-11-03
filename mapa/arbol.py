# -*- coding: utf-8 -*-
"""Dibuja el mapa de los árboles con la misma geometría que usa la app,
para poder verlo en la simulación sin tener que abrir la app."""
import math, json
R0=300.0; L0=R0*math.sqrt(3); RATIO=0.5
OFF=[0,90,-90,45,-45,132,-132,22,-22,68,-68,112,-112,11,-11,34,-34,56,-56,79]
def mlen(p): return 0 if p=='' else len(p.split('.'))
def mparent(p):
    s=p.split('.'); s.pop(); return '.'.join(s)
def slots(b): return ['1','2','3'] if b=='' else [b+'.1',b+'.2',b+'.3']
def pid_of(slot):
    q=str(slot).split('.')
    while len(q)>1 and q[-1]=='1': q.pop()
    return '.'.join(q)
def deg(dx,dy): return (math.degrees(math.atan2(dy,dx))+360)%360
PT={}; GR={}
def mpoint(pid):
    if pid in PT: return PT[pid]
    if mlen(pid)==1:
        a={'1':0.0,'2':120.0,'3':240.0}[pid]
        p={'x':R0*math.cos(math.radians(a)),'y':R0*math.sin(math.radians(a)),'out':a}
    else:
        g=mgroup(mparent(pid))
        p=g['B'] if pid[-1]=='2' else g['C']
    PT[pid]=p; return p
def mgroup(b):
    if b in GR: return GR[b]
    if b=='':
        g={'A':mpoint('1'),'B':mpoint('2'),'C':mpoint('3'),'k':0,'L':L0,'th':0.0}
    else:
        anchor=pid_of(b); A=mpoint(anchor); j=mlen(b)-mlen(anchor); k=mlen(b)
        L=L0*(RATIO**k); th=A['out']+OFF[j%len(OFF)]
        r1=math.radians(th-30); r2=math.radians(th+30)
        B={'x':A['x']+L*math.cos(r1),'y':A['y']+L*math.sin(r1)}
        C={'x':A['x']+L*math.cos(r2),'y':A['y']+L*math.sin(r2)}
        cx=(A['x']+B['x']+C['x'])/3; cy=(A['y']+B['y']+C['y'])/3
        B['out']=deg(B['x']-cx,B['y']-cy); C['out']=deg(C['x']-cx,C['y']-cy)
        g={'A':A,'B':B,'C':C,'k':k,'L':L,'th':th}
    GR[b]=g; return g
# ---- red de ejemplo: la semilla llena y algunas tríadas abiertas ----
W,H=560.0,560.0
def encuadre(prof, pad=54.0):
    xs=[]; ys=[]
    def walk(b):
        g=mgroup(b)
        for k in ('A','B','C'): xs.append(g[k]['x']); ys.append(g[k]['y'])
        if g['k']+1 < prof:
            for s_ in slots(b): walk(s_)
    walk('')
    z=min((W-2*pad)/(max(xs)-min(xs)), (H-2*pad)/(max(ys)-min(ys)))
    return z, W/2 - z*(min(xs)+max(xs))/2, H/2 - z*(min(ys)+max(ys))/2
def render(GENTE, INVIT, prof=3):
    z,tx,ty=encuadre(prof)
    def scr(p): return (p['x']*z+tx, p['y']*z+ty)
    tris=[]; dots=[]; labs=[]
    def visit(b):
        g=mgroup(b); k=g['k']; alc=k+1
        if alc>prof: return
        pts=[scr(g['A']),scr(g['B']),scr(g['C'])]
        abierta = b=='' or pid_of(b) in GENTE
        lleno = abierta and all(pid_of(s) in GENTE for s in slots(b))
        col='var(--s%d)'%(((alc-1)%8)+1)
        if abierta:
            tris.append('<polygon class="a%d" points="%s" fill="%s" fill-opacity="%s" stroke="%s" stroke-width="%s" stroke-linejoin="round"/>'%(
                alc,' '.join('%.1f,%.1f'%p for p in pts),col,'.16' if lleno else '.04',col,3 if b=='' else (2.5 if lleno else 2)))
            tris.append('<text class="num a%d" x="%.1f" y="%.1f" font-size="%s" fill="%s">%s</text>'%(
                alc,(pts[0][0]+pts[1][0]+pts[2][0])/3,(pts[0][1]+pts[1][1]+pts[2][1])/3,
                max(11,min(26,g['L']*z/6)), col, ('A1 de %d'%prof) if b=='' else 'A%d'%alc))
        else:
            tris.append('<polygon class="a%d" points="%s" fill="none" stroke="%s" stroke-opacity=".38" stroke-width="1.5" stroke-dasharray="5 5"/>'%(
                alc,' '.join('%.1f,%.1f'%p for p in pts),col))
            return
        for sl,P in ((slots(b)[1],g['B']),(slots(b)[2],g['C'])) if b!='' else (('1',g['A']),(slots(b)[1],g['B']),(slots(b)[2],g['C'])):
            punto(pid_of(sl),P)
        for s in slots(b): visit(s)
    def punto(pid,P):
        x,y=scr(P)
        alc=mlen(pid)                       # el alcance por el que entró
        est=['--cp:var(--p%s)'%pid.replace('.','_') if pid in GENTE else '--cp:var(--muted)',
             '--ce:var(--s%d)'%(((alc-1)%8)+1),     # color del triángulo por el que entró
             '--co:var(--s%d)'%((alc%8)+1)]         # color del triángulo que abre
        st=';'.join(est)
        if pid in GENTE:
            dots.append('<circle class="pt" style="%s" cx="%.1f" cy="%.1f" stroke="var(--ink)" stroke-width="2"/>'%(st,x,y))
            labs.append('<text class="lbl pid" x="%.1f" y="%.1f">P%s</text><text class="lbl" x="%.1f" y="%.1f">%s</text>'%(x+13,y-20,pid,x+13,y-9,GENTE[pid]))
        elif pid in INVIT:
            dots.append('<circle class="pt inv" style="%s" cx="%.1f" cy="%.1f" fill="var(--sap-soft)" stroke="var(--sap)" stroke-width="2.5"/>'%(st,x,y))
        else:
            dots.append('<circle class="pt libre" style="%s" cx="%.1f" cy="%.1f" fill="var(--m-land)" stroke-width="1.5"/>'%(st,x,y))
    visit('')
    ciudad='<g transform="matrix(%s,0,0,%s,%s,%s)"><use href="#mvdCiudad" transform="translate(-1700,-1063) scale(2.125)"/></g>'%(z,z,tx,ty)
    return ('<svg class="arbolsvg" viewBox="0 0 %d %d" width="100%%" height="100%%">%s%s%s%s</svg>'
            %(W,H,ciudad,''.join(tris),''.join(dots),''.join(labs)))
G1={'1':'Virginia','2':'Ana','3':'Bruno Díaz','2.3':'Carla Ruiz','1.3':'Diego Paz','2.2':'Elena Sosa','3.2':'Félix Mora','1.2':'Gala Ríos'}
G2={'1':'Ana','2':'Elena Sosa','3':'Félix Mora'}
open('arbol1.svg','w').write(render(G1,{'3.3':1},3))
open('arbol2.svg','w').write(render(G2,{},2))
print('ok')

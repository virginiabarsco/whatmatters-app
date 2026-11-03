# -*- coding: utf-8 -*-
"""Arma "Ver la red" con las mismas piezas y clases que la app."""
import html
def esc(x): return html.escape(x,quote=True)
def mlen(p): return len(p.split('.'))
def slots(b): return ['1','2','3'] if b=='' else [b+'.1',b+'.2',b+'.3']
def pid_of(s):
    q=s.split('.')
    while len(q)>1 and q[-1]=='1': q.pop()
    return '.'.join(q)
def sc(a): return 'var(--s%d)'%(((a-1)%8)+1)
ARB=[
 dict(id='a',nombre='Confianza que se construye',tipo='Temático',desc='Montevideo',tag=('semilla','Semilla'),D=3,
      gente={'1':'Virginia Barsco','2':'Ana Torres','3':'Bruno Díaz','2.3':'Carla Ruiz','1.3':'Diego Paz','2.2':'Elena Sosa','3.2':'Félix Mora','1.2':'Gala Ríos'},
      inv={'3.3'}, n=8),
 dict(id='b',nombre='Reportajes importantes',tipo='Temático',desc='Punta del Este',tag=('semilla','Semilla'),D=2,
      gente={'1':'Ana Torres','2':'Elena Sosa','3':'Félix Mora'}, inv=set(), n=3),
]
def tcard(t,cur):
    return ('<div class="titem" data-q="%s"><button type="button" class="tcard%s" data-tree="%s"%s><b>%s</b><span class="row"><span class="tag %s">%s</span><span class="tag">%s</span><span class="small muted">%d personas</span></span></button></div>'
      %(esc(t['q']),' cur' if cur else '',t['id'],' aria-current="true"' if cur else '',esc(t['nombre']),t['tag'][0],t['tag'][1],t['tipo'],t['n']))
def sheetname(t,slot):
    pid=pid_of(slot)
    if pid in t['gente']:
        return '<button type="button" class="pname" data-pid="%s"><span class="sdot" style="background:%s"></span>%s</button>'%(pid,sc(mlen(pid)),esc(t['gente'][pid]))
    if slot==pid and pid in t['inv']: return '<span class="sinv">invitada</span>'
    return ''
def lista(t):
    D=t['D']; rows=[]
    def gen(s):
        if s!='' and mlen(s)>=D: rows.append(s); return
        for x in slots(s): gen(x)
    gen('')
    full=lambda r: pid_of(r) in t['gente']
    nl=sum(1 for r in rows if full(r))
    size={}
    for r in rows:
        seg=r.split('.')
        for a in range(1,len(seg)):
            k='.'.join(seg[:a]); size[k]=size.get(k,0)+1
    h='<div class="ltools"><div class="lfilt" role="group" aria-label="Qué posiciones mostrar">'
    for k,lab,n in (('todas','Todas',len(rows)),('llenas','Llenas',nl),('vacias','Vacías',len(rows)-nl)):
        h+='<button type="button" data-lfilt="%s" aria-pressed="%s">%s <small>%d</small></button>'%(k,'true' if k=='todas' else 'false',lab,n)
    h+='</div></div><div class="sheet-wrap"><table class="sheet"><thead><tr>'
    for a in range(1,D+1): h+='<th colspan="2" class="a%d%s">Alcance %d</th>'%(a%2,' fix' if a==1 else '',a)
    h+='</tr></thead><tbody>'
    prev=None
    for r in rows:
        seg=r.split('.'); brk=0
        if prev:
            for i in range(max(len(seg),len(prev))):
                if (seg[i] if i<len(seg) else None)!=(prev[i] if i<len(prev) else None): brk=i+1;break
        h+='<tr data-r="%s" data-full="%d" class="%s">'%(r,1 if full(r) else 0,'b1' if brk==1 else 'b2' if brk==2 and D>2 else '')
        for a in range(1,D+1):
            cls=' a%d%s'%(a%2,' fix' if a==1 else '')
            slot='.'.join(seg[:a]); first=a<=len(seg) and (prev is None or '.'.join(prev[:a])!=slot)
            if not first: h+='<td class="pos%s"></td><td class="nm%s"></td>'%(cls,cls); continue
            fold='<button type="button" class="fold" data-fold="%s" aria-label="Plegar P%s">−</button>'%(slot,slot) if a<len(seg) and size.get(slot,0)>1 else ''
            h+='<td class="pos%s">%sP%s</td><td class="nm%s">%s</td>'%(cls,fold,slot,cls,sheetname(t,slot))
        h+='</tr>'; prev=seg
    return h+'</tbody></table></div>'
def leyenda(D):
    h=''.join('<span class="sw" style="--c:%s"><i></i><b>A%d</b></span>'%(sc(a),a) for a in range(1,min(D,5)+1))
    h+='<span>alcance de las posiciones de cada tríada · árbol A%d</span><span>el color dice el alcance; el borde, el estado de la posición</span>'%D
    h+='<span><i style="background:%s;border:2px solid var(--ink)"></i>ocupada</span><span><i style="border:2px solid var(--ink)"></i>convocada</span><span><i style="border:2px solid %s"></i>libre</span>'%(sc(1),sc(1))
    return '<div class="legend mlegend">%s</div>'%h
def build(logo,mapas):
    for t in ARB: t['q']=' '.join([t['nombre'],t['tipo'],t['desc']]).lower()
    h='<h2>La red hoy</h2><div class="cifras"><span><b>8</b> personas</span><span><b>2</b> árboles</span></div>'
    h+='<details class="otros" open><summary><span class="oicon"><svg viewBox="0 0 100 100" width="24" height="24" aria-hidden="true">%s</svg></span><span class="otit">Árboles de la red</span><span class="ocount">2</span></summary>'%logo
    h+='<div class="obody"><p class="small muted">Todos los árboles están a la vista: al tocar uno se ven su mapa y su gente.</p>'
    h+='<div class="search"><input id="tq" type="search" placeholder="Buscar un árbol" autocomplete="off" aria-label="Buscar un árbol por nombre, tipo o lugar"></div>'
    h+='<div class="tlist" id="tlistAll">'+''.join(tcard(t,i==0) for i,t in enumerate(ARB))+'</div><p class="small muted" id="tqNone" hidden>No hay ningún árbol con ese nombre.</p></div></details>'
    for i,t in enumerate(ARB):
        h+='<div class="arb" data-arb="%s"%s>'%(t['id'],'' if i==0 else ' hidden')
        h+='<div class="tbar"><span><span class="k">Árbol</span><span class="v">%s</span></span></div>'%esc(t['nombre'])
        h+='<div class="tdesc"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="tag">%s</span><span class="small">%s</span></div></div>'%(t['tipo'],esc(t['desc']))
        h+='<div class="tabs" role="tablist" aria-label="Cómo ver la red"><button type="button" role="tab" data-tab="mapa" aria-selected="true">Mapa</button><button type="button" role="tab" data-tab="lista" aria-selected="false">Lista</button></div>'
        h+='<div class="search"><input type="search" class="pq" placeholder="Buscar a una persona" autocomplete="off" aria-label="Buscar a una persona"><div class="sres" hidden></div></div>'
        h+='<div class="vmapa"><div class="panelarbol d2">%s</div>%s</div>'%(mapas[i],leyenda(t['D']))
        h+='<div class="vlista" hidden>%s</div>'%lista(t)
        h+='</div>'
    return h

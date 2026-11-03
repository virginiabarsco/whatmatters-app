import json, math, sys
import os
R=os.environ.get('GEOJSON_MVD', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'geojson_montevideo'))+'/'
S=1600
# ventana geográfica (cuadrada en kilómetros) centrada como la foto de Google Earth
LON0,LON1=-56.2290,-56.1140
LATC=-34.9055
kmlon=111.320*math.cos(math.radians(LATC)); kmlat=110.574
dlon=LON1-LON0
dlat=dlon*kmlon/kmlat          # para que el pixel sea cuadrado
LAT1=LATC+dlat*0.42            # borde norte
LAT0=LAT1-dlat
def px(lon,lat): return ((lon-LON0)/dlon*S, (LAT1-lat)/dlat*S)
def dentro(x,y,m=260): return -m<=x<=S+m and -m<=y<=S+m
def simplifica(pts, tol=1.6):
    out=[pts[0]]
    for p in pts[1:]:
        if (p[0]-out[-1][0])**2+(p[1]-out[-1][1])**2 >= tol*tol: out.append(p)
    if len(out)<3: return None
    return out
# ---------- barrios: la tierra ----------
d=json.load(open(R+'barrios.geojson', encoding='latin-1'))
anillos=[]
for f in d['features']:
    g=f['geometry']; cs=g['coordinates']
    polis = cs if g['type']=='MultiPolygon' else [cs]
    for poli in polis:
        for k,anillo in enumerate(poli):
            pts=[px(c[0],c[1]) for c in anillo]
            if not any(dentro(x,y) for x,y in pts): continue
            s=simplifica(pts)
            if s: anillos.append((f['properties'].get('BARRIO') or '', k, s))
print('anillos', len(anillos), 'barrios', len(d['features']), file=sys.stderr)
def dpath(pts): return 'M '+' L '.join('%.0f,%.0f'%p for p in pts)+' Z'
def dpaths(ss): return ' '.join(dpath(p) for p in ss)
TIERRA_PATHS=''.join('<path d="%s"/>'%dpath(s) for _,k,s in anillos if k==0)
# ---------- cruces: las calles reales ----------
c=json.load(open(R+'cruces.geojson', encoding='latin-1'))
calles={}
for f in c['features']:
    p=f['properties']; lon,lat=f['geometry']['coordinates']
    x,y=px(lon,lat)
    if not dentro(x,y,60): continue
    for i in (1,2):
        cid=p.get('calle_%d_id'%i); nom=p.get('calle_%d_nombre'%i) or ''
        if cid is None: continue
        calles.setdefault(cid,[nom,[]])[1].append((x,y))
print('calles en ventana', len(calles), file=sys.stderr)
def encadenar(pts, salto=150.0):
    """Arma el recorrido de una calle uniendo cada esquina con la más cercana.
    Con PCA las calles curvas salían como garabatos; así siguen su curva real."""
    if len(pts)<2: return []
    n=len(pts)
    mx=sum(p[0] for p in pts)/n; my=sum(p[1] for p in pts)/n
    inicio=max(range(n), key=lambda i:(pts[i][0]-mx)**2+(pts[i][1]-my)**2)
    libres=set(range(n)); libres.discard(inicio)
    cam=[pts[inicio]]; act=pts[inicio]
    tramos=[]
    while libres:
        j=min(libres, key=lambda i:(pts[i][0]-act[0])**2+(pts[i][1]-act[1])**2)
        d=math.hypot(pts[j][0]-act[0], pts[j][1]-act[1])
        if d>salto:
            if len(cam)>=2: tramos.append(cam)
            cam=[pts[j]]
        else:
            cam.append(pts[j])
        libres.discard(j); act=pts[j]
    if len(cam)>=2: tramos.append(cam)
    return tramos
def enderezar(t, tol=3.2):
    """Las esquinas no caen perfectamente alineadas y el trazo sale temblando.
    Douglas-Peucker: si todos los puntos del medio están a menos de `tol` de la
    recta que une los extremos, el tramo se vuelve esa recta."""
    if len(t) < 3: return t
    ax, ay = t[0]; bx, by = t[-1]
    dx, dy = bx-ax, by-ay; n = math.hypot(dx, dy)
    if n < 1e-9:
        peor, idx = 0.0, 1
        for i in range(1, len(t)-1):
            d = math.hypot(t[i][0]-ax, t[i][1]-ay)
            if d > peor: peor, idx = d, i
    else:
        peor, idx = 0.0, 1
        for i in range(1, len(t)-1):
            d = abs((t[i][0]-ax)*dy - (t[i][1]-ay)*dx) / n
            if d > peor: peor, idx = d, i
    if peor <= tol: return [t[0], t[-1]]
    izq = enderezar(t[:idx+1], tol); der = enderezar(t[idx:], tol)
    return izq[:-1] + der
def cortar_quiebres(t, grados=60.0):
    """Parte el recorrido donde gira demasiado: ahí no es la misma recta."""
    if len(t)<3: return [t]
    out=[]; cur=[t[0],t[1]]
    lim=math.cos(math.radians(180-grados))
    for a,b,c in zip(t,t[1:],t[2:]):
        v1=(b[0]-a[0],b[1]-a[1]); v2=(c[0]-b[0],c[1]-b[1])
        n1=math.hypot(*v1); n2=math.hypot(*v2)
        cosang=((v1[0]*v2[0]+v1[1]*v2[1])/(n1*n2)) if n1 and n2 else 1.0
        if cosang < lim:
            if len(cur)>=2: out.append(cur)
            cur=[b,c]
        else:
            cur.append(c)
    if len(cur)>=2: out.append(cur)
    return out
vias=[]; avenidas=[]
for cid,(nom,pts) in calles.items():
    if len(pts)<2: continue
    tramos=[]
    for t in encadenar(pts):
        for q in cortar_quiebres(t):
            r = enderezar(q)
            if len(r) >= 2 and math.hypot(r[-1][0]-r[0][0], r[-1][1]-r[0][1]) > 5: tramos.append(r)
    es_av = nom.startswith('AV ') or nom.startswith('AVDA') or 'RAMBLA' in nom or 'BV ' in nom
    for t in tramos:
        if len(t)<2: continue
        (avenidas if es_av else vias).append(t)
print('vias',len(vias),'avenidas',len(avenidas), file=sys.stderr)
def lineas(ts, col, w, op):
    d=' '.join('M '+' L '.join('%.0f,%.0f'%p for p in t) for t in ts)
    return '<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="%s" stroke-linecap="round" stroke-linejoin="round"/>'%(d,col,w,op)
# ---------- verdes: donde no hay esquinas pero sí tierra ----------
def en_anillo(x,y,anillo):
    d=False; n=len(anillo)
    for i in range(n):
        x0,y0=anillo[i]; x1,y1=anillo[(i+1)%n]
        if (y0>y)!=(y1>y) and x < (x1-x0)*(y-y0)/(y1-y0)+x0: d=not d
    return d
EXT=[s for _,k,s in anillos if k==0]
def hay_tierra(x,y): return any(en_anillo(x,y,a) for a in EXT)
CEL=14; RAD=30
ocupado=set()
for cid,(nom,pts) in calles.items():
    for x,y in pts:
        ci,cj=int(x//CEL),int(y//CEL)
        rr=int(RAD//CEL)
        for a in range(ci-rr,ci+rr+1):
            for b in range(cj-rr,cj+rr+1):
                ocupado.add((a,b))
verdes=[]
for ci in range(0,S//CEL):
    for cj in range(0,S//CEL):
        if (ci,cj) in ocupado: continue
        x=ci*CEL+CEL/2; y=cj*CEL+CEL/2
        if not hay_tierra(x,y): continue
        verdes.append((ci*CEL,cj*CEL))
print('celdas verdes', len(verdes), file=sys.stderr)
VERDE='<path fill="var(--m-park)" fill-opacity=".62" d="%s"/>'%' '.join('M %d,%d h%d v%d h-%d Z'%(x-2,y-2,CEL+4,CEL+4,CEL+4) for x,y in verdes)
# ---------- tríadas ----------
def triadas(op=0.78, clusters=((470,470,-8,290),(1120,360,158,240),(830,760,-104,185),(330,655,-20,100),(1370,570,200,150))):
    o=[]
    def en_tierra(p):
        x,y=p
        if not (20<x<S-20 and 20<y<S-20): return False
        return all(hay_tierra(x+dx,y+dy) for dx,dy in ((0,0),(9,0),(-9,0),(0,9),(0,-9),(7,7),(-7,-7),(7,-7),(-7,7)))
    def tri(ax,ay,th,L):
        t1=math.radians(th-30); t2=math.radians(th+30)
        return (ax,ay),(ax+L*math.cos(t1),ay+L*math.sin(t1)),(ax+L*math.cos(t2),ay+L*math.sin(t2))
    def dib(ax,ay,th,L,prof,niv,probar=False,rt=.56):
        # prueba ajustes de giro y de tamaño hasta que los tres vértices queden en tierra
        opciones=[(0,1)] if not probar else [(d,k) for k in (1,.8,.65,.5) for d in (0,14,-14,28,-28)]
        for d,k in opciones:
            A,B,C=tri(ax,ay,th+d,L*k)
            if all(en_tierra(p) for p in (A,B,C)): break
        else:
            return
        th=th+d; L=L*k
        cen=((A[0]+B[0]+C[0])/3.,(A[1]+B[1]+C[1])/3.)
        cls='t%d'%min(niv,4)
        gw=(2.6,1.8,1.3,1.5,1.5)[min(niv,4)]; fo=(.075,.05,.04,.08,.1)[min(niv,4)]
        o.append('<polygon class="%s" points="%s" fill-opacity="%.3f" stroke-opacity="%.3f" stroke-width="%.1f" stroke-linejoin="round"/>'%(
            cls,' '.join('%.1f,%.1f'%p for p in (A,B,C)),op*fo,op*(1. if niv==0 else .72 if niv==1 else .6 if niv==2 else .8),gw))
        for V in (A,B,C):
            o.append('<circle class="%s" cx="%.1f" cy="%.1f" r="%.1f" fill-opacity="%.2f"/>'%(cls,V[0],V[1],(4.2,3.,2.2,2.6,2.6)[min(niv,4)],min(.9,op*1.5)))
        if prof>0:
            for ix,V in enumerate((A,B,C)):
                dib(V[0],V[1],math.degrees(math.atan2(V[1]-cen[1],V[0]-cen[0])),L*rt,prof-1,niv+1,True,rt)
    for c in clusters: dib(c[0],c[1],c[2],c[3],c[4] if len(c)>4 else 2,0,True,.64 if len(c)>4 and c[4]>3 else .56)
    return ''.join(o)
DEFS=('<defs><clipPath id="tierra">%s</clipPath>'
 '<radialGradient id="vig" cx="50%%" cy="46%%" r="74%%">'
 '<stop offset="0" stop-color="#fff" stop-opacity=".60"/><stop offset=".45" stop-color="#fff" stop-opacity=".86"/>'
 '<stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>'
 '<filter id="sv" x="-8%%" y="-8%%" width="116%%" height="116%%"><feGaussianBlur stdDeviation="7"/></filter>'
 '<mask id="vg"><rect x="0" y="0" width="%d" height="%d" fill="url(#vig)"/></mask></defs>')%(TIERRA_PATHS,S,S)
ciudad=(
 '<rect x="0" y="0" width="%d" height="%d" fill="var(--m-water)"/>'%(S,S)
 # la orilla: se dibuja el contorno grueso y después se tapa con el relleno, así solo queda el borde exterior
 +'<path d="%s" fill="none" stroke="var(--m-sand)" stroke-width="9" stroke-opacity=".55"/>'%dpaths([s for _,k,s in anillos if k==0])
 +'<path d="%s" fill="var(--m-land)"/>'%dpaths([s for _,k,s in anillos if k==0])
 +'<g clip-path="url(#tierra)">'
   + '<g filter="url(#sv)">'+VERDE+'</g>'
   + lineas(vias,'var(--m-ave)','2.4','.5')
   + lineas(avenidas,'var(--m-ave)','6.5','.85')
   + '<path d="%s" fill="none" stroke="var(--m-barrio)" stroke-width="1.6" stroke-opacity=".5"/>'%dpaths([s for _,k,s in anillos if k==0])
 +'</g>')
# La ciudad va en <defs> con un id: la usa el fondo de la página y también el panel del árbol,
# así el mapa se dibuja una sola vez en el archivo.
CIUDAD=(
 '<rect x="0" y="0" width="%d" height="%d" fill="var(--m-water)"/>'%(S,S)
 +'<path d="%s" fill="none" stroke="var(--m-sand)" stroke-width="9" stroke-opacity=".55"/>'%dpaths([s for _,k,s in anillos if k==0])
 +'<path d="%s" fill="var(--m-land)"/>'%dpaths([s for _,k,s in anillos if k==0])
 +'<g clip-path="url(#tierra)">'
   + lineas(vias,'var(--m-ave)','2.4','.5')
   + lineas(avenidas,'var(--m-ave)','6.5','.85')
   + '<path d="%s" fill="none" stroke="var(--m-barrio)" stroke-width="1.6" stroke-opacity=".5"/>'%dpaths([s for _,k,s in anillos if k==0])
 +'</g>')
VERDE_G='<g filter="url(#sv)">'+VERDE+'</g>'
CIUDAD=CIUDAD.replace('<g clip-path="url(#tierra)">','<g clip-path="url(#tierra)">'+VERDE_G,1)
TRIADAS=triadas()
escena='<g mask="url(#vg)"><g id="mvdCiudad">'+CIUDAD+'</g><g clip-path="url(#tierra)">'+TRIADAS+'</g></g>'
SVG=('<svg viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid slice" width="100%%" height="100%%" aria-hidden="true">%s%s</svg>')%(S,S,DEFS,escena)
open('mapa.svg','w').write(SVG)
open('mapa-defs.svg','w').write(DEFS)
open('mapa-ciudad.svg','w').write(CIUDAD)
open('mapa-triadas.svg','w').write(TRIADAS)
json.dump({'C':SVG},open('bgs-aerea.json','w')); print('svg bytes', len(SVG), file=sys.stderr)

import math, json
r3=math.sqrt(3)
def net(s, ox, oy):
    A=(ox,oy); B=(ox,oy+s); C=(ox+s*r3/2, oy+s/2)
    M1=(ox,oy+s/2); M2=(ox+s*r3/4, oy+s/4); M3=(ox+s*r3/4, oy+3*s/4)
    return dict(A=A,B=B,C=C,M1=M1,M2=M2,M3=M3)
def f(p): return '%.1f,%.1f'%p
def pts(*ps): return ' '.join(f(p) for p in ps)
# tetrahedron folding: base = M1 M2 M3 in plane z=0; flaps rotate about hinge edges
def fold_frames(s, angles):
    P=net(s,0,0)
    base=[P['M1'],P['M2'],P['M3']]
    cx=sum(p[0] for p in base)/3; cy=sum(p[1] for p in base)/3
    def rot_about(pt, a, b, th):
        # rotate 3D point pt around axis a-b by th (radians)
        ax=[b[i]-a[i] for i in range(3)]; n=math.sqrt(sum(x*x for x in ax)); ax=[x/n for x in ax]
        v=[pt[i]-a[i] for i in range(3)]
        c=math.cos(th); s_=math.sin(th)
        cross=[ax[1]*v[2]-ax[2]*v[1], ax[2]*v[0]-ax[0]*v[2], ax[0]*v[1]-ax[1]*v[0]]
        dot=sum(ax[i]*v[i] for i in range(3))
        r=[v[i]*c+cross[i]*s_+ax[i]*dot*(1-c) for i in range(3)]
        return [r[i]+a[i] for i in range(3)]
    def p3(p): return [p[0]-cx, p[1]-cy, 0.0]
    M1,M2,M3=p3(P['M1']),p3(P['M2']),p3(P['M3'])
    A,B,C=p3(P['A']),p3(P['B']),p3(P['C'])
    frames=[]
    for deg in angles:
        th=math.radians(deg)
        # flap A (top: A,M1,M2) hinge M1-M2 ; flap B (bottom: M1,B,M3) hinge M1-M3 ; flap C (right: M2,M3,C) hinge M2-M3
        # sign chosen so flaps go up (z>0)
        def up(pt,a,b):
            r1=rot_about(pt,a,b,th); r2=rot_about(pt,a,b,-th)
            return r1 if r1[2]>=r2[2] else r2
        Ar=up(A,M1,M2); Br=up(B,M1,M3); Cr=up(C,M2,M3)
        frames.append(dict(M1=M1,M2=M2,M3=M3,A=Ar,B=Br,C=Cr))
    return frames
def project(p, tilt=62, spin=0):
    # rotate around z by spin, then tilt around x, orthographic; y down
    sp=math.radians(spin); x=p[0]*math.cos(sp)-p[1]*math.sin(sp); y=p[0]*math.sin(sp)+p[1]*math.cos(sp); z=p[2]
    t=math.radians(tilt)
    y2=y*math.cos(t)-z*math.sin(t)
    return (x, y2)
closed=180-math.degrees(math.acos(1/3))
print('closed angle',closed)
fr=fold_frames(100,[0,45,85,closed])
out=[]
for F in fr:
    out.append({k:project(v,tilt=58,spin=-20) for k,v in F.items()})
json.dump(out, open('frames.json','w'))
print(json.dumps(out[3]))

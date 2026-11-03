import math, json
r3=math.sqrt(3)
def net(s, ox, oy):
    return dict(A=(ox,oy), B=(ox,oy+s), C=(ox+s*r3/2, oy+s/2), M1=(ox,oy+s/2), M2=(ox+s*r3/4, oy+s/4), M3=(ox+s*r3/4, oy+3*s/4))
f=lambda p:'%.1f %.1f'%p
def line(p,q,col,w,extra=''): return '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%s" stroke-linecap="round"%s></line>'%(p[0],p[1],q[0],q[1],col,w,extra)
def off(p,q,d):
    dx,dy=q[0]-p[0],q[1]-p[1]; n=math.hypot(dx,dy); nx,ny=-dy/n*d, dx/n*d
    return (p[0]+nx,p[1]+ny),(q[0]+nx,q[1]+ny)
def tab(p,q,inside,t,d):
    dx,dy=q[0]-p[0],q[1]-p[1]; n=math.hypot(dx,dy); ux,uy=dx/n,dy/n; nx,ny=-uy,ux
    # outward normal: away from inside point
    mx,my=(p[0]+q[0])/2,(p[1]+q[1])/2
    if (inside[0]-mx)*nx+(inside[1]-my)*ny>0: nx,ny=-nx,-ny
    a=(p[0]+nx*t+ux*d, p[1]+ny*t+uy*d); b=(q[0]+nx*t-ux*d, q[1]+ny*t-uy*d)
    return '<polygon points="%s" fill="none" stroke="{TAB}" stroke-width="{TW}" stroke-linejoin="round"></polygon>'%' '.join('%.1f,%.1f'%x for x in [p,q,b,a])
def logo(s,ox,oy,ow,cw,tabs=True,t=None):
    P=net(s,ox,oy); A,B,C,M1,M2,M3=[P[k] for k in ['A','B','C','M1','M2','M3']]
    o=[]
    if tabs:
        t=t or s*0.07; d=t*0.9
        cen_top=((A[0]+M1[0]+M2[0])/3,(A[1]+M1[1]+M2[1])/3)
        cen_r=((M2[0]+M3[0]+C[0])/3,(M2[1]+M3[1]+C[1])/3)
        cen_b=((M1[0]+B[0]+M3[0])/3,(M1[1]+B[1]+M3[1])/3)
        o+= [tab(A,M1,cen_top,t,d), tab(M2,C,cen_r,t,d), tab(B,M3,cen_b,t,d)]
    # outline edges (no letter): A-M2, B-M3
    o+=[line(A,M2,'{INK}',ow), line(B,M3,'{INK}',ow)]
    g=cw*0.55
    # W orange: A-M1, M1-M2, M2-M3 (right side), M3-C
    # M cyan: B-M1, M1-M3, M3-M2 (left side), M2-C
    p,q=off(M2,M3,-g); o.append(line(p,q,'{CY}',cw))  # left of downward line = +x? check below
    p,q=off(M2,M3,g); o.append(line(p,q,'{OR}',cw))
    o+=[line(A,M1,'{OR}',cw), line(M1,M2,'{OR}',cw), line(M3,C,'{OR}',cw)]
    o+=[line(B,M1,'{CY}',cw), line(M1,M3,'{CY}',cw), line(M2,C,'{CY}',cw)]
    return '\n'.join(o)
# check offset direction for M2->M3 (downward): normal (-dy,dx) with dy>0 -> nx negative -> left. so off(-g) = right. we want cyan left, orange right
def logo2(*a,**k):
    s=logo(*a,**k)
    return s
out={}
# big light/dark on 420x440 panels: s=300, net width=260, origin
out['big']=logo(300, 80, 60, 5, 9)
out['lockup']=logo(120, 30, 30, 2.5, 4.5, tabs=False)
for sz in [96,48,32,16]:
    s=sz*0.92; w=s*r3/2
    out['ic%d'%sz]=logo(s,(sz-w)/2+sz*0.04,(sz-s)/2, max(1.2,sz/40), max(2.2,sz/14), tabs=False)
json.dump(out,open('svgs.json','w'))
print(out['big'][:600])

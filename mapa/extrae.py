import re
app=open('../app/Index.html',encoding='utf-8').read()
css=app[app.index('<style>')+7:app.index('</style>')]
def reglas(t):
    out=[];i=0;n=len(t)
    while i<n:
        j=t.find('{',i)
        if j<0:break
        sel=t[i:j].strip();d=1;k=j+1
        while d and k<n:
            d+= (t[k]=='{')-(t[k]=='}');k+=1
        out.append((sel,t[j+1:k-1]));i=k
    return out
CL=['tabs','lfilt','ltools','lme','sheet','sdot','sinv','sadd','fold','pname','tag','tdesc','tcard','titem','tlist','otros','search','sres','tbar','small','muted','sheet-wrap','oicon','otit','ocount','obody']
pat=re.compile(r'(?<![-])\.(%s)(?![\w-])'%'|'.join(CL))
sal=[]
def proc(rs,ctx=None):
    for sel,body in rs:
        if sel.startswith('@media'):
            inner=proc2(body)
            if inner: sal.append(sel+'{'+inner+'}')
        elif pat.search(sel) and not sel.startswith(':root') and not sel.startswith('.hero') :
            sal.append(sel+'{'+body+'}')
def proc2(body):
    r=[]
    for sel,b in reglas(body):
        if pat.search(sel) and not sel.startswith(':root'): r.append(sel+'{'+b+'}')
    return ''.join(r)
proc(reglas(css))
txt='\n'.join(sal)
open('app_red.css','w').write(txt)
used=set(re.findall(r'var\((--[\w-]+)',txt))
sim=open('tpl.html').read()
print(len(sal),'reglas; vars sin definir en la sim:',sorted(v for v in used if v+':' not in sim))

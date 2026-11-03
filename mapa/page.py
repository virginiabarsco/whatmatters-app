import json, sys
sys.path.insert(0,'../logo')
src=open('../logo/variants.py').read(); ns={}; exec(src[:src.index("DK=dict")],ns)
logo=ns['draw'](2,74,13,13,'var(--wm-o)','var(--wm-c)','var(--wm-k)',6.2)
P=json.load(open('bgs-aerea.json'))
IDS=['vig','vg','sv','tierra']
def unico(svg, suf):
    for i in IDS:
        svg=svg.replace('id="%s"'%i,'id="%s-%s"'%(i,suf)).replace('url(#%s)'%i,'url(#%s-%s)'%(i,suf))
    return svg
ESC=[('C','Montevideo','Dibujado con los datos abiertos de la Intendencia: los límites reales de los barrios y las 1.343 calles de esta zona, con sus esquinas. Los verdes salen de los huecos del tejido.')]
scenes=''.join('<div class="esc" data-esc="%s" hidden>%s</div>'%(k,unico(P[k],k)) for k,_,_ in ESC)
botones=''
nombres=''.join('<p class="nota" data-nota="%s" hidden><b>%s</b> %s</p>'%(k,t,d) for k,t,d in ESC)
HTML=open('tpl.html').read()
import redhtml
A1=open('arbol1.svg',encoding='utf-8').read(); A2=open('arbol2.svg',encoding='utf-8').read()
RED=redhtml.build(logo,[A1,A2])
APPCSS=open('app_red.css').read()
REDJS=open('red.js').read()
arbol=''
for a,b in [('{{RED}}',RED),('{{APPCSS}}',APPCSS),('{{REDJS}}',REDJS),('{{SCENES}}',scenes),('{{BOTONES}}',botones),('{{NOTAS}}',nombres),('{{LOGO}}',logo)]:
    HTML=HTML.replace(a,b)
open('simulacion.html','w').write(HTML)
print(len(HTML))

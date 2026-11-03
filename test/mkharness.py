import re,sys
import os
AQUI=os.path.dirname(os.path.abspath(__file__))
# Simulador de los servicios de Google (planilla, correo, propiedades) para probar sin publicar.
infra=open(os.path.join(AQUI,'simulador-google.html')).read()
code=open(os.path.join(AQUI,'..','app','Code.gs')).read()
idx=open(os.path.join(AQUI,'..','app','Index.html')).read()
for k,p in [('inv','inv'),('acc','acc'),('conf','conf'),('arb','arb')]:
    idx=idx.replace("<?!= JSON.stringify(%s) ?>"%k,"(new URLSearchParams(location.search).get('%s')||'')"%p)
assert '<?' not in idx
marker='<div id="toastRoot" aria-live="polite"></div>\n'
assert marker in idx
idx=idx.replace(marker, marker+infra+'\n<script>'+code+'\n</script>\n',1)
open(sys.argv[1] if len(sys.argv)>1 else os.path.join(AQUI,'harness.html'),'w').write(idx)

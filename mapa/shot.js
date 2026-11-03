const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for(const [sch,w,h,n] of [['dark',1280,800,'d'],['light',1280,800,'l'],['light',390,800,'m']]){
const c=await b.newContext({viewport:{width:w,height:h},colorScheme:sch});const p=await c.newPage();
await p.goto('file://' + __dirname + '/simulacion.html');await p.waitForTimeout(800);
await p.screenshot({path:'s-'+n+'-inicio.png'});
await p.evaluate(()=>{document.querySelector('.topbar,#top')&&0;document.getElementById('solo').click()});await p.waitForTimeout(300);
await p.screenshot({path:'s-'+n+'-fondo.png'});
await c.close();}
await b.close();})();

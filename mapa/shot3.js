const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for(const [w,n] of [[390,'m'],[1100,'d']]){
const c=await b.newContext({viewport:{width:w,height:1100},colorScheme:'dark'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://' + __dirname + '/simulacion.html');await p.waitForTimeout(500);
await p.click('[data-ir=red]');await p.waitForTimeout(300);
await p.screenshot({path:'r-'+n+'1.png',fullPage:true});
await p.click('.arb:not([hidden]) [data-tab=lista]');await p.waitForTimeout(200);
await p.click('.arb:not([hidden]) .fold');
await p.screenshot({path:'r-'+n+'2.png',fullPage:true});
await p.click('[data-tree=b]');await p.fill('.arb:not([hidden]) .pq','pri');await p.waitForTimeout(200);
await p.screenshot({path:'r-'+n+'3.png',fullPage:true});
console.log(n,await p.evaluate(()=>document.documentElement.scrollWidth),errs);
await c.close();}
await b.close();})();

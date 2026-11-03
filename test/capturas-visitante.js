const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for(const [w,sch,n] of [[390,'dark','m'],[1100,'light','d']]){
const c=await b.newContext({viewport:{width:w,height:900},colorScheme:sch});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://' + __dirname + '/harness.html');await p.waitForTimeout(9000);
await p.screenshot({path:'v-'+n+'-inicio.png'});
await p.click('[data-ir=juego]');await p.waitForTimeout(300);await p.screenshot({path:'v-'+n+'-juego.png'});
await p.click('#irInicio');await p.waitForTimeout(300);
await p.click('[data-ir=red]');await p.waitForTimeout(1200);await p.screenshot({path:'v-'+n+'-red.png',fullPage:true});
await p.click('#irInicio');await p.click('[data-ir=entrar]');await p.waitForTimeout(300);await p.screenshot({path:'v-'+n+'-entrar.png'});
console.log(n,errs);await c.close();}
await b.close();})();

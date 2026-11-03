const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:800},colorScheme:'dark'});const p=await c.newPage();
await p.goto('file://' + __dirname + '/simulacion.html');await p.waitForTimeout(500);
await p.screenshot({path:'s-mini.png'});await b.close();})();

const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1600}});
await p.goto('file://' + __dirname + '/tierra.html');await p.screenshot({path:'tierra.png'});await b.close();})();

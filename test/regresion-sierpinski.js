// Prueba del bloque Sierpinski: geometría (numeración en sentido horario), conteo de personas y uniones, toque, "Acercar" y pestaña "Árbol".
const { chromium } = require('playwright');
let fallas = 0;
const ok = (nombre, cond, extra) => { if (!cond) fallas++; console.log((cond ? 'OK   ' : 'FALLA') + ' ' + nombre + (cond ? '' : '  → ' + extra)); };
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  page.on('pageerror', e => { fallas++; console.log('PAGEERR', e.message); });
  await page.goto('file://' + __dirname + '/harness.html'); await page.waitForTimeout(500);
  const ev = (f, a) => page.evaluate(f, a);
  // --- geometría pura
  const g = await ev(() => {
    function c(slot) { var P = regionOf(slot).P; return [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]; }
    function area(P) { return Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1])) / 2; }
    var r = { c: {}, areas: [] };
    ['1', '2', '3', '1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3'].forEach(function (s) { r.c[s] = c(s); });
    var A0 = area(T0); ['1', '2.3', '3.2.2', '1.2.3.1'].forEach(function (s) { r.areas.push(area(regionOf(s).P) / A0 * Math.pow(4, s.split('.').length)); });
    return r;
  });
  const C = g.c;
  ok('semilla en sentido horario: 1 arriba a la izquierda, 2 en la punta, 3 abajo', C['1'][1] < C['2'][1] + 1e-6 && C['2'][0] > C['1'][0] && C['3'][1] > C['2'][1] - 1e-6 && C['1'][1] < C['3'][1] && Math.abs(C['1'][0] - C['3'][0]) < 1e-6, JSON.stringify(C));
  ok('región de 1: 1.1 en la misma esquina, 1.2 en la punta, 1.3 abajo', Math.abs(C['1.1'][0] - C['1.3'][0]) < 1e-6 && C['1.2'][0] > C['1.1'][0] && C['1.3'][1] > C['1.1'][1]);
  ok('región de 2: 2.1 en la punta, 2.2 abajo, 2.3 arriba (horario desde la punta)', C['2.2'][1] > C['2.3'][1] && C['2.1'][0] > C['2.2'][0] && Math.abs(C['2.2'][0] - C['2.3'][0]) < 1e-6);
  ok('región de 3: 3.1 abajo, 3.2 arriba a la izquierda, 3.3 en la punta', C['3.2'][1] < C['3.1'][1] && C['3.3'][0] > C['3.2'][0]);
  ok('cada alcance divide el área en cuatro', g.areas.every(a => Math.abs(a - 1) < 1e-9), JSON.stringify(g.areas));
  // --- dibujo con un árbol de alcance 3
  await ev(() => {
    window.T = {}; window.login = function (mail) { __clearWait(); pedirCodigo(mail); var m = __mails[__mails.length - 1]; return (T[mail] = entrarConEnlace(m.body.match(/acc=([a-f0-9]{40})/)[1]).token); };
    login('v@x.com'); login('w@x.com'); login('m@x.com');
    proponerTema(T['v@x.com'], 't1', 'Confianza', 'Todo el planeta'); acordarTema(T['w@x.com'], 't1'); acordarTema(T['m@x.com'], 't1');
    invitar(T['v@x.com'], 't1', '1.2', 'a1@x.com'); invitar(T['v@x.com'], 't1', '1.1.2', 'a2@x.com');
    TOKEN = T['v@x.com']; lsSet('wm_red_token', TOKEN); ARBOL = 't1'; LAST_STATE = ''; TAB = 'mapa'; MV.z = 0; return load();
  });
  await page.waitForTimeout(500);
  const d = await ev(() => ({ D: M.D, leaves: MHITS.leaves.length, unions: MHITS.unions.length, tab: document.querySelector('[data-tab="mapa"]').textContent, top: M.top, n: M.n }));
  ok('la pestaña se llama Árbol', d.tab === 'Árbol', d.tab);
  // hay Aceptadas hasta el alcance 2 (N = 2) y una convocatoria pendiente en 1.1.2: 9 triángulos y solo la región de 1.1 se subdivide
  ok('se dibuja hasta N y se subdivide solo donde hay alguien Convocado', d.top === 2 && d.leaves === 11 && d.unions === 5, JSON.stringify(d));
  ok('la convocada del alcance 3 se ve en el árbol entero', await ev(() => MHITS.leaves.some(l => l.slot === '1.1.2' && M.invited['1.1.2'])));
  ok('N = alcance más alto con alguien aceptado, X = personas', d.top >= 1 && d.n >= 3, JSON.stringify(d));
  const txt = await ev(() => Array.from(document.querySelectorAll('#mfg text.un')).map(t => t.textContent).join('|'));
  ok('la unión central dice "A1 de N" y las personas', txt.indexOf('A1 de ' + d.top) >= 0 && txt.indexOf(d.n + ' personas') >= 0, txt);
  ok('no queda ningún color por alcance dibujado en el árbol', await ev(() => !/var\(--s\d+\)/.test($('#mfg').innerHTML)));
  // --- toque
  const sel = await ev(() => { var l = MHITS.leaves.find(x => x.pid === '1'); var c = l.pts.reduce((a, p) => [a[0] + p[0] / 3, a[1] + p[1] / 3], [0, 0]); mtap(c[0], c[1]); return { sel: MSEL, cian: ($('#mfg').innerHTML.match(/stroke="var\(--accent\)"/g) || []).length, acercar: !!document.querySelector('[data-acercar="1"]') }; });
  ok('tocar a una persona la selecciona y enciende todas sus posiciones en cian', sel.sel && sel.sel.pid === '1' && sel.cian >= 2 /* una por cada alcance dibujado, una dentro de otra */, JSON.stringify(sel));
  ok('la ficha tiene el botón Acercar', sel.acercar);
  const z = await ev(() => { document.querySelector('[data-acercar="1"]').click(); return MV.focus; });
  await page.waitForTimeout(700);
  ok('Acercar lleva a lo que creció desde la persona', z === '1' && await ev(() => MV.z) > 1, z);
  ok('al acercar se ve un alcance más en esa región', await ev(() => MHITS.leaves.some(l => l.slot.split('.').length === 3)));
  ok('en esa vista la unión central dice "A2 de N"', (await ev(() => Array.from(document.querySelectorAll('#mfg text.un')).map(t => t.textContent).join('|'))).indexOf('A2 de ' + d.top) >= 0, 'A2 de N');
  await ev(() => document.querySelector('#zfit').click());
  ok('Todo vuelve al árbol entero', await ev(() => MV.focus === '' && !MSEL));
  const u = await ev(() => { var un = MHITS.unions.find(x => x.b === ''); var c = un.pts.reduce((a, p) => [a[0] + p[0] / 3, a[1] + p[1] / 3], [0, 0]); mtap(c[0], c[1]); return MSEL; });
  ok('tocar una unión muestra quiénes la forman', u && u.type === 't' && u.b === '' && /Semilla|Tríada base/.test(await ev(() => $('#mcard').textContent)));
  // como w (posición 2): su tríada del alcance 3 (2.1.2, 2.1.3) queda adentro de 2.1, que lleva un + y al tocarlo se acerca
  await ev(() => { TOKEN = T['w@x.com']; lsSet('wm_red_token', TOKEN); LAST_STATE = ''; MSEL = null; MV.z = 0; return load(); }); await page.waitForTimeout(500);
  const w = await ev(() => { var l = MHITS.leaves.find(x => x.more); if (!l) return null; var c = l.pts.reduce((a, p) => [a[0] + p[0] / 3, a[1] + p[1] / 3], [0, 0]); mtap(c[0], c[1]); return l.slot; });
  await page.waitForTimeout(700);
  ok('tus posiciones por convocar escondidas llevan un + y tocarlo acerca', w === '2.1' && await ev(() => MV.focus === '2.1' && MHITS.leaves.some(l => l.slot === '2.1.2' && M.lug['2.1.2'].puedoInvitar)), w);
  console.log(fallas ? 'HAY FALLAS: ' + fallas : 'TODO BIEN');
  await b.close();
})();

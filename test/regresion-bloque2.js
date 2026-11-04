// Prueba del bloque 2: ciudad y lugar, tema con lugar, cifras, salida y vacantes, vencimiento de convocatorias, solicitudes, pantalla y panel de prueba.
const { chromium } = require('playwright');
const SHOT = (n) => __dirname + '/capturas/' + n + '.png';
let fallas = 0;
const ok = (nombre, cond, extra) => { if (!cond) fallas++; console.log((cond ? 'OK   ' : 'FALLA') + ' ' + nombre + (cond ? '' : '  → ' + extra)); };
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  page.on('pageerror', e => { fallas++; console.log('PAGEERR', e.message); });
  await page.goto('file://' + __dirname + '/harness.html'); await page.waitForTimeout(500);
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => {
    window.T = {};
    window.login = function (mail) { __clearWait(); pedirCodigo(mail); var m = __mails[__mails.length - 1]; return (T[mail] = entrarConEnlace(m.body.match(/acc=([a-f0-9]{40})/)[1]).token); };
    window.t = function (f) { try { var r = f(); return r === undefined ? 'ok' : JSON.stringify(r); } catch (e) { return 'ERR: ' + e.message; } };
    window.mails = function () { return __mails.map(function (m) { return m.to + ' | ' + m.subject; }); };
    login('v@x.com'); login('w@x.com'); login('m@x.com'); login('i3@x.com');
  });
  // --- tema con lugar
  ok('tema sin lugar se rechaza', /Falta el lugar/.test(await ev(() => t(() => proponerTema(T['v@x.com'], 't1', 'Confianza', '')))));
  await ev(() => { proponerTema(T['v@x.com'], 't1', 'Confianza', 'Todo el planeta'); acordarTema(T['w@x.com'], 't1'); acordarTema(T['m@x.com'], 't1'); });
  const a1 = await ev(() => { var a = getState(T['v@x.com'], '', 't1').arbol; return a; });
  ok('árbol acordado con lugar', a1.acordado && a1.lugar === 'Todo el planeta', JSON.stringify(a1));
  ok('cifras del árbol: 4 personas, completo A1, en proceso A2', a1.personas === 4 && a1.completo === 1 && a1.enProceso === 2, JSON.stringify(a1));
  // --- ciudad obligatoria y buscador
  ok('buscador de ciudad', /Montevideo/.test(await ev(() => t(() => buscarLugar('Montevideo', 'ciudad', '')))));
  ok('buscador de lugar con ciudad', /Plaza Independencia/.test(await ev(() => t(() => buscarLugar('Plaza', 'lugar', 'Montevideo')))));
  ok('buscador de zona', /Uruguay/.test(await ev(() => t(() => buscarLugar('Uruguay', 'zona', '')))));
  ok('texto corto no busca', await ev(() => t(() => buscarLugar('Mo', 'ciudad', ''))) === '[]');
  await ev(() => { window.P2 = plantarArbol(T['w@x.com'], 'a@x.com', 'b@x.com').arbol; window.K = Object.keys(__props).find(k => k.startsWith('inv_') && inviteFrom_(k.slice(4)).correo === 'a@x.com').slice(4); });
  ok('aceptar sin ciudad se rechaza', /Falta la ciudad/.test(await ev(() => t(() => aceptarInvitacion(K, 'Ana', 'agua')))));
  ok('aceptar con ciudad', (await ev(() => t(() => { T['a@x.com'] = aceptarInvitacion(K, 'Ana', 'agua', { ciudad: 'Montevideo', lugar: 'Parque Rodó' }).token; }))) === 'ok');
  ok('ciudad y lugar visibles en el estado', await ev(() => { var u = getState(T['a@x.com'], '', P2).ubic; return u['2'] && u['2'].ciudad === 'Montevideo' || Object.keys(u).some(k => u[k].lugar === 'Parque Rodó'); }));
  // --- salir y vacantes
  const irse = await ev(() => t(() => irseDelArbol(T['m@x.com'], 't1')));
  ok('irse del único árbol', irse === '{"quedan":0}', irse);
  ok('la posición 3 queda por convocar y la convocan sus compañeras', !/ERR/.test(await ev(() => t(() => invitar(T['w@x.com'], 't1', '3', 'n@x.com')))));
  ok('quien no es de esa tríada no puede convocarla', /ERR/.test(await ev(() => t(() => invitar(T['i3@x.com'], 't1', '3', 'q@x.com')))));
  // --- vencimiento
  const antes = await ev(() => __mails.length);
  await ev(() => {
    var s = sheet_(), n = s.getLastRow() - 1, dia = 864e5;
    for (var i = 0; i < n; i++) { var r = i + 2; if (s.getRange(r, 6).getValue() === 'Convocada' && s.getRange(r, 4).getValue() === 'n@x.com') s.getRange(r, 7).setValue(new Date(Date.now() - 8 * dia)); }
    revisarConvocatorias();
  });
  const recs = await ev(() => mails().slice(-3));
  ok('a los días se manda el recordatorio', await ev(() => __mails.length) > antes, JSON.stringify(recs));
  await ev(() => { var s = sheet_(), n = s.getLastRow() - 1; for (var i = 0; i < n; i++) { var c = s.getRange(i + 2, 14).getValue(); if (c) s.getRange(i + 2, 14).setValue(new Date(Date.now() - 3 * 864e5)); } revisarConvocatorias(); });
  const inv = await ev(() => { var k = Object.keys(__props).find(k => k.startsWith('inv_') && /n@x.com/.test(JSON.stringify(inviteFrom_(k.slice(4)) || {}))); return k ? k.slice(4) : ''; });
  const st = await ev((k) => { var s = getState('', k, 't1'); return s.invitacion; }, inv);
  ok('la convocatoria vencida se ve como Vencida', st && st.estado === 'Vencida', JSON.stringify(st));
  ok('solicitar desde una convocatoria vencida', !/ERR/.test(await ev((k) => t(() => solicitarDesdeVencida(k, 'Nina', 'cine', 'Hola')), inv)));
  ok('no se repite la solicitud', /solicitud/.test(await ev((k) => t(() => solicitarDesdeVencida(k, 'Nina', 'cine', 'Hola')), inv)));
  ok('la posición vencida vuelve a poder convocarse', !/ERR/.test(await ev(() => t(() => invitar(T['v@x.com'], 't1', '3', 'o@x.com')))));
  // --- pantalla: subtítulo y cifras
  await ev(() => { TOKEN = T['v@x.com']; lsSet('wm_red_token', TOKEN); ARBOL = 't1'; LAST_STATE = ''; return load(); }); await page.waitForTimeout(400);
  const h1 = await ev(() => document.querySelector('h1').textContent);
  ok('subtítulo con lugar, cifras y posición', /Todo el planeta/.test(h1) && /personas/.test(h1) && /posiciones/.test(h1) && /Tu posición: 1/.test(h1), h1);
  ok('hay botón Irme de este árbol', !!(await page.$('#irmeSi')));
  await page.screenshot({ path: SHOT('b2-arbol') });
  // --- pantalla: vencida
  await ev((k) => { TOKEN = ''; lsSet('wm_red_token', ''); INV = k; LAST_STATE = ''; VISTA = 'inicio'; return load(); }, inv); await page.waitForTimeout(400);
  ok('pantalla de convocatoria vencida', !!(await page.$('#vencForm')) || /solicitud ya está enviada/.test(await ev(() => document.body.innerText)), await ev(() => document.body.innerText.slice(0, 200)));
  await page.screenshot({ path: SHOT('b2-vencida') });
  // --- pantalla: falta tu ciudad
  await ev(() => { var s = sheet_(), n = s.getLastRow() - 1; for (var i = 0; i < n; i++) if (s.getRange(i + 2, 4).getValue() === 'i3@x.com') { s.getRange(i + 2, 11).setValue(''); s.getRange(i + 2, 12).setValue(''); s.getRange(i + 2, 13).setValue(''); } INV = ''; TOKEN = T['i3@x.com']; lsSet('wm_red_token', TOKEN); ARBOL = 't1'; LAST_STATE = ''; return load(); }); await page.waitForTimeout(400);
  ok('si falta la ciudad, se pide', !!(await page.$('#ciudadForm')));
  await page.fill('#ubCiudad', 'Montevideo'); await page.click('[data-ubbuscar="ciudad"]'); await page.waitForTimeout(300);
  await page.click('#ubCiudadRes .ubopt'); await page.screenshot({ path: SHOT('b2-ciudad') });
  await page.click('#ciudadForm button[type=submit]'); await page.waitForTimeout(500);
  ok('guardar la ciudad desbloquea la pantalla', !(await page.$('#ciudadForm')));
  // --- pantalla: irse
  await page.click('#irmeSi'); await page.waitForTimeout(100); ok('pide confirmar', /Tu posición vuelve a Por convocar/.test(await ev(() => document.body.innerText)));
  await page.click('#irmeNo'); await page.waitForTimeout(100); ok('se puede no irse', !!(await page.$('#irmeSi')));
  // --- panel de prueba y árbol de ejemplo
  await page.click('#tp-btn'); await page.waitForTimeout(100);
  ok('el panel lista los correos', (await ev(() => document.querySelectorAll('#tp .ml').length)) > 3);
  await page.screenshot({ path: SHOT('b2-panel') });
  await page.click('#tp button[data-a="ej"]'); await page.waitForTimeout(700);
  const ej = await ev(() => { var a = S.arbol; return a ? { id: a.id, p: a.personas, c: a.completo, e: a.enProceso, pos: a.posiciones } : null; });
  ok('árbol de ejemplo desparejo (en proceso A5, completo A2)', ej && ej.e === 5 && ej.c === 2 && ej.p === 16, JSON.stringify(ej));
  await page.screenshot({ path: SHOT('b2-ejemplo') });
  await page.screenshot({ path: SHOT('b2-ejemplo-completa'), fullPage: true });
  const errs = await ev(() => window.__errors || []);
  ok('sin errores del servidor simulado', errs.length === 0, JSON.stringify(errs));
  console.log(fallas ? 'FALLAS ' + fallas : 'TODO BIEN'); console.log('ERRS', JSON.stringify(errs));
  await b.close();
})();

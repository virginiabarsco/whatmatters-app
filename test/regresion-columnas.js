// Prueba del cambio de columnas: migración de la planilla vieja, orden nuevo, nombres nuevos y lectura por nombre de cabecera.
const { chromium } = require('playwright');
let fallas = 0;
const ok = (nombre, cond, extra) => { if (!cond) fallas++; console.log((cond ? 'OK   ' : 'FALLA') + ' ' + nombre + (cond ? '' : '  → ' + extra)); };
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  page.on('pageerror', e => { fallas++; console.log('PAGEERR', e.message); });
  await page.goto('file://' + __dirname + '/harness.html'); await page.waitForTimeout(500);
  const ev = (f, a) => page.evaluate(f, a);
  const hdr = (hoja) => ev((h) => { var s = SpreadsheetApp.getActive().getSheetByName(h); var o = []; for (var c = 1; c <= s.getLastColumn(); c++) o.push(String(s.getRange(1, c).getValue())); return o; }, hoja);
  // La hoja de partida es la vieja (Posición primero, Convocó, Activa…): al arrancar se migra sola.
  const antes = await ev(() => window.__PRESET_ROWS[0]);
  ok('la hoja de partida tiene el orden viejo', antes[0] === 'Posición' && antes[9] === 'Árbol' && antes[4] === 'Convocó (posición)', antes.join('|'));
  await ev(() => { ensureSetup_(); });
  const p = await hdr('Personas');
  ok('Personas: Árbol quedó antes de Posición', p[0] === 'Árbol' && p[1] === 'Posición', p.join('|'));
  ok('Personas: el resto sigue su orden y no queda ningún Árbol suelto', p.filter(x => x === 'Árbol').length === 1 && p.length === 14, p.join('|'));
  ok('Personas: "Convocada por (posición)"', p.indexOf('Convocada por (posición)') === 5 && p.indexOf('Convocó (posición)') < 0, p.join('|'));
  const datos = await ev(() => readAll_().map(x => x.pos + ':' + x.arbol + ':' + x.nombre + ':' + x.invito + ':' + x.estado).join(' ; '));
  ok('los datos se leen igual después de moverlas', /^1:t1:Virginia Barsco::Aceptada ; 2:t1:Ana Torres:1:Aceptada/.test(datos), datos);
  await ev(() => { ensureSetup_(); migrarColumnas_(); });
  ok('repetir la migración no cambia nada', (await hdr('Personas')).join('|') === p.join('|'));
  // Árboles y Quieren sumarse
  await ev(() => { pedirSumarme('', 't1', 'Zoe', 'z@x.com', 'música', 'hola'); });
  const q = await hdr('Quieren sumarse');
  ok('Quieren sumarse: Posición elegida y Decide (posición)', q[8] === 'Posición elegida' && q[9] === 'Decide (posición)', q.join('|'));
  await ev(() => { migrarColumnas_(); });
  const q2 = await hdr('Quieren sumarse');
  ok('Quieren sumarse: Id y Clave quedan ocultas', await ev(() => { var s = SpreadsheetApp.getActive().getSheetByName('Quieren sumarse'); return !!(s.hidden && s.hidden[1] && s.hidden[11]); }), q2.join('|'));
  const a = await hdr('Árboles');
  ok('Árboles: "Por convocar por salida"', a[11] === 'Por convocar por salida', a.join('|'));
  // Lectura por nombre: se reordenan columnas a mano y la app sigue igual
  const antesEstado = await ev(() => { login = null; var all = readAll_(); return all.map(x => x.pos + x.nombre + x.estado + x.ciudad).join('|'); });
  await ev(() => {
    // Mover Ciudad (col 11) al lugar de Alcance (col 3) a mano: se intercambian las columnas 3 y 11.
    var s = sheet_(), n = s.getLastRow();
    for (var r = 1; r <= n; r++) { var a = s.getRange(r, 3).getValue(), b = s.getRange(r, 11).getValue(); s.getRange(r, 3).setValue(b); s.getRange(r, 11).setValue(a); }
    resetCols_();
  });
  const despues = await ev(() => readAll_().map(x => x.pos + x.nombre + x.estado + x.ciudad).join('|'));
  ok('si se reordenan columnas a mano, la app lee lo mismo', despues === antesEstado, despues.slice(0, 200));
  // Escribir también respeta el orden cambiado
  const nueva = await ev(() => {
    window.T = {}; __clearWait(); pedirCodigo('v@x.com'); var m = __mails[__mails.length - 1]; var tok = entrarConEnlace(m.body.match(/acc=([a-f0-9]{40})/)[1]).token;
    __clearWait(); pedirCodigo('w@x.com'); var m2 = __mails[__mails.length - 1]; var tw = entrarConEnlace(m2.body.match(/acc=([a-f0-9]{40})/)[1]).token;
    __clearWait(); pedirCodigo('m@x.com'); var m3 = __mails[__mails.length - 1]; var tm = entrarConEnlace(m3.body.match(/acc=([a-f0-9]{40})/)[1]).token;
    proponerTema(tok, 't1', 'Confianza', 'Todo el planeta'); acordarTema(tw, 't1'); acordarTema(tm, 't1');
    var tr = invitar(tok, 't1', '1.2', 'nuevo@x.com');
    var rows = readAll_().filter(x => x.correo === 'nuevo@x.com');
    return rows.map(x => x.pos + ':' + x.invito + ':' + x.estado + ':' + x.arbol).join(',');
  });
  ok('una convocatoria nueva se escribe en las columnas correctas', nueva === '1.2:1:Convocada:t1', nueva);
  ok('el alcance sigue calculándose bien', await ev(() => readAll_().filter(x => x.correo === 'nuevo@x.com')[0].alcance) === 2);
  // Nombres viejos: una hoja con las cabeceras anteriores se sigue leyendo
  await ev(() => {
    var s = sheet_(); s.getRange(1, physCol_(s, HEAD, 5)).setValue('Convocó (posición)'); resetCols_();
    var qs = SpreadsheetApp.getActive().getSheetByName('Quieren sumarse'); qs.getRange(1, 9).setValue('Lugar'); qs.getRange(1, 10).setValue('Asignado a (posición)'); resetCols_();
  });
  ok('los nombres viejos de columnas se siguen leyendo', await ev(() => readAll_().filter(x => x.pos === '2')[0].invito) === '1' && (await ev(() => readPedidos_().length)) >= 1);
  await b.close();
  console.log(fallas ? ('FALLAS: ' + fallas) : 'TODO BIEN');
  process.exit(fallas ? 1 : 0);
})();

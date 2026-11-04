// WhatMatters: árboles que crecen de a tres.
// Cada árbol nace de una semilla (posiciones 1, 2 y 3) y crece por convocatoria. Una persona puede estar en hasta tres árboles.
// Los datos viven en las pestañas "Personas" (una fila por persona y árbol) y "Árboles" de esta planilla.

var SHEET = 'Personas';
var SHEET_ARB = 'Árboles';
var MAX_ALCANCE = 10;
var MAX_ARBOLES = 3;
var COLS = 14; // Posición, Alcance de entrada, Nombre, Correo, Convocó, Estado, Fecha de convocatoria, Fecha de entrada, Lo que importa, Árbol, Ciudad, Un lugar que te guste, Punto del mapa, Recordatorio de vencimiento
var HEAD = ['Posición', 'Alcance de entrada', 'Nombre', 'Correo', 'Convocó (posición)', 'Estado', 'Fecha de convocatoria', 'Fecha de entrada', 'Lo que importa', 'Árbol', 'Ciudad', 'Un lugar que te guste', 'Punto del mapa', 'Recordatorio de vencimiento'];
var FORMATS = [['@', '0', '@', '@', '@', '@', 'dd/mm/yyyy', 'dd/mm/yyyy', '@', '@', '@', '@', '@', 'dd/mm/yyyy']];
var ACOLS = 12;
var AHEAD = ['Árbol', 'Tema', 'Lugar', 'Estado', 'Plantó (correo)', 'Fecha', 'Propuesta: tema', 'Propuesta: lugar', 'Propuso (posición)', 'De acuerdo (posiciones)', 'Fecha del acuerdo', 'Posiciones por convocar por salida'];
var SHEET_CIU = 'Ciudades';
var CHEAD = ['Ciudad', 'Plaza o punto central', 'Latitud', 'Longitud', 'Origen'];
var CIUDADES_INICIALES = [['Montevideo, Uruguay', 'Plaza Independencia'], ['Punta del Este, Uruguay', 'Plaza Artigas']];
var LUGAR_PLANETA = 'Todo el planeta';
var DIAS_CONVOCATORIA = 7;   // una convocatoria vence a los 7 días
var DIAS_RECORDATORIO = 5;   // recordatorio al 5.º día
var DIAS_TRAS_AVISO = 2;     // ninguna vence sin aviso: pasan al menos 2 días desde el recordatorio
var SHEET_SUM = 'Quieren sumarse';
var QCOLS = 12;
var QHEAD = ['Id', 'Fecha', 'Árbol', 'Nombre', 'Correo', 'Lo que importa', 'Mensaje', 'Estado', 'Lugar', 'Asignado a (posición)', 'Clave', 'Fecha de cierre'];
var DIAS_PEDIDO = 30;
var SEMILLA = ['1', '2', '3'];

function doGet(e) {
  ensureSetup_();
  var p = (e && e.parameter) || {};
  var inv = String(p.inv || '').replace(/[^a-f0-9]/g, '').slice(0, 40);
  var acc = String(p.acc || '').replace(/[^a-f0-9]/g, '').slice(0, 40);
  var arb = String(p.arbol || '').replace(/[^a-z0-9]/g, '').slice(0, 12);
  var conf = String(p.conf || '').replace(/[^a-f0-9]/g, '').slice(0, 40);
  var t = HtmlService.createTemplateFromFile('Index');
  t.conf = conf.length === 40 ? conf : '';
  t.inv = inv.length === 40 ? inv : '';
  t.acc = acc.length === 40 ? acc : '';
  t.arb = arb;
  return t.evaluate()
    .setTitle('WhatMatters')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

// ---------- utilidades ----------
function fail_(msg) { throw new Error(msg); }
function clean_(s, max) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max || 120); }
function normMail_(s) { return clean_(s, 160).toLowerCase(); }
function isMail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function depth_(pos) { return String(pos).split('.').length; }
function parent_(pos) { var p = String(pos).split('.'); p.pop(); return p.join('.'); }
function fmtDate_(d) {
  if (Object.prototype.toString.call(d) === '[object Date]') return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  return d ? String(d) : '';
}
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { var out = fn(); SpreadsheetApp.flush(); return out; }
  finally { lock.releaseLock(); }
}
function sheet_() { return SpreadsheetApp.getActive().getSheetByName(SHEET); }
function sheetArb_() { return SpreadsheetApp.getActive().getSheetByName(SHEET_ARB); }
function headerStyle_(r) { return r.setFontWeight('bold').setBackground('#1F4E3D').setFontColor('#FFFFFF'); }

function ensureSetup_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('setup_simple_v1') === 'ok' && props.getProperty('setup_tema_v1') === 'ok' && props.getProperty('setup_arboles_v1') === 'ok' && props.getProperty('setup_bloque2_v1') === 'ok') return;
  withLock_(function () {
    var ss = SpreadsheetApp.getActive();
    var s = sheet_();
    if (!s) {
      s = ss.insertSheet(SHEET, 0);
      headerStyle_(s.getRange(1, 1, 1, COLS).setValues([HEAD]));
      s.getRange('A:A').setNumberFormat('@');
      s.getRange('E:E').setNumberFormat('@');
      s.setFrozenRows(1);
      s.setColumnWidth(1, 110); s.setColumnWidth(3, 180); s.setColumnWidth(4, 240); s.setColumnWidth(5, 120); s.setColumnWidth(9, 220);
    }
    if (!s.getRange(1, 9).getValue()) headerStyle_(s.getRange(1, 9).setValue(HEAD[8]));
    if (!s.getRange(1, 10).getValue()) headerStyle_(s.getRange(1, 10).setValue(HEAD[9]));
    // Las filas de antes de que hubiera varios árboles son del primer árbol.
    var n = s.getLastRow() - 1;
    if (n > 0) {
      var col = s.getRange(2, 10, n, 1);
      var vals = col.getValues();
      if (vals.some(function (r) { return !r[0]; })) col.setValues(vals.map(function (r) { return [r[0] || 't1']; }));
    }
    var a = sheetArb_();
    if (!a) {
      a = ss.insertSheet(SHEET_ARB, 1);
      headerStyle_(a.getRange(1, 1, 1, ACOLS).setValues([AHEAD]));
      a.getRange('A:A').setNumberFormat('@');
      a.getRange('I:J').setNumberFormat('@');
      a.setFrozenRows(1);
      a.setColumnWidth(2, 200); a.setColumnWidth(3, 260); a.setColumnWidth(5, 220); a.setColumnWidth(7, 200); a.setColumnWidth(8, 260);
    }
    if (n > 0 && a.getLastRow() < 2) {
      var p1 = readAll_().filter(function (p) { return p.arbol === 't1' && p.pos === '1'; })[0];
      appendTree_('t1', p1 ? p1.correo : '');
    }
    // Bloque 2: Árboles pierde las columnas de tipo (queda Lugar), Personas suma ciudad, lugar, punto y recordatorio, y aparece la pestaña Ciudades.
    a = sheetArb_();
    if (a && String(a.getRange(1, 3).getValue()) === 'Tipo') { a.deleteColumn(9); a.deleteColumn(3); }
    if (a) headerStyle_(a.getRange(1, 1, 1, ACOLS).setValues([AHEAD]));
    headerStyle_(s.getRange(1, 11, 1, 4).setValues([HEAD.slice(10)]));
    s.getRange('K:M').setNumberFormat('@');
    ciudadesSheet_();
  });
  props.setProperty('setup_simple_v1', 'ok');
  props.setProperty('setup_tema_v1', 'ok');
  props.setProperty('setup_arboles_v1', 'ok');
  props.setProperty('setup_bloque2_v1', 'ok');
}
// La pestaña Ciudades: una fila por ciudad con la plaza (o punto central) que el mapa usa cuando alguien no elige un lugar.
// Las ciudades nuevas se agregan solas con el punto que da Google; la administradora puede cambiar el nombre de la plaza y borrar latitud y longitud para que se busquen de nuevo.
function ciudadesSheet_() {
  var ss = SpreadsheetApp.getActive(), c = ss.getSheetByName(SHEET_CIU);
  if (!c) {
    c = ss.insertSheet(SHEET_CIU);
    headerStyle_(c.getRange(1, 1, 1, CHEAD.length).setValues([CHEAD]));
    c.getRange('A:B').setNumberFormat('@');
    c.setFrozenRows(1); c.setColumnWidth(1, 220); c.setColumnWidth(2, 260);
    CIUDADES_INICIALES.forEach(function (r, i) { c.getRange(i + 2, 1, 1, CHEAD.length).setValues([[r[0], r[1], '', '', 'Plaza']]); });
  }
  return c;
}
function cleanLoQueImporta_(t) { return clean_(t, 120); }
function needNombreLoQueImporta_(nombre, loQueImporta) {
  if (!nombre) fail_('Falta tu nombre.');
  if (!loQueImporta) fail_('Falta al menos una palabra en Lo que importa.');
}

// ---------- lectura ----------
function dateMs_(d) { return Object.prototype.toString.call(d) === '[object Date]' ? d.getTime() : 0; }
// Cuándo vence una convocatoria: a los 7 días de la fecha de convocatoria y, como mínimo, 2 días después del recordatorio (ninguna vence sin aviso).
function vencimientoMs_(p) {
  if (!p.fInvMs) return 0;
  var t = p.fInvMs + DIAS_CONVOCATORIA * 864e5;
  if (p.rec) t = Math.max(t, p.rec + DIAS_TRAS_AVISO * 864e5);
  return t;
}
function vencida_(p) { return p.estado === 'Convocada' && !!p.fInvMs && !!p.rec && Date.now() >= vencimientoMs_(p); }
// Las convocatorias que ya vencieron (y todavía no las borró la tarea diaria) no cuentan: la posición se ve Por convocar. Con conVencidas se incluyen.
function readAll_(conVencidas) {
  var s = sheet_();
  var n = s.getLastRow() - 1;
  if (n < 1) return [];
  var out = s.getRange(2, 1, n, COLS).getValues().map(function (r, i) {
    var p = { row: i + 2, pos: String(r[0]), alcance: Number(r[1]) || depth_(r[0]), nombre: clean_(r[2], 60), correo: normMail_(r[3]),
      invito: String(r[4] || ''), estado: legado_(clean_(r[5])) || 'Convocada', fInv: fmtDate_(r[6]), fInvMs: dateMs_(r[6]), fEnt: fmtDate_(r[7]), loQueImporta: cleanLoQueImporta_(r[8]),
      arbol: String(r[9] || 't1'), ent: dateMs_(r[7]), ciudad: clean_(r[10], 80), lugar: clean_(r[11], 120), punto: String(r[12] || ''), rec: dateMs_(r[13]) };
    p.vencida = vencida_(p);
    return p;
  }).filter(function (p) { return p.pos && p.pos !== 'undefined'; });
  return conVencidas ? out : out.filter(function (p) { return !p.vencida; });
}
// Durante la migración la hoja puede traer todavía 'Convocada': se lee como 'Convocada'.
// Valores viejos de la planilla: 'Invitada' se lee como 'Convocada' y 'Activa' como 'Aceptada'.
function legado_(e) { return e === 'Invitada' ? 'Convocada' : e === 'Activa' ? 'Aceptada' : e; }
function readTrees_() {
  var a = sheetArb_();
  if (!a) return [];
  var n = a.getLastRow() - 1;
  if (n < 1) return [];
  return a.getRange(2, 1, n, ACOLS).getValues().map(function (r, i) {
    var lista = function (v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); };
    var prop = r[6] ? { tema: clean_(r[6], 60), lugar: clean_(r[7], 240), de: String(r[8] || '') } : null;
    return { row: i + 2, id: String(r[0]), tema: clean_(r[1], 60), lugar: clean_(r[2], 240),
      acordado: clean_(r[3]) === 'Tema acordado', planto: normMail_(r[4]), fecha: fmtDate_(r[5]), prop: prop,
      acuerdos: lista(r[9]), vacantes: lista(r[11]) };
  }).filter(function (t) { return t.id; });
}
function treeById_(trees, id) { return trees.filter(function (t) { return t.id === id; })[0] || null; }
function peopleOf_(all, arbol) { return all.filter(function (p) { return p.arbol === arbol; }); }
function rowsOf_(all, correo) { return all.filter(function (p) { return p.correo === correo; }); }
function index_(people) { var m = {}; people.forEach(function (p) { m[p.pos] = p; }); return m; }
function appendTree_(id, correo) {
  var a = sheetArb_();
  var row = Math.max(a.getLastRow(), 1) + 1;
  a.getRange(row, 1, 1, ACOLS).setValues([[id, '', '', 'Sin tema', correo, new Date(), '', '', '', '', '', '']]);
  a.getRange(row, 1).setNumberFormat('@');
  return row;
}
function pad_(fila) { while (fila.length < COLS) fila.push(''); return fila; }
function nextTreeId_(trees) {
  var max = 0;
  trees.forEach(function (t) { var m = /^t(\d+)$/.exec(t.id); if (m) max = Math.max(max, Number(m[1])); });
  return 't' + (max + 1);
}
// Cómo se muestra un árbol: su tema acordado o, mientras no hay tema, la semilla con los nombres de quienes ya están en ella.
function treeLabel_(tree, people) {
  if (tree && tree.acordado && tree.tema) return tree.tema;
  var names = SEMILLA.map(function (pos) { return people.filter(function (p) { return p.pos === pos && p.estado === 'Aceptada'; })[0]; })
    .filter(Boolean).map(function (p) { return String(p.nombre || '').split(' ')[0]; }).filter(Boolean);
  if (!names.length) return 'Semilla nueva';
  var last = names.pop();
  return 'Semilla de ' + (names.length ? names.join(', ') + (/^h?i[^aeou]/i.test(last) || /^h?i$/i.test(last) ? ' e ' : ' y ') : '') + last;
}

// Quién ocupa un lugar: la persona de esa posición o, por entrelazado, la de la posición sin los ".1" finales.
function occupant_(map, slot) {
  var s = slot;
  while (true) {
    if (map[s]) return map[s];
    if (s.slice(-2) === '.1') s = s.slice(0, -2); else return null;
  }
}
// Las tres posiciones del triángulo que contiene un lugar
function triangleOf_(slot) {
  var par = parent_(slot);
  return par ? [par + '.1', par + '.2', par + '.3'] : ['1', '2', '3'];
}
function complete_(map, slots) {
  return slots.every(function (s) { var o = occupant_(map, s); return o && o.estado === 'Aceptada'; });
}
// El lugar que ocupa una persona en un alcance dado (igual o mayor al de entrada)
function slotAt_(person, a) {
  var s = person.pos;
  for (var i = person.alcance; i < a; i++) s += '.1';
  return s;
}
// Un alcance está completo cuando tiene a sus 3^a personas aceptadas.
function completoA_(people, a) {
  return people.filter(function (p) { return p.estado === 'Aceptada' && p.alcance <= a; }).length === Math.pow(3, a);
}
// Por qué un alcance todavía no se puede abrir ('' si se puede): primero hace falta el tema y, desde el alcance 4, tener completo el alcance N−3.
function motivoAlcance_(tree, people, a) {
  if (a <= 1) return '';
  if (!tree || !tree.acordado) return 'Se abre cuando la semilla acuerde el tema.';
  if (a >= 4 && !completoA_(people, a - 3)) return 'Se abre cuando se complete el alcance ' + (a - 3) + '.';
  return '';
}
function hayDebajo_(people, base) { return people.some(function (p) { return p.pos.indexOf(base + '.') === 0; }); }
function esVacante_(tree, pos) { return !!tree && (tree.vacantes || []).indexOf(pos) >= 0; }
// Las personas aceptadas que comparten la tríada donde está una posición (sin contar la propia posición).
function companierasDe_(map, pos) {
  var vistas = {}, out = [];
  triangleOf_(pos).forEach(function (sl) { var o = occupant_(map, sl); if (o && o.estado === 'Aceptada' && o.pos !== pos && !vistas[o.pos]) { vistas[o.pos] = 1; out.push(o); } });
  return out;
}
// Una posición que quedó por convocar porque alguien se fue la pueden convocar las otras dos personas de su tríada.
function puedeConvocarVacante_(tree, map, me, pos) {
  return !!me && me.estado === 'Aceptada' && esVacante_(tree, pos) && !occupant_(map, pos) && companierasDe_(map, pos).some(function (o) { return o.pos === me.pos; });
}
// Gestiona una convocatoria (reenviar, cancelar) quien la hizo o, si esa persona ya no está, las otras dos de su tríada.
function gestionaConvocatoria_(map, target, me) {
  if (!me || me.estado !== 'Aceptada' || target.estado !== 'Convocada') return false;
  if (target.invito === me.pos) return true;
  var conv = map[target.invito];
  if (conv && conv.estado === 'Aceptada') return false;
  return companierasDe_(map, target.invito).some(function (o) { return o.pos === me.pos; });
}
// Quienes reciben los avisos de una convocatoria: la persona que la hizo o, si ya no está, las otras dos de su tríada.
function quienesConvocaron_(people, invito) {
  var map = index_(people), conv = map[invito];
  if (conv && conv.estado === 'Aceptada') return [conv];
  return companierasDe_(map, invito);
}
// Quienes coordinan las solicitudes de sumarse: la persona 1 o, si no está, las otras dos de la semilla.
function coordinan_(people) {
  var map = index_(people);
  if (map['1'] && map['1'].estado === 'Aceptada') return [map['1']];
  return ['2', '3'].map(function (x) { return map[x]; }).filter(function (p) { return p && p.estado === 'Aceptada'; });
}
function coordina_(people, me) { return !!me && me.estado === 'Aceptada' && coordinan_(people).some(function (p) { return p.pos === me.pos; }); }
// Triángulos que abre una persona: uno por alcance, desde el siguiente al de su entrada, sin esperar a que se complete el anterior.
// Se muestra hasta el primer alcance todavía cerrado, con su motivo.
function trianglesOf_(person, map, tree, people) {
  var out = [];
  var from = person.pos === '1' ? 1 : person.alcance + 1;
  for (var a = from; a <= MAX_ALCANCE; a++) {
    var base = a === 1 ? '' : slotAt_(person, a - 1);
    var slots = base ? [base + '.1', base + '.2', base + '.3'] : ['1', '2', '3'];
    var motivo = motivoAlcance_(tree, people, a);
    var lugares = slots.map(function (s, i) {
      var o = occupant_(map, s);
      return { pos: s, propio: i === 0, nombre: o ? (o.nombre || '') : '', estado: o ? o.estado : 'Por convocar',
        correo: (o && i > 0 && o.estado === 'Convocada' && o.invito === person.pos) ? o.correo : '' };
    });
    out.push({ alcance: a, abierto: !motivo, motivo: motivo, lugares: lugares });
    if (motivo) break;
  }
  return out;
}

// Cifras de un árbol: alcance completo, alcance en proceso, personas aceptadas y posiciones (entrelazadas, hasta el alcance más alto con alguien aceptado).
function cifrasArbol_(people) {
  var act = people.filter(function (p) { return p.estado === 'Aceptada'; });
  var completo = 0; while (completo < MAX_ALCANCE && completoA_(people, completo + 1)) completo++;
  var maxAlc = 0, top = 0;
  people.forEach(function (p) { if (p.alcance > maxAlc) maxAlc = p.alcance; });
  act.forEach(function (p) { if (p.alcance > top) top = p.alcance; });
  var posiciones = 0; act.forEach(function (p) { posiciones += top - p.alcance + 1; });
  return { completo: completo, enProceso: maxAlc > completo ? maxAlc : 0, personas: act.length, posiciones: posiciones };
}

// Resumen de un árbol para la lista "Tus árboles".
function treeSummary_(tree, people) {
  var c = cifrasArbol_(people);
  var act = people.filter(function (p) { return p.estado === 'Aceptada'; });
  return { id: tree.id, titulo: treeLabel_(tree, people), acordado: tree.acordado, lugar: tree.acordado ? tree.lugar : '',
    personas: c.personas, posiciones: c.posiciones, completo: c.completo, enProceso: c.enProceso,
    esArbol: act.some(function (p) { return p.alcance >= 2; }), falta: !tree.acordado && !!tree.prop };
}

function buildState_(correo, arbolPedido) {
  var all = readAll_(), trees = readTrees_();
  correo = normMail_(correo);
  var mias = correo ? rowsOf_(all, correo) : [];
  var activas = mias.filter(function (p) { return p.estado === 'Aceptada'; });
  var admin = !!(correo && activas.length && isAdminMail_(correo));
  var yo = activas.length ? { correo: correo, nombre: activas[0].nombre, loQueImporta: activas[0].loQueImporta, ciudad: activas[0].ciudad, lugar: activas[0].lugar, admin: admin } : null;
  // Qué árbol se muestra: el pedido, si existe; si no, el primero de la persona; si no, el más antiguo.
  var pick = treeById_(trees, arbolPedido);
  if (!pick && mias.length) pick = treeById_(trees, mias[0].arbol);
  if (!pick) pick = trees[0] || null;
  var people = pick ? peopleOf_(all, pick.id) : [];
  var map = index_(people);
  var mine = yo ? people.filter(function (p) { return p.correo === correo; })[0] : null;
  var me = mine ? { pos: mine.pos, nombre: mine.nombre, correo: mine.correo, estado: mine.estado, loQueImporta: mine.loQueImporta, admin: admin } : null;
  function lugar(slot, owner, motivo) {
    var o = occupant_(map, slot);
    var l = { pos: slot, pid: o ? o.pos : '', nombre: o ? o.nombre : '', estado: o ? o.estado : 'Por convocar', yo: !!(me && o && o.pos === me.pos) };
    if (o && o.estado === 'Convocada' && gestionaConvocatoria_(map, o, me)) { l.correo = o.correo; l.mia = true; }
    if (!o && me && me.estado === 'Aceptada') {
      if (owner && owner.pos === me.pos) { if (motivo) l.bloqueo = motivo; else l.puedoInvitar = true; }
      else if (puedeConvocarVacante_(pick, map, me, slot)) l.puedoInvitar = true;
    }
    return l;
  }
  var alcances = [], alcanzado = 0, activos = people.filter(function (p) { return p.estado === 'Aceptada'; }).length;
  var bases = [''];
  for (var a = 1; a <= MAX_ALCANCE && bases.length; a++) {
    var triadas = [], nextBases = [];
    bases.forEach(function (base) {
      var slots = base ? [base + '.1', base + '.2', base + '.3'] : ['1', '2', '3'];
      var owner = base ? occupant_(map, base) : (map['1'] || null);
      var ownerOk = !!owner && owner.estado === 'Aceptada';
      if (!base && !people.length) return;
      // Si quien abrió esta tríada se fue, la tríada se sigue viendo mientras haya gente en ella.
      if (base && !ownerOk && !hayDebajo_(people, base)) return;
      var motivo = pick ? motivoAlcance_(pick, people, a) : '';
      var primera = ownerOk && base === owner.pos;
      var mia = ownerOk && !!me && me.estado === 'Aceptada' && owner.pos === me.pos;
      var ocupada = slots.some(function (s) { return !!map[s]; });
      // Un alcance todavía cerrado se ve solo si es la primera tríada de alguien, si es de quien mira (para que vea por qué) o si ya hay gente en él.
      if (base && motivo && !primera && !mia && !ocupada) return;
      var ls = slots.map(function (s) { return lugar(s, ownerOk ? owner : null, motivo); });
      triadas.push({ base: base, duenio: ownerOk ? owner.nombre : '', lugares: ls, completa: complete_(map, slots) });
      ls.forEach(function (l) { if (l.estado === 'Aceptada' || hayDebajo_(people, l.pos)) nextBases.push(l.pos); });
    });
    var personas = people.filter(function (p) { return p.estado === 'Aceptada' && p.alcance <= a; }).length;
    var total = Math.pow(3, a);
    if (!triadas.length) break;
    alcances.push({ alcance: a, personas: personas, total: total, triadas: triadas });
    if (personas === total && alcanzado === a - 1) alcanzado = a;
    bases = nextBases.filter(function (b, i) { return nextBases.indexOf(b) === i; });
  }
  // Orden de entrada de las personas activas: el cliente lo usa para dar a cada una un color propio que no cambia.
  var orden = people.filter(function (p) { return p.estado === 'Aceptada'; })
    .sort(function (a, b) { return (a.ent - b.ent) || (a.row - b.row); }).map(function (p) { return p.pos; });
  var loQueImporta = {}; people.forEach(function (p) { if (p.estado === 'Aceptada' && p.loQueImporta) loQueImporta[p.pos] = p.loQueImporta; });
  var ubic = {}; people.forEach(function (p) { if (p.estado === 'Aceptada' && (p.ciudad || p.lugar)) ubic[p.pos] = { ciudad: p.ciudad, lugar: p.lugar }; });

  var arbol = null;
  if (pick) {
    var semilla = SEMILLA.map(function (pos) { var p = map[pos]; return { pos: pos, nombre: p && p.estado === 'Aceptada' ? p.nombre : '', activa: !!(p && p.estado === 'Aceptada'), acuerda: pick.acuerdos.indexOf(pos) >= 0 }; });
    var cif = cifrasArbol_(people);
    arbol = { id: pick.id, titulo: treeLabel_(pick, people), acordado: pick.acordado, lugar: pick.acordado ? pick.lugar : '',
      personas: cif.personas, posiciones: cif.posiciones, completo: cif.completo, enProceso: cif.enProceso,
      prop: pick.acordado ? null : pick.prop, semilla: semilla,
      soySemilla: !!(me && me.estado === 'Aceptada' && SEMILLA.indexOf(me.pos) >= 0) };
    if (arbol.prop) { var de = map[arbol.prop.de]; arbol.prop.deNombre = de ? de.nombre : ''; }
  }
  // Los árboles de la persona y, después, todos los demás: en WhatMatters todo es transparente.
  var arboles = [];
  if (yo) {
    var vistos = {};
    mias.forEach(function (m) {
      if (vistos[m.arbol]) return; var t = treeById_(trees, m.arbol); if (!t) return; vistos[m.arbol] = true;
      var s = treeSummary_(t, peopleOf_(all, t.id)); s.pos = m.pos; s.estado = m.estado; arboles.push(s);
    });
    trees.forEach(function (t) { if (vistos[t.id]) return; var s = treeSummary_(t, peopleOf_(all, t.id)); s.ajeno = true; arboles.push(s); });
  } else {
    trees.forEach(function (t) { var s = treeSummary_(t, peopleOf_(all, t.id)); s.ajeno = true; arboles.push(s); });
  }
  // Quieren sumarse: los pedidos vigentes de este árbol (sin correos) y, para la persona 1, los posiciones por convocar donde se puede convocar.
  var pedidos = [], libres = [], puedoPedir = false, miPedido = false;
  if (pick) {
    var soyP1 = coordina_(people, me); // quien coordina las solicitudes: la persona 1 o, si no está, las otras dos de la semilla
    var vig = readPedidos_().filter(function (q) { return q.arbol === pick.id && pedidoVigente_(q); });
    pedidos = vig.filter(function (q) { return q.estado === 'Pendiente' || q.estado === 'Asignada'; }).map(function (q) {
      var asig = q.asignado ? map[q.asignado] : null;
      return { id: q.id, nombre: q.nombre, loQueImporta: q.loQueImporta, mensaje: q.mensaje, fecha: q.fechaTxt, estado: q.estado, lugar: q.lugar,
        asignado: q.asignado, asignadoNombre: asig ? asig.nombre : '', soyP1: soyP1,
        soyAsignada: !!(me && me.estado === 'Aceptada' && q.estado === 'Asignada' && me.pos === q.asignado) };
    });
    if (soyP1 && pedidos.length) libres = libresDe_(people, pick);
    miPedido = !!(correo && vig.some(function (q) { return q.correo === correo; }));
    puedoPedir = !mine && !miPedido && !(yo && mias.length >= MAX_ARBOLES) && coordinan_(people).length > 0;
  }
  var _mails = {}, _pos = 0; all.forEach(function (p) { if (p.estado === 'Aceptada') _mails[p.correo] = 1; });
  arboles.forEach(function (t) { _pos += t.posiciones; });
  return { vacio: all.length === 0, redPersonas: Object.keys(_mails).length, redPosiciones: _pos, activos: activos, loQueImporta: loQueImporta, ubic: ubic, alcanzado: alcanzado, max: MAX_ALCANCE, yo: yo, me: me,
    alcances: alcances, orden: orden, arbol: arbol, arboles: arboles, maxArboles: MAX_ARBOLES,
    puedoPlantar: !!(yo && mias.length < MAX_ARBOLES), pedidos: pedidos, libres: libres, puedoPedir: puedoPedir, miPedido: miPedido };
}

// ---------- correo y sesiones ----------
var APP_NAME = 'WhatMatters';
function appUrl_() { try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; } }
function escHtml_(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
// ctaAfter: cuántas líneas van antes del botón (por defecto, todas). El enlace de respaldo va siempre al final.
function sendMail_(to, subject, lines, cta, link, ctaAfter) {
  var url = link || appUrl_(), n = ctaAfter == null ? lines.length : ctaAfter;
  var p = function (l) { return '<p style="margin:0 0 12px">' + l + '</p>'; };
  var btn = cta && url ? '<p style="margin:16px 0 20px"><a href="' + url + '" style="background:#1F4E3D;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">' + escHtml_(cta) + '</a></p>' : '';
  var html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#16231E;max-width:520px">' +
    lines.slice(0, n).map(p).join('') + btn + lines.slice(n).map(p).join('') +
    (btn ? '<p style="margin:12px 0 0;font-size:13px;color:#5C6B63">Si el botón no funciona, este es el enlace: ' + url + '</p>' : '') +
    '</div>';
  var plain = function (l) { return l.replace(/<br>/g, '\n').replace(/<[^>]+>/g, ''); };
  var text = lines.slice(0, n).map(plain).join('\n\n') + (btn ? '\n\n' + url : '') + (lines.length > n ? '\n\n' + lines.slice(n).map(plain).join('\n\n') : '');
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, body: text, name: APP_NAME });
}
function newToken_() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8); }
function emailFromToken_(token) {
  token = String(token || '');
  if (!/^[a-f0-9]{40}$/.test(token)) return '';
  return PropertiesService.getScriptProperties().getProperty('tok_' + token) || '';
}
function issueToken_(correo) {
  var t = newToken_();
  PropertiesService.getScriptProperties().setProperty('tok_' + t, correo);
  return t;
}
// La persona de la sesión, activa en al menos un árbol.
function requireYo_(all, token) {
  var correo = emailFromToken_(token);
  var rows = correo ? rowsOf_(all, correo) : [];
  var act = rows.filter(function (p) { return p.estado === 'Aceptada'; });
  if (!act.length) fail_('La sesión venció: hace falta volver a entrar con el correo.');
  return { correo: correo, rows: rows, activa: act[0], admin: isAdminMail_(correo) };
}
// La persona de la sesión, activa en este árbol.
function requireMeActive_(people, token) {
  var correo = emailFromToken_(token);
  var me = correo ? people.filter(function (p) { return p.correo === correo && p.estado === 'Aceptada'; })[0] : null;
  if (!me) fail_('La sesión venció o no estás en este árbol: hace falta volver a entrar con el correo.');
  return me;
}

// Para autorizar el envío de correos: ejecutar esta función una vez desde el editor.
function autorizar() { Logger.log('Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota()); }

// ---------- API ----------
function getState(token, inv, arbol) {
  ensureSetup_();
  var info = inv ? inviteFrom_(inv) : null;
  var st = buildState_(emailFromToken_(token), info ? info.arbol : String(arbol || ''));
  if (inv) {
    var all = readAll_(true), trees = readTrees_();
    var p = info ? peopleOf_(all, info.arbol).filter(function (x) { return x.correo === info.correo; })[0] : null;
    var t = info ? treeById_(trees, info.arbol) : null;
    if (info && (info.vencida || (p && p.vencida))) {
      // Venció: se ve desde el enlace del correo, con la opción de solicitar una convocatoria nueva.
      var gente = peopleOf_(all, info.arbol), d = vencidaDe_(info, p, gente);
      st.invitacion = { estado: 'Vencida', correo: info.correo, pos: d.pos, de: d.de, arbol: info.arbol, arbolTema: t && t.acordado ? t.tema : '',
        conocida: rowsOf_(all, info.correo).some(function (x) { return x.estado === 'Aceptada'; }),
        enTres: rowsOf_(all, info.correo).filter(function (x) { return !x.vencida; }).length >= MAX_ARBOLES,
        solicitada: readPedidos_().some(function (q) { return q.arbol === info.arbol && q.correo === info.correo && pedidoVigente_(q); }) };
    } else if (p && p.estado === 'Convocada') {
      var people = peopleOf_(all, info.arbol);
      var de = people.filter(function (x) { return x.pos === p.invito; })[0];
      st.invitacion = { correo: p.correo, pos: p.pos, estado: 'Convocada', de: de ? (de.nombre || '') : '', arbol: info.arbol,
        arbolTema: t && t.acordado ? t.tema : '', conocida: rowsOf_(all, p.correo).some(function (x) { return x.estado === 'Aceptada'; }) };
    } else st.invitacion = { estado: 'Usada', correo: p ? p.correo : (info ? info.correo : '') };
  }
  return st;
}
function newInvite_(correo, arbol) {
  var k = newToken_();
  PropertiesService.getScriptProperties().setProperty('inv_' + k, JSON.stringify({ correo: correo, arbol: arbol }));
  return k;
}
function inviteFrom_(k) {
  k = String(k || '');
  if (!/^[a-f0-9]{40}$/.test(k)) return null;
  var raw = PropertiesService.getScriptProperties().getProperty('inv_' + k);
  if (!raw) return null;
  try { var d = JSON.parse(raw); if (d && d.correo) return { correo: d.correo, arbol: d.arbol || 't1', vencida: !!d.vencida, pos: String(d.pos || ''), invito: String(d.invito || ''), de: String(d.de || '') }; } catch (e) {}
  return { correo: raw, arbol: 't1', vencida: false, pos: '', invito: '', de: '' }; // invitaciones de antes de que hubiera varios árboles
}
// Los datos de una convocatoria vencida: de la fila, si todavía está, o de lo que quedó guardado en el enlace.
function vencidaDe_(info, p, gente) {
  var pos = p ? p.pos : info.pos, invito = p ? p.invito : info.invito, de = info.de;
  if (p) { var c = gente.filter(function (x) { return x.pos === invito && x.estado === 'Aceptada'; })[0]; de = c ? c.nombre : ''; }
  return { pos: pos, invito: invito, de: de };
}
// Al vencer una convocatoria, sus enlaces quedan guardados como vencidos (con quién convocó y a qué posición) para poder mostrarlo y solicitar una nueva.
function marcarVencida_(p, deNombre) {
  var props = PropertiesService.getScriptProperties(), all = props.getProperties(), marcado = false;
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('inv_') !== 0) return;
    var d = inviteFrom_(k.slice(4));
    if (d && d.correo === p.correo && d.arbol === p.arbol) { props.setProperty(k, JSON.stringify({ correo: p.correo, arbol: p.arbol, vencida: true, pos: p.pos, invito: p.invito, de: deNombre || '' })); marcado = true; }
  });
  return marcado;
}
function dropInvites_(correo, arbol) {
  var props = PropertiesService.getScriptProperties(), all = props.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('inv_') !== 0) return;
    var d = inviteFrom_(k.slice(4));
    if (d && d.correo === correo && (!arbol || d.arbol === arbol)) props.deleteProperty(k);
  });
}
// Enlace personal de los avisos: entra como quien recibió el correo. Sirve una vez y vence a los 7 días.
var ACCESS_DAYS = 7;
function accessLink_(correo, minutos, arbol) {
  var u = appUrl_(); if (!u) return '';
  var props = PropertiesService.getScriptProperties(), all = props.getProperties(), now = Date.now();
  Object.keys(all).forEach(function (k) { if (k.indexOf('acc_') === 0) { try { if (JSON.parse(all[k]).exp < now) props.deleteProperty(k); } catch (e) { props.deleteProperty(k); } } });
  var k = newToken_();
  props.setProperty('acc_' + k, JSON.stringify({ correo: correo, exp: now + (minutos ? minutos * 6e4 : ACCESS_DAYS * 864e5), arbol: arbol || '' }));
  return u + '?acc=' + k + (arbol ? '&arbol=' + arbol : '');
}
function entrarConEnlace(acc, nombre, loQueImporta, ubic) {
  acc = String(acc || '');
  if (!/^[a-f0-9]{40}$/.test(acc)) fail_('Este enlace no es válido. Se puede entrar con el correo desde la app.');
  var props = PropertiesService.getScriptProperties(), raw = props.getProperty('acc_' + acc);
  if (!raw) fail_('Este enlace ya se usó o venció. Se puede entrar con el correo desde la app.');
  var d = JSON.parse(raw);
  if (d.exp < Date.now()) { props.deleteProperty('acc_' + acc); fail_('Este enlace venció. Se puede entrar con el correo desde la app.'); }
  var all = readAll_();
  var rows = rowsOf_(all, d.correo);
  var act = rows.filter(function (p) { return p.estado === 'Aceptada'; })[0];
  if (act) {
    props.deleteProperty('acc_' + acc);
    return { token: issueToken_(d.correo), nombre: act.nombre, arbol: d.arbol || '' };
  }
  if (!rows.length && all.length > 0) { props.deleteProperty('acc_' + acc); fail_('Este correo no tiene convocatoria.'); }
  // Primera vez: falta el nombre. El enlace no se gasta hasta que lo escriba.
  var primera = rows.filter(function (p) { return p.estado === 'Convocada'; })[0];
  nombre = clean_(nombre, 60); loQueImporta = cleanLoQueImporta_(loQueImporta);
  if (!nombre && !loQueImporta) return { necesitaNombre: true, pos: primera ? primera.pos : '1', correo: d.correo };
  needNombreLoQueImporta_(nombre, loQueImporta);
  ubic = cleanUbic_(ubic, true);
  props.deleteProperty('acc_' + acc);
  var res = withLock_(function () { return ocuparLugar_(d.correo, nombre, loQueImporta, ubic); });
  CacheService.getScriptCache().remove('code_' + d.correo);
  if (res.aviso) { try { avisoEntrada_(res.aviso); } catch (e) {} }
  return { token: issueToken_(d.correo), nombre: nombre, arbol: res.arbol };
}
// Ocupa el lugar de quien entra por primera vez: su invitación más antigua, o la semilla del primer árbol si no hay nadie.
function ocuparLugar_(correo, nombre, loQueImporta, ubic) {
  var all = readAll_();
  var rows = rowsOf_(all, correo);
  var s = sheet_();
  var act = rows.filter(function (p) { return p.estado === 'Aceptada'; })[0];
  if (act) return { aviso: null, arbol: act.arbol };
  var mine = rows.filter(function (p) { return p.estado === 'Convocada'; })[0];
  if (mine) {
    s.getRange(mine.row, 3).setValue(nombre);
    s.getRange(mine.row, 6).setValue('Aceptada');
    s.getRange(mine.row, 8).setValue(new Date());
    s.getRange(mine.row, 9).setValue(loQueImporta);
    escribirUbic_(mine.row, ubicDeFila_(ubic));
    dropInvites_(correo, mine.arbol);
    var inv = peopleOf_(all, mine.arbol).filter(function (p) { return p.pos === mine.invito; })[0];
    return { aviso: inv && inv.correo ? { to: inv.correo, nombre: nombre, pos: mine.pos, arbol: mine.arbol } : null, arbol: mine.arbol };
  }
  if (all.length === 0) {
    var trees = readTrees_();
    var id = treeById_(trees, 't1') ? nextTreeId_(trees) : 't1';
    if (!treeById_(trees, id)) appendTree_(id, correo);
    s.getRange(2, 1, 1, COLS).setNumberFormats(FORMATS);
    s.getRange(2, 1, 1, COLS).setValues([pad_(['1', 1, nombre, correo, '', 'Aceptada', new Date(), new Date(), loQueImporta, id])]);
    escribirUbic_(2, ubicDeFila_(ubic));
    return { aviso: null, arbol: id };
  }
  fail_('Este correo no tiene convocatoria.');
}
function avisoEntrada_(aviso) {
  sendMail_(aviso.to, aviso.nombre + ' entró a tu tríada en WhatMatters',
    [escHtml_(aviso.nombre) + ' aceptó tu convocatoria y ocupa la posición ' + aviso.pos + ' de tu tríada.',
     '<span style="font-size:13px;color:#5C6B63">El botón te hace entrar con tu cuenta. Es personal: conviene no reenviar este correo.</span>'],
    'Ver el árbol', accessLink_(aviso.to, 0, aviso.arbol));
}
function inviteLink_(correo, arbol) { var u = appUrl_(); return u ? u + '?inv=' + newInvite_(correo, arbol) : ''; }
function inviteLines_(de, pos, tree) {
  var conTema = !!(tree && tree.acordado && tree.tema);
  var donde = conTema ? 'del árbol «' + escHtml_(tree.tema) + '» de WhatMatters' : 'semilla de un árbol nuevo de WhatMatters';
  var lines = ['Hola:', escHtml_(de) + ' te convocó a su tríada ' + donde + ', en la posición ' + pos + '.'];
  if (!conTema) lines.push('El tema de este árbol lo acuerdan las tres personas de la semilla.');
  lines.push('Con el botón podés ver la convocatoria.'); // Pendiente: una frase que explique que el botón entra sin clave
  return lines;
}

// Aceptar desde el enlace del correo: la llave prueba que la persona recibió la invitación.
function aceptarInvitacion(inv, nombre, loQueImporta, ubic) {
  var info = inviteFrom_(inv);
  if (!info) fail_('Esta convocatoria ya no es válida. Quien te convocó puede reenviártela.');
  fallaSiVencida_(info);
  nombre = clean_(nombre, 60); loQueImporta = cleanLoQueImporta_(loQueImporta);
  var aviso = withLock_(function () {
    var all = readAll_();
    var act = rowsOf_(all, info.correo).filter(function (p) { return p.estado === 'Aceptada'; })[0];
    // Quien ya está en otro árbol entra con su perfil de siempre.
    var ub;
    if (act) { nombre = act.nombre; loQueImporta = act.loQueImporta; ub = { ciudad: act.ciudad, lugar: act.lugar, punto: act.punto }; }
    else { needNombreLoQueImporta_(nombre, loQueImporta); ub = ubicDeFila_(cleanUbic_(ubic, true)); }
    return activar_(all, info.correo, info.arbol, nombre, loQueImporta, ub);
  });
  dropInvites_(info.correo, info.arbol);
  if (aviso) { try { avisoEntrada_(aviso); } catch (e) {} }
  return { token: issueToken_(info.correo), arbol: info.arbol };
}
// Aceptar desde la app una invitación a otro árbol.
function aceptarEnApp(token, arbol) {
  arbol = String(arbol || '');
  var yo = null;
  fallaSiVencida_({ correo: emailFromToken_(token), arbol: arbol });
  var aviso = withLock_(function () {
    var all = readAll_();
    yo = requireYo_(all, token);
    return activar_(all, yo.correo, arbol, yo.activa.nombre, yo.activa.loQueImporta, { ciudad: yo.activa.ciudad, lugar: yo.activa.lugar, punto: yo.activa.punto });
  });
  dropInvites_(yo.correo, arbol);
  if (aviso) { try { avisoEntrada_(aviso); } catch (e) {} }
  return true;
}
// Una convocatoria que ya venció no se puede aceptar: hace falta una nueva.
function fallaSiVencida_(info) {
  var v = peopleOf_(readAll_(true), info.arbol).filter(function (p) { return p.correo === info.correo && p.vencida; })[0];
  if (info.vencida || v) fail_('Esta convocatoria venció. Para sumarse hace falta una convocatoria nueva.');
}
function activar_(all, correo, arbol, nombre, loQueImporta, ub) {
  var people = peopleOf_(all, arbol);
  var mine = people.filter(function (p) { return p.correo === correo; })[0];
  if (!mine) fail_('Esta convocatoria fue cancelada.');
  if (mine.estado === 'Aceptada') return null;
  var s = sheet_();
  s.getRange(mine.row, 3).setValue(nombre);
  s.getRange(mine.row, 6).setValue('Aceptada');
  s.getRange(mine.row, 8).setValue(new Date());
  s.getRange(mine.row, 9).setValue(loQueImporta);
  s.getRange(mine.row, 14).setValue('');
  escribirUbic_(mine.row, ub);
  quitarVacante_(arbol, mine.pos); // si era una posición que quedó por convocar porque alguien se fue, ya está ocupada
  var avisa = quienesConvocaron_(people, mine.invito)[0];
  return avisa && avisa.correo ? { to: avisa.correo, nombre: nombre, pos: mine.pos, arbol: arbol } : null;
}

// Paso 1: pedir un código. Solo para correos invitados (o la primera persona de la red).
function pedirCodigo(correo) {
  correo = normMail_(correo);
  if (!isMail_(correo)) fail_('El correo no es válido.');
  var all = readAll_();
  var rows = rowsOf_(all, correo);
  if (!rows.length && all.length > 0) fail_('Este correo no tiene convocatoria. Para entrar, alguien que ya esté en un árbol tiene que convocarte con este correo.');
  var cache = CacheService.getScriptCache();
  if (cache.get('wait_' + correo)) fail_('Ya te mandamos un código hace menos de un minuto. Puede estar en tu correo o en la carpeta de spam.');
  var code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('code_' + correo, code, 900);
  cache.put('tries_' + correo, '0', 900);
  cache.put('wait_' + correo, '1', 60);
  var activa = rows.some(function (p) { return p.estado === 'Aceptada'; });
  var primera = rows.filter(function (p) { return p.estado === 'Convocada'; })[0];
  var pos = primera ? primera.pos : '1';
  // El botón entra directo (o lleva a escribir el nombre la primera vez); el código sirve para otro dispositivo.
  sendMail_(correo, 'Tu acceso a WhatMatters',
    [activa ? 'Con este botón entrás a WhatMatters.' : 'Con este botón ocupás tu posición (' + pos + ') en WhatMatters.',
     'Si estás usando la app en otro dispositivo o navegador, ahí se escribe este código:',
     '<b style="font-size:24px;letter-spacing:4px">' + code + '</b>',
     '<span style="font-size:13px;color:#5C6B63">El botón y el código vencen en 15 minutos y sirven una sola vez. Si no lo pediste, no hace falta hacer nada.</span>'],
    activa ? 'Entrar' : 'Ocupar mi posición', accessLink_(correo, 15), 1);
  return { necesitaNombre: !activa, pos: pos };
}

// Paso 2: verificar el código. Devuelve una sesión. Si la persona entra por primera vez, ocupa su lugar con su nombre.
function verificarCodigo(correo, code, nombre, loQueImporta, ubic) {
  correo = normMail_(correo); code = String(code || '').replace(/\D/g, ''); nombre = clean_(nombre, 60); loQueImporta = cleanLoQueImporta_(loQueImporta);
  var cache = CacheService.getScriptCache();
  var expected = cache.get('code_' + correo);
  if (!expected) fail_('El código venció o no existe. Se puede pedir uno nuevo.');
  var tries = Number(cache.get('tries_' + correo) || 0);
  if (tries >= 5) { cache.remove('code_' + correo); fail_('Demasiados intentos. Se puede pedir un código nuevo.'); }
  if (code !== expected) { cache.put('tries_' + correo, String(tries + 1), 900); fail_('El código no coincide.'); }
  var res = withLock_(function () {
    var act = rowsOf_(readAll_(), correo).filter(function (p) { return p.estado === 'Aceptada'; })[0];
    if (act) return { aviso: null, arbol: act.arbol };
    needNombreLoQueImporta_(nombre, loQueImporta);
    return ocuparLugar_(correo, nombre, loQueImporta, cleanUbic_(ubic, true));
  });
  cache.remove('code_' + correo);
  if (res.aviso) { try { avisoEntrada_(res.aviso); } catch (e) {} }
  return { token: issueToken_(correo), ok: true, arbol: res.arbol };
}

function cerrarSesion(token) {
  if (emailFromToken_(token)) PropertiesService.getScriptProperties().deleteProperty('tok_' + token);
  return true;
}

function invitar(token, arbol, pos, correoInvitado) {
  arbol = String(arbol || '');
  procesarVencimientos_(); // si hay convocatorias vencidas sin borrar, se cierran antes (así no se pisan con la nueva)
  var datos = withLock_(function () {
    correoInvitado = normMail_(correoInvitado); pos = String(pos);
    if (!isMail_(correoInvitado)) fail_('El correo de la persona convocada no es válido.');
    var all = readAll_(), trees = readTrees_();
    var tree = treeById_(trees, arbol);
    if (!tree) fail_('No encontramos ese árbol.');
    var people = peopleOf_(all, arbol);
    var map = index_(people);
    var me = requireMeActive_(people, token);
    if (people.some(function (p) { return p.correo === correoInvitado; })) fail_('Esa persona ya está en este árbol.');
    if (rowsOf_(all, correoInvitado).length >= MAX_ARBOLES) fail_('Esa persona ya está en tres árboles, que es el máximo. Puede sumarse a este cuando libere uno.');
    if (!tree.acordado && depth_(pos) > 1) fail_('Se abre cuando la semilla acuerde el tema.');
    if (occupant_(map, pos)) fail_('Alguien ya convocó a esa posición.');
    // Una posición que quedó por convocar porque alguien se fue la pueden convocar las otras dos personas de su tríada.
    if (!puedeConvocarVacante_(tree, map, me, pos)) {
      var tri = trianglesOf_(me, map, tree, people).filter(function (t) { return t.lugares.some(function (l, i) { return i > 0 && l.pos === pos; }); })[0];
      if (!tri) {
        var a = depth_(pos), m = motivoAlcance_(tree, people, a);
        fail_(m && a > me.alcance ? m : 'Esa posición no está en una tríada tuya.');
      }
      if (!tri.abierto) fail_(tri.motivo);
    }
    var s = sheet_();
    var row = Math.max(s.getLastRow(), 1) + 1;
    s.getRange(row, 1, 1, COLS).setNumberFormats(FORMATS);
    s.getRange(row, 1, 1, COLS).setValues([pad_([pos, depth_(pos), '', correoInvitado, me.pos, 'Convocada', new Date(), '', '', arbol])]);
    return { de: me.nombre || me.correo, pos: pos, row: row, tree: tree };
  });
  dropInvites_(correoInvitado, arbol); // los enlaces de una convocatoria anterior (vencida) a esta misma persona dejan de valer
  try {
    sendMail_(correoInvitado, datos.de + ' te convoca a su tríada en WhatMatters', inviteLines_(datos.de, datos.pos, datos.tree), 'Ver la convocatoria', inviteLink_(correoInvitado, arbol));
  } catch (e) {
    withLock_(function () { sheet_().deleteRow(datos.row); });
    fail_('No pudimos mandar el correo de convocatoria (' + (e && e.message ? e.message : e) + '). La convocatoria no se guardó.');
  }
  return true;
}

function reenviarInvitacion(token, arbol, pos) {
  arbol = String(arbol || '');
  var people = peopleOf_(readAll_(), arbol);
  var me = requireMeActive_(people, token);
  var target = people.filter(function (p) { return p.pos === String(pos); })[0];
  if (!target || !gestionaConvocatoria_(index_(people), target, me)) fail_('Solo se pueden reenviar convocatorias propias que todavía no se usaron.');
  var cache = CacheService.getScriptCache();
  if (cache.get('reinv_' + target.correo + arbol)) fail_('Ya se reenvió esta convocatoria hace poco. Se puede volver a intentar en unos minutos.');
  var tree = treeById_(readTrees_(), arbol);
  // Reenviar reinicia los 7 días: el correo dice la fecha nueva.
  var hasta = new Date(Date.now() + DIAS_CONVOCATORIA * 864e5);
  withLock_(function () { sheet_().getRange(target.row, 7).setValue(new Date()); sheet_().getRange(target.row, 14).setValue(''); });
  var lineas = inviteLines_(me.nombre || me.correo, target.pos, tree);
  lineas.splice(lineas.length - 1, 0, 'Esta convocatoria vence el ' + fmtDate_(hasta) + '.');
  sendMail_(target.correo, (me.nombre || me.correo) + ' te convoca a su tríada en WhatMatters', lineas, 'Ver la convocatoria', inviteLink_(target.correo, arbol));
  cache.put('reinv_' + target.correo + arbol, '1', 300);
  return true;
}

function cancelarInvitacion(token, arbol, pos) {
  arbol = String(arbol || '');
  return withLock_(function () {
    var all = readAll_();
    var yo = requireYo_(all, token);
    var people = peopleOf_(all, arbol);
    var me = people.filter(function (p) { return p.correo === yo.correo && p.estado === 'Aceptada'; })[0];
    var target = people.filter(function (p) { return p.pos === String(pos); })[0];
    var puede = target && target.estado === 'Convocada' && (gestionaConvocatoria_(index_(people), target, me) || yo.admin);
    if (!puede) fail_('Solo se pueden cancelar convocatorias propias que todavía no se usaron.');
    sheet_().deleteRow(target.row);
    dropInvites_(target.correo, arbol);
    return true;
  });
}

// ---------- árboles ----------
// Cualquiera que ya esté en un árbol puede plantar uno nuevo: ocupa la posición 1 de la semilla e invita a las posiciones 2 y 3.
function plantarArbol(token, correo2, correo3) {
  var invitados = [normMail_(correo2), normMail_(correo3)];
  var hecho = withLock_(function () {
    var all = readAll_(), trees = readTrees_();
    var yo = requireYo_(all, token);
    if (yo.rows.length >= MAX_ARBOLES) fail_('Ya estás en tres árboles, que es el máximo.');
    invitados.forEach(function (c, i) {
      if (!c) return;
      if (!isMail_(c)) fail_('El correo de la posición ' + (i + 2) + ' no es válido.');
      if (c === yo.correo) fail_('No podés convocarte a vos misma o a vos mismo.');
      if (rowsOf_(all, c).length >= MAX_ARBOLES) fail_('La persona de la posición ' + (i + 2) + ' ya está en tres árboles, que es el máximo. Puede sumarse a este cuando libere uno.');
    });
    if (invitados[0] && invitados[0] === invitados[1]) fail_('Los dos correos son iguales.');
    var id = nextTreeId_(trees);
    appendTree_(id, yo.correo);
    var s = sheet_();
    var row = Math.max(s.getLastRow(), 1) + 1;
    s.getRange(row, 1, 1, COLS).setNumberFormats(FORMATS);
    s.getRange(row, 1, 1, COLS).setValues([pad_(['1', 1, yo.activa.nombre, yo.correo, '', 'Aceptada', new Date(), new Date(), yo.activa.loQueImporta, id])]);
    escribirUbic_(row, { ciudad: yo.activa.ciudad, lugar: yo.activa.lugar, punto: yo.activa.punto });
    return id;
  });
  var errores = [];
  invitados.forEach(function (c, i) {
    if (!c) return;
    try { invitar(token, hecho, String(i + 2), c); } catch (e) { errores.push('Posición ' + (i + 2) + ': ' + e.message); }
  });
  return { arbol: hecho, errores: errores };
}
function semillaYo_(token, arbol) {
  var all = readAll_(), trees = readTrees_();
  var tree = treeById_(trees, arbol);
  if (!tree) fail_('No encontramos ese árbol.');
  var people = peopleOf_(all, arbol);
  var me = requireMeActive_(people, token);
  if (SEMILLA.indexOf(me.pos) < 0) fail_('El tema lo acuerdan las tres personas de la semilla.');
  if (tree.acordado) fail_('El tema de este árbol ya está acordado.');
  return { tree: tree, people: people, me: me };
}
// Si las tres personas de la semilla están de acuerdo con la propuesta, el tema queda fijo.
function cerrarAcuerdo_(tree, people, acuerdos) {
  var a = sheetArb_();
  var activos = SEMILLA.filter(function (pos) { return people.some(function (p) { return p.pos === pos && p.estado === 'Aceptada'; }); });
  a.getRange(tree.row, 10).setValue(acuerdos.join(','));
  if (activos.length === 3 && SEMILLA.every(function (pos) { return acuerdos.indexOf(pos) >= 0; })) {
    a.getRange(tree.row, 2, 1, 3).setValues([[tree.prop.tema, tree.prop.lugar, 'Tema acordado']]);
    a.getRange(tree.row, 11).setValue(new Date());
    return true;
  }
  return false;
}
// Todos los árboles tienen tema y lugar (el lugar puede ser un barrio, una ciudad, una región, un país o Todo el planeta).
function proponerTema(token, arbol, tema, lugar) {
  tema = clean_(tema, 60); lugar = clean_(lugar, 240);
  if (!tema) fail_('Falta el tema del árbol.');
  if (!lugar) fail_('Falta el lugar del árbol.');
  return withLock_(function () {
    var d = semillaYo_(token, String(arbol || ''));
    sheetArb_().getRange(d.tree.row, 7, 1, 3).setValues([[tema, lugar, d.me.pos]]);
    d.tree.prop = { tema: tema, lugar: lugar, de: d.me.pos };
    return { acordado: cerrarAcuerdo_(d.tree, d.people, [d.me.pos]) };
  });
}
function acordarTema(token, arbol) {
  return withLock_(function () {
    var d = semillaYo_(token, String(arbol || ''));
    if (!d.tree.prop) fail_('Todavía no hay una propuesta de tema.');
    var acuerdos = d.tree.acuerdos.slice();
    if (acuerdos.indexOf(d.me.pos) < 0) acuerdos.push(d.me.pos);
    return { acordado: cerrarAcuerdo_(d.tree, d.people, acuerdos) };
  });
}

// ---------- quieren sumarse ----------
// Quien quiere sumarse a un árbol deja su solicitud. La persona 1 del árbol recibe el aviso y decide en qué posición se sumaría:
// si la posición es suya, convoca en el momento; si es de otra persona del árbol, esa persona recibe el aviso para convocar.
function sheetSum_() {
  var ss = SpreadsheetApp.getActive(), s = ss.getSheetByName(SHEET_SUM);
  if (!s) {
    s = ss.insertSheet(SHEET_SUM);
    headerStyle_(s.getRange(1, 1, 1, QCOLS).setValues([QHEAD]));
    s.getRange('A:A').setNumberFormat('@'); s.getRange('I:J').setNumberFormat('@');
    s.setFrozenRows(1); s.setColumnWidth(4, 180); s.setColumnWidth(5, 220); s.setColumnWidth(7, 300);
  }
  return s;
}
function readPedidos_() {
  var s = sheetSum_(), n = s.getLastRow() - 1;
  if (n < 1) return [];
  return s.getRange(2, 1, n, QCOLS).getValues().map(function (r, i) {
    var f = Object.prototype.toString.call(r[1]) === '[object Date]' ? r[1].getTime() : 0;
    return { row: i + 2, id: String(r[0]), fecha: f, fechaTxt: fmtDate_(r[1]), arbol: String(r[2]), nombre: clean_(r[3], 60), correo: normMail_(r[4]),
      loQueImporta: cleanLoQueImporta_(r[5]), mensaje: clean_(r[6], 400), estado: legado_(clean_(r[7])), lugar: String(r[8] || ''), asignado: String(r[9] || ''), clave: String(r[10] || '') };
  }).filter(function (q) { return q.id; });
}
function pedidoVigente_(q) {
  var edad = Date.now() - q.fecha;
  if (q.estado === 'Sin confirmar') return edad < 2 * 864e5;
  if (q.estado === 'Pendiente' || q.estado === 'Asignada') return edad < DIAS_PEDIDO * 864e5;
  return false;
}
// Posiciones por convocar del árbol donde ya se puede convocar, con la posición de quien convoca en cada una.
function libresDe_(people, tree) {
  var map = index_(people), out = [], visto = {};
  people.filter(function (p) { return p.estado === 'Aceptada'; }).forEach(function (p) {
    trianglesOf_(p, map, tree, people).forEach(function (t) {
      if (!t.abierto) return;
      t.lugares.forEach(function (l, i) {
        if (i === 0 || l.estado !== 'Por convocar' || visto[l.pos]) return;
        visto[l.pos] = true; out.push({ pos: l.pos, dueno: p.pos, duenoNombre: p.nombre });
      });
    });
  });
  // Las posiciones que quedaron por convocar porque alguien se fue las convocan las otras dos personas de su tríada.
  (tree.vacantes || []).forEach(function (pos) {
    if (visto[pos] || occupant_(map, pos)) return;
    var c = companierasDe_(map, pos)[0];
    if (c) { visto[pos] = true; out.push({ pos: pos, dueno: c.pos, duenoNombre: c.nombre }); }
  });
  return out.sort(function (a, b) { return a.pos.length - b.pos.length || (a.pos < b.pos ? -1 : 1); });
}
function setPedido_(q, cambios) {
  var s = sheetSum_(), cols = { estado: 8, lugar: 9, asignado: 10, clave: 11, cierre: 12 };
  Object.keys(cambios).forEach(function (k) { s.getRange(q.row, cols[k]).setValue(cambios[k]); });
}
function avisoPedido_(q) {
  var all = readAll_(), tree = treeById_(readTrees_(), q.arbol), people = peopleOf_(all, q.arbol);
  var coord = coordinan_(people);
  if (!coord.length) return;
  var lines = [escHtml_(q.nombre) + ' quiere sumarse a tu árbol «' + escHtml_(treeLabel_(tree, people)) + '».',
    'Lo que importa: <b>' + escHtml_(q.loQueImporta) + '</b>'];
  if (q.mensaje) lines.push('Su mensaje: «' + escHtml_(q.mensaje) + '»');
  if (q.vencida) lines.push('Tenía una convocatoria de ' + escHtml_(q.vencida.de || 'una persona del árbol') + ' a la posición ' + escHtml_(q.vencida.pos) + ', que venció.');
  lines.push(coord[0].pos === '1' ? 'Como persona 1 del árbol, decidís en qué posición se sumaría: puede ser una tuya, y la convocatoria sale en el momento, o la de otra persona del árbol, que recibe el aviso para convocarla.'
    : 'La persona 1 ya no está en el árbol, así que la coordinación de las solicitudes la comparten las otras dos personas de la semilla: se decide en qué posición se sumaría.');
  coord.forEach(function (c) { sendMail_(c.correo, q.nombre + ' quiere sumarse a tu árbol en WhatMatters', lines, 'Ver la solicitud', accessLink_(c.correo, 0, q.arbol)); });
}
function pedirSumarme(token, arbol, nombre, correo, loQueImporta, mensaje) {
  arbol = String(arbol || ''); mensaje = clean_(mensaje, 400);
  var r = withLock_(function () {
    var all = readAll_(), tree = treeById_(readTrees_(), arbol);
    if (!tree) fail_('No encontramos ese árbol.');
    var people = peopleOf_(all, arbol);
    if (!coordinan_(people).length) fail_('Este árbol todavía no tiene quien coordine las solicitudes.');
    var yoCorreo = emailFromToken_(token);
    var act = yoCorreo ? rowsOf_(all, yoCorreo).filter(function (p) { return p.estado === 'Aceptada'; })[0] : null;
    if (act) { correo = yoCorreo; nombre = act.nombre; loQueImporta = act.loQueImporta; }
    else {
      correo = normMail_(correo); nombre = clean_(nombre, 60); loQueImporta = cleanLoQueImporta_(loQueImporta);
      if (!isMail_(correo)) fail_('El correo no es válido.');
      needNombreLoQueImporta_(nombre, loQueImporta);
    }
    if (people.some(function (p) { return p.correo === correo; })) fail_('Ya estás en este árbol o tenés una convocatoria pendiente en él.');
    if (rowsOf_(all, correo).length >= MAX_ARBOLES) fail_('Ya estás en tres árboles, que es el máximo.');
    if (readPedidos_().some(function (q) { return q.arbol === arbol && q.correo === correo && pedidoVigente_(q); })) fail_('Ya hay una solicitud tuya para sumarte a este árbol.');
    var cache = CacheService.getScriptCache();
    if (!act && cache.get('ped_' + correo)) fail_('Ya mandamos un correo de confirmación hace poco. Puede estar en la carpeta de spam.');
    var q = { id: newToken_().slice(0, 12), arbol: arbol, nombre: nombre, correo: correo, loQueImporta: loQueImporta, mensaje: mensaje, clave: act ? '' : newToken_() };
    var s = sheetSum_(), row = Math.max(s.getLastRow(), 1) + 1;
    s.getRange(row, 1, 1, QCOLS).setValues([[q.id, new Date(), arbol, nombre, correo, loQueImporta, mensaje, act ? 'Pendiente' : 'Sin confirmar', '', '', q.clave, '']]);
    if (!act) cache.put('ped_' + correo, '1', 120);
    q.tree = tree; q.people = people;
    return q;
  });
  if (!r.clave) { try { avisoPedido_(r); } catch (e) {} return { confirmar: false }; }
  var u = appUrl_();
  sendMail_(r.correo, 'Tu solicitud para sumarte a WhatMatters',
    ['Hola, ' + escHtml_(r.nombre) + ':', 'Con este botón se confirma tu solicitud para sumarte al árbol «' + escHtml_(treeLabel_(r.tree, r.people)) + '». Después le avisamos a la persona 1 del árbol, que coordina en qué posición te sumarías.',
     '<span style="font-size:13px;color:#5C6B63">Si no la enviaste, no hace falta hacer nada: la solicitud no se manda.</span>'],
    'Confirmar la solicitud', u ? u + '?conf=' + r.clave + '&arbol=' + r.arbol : '', 2);
  return { confirmar: true };
}
function confirmarPedido(clave) {
  clave = String(clave || '');
  if (!/^[a-f0-9]{40}$/.test(clave)) fail_('Este enlace no es válido.');
  var q = withLock_(function () {
    var q = readPedidos_().filter(function (x) { return x.clave === clave; })[0];
    if (!q) fail_('Esta solicitud ya estaba confirmada o no existe.');
    if (!pedidoVigente_(q)) fail_('Este enlace venció.');
    setPedido_(q, { estado: 'Pendiente', clave: '' });
    return q;
  });
  try { avisoPedido_(q); } catch (e) {}
  return { arbol: q.arbol, nombre: q.nombre };
}
function pedidoDe_(id) {
  var q = readPedidos_().filter(function (x) { return x.id === String(id || ''); })[0];
  if (!q || !pedidoVigente_(q) || (q.estado !== 'Pendiente' && q.estado !== 'Asignada')) fail_('Esta solicitud ya no está vigente.');
  return q;
}
// Quien coordina elige la posición. Si es suya, convoca en el momento; si no, se la propone a quien tiene esa posición en su tríada.
function asignarPedido(token, id, lugar) {
  lugar = String(lugar || '');
  var d = withLock_(function () {
    var q = pedidoDe_(id), all = readAll_(), tree = treeById_(readTrees_(), q.arbol), people = peopleOf_(all, q.arbol);
    var me = requireMeActive_(people, token);
    if (!coordina_(people, me)) fail_('Las solicitudes las coordina la persona 1 del árbol.');
    var l = libresDe_(people, tree).filter(function (x) { return x.pos === lugar; })[0];
    if (!l) fail_('Esa posición no está por convocar.');
    if (l.dueno !== me.pos) setPedido_(q, { estado: 'Asignada', lugar: lugar, asignado: l.dueno });
    var dueno = people.filter(function (p) { return p.pos === l.dueno; })[0];
    return { q: q, l: l, dueno: dueno, de: me.nombre, mia: me.pos, label: treeLabel_(tree, people) };
  });
  if (d.l.dueno === d.mia) {
    invitar(token, d.q.arbol, lugar, d.q.correo);
    withLock_(function () { setPedido_(pedidoDe_(id), { estado: 'Convocada', lugar: lugar, asignado: d.mia, cierre: new Date() }); });
    return { invitada: true };
  }
  try {
    sendMail_(d.dueno.correo, d.q.nombre + ' quiere sumarse a tu tríada en WhatMatters',
      [escHtml_(d.de) + ', que coordina las solicitudes del árbol «' + escHtml_(d.label) + '», propone que ' + escHtml_(d.q.nombre) + ' se sume en la posición ' + lugar + ' de tu tríada.',
       'Lo que importa: <b>' + escHtml_(d.q.loQueImporta) + '</b>' + (d.q.mensaje ? '<br>Su mensaje: «' + escHtml_(d.q.mensaje) + '»' : ''),
       'En la app, junto a la solicitud, están las opciones para convocarla o para avisar que no podés.'],
      'Ver la solicitud', accessLink_(d.dueno.correo, 0, d.q.arbol));
  } catch (e) {}
  return { invitada: false, dueno: d.dueno ? d.dueno.nombre : '' };
}
// Quien tiene el lugar propuesto invita a la persona (o avisa que no puede y el pedido vuelve a la persona 1).
function invitarPedido(token, id) {
  var q = withLock_(function () {
    var q = pedidoDe_(id), people = peopleOf_(readAll_(), q.arbol), me = requireMeActive_(people, token);
    if (q.estado !== 'Asignada' || me.pos !== q.asignado) fail_('Esta solicitud no está asignada a tu tríada.');
    return q;
  });
  invitar(token, q.arbol, q.lugar, q.correo);
  withLock_(function () { setPedido_(pedidoDe_(id), { estado: 'Convocada', cierre: new Date() }); });
  return true;
}
function devolverPedido(token, id) {
  return withLock_(function () {
    var q = pedidoDe_(id), people = peopleOf_(readAll_(), q.arbol), me = requireMeActive_(people, token);
    if (q.estado !== 'Asignada' || me.pos !== q.asignado) fail_('Esta solicitud no está asignada a tu tríada.');
    setPedido_(q, { estado: 'Pendiente', lugar: '', asignado: '' });
    return true;
  });
}
function cerrarPedido(token, id) {
  return withLock_(function () {
    var q = pedidoDe_(id), people = peopleOf_(readAll_(), q.arbol), me = requireMeActive_(people, token);
    if (!coordina_(people, me)) fail_('Las solicitudes las coordina la persona 1 del árbol.');
    setPedido_(q, { estado: 'Cerrada', cierre: new Date() });
    return true;
  });
}

// ---------- correcciones ----------
// La administradora es la dueña de la app (la cuenta que la publicó). No hace falta escribir su correo en ningún lado.
function adminMail_() { try { return normMail_(Session.getEffectiveUser().getEmail()); } catch (e) { return ''; } }
function isAdminMail_(correo) { var a = adminMail_(); return !!a && normMail_(correo) === a; }
// Perfil: cada persona cambia su nombre, lo que le importa, su ciudad y su lugar, en todos sus árboles.
function cambiarPerfil(token, nombre, loQueImporta, ubic) {
  nombre = clean_(nombre, 60); loQueImporta = cleanLoQueImporta_(loQueImporta);
  needNombreLoQueImporta_(nombre, loQueImporta);
  var ub = ubicDeFila_(cleanUbic_(ubic, true));
  return withLock_(function () {
    var yo = requireYo_(readAll_(), token);
    yo.rows.forEach(function (r) { if (r.estado !== 'Aceptada') return; sheet_().getRange(r.row, 3).setValue(nombre); sheet_().getRange(r.row, 9).setValue(loQueImporta); escribirUbic_(r.row, ub); });
    return true;
  });
}
// Para quienes ya estaban en la red y todavía no tienen ciudad: se pide una sola vez.
function guardarUbicacion(token, ubic) {
  var ub = ubicDeFila_(cleanUbic_(ubic, true));
  return withLock_(function () {
    var yo = requireYo_(readAll_(), token);
    yo.rows.forEach(function (r) { if (r.estado === 'Aceptada') escribirUbic_(r.row, ub); });
    return true;
  });
}

// ---------- ciudad y lugar de cada persona ----------
// La ciudad es obligatoria; "un lugar que te guste" es opcional y solo sirve para dibujar el mapa del juego.
// ubic: { ciudad, ciudadLat, ciudadLng, lugar, lugarLat, lugarLng } (lo que devuelve el buscador).
function numeroGeo_(v, max) { var n = Number(v); return v !== '' && v != null && isFinite(n) && Math.abs(n) <= max ? n : ''; }
function cleanUbic_(u, obligatoria) {
  u = u || {};
  var ciudad = clean_(u.ciudad, 80);
  if (!ciudad && obligatoria) fail_('Falta la ciudad.');
  var lugar = clean_(u.lugar, 120);
  return { ciudad: ciudad, ciudadLat: numeroGeo_(u.ciudadLat, 90), ciudadLng: numeroGeo_(u.ciudadLng, 180),
    lugar: lugar, lugarLat: lugar ? numeroGeo_(u.lugarLat, 90) : '', lugarLng: lugar ? numeroGeo_(u.lugarLng, 180) : '' };
}
function normClave_(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }
// El punto del mapa de una ciudad cuando la persona no eligió un lugar: la plaza de la pestaña Ciudades o, para una ciudad nueva, el punto que da Google.
function puntoCiudad_(ciudad, lat, lng) {
  if (!ciudad) return '';
  var sh = ciudadesSheet_(), n = sh.getLastRow() - 1, clave = normClave_(ciudad);
  var rows = n > 0 ? sh.getRange(2, 1, n, CHEAD.length).getValues() : [];
  for (var i = 0; i < rows.length; i++) {
    if (normClave_(rows[i][0]) !== clave) continue;
    if ((rows[i][2] === '' || rows[i][3] === '') && rows[i][1]) {
      // Plaza anotada a mano o de la lista inicial, todavía sin coordenadas: se busca una vez.
      var res = geocodificar_(rows[i][1] + ', ' + rows[i][0]);
      if (res[0] && res[0].geometry) { rows[i][2] = res[0].geometry.location.lat; rows[i][3] = res[0].geometry.location.lng; sh.getRange(i + 2, 3, 1, 2).setValues([[rows[i][2], rows[i][3]]]); }
    }
    if ((rows[i][2] === '' || rows[i][3] === '') && lat !== '' && lng !== '') { rows[i][2] = lat; rows[i][3] = lng; sh.getRange(i + 2, 3, 1, 2).setValues([[lat, lng]]); }
    return rows[i][2] !== '' && rows[i][3] !== '' ? rows[i][2] + ',' + rows[i][3] : '';
  }
  if (lat === '' || lng === '') return '';
  sh.getRange(n + 2, 1, 1, CHEAD.length).setValues([[ciudad, '', lat, lng, 'Google']]);
  return lat + ',' + lng;
}
// Lo que se escribe en la fila de la persona: ciudad, lugar y punto del mapa (el del lugar o, si no hay, el de la ciudad).
function ubicDeFila_(u) {
  if (!u) return { ciudad: '', lugar: '', punto: '' };
  if (u.punto != null && u.ciudadLat === undefined) return { ciudad: u.ciudad || '', lugar: u.lugar || '', punto: u.punto || '' };
  var punto = u.lugar && u.lugarLat !== '' && u.lugarLng !== '' ? u.lugarLat + ',' + u.lugarLng : puntoCiudad_(u.ciudad, u.ciudadLat, u.ciudadLng);
  return { ciudad: u.ciudad, lugar: u.lugar, punto: punto };
}
function escribirUbic_(row, ub) {
  if (!ub) return;
  sheet_().getRange(row, 11, 1, 3).setValues([[ub.ciudad || '', ub.lugar || '', ub.punto || '']]);
}
function quitarVacante_(arbol, pos) {
  var t = treeById_(readTrees_(), arbol);
  if (!t || (t.vacantes || []).indexOf(pos) < 0) return;
  sheetArb_().getRange(t.row, 12).setValue(t.vacantes.filter(function (x) { return x !== pos; }).join(','));
}
function agregarVacante_(tree, pos) {
  var v = (tree.vacantes || []).slice(); if (v.indexOf(pos) < 0) v.push(pos);
  sheetArb_().getRange(tree.row, 12).setValue(v.join(','));
  tree.vacantes = v;
}

// ---------- buscador de lugares ----------
// Usa el buscador de lugares incorporado de Apps Script (Maps.newGeocoder), sin pegar enlaces de Google Maps.
function geocodificar_(q) {
  try {
    var r = Maps.newGeocoder().setLanguage('es').geocode(q);
    return r && r.status === 'OK' ? (r.results || []) : [];
  } catch (e) { return []; }
}
function parteGeo_(res, tipos) {
  var c = (res.address_components || []).filter(function (x) { return (x.types || []).some(function (t) { return tipos.indexOf(t) >= 0; }); })[0];
  return c ? c.long_name : '';
}
function nombreCiudadGeo_(res) {
  var loc = parteGeo_(res, ['locality', 'postal_town', 'administrative_area_level_2', 'administrative_area_level_1']);
  var pais = parteGeo_(res, ['country']);
  return [loc, pais].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(', ');
}
function esZonaGeo_(res) {
  return (res.types || []).some(function (t) { return ['locality', 'political', 'country', 'administrative_area_level_1', 'administrative_area_level_2', 'postal_town', 'sublocality', 'neighborhood'].indexOf(t) >= 0; });
}
// modo: 'ciudad' (para la ciudad de una persona), 'lugar' (un lugar dentro de la ciudad) o 'zona' (el lugar de un árbol: barrio, ciudad, región o país).
function buscarLugar(texto, modo, ciudad) {
  texto = clean_(texto, 80); ciudad = clean_(ciudad, 80);
  if (texto.length < 3) return [];
  var cache = CacheService.getScriptCache(), clave = 'busq_' + Math.floor(Date.now() / 6e4), n = Number(cache.get(clave) || 0);
  if (n >= 60) fail_('Hubo muchas búsquedas en este momento. Se puede volver a intentar en un minuto.');
  cache.put(clave, String(n + 1), 120);
  var out = [], vistos = {};
  function sumar(nombre, dir, res) {
    var k = normClave_(nombre + '|' + dir); if (!nombre || vistos[k] || out.length >= 5 || !res.geometry) return;
    vistos[k] = 1; out.push({ nombre: nombre, dir: dir, lat: res.geometry.location.lat, lng: res.geometry.location.lng });
  }
  if (modo === 'lugar') {
    (ciudad ? geocodificar_(texto + ', ' + ciudad) : []).concat(geocodificar_(texto)).forEach(function (r) {
      var dir = clean_(r.formatted_address, 160); sumar(clean_(dir.split(',')[0], 120), dir, r);
    });
  } else {
    geocodificar_(texto).filter(esZonaGeo_).forEach(function (r) {
      var nom = modo === 'ciudad' ? nombreCiudadGeo_(r) : clean_(r.formatted_address, 160);
      sumar(nom, '', r);
    });
  }
  return out;
}

// ---------- solicitar una convocatoria nueva (desde una convocatoria vencida) ----------
// El enlace de la convocatoria prueba que la persona recibió el correo, así que no hace falta confirmar de nuevo.
// La solicitud llega a quien convocó, ya asignada a la misma posición; si esa persona ya no está o la posición ya no está por convocar, llega a quien coordina, como cualquier otra.
function solicitarDesdeVencida(inv, nombre, loQueImporta, mensaje) {
  var info = inviteFrom_(inv);
  if (!info) fail_('Este enlace no es válido.');
  mensaje = clean_(mensaje, 400);
  var r = withLock_(function () {
    var raw = readAll_(true), all = readAll_(), tree = treeById_(readTrees_(), info.arbol);
    if (!tree) fail_('No encontramos ese árbol.');
    var people = peopleOf_(all, info.arbol), map = index_(people);
    var fila = peopleOf_(raw, info.arbol).filter(function (p) { return p.correo === info.correo; })[0];
    if (!info.vencida && !(fila && fila.vencida)) fail_('Esta convocatoria sigue vigente: se puede aceptar desde el correo.');
    var d = vencidaDe_(info, fila, peopleOf_(raw, info.arbol));
    var correo = info.correo;
    var act = rowsOf_(all, correo).filter(function (p) { return p.estado === 'Aceptada'; })[0];
    if (act) { nombre = act.nombre; loQueImporta = act.loQueImporta; } else { nombre = clean_(nombre, 60); loQueImporta = cleanLoQueImporta_(loQueImporta); needNombreLoQueImporta_(nombre, loQueImporta); }
    if (people.some(function (p) { return p.correo === correo; })) fail_('Ya estás en este árbol o tenés una convocatoria pendiente en él.');
    if (rowsOf_(all, correo).length >= MAX_ARBOLES) fail_('Ya estás en tres árboles, que es el máximo. Podés sumarte a este cuando liberes uno.');
    if (readPedidos_().some(function (q) { return q.arbol === info.arbol && q.correo === correo && pedidoVigente_(q); })) fail_('Ya hay una solicitud tuya para sumarte a este árbol.');
    var convoco = d.invito ? map[d.invito] : null;
    var directa = !!(convoco && convoco.estado === 'Aceptada' && d.pos && !occupant_(map, d.pos));
    var q = { id: newToken_().slice(0, 12), arbol: info.arbol, nombre: nombre, correo: correo, loQueImporta: loQueImporta, mensaje: mensaje };
    var sh = sheetSum_(), row = Math.max(sh.getLastRow(), 1) + 1;
    sh.getRange(row, 1, 1, QCOLS).setValues([[q.id, new Date(), info.arbol, nombre, correo, loQueImporta, mensaje, directa ? 'Asignada' : 'Pendiente', directa ? d.pos : '', directa ? d.invito : '', '', '']]);
    return { q: q, directa: directa, convoco: convoco, pos: d.pos, de: d.de, tree: tree, people: people };
  });
  try {
    if (r.directa) {
      sendMail_(r.convoco.correo, r.q.nombre + ' quiere sumarse a tu tríada en WhatMatters',
        [escHtml_(r.q.nombre) + ' tenía una convocatoria tuya a la posición ' + r.pos + ' del árbol «' + escHtml_(treeLabel_(r.tree, r.people)) + '», que venció, y solicita sumarse de nuevo.',
         'Lo que importa: <b>' + escHtml_(r.q.loQueImporta) + '</b>' + (r.q.mensaje ? '<br>Su mensaje: «' + escHtml_(r.q.mensaje) + '»' : ''),
         'En la app, junto a la solicitud, están las opciones para convocarla de nuevo o para avisar que no podés.'],
        'Ver la solicitud', accessLink_(r.convoco.correo, 0, info.arbol));
    } else { r.q.vencida = { de: r.de, pos: r.pos }; avisoPedido_(r.q); }
  } catch (e) {}
  return { directa: r.directa };
}
// La administradora puede corregir el nombre de cualquiera (en todos sus árboles).
function cambiarNombre(token, arbol, pos, nombre) {
  nombre = clean_(nombre, 60);
  if (!nombre) fail_('Falta el nombre.');
  return withLock_(function () {
    var all = readAll_();
    var yo = requireYo_(all, token);
    var target = peopleOf_(all, String(arbol || '')).filter(function (p) { return p.pos === String(pos) && p.estado === 'Aceptada'; })[0];
    if (!target) fail_('No encontramos a esa persona.');
    if (target.correo !== yo.correo && !yo.admin) fail_('Solo podés cambiar tu propio nombre.');
    rowsOf_(all, target.correo).forEach(function (r) { if (r.estado === 'Aceptada') sheet_().getRange(r.row, 3).setValue(nombre); });
    return true;
  });
}
// ---------- irse de un árbol ----------
// Quien se va deja su posición por convocar (con toda su cadena: 2.1, 2.1.1…, porque es la misma persona en cada alcance). La convocan las otras dos
// personas de su tríada y quien la acepte hereda la cadena. Las convocatorias que había hecho siguen valiendo, como convocatorias al árbol.
// Corre dentro del candado; devuelve lo que hace falta para mandar los avisos después.
function sacarDelArbol_(all, trees, arbol, target) {
  var tree = treeById_(trees, arbol), people = peopleOf_(all, arbol), map = index_(people), pos = target.pos;
  var companieras = companierasDe_(map, pos);
  var convocadas = people.filter(function (p) { return p.invito === pos && p.estado === 'Aceptada' && p.pos !== pos; });
  var destinatarias = [], vistas = {};
  companieras.concat(convocadas).forEach(function (p) { if (p.correo && p.correo !== target.correo && !vistas[p.correo]) { vistas[p.correo] = 1; destinatarias.push(p); } });
  var aviso = { tema: treeLabel_(tree, people), pos: pos, nombre: target.nombre, destinatarias: destinatarias, companieras: companieras.map(function (p) { return p.nombre; }) };
  sheet_().deleteRow(target.row);
  var restantes = people.filter(function (p) { return p.row !== target.row; });
  if (!restantes.some(function (p) { return p.estado === 'Aceptada'; })) {
    // No queda nadie aceptado: el árbol desaparece, con sus convocatorias pendientes.
    restantes.map(function (p) { return p.row; }).sort(function (a, b) { return b - a; }).forEach(function (r) { sheet_().deleteRow(r > target.row ? r - 1 : r); });
    restantes.forEach(function (p) { dropInvites_(p.correo, arbol); });
    if (tree) sheetArb_().deleteRow(tree.row);
  } else if (tree) {
    agregarVacante_(tree, pos);
    // Antes de acordar el tema: el acuerdo de quien se va se borra; su propuesta, si la hizo ella, también.
    if (!tree.acordado && SEMILLA.indexOf(pos) >= 0) {
      var a = sheetArb_();
      if (tree.prop && tree.prop.de === pos) { a.getRange(tree.row, 7, 1, 3).setValues([['', '', '']]); a.getRange(tree.row, 10).setValue(''); }
      else a.getRange(tree.row, 10).setValue(tree.acuerdos.filter(function (x) { return x !== pos; }).join(','));
    }
  }
  // Las solicitudes que le habían asignado vuelven a quien coordina.
  readPedidos_().forEach(function (q) { if (q.arbol === arbol && q.estado === 'Asignada' && q.asignado === pos) setPedido_(q, { estado: 'Pendiente', lugar: '', asignado: '' }); });
  // Si no le queda ningún árbol, se cierran sus sesiones.
  aviso.quedan = rowsOf_(all, target.correo).length - 1;
  if (aviso.quedan === 0) {
    var props = PropertiesService.getScriptProperties(), allp = props.getProperties();
    Object.keys(allp).forEach(function (k) {
      if (k.indexOf('tok_') === 0 && allp[k] === target.correo) props.deleteProperty(k);
      if (k.indexOf('acc_') === 0) { try { if (JSON.parse(allp[k]).correo === target.correo) props.deleteProperty(k); } catch (e) {} }
    });
  }
  return aviso;
}
// Avisa a las otras dos personas de su tríada y a las tríadas que había convocado.
function avisarSalida_(aviso) {
  var c = aviso.companieras;
  var quienes = c.length ? (c.length === 1 ? 'La puede convocar ' + escHtml_(c[0]) + '.' : 'La pueden convocar ' + c.map(escHtml_).join(' y ') + '.') : '';
  aviso.destinatarias.forEach(function (d) {
    try {
      sendMail_(d.correo, escHtml_(aviso.nombre || 'Una persona') + ' se fue del árbol «' + aviso.tema + '» de WhatMatters',
        [escHtml_(aviso.nombre || 'Una persona') + ' se fue del árbol «' + escHtml_(aviso.tema) + '» y la posición ' + aviso.pos + ' vuelve a Por convocar.' + (quienes ? ' ' + quienes : ''),
         'Las convocatorias que había hecho siguen valiendo.'], 'Ver el árbol', accessLink_(d.correo, 0, d.arbol));
    } catch (e) {}
  });
}
// Cada persona puede irse de un árbol. Irse no tiene vuelta atrás: para volver hace falta una convocatoria nueva.
function irseDelArbol(token, arbol) {
  arbol = String(arbol || '');
  var aviso = withLock_(function () {
    var all = readAll_(), trees = readTrees_();
    var yo = requireYo_(all, token);
    var target = peopleOf_(all, arbol).filter(function (p) { return p.correo === yo.correo && p.estado === 'Aceptada'; })[0];
    if (!target) fail_('No estás en este árbol.');
    var av = sacarDelArbol_(all, trees, arbol, target);
    av.destinatarias.forEach(function (d) { d.arbol = arbol; });
    return av;
  });
  avisarSalida_(aviso);
  return { quedan: aviso.quedan };
}
// La administradora puede quitar a alguien de un árbol: salen los mismos avisos que cuando alguien se va y la persona quitada recibe un correo.
function quitarPersona(token, arbol, pos) {
  pos = String(pos || ''); arbol = String(arbol || '');
  var aviso = withLock_(function () {
    var all = readAll_(), trees = readTrees_();
    var yo = requireYo_(all, token);
    if (!yo.admin) fail_('Solo la administradora puede hacer esto.');
    var target = peopleOf_(all, arbol).filter(function (p) { return p.pos === pos && p.estado === 'Aceptada'; })[0];
    if (!target) fail_('No encontramos a esa persona.');
    var av = sacarDelArbol_(all, trees, arbol, target);
    av.destinatarias.forEach(function (d) { d.arbol = arbol; });
    av.correo = target.correo;
    return av;
  });
  avisarSalida_(aviso);
  try {
    sendMail_(aviso.correo, 'Ya no estás en el árbol «' + aviso.tema + '» de WhatMatters',
      ['Tu posición en el árbol «' + escHtml_(aviso.tema) + '» volvió a Por convocar. Si querés saber más, se puede escribir a whatmatters.pro@gmail.com.',
       aviso.quedan > 0 ? 'Seguís participando en tus otros árboles.' : 'Para volver hace falta una convocatoria nueva.'], '', '');
  } catch (e) {}
  return true;
}

// ---------- vencimiento de convocatorias ----------
// Una convocatoria vence a los 7 días; al 5.º día sale un recordatorio (a quien fue convocada y a quien convocó) y ninguna vence sin aviso.
// Al vencer se borra la fila: la posición vuelve a Por convocar y quien convocó puede volver a convocar, incluso a la misma persona.
// La tarea diaria se instala ejecutando instalarTareaDiaria una vez desde el editor.
function revisarConvocatorias() { procesarVencimientos_(); }
function instalarTareaDiaria() {
  soloAdministradora_();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'revisarConvocatorias') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('revisarConvocatorias').timeBased().everyDays(1).atHour(9).inTimezone('America/Montevideo').create();
  Logger.log('Tarea diaria instalada: revisa las convocatorias todos los días a las 9 (hora de Montevideo).');
}
function procesarVencimientos_() {
  var trabajo = withLock_(function () {
    var raw = readAll_(true), ahora = Date.now(), recordar = [], vencer = [];
    raw.forEach(function (p) {
      if (p.estado !== 'Convocada' || !p.fInvMs) return;
      if (p.vencida) vencer.push(p);
      else if (!p.rec && ahora - p.fInvMs >= DIAS_RECORDATORIO * 864e5) recordar.push(p);
    });
    if (!recordar.length && !vencer.length) return null;
    var trees = readTrees_();
    recordar.forEach(function (p) { sheet_().getRange(p.row, 14).setValue(new Date(ahora)); p.rec = ahora; });
    // Se arman los avisos antes de borrar, con los datos de la fila y del árbol.
    function datos(p) {
      var gente = peopleOf_(raw.filter(function (x) { return !x.vencida || x.row === p.row; }), p.arbol), tree = treeById_(trees, p.arbol);
      var conv = quienesConvocaron_(gente.filter(function (x) { return !x.vencida; }), p.invito);
      var primero = conv[0];
      return { p: p, tree: tree, label: treeLabel_(tree, gente.filter(function (x) { return !x.vencida; })), conv: conv, de: primero && primero.pos === p.invito ? primero.nombre : '', hasta: fmtDate_(new Date(vencimientoMs_(p))) };
    }
    var r = recordar.map(datos), v = vencer.map(datos);
    v.forEach(function (d) { marcarVencida_(d.p, d.de); });
    vencer.map(function (p) { return p.row; }).sort(function (a, b) { return b - a; }).forEach(function (row) { sheet_().deleteRow(row); });
    return { recordar: r, vencer: v };
  });
  if (!trabajo) return 0;
  trabajo.recordar.forEach(function (d) {
    var p = d.p, enlace = inviteLinkVigente_(p.correo, p.arbol);
    try {
      var lineas = inviteLines_(d.de || 'Alguien', p.pos, d.tree); lineas.splice(lineas.length - 1, 0, 'Esta convocatoria vence el ' + d.hasta + '.');
      sendMail_(p.correo, 'Recordatorio: ' + (d.de || 'una persona') + ' te convocó a su tríada en WhatMatters', lineas, 'Ver la convocatoria', enlace);
    } catch (e) {}
    d.conv.forEach(function (c) {
      try {
        sendMail_(c.correo, 'Tu convocatoria a ' + p.correo + ' vence el ' + d.hasta,
          ['Tu convocatoria a ' + escHtml_(p.correo) + ' para la posición ' + p.pos + ' vence el ' + d.hasta + '. Se puede reenviar desde la app.'], 'Ver el árbol', accessLink_(c.correo, 0, p.arbol));
      } catch (e) {}
    });
  });
  trabajo.vencer.forEach(function (d) {
    var p = d.p, u = appUrl_(), enlace = '';
    var props = PropertiesService.getScriptProperties(), todas = props.getProperties();
    Object.keys(todas).forEach(function (k) { if (!enlace && k.indexOf('inv_') === 0) { var x = inviteFrom_(k.slice(4)); if (x && x.vencida && x.correo === p.correo && x.arbol === p.arbol) enlace = u ? u + '?inv=' + k.slice(4) : ''; } });
    if (!enlace) enlace = u ? u + '?inv=' + (function () { var k = newToken_(); props.setProperty('inv_' + k, JSON.stringify({ correo: p.correo, arbol: p.arbol, vencida: true, pos: p.pos, invito: p.invito, de: d.de })); return k; })() : '';
    d.conv.forEach(function (c) {
      try {
        sendMail_(c.correo, 'Venció la convocatoria a ' + p.correo,
          ['La convocatoria a ' + escHtml_(p.correo) + ' para la posición ' + p.pos + ' venció. La posición vuelve a Por convocar y se puede convocar de nuevo, también a la misma persona.'], 'Ver el árbol', accessLink_(c.correo, 0, p.arbol));
      } catch (e) {}
    });
    try {
      var donde = d.tree && d.tree.acordado && d.tree.tema ? 'del árbol «' + escHtml_(d.tree.tema) + '» de WhatMatters' : 'semilla de un árbol nuevo de WhatMatters';
      sendMail_(p.correo, 'Venció la convocatoria a WhatMatters',
        ['Hola:', 'La convocatoria de ' + escHtml_(d.de || 'una persona') + ' a su tríada ' + donde + ' venció.', 'Para sumarse hace falta una convocatoria nueva. Podés solicitarla acá:'], 'Solicitar sumarme', enlace);
    } catch (e) {}
  });
  return trabajo.vencer.length;
}
// El enlace de una convocatoria que sigue vigente (el mismo del correo original, si existe).
function inviteLinkVigente_(correo, arbol) {
  var u = appUrl_(); if (!u) return '';
  var props = PropertiesService.getScriptProperties(), todas = props.getProperties(), k = '';
  Object.keys(todas).forEach(function (x) { if (!k && x.indexOf('inv_') === 0) { var d = inviteFrom_(x.slice(4)); if (d && !d.vencida && d.correo === correo && d.arbol === arbol) k = x.slice(4); } });
  return u + '?inv=' + (k || newInvite_(correo, arbol));
}

// Las funciones de mantenimiento solo corren desde el editor (o la administradora), nunca desde la app de otra persona.
function soloAdministradora_() {
  var u = ''; try { u = normMail_(Session.getActiveUser().getEmail()); } catch (e) {}
  if (!u || u !== adminMail_()) fail_('Esto solo se puede ejecutar desde el editor de Apps Script.');
}
// Para Virginia: borra a todas las personas, árboles y sesiones. Ejecutar desde el editor.
function reiniciarRed() {
  soloAdministradora_();
  withLock_(function () {
    var s = sheet_(), last = s.getLastRow();
    if (last > 1) s.deleteRows(2, last - 1);
    var a = sheetArb_();
    if (a && a.getLastRow() > 1) a.deleteRows(2, a.getLastRow() - 1);
    var q = SpreadsheetApp.getActive().getSheetByName(SHEET_SUM);
    if (q && q.getLastRow() > 1) q.deleteRows(2, q.getLastRow() - 1);
  });
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  Object.keys(all).forEach(function (k) { if (k.indexOf('tok_') === 0 || k.indexOf('inv_') === 0 || k.indexOf('acc_') === 0) props.deleteProperty(k); });
  Logger.log('Red reiniciada.');
}

// Migración de vocabulario: 'Invitada' pasa a 'Convocada' y 'Activa' a 'Aceptada' (Personas y Quieren sumarse); en Personas las cabeceras dicen Convocó y Fecha de convocatoria;
// en Árboles, Tema y Propuesta: tema (antes Nombre y Propuesta: nombre).
// El código ya lee los dos valores, así que se puede ejecutar en cualquier momento. Es seguro repetirla.
function migrarConvocadas_() {
  withLock_(function () {
    var s = sheet_();
    if (s) {
      var n = s.getLastRow() - 1;
      if (n > 0) {
        var col = s.getRange(2, 6, n, 1), vals = col.getValues();
        if (vals.some(function (r) { return r[0] !== legado_(r[0]); })) col.setValues(vals.map(function (r) { return [legado_(r[0])]; }));
      }
      s.getRange(1, 5).setValue(HEAD[4]);
      s.getRange(1, 7).setValue(HEAD[6]);
    }
    var a = sheetArb_();
    if (a) { a.getRange(1, 2).setValue(AHEAD[1]); a.getRange(1, 7).setValue(AHEAD[6]); }
    var q = SpreadsheetApp.getActive().getSheetByName(SHEET_SUM);
    if (q) {
      var m = q.getLastRow() - 1;
      if (m > 0) {
        var cq = q.getRange(2, 8, m, 1), vq = cq.getValues();
        if (vq.some(function (r) { return r[0] !== legado_(r[0]); })) cq.setValues(vq.map(function (r) { return [legado_(r[0])]; }));
      }
    }
  });
}
function migrarConvocadas() { soloAdministradora_(); ensureSetup_(); migrarConvocadas_(); Logger.log('Migración hecha.'); }
function migrarVocabulario() { migrarConvocadas(); }

// Deja la planilla con lo que usa la app y reescribe "Cómo se juega". Se puede ejecutar de nuevo desde el editor cuando cambian las reglas.
function ordenarPlanilla() {
  soloAdministradora_();
  ensureSetup_();
  migrarConvocadas_();
  var ss = SpreadsheetApp.getActive();
  ['Propuesta', 'Árbol', 'Decisiones', 'Apoyos', 'RCE'].forEach(function (n) { var sh = ss.getSheetByName(n); if (sh) ss.deleteSheet(sh); });
  headerStyle_(sheetArb_().getRange(1, 1, 1, ACOLS).setValues([AHEAD]));
  sheetSum_();
  var g = ss.getSheetByName('Cómo se juega') || ss.insertSheet('Cómo se juega');
  g.clear(); g.getRange('A:B').breakApart();
  var rows = [
    ['WhatMatters: cómo se juega', ''],
    ['Un juego serio y emocionante que recompensa nuestra habilidad para ponernos de acuerdo en lo importante.', ''],
    ['', ''],
    ['Reglas', ''],
    ['1', 'Se requiere una invitación para empezar y que te importe algún tema.'],
    ['2', 'Se juega formando "árboles" y "bosques" que crecen multiplicando por tres.'],
    ['3', 'Se recompensa a quienes logran los mayores y mejores acuerdos.'],
    ['', ''],
    ['Cómo funciona hoy', ''],
    ['Tríada', 'Grupo de tres posiciones. La primera de cada árbol es la semilla: posiciones 1, 2 y 3.'],
    ['Entrar', 'Solo con convocatoria por correo. La primera vez, cada persona escribe su nombre y Lo que importa (al menos una palabra; se puede cambiar o ampliar después desde Mi perfil).'],
    ['Varios árboles', 'Cada persona puede estar en hasta tres árboles, con el mismo perfil. Cualquiera que ya esté en un árbol puede plantar uno nuevo: ocupa la posición 1 y convoca a las posiciones 2 y 3.'],
    ['Tema del árbol', 'Lo acuerdan las tres personas de la semilla. Una propone el tema y el tipo (temático o geográfico, y en ese caso de qué lugar), y queda fijo cuando las tres están de acuerdo. Hasta entonces la semilla puede completarse, pero no se abren las tríadas siguientes.'],
    ['Quieren sumarse', 'Quien quiere sumarse a un árbol deja un pedido desde la app. La persona 1 del árbol recibe el aviso por correo y decide en qué posición se sumaría: si la posición es suya, convoca en el momento; si es de otra persona, esa persona recibe el aviso para convocar. Los pedidos vencen a los 30 días.'],
    ['Tu tríada', 'Cada persona tiene su propia tríada en el alcance siguiente: sigue ocupando la primera posición (quien está en 1 también está en 1.1) y convoca a las otras dos (1.2 y 1.3).'],
    ['Tríadas siguientes', 'Las tríadas que siguen en la cadena de cada persona (1.1.1, 1.1.2, 1.1.3…) se abren cuando se completa la anterior.'],
    ['Alcance', 'Cada nivel multiplica por tres las posiciones: alcance 1 = 3, alcance 2 = 9, alcance 3 = 27, y así.'],
    ['Árbol', 'Cuando se completa el alcance 2 (9 personas) ya es un árbol. Desde ahí la semilla pasa a llamarse tríada base del tronco.'],
    ['Volver a entrar', 'Desde la app se pide un correo con un botón para entrar y un código (sirven una vez y vencen en 15 minutos).'],
    ['Transparencia', 'Todas las personas de la red pueden ver todos los árboles: nombres, Lo que importa a cada quien y sus posiciones. Los correos son privados: solo los ve la administradora en esta planilla (y quien convocó, mientras la convocatoria está pendiente).'],
    ['Administradora', 'Quien creó la red. Puede corregir nombres, cancelar convocatorias y quitar a personas que no tengan a nadie en sus tríadas, en cualquier árbol.'],
    ['', ''],
    ['La pestaña Personas', ''],
    ['', 'Una fila por persona y por árbol: quien está en dos árboles tiene dos filas.'],
    ['Posición', 'Posición en su árbol: 1, 2, 1.2, 2.1.3…'],
    ['Alcance de entrada', 'En qué alcance entró la persona (cuántos números tiene su posición).'],
    ['Nombre', 'Cómo la ve el resto.'],
    ['Correo', 'Con el que entra. No se muestra en la app.'],
    ['Convocó (posición)', 'Posición de quien la convocó, en el mismo árbol.'],
    ['Estado', 'Convocada (todavía no aceptó) o Aceptada.'],
    ['Fecha de convocatoria / de entrada', 'Cuándo la convocaron y cuándo entró.'],
    ['Lo que importa', 'Lo que la persona escribió al entrar o en Mi perfil.'],
    ['Árbol', 'El código del árbol (t1, t2…), el mismo de la pestaña Árboles.'],
    ['', ''],
    ['La pestaña Árboles', ''],
    ['Árbol', 'Código del árbol.'],
    ['Tema, Lugar', 'Lo acordado por la semilla. Vacío mientras no hay acuerdo.'],
    ['Estado', 'Sin tema o Tema acordado.'],
    ['Plantó (correo), Fecha', 'Quién plantó la semilla y cuándo.'],
    ['Propuesta', 'La propuesta de tema que se está acordando, quién la hizo y qué posiciones de la semilla ya están de acuerdo.'],
    ['La pestaña Quieren sumarse', 'Los pedidos para sumarse a cada árbol: quién, Lo que importa a esa persona, su mensaje, el estado (Sin confirmar, Pendiente, Asignada, Convocada o Cerrada) y la posición elegida.'],
    ['', 'La app escribe estas pestañas. Conviene no editarlas a mano: para corregir algo, usar las herramientas de administradora de la app.'],
    ['', ''],
    ['Todavía no está en la app', ''],
    ['Bosques', 'Árboles que se unen por abajo; la tríada que los une se llama micorriza.'],
    ['Recompensas', 'Para quienes logran los mayores y mejores acuerdos.']
  ];
  g.getRange(1, 1, rows.length, 2).setValues(rows).setVerticalAlignment('top').setFontFamily('Arial').setFontSize(11);
  g.setColumnWidth(1, 220); g.setColumnWidth(2, 640);
  g.getRange(1, 1, rows.length, 2).setWrap(true);
  g.getRange('A1').setFontSize(16).setFontWeight('bold');
  g.getRange('A1:B1').merge(); g.getRange('A2:B2').merge();
  rows.forEach(function (r, i) {
    if (r[0] && !r[1] && i > 1) g.getRange(i + 1, 1, 1, 2).merge().setFontWeight('bold').setBackground('#1F4E3D').setFontColor('#FFFFFF');
    else if (r[0] && r[1]) g.getRange(i + 1, 1).setFontWeight('bold');
  });
  g.setFrozenRows(0);
  Logger.log('Planilla ordenada.');
}

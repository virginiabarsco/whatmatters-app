var RT = 'a';
function normq(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function verArbol(k) {
  RT = k;
  document.querySelectorAll('.arb').forEach(function (a) { a.hidden = a.dataset.arb !== k; });
  document.querySelectorAll('.tcard').forEach(function (c) { var on = c.dataset.tree === k; c.classList.toggle('cur', on); if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
}
document.querySelectorAll('.tcard').forEach(function (c) { c.addEventListener('click', function () { verArbol(c.dataset.tree); }); });
document.getElementById('tq').addEventListener('input', function (e) {
  var q = normq(e.target.value.trim()), n = 0;
  document.querySelectorAll('.titem').forEach(function (t) { var ok = !q || normq(t.dataset.q).indexOf(q) >= 0; t.hidden = !ok; if (ok) n++; });
  document.getElementById('tqNone').hidden = n > 0;
});
document.querySelectorAll('.arb').forEach(function (arb) {
  var tabs = arb.querySelectorAll('[data-tab]');
  tabs.forEach(function (b) { b.addEventListener('click', function () {
    tabs.forEach(function (o) { o.setAttribute('aria-selected', String(o === b)); });
    arb.querySelector('.vmapa').hidden = b.dataset.tab !== 'mapa';
    arb.querySelector('.vlista').hidden = b.dataset.tab !== 'lista';
  }); });
  var q = arb.querySelector('.pq'), box = arb.querySelector('.sres');
  var gente = [], vistos = {}; arb.querySelectorAll('.pname').forEach(function (p) { if (vistos[p.dataset.pid]) return; vistos[p.dataset.pid] = 1; gente.push({ n: p.textContent, pid: p.dataset.pid, tr: p.closest('tr') }); });
  q.addEventListener('input', function () {
    var t = normq(q.value.trim()); if (!t) { box.hidden = true; box.innerHTML = ''; return; }
    var hits = gente.filter(function (g) { return normq(g.n).indexOf(t) >= 0; }).slice(0, 8);
    box.innerHTML = hits.length ? hits.map(function (g, i) { return '<button type="button" data-i="' + gente.indexOf(g) + '">' + g.n + ' <span class="muted small">P' + g.pid + '</span></button>'; }).join('') : '<p class="small muted" style="margin:6px 10px">No hay nadie con ese nombre.</p>';
    box.hidden = false;
    box.querySelectorAll('[data-i]').forEach(function (b) { b.addEventListener('click', function () {
      var g = gente[+b.dataset.i]; q.value = ''; box.hidden = true;
      var lt = arb.querySelector('[data-tab=lista]'); if (lt.getAttribute('aria-selected') !== 'true') lt.click();
      g.tr.classList.add('flash'); g.tr.scrollIntoView({ block: 'center' }); setTimeout(function () { g.tr.classList.remove('flash'); }, 2500);
    }); });
  });
  var filt = 'todas', plegados = {};
  function aplicar() {
    var seen = {};
    arb.querySelectorAll('tbody tr').forEach(function (tr) {
      var f = filt === 'todas' || (filt === 'llenas' ? tr.dataset.full === '1' : tr.dataset.full === '0');
      var seg = tr.dataset.r.split('.'), hide = false;
      if (f) for (var a = 1; a < seg.length; a++) { var k = seg.slice(0, a).join('.'); if (plegados[k]) { if (seen[k]) hide = true; seen[k] = true; break; } }
      tr.hidden = !f || hide;
    });
    arb.querySelectorAll('.fold').forEach(function (b) { var on = !!plegados[b.dataset.fold]; b.textContent = on ? '+' : '−'; });
  }
  arb.querySelectorAll('[data-lfilt]').forEach(function (b) { b.addEventListener('click', function () { filt = b.dataset.lfilt; arb.querySelectorAll('[data-lfilt]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); aplicar(); }); });
  arb.querySelectorAll('.fold').forEach(function (b) { b.addEventListener('click', function () { plegados[b.dataset.fold] = !plegados[b.dataset.fold]; aplicar(); }); });
});

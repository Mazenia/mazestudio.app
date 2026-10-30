// Récords con iniciales, como en las máquinas recreativas: cada dispositivo es
// «la máquina» y guarda su propia tabla por juego y nivel. Solo cuentan los casos
// del día. La marca es el tiempo más 30 segundos por cada pista o fallo.
(function (root) {
  'use strict';

  const KEEP = 10, SHOW = 5, PENALTY = 30;
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

  const store = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
    },
  };

  const keyOf = (game, level) => `records:${game}:${level}`;
  const list = (game, level) => store.get(keyOf(game, level)) || [];
  const scoreOf = ({ elapsed, hints, errors }) => elapsed + PENALTY * (hints + errors);

  // Puesto que ocuparía una marca (1, 2…) o 0 si no entra en la tabla.
  function rankFor(game, level, score) {
    const rows = list(game, level);
    const pos = rows.filter((r) => r.score <= score).length;
    return pos < KEEP ? pos + 1 : 0;
  }

  function add(game, level, entry) {
    const rows = [...list(game, level), entry].sort((a, b) => a.score - b.score || a.at - b.at).slice(0, KEEP);
    store.set(keyOf(game, level), rows);
  }

  const clean = (s) => s.toUpperCase().normalize('NFD').replace(/(?!̃)[̀-ͯ]/g, '')
    .normalize('NFC').replace(/[^A-ZÑ]/g, '').slice(0, 3);

  function renderBoard(el, game, level, label, highlight) {
    if (!el) return;
    const rows = list(game, level);
    let html = '';
    for (let k = 0; k < SHOW; k++) {
      const r = rows[k];
      const cls = r && r.at === highlight ? ' class="new"' : '';
      html += r
        ? `<li${cls}><span class="hs-pos">${k + 1}</span><span class="hs-ini">${r.ini}</span><span class="hs-time">${fmt(r.score)}</span><span class="hs-day">${r.day}</span></li>`
        : `<li class="empty"><span class="hs-pos">${k + 1}</span><span class="hs-ini">---</span><span class="hs-time">-:--</span><span class="hs-day"></span></li>`;
    }
    el.innerHTML = `<h2>Récords</h2><p class="hs-level">${label}, en esta máquina</p><ol class="hs-list">${html}</ol>` +
      '<p class="card-foot">Solo cuentan los casos del día. Cada pista o fallo suma 30 segundos.</p>';
  }

  // Si la partida entra en la tabla, pide las iniciales dentro del diálogo de victoria.
  // `result`: { game, level, elapsed, hints, errors }. `done(at)` se llama al guardar o al descartar.
  function offer(dialog, result, done) {
    dialog.querySelector('.hs-entry')?.remove();
    const score = scoreOf(result);
    const rank = rankFor(result.game, result.level, score);
    if (!rank) return done(null);

    const box = document.createElement('form');
    box.className = 'hs-entry';
    const penalty = score - result.elapsed;
    box.innerHTML = `<p class="hs-title">¡Nuevo récord! Puesto ${rank}</p>` +
      `<p class="hs-score">${fmt(score)}${penalty ? ` <small>(${fmt(result.elapsed)} + ${fmt(penalty)})</small>` : ''}</p>` +
      '<label for="hs-ini">Escribe tus iniciales</label>' +
      `<div class="hs-row"><input id="hs-ini" maxlength="3" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${store.get('records:last') || ''}">` +
      '<button type="submit">Guardar</button></div>';
    dialog.querySelector('.modal-actions').before(box);

    const input = box.querySelector('input');
    input.addEventListener('input', () => { input.value = clean(input.value); });
    let finished = false;
    const finish = (at) => {
      if (finished) return;
      finished = true;
      dialog.removeEventListener('close', onClose);
      done(at);
    };
    const onClose = () => finish(null);
    dialog.addEventListener('close', onClose);
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const ini = clean(input.value);
      if (!ini) return input.focus();
      const now = new Date();
      const at = now.getTime();
      add(result.game, result.level, { ini, score, at, day: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}` });
      store.set('records:last', ini);
      box.innerHTML = `<p class="hs-title">Guardado: ${ini}, puesto ${rank}</p>`;
      finish(at);
    });
    setTimeout(() => input.focus(), 50);
  }

  root.Records = { offer, renderBoard };
})(window);

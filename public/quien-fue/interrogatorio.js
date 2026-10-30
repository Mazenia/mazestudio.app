(function () {
  'use strict';

  const { generate, LEVELS, NAMES, EMOJI } = window.Interro;
  const { LOOKS, VICTIM_LOOK, blob } = window.Art;
  const LAUNCH = '2026-10-24';
  const $ = (id) => document.getElementById(id);

  const store = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
    },
  };

  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const caseNumber = Math.round((Date.parse(dateKey) - Date.parse(LAUNCH)) / 86400000) + 1;

  // Marcas: 0 sin marcar, 1 dice la verdad, 2 miente.
  const TRUE = 1, LIE = 2;

  let level = LEVELS[store.get('interro-level')] ? store.get('interro-level') : 'medio';
  let practiceSeed = null;
  let cs, state, timerId;

  const storageKey = () => (practiceSeed === null ? `interro:${dateKey}:${level}` : null);
  const fmtTime = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
  const face = (p, mood = 'cute') => blob(LOOKS[p], mood).replace('<svg ', `<svg style="--blink:${(p * 1.7) % 6}s" `);
  const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function freshState() {
    return { marks: new Array(NAMES.length).fill(0), pick: -1, cleared: [], errors: 0, hints: 0, elapsed: 0, solved: false };
  }

  function save() {
    const key = storageKey();
    if (key) store.set(key, state);
  }

  function start() {
    const seed = practiceSeed ?? hashString(`interro:${dateKey}:${level}`);
    cs = generate(level, seed);
    const saved = storageKey() && store.get(storageKey());
    state = saved && saved.marks ? saved : freshState();
    render();
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (state.solved || document.hidden) return;
      state.elapsed++;
      $('timer').textContent = fmtTime(state.elapsed);
      if (state.elapsed % 5 === 0) save();
    }, 1000);
    renderRecords();
    if (state.solved) showWin();
  }

  // Los nombres dentro de una declaración se convierten en fichas de color.
  function richText(text) {
    return NAMES.reduce((html, name, p) =>
      html.split(name).join(`<span class="chip" style="--c:${LOOKS[p].body}">${face(p)}${name}</span>`), text);
  }

  function moodOf(p) {
    if (state.solved) return p === cs.guilty ? 'evil' : cs.liars[p] ? 'sly' : 'cute';
    return state.marks[p] === LIE ? 'sly' : 'cute';
  }

  function render() {
    const fecha = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    $('meta').textContent = practiceSeed === null ? `Interrogatorio ${caseNumber}, ${fecha}` : 'Interrogatorio de práctica';
    $('timer').textContent = fmtTime(state.elapsed);

    $('sizes').innerHTML = Object.entries(LEVELS)
      .map(([key, cfg]) => `<button type="button" data-level="${key}" aria-pressed="${key === level}">${cfg.label}<small>${cfg.liars.length === 1 ? pl(cfg.liars[0], 'mentiroso', 'mentirosos') : 'de 1 a 3 mentirosos'}</small></button>`)
      .join('');

    $('brief').innerHTML = `${blob(VICTIM_LOOK)}<span>Alguien envenenó el té del <strong>Conde Grafito</strong>. ${cs.brief}</span>`;

    $('suspects').innerHTML = cs.statements.map((s, p) => {
      const mark = state.solved ? (cs.liars[p] ? LIE : TRUE) : state.marks[p];
      const cls = ['witness'];
      if (mark === LIE) cls.push('lie');
      if (mark === TRUE) cls.push('truth');
      if (state.pick === p && !state.solved) cls.push('picked');
      if (state.solved && p === cs.guilty) cls.push('guilty');
      const cleared = state.cleared.includes(p);
      return `<li class="${cls.join(' ')}" data-p="${p}">
        <button class="who" type="button" data-pick aria-pressed="${state.pick === p}" aria-label="Señalar a ${NAMES[p]}"${state.solved ? ' disabled' : ''}>
          ${face(p, moodOf(p))}<span class="num">${p + 1}</span>
        </button>
        <div class="say">
          <p class="name">${NAMES[p]}${cleared ? '<span class="stamp">Tiene coartada</span>' : ''}</p>
          <p class="bubble">${richText(s.text)}</p>
          <div class="verdict" role="group" aria-label="¿${NAMES[p]} dice la verdad?">
            <button type="button" data-mark="${TRUE}" aria-pressed="${mark === TRUE}"${state.solved ? ' disabled' : ''}>Dice la verdad</button>
            <button type="button" data-mark="${LIE}" aria-pressed="${mark === LIE}"${state.solved ? ' disabled' : ''}>Miente</button>
          </div>
        </div>
      </li>`;
    }).join('');

    renderTally();
    renderStatus();

    const accuse = $('accuse');
    accuse.disabled = state.solved || state.pick < 0;
    accuse.textContent = state.solved ? 'Caso cerrado' : state.pick < 0 ? 'Acusar' : `Acusar a ${NAMES[state.pick]}`;
    $('hint').disabled = state.solved;
  }

  function renderTally() {
    const liars = state.marks.filter((m) => m === LIE).length;
    const honest = state.marks.filter((m) => m === TRUE).length;
    const allowed = LEVELS[level].liars;
    const max = Math.max(...allowed);
    const goal = allowed.length === 1 ? `${allowed[0]}` : `entre ${allowed[0]} y ${max}`;
    const items = [
      `<li>Mentirosos marcados: <strong>${liars}</strong> (hay ${goal})</li>`,
      `<li>Sinceros marcados: <strong>${honest}</strong></li>`,
      `<li>Señalado: <strong>${state.pick < 0 ? 'nadie todavía' : NAMES[state.pick]}</strong></li>`,
    ];
    if (!state.solved && liars > max) items.push('<li class="warn">Has marcado más mentirosos de los que puede haber.</li>');
    else if (!state.solved && NAMES.length - honest < allowed[0]) items.push('<li class="warn">Si todos esos dicen la verdad, no queda nadie para mentir.</li>');
    else if (!state.solved && state.pick >= 0 && state.marks[state.pick] === TRUE) items.push(`<li class="warn">Has marcado a ${NAMES[state.pick]} como sincero, pero el culpable siempre miente.</li>`);
    $('tally').innerHTML = items.join('');
  }

  function renderStatus() {
    let msg;
    if (state.solved) msg = `Caso cerrado: fue ${NAMES[cs.guilty]}.`;
    else if (state.pick >= 0) msg = `Has señalado a ${NAMES[state.pick]}. Si lo tienes claro, acúsalo.`;
    else if (state.marks.some(Boolean)) msg = 'Cuando sepas quién fue, tócalo para señalarlo.';
    else msg = 'Elige a alguien y pregúntate qué pasaría si mintiera.';
    $('status').textContent = msg;
  }

  function accuse() {
    if (state.solved || state.pick < 0) return;
    const p = state.pick;
    if (p === cs.guilty) {
      state.solved = true;
      save();
      render();
      showWin();
      return;
    }
    state.errors++;
    if (!state.cleared.includes(p)) state.cleared.push(p);
    state.pick = -1;
    save();
    render();
    const list = $('suspects');
    list.classList.remove('shake');
    void list.offsetWidth;
    list.classList.add('shake');
    toast(`${NAMES[p]} tiene coartada. Sigue interrogando.`);
  }

  function hint() {
    if (state.solved) return;
    const p = state.marks.findIndex((m, q) => m !== (cs.liars[q] ? LIE : TRUE));
    if (p < 0) return toast('Todas tus marcas están bien. Ahora, ¿quién fue?');
    state.marks[p] = cs.liars[p] ? LIE : TRUE;
    state.hints++;
    save();
    render();
    document.querySelector(`[data-p="${p}"]`).classList.add('flash');
    toast(`Pista: ${NAMES[p]} ${cs.liars[p] ? 'miente' : 'dice la verdad'}.`);
  }

  function showWin() {
    const g = cs.guilty;
    const quote = (p) => `«${cs.statements[p].text}»`;
    const others = cs.liars.map((l, p) => (l && p !== g ? p : -1)).filter((p) => p >= 0);
    let text = `Mintió al decir ${quote(g)}`;
    if (others.length === 0) text += ' Los demás decían la verdad.';
    else text += ` También ${others.length === 1 ? 'mentía' : 'mentían'} ${others.map((p) => `${NAMES[p]} ${quote(p)}`).join(' y ')}`;
    $('reveal').innerHTML = blob(LOOKS[g], 'evil');
    $('win-title').textContent = `Fue ${NAMES[g]}.`;
    $('win-text').textContent = text;
    $('win-stats').textContent = `Tiempo ${fmtTime(state.elapsed)}, ${pl(state.hints, 'pista', 'pistas')}, ${pl(state.errors, 'fallo', 'fallos')}`;
    const dialog = $('win');
    if (!dialog.open) dialog.showModal();
    if (practiceSeed === null && !state.recorded) {
      Records.offer(dialog, { game: 'interro', level, ...state }, (at) => {
        state.recorded = true;
        save();
        renderRecords(at);
      });
    }
  }

  function renderRecords(highlight) {
    Records.renderBoard($('records'), 'interro', level, LEVELS[level].label, highlight);
  }

  function shareText() {
    const title = practiceSeed === null ? `¿Quién fue? Interrogatorio ${caseNumber}` : '¿Quién fue? Interrogatorio (práctica)';
    const row = NAMES.map((_, p) => (p === cs.guilty ? '🔪' : cs.liars[p] ? '🤥' : EMOJI[p])).join('');
    return `🔍 ${title}, ${cs.label.toLowerCase()}\n⏱️ ${fmtTime(state.elapsed)}  💡 ${state.hints}  ❌ ${state.errors}\n${row}`;
  }

  async function share() {
    const text = shareText();
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast('Resultado copiado.');
      }
    } catch { /* compartir cancelado */ }
  }

  let toastId;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastId);
    toastId = setTimeout(() => el.classList.remove('show'), 2200);
  }

  $('suspects').addEventListener('click', (e) => {
    const row = e.target.closest('[data-p]');
    if (!row || state.solved) return;
    const p = Number(row.dataset.p);
    const markBtn = e.target.closest('[data-mark]');
    if (markBtn) {
      const m = Number(markBtn.dataset.mark);
      state.marks[p] = state.marks[p] === m ? 0 : m;
    } else if (e.target.closest('[data-pick]')) {
      state.pick = state.pick === p ? -1 : p;
    } else return;
    save();
    render();
  });

  $('sizes').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-level]');
    if (!btn) return;
    save();
    level = btn.dataset.level;
    store.set('interro-level', level);
    start();
  });

  $('reset').addEventListener('click', () => {
    if (state.solved) return;
    state.marks = state.marks.map(() => 0);
    state.pick = -1;
    save();
    render();
  });

  $('hint').addEventListener('click', hint);
  $('accuse').addEventListener('click', accuse);
  $('share').addEventListener('click', share);
  $('close-win').addEventListener('click', () => $('win').close());
  $('practice').addEventListener('click', () => {
    save();
    practiceSeed = Math.floor(Math.random() * 2 ** 31);
    start();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  start();
})();

(function () {
  'use strict';

  const { generate, hashString, isObstacle, SIZES } = window.CaseGen;
  const { LOOKS, VICTIM_LOOK, blob, object } = window.Art;
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

  let size = SIZES[store.get('size')] ? store.get('size') : 5;
  let practiceSeed = null;
  let pz, state, selected = null, mode = 'place', timerId, justPlaced = -1;

  const storageKey = () => (practiceSeed === null ? `caso:${dateKey}:${size}` : null);
  const lookOf = (p) => (p === pz.victim ? VICTIM_LOOK : LOOKS[p]);
  const face = (p, mood = 'cute') => {
    const svg = blob(lookOf(p), mood);
    return svg.replace('<svg ', `<svg style="--blink:${(p * 1.7) % 6}s" `);
  };
  const fmtTime = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

  function freshState() {
    return { placed: new Array(pz.N).fill(-1), marks: [], struck: [], errors: 0, hints: 0, elapsed: 0, solved: false };
  }

  function save() {
    const key = storageKey();
    if (key) store.set(key, state);
  }

  function start() {
    const seed = practiceSeed ?? hashString(`${dateKey}:${size}`);
    pz = generate(size, seed);
    const saved = storageKey() && store.get(storageKey());
    state = saved && saved.placed && saved.placed.length === pz.N ? saved : freshState();
    selected = nextUnplaced(-1);
    mode = 'place';
    render();
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (state.solved || document.hidden) return;
      state.elapsed++;
      $('timer').textContent = fmtTime(state.elapsed);
      if (state.elapsed % 5 === 0) save();
    }, 1000);
    if (state.solved) showWin();
  }

  function nextUnplaced(from) {
    for (let k = 1; k <= pz.N; k++) {
      const p = (from + k) % pz.N;
      if (state.placed[p] < 0) return p;
    }
    return null;
  }

  function chip(p) {
    return `<span class="chip" style="--c:${lookOf(p).body}">${face(p)}${pz.people[p].name}</span>`;
  }

  // Convierte nombres de personas y habitaciones de una pista en fichas visuales.
  function richClue(text) {
    let html = text;
    const marks = [];
    pz.people.forEach((person, p) => {
      html = html.split(person.name).join(`\u0000${marks.push(chip(p)) - 1}\u0000`);
    });
    pz.rooms.forEach((room) => {
      const noun = room.the.split(' ').pop();
      html = html.replace(new RegExp(`(?<!\\p{L})${noun}(?!\\p{L})`, 'gu'),
        () => `\u0000${marks.push(`<span class="room-chip floor-${room.palette}">${noun}</span>`) - 1}\u0000`);
    });
    return html.replace(/\u0000(\d+)\u0000/g, (_, k) => marks[k]);
  }

  function render() {
    const { N, room, objects, rooms, people } = pz;
    const fecha = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    $('meta').textContent = practiceSeed === null ? `Caso ${caseNumber}, ${fecha}` : 'Caso de práctica';
    $('timer').textContent = fmtTime(state.elapsed);

    $('sizes').innerHTML = Object.entries(SIZES)
      .map(([n, cfg]) => `<button type="button" data-size="${n}" aria-pressed="${Number(n) === size}">${cfg.label}<small>${n}×${n}</small></button>`)
      .join('');

    $('brief').innerHTML = `${blob(VICTIM_LOOK)}<span>Alguien acabó con el <strong>${people[pz.victim].name}</strong>. ` +
      'El culpable es quien estuvo a solas con él en la misma habitación.</span>';

    const rowCount = new Array(N).fill(0), colCount = new Array(N).fill(0);
    state.placed.forEach((i) => {
      if (i < 0) return;
      rowCount[Math.floor(i / N)]++;
      colCount[i % N]++;
    });

    // La etiqueta de cada habitación va en su primera casilla libre, para que nada la tape.
    const tagCell = rooms.map((_, k) => {
      const cells = [...Array(N * N).keys()].filter((i) => room[i] === k);
      return cells.find((i) => !objects[i] && !state.placed.includes(i)) ?? cells.find((i) => !objects[i]) ?? cells[0];
    });

    let html = '';
    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N), c = i % N;
      const p = state.placed.indexOf(i);
      const cls = ['cell', `floor-${rooms[room[i]].palette}`];
      if (r > 0 && room[i - N] !== room[i]) cls.push('wt');
      if (c > 0 && room[i - 1] !== room[i]) cls.push('wl');
      if (c === N - 1) cls.push('er');
      if (r === N - 1) cls.push('eb');
      if (isObstacle(objects[i])) cls.push('obstacle');
      if (objects[i] === 'silla' && p >= 0) cls.push('on-chair');
      if (p >= 0 && (rowCount[r] > 1 || colCount[c] > 1)) cls.push('conflict');
      if (p >= 0 && p === selected) cls.push('selected');
      if (i === justPlaced) cls.push('pop');

      let inner = '';
      if (tagCell[room[i]] === i) inner += `<span class="room-tag">${rooms[room[i]].name}</span>`;
      if (objects[i]) inner += object(objects[i]);
      if (p >= 0) inner += face(p, p === selected ? 'sly' : 'cute');
      else if (!objects[i] && state.marks.includes(i)) inner += '<span class="mark">✕</span>';

      const what = p >= 0 ? `, ${people[p].name}` : objects[i] ? `, ${objects[i]}` : '';
      html += `<button type="button" class="${cls.join(' ')}" data-cell="${i}" aria-label="Fila ${r + 1}, columna ${c + 1}, ${rooms[room[i]].name}${what}">${inner}</button>`;
    }
    const board = $('board');
    board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    board.innerHTML = html;
    justPlaced = -1;

    $('tray').innerHTML = people
      .map((person, p) => {
        const placed = state.placed[p] >= 0;
        const mood = p === selected ? 'sly' : 'cute';
        return `<button type="button" class="slot${placed ? ' placed' : ''}" data-person="${p}" aria-pressed="${selected === p}" ` +
          `aria-label="${person.name}${placed ? ', en el tablero' : ''}"><span class="pad">${face(p, mood)}</span><span class="name">${person.name}</span></button>`;
      })
      .join('');

    renderStatus();

    $('mode').setAttribute('aria-pressed', String(mode === 'mark'));
    $('clues').innerHTML = pz.clues
      .map((text, k) => `<li data-clue="${k}" class="${state.struck.includes(k) ? 'struck' : ''}"><span class="text">${richClue(text)}</span></li>`)
      .join('');

    $('accuse').disabled = state.solved || state.placed.some((i) => i < 0);
    $('hint').disabled = state.solved;
  }

  function renderStatus() {
    let html;
    if (state.solved) html = 'Caso cerrado. Vuelve mañana para el siguiente.';
    else if (mode === 'mark') html = 'Toca casillas vacías para tacharlas. Vuelve a tocar el botón para seguir colocando.';
    else if (selected === null) {
      html = state.placed.every((i) => i >= 0)
        ? 'Todos están en su sitio. Si cuadra con las pistas, acusa.'
        : 'Elige un personaje y luego una casilla. También puedes arrastrarlo.';
    } else if (state.placed[selected] < 0) {
      html = `¿Dónde estaba ${chip(selected)}? Toca una casilla.`;
    } else {
      html = `Toca otra casilla para mover a ${chip(selected)}.` +
        `<button type="button" class="inline-btn" id="remove">Quitar del tablero</button>`;
    }
    $('status').innerHTML = html;
  }

  // ---- Acciones ----

  function placeAt(p, i) {
    const prev = state.placed[p];
    const occupant = state.placed.indexOf(i);
    if (occupant === p) return;
    if (occupant >= 0) state.placed[occupant] = prev; // intercambian sitio (o vuelve a la bandeja)
    state.placed[p] = i;
    state.marks = state.marks.filter((m) => m !== i);
    justPlaced = i;
  }

  function removeFromBoard(p) {
    state.placed[p] = -1;
    if (selected === p) selected = null;
  }

  function tapCell(i) {
    if (state.solved) return;
    const occupant = state.placed.indexOf(i);
    if (mode === 'mark') {
      if (occupant >= 0 || pz.objects[i]) return;
      state.marks = state.marks.includes(i) ? state.marks.filter((m) => m !== i) : [...state.marks, i];
    } else if (isObstacle(pz.objects[i])) {
      return toast('Ahí hay un obstáculo: nadie puede ponerse encima.');
    } else if (selected === null) {
      if (occupant < 0) return toast('Primero elige un personaje de la bandeja.');
      selected = occupant;
    } else if (occupant === selected) {
      selected = null;
    } else {
      const fromTray = state.placed[selected] < 0;
      placeAt(selected, i);
      selected = fromTray ? nextUnplaced(selected) : null;
    }
    save();
    render();
  }

  function tapSlot(p) {
    if (state.solved) return;
    mode = 'place';
    selected = p;
    render();
  }

  function drop(p, from, i) {
    if (state.solved) return;
    if (i === null) {
      if (from === 'board') removeFromBoard(p);
    } else if (isObstacle(pz.objects[i])) {
      toast('Ahí hay un obstáculo: nadie puede ponerse encima.');
    } else {
      placeAt(p, i);
      selected = null;
    }
    save();
    render();
  }

  function accuse() {
    if (state.placed.some((i) => i < 0)) return;
    if (state.placed.every((cell, p) => cell === pz.solution[p])) {
      state.solved = true;
      selected = null;
      save();
      render();
      showWin();
    } else {
      state.errors++;
      save();
      const board = $('board');
      board.classList.remove('shake');
      void board.offsetWidth;
      board.classList.add('shake');
      toast('Algo no cuadra. Revisa las pistas.');
    }
  }

  function hint() {
    if (state.solved) return;
    const p = pz.solution.findIndex((cell, q) => state.placed[q] !== cell);
    if (p < 0) return toast('Todo está en su sitio. Ya puedes acusar.');
    const target = pz.solution[p];
    const other = state.placed.indexOf(target);
    if (other >= 0) state.placed[other] = -1;
    state.placed[p] = target;
    state.marks = state.marks.filter((m) => m !== target);
    state.hints++;
    selected = nextUnplaced(p);
    justPlaced = target;
    save();
    render();
    document.querySelector(`[data-cell="${target}"]`).classList.add('flash');
    toast(`Pista: ${pz.people[p].name} estaba aquí.`);
  }

  function showWin() {
    const m = pz.murderer;
    const where = pz.rooms[pz.room[pz.solution[pz.victim]]].the;
    $('reveal').innerHTML = blob(LOOKS[m], 'evil');
    $('win-title').textContent = `Fue ${pz.people[m].name}.`;
    $('win-text').textContent = `Estuvo a solas con el ${pz.people[pz.victim].name} en ${where}. Tan mono y tan culpable.`;
    const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    $('win-stats').textContent = `Tiempo ${fmtTime(state.elapsed)}, ${pl(state.hints, 'pista', 'pistas')}, ${pl(state.errors, 'fallo', 'fallos')}`;
    const dialog = $('win');
    if (!dialog.open) dialog.showModal();
  }

  function shareText() {
    const title = practiceSeed === null ? `¿Quién fue? Caso ${caseNumber}` : '¿Quién fue? (práctica)';
    const suspects = pz.people.slice(0, -1).map((p, k) => (k === pz.murderer ? '🔪' : p.emoji)).join('');
    return `🔍 ${title}, ${pz.size.label.toLowerCase()} ${pz.N}×${pz.N}\n` +
      `⏱️ ${fmtTime(state.elapsed)}  💡 ${state.hints}  ❌ ${state.errors}\n${suspects}`;
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

  // ---- Tocar y arrastrar ----
  // Los toques se resuelven en pointerup; si el dedo se mueve, se convierte en arrastre.

  let press = null;

  function cellAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const cell = el && el.closest('[data-cell]');
    return cell ? Number(cell.dataset.cell) : null;
  }

  function onPointerDown(e) {
    if (e.button !== 0 || state.solved) return;
    const cell = e.target.closest('[data-cell]');
    const slot = e.target.closest('[data-person]');
    if (cell) {
      const i = Number(cell.dataset.cell);
      press = { from: 'board', cell: i, p: state.placed.indexOf(i), x: e.clientX, y: e.clientY };
    } else if (slot) {
      press = { from: 'tray', p: Number(slot.dataset.person), x: e.clientX, y: e.clientY };
    }
  }

  function onPointerMove(e) {
    if (!press) return;
    if (!press.ghost) {
      if (press.p < 0 || mode === 'mark' || Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8) return;
      press.ghost = document.createElement('div');
      press.ghost.className = 'ghost';
      press.ghost.innerHTML = blob(lookOf(press.p), 'sly');
      document.body.appendChild(press.ghost);
    }
    press.ghost.style.left = `${e.clientX}px`;
    press.ghost.style.top = `${e.clientY}px`;
    const target = cellAt(e.clientX, e.clientY);
    document.querySelectorAll('.drop-target').forEach((el) => el.classList.remove('drop-target'));
    if (target !== null) document.querySelector(`[data-cell="${target}"]`).classList.add('drop-target');
  }

  function onPointerUp(e) {
    if (!press) return;
    const p = press;
    press = null;
    if (p.ghost) {
      p.ghost.remove();
      drop(p.p, p.from, cellAt(e.clientX, e.clientY));
    } else if (p.from === 'board') {
      tapCell(p.cell);
    } else {
      tapSlot(p.p);
    }
  }

  function onPointerCancel() {
    if (press && press.ghost) press.ghost.remove();
    press = null;
    document.querySelectorAll('.drop-target').forEach((el) => el.classList.remove('drop-target'));
  }

  $('board').addEventListener('pointerdown', onPointerDown);
  $('tray').addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);

  // Teclado: los clics sin puntero (detail === 0) llegan como Enter o Espacio.
  $('board').addEventListener('click', (e) => {
    const cell = e.target.closest('[data-cell]');
    if (cell && e.detail === 0) tapCell(Number(cell.dataset.cell));
  });
  $('tray').addEventListener('click', (e) => {
    const slot = e.target.closest('[data-person]');
    if (slot && e.detail === 0) tapSlot(Number(slot.dataset.person));
  });

  $('status').addEventListener('click', (e) => {
    if (!e.target.closest('#remove') || selected === null) return;
    removeFromBoard(selected);
    save();
    render();
  });

  $('sizes').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-size]');
    if (!btn) return;
    save();
    size = Number(btn.dataset.size);
    store.set('size', size);
    start();
  });

  $('clues').addEventListener('click', (e) => {
    const li = e.target.closest('[data-clue]');
    if (!li) return;
    const k = Number(li.dataset.clue);
    state.struck = state.struck.includes(k) ? state.struck.filter((x) => x !== k) : [...state.struck, k];
    save();
    render();
  });

  $('mode').addEventListener('click', () => {
    mode = mode === 'place' ? 'mark' : 'place';
    if (mode === 'mark') selected = null;
    render();
  });

  $('reset').addEventListener('click', () => {
    const { elapsed, errors, hints } = state;
    state = { ...freshState(), elapsed, errors, hints };
    selected = nextUnplaced(-1);
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

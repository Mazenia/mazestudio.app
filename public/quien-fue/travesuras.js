(function () {
  'use strict';

  const { generate, clueState, blocks, LEVELS } = window.Travesuras;
  const { LOOKS, blob, object } = window.Art;
  const $ = (id) => document.getElementById(id);

  const store = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
    },
  };

  let pz, state, selected = null, justPlaced = -1;
  let help = store.get('trav:help') ?? true;
  let stars = store.get('trav:stars') || 0;

  const face = (p, mood = 'cute') => blob(LOOKS[p], mood).replace('<svg ', `<svg style="--blink:${(p * 1.7) % 6}s" `);
  const newSeed = () => Math.floor(Math.random() * 2 ** 31);

  // ---- Voz ----

  function say(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('es'));
    const voice = voices.find((v) => v.lang === navigator.language) || voices[0];
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'es-ES';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ---- Partida ----

  function start(N, seed) {
    pz = generate(N, seed);
    state = { N, seed, placed: new Array(N).fill(-1), hints: 0, solved: false };
    selected = 0;
    save();
    render();
  }

  function save() {
    store.set('trav:game', state);
  }

  function nextUnplaced(from) {
    for (let k = 1; k <= pz.N; k++) {
      const p = (from + k) % pz.N;
      if (state.placed[p] < 0) return p;
    }
    return null;
  }

  // ---- Dibujo ----

  function roomChip(k) {
    const r = pz.rooms[k];
    return `<span class="kroom floor-${r.palette}">${r.icon} ${r.name}</span>`;
  }

  // Cada pista se dibuja como una frase con dibujos: quien, la relación y con qué.
  function picture(c) {
    const who = `<span class="kb">${face(c.p)}</span>`;
    const other = c.q !== undefined ? `<span class="kb">${face(c.q)}</span>` : '';
    const sign = (s, label) => `<span class="krel" aria-hidden="true" title="${label}">${s}</span>`;
    switch (c.kind) {
      case 'in': return who + sign('➜', 'está en') + roomChip(c.room);
      case 'notin': return who + sign('🚫', 'no está en') + roomChip(c.room);
      case 'chair': return who + sign('➜', 'en') + `<span class="kthing">${object('silla')}</span>`;
      case 'near': return who + sign('👉', 'al lado de') + `<span class="kthing">${object(c.thing)}</span>`;
      case 'same': return who + sign('🤝', 'misma habitación') + other;
      case 'diff': return who + sign('🙅', 'habitaciones distintas') + other;
      case 'left': return who + sign('⬅️', 'más a la izquierda que') + other;
      case 'above': return who + sign('⬆️', 'más arriba que') + other;
      default: return '';
    }
  }

  function render() {
    const { N, room, objects, rooms, blobs } = pz;
    $('stars').textContent = `⭐ ${stars}`;

    $('sizes').innerHTML = Object.entries(LEVELS)
      .map(([n, cfg]) => `<button type="button" data-size="${n}" aria-pressed="${Number(n) === N}">${cfg.label}<small>${n}×${n}</small></button>`)
      .join('');

    $('brief').innerHTML = `${object('pastel')}<span>¡Alguien se comió el pastel! Fue quien estaba en la misma habitación que el pastel.</span>`;

    const rowOf = (i) => Math.floor(i / N), colOf = (i) => i % N;
    const rowCount = new Array(N).fill(0), colCount = new Array(N).fill(0);
    state.placed.forEach((i) => {
      if (i < 0) return;
      rowCount[rowOf(i)]++;
      colCount[colOf(i)]++;
    });
    // Filas y columnas que ya tiene otro blob: se oscurecen mientras eliges dónde poner al tuyo.
    const takenRows = new Set(), takenCols = new Set();
    if (selected !== null && !state.solved) {
      state.placed.forEach((i, p) => {
        if (i < 0 || p === selected) return;
        takenRows.add(rowOf(i));
        takenCols.add(colOf(i));
      });
    }

    const tagCell = rooms.map((_, k) => {
      const cells = [...Array(N * N).keys()].filter((i) => room[i] === k);
      return cells.find((i) => !objects[i] && !state.placed.includes(i)) ?? cells.find((i) => !objects[i]) ?? cells[0];
    });

    let html = '';
    for (let i = 0; i < N * N; i++) {
      const r = rowOf(i), c = colOf(i);
      const p = state.placed.indexOf(i);
      const cls = ['cell', `floor-${rooms[room[i]].palette}`];
      if (r > 0 && room[i - N] !== room[i]) cls.push('wt');
      if (c > 0 && room[i - 1] !== room[i]) cls.push('wl');
      if (c === N - 1) cls.push('er');
      if (r === N - 1) cls.push('eb');
      if (blocks(objects[i])) cls.push('obstacle');
      if (p >= 0) cls.push('occupied');
      if (objects[i] === 'silla' && p >= 0) cls.push('on-chair');
      if (p >= 0 && (rowCount[r] > 1 || colCount[c] > 1)) cls.push('conflict');
      if (p >= 0 && p === selected) cls.push('selected');
      if (p < 0 && !blocks(objects[i]) && (takenRows.has(r) || takenCols.has(c))) cls.push('blocked');
      if (i === justPlaced) cls.push('pop');

      let inner = '';
      if (tagCell[room[i]] === i) inner += `<span class="room-tag">${rooms[room[i]].icon} ${rooms[room[i]].name}</span>`;
      if (objects[i]) inner += object(objects[i]);
      if (p >= 0) inner += face(p, state.solved && p === pz.culprit ? 'messy' : 'cute');

      const what = p >= 0 ? `, ${blobs[p].name}` : objects[i] ? `, ${objects[i]}` : '';
      html += `<button type="button" class="${cls.join(' ')}" data-cell="${i}" aria-label="Fila ${r + 1}, columna ${c + 1}, ${rooms[room[i]].name}${what}">${inner}</button>`;
    }
    const board = $('board');
    board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    board.innerHTML = html;
    justPlaced = -1;

    $('tray').innerHTML = blobs
      .map((b, p) => {
        const placed = state.placed[p] >= 0;
        return `<button type="button" class="slot${placed ? ' placed' : ''}" data-person="${p}" aria-pressed="${selected === p}" ` +
          `aria-label="${b.name}${placed ? ', en el tablero' : ''}"><span class="pad">${face(p)}</span><span class="name">${b.name}</span></button>`;
      })
      .join('');

    renderStatus();

    const full = state.placed.every((i) => i >= 0);
    $('clues').innerHTML = pz.clues
      .map((c, k) => {
        const ok = clueState(c, state.placed);
        const show = (help || full) && ok !== null;
        const mark = show ? (ok ? '<span class="kmark ok" aria-label="se cumple">✓</span>' : '<span class="kmark bad" aria-label="no se cumple">!</span>') : '';
        return `<li><button type="button" class="kclue${show && !ok ? ' wrong' : ''}" data-clue="${k}">` +
          `<span class="kpic">${picture(c)}</span><span class="ktext">${c.text}</span>${mark}</button></li>`;
      })
      .join('');

    $('help').setAttribute('aria-pressed', String(help));
    $('hint').disabled = state.solved;
  }

  function renderStatus() {
    const name = (p) => `<strong>${pz.blobs[p].name}</strong>`;
    let html;
    if (state.solved) html = `¡Misterio resuelto! Fue ${name(pz.culprit)}.`;
    else if (selected === null) {
      html = state.placed.every((i) => i >= 0)
        ? 'Hay algo que no cuadra. Mira las pistas con «!».'
        : 'Toca un blob y luego una casilla.';
    } else if (state.placed[selected] < 0) {
      html = `¿Dónde estaba ${name(selected)}? Toca una casilla.`;
    } else {
      html = `Toca otra casilla para mover a ${name(selected)}.` +
        '<button type="button" class="inline-btn" id="remove">Quitar</button>';
    }
    $('status').innerHTML = html;
  }

  // ---- Acciones ----

  function placeAt(p, i) {
    const prev = state.placed[p];
    const occupant = state.placed.indexOf(i);
    if (occupant === p) return;
    if (occupant >= 0) state.placed[occupant] = prev;
    state.placed[p] = i;
    justPlaced = i;
  }

  function tellObstacle(i) {
    const what = { pastel: 'el pastel', planta: 'la planta', reloj: 'el reloj' }[pz.objects[i]];
    toast(`No se puede subir a ${what}.`);
  }

  function afterMove() {
    if (state.placed.every((cell, p) => cell === pz.solution[p])) {
      state.solved = true;
      selected = null;
      stars++;
      store.set('trav:stars', stars);
      save();
      render();
      setTimeout(showWin, 650);
      return;
    }
    save();
    render();
    if (state.placed.every((i) => i >= 0)) {
      const board = $('board');
      board.classList.remove('shake');
      void board.offsetWidth;
      board.classList.add('shake');
      toast('¡Casi! Hay una pista que no se cumple.');
    }
  }

  function tapCell(i) {
    if (state.solved) return;
    const occupant = state.placed.indexOf(i);
    if (blocks(pz.objects[i])) return tellObstacle(i);
    if (selected === null) {
      if (occupant < 0) return toast('Primero toca un blob de abajo.');
      selected = occupant;
      return render();
    }
    if (occupant === selected) {
      selected = null;
      return render();
    }
    const fromTray = state.placed[selected] < 0;
    placeAt(selected, i);
    selected = fromTray ? nextUnplaced(selected) : null;
    afterMove();
  }

  function tapSlot(p) {
    if (state.solved) return;
    selected = p;
    render();
    say(pz.blobs[p].name);
  }

  function drop(p, from, i) {
    if (state.solved) return;
    if (i === null) {
      if (from === 'board') state.placed[p] = -1;
      selected = null;
      save();
      return render();
    }
    if (blocks(pz.objects[i])) {
      tellObstacle(i);
      return render();
    }
    placeAt(p, i);
    selected = null;
    afterMove();
  }

  function hint() {
    if (state.solved) return;
    const p = pz.solution.findIndex((cell, q) => state.placed[q] !== cell);
    const target = pz.solution[p];
    const other = state.placed.indexOf(target);
    if (other >= 0) state.placed[other] = -1;
    state.placed[p] = target;
    state.hints++;
    selected = nextUnplaced(p);
    justPlaced = target;
    toast(`${pz.blobs[p].name} estaba aquí.`);
    afterMove();
    const cell = document.querySelector(`[data-cell="${target}"]`);
    if (cell) cell.classList.add('flash');
  }

  function showWin() {
    const c = pz.culprit;
    const where = pz.rooms[pz.cakeRoom].the;
    $('reveal').innerHTML = face(c, 'messy');
    $('win-title').textContent = `¡Fue ${pz.blobs[c].name}!`;
    $('win-text').textContent = `Era quien estaba en ${where} con el pastel. ¡Todavía tiene crema en la cabeza!`;
    const dialog = $('win');
    if (!dialog.open) dialog.showModal();
    say(`¡Fue ${pz.blobs[c].name}! Todavía tiene crema en la cabeza.`);
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
      if (press.p < 0 || Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8) return;
      press.ghost = document.createElement('div');
      press.ghost.className = 'ghost';
      press.ghost.innerHTML = blob(LOOKS[press.p]);
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
    state.placed[selected] = -1;
    save();
    render();
  });

  $('sizes').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-size]');
    if (btn) start(Number(btn.dataset.size), newSeed());
  });

  $('clues').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-clue]');
    if (!btn) return;
    say(pz.clues[Number(btn.dataset.clue)].text);
    document.querySelectorAll('.kclue.speaking').forEach((el) => el.classList.remove('speaking'));
    btn.classList.add('speaking');
  });

  $('brief').addEventListener('click', () => say($('brief').textContent));

  $('help').addEventListener('click', () => {
    help = !help;
    store.set('trav:help', help);
    render();
  });

  $('reset').addEventListener('click', () => {
    if (state.solved) return start(state.N, state.seed);
    state.placed = new Array(pz.N).fill(-1);
    selected = 0;
    save();
    render();
  });

  $('hint').addEventListener('click', hint);
  $('next').addEventListener('click', () => {
    start(state.N, newSeed());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('again').addEventListener('click', () => {
    $('win').close();
    start(state.N, newSeed());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('close-win').addEventListener('click', () => $('win').close());

  // Retomar la partida guardada, o empezar una pequeña.
  const saved = store.get('trav:game');
  if (saved && LEVELS[saved.N] && Array.isArray(saved.placed)) {
    pz = generate(saved.N, saved.seed);
    state = saved;
    selected = state.solved ? null : nextUnplaced(-1);
    render();
  } else {
    start(3, newSeed());
  }
})();

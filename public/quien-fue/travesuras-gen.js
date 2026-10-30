// Generador de misterios para peques: alguien se comió el pastel. Fue el único blob
// que estaba en la misma habitación que el pastel. Las pistas bastan para colocarlos.
(function (root) {
  'use strict';

  const BLOBS = [{ name: 'Rubí' }, { name: 'Ámbar' }, { name: 'Jade' }, { name: 'Zafiro' }];

  const ROOMS = [
    { name: 'Cocina', the: 'la cocina', icon: '🍳', palette: 0 },
    { name: 'Salón', the: 'el salón', icon: '🛋️', palette: 1 },
    { name: 'Dormitorio', the: 'el dormitorio', icon: '🛏️', palette: 2 },
    { name: 'Jardín', the: 'el jardín', icon: '🌳', palette: 3 },
    { name: 'Baño', the: 'el baño', icon: '🛁', palette: 5 },
  ];

  // Cosas en las que nadie se puede poner. La silla sí se puede ocupar.
  const THINGS = { pastel: 'del pastel', planta: 'de la planta', reloj: 'del reloj' };

  const BASIC = ['in', 'near', 'chair', 'same'];
  const LEVELS = {
    3: { label: 'Pequeño', rooms: 3, things: ['planta'], chairs: 1, maxClues: 4, kinds: BASIC },
    4: { label: 'Grande', rooms: 4, things: ['planta', 'reloj'], chairs: 2, maxClues: 6, kinds: [...BASIC, 'notin', 'diff', 'left', 'above'] },
  };

  const WEIGHTS = { in: 2, near: 2.5, chair: 2, same: 1.5, notin: 0.8, diff: 0.8, left: 1, above: 1 };

  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function weightedShuffle(items, rnd) {
    return items
      .map((item) => ({ item, key: Math.pow(rnd(), 1 / WEIGHTS[item.kind]) }))
      .sort((a, b) => b.key - a.key)
      .map((x) => x.item);
  }

  function neighbors(i, N) {
    const r = Math.floor(i / N), c = i % N, out = [];
    if (r > 0) out.push(i - N);
    if (r < N - 1) out.push(i + N);
    if (c > 0) out.push(i - 1);
    if (c < N - 1) out.push(i + 1);
    return out;
  }

  const blocks = (obj) => obj !== null && obj !== 'silla';

  function makeRooms(N, K, rnd) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const room = new Array(N * N).fill(-1);
      const size = new Array(K).fill(0);
      shuffle([...Array(N * N).keys()], rnd).slice(0, K).forEach((cell, k) => {
        room[cell] = k;
        size[k] = 1;
      });
      for (let left = N * N - K; left > 0; left--) {
        const options = [];
        for (let i = 0; i < N * N; i++) {
          if (room[i] !== -1) continue;
          for (const j of neighbors(i, N)) if (room[j] !== -1) options.push([i, room[j]]);
        }
        const minSize = Math.min(...options.map(([, k]) => size[k]));
        const pool = rnd() < 0.7 ? options.filter(([, k]) => size[k] === minSize) : options;
        const [i, k] = pool[Math.floor(rnd() * pool.length)];
        room[i] = k;
        size[k]++;
      }
      if (size.every((s) => s >= 2)) return room;
    }
    return null;
  }

  // Quién comparte habitación con el pastel; vale solo si es exactamente uno.
  function culpritOf(room, objects, pos) {
    const cakeRoom = room[objects.indexOf('pastel')];
    const inside = pos.map((c, p) => (room[c] === cakeRoom ? p : -1)).filter((p) => p >= 0);
    return inside.length === 1 ? inside[0] : -1;
  }

  function placeBlobs(N, room, objects, rnd) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const cells = shuffle([...Array(N).keys()], rnd).map((c, r) => r * N + c);
      if (cells.some((i) => blocks(objects[i]))) continue;
      const pos = shuffle(cells, rnd);
      if (culpritOf(room, objects, pos) >= 0) return pos;
    }
    return null;
  }

  function candidateClues(pz, kinds) {
    const { N, room, objects, rooms, blobs, solution: pos } = pz;
    const R = (i) => Math.floor(i / N), C = (i) => i % N;
    const want = new Set(kinds);
    const out = [];
    const add = (clue) => want.has(clue.kind) && out.push(clue);
    const chairs = objects.filter((o) => o === 'silla').length;

    for (let p = 0; p < blobs.length; p++) {
      const who = blobs[p].name, cell = pos[p], rm = room[cell];
      add({ kind: 'in', p, room: rm, text: `${who} estaba en ${rooms[rm].the}.`, cellOk: (i) => room[i] === rm });
      rooms.forEach((r, k) => {
        if (k !== rm) add({ kind: 'notin', p, room: k, text: `${who} no estaba en ${r.the}.`, cellOk: (i) => room[i] !== k });
      });
      if (objects[cell] === 'silla') {
        add({ kind: 'chair', p, text: `${who} estaba en ${chairs > 1 ? 'una' : 'la'} silla.`, cellOk: (i) => objects[i] === 'silla' });
      }
      for (const thing of new Set(neighbors(cell, N).map((j) => objects[j]).filter(blocks))) {
        add({
          kind: 'near', p, thing, text: `${who} estaba al lado ${THINGS[thing]}.`,
          cellOk: (i) => neighbors(i, N).some((j) => objects[j] === thing),
        });
      }
    }

    for (let p = 0; p < blobs.length; p++) {
      for (let q = p + 1; q < blobs.length; q++) {
        const a = blobs[p].name, b = blobs[q].name;
        if (room[pos[p]] === room[pos[q]]) {
          add({ kind: 'same', p, q, text: `${a} y ${b} estaban en la misma habitación.`, pairOk: (x, y) => room[x] === room[y] });
        } else {
          add({ kind: 'diff', p, q, text: `${a} y ${b} estaban en habitaciones distintas.`, pairOk: (x, y) => room[x] !== room[y] });
        }
        const [l, r] = C(pos[p]) < C(pos[q]) ? [p, q] : [q, p];
        add({ kind: 'left', p: l, q: r, text: `${blobs[l].name} estaba más a la izquierda que ${blobs[r].name}.`, pairOk: (x, y) => C(x) < C(y) });
        const [u, d] = R(pos[p]) < R(pos[q]) ? [p, q] : [q, p];
        add({ kind: 'above', p: u, q: d, text: `${blobs[u].name} estaba más arriba que ${blobs[d].name}.`, pairOk: (x, y) => R(x) < R(y) });
      }
    }
    return out;
  }

  // Backtracking: un blob por fila y columna, fuera de obstáculos, cumpliendo las pistas.
  function countSolutions(pz, clues, limit = 2) {
    const { N, objects } = pz;
    const domains = [];
    for (let p = 0; p < N; p++) {
      const unary = clues.filter((c) => c.p === p && c.cellOk);
      domains[p] = [...Array(N * N).keys()].filter((i) => !blocks(objects[i]) && unary.every((c) => c.cellOk(i)));
      if (domains[p].length === 0) return 0;
    }
    const pairs = clues.filter((c) => c.pairOk);
    const order = [...Array(N).keys()].sort((a, b) => domains[a].length - domains[b].length);
    const at = new Array(N).fill(-1);
    const rowUsed = new Array(N).fill(false), colUsed = new Array(N).fill(false);
    let count = 0;

    function go(k) {
      if (k === N) {
        count++;
        return;
      }
      const p = order[k];
      for (const i of domains[p]) {
        const r = Math.floor(i / N), c = i % N;
        if (rowUsed[r] || colUsed[c]) continue;
        at[p] = i;
        rowUsed[r] = colUsed[c] = true;
        if (pairs.every((cl) => at[cl.p] < 0 || at[cl.q] < 0 || cl.pairOk(at[cl.p], at[cl.q]))) go(k + 1);
        rowUsed[r] = colUsed[c] = false;
        at[p] = -1;
        if (count >= limit) return;
      }
    }

    go(0);
    return count;
  }

  // ¿Se cumple la pista con lo que hay colocado? null si aún faltan sus blobs.
  function clueState(clue, placed) {
    const a = placed[clue.p];
    if (clue.cellOk) return a < 0 ? null : clue.cellOk(a);
    const b = placed[clue.q];
    return a < 0 || b < 0 ? null : clue.pairOk(a, b);
  }

  function generate(N, seed) {
    const cfg = LEVELS[N];
    const rnd = mulberry32(seed);
    for (let attempt = 0; attempt < 200; attempt++) {
      const room = makeRooms(N, cfg.rooms, rnd);
      if (!room) continue;
      const objects = new Array(N * N).fill(null);
      const cells = shuffle([...Array(N * N).keys()], rnd);
      ['pastel', ...cfg.things, ...Array(cfg.chairs).fill('silla')].forEach((kind, k) => (objects[cells[k]] = kind));
      const solution = placeBlobs(N, room, objects, rnd);
      if (!solution) continue;

      const rooms = shuffle(ROOMS, rnd).slice(0, cfg.rooms);
      const pz = { N, level: cfg, room, objects, rooms, blobs: BLOBS.slice(0, N), solution };

      const chosen = [];
      let unique = false;
      for (const clue of weightedShuffle(candidateClues(pz, cfg.kinds), rnd)) {
        chosen.push(clue);
        if (countSolutions(pz, chosen) === 1) {
          unique = true;
          break;
        }
      }
      if (!unique) continue;
      for (let i = chosen.length - 1; i >= 0; i--) {
        const without = chosen.filter((_, j) => j !== i);
        if (countSolutions(pz, without) === 1) chosen.splice(i, 1);
      }
      if (chosen.length > cfg.maxClues) continue;

      pz.clues = shuffle(chosen, rnd);
      pz.culprit = culpritOf(room, objects, solution);
      pz.cakeRoom = room[objects.indexOf('pastel')];
      return pz;
    }
    throw new Error(`No se pudo generar un misterio de ${N}×${N} con la semilla ${seed}`);
  }

  const api = { generate, countSolutions, clueState, blocks, LEVELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Travesuras = api;
})(typeof window !== 'undefined' ? window : globalThis);

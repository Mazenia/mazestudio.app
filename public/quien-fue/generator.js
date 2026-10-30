// Generador de casos: reparte habitaciones, objetos y personas en una cuadrícula N×N
// y elige pistas hasta que el caso tenga una única solución.
(function (root) {
  'use strict';

  const PEOPLE = [
    { name: 'Rubí', ref: 'Rubí', initial: 'R', color: '#d94141', emoji: '🟥' },
    { name: 'Ámbar', ref: 'Ámbar', initial: 'Á', color: '#e39a2d', emoji: '🟧' },
    { name: 'Jade', ref: 'Jade', initial: 'J', color: '#2f9e5b', emoji: '🟩' },
    { name: 'Zafiro', ref: 'Zafiro', initial: 'Z', color: '#3466c9', emoji: '🟦' },
    { name: 'Violeta', ref: 'Violeta', initial: 'V', color: '#8e4fc4', emoji: '🟪' },
  ];
  const VICTIM = { name: 'Conde Grafito', ref: 'el Conde Grafito', initial: 'G', color: '#55555e', emoji: '⬛', victim: true };

  const ROOMS = [
    { name: 'Cocina', the: 'la cocina' },
    { name: 'Salón', the: 'el salón' },
    { name: 'Biblioteca', the: 'la biblioteca' },
    { name: 'Jardín', the: 'el jardín' },
    { name: 'Comedor', the: 'el comedor' },
    { name: 'Estudio', the: 'el estudio' },
    { name: 'Bodega', the: 'la bodega' },
  ];

  // Obstáculos: nadie puede estar en ellos. Las sillas sí se pueden ocupar.
  const OBSTACLES = {
    planta: { icon: '🪴', near: 'junto a una planta' },
    estanteria: { icon: '📚', near: 'junto a una estantería' },
    reloj: { icon: '🕰️', near: 'junto a un reloj' },
  };
  const OBJECT_ICONS = { silla: '🪑', planta: '🪴', estanteria: '📚', reloj: '🕰️' };

  const SIZES = {
    4: { label: 'Fácil', rooms: 3, obstacles: 2, chairs: 2 },
    5: { label: 'Medio', rooms: 4, obstacles: 3, chairs: 3 },
    6: { label: 'Difícil', rooms: 5, obstacles: 4, chairs: 4 },
  };

  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
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
      .map((item) => ({ item, key: Math.pow(rnd(), 1 / item.weight) }))
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

  const isObstacle = (obj) => obj !== null && obj !== 'silla';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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
        // Crecer sobre todo las habitaciones pequeñas para que queden equilibradas.
        const minSize = Math.min(...options.map(([, k]) => size[k]));
        const pool = rnd() < 0.6 ? options.filter(([, k]) => size[k] === minSize) : options;
        const [i, k] = pool[Math.floor(rnd() * pool.length)];
        room[i] = k;
        size[k]++;
      }
      if (size.every((s) => s >= 2)) return room;
    }
    return null;
  }

  function placeObjects(N, cfg, rnd) {
    const objects = new Array(N * N).fill(null);
    const cells = shuffle([...Array(N * N).keys()], rnd);
    const kinds = Object.keys(OBSTACLES);
    let k = 0;
    for (let n = 0; n < cfg.obstacles; n++) objects[cells[k++]] = kinds[Math.floor(rnd() * kinds.length)];
    for (let n = 0; n < cfg.chairs; n++) objects[cells[k++]] = 'silla';
    return objects;
  }

  // La víctima es siempre la última persona; el asesino es quien comparte habitación con ella.
  function murdererOf(room, pos) {
    const victim = pos.length - 1;
    const others = [];
    for (let p = 0; p < victim; p++) if (room[pos[p]] === room[pos[victim]]) others.push(p);
    return others.length === 1 ? others[0] : -1;
  }

  function placePeople(N, room, objects, rnd) {
    for (let attempt = 0; attempt < 500; attempt++) {
      const cells = shuffle([...Array(N).keys()], rnd).map((c, r) => r * N + c);
      if (cells.some((i) => isObstacle(objects[i]))) continue;
      const pos = new Array(N);
      shuffle([...Array(N).keys()], rnd).forEach((p, r) => (pos[p] = cells[r]));
      if (murdererOf(room, pos) >= 0) return pos;
    }
    return null;
  }

  // Todas las pistas verdaderas para la solución. Cada pista es unaria (cellOk),
  // de pareja (pairOk) o global (globalOk, se evalúa con todos colocados).
  function candidateClues(pz) {
    const { N, room, objects, people, rooms, solution: pos } = pz;
    const R = (i) => Math.floor(i / N), C = (i) => i % N;
    const out = [];
    const add = (clue) => out.push(clue);

    for (let p = 0; p < people.length; p++) {
      const who = people[p].ref, cell = pos[p], rm = room[cell];
      add({ p, weight: 2, text: `${cap(who)} estaba en ${rooms[rm].the}.`, cellOk: (i) => room[i] === rm });
      rooms.forEach((r, k) => {
        if (k !== rm) add({ p, weight: 0.8, text: `${cap(who)} no estaba en ${r.the}.`, cellOk: (i) => room[i] !== k });
      });
      const row = R(cell), col = C(cell);
      add({ p, weight: 0.5, text: `${cap(who)} estaba en la fila ${row + 1}.`, cellOk: (i) => R(i) === row });
      add({ p, weight: 0.5, text: `${cap(who)} estaba en la columna ${col + 1}.`, cellOk: (i) => C(i) === col });
      if (objects[cell] === 'silla') {
        add({ p, weight: 2, text: `${cap(who)} estaba en una silla.`, cellOk: (i) => objects[i] === 'silla' });
      } else {
        add({ p, weight: 0.7, text: `${cap(who)} no estaba en ninguna silla.`, cellOk: (i) => objects[i] !== 'silla' });
      }
      const nearby = new Set(neighbors(cell, N).map((j) => objects[j]).filter(isObstacle));
      for (const kind of nearby) {
        add({
          p, weight: 2.5, text: `${cap(who)} estaba ${OBSTACLES[kind].near}.`,
          cellOk: (i) => neighbors(i, N).some((j) => objects[j] === kind),
        });
      }
      if (pos.every((c, q) => q === p || room[c] !== rm)) {
        add({
          p, weight: 1.5, text: `${cap(who)} no compartió habitación con nadie.`,
          globalOk: (at) => at.every((c, q) => q === p || room[c] !== room[at[p]]),
        });
      }
    }

    for (let p = 0; p < people.length; p++) {
      for (let q = p + 1; q < people.length; q++) {
        const a = people[p].ref, b = people[q].ref;
        if (room[pos[p]] === room[pos[q]]) {
          add({ p, q, weight: 2, text: `${cap(a)} y ${b} estuvieron en la misma habitación.`, pairOk: (x, y) => room[x] === room[y] });
        } else {
          add({ p, q, weight: 1, text: `${cap(a)} y ${b} no estuvieron en la misma habitación.`, pairOk: (x, y) => room[x] !== room[y] });
        }
        const [l, r] = C(pos[p]) < C(pos[q]) ? [p, q] : [q, p];
        add({ p: l, q: r, weight: 1.2, text: `${cap(people[l].ref)} estaba más a la izquierda que ${people[r].ref}.`, pairOk: (x, y) => C(x) < C(y) });
        const [u, d] = R(pos[p]) < R(pos[q]) ? [p, q] : [q, p];
        add({ p: u, q: d, weight: 1.2, text: `${cap(people[u].ref)} estaba más arriba que ${people[d].ref}.`, pairOk: (x, y) => R(x) < R(y) });
      }
    }
    return out;
  }

  // Cuenta soluciones (hasta `limit`) con backtracking: una persona por fila y columna,
  // fuera de obstáculos, cumpliendo las pistas y la regla de la víctima.
  function countSolutions(pz, clues, limit = 2) {
    const { N, room, objects } = pz;
    const P = N;
    const domains = [];
    for (let p = 0; p < P; p++) {
      const unary = clues.filter((c) => c.p === p && c.cellOk);
      domains[p] = [];
      for (let i = 0; i < N * N; i++) {
        if (!isObstacle(objects[i]) && unary.every((c) => c.cellOk(i))) domains[p].push(i);
      }
      if (domains[p].length === 0) return 0;
    }
    const pairsOf = [...Array(P)].map(() => []);
    for (const c of clues) {
      if (!c.pairOk) continue;
      pairsOf[c.p].push(c);
      pairsOf[c.q].push(c);
    }
    const globals = clues.filter((c) => c.globalOk);
    const order = [...Array(P).keys()].sort((a, b) => domains[a].length - domains[b].length);
    const at = new Array(P).fill(-1);
    const rowUsed = new Array(N).fill(false), colUsed = new Array(N).fill(false);
    let count = 0;

    function consistent(p) {
      for (const c of pairsOf[p]) {
        if (at[c.p] >= 0 && at[c.q] >= 0 && !c.pairOk(at[c.p], at[c.q])) return false;
      }
      return true;
    }

    function go(k) {
      if (k === P) {
        if (murdererOf(room, at) >= 0 && globals.every((c) => c.globalOk(at))) count++;
        return;
      }
      const p = order[k];
      for (const i of domains[p]) {
        const r = Math.floor(i / N), c = i % N;
        if (rowUsed[r] || colUsed[c]) continue;
        at[p] = i;
        rowUsed[r] = colUsed[c] = true;
        if (consistent(p)) go(k + 1);
        rowUsed[r] = colUsed[c] = false;
        at[p] = -1;
        if (count >= limit) return;
      }
    }

    go(0);
    return count;
  }

  function satisfies(pz, clues, pos) {
    return clues.every((c) => {
      if (c.cellOk) return c.cellOk(pos[c.p]);
      if (c.pairOk) return c.pairOk(pos[c.p], pos[c.q]);
      return c.globalOk(pos);
    }) && murdererOf(pz.room, pos) >= 0;
  }

  function generate(N, seed) {
    const cfg = SIZES[N];
    const rnd = mulberry32(seed);
    for (let attempt = 0; attempt < 100; attempt++) {
      const room = makeRooms(N, cfg.rooms, rnd);
      if (!room) continue;
      const objects = placeObjects(N, cfg, rnd);
      const solution = placePeople(N, room, objects, rnd);
      if (!solution) continue;

      const rooms = shuffle([...ROOMS.keys()], rnd).slice(0, cfg.rooms).map((i) => ({ ...ROOMS[i], palette: i }));
      const people = [...PEOPLE.slice(0, N - 1), VICTIM];
      const pz = { N, size: cfg, room, objects, rooms, people, solution, victim: N - 1 };

      const chosen = [];
      let unique = false;
      for (const clue of weightedShuffle(candidateClues(pz), rnd)) {
        chosen.push(clue);
        if (countSolutions(pz, chosen) === 1) {
          unique = true;
          break;
        }
      }
      if (!unique) continue;
      // Quitar las pistas que sobran sin perder la unicidad.
      for (let i = chosen.length - 1; i >= 0; i--) {
        const without = chosen.filter((_, j) => j !== i);
        if (countSolutions(pz, without) === 1) chosen.splice(i, 1);
      }

      pz.clueSet = shuffle(chosen, rnd);
      pz.clues = pz.clueSet.map((c) => c.text);
      pz.murderer = murdererOf(room, solution);
      return pz;
    }
    throw new Error(`No se pudo generar un caso de ${N}×${N} con la semilla ${seed}`);
  }

  const api = { generate, countSolutions, satisfies, hashString, isObstacle, SIZES, OBJECT_ICONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CaseGen = api;
})(typeof window !== 'undefined' ? window : globalThis);

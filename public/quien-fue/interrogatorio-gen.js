// Generador del interrogatorio: cinco sospechosos con número del 1 al 5, una
// declaración cada uno. El culpable siempre miente; según el nivel, alguien más
// puede mentir también. Se eligen declaraciones hasta que solo haya una forma
// de que todo cuadre: un culpable y un grupo de mentirosos.
(function (root) {
  'use strict';

  const NAMES = ['Rubí', 'Ámbar', 'Jade', 'Zafiro', 'Violeta'];
  const EMOJI = ['🟥', '🟧', '🟩', '🟦', '🟪'];
  const N = NAMES.length;

  // liars: cuántos mentirosos puede haber en total, contando al culpable.
  const LEVELS = {
    facil: { label: 'Fácil', liars: [1], brief: 'Solo miente el culpable. Los demás dicen la verdad.' },
    medio: { label: 'Medio', liars: [2], brief: 'Mienten dos: el culpable y alguien que lo encubre.' },
    dificil: { label: 'Difícil', liars: [1, 2, 3], brief: 'El culpable miente. Puede que alguien más mienta, pero nunca más de tres en total.' },
  };

  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Todas las situaciones posibles: { g: culpable, L: mentirosos (máscara de bits) }.
  function worlds(allowed) {
    const out = [];
    for (let g = 0; g < N; g++) {
      for (let L = 0; L < 1 << N; L++) {
        if (!(L & (1 << g))) continue;
        let n = 0;
        for (let k = 0; k < N; k++) if (L & (1 << k)) n++;
        if (allowed.includes(n)) out.push({ g, L, n });
      }
    }
    return out;
  }

  const lies = (w, p) => (w.L & (1 << p)) !== 0;

  // Cada tipo de declaración: cómo se lee y cuándo es cierta.
  const KINDS = {
    fue: { w: 0.3, text: (s) => `Fue ${NAMES[s.x]}.`, test: (w, s) => w.g === s.x },
    inocente: { w: 1, text: (s) => `${NAMES[s.x]} es inocente.`, test: (w, s) => w.g !== s.x },
    yoNo: { w: 0.5, text: () => 'Yo no fui.', test: (w, s) => w.g !== s.by },
    fueUno: { w: 1, text: (s) => `Fue ${NAMES[s.x]} o ${NAMES[s.y]}.`, test: (w, s) => w.g === s.x || w.g === s.y },
    miente: { w: 1.2, text: (s) => `${NAMES[s.x]} miente.`, test: (w, s) => lies(w, s.x) },
    verdad: { w: 1, text: (s) => `${NAMES[s.x]} dice la verdad.`, test: (w, s) => !lies(w, s.x) },
    unoMiente: { w: 1.2, text: (s) => `De ${NAMES[s.x]} y ${NAMES[s.y]}, solo uno miente.`, test: (w, s) => lies(w, s.x) !== lies(w, s.y) },
    mayor: { w: 0.8, text: () => 'El culpable lleva un número más alto que el mío.', test: (w, s) => w.g > s.by },
    menor: { w: 0.8, text: () => 'El culpable lleva un número más bajo que el mío.', test: (w, s) => w.g < s.by },
    pegado: { w: 0.8, text: () => 'El número del culpable va justo antes o justo después del mío.', test: (w, s) => Math.abs(w.g - s.by) === 1 },
    par: { w: 0.6, text: () => 'El culpable lleva un número par.', test: (w) => (w.g + 1) % 2 === 0 },
    vecino: { w: 1, text: () => 'Miente alguien con un número pegado al mío.', test: (w, s) => (s.by > 0 && lies(w, s.by - 1)) || (s.by < N - 1 && lies(w, s.by + 1)) },
    cuantos: { w: 0.9, onlyVaried: true, text: (s) => (s.n === 1 ? 'Aquí solo miente una persona.' : `Aquí mentimos ${s.n}.`), test: (w, s) => w.n === s.n },
  };

  // Todas las declaraciones que podría hacer el sospechoso `by`.
  function candidates(by, level) {
    const others = [...Array(N).keys()].filter((p) => p !== by);
    const out = [];
    for (const kind of Object.keys(KINDS)) {
      const K = KINDS[kind];
      if (K.onlyVaried && LEVELS[level].liars.length === 1) continue;
      if (['fue', 'inocente', 'miente', 'verdad'].includes(kind)) {
        for (const x of others) out.push({ kind, by, x });
      } else if (kind === 'fueUno' || kind === 'unoMiente') {
        for (const x of others) for (const y of others) if (x < y) out.push({ kind, by, x, y });
      } else if (kind === 'cuantos') {
        for (const n of LEVELS[level].liars) out.push({ kind, by, n });
      } else {
        out.push({ kind, by });
      }
    }
    return out;
  }

  const holds = (w, s) => KINDS[s.kind].test(w, s);

  // Situaciones en las que todo cuadra: los sinceros dicen verdades y los mentirosos, mentiras.
  function consistent(statements, level) {
    return worlds(LEVELS[level].liars).filter((w) =>
      statements.every((s) => holds(w, s) === !lies(w, s.by)));
  }

  function pick(list, rnd) {
    const total = list.reduce((t, s) => t + KINDS[s.kind].w, 0);
    let r = rnd() * total;
    for (const s of list) if ((r -= KINDS[s.kind].w) < 0) return s;
    return list[list.length - 1];
  }

  function generate(level, seed) {
    const rnd = mulberry32(seed);
    const all = worlds(LEVELS[level].liars);
    for (let attempt = 0; attempt < 400; attempt++) {
      const truth = all[Math.floor(rnd() * all.length)];
      // Para cada uno, las frases que encajan con su papel y que no son siempre
      // ciertas o siempre falsas (esas delatarían al que habla sin pensar).
      const options = [...Array(N).keys()].map((by) => candidates(by, level).filter((s) => {
        if (holds(truth, s) === lies(truth, by)) return false;
        const vals = new Set(all.map((w) => holds(w, s)));
        return vals.size === 2;
      }));
      for (let tries = 0; tries < 60; tries++) {
        const statements = options.map((o) => pick(o, rnd));
        const sols = consistent(statements, level);
        if (sols.length !== 1) continue;
        // Que todas las declaraciones hagan falta: sin cualquiera de ellas habría dudas.
        const spare = statements.some((_, k) => {
          const rest = statements.filter((__, j) => j !== k);
          return consistent(rest, level).length === 1;
        });
        if (spare && tries < 50) continue;
        return {
          level,
          label: LEVELS[level].label,
          brief: LEVELS[level].brief,
          guilty: truth.g,
          liars: [...Array(N).keys()].map((p) => lies(truth, p)),
          statements: statements.map((s) => ({ ...s, text: KINDS[s.kind].text(s) })),
        };
      }
    }
    throw new Error(`No se pudo generar un interrogatorio ${level} con la semilla ${seed}`);
  }

  const api = { generate, consistent, LEVELS, NAMES, EMOJI };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Interro = api;
})(typeof window !== 'undefined' ? window : globalThis);

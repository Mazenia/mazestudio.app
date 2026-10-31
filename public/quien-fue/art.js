// Ilustraciones SVG: blobs (tiernos, culpables) y objetos de la casa.
(function (root) {
  'use strict';

  const INK = '#2B1C3D';

  // Aspecto de cada personaje, en el mismo orden que generator.js. El accesorio
  // y el ancho los distinguen aunque no se perciban bien los colores.
  const LOOKS = [
    { body: '#FF6B7F', dark: '#C9304D', w: 37, top: 24, extra: 'bow' },
    { body: '#FFB547', dark: '#C97700', w: 39, top: 28, extra: 'crown' },
    { body: '#4FD39A', dark: '#23915F', w: 36, top: 24, extra: 'sprout' },
    { body: '#5B9BFF', dark: '#2A55C2', w: 37, top: 24, extra: 'bowtie' },
    { body: '#B07CFF', dark: '#6E3FD0', w: 35, top: 20, extra: 'antenna' },
  ];
  const VICTIM_LOOK = { body: '#B4B0C2', dark: '#7A7690', w: 37, top: 24, extra: 'monocle', victim: true };

  const BOTTOM = 86;
  const mix = (a, b, t) => '#' + [1, 3, 5].map((i) =>
    Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');

  // Gomita: cúpula redonda con la base plana.
  function shape(look) {
    const L = 50 - look.w, R = 50 + look.w, T = look.top, B = BOTTOM;
    return `M50 ${T}C${R - 10} ${T} ${R} ${T + 22} ${R} ${B - 18}C${R} ${B - 4} ${R - 6} ${B} ${R - 16} ${B}` +
      `L${L + 16} ${B}C${L + 6} ${B} ${L} ${B - 4} ${L} ${B - 18}C${L} ${T + 22} ${L + 10} ${T} 50 ${T}Z`;
  }

  // Accesorios que asoman por detrás del cuerpo; el resto va encima.
  const BEHIND = new Set(['crown', 'sprout', 'antenna']);

  // Cada blob traza con un tono oscuro de su propio color; los objetos, con tinta.
  const lineOf = (c, w = 3) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const stroke = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

  function accessory(look) {
    const s = lineOf(look.dark), T = look.top;
    switch (look.extra) {
      case 'bow':
        return `<path d="M50 ${T + 1}L37 ${T - 9}Q32 ${T + 1} 37 ${T + 9}Z M50 ${T + 1}L63 ${T - 9}Q68 ${T + 1} 63 ${T + 9}Z" fill="${look.body}" ${s}/>` +
          `<circle cx="50" cy="${T + 1}" r="4" fill="${look.body}" ${s}/>`;
      case 'crown':
        return `<path d="M38 ${T + 4}L37 ${T - 11}L44 ${T - 4}L50 ${T - 15}L56 ${T - 4}L63 ${T - 11}L62 ${T + 4}Z" fill="#FFD84A" ${s}/>`;
      case 'sprout':
        return `<path d="M50 ${T + 1}Q49 ${T - 8} 53 ${T - 14}" fill="none" ${s}/>` +
          `<path d="M53 ${T - 13}Q60 ${T - 22} 68 ${T - 17}Q62 ${T - 8} 53 ${T - 13}Z" fill="#8BE36A" ${s}/>`;
      case 'bowtie':
        return `<path d="M50 80.5L42 76L42 85Z M50 80.5L58 76L58 85Z" fill="#FFD84A" ${s}/>` +
          `<circle cx="50" cy="80.5" r="2.6" fill="#FFD84A" ${s}/>`;
      case 'antenna':
        return `<path d="M50 ${T + 1}Q52 ${T - 10} 61 ${T - 13}" fill="none" ${s}/>` +
          `<circle cx="63" cy="${T - 14}" r="4.5" fill="${look.body}" ${s}/><circle cx="61.8" cy="${T - 15.5}" r="1.4" fill="#fff"/>`;
      default:
        return '';
    }
  }

  // Ojos según el estado: 'cute' (por defecto, bizcos), 'sly' (elegido), 'evil'
  // (revelación) o 'messy' (el que se comió el pastel: ojos felices).
  function eyes(look, mood, grad) {
    const line = look.dark, s = lineOf(line, 2.6);
    if (mood === 'messy') {
      return `<g class="eyes"><path d="M29 60Q38 48 47 60" fill="none" ${lineOf(line, 4)}/>` +
        `<path d="M53 60Q62 48 71 60" fill="none" ${lineOf(line, 4)}/></g>`;
    }
    if (look.victim) {
      const x = (cx) => `<path d="M${cx - 4.5} 53.5L${cx + 4.5} 62.5M${cx + 4.5} 53.5L${cx - 4.5} 62.5" ${lineOf(line, 2.8)}/>`;
      return `<g><ellipse cx="38" cy="58" rx="9.5" ry="11.5" fill="#fff" ${s}/>${x(38)}` +
        `<ellipse cx="62" cy="58" rx="9.5" ry="11.5" fill="#fff" ${s}/>${x(62)}</g>`;
    }
    const one = (cx, side) => {
      const o = side === 'l' ? -1 : 1;
      let e = `<ellipse cx="${cx}" cy="58" rx="9.5" ry="11.5" fill="#fff" ${s}/>`;
      if (mood === 'cute') {
        // Pupilas hacia la nariz y un solo punto de luz.
        e += `<circle cx="${cx - o * 3.2}" cy="59.5" r="5.6" fill="${INK}"/><circle cx="${cx - o * 3.2 - 1.8}" cy="57.4" r="1.9" fill="#fff"/>`;
      } else if (mood === 'sly') {
        e += `<circle cx="${cx + 3}" cy="60" r="5.2" fill="${INK}"/><circle cx="${cx + 1.4}" cy="58.2" r="1.7" fill="#fff"/>`;
      } else {
        e += `<circle cx="${cx}" cy="60" r="4.2" fill="#E23D5A"/><circle cx="${cx - 1.4}" cy="58.6" r="1.4" fill="#fff"/>`;
      }
      if (mood !== 'cute') {
        // Párpado caído, inclinado hacia el centro: la mirada de quien esconde algo.
        const outer = cx + o * 11, inner = cx - o * 11, lo = mood === 'evil' ? 57 : 55, hi = mood === 'evil' ? 51 : 50;
        e += `<path class="lid" d="M${outer} 44L${inner} 44L${inner} ${lo}L${outer} ${hi}Z" fill="url(#${grad})"/>` +
          `<path class="lid" d="M${outer} ${hi}L${inner} ${lo}" ${lineOf(line, 2.8)}/>`;
      }
      return e;
    };
    return `<g class="eyes">${one(38, 'l')}${one(62, 'r')}</g>`;
  }

  function mouth(look, mood) {
    const s = lineOf(look.dark, 2.6);
    if (look.victim) {
      return `<path d="M41 75Q45.5 72 50 75Q54.5 72 59 75Q54.5 78 50 76Q45.5 78 41 75Z" fill="${look.dark}"/>`;
    }
    if (mood === 'evil') {
      return `<path d="M42 73Q50 80 58 72" fill="none" ${s}/><path d="M45.5 74.8L47.5 78.2L49.5 76.3Z" fill="#fff" ${lineOf(look.dark, 1.6)}/>`;
    }
    if (mood === 'messy') {
      // Se relame: sonrisa abierta, lengua asomando y migas.
      return `<path d="M41 70Q50 82 59 70Z" fill="#7A2E3A" ${s}/>` +
        `<path d="M53 74Q60 73 61 78Q60 83 55 81.5Q52 79 53 74Z" fill="#FF7FA8" ${lineOf(look.dark, 2)}/>` +
        `<circle cx="40" cy="91" r="2" fill="#C98A5B"/><circle cx="58" cy="93" r="1.6" fill="#C98A5B"/><circle cx="68" cy="90" r="1.5" fill="#C98A5B"/>`;
    }
    if (mood === 'sly') return `<path d="M44 74Q51 77 57 71.5" fill="none" ${s}/>`;
    return `<path d="M46.5 72.5Q50 75.5 53.5 72.5" fill="none" ${s}/>`;
  }

  // Crema del pastel con su cereza, encima de la cabeza del que se lo comió.
  const CREAM = `<g transform="translate(0 7)"><path d="M30 30Q28 18 40 19Q44 9 54 13Q64 9 68 19Q78 20 72 31Q66 36 60 31Q55 37 50 32Q44 37 39 32Q33 36 30 30Z" fill="#FFF7FA" ${stroke} stroke-width="3"/>` +
    `<path d="M52 13Q53 5 59 3" fill="none" ${stroke} stroke-width="2.5"/><circle cx="51" cy="12" r="6" fill="#E23D5A" ${stroke} stroke-width="3"/><circle cx="49" cy="10" r="1.6" fill="#fff"/></g>`;

  // Los degradados necesitan ids únicos porque hay muchos blobs en la misma página.
  let uid = 0;

  function blob(look, mood = 'cute', extraClass = '') {
    const id = `g${++uid}`, d = shape(look), L = 50 - look.w, R = 50 + look.w, T = look.top;
    const defs = `<defs><radialGradient id="${id}b" gradientUnits="userSpaceOnUse" cx="${L + look.w * 0.76}" cy="${T + (BOTTOM - T) * 0.3}" r="${look.w * 1.5}">` +
      `<stop offset="0" stop-color="${mix(look.body, '#ffffff', 0.35)}"/><stop offset=".55" stop-color="${look.body}"/><stop offset="1" stop-color="${mix(look.body, look.dark, 0.45)}"/></radialGradient>` +
      `<clipPath id="${id}k"><path d="${d}"/></clipPath></defs>`;
    // Sombra en el suelo, luz reflejada abajo, borde interior y brillos de caramelo.
    const body = `<ellipse cx="50" cy="89" rx="${look.w - 2}" ry="4.5" fill="${INK}" opacity=".16"/>` +
      (BEHIND.has(look.extra) ? accessory(look) : '') +
      `<path d="${d}" fill="url(#${id}b)"/>` +
      `<g clip-path="url(#${id}k)"><ellipse cx="50" cy="90" rx="${look.w - 6}" ry="9" fill="${mix(look.body, '#ffffff', 0.25)}" opacity=".55"/>` +
      `<path d="${d}" fill="none" stroke="${mix(look.body, look.dark, 0.5)}" stroke-width="7" opacity=".35"/></g>` +
      `<path d="${d}" fill="none" stroke="${look.dark}" stroke-width="3.2" stroke-linejoin="round"/>` +
      `<path d="M${L + 9} ${T + 30}Q${L + 10} ${T + 12} ${L + 24} ${T + 7}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>` +
      `<circle cx="${L + 8.5}" cy="${T + 38}" r="2.2" fill="#fff" opacity=".85"/>` +
      `<path d="M${R - 9} ${T + 14}l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1z" fill="#fff" opacity=".9"/>` +
      (look.victim ? '' : `<ellipse cx="26" cy="70" rx="5" ry="2.8" fill="#FF7FA8" opacity=".55"/><ellipse cx="74" cy="70" rx="5" ry="2.8" fill="#FF7FA8" opacity=".55"/>`);
    const victimBits = look.victim
      ? `<ellipse cx="50" cy="${T - 9}" rx="14" ry="4" fill="none" stroke="#FFD84A" stroke-width="3"/>` +
        `<circle cx="62" cy="58" r="12.5" fill="none" stroke="#C9A227" stroke-width="3"/><path d="M73.5 63Q79 72 75 81" fill="none" stroke="#C9A227" stroke-width="2"/>`
      : '';
    const knife = mood === 'evil'
      ? `<g class="knife"><path d="M89 80L104 42Q109 41 110 46L96 83Z" fill="#EEF1F6" ${stroke} stroke-width="3"/>` +
        `<path d="M84 78L100 87" ${stroke} stroke-width="10"/><path d="M84 78L100 87" stroke="#8E5A3A" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M104 50Q107 55 105 58Q102 57 104 50Z" fill="#E23D5A"/></g>`
      : '';
    return `<svg class="blob ${mood} ${extraClass}" viewBox="0 0 100 100" aria-hidden="true">` + defs + body +
      eyes(look, mood, `${id}b`) + mouth(look, mood) +
      (BEHIND.has(look.extra) ? '' : accessory(look)) +
      victimBits + knife + (mood === 'messy' ? CREAM : '') +
      '</svg>';
  }

  const OBJECTS = {
    planta:
      `<ellipse cx="50" cy="30" rx="9" ry="18" fill="#5CC98B" ${stroke}/>` +
      `<ellipse cx="34" cy="42" rx="8" ry="14" transform="rotate(-42 34 42)" fill="#5CC98B" ${stroke}/>` +
      `<ellipse cx="66" cy="42" rx="8" ry="14" transform="rotate(42 66 42)" fill="#5CC98B" ${stroke}/>` +
      `<path d="M31 62L69 62L63 91L37 91Z" fill="#FF8FA3" ${stroke}/>` +
      `<rect x="28" y="56" width="44" height="10" rx="4" fill="#FF8FA3" ${stroke}/>`,
    estanteria:
      `<rect x="17" y="9" width="66" height="84" rx="6" fill="#D9A066" ${stroke}/>` +
      `<path d="M17 37H83M17 65H83" ${stroke}/>` +
      `<rect x="24" y="15" width="8" height="22" rx="2" fill="#FF6B7F" ${stroke} stroke-width="2.5"/>` +
      `<rect x="34" y="18" width="8" height="19" rx="2" fill="#5B9BFF" ${stroke} stroke-width="2.5"/>` +
      `<rect x="45" y="20" width="12" height="17" rx="2" transform="rotate(14 51 28)" fill="#FFD84A" ${stroke} stroke-width="2.5"/>` +
      `<rect x="26" y="45" width="9" height="20" rx="2" fill="#4FD39A" ${stroke} stroke-width="2.5"/>` +
      `<rect x="37" y="43" width="8" height="22" rx="2" fill="#B07CFF" ${stroke} stroke-width="2.5"/>` +
      `<rect x="62" y="47" width="14" height="18" rx="2" fill="#FF8FA3" ${stroke} stroke-width="2.5"/>` +
      `<circle cx="66" cy="83" r="5" fill="#5CC98B" ${stroke} stroke-width="2.5"/>` +
      `<rect x="26" y="74" width="20" height="9" rx="2" fill="#FFB547" ${stroke} stroke-width="2.5"/>`,
    reloj:
      `<rect x="31" y="7" width="38" height="87" rx="12" fill="#C98A5B" ${stroke}/>` +
      `<circle cx="50" cy="29" r="12.5" fill="#FFF8E7" ${stroke}/>` +
      `<path d="M50 29V21M50 29L56 32" ${stroke} stroke-width="2.5"/>` +
      `<rect x="40" y="49" width="20" height="35" rx="9" fill="#8E5A3A" ${stroke} stroke-width="3"/>` +
      `<path d="M50 52V72" stroke="#FFD84A" stroke-width="2.5"/><circle cx="50" cy="74" r="4.5" fill="#FFD84A" ${stroke} stroke-width="2"/>`,
    pastel:
      `<ellipse cx="50" cy="85" rx="42" ry="8" fill="#fff" ${stroke}/>` +
      `<path d="M20 44L58 44Q59 51 66 50Q68 57 80 56L80 84L20 84Z" fill="#FFDFA6" ${stroke}/>` +
      `<path d="M20 72H80" stroke="#FF8FB8" stroke-width="5"/>` +
      `<path d="M20 44L58 44Q59 51 66 50Q68 57 80 56L80 62Q76 70 71 62Q66 71 59 62Q53 70 47 62Q41 71 34 62Q28 70 20 62Z" fill="#FF8FB8" ${stroke}/>` +
      `<path d="M38 37Q40 26 47 24" fill="none" ${stroke} stroke-width="2.5"/><circle cx="37" cy="38" r="7" fill="#E23D5A" ${stroke}/>` +
      `<circle cx="34.5" cy="35.5" r="1.8" fill="#fff"/><circle cx="74" cy="48" r="2" fill="#C98A5B"/><circle cx="83" cy="52" r="1.6" fill="#C98A5B"/>`,
    silla:
      `<rect x="29" y="22" width="42" height="40" rx="10" fill="#FFC86B" ${stroke}/>` +
      `<path d="M31 70V92M69 70V92" ${stroke} stroke-width="5"/>` +
      `<rect x="22" y="58" width="56" height="14" rx="6" fill="#FFC86B" ${stroke}/>`,
  };

  function object(kind) {
    return `<svg class="thing ${kind}" viewBox="0 0 100 100" aria-hidden="true">${OBJECTS[kind]}</svg>`;
  }

  // Parpadeo: de vez en cuando un blob al azar parpadea. Va con un temporizador y no
  // con una animación CSS infinita, que repintaba el tablero en cada fotograma.
  const calm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
  function blinkSomeone() {
    if (!document.hidden && !(calm && calm.matches)) {
      const all = document.querySelectorAll('svg.blob.cute:not(.blinking)');
      if (all.length) {
        const b = all[Math.floor(Math.random() * all.length)];
        b.classList.add('blinking');
        setTimeout(() => b.classList.remove('blinking'), 250);
      }
    }
    setTimeout(blinkSomeone, 700 + Math.random() * 1300);
  }
  setTimeout(blinkSomeone, 1500);

  root.Art = { LOOKS, VICTIM_LOOK, blob, object };
})(window);

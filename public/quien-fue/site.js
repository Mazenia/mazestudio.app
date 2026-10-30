// Cabecera compartida: llena la rueda de reconocimiento con los cinco sospechosos.
// Al tocar uno, pone cara de culpable un momento.
(function () {
  'use strict';

  const el = document.getElementById('lineup');
  if (!el || !window.Art) return;
  const { LOOKS, blob } = window.Art;
  const face = (k, mood) => blob(LOOKS[k], mood).replace('<svg ', `<svg style="--blink:${(k * 1.3) % 6}s" `);

  el.innerHTML = '<span class="ruler"><span>0,5</span><span>1,0</span><span>1,5</span></span>' +
    LOOKS.map((_, k) => `<div class="suspect" data-k="${k}">${face(k, 'cute')}<span class="plate">${k + 1}</span></div>`).join('');

  el.addEventListener('click', (e) => {
    const s = e.target.closest('.suspect');
    if (!s) return;
    const k = Number(s.dataset.k);
    s.querySelector('svg').outerHTML = face(k, 'sly');
    clearTimeout(s._t);
    s._t = setTimeout(() => (s.querySelector('svg').outerHTML = face(k, 'cute')), 1200);
  });
})();

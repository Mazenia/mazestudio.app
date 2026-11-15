// Compartir sin destripar el caso: título, tiempo, racha y el enlace al juego de hoy.
(function (root) {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Días seguidos (hasta hoy) con al menos un caso resuelto del juego, en cualquier nivel.
  function streak(game) {
    const solvedDays = new Set();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(game + ':')) continue;
        const v = JSON.parse(localStorage.getItem(k));
        if (v && v.solved) solvedDays.add(k.split(':')[1]);
      }
    } catch { return 0; }
    const d = new Date();
    let n = 0;
    while (solvedDays.has(keyOf(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // Enlace limpio a la página actual (sin ?práctica ni #), para que quien lo reciba juegue el de hoy.
  function link() {
    const u = new URL(location.href);
    u.search = ''; u.hash = '';
    return u.href.replace(/index\.html$/, '');
  }

  function text({ title, line, game }) {
    const n = streak(game);
    return [
      `🔍 ${title}`,
      line,
      n >= 2 ? `🔥 Racha: ${n} días` : null,
      `¿Lo resuelves tú? 👉 ${link()}`,
    ].filter(Boolean).join('\n');
  }

  async function share(msg, toast) {
    try {
      if (navigator.share) await navigator.share({ text: msg });
      else {
        await navigator.clipboard.writeText(msg);
        toast('Resultado copiado.');
      }
    } catch { /* compartir cancelado */ }
  }

  root.QFShare = { streak, text, share };
})(window);

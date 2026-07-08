/* ============================================================
   Luno — Real 3D moon (assets/3d/moon.glb)
   Renders the real GLB via <model-viewer>. Two flavours:
     • BIG   — page-hero + footer showcase moons: drag-to-spin,
               auto-rotating, camera-controls enabled.
     • MINI  — the logo "O" moons (header + mobile menu + loader):
               auto-rotating only, pointer-events off so clicks
               still reach the logo link and the CSS orbit/roll
               animations keep driving the element.
   The painted CSS moon stays as the instant placeholder and fades
   out once the model is ready. On any failure we drop back to it.
   ============================================================ */
(function () {
  var BIG = '.page-hero .moon, .footer__moon .moon';
  var MINI = '.logo__o .moon--o'; // header + mobile-menu logos + loader moon
  var MODEL = 'assets/3d/moon.glb';
  var CDN = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function upgrade(el, mini) {
    if (el.dataset.moon3d) return;
    el.dataset.moon3d = '1';
    var mv = document.createElement('model-viewer');
    mv.setAttribute('src', MODEL);
    mv.setAttribute('alt', 'Rotating 3D moon');
    if (!reduce) {
      mv.setAttribute('auto-rotate', '');
      mv.setAttribute('auto-rotate-delay', '0');
      mv.setAttribute('rotation-per-second', '9deg');
    }
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('shadow-intensity', '0');
    mv.setAttribute('exposure', '1.05');
    mv.setAttribute('camera-orbit', '0deg 78deg 92%');
    // Big showcase moons are draggable; mini logo moons stay hands-off.
    if (!mini) {
      mv.setAttribute('camera-controls', '');
      mv.setAttribute('disable-zoom', '');
      mv.setAttribute('disable-pan', '');
    } else {
      mv.setAttribute('interpolation-decay', '200');
    }
    mv.addEventListener('load', function () { el.classList.add('moon--3d-ready'); });
    // On model failure fall back to the painted CSS moon.
    mv.addEventListener('error', function () {
      el.classList.remove('moon--3d', 'moon--3d-mini', 'moon--3d-ready');
      mv.remove();
    });
    el.appendChild(mv);
  }

  function boot() {
    var big = Array.prototype.slice.call(document.querySelectorAll(BIG));
    var mini = Array.prototype.slice.call(document.querySelectorAll(MINI));
    if (!big.length && !mini.length) return;
    // Tag immediately so fx.js leaves these to model-viewer's own controls.
    big.forEach(function (el) { el.classList.add('moon--3d'); });
    mini.forEach(function (el) { el.classList.add('moon--3d', 'moon--3d-mini'); });
    var s = document.createElement('script');
    s.type = 'module';
    s.src = CDN;
    s.onload = function () {
      big.forEach(function (el) { upgrade(el, false); });
      mini.forEach(function (el) { upgrade(el, true); });
    };
    // If the library can't load, restore the CSS moons entirely.
    s.onerror = function () {
      big.concat(mini).forEach(function (el) { el.classList.remove('moon--3d', 'moon--3d-mini'); });
    };
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

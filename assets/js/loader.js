/* ============================================================
   Luno — Loading screen
   Fills #luno-loader with the LUN + moon mark, plays the
   assemble animation, then removes the overlay. Loads first so
   the white cover is shown before the rest of the page scripts.
   ============================================================ */
(function () {
  var el = document.getElementById('luno-loader');
  if (!el) return;

  el.innerHTML =
    '<div class="loader__logo">' +
      '<span class="loader__lun">LUN</span>' +
      '<span class="moon loader__moon" aria-hidden="true"></span>' +
    '</div>';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD = reduce ? 500 : 2300; // let the assemble animation finish, then a short beat

  // Lock scroll while the loader is up.
  document.documentElement.style.overflow = 'hidden';

  function remove() {
    document.documentElement.style.overflow = '';
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  function done() {
    el.classList.add('is-done');
    // Let page FX (scroll reveals etc.) know the curtain is lifting.
    try { window.dispatchEvent(new CustomEvent('luno:loader-done')); } catch (e) {}
    setTimeout(remove, 600);
  }

  function startLoader() {
    if (el.classList.contains('fonts-loaded')) return;
    el.classList.add('fonts-loaded');
    setTimeout(done, HOLD);
  }

  // Fallback timeout to ensure loader proceeds even on very slow connections
  var fontTimeout = setTimeout(startLoader, 800);

  if (document.fonts && document.fonts.load) {
    document.fonts.load('600 1em Fraunces').then(function () {
      clearTimeout(fontTimeout);
      startLoader();
    }).catch(function () {
      clearTimeout(fontTimeout);
      startLoader();
    });
  } else {
    clearTimeout(fontTimeout);
    startLoader();
  }
})();
